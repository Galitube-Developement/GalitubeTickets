const { test } = require('node:test');
const assert = require('node:assert/strict');
const Fastify = require('fastify');
const routes = require('../src/routes/api/admin/bot/settings');

function fixture(t, userId = 'owner') {
	const app = Fastify();
	const client = {
		supers: ['owner'],
		config: { presence: { activities: [{ name: '/new' }], interval: 20, status: 'online' } },
	};
	app.decorate('authenticate', async (req, res) => {
		if (!userId) return res.code(401).send({ message: 'Unauthorised' });
		req.user = { id: userId };
	});
	for (const method of ['get', 'patch']) {
		app.route({ method: method.toUpperCase(), url: '/api/admin/bot/settings', config: { client }, ...routes[method](app) });
	}
	t.after(() => app.close());
	return app;
}

test('bot owner presence GET completes instead of hanging in the permission hook', async t => {
	const app = fixture(t);
	const response = await app.inject({ url: '/api/admin/bot/settings', signal: AbortSignal.timeout(1000) });
	assert.equal(response.statusCode, 200);
	assert.deepEqual(response.json().activities, [{ name: '/new', type: 0 }]);
});

test('bot owner PATCH proceeds through the permission hook to validation', async t => {
	const app = fixture(t);
	const response = await app.inject({ method: 'PATCH', url: '/api/admin/bot/settings', payload: {}, signal: AbortSignal.timeout(1000) });
	assert.equal(response.statusCode, 400);
});

test('presence routes reject non-owners and unauthenticated requests', async t => {
	for (const [userId, status] of [['member', 403], [null, 401]]) {
		const app = fixture(t, userId);
		for (const method of ['GET', 'PATCH']) {
			const response = await app.inject({ method, url: '/api/admin/bot/settings', signal: AbortSignal.timeout(1000) });
			assert.equal(response.statusCode, status);
		}
	}
});
