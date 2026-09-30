import { error } from '@sveltejs/kit';

/** @type {import('./$types').PageLoad} */
export async function load({ fetch }) {
	const response = await fetch('/api/admin/bot/settings', { credentials: 'include' });
	const body = await response.json();
	if (!response.ok) error(response.status, body.message || 'Could not load bot settings.');
	return { presence: body };
}
