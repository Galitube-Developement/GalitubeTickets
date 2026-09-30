const fs = require('node:fs');
const path = require('node:path');
const YAML = require('yaml');

const activityTypes = new Set([0, 2, 3, 5]);
const statuses = new Set(['online', 'idle', 'dnd', 'invisible']);

function validatePresence(data) {
	if (!data || !Array.isArray(data.activities) || data.activities.length > 10) {
		throw Object.assign(new Error('Add between zero and ten activities.'), { statusCode: 400 });
	}
	const interval = Number(data.interval);
	if (!Number.isInteger(interval) || interval < 15 || interval > 3600) {
		throw Object.assign(new Error('Rotation interval must be between 15 and 3600 seconds.'), { statusCode: 400 });
	}
	if (!statuses.has(data.status)) {
		throw Object.assign(new Error('Choose a valid bot status.'), { statusCode: 400 });
	}
	const activities = data.activities.map((activity, index) => {
		const name = typeof activity?.name === 'string' ? activity.name.trim() : '';
		const type = Number(activity?.type);
		if (name.length < 1 || name.length > 128 || !activityTypes.has(type)) {
			throw Object.assign(new Error(`Activity ${index + 1} needs a name of up to 128 characters and a supported type.`), { statusCode: 400 });
		}
		return { name, type };
	});
	return { activities, interval, status: data.status };
}

function getPresence(client) {
	const presence = client.config.presence || {};
	return {
		activities: Array.isArray(presence.activities)
			? presence.activities.map(activity => ({ ...activity, type: Number(activity.type ?? 0) }))
			: [],
		interval: Number(presence.interval) || 20,
		status: statuses.has(presence.status) ? presence.status : 'online',
	};
}

function requireBotOwner(req, res) {
	const { client } = req.routeOptions.config;
	if (!client.supers.includes(req.user.id)) {
		return res.code(403).send({ message: 'Only configured bot owners can change the bot presence.' });
	}
}

module.exports.get = fastify => ({
	handler: req => getPresence(req.routeOptions.config.client),
	onRequest: [fastify.authenticate, requireBotOwner],
});

module.exports.patch = fastify => ({
	handler: async req => {
		const client = req.routeOptions.config.client;
		const presence = validatePresence(req.body);
		client.config.presence = presence;

		const configPath = path.resolve('./user/config.yml');
		const temporaryPath = `${configPath}.tmp`;
		fs.writeFileSync(temporaryPath, YAML.stringify(client.config));
		fs.renameSync(temporaryPath, configPath);

		await client.updatePresence();
		return presence;
	},
	onRequest: [fastify.authenticate, requireBotOwner],
});
