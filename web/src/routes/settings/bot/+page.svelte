<script>
	import { base } from '$app/paths';
	/** @type {{data: import('./$types').PageData}} */
	let { data } = $props();

	let presence = $state(structuredClone(data.presence));
	let saving = $state(false);
	let saved = $state(false);
	let errorMessage = $state('');

	const activityTypes = [
		{ value: 0, label: 'Playing' },
		{ value: 2, label: 'Listening to' },
		{ value: 3, label: 'Watching' },
		{ value: 5, label: 'Competing in' }
	];

	const addActivity = () => {
		if (presence.activities.length < 10) presence.activities.push({ name: '', type: 0 });
	};

	const save = async (event) => {
		event.preventDefault();
		saving = true;
		saved = false;
		errorMessage = '';
		try {
			const response = await fetch('/api/admin/bot/settings', {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify(presence)
			});
			const body = await response.json();
			if (!response.ok) throw new Error(body.message || 'Could not save bot settings.');
			presence = body;
			saved = true;
		} catch (error) {
			errorMessage = error.message;
		} finally {
			saving = false;
		}
	};
</script>

<svelte:head>
	<title>Bot presence</title>
</svelte:head>

<div class="mx-auto max-w-3xl">
	<div class="mb-6 flex items-center justify-between gap-4">
		<div>
			<a href={`${base}/settings`} class="text-sm text-blurple hover:underline">← Server selection</a>
			<h1 class="mt-2 text-3xl font-bold">Bot presence</h1>
			<p class="mt-2 text-sm text-gray-500 dark:text-slate-400">
				Configure the activity rotation shown on the bot's Discord profile.
			</p>
		</div>
	</div>

	<form onsubmit={save} class="space-y-6 rounded-xl bg-white p-5 shadow-sm dark:bg-slate-700 sm:p-8">
		<div class="grid gap-4 sm:grid-cols-2">
			<label class="block">
				<span class="mb-1 block font-semibold">Bot status</span>
				<select bind:value={presence.status} class="input form-multiselect w-full">
					<option value="online">Online</option>
					<option value="idle">Idle</option>
					<option value="dnd">Do not disturb</option>
					<option value="invisible">Invisible</option>
				</select>
			</label>
			<label class="block">
				<span class="mb-1 block font-semibold">Rotation interval (seconds)</span>
				<input
					type="number"
					min="15"
					max="3600"
					step="1"
					bind:value={presence.interval}
					class="input form-input w-full"
				/>
			</label>
		</div>

		<div class="space-y-4">
			<div class="flex items-center justify-between gap-4">
				<div>
					<h2 class="text-xl font-semibold">Activity rotation</h2>
					<p class="text-sm text-gray-500 dark:text-slate-400">
					Use {'{totalTickets}'}, {'{openTickets}'}, {'{guilds}'}, {'{avgRating}'}, {'{avgResponseTime}'}, or {'{avgResolutionTime}'} as live values.
					</p>
				</div>
				<button
					type="button"
					class="shrink-0 rounded-lg bg-gray-100 px-3 py-2 text-sm font-medium transition hover:bg-blurple hover:text-white disabled:cursor-not-allowed disabled:opacity-50 dark:bg-slate-800"
					onclick={addActivity}
					disabled={presence.activities.length >= 10}
				>
					<i class="fa-solid fa-plus mr-1"></i>Add
				</button>
			</div>

			{#if presence.activities.length === 0}
				<p class="rounded-lg bg-gray-50 p-4 text-sm text-gray-600 dark:bg-slate-800 dark:text-slate-300">
					No activities are configured. The bot will show no activity until you add one.
				</p>
			{/if}

			{#each presence.activities as activity, index}
				<div class="grid gap-3 rounded-lg border border-gray-200 p-4 dark:border-slate-600 sm:grid-cols-[1fr_180px_auto] sm:items-end">
					<label class="block">
						<span class="mb-1 block text-sm font-semibold">Activity text</span>
						<input
							type="text"
							maxlength="128"
							bind:value={activity.name}
							placeholder="Playing /new"
							class="input form-input w-full"
						/>
					</label>
					<label class="block">
						<span class="mb-1 block text-sm font-semibold">Activity type</span>
						<select bind:value={activity.type} class="input form-multiselect w-full">
							{#each activityTypes as type}
								<option value={type.value}>{type.label}</option>
							{/each}
						</select>
					</label>
					<button
						type="button"
						class="rounded-lg px-3 py-2 text-red-600 transition hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-900/30"
						aria-label={`Remove activity ${index + 1}`}
						onclick={() => presence.activities.splice(index, 1)}
					>
						<i class="fa-solid fa-trash"></i>
					</button>
				</div>
			{/each}
		</div>

		{#if errorMessage}
			<p role="alert" class="rounded-lg bg-red-100 p-3 text-red-800 dark:bg-red-900/40 dark:text-red-200">{errorMessage}</p>
		{/if}
		{#if saved}
			<p role="status" class="rounded-lg bg-green-100 p-3 text-green-800 dark:bg-green-900/40 dark:text-green-200">Bot presence updated and saved.</p>
		{/if}

		<div class="flex justify-end">
			<button
				type="submit"
				disabled={saving}
				class="rounded-lg bg-green-300 p-2 px-5 font-medium transition hover:bg-green-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-50 dark:bg-green-500/50 dark:hover:bg-green-500 dark:hover:text-white"
			>
				{saving ? 'Saving…' : 'Save changes'}
			</button>
		</div>
	</form>
</div>
