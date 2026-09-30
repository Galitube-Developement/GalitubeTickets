const { PermissionsBitField } = require("discord.js");
const ms = require("ms");
const { iconURL } = require("../../../../lib/misc");

module.exports.get = (fastify) => ({
	handler: async (req, res) => {
		const { client } = req.routeOptions.config;
		const cacheKey = `cache/oauth-guilds:${req.user.id}`;
		let guilds = await client.keyv.get(cacheKey);
		if (!Array.isArray(guilds)) {
			try {
				const response = await fetch(
					"https://discordapp.com/api/users/@me/guilds",
					{
						headers: {
							Authorization: `Bearer ${req.user.accessToken}`,
						},
						signal: AbortSignal.timeout(ms("5s")),
					},
				);
				if (!response.ok)
					throw new Error(`Discord returned HTTP ${response.status}`);
				guilds = await response.json();
				if (!Array.isArray(guilds))
					throw new Error("Discord returned an invalid server list");
				await client.keyv
					.set(cacheKey, guilds, ms("2m"))
					.catch((error) => {
						client.log.warn(
							`Could not cache the Discord server list: ${error.message}`,
						);
					});
			} catch (error) {
				client.log.warn(
					`Could not load the server list from Discord: ${error.message}`,
				);
				return res.code(502).send({
					message:
						"Discord did not return your server list. Please try again shortly.",
				});
			}
		}
		res.send(
			guilds
				.filter(
					(guild) =>
						guild.owner ||
						new PermissionsBitField(
							guild.permissions.toString(),
						).has(PermissionsBitField.Flags.ManageGuild),
				)
				.map((guild) => ({
					added: client.guilds.cache.has(guild.id),
					id: guild.id,
					logo: iconURL(
						client.guilds.cache.get(guild.id) || {
							client,
							icon: guild.icon,
							id: guild.id,
						},
					),
					name: guild.name,
				})),
		);
	},
	onRequest: [fastify.authenticate],
});
