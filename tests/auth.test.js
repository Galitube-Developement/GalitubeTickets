const { test } = require('node:test');
const assert = require('node:assert/strict');
const { safeRedirect } = require('../src/lib/auth');
test('OAuth redirects stay on the same origin', () => {
	for(const value of ['https://evil.invalid','//evil.invalid','/\\evil.invalid','/\n/evil.invalid',null])assert.equal(safeRedirect(value),'/');
	assert.equal(safeRedirect('/settings/123?x=1'),'/settings/123?x=1');
});
