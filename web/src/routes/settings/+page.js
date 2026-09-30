/** @type {import('./$types').PageLoad} */
export async function load({ fetch }) {
	const fetchOptions = { credentials: 'include' };
	const [guildsResponse, botSettingsResponse] = await Promise.all([
		fetch(`/api/admin/guilds`, fetchOptions),
		fetch(`/api/admin/bot/settings`, fetchOptions)
	]);
	return {
		canManageBot: botSettingsResponse.ok,
		guilds: await guildsResponse.json()
	};
}
