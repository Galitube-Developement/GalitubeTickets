
const {
	execFileSync, spawnSync,
} = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const REPOSITORY = 'Galitube-Developement/GalitubeTickets';
const REPOSITORY_URL = `https://github.com/${REPOSITORY}.git`;

function run(command, args, cwd) {
	return execFileSync(command, args, {
		cwd,
		encoding: 'utf8',
		timeout: 120000,
		stdio: ['ignore', 'pipe', 'pipe'],
		env: {
			...process.env,
			GIT_TERMINAL_PROMPT: '0',
		},
	}).trim();
}
function npm(args, cwd) {
	// npm-cli.js avoids cmd.exe quoting and works on Windows and Unix.
	const candidates = [process.env.npm_execpath, path.join(path.dirname(process.execPath), 'node_modules/npm/bin/npm-cli.js'), path.join(path.dirname(process.execPath), '../lib/node_modules/npm/bin/npm-cli.js')].filter(Boolean);
	const cli = candidates.find(p => p.endsWith('npm-cli.js') && fs.existsSync(p));
	const result = cli ? spawnSync(process.execPath, [cli, ...args], {
		cwd,
		stdio: 'inherit',
		timeout: 600000,
	}) : spawnSync('npm', args, {
		cwd,
		stdio: 'inherit',
		timeout: 600000,
	});
	if (result.error || result.status !== 0) throw new Error(`npm ${args.join(' ')} failed; startup stopped.`, { cause: result.error });
}

function bootUpdate(root, options = {}) {
	const git = options.git || (args => run('git', args, root));
	const install = options.install || (() => {
		npm(['ci', '--ignore-scripts'], root);
		npm(['ci', '--include=dev', '--ignore-scripts', '--prefix', 'web'], root);
		npm(['run', 'build', '--prefix', 'web'], root);
		// Generate Prisma and apply migrations only after the application build passed.
		const result = spawnSync(process.execPath, ['scripts/postinstall.js'], {
			cwd: root,
			stdio: 'inherit',
			timeout: 600000,
			env: {
				...process.env,
				SKIP_WEB_BUILD: 'true',
			},
		});
		if (result.error || result.status !== 0) throw new Error('Database preparation failed; startup stopped.');
	});
	const log = options.log || console;
	let marker;
	try {
		marker = path.resolve(root, git(['rev-parse', '--git-path', 'galitube-update-pending']));
	} catch {
		log.warn('Automatic updates require a Git checkout. See README.md for installation.');
		return false;
	}
	// A failed installation must finish successfully before the bot can start again.
	if (fs.existsSync(marker)) {
		log.info('Retrying unfinished Galitube update installation...');
		install();
		fs.unlinkSync(marker);
		return true;
	}
	if (process.env.AUTO_UPDATE === 'false') return false;
	log.info(`Checking ${REPOSITORY} (main) for updates...`);
	try {
		if (git(['status', '--porcelain', '--untracked-files=all'])) {
			log.warn('Automatic update skipped: local changes or untracked files must be committed or moved first.');
			return false;
		}
		if (git(['branch', '--show-current']) !== 'main') {
			log.warn('Automatic update skipped: checkout is not on main.');
			return false;
		}
		git(['fetch', '--no-tags', REPOSITORY_URL, 'main']);
		const current = git(['rev-parse', 'HEAD']);
		const latest = git(['rev-parse', 'FETCH_HEAD']);
		if (current === latest) {
			log.info('Galitube Tickets is up to date.');
			return false;
		}
		git(['merge-base', '--is-ancestor', current, latest]);
		log.info(`Installing Galitube Tickets ${latest.slice(0, 12)}...`);
		// Keep a recovery reference without changing user configuration or data.
		git(['update-ref', 'refs/galitube/pre-update', current]);
		git(['merge', '--ff-only', latest]);
	} catch (error) {
		log.warn(`Update check skipped: ${error.message}. Existing version will start.`);
		return false;
	}
	fs.writeFileSync(marker, 'Installation pending\n');
	install();
	fs.unlinkSync(marker);
	log.info('Update installed. Starting the updated bot.');
	return true;
}
module.exports = {
	bootUpdate,
	REPOSITORY,
	REPOSITORY_URL,
	npm,
};
