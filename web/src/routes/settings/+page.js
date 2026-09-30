/** @type {import('./$types').PageLoad} */
export async function load({ fetch }) {
	const fetchOptions = { credentials: 'include' };
	const [guildsResponse, botSettingsResponse] = await Promise.all([
		fetch(`/api/admin/guilds`, fetchOptions),
		fetch(`/api/admin/bot/settings`, fetchOptions).catch(() => null)
	]);
	return {
		canManageBot: botSettingsResponse?.ok ?? false,
		guilds: await guildsResponse.json()
	};
}
