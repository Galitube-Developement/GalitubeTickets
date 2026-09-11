import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderMarkdown } from '../web/src/lib/markdown.js';

test('markdown previews remove scripts, event handlers, and unsafe URLs', () => {
	const html = renderMarkdown('<script>alert(1)</script><img src=x onerror=alert(2)> [x](javascript:alert(3))');
	assert.doesNotMatch(html, /script|onerror|javascript:/i);
});
