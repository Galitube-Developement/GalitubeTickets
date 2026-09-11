const { ChannelType } = require('discord.js');

function readPanel(message, botId) {
	if (message.author.id !== botId || !message.embeds.length) return null;
	const categories = [];
	let type = 'BUTTON';
	for (const row of message.components) {
		for (const component of row.components) {
			let custom;
			try {
				custom = JSON.parse(component.customId);
			} catch {
				return null;
			}
			if (custom.action !== 'create') return null;
			if (component.options) {
				type = 'MENU';
				categories.push(...component.options.map(option => Number(option.value)));
			} else {
				categories.push(Number(custom.target));
			}
		}
	}
	if (!categories.length || categories.some(id => !Number.isSafeInteger(id))) return null;
	const embed = message.embeds[0];
	return {
		message: message.id,
		channel: message.channelId,
		type,
		categories,
		title: embed.title || '',
		description: embed.description || '',
		image: embed.image?.url || '',
		thumbnail: embed.thumbnail?.url || '',
		url: message.url,
	};
}

async function panelChannel(guild, id) {
	const channel = await guild.channels.fetch(id);
	if (!channel || channel.guildId !== guild.id || channel.type !== ChannelType.GuildText) {
		const error = new Error('Select a text channel in this server.');
		error.statusCode = 400;
		throw error;
	}
	return channel;
}
module.exports = {
	readPanel,
	panelChannel,
};
