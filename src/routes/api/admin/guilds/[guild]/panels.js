const {
	readPanel, panelChannel,
} = require('../../../../../lib/panels');
const {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle: {
		Primary,
		Secondary,
	},
	ChannelType: { GuildText },
	EmbedBuilder,
	StringSelectMenuBuilder,
	StringSelectMenuOptionBuilder,
} = require('discord.js');
const emoji = require('node-emoji');
const { logAdminEvent } = require('../../../../../lib/logging');

module.exports.post = fastify => ({
	schema: {
		'body':{
			'type':'object',
			'required':['type', 'categories', 'title'],
			'properties':{
				'type':{
					'type':'string',
					'enum':['BUTTON', 'MENU', 'MESSAGE'],
				},
				'categories':{
					'type':'array',
					'minItems':1,
					'maxItems':25,
					'uniqueItems':true,
					'items':{
						'type':'integer',
						'minimum':1,
					},
				},
				'channel':{
					'anyOf':[{ 'type':'null' }, {
						'type':'string',
						'pattern':'^[0-9]{17,20}$',
					}],
				},
				'message':{
					'type':'string',
					'pattern':'^[0-9]{17,20}$',
				},
				'title':{
					'type':'string',
					'minLength':1,
					'maxLength':256,
				},
				'description':{
					'type':'string',
					'maxLength':4096,
				},
				'image':{
					'type':'string',
					'maxLength':2048,
					'pattern':'^(https?://|$)',
				},
				'thumbnail':{
					'type':'string',
					'maxLength':2048,
					'pattern':'^(https?://|$)',
				},
			},
		},
	},
	handler: async (req, res) => {
		/** @type {import('client')} */
		const client = req.routeOptions.config.client;
		const guild = client.guilds.cache.get(req.params.guild);
		const data = req.body;
		const editing = req.method === 'PATCH';
		if (!['BUTTON', 'MENU', 'MESSAGE'].includes(data.type) || !Array.isArray(data.categories) ||
			!data.categories.length || data.categories.length > (data.type === 'BUTTON' ? 25 : data.type === 'MENU' ? 25 : 1) ||
			new Set(data.categories).size !== data.categories.length) {
			return res.code(400).send({ message: 'Invalid panel type or categories (maximum 25).' });
		}
		if (editing && (!data.channel || !data.message)) return res.code(400).send({ message: 'Channel and message are required for editing.' });

		const settings = await client.prisma.guild.findUnique({
			select: {
				categories: true,
				footer: true,
				locale: true,
				primaryColour: true,
			},
			where: { id: guild.id },
		});
		const getMessage = client.i18n.getLocale(settings.locale);
		const categories = data.categories.map(id => {
			const category = settings.categories.find(c => c.id === id);
			if (!category) {
				const error = new Error(`Invalid category: ${id}`);
				error.statusCode = 400;
				throw error;
			}
			return category;
		});
		if (categories.length === 0) throw new Error('No categories');
		if (categories.length !== 1 && data.type === 'MESSAGE') throw new Error('Invalid number of categories for panel type');

		/** @type {import("discord.js").TextChannel} */
		let channel;
		if (data.channel) {
			channel = await panelChannel(guild, data.channel);
		} else {
			const allow = ['ViewChannel', 'ReadMessageHistory'];
			if (data.type === 'MESSAGE') allow.push('SendMessages');
			channel = await guild.channels.create({
				name: 'create-a-ticket',
				permissionOverwrites: [
					{
						allow,
						deny: ['AddReactions', 'AttachFiles'],
						id: guild.roles.everyone,
					},
				],
				position: 1,
				rateLimitPerUser: 15,
				reason: 'New ticket panel',
				type: GuildText,
			});
		}

		let original;
		if (editing) {
			original = await channel.messages.fetch(data.message);
			if (!readPanel(original, client.user.id)) return res.code(400).send({ message: 'This message is not an editable ticket panel owned by this bot.' });
		}
		let sent;
		const send = async payload => {
			sent = original ? await original.edit(payload) : await channel.send(payload);
		};

		const embed = new EmbedBuilder()
			.setColor(settings.primaryColour);

		if (settings.footer) {
			embed.setFooter({
				iconURL: guild.iconURL(),
				text: settings.footer,
			});
		}

		if (data.title) embed.setTitle(data.title);
		if (data.description) embed.setDescription(data.description);
		if (data.image) embed.setImage(data.image);
		if (data.thumbnail) embed.setThumbnail(data.thumbnail);

		if (data.type === 'MESSAGE') {
			await send({
				embeds: [embed],
				components: [],
			});
		} else {
			const components = [];

			if (categories.length === 1 && data.type === 'BUTTON') {
				components.push(
					new ButtonBuilder()
						.setCustomId(JSON.stringify({
							action: 'create',
							target: categories[0].id,
						}))
						.setStyle(Primary)
						.setLabel(getMessage('buttons.create.text'))
						.setEmoji(getMessage('buttons.create.emoji')),
				);
			} else if (data.type === 'BUTTON') {
				components.push(
					...categories.map(category =>
						new ButtonBuilder()
							.setCustomId(JSON.stringify({
								action: 'create',
								target: category.id,
							}))
							.setStyle(Secondary)
							.setLabel(category.name)
							.setEmoji(emoji.hasEmoji(category.emoji) ? emoji.get(category.emoji) : { id: category.emoji }),
					),
				);
			} else {
				components.push(
					new StringSelectMenuBuilder()
						.setCustomId(JSON.stringify({ action: 'create' }))
						.setPlaceholder(getMessage('menus.category.placeholder'))
						.setOptions(
							categories.map(category =>
								new StringSelectMenuOptionBuilder()
									.setValue(String(category.id))
									.setLabel(category.name)
									.setDescription(category.description)
									.setEmoji(emoji.hasEmoji(category.emoji) ? emoji.get(category.emoji) : { id: category.emoji }),
							),
						),
				);

			}

			try {
				await send({
					components: Array.from({ length: Math.ceil(components.length / 5) }, (_, i) => new ActionRowBuilder().setComponents(components.slice(i * 5, i * 5 + 5))),
					embeds: [embed],
				});
			} catch (error) {
				if (!data.channel) await channel.delete('Failed to send panel');

				const human_errors = [];
				const action_row = error?.rawError?.errors?.components?.['0'];
				const buttons_or_options = {
					BUTTON: action_row?.components,
					MENU: action_row?.components?.['0']?.options,
				}[data.type];

				if (buttons_or_options) {
					for (const [k, v] of Object.entries(buttons_or_options)) {
						// const category = categories.find(category => category.id === parseInt(k));
						const category = categories[parseInt(k)]; // k is a string of the index, not ID
						// eslint-disable-next-line no-underscore-dangle
						const emoji_errors = v?.emoji?.id?._errors;
						if (emoji_errors) {
							const invalid_name = emoji_errors[0]?.message?.match(/Value "(.*)" is not snowflake/)?.[1];
							if (invalid_name) {
								const url = `${process.env.HTTP_EXTERNAL}/settings/${guild.id}/categories/${category.id}`;
								human_errors.push({
									message: `The emoji for the \`${category.name}\` category is invalid: \`${invalid_name}\`. <a href="${url}" target="_blank">Click here</a> to open the category's settings page in a new tab.`,
									type: 'invalid_emoji',
								});
							}
						}
					}
				}

				if (human_errors.length) {
					return res.code(400).send({
						code: error.code,
						errors: human_errors,
						status: error.status,
					});
				}

				throw error;
			}
		}

		logAdminEvent(client, {
			action: editing ? 'update' : 'create',
			guildId: guild.id,
			target: {
				id: channel.toString(),
				type: 'panel',
			},
			userId: req.user.id,
		}).catch(error => client.log.error(error));

		return {
			message: sent.id,
			channel: channel.id,
			url: sent.url,
		};
	},
	onRequest: [fastify.authenticate, fastify.isAdmin],
});

module.exports.patch = module.exports.post;
module.exports.get = fastify => ({
	onRequest: [fastify.authenticate, fastify.isAdmin],
	schema: {
		querystring: {
			type: 'object',
			required: ['channel'],
			properties: {
				channel: {
					type: 'string',
					pattern: '^[0-9]{17,20}$',
				},
				message: {
					type: 'string',
					pattern: '^[0-9]{17,20}$',
				},
				before: {
					type: 'string',
					pattern: '^[0-9]{17,20}$',
				},
			},
		},
	},
	handler: async (req, res) => {
		const client = req.routeOptions.config.client;
		const guild = client.guilds.cache.get(req.params.guild);
		const channel = await panelChannel(guild, req.query.channel);
		if (req.query.message) {
			const message = await channel.messages.fetch(req.query.message);
			const panel = readPanel(message, client.user.id);
			return panel || res.code(404).send({ message: 'No editable ticket panel found.' });
		}
		const messages = await channel.messages.fetch({
			limit: 100,
			...(req.query.before ? { before: req.query.before } : {}),
		});
		return {
			panels: [...messages.values()].map(message => readPanel(message, client.user.id)).filter(Boolean),
			before: messages.size === 100 ? messages.last().id : null,
		};
	},
});
