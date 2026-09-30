/** @type {import('./$types').PageLoad} */
export async function load({ fetch }) {
	const fetchOptions = { credentials: 'include' };
	const [guildsResponse, botSettingsResponse] = await Promise.all([
		fetch(`/api/admin/guilds`, fetchOptions).catch(() => null),
		fetch(`/api/admin/bot/settings`, fetchOptions).catch(() => null)
	]);
	let guilds = [];
	let guildsError = '';
	if (guildsResponse?.ok) {
		const body = await guildsResponse.json();
		if (Array.isArray(body)) guilds = body;
		else guildsError = body?.message || 'Could not load your server list.';
	} else {
		const body = await guildsResponse?.json().catch(() => null);
		guildsError = body?.message || 'Could not load your server list. Please try again.';
	}
	return {
		canManageBot: botSettingsResponse?.ok ?? false,
		guilds,
		guildsError
	};
}
