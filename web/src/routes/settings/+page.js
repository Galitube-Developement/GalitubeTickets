/** @type {import('./$types').PageLoad} */
export async function load({ fetch }) {
	const fetchOptions = { credentials: 'include' };
	const [guildsResponse, botSettingsResponse] = await Promise.all([
		fetch(`/api/admin/guilds`, fetchOptions).catch(() => null),
		fetch(`/api/admin/bot/settings`, fetchOptions).catch(() => null)
	]);
	let guilds = [];
	let guildsError = '';
	if (!guildsResponse?.ok) {
		guildsError = 'Could not load your server list. Please try again.';
	} else {
		try {
			const body = await guildsResponse.json();
			if (Array.isArray(body)) guilds = body;
			else guildsError = body?.message || 'Could not load your server list.';
		} catch {
			guildsError = 'Could not read your server list. Please try again.';
		}
	}
	return {
		canManageBot: botSettingsResponse?.ok ?? false,
		guilds,
		guildsError
	};
}
