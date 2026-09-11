/* eslint-disable no-console */
const path = require('node:path');
require('dotenv').config();
try {
	const updated = require('./lib/boot-update').bootUpdate(path.resolve(__dirname, '..'));
	if (updated) {
		// Restart in a fresh process so dependencies loaded before installation cannot remain cached.
		const { spawnSync } = require('node:child_process');
		const child = spawnSync(process.execPath, [__filename, ...process.argv.slice(2)], {
			stdio: 'inherit',
			env: {
				...process.env,
				AUTO_UPDATE: 'false',
			},
		});
		if (child.error) throw child.error;
		process.exit(child.status ?? 1);
	}
	require('./bot');
} catch (error) {
	console.error('Galitube Tickets could not complete startup:', error.message);
	process.exitCode = 1;
}
