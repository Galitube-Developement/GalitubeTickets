const { Listener } = require('@eartharoid/dbf');
const ms = require('ms');
const sync = require('../../lib/sync');
const checkForUpdates = require('../../lib/updates');
const {
	sendToHouston,
} = require('../../lib/stats');
const handleStaleTickets = require('../../lib/stale');
const createPresenceUpdater = require('../../lib/presence');

module.exports = class extends Listener {
	constructor(client, options) {
		super(client, {
			...options,
			emitter: client,
			event: 'ready',
			once: true,
		});
	}

	async run() {
		/** @type {import("client")} */
		const client = this.client;

		// process.title = `"[Galitube Tickets] ${client.user.tag}"`; // too long and gets cut off
		process.title = 'tickets';
		client.log.success('Connected to Discord as "%s" over %d shards', client.user.tag, client.ws.shards.size);

		await client.initAfterLogin();

		// fill cache
		await sync(client);

		if (process.env.PUBLISH_COMMANDS === 'true') {
			client.log.info('Automatically publishing commands...');
			client.commands.publish()
				.then(commands => client.log.success('Published %d commands', commands?.size))
				.catch(client.log.error);
		}

		await client.application.fetch();
		if (process.env.PUBLIC_BOT === 'true' && !client.application.botPublic) {
			client.log.warn('The `PUBLIC_BOT` environment variable is set to `true`, but the bot is not public.');
		} else if (process.env.PUBLIC_BOT !== 'true' && client.application.botPublic) {
			client.log.warn('Your bot is public, but public features are disabled. Set the `PUBLIC_BOT` environment variable to `true`, or make your bot private.');
		}

		// commands are not cached automatically
		await client.application.commands.fetch();

		// presence/activity
		client.updatePresence = createPresenceUpdater(client);
		await client.updatePresence();

		// stats posting
		if (client.config.stats && process.env.STATS_ENDPOINT) {
			sendToHouston(client);
			setInterval(() => sendToHouston(client), ms('12h'));
		}

		if (client.config.updates) {
			checkForUpdates(client);
			setInterval(() => checkForUpdates(client), ms('1w'));
		}

		if (process.env.PUBLIC_BOT === 'true') {
			client.log.notice('Inactivity warnings and auto-close features are disabled');
			client.log.warn('Unset PUBLIC_BOT to re-enable stale ticket handling');
		} else {
			// send inactivity warnings and close stale tickets
			const staleInterval = ms('15m');
			setInterval(() => handleStaleTickets(client, staleInterval), staleInterval);
		}
	}
};
