function safeRedirect(value) {
	// Reject control characters and backslashes before sending a Location header.
	// eslint-disable-next-line no-control-regex, no-useless-escape
	return typeof value === 'string' && /^\/(?![\/\\])[^\\\u0000-\u0020]*$/.test(value) ? value : '/';
}
module.exports = { safeRedirect };
