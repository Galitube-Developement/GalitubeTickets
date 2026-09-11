const { test } = require('node:test');
const assert = require('node:assert/strict');
const { escapeHTML } = require('../src/lib/html');

test('streamed import logs escape user-controlled HTML', () => {
	assert.equal(
		escapeHTML(`<img src=x onerror="alert('x')"> & done`),
		'&lt;img src=x onerror=&quot;alert(&#39;x&#39;)&quot;&gt; &amp; done',
	);
});
