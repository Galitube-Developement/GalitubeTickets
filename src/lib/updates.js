const { REPOSITORY } = require('./boot-update');
const { execFileSync } = require('node:child_process');
const path = require('node:path');

module.exports = async client => {
	try {
		const response = await fetch(`https://api.github.com/repos/${REPOSITORY}/commits/main`, {
			signal: AbortSignal.timeout(15000),
			headers: { Accept: 'application/vnd.github+json' },
		});
		if (!response.ok) throw new Error(`GitHub returned HTTP ${response.status}`);
		const latest = await response.json();
		if (!/^[a-f0-9]{40}$/.test(latest.sha)) throw new Error('Invalid GitHub commit response');
		const current = execFileSync('git', ['rev-parse', 'HEAD'], {
			cwd: path.resolve(__dirname, '../..'),
			encoding: 'utf8',
			timeout: 10000,
		}).trim();
		if (current === latest.sha) return client.log.info('Galitube Tickets is up to date');
		client.log.notice(`Galitube Tickets update available: https://github.com/${REPOSITORY}/compare/${current}...${latest.sha}. Restart the bot to install it.`);
	} catch (error) {
		client.log.warn(`Failed to check for updates: ${error.message}`);
	}
};
