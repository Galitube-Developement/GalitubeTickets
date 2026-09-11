/* eslint-disable no-console */
require('dotenv').config();
if (process.env.SKIP_WEB_BUILD !== 'true') {
	const { npm } = require('../src/lib/boot-update');
	npm(['ci', '--prefix', 'web', '--include=dev', '--ignore-scripts'], require('path').resolve(__dirname, '..'));
	npm(['run', 'build', '--prefix', 'web'], require('path').resolve(__dirname, '..'));
}
const fs = require('fs-extra');
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const { short } = require('leeks.js');
const {
	resolve, join,
} = require('path');

const fallback = { prisma: './node_modules/prisma/build/index.js' };

function pathify(path) {
	return resolve(__dirname, '../', path);
}

function log(...strings) {
	console.log(short('&9[postinstall]&r'), ...strings);
}

async function npx(cmd) {
	const parts = cmd.split(' ');
	// fallback for environments with no symlink/npx support (PebbleHost)
	if (!fs.existsSync(pathify(`./node_modules/.bin/${parts[0]}`))) {
		const x = parts.shift();
		cmd = 'node ' + fallback[x] + ' ' + parts.join(' ');
	} else {
		cmd = 'npx ' + cmd;
	}
	log(`> ${cmd}`);
	const {
		stderr,
		stdout,
	} = await exec(cmd, { cwd: pathify('./') }); // { env } = process.env
	if (stdout) console.log(stdout.toString());
	if (stderr) console.log(stderr.toString());
}

const providers = ['mysql', 'postgresql', 'sqlite'];
const provider = process.env.DB_PROVIDER;

if (!provider) {
	log('environment not set, exiting.');
	process.exit(0);
}

if (!providers.includes(provider)) throw new Error(`DB_PROVIDER must be one of: ${providers}`);

log(`provider=${provider}`);
log(`copying ${provider} schema & migrations`);

// Container roots can be read-only under Pterodactyl/Pelican. Keep the
// selected runtime schema in their writable server directory instead of /app.
const prismaDir = process.env.PRISMA_SCHEMA_DIR
	? resolve(process.env.PRISMA_SCHEMA_DIR)
	: pathify('./prisma');
fs.emptyDirSync(prismaDir);
fs.copySync(pathify(`./db/${provider}`), prismaDir); // copy schema & migrations
// The schema may be exposed through /app/prisma so Prisma can resolve the
// already-installed packages while the real files remain on writable storage.
const schema = process.env.PRISMA_SCHEMA_PATH
	? resolve(process.env.PRISMA_SCHEMA_PATH)
	: join(prismaDir, 'schema.prisma');

if (provider === 'sqlite') fs.ensureDirSync(pathify('./user'));

if (provider === 'sqlite' && !process.env.DB_CONNECTION_URL) {
	process.env.DB_CONNECTION_URL = 'file:' + join(process.cwd(), './user/database.db');
	log(`set DB_CONNECTION_URL=${process.env.DB_CONNECTION_URL}`);
}

(async () => {
	await npx(`prisma generate --schema "${schema}"`);
	await npx(`prisma migrate deploy --schema "${schema}"`);
})().catch(error => {
	console.error(error);
	process.exitCode = 1;
});
