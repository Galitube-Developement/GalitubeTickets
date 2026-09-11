<script>
	import { run, preventDefault } from 'svelte/legacy';

	import { page } from '$app/stores';
	import MultiSelect from 'svelte-multiselect';
	import emoji from 'emoji-name-map';
	import Required from '$components/Required.svelte';
	import ErrorBox from '$components/ErrorBox.svelte';
	/**
	 * @typedef {Object} Props
	 * @property {import('./$types').PageData} data
	 */

	/** @type {Props} */
	let { data } = $props();

	let { categories, channels } = $state(data);
	channels = channels.filter((c) => c.type === 0); // text
	let error = $state(null);
	let success = $state('');
	let existingChannel = $state('');
	let messageLink = $state('');
	let existingPanels = $state([]);
	let before = $state(null);
	let searching = $state(false);
	const endpoint = () => '/api/admin/guilds/' + $page.params.guild + '/panels';
	async function loadPanels(older = false) {
		if (!existingChannel) return;
		searching = true;
		error = null;
		try {
			const response = await fetch(
				endpoint() +
					'?channel=' +
					existingChannel +
					(older && before ? '&before=' + before : '')
			);
			const body = await response.json();
			if (!response.ok) throw body;
			existingPanels = older ? [...existingPanels, ...body.panels] : body.panels;
			before = body.before;
		} catch (err) {
			error = err;
		} finally {
			searching = false;
		}
	}
	function editPanel(value) {
		panel = { ...value };
		selectedCategories = value.categories
			.map((id) => Object.keys(categoryOptions).find((name) => categoryOptions[name] === id))
			.filter(Boolean);
		error = null;
		success = '';
	}
	async function loadMessage() {
		const match = messageLink
			.trim()
			.match(/^https:\/\/(?:www\.)?discord(?:app)?\.com\/channels\/(\d+)\/(\d+)\/(\d+)$/);
		if (!match || match[1] !== $page.params.guild) {
			error = { message: 'Paste a Discord message link from this server.' };
			return;
		}
		searching = true;
		error = null;
		try {
			const response = await fetch(
				endpoint() + '?channel=' + match[2] + '&message=' + match[3]
			);
			const body = await response.json();
			if (!response.ok) throw body;
			editPanel(body);
		} catch (err) {
			error = err;
		} finally {
			searching = false;
		}
	}
	function newPanel() {
		panel = {
			categories: [],
			channel: 'new',
			description: '',
			image: '',
			title: '',
			type: 'BUTTON',
			thumbnail: ''
		};
		selectedCategories = [];
		success = '';
		error = null;
	}
	let loading = $state(false);
	let panel = $state({
		categories: [],
		channel: 'new',
		description: '',
		image: '',
		title: '',
		type: 'BUTTON',
		thumbnail: ''
	});

	let selectedCategories = $state([]);
	const categoryOptions = categories.reduce((acc, c) => {
		acc[(emoji.get(c.emoji) ?? '') + c.name] = c.id;
		return acc;
	}, {});

	const getChannelName = (id) => {
		return channels.find((c) => c.id === id)?.name;
	};

	const submit = async () => {
		try {
			error = null;
			success = '';
			loading = true;
			const json = { ...panel };
			if (json.channel === 'new') json.channel = null;
			json.categories = selectedCategories.map((name) => categoryOptions[name]);
			const url = `/api/admin/guilds/${$page.params.guild}/panels`;
			const response = await fetch(url, {
				method: panel.message ? 'PATCH' : 'POST',
				body: JSON.stringify(json),
				credentials: 'include',
				headers: {
					'Content-Type': 'application/json; charset=UTF-8'
				}
			});
			const body = await response.json();
			if (!response.ok) throw body;
			else {
				success = panel.message
					? 'Panel saved. The existing Discord message has been updated.'
					: 'Panel created.';
				panel.message = body.message;
				panel.channel = body.channel;
				loading = false;
				if (existingChannel) await loadPanels();
			}
		} catch (err) {
			loading = false;
			error = err;
			window.scroll({
				top: 0,
				behavior: 'smooth'
			});
		}
	};

	run(() => {
		panel.type =
			selectedCategories.length > 25
				? 'MENU'
				: selectedCategories.length > 1 && panel.type === 'MESSAGE'
					? 'BUTTON'
					: panel.type;
	});
</script>

<h1 class="m-4 text-center text-4xl font-bold">Ticket panels</h1>
<div class="m-2 mx-auto max-w-3xl rounded-xl bg-white p-4 shadow-sm dark:bg-slate-700">
	<h2 class="text-xl font-semibold">Edit an existing panel</h2>
	<p class="my-2">
		Select a channel to find panels, or paste an older panel's Discord message link.
	</p>
	<label
		>Find panels in channel<select
			class="input"
			bind:value={existingChannel}
			onchange={() => loadPanels()}
			disabled={searching}
			><option value="">Select channel</option>{#each channels as channel}<option
					value={channel.id}>#{channel.name}</option
				>{/each}</select
		></label
	>
	{#each existingPanels as saved}<button
			class="my-1 block w-full rounded bg-gray-100 p-3 text-left dark:bg-slate-800"
			onclick={() => editPanel(saved)}>Edit: {saved.title || saved.message}</button
		>{/each}
	{#if existingChannel && !searching && !existingPanels.length}<p>
			No panels found in the messages checked.
		</p>{/if}
	{#if before}<button class="my-2 underline" disabled={searching} onclick={() => loadPanels(true)}
			>Search older messages</button
		>{/if}
	<div class="my-3">
		<label
			>Discord message link<input
				class="input"
				type="url"
				bind:value={messageLink}
				placeholder="https://discord.com/channels/..."
			/></label
		><button
			class="rounded bg-blurple p-2 text-white"
			disabled={searching || !messageLink}
			onclick={loadMessage}>Load panel</button
		>
	</div>
	<button class="underline" onclick={newPanel}>Create a new panel</button>
</div>
<div class="m-2 mx-auto max-w-3xl sm:p-4">
	{#if success}<p role="status" class="my-3 rounded bg-green-100 p-3 text-green-900">
			{success}
		</p>{/if}
	<h2 class="my-3 text-xl font-semibold">{panel.message ? 'Edit panel' : 'Create panel'}</h2>
	{#if error}
		<ErrorBox {error} />
	{/if}

	<div class="rounded-xl bg-white p-4 shadow-sm dark:bg-slate-700">
		<div class="text-center">
			{#if panel.channel !== 'new' && panel.type === 'MESSAGE'}
				<p class="p-2 text-cyan-500">
					<i class="fa-solid fa-circle-info text-2xl"></i>
					Make sure members can read and send messages in
					<span class="font-mono">#{getChannelName(panel.channel)}</span>.
				</p>
			{:else if panel.channel !== 'new' && panel.type !== 'MESSAGE'}
				<p class="p-2 text-cyan-500">
					<i class="fa-solid fa-circle-info text-2xl"></i>
					Make sure members can read but not send messages in
					<span class="font-mono">#{getChannelName(panel.channel)}</span>.
				</p>
			{/if}
		</div>
		<form onsubmit={preventDefault(() => submit())} class="my-4 text-lg">
			<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
				<div>
					<label>
						<span class="font-medium">Type</span>
						<i
							class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-slate-400"
							title="How will members use the panel?"
						></i>
						<select
							class="input form-multiselect font-normal"
							required
							bind:value={panel.type}
						>
							<option
								value="BUTTON"
								class="p-1"
								disabled={selectedCategories.length > 25}
							>
								<!-- <i class="fa-solid fa-at text-gray-500 dark:text-slate-400" default /> -->
								Buttons
							</option>
							<option value="MENU" class="p-1">
								<!-- <i class="fa-solid fa-at text-gray-500 dark:text-slate-400" /> -->
								Select menu (dropdown)
							</option>
							<!-- <option value="MESSAGE" class="p-1" disabled={selectedCategories.length > 1}>
								<i class="fa-solid fa-at text-gray-500 dark:text-slate-400" />
								Message
							</option> -->
						</select>
					</label>
				</div>
				<div>
					<label class="font-medium">
						<span class="font-medium">Channel</span>
						<i
							class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-slate-400"
							title="The channel to send the panel message to"
						></i>
						<select
							required
							class="input form-multiselect font-normal"
							bind:value={panel.channel}
							disabled={!!panel.message}
						>
							<option value="new">Create a new channel</option>
							<hr />
							{#each channels as channel}
								{channel.id}
								<option value={channel.id} class="p-1">
									<!-- <i class="fa-solid fa-hashtag text-gray-500 dark:text-slate-400" /> -->
									{channel.name}
								</option>
							{/each}
						</select>
					</label>
				</div>
				<div>
					<label class="font-medium">
						<span class="font-medium">Categories</span>
						<Required />
						<i
							class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-slate-400"
							title="The category options to be available"
						></i>
						<MultiSelect
							bind:selected={selectedCategories}
							outerDivClass="text-base my-1 p-2 rounded-md border-transparent bg-gray-100 dark:bg-slate-800 font-normal shadow-sm transition-colors has-[:focus]:ring-2 has-[:focus]:ring-blurple"
							inputClass="p-0 rounded-md bg-transparent transition-colors border-0 focus:ring-0"
							ulSelectedClass="bg-gray-100 dark:bg-slate-800 text-gray-800 dark:text-slate-300"
							liSelectedClass="bg-blurple text-white text-sm font-semibold font-mono"
							ulOptionsClass="bg-white dark:bg-slate-900 p-2 max-h-48 overflow-y-auto"
							liOptionClass="rounded-md"
							liActiveOptionClass="bg-blurple text-white"
							liUserMsgClass="text-red-700 dark:text-red-500 bg-red-400/40 dark:bg-red-500/20"
							liActiveUserMsgClass=""
							maxSelectMsgClass="text-xs"
							noMatchingOptionsMsg="Create a category in the categories section"
							required={true}
							maxSelect={25}
							options={Object.keys(categoryOptions)}
						/>
					</label>
				</div>
				<div>
					<label>
						<span class="font-medium">Title</span>
						<i
							class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-slate-400"
							title="The embed title"
						></i>
						<input
							type="text"
							class="input form-input"
							required
							maxlength="256"
							bind:value={panel.title}
						/>
					</label>
				</div>
				<div>
					<label>
						<span class="font-medium">Large image</span>
						<i
							class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-slate-400"
							title="Optional - the embed image"
						></i>
						<input type="url" class="input form-input" bind:value={panel.image} />
					</label>
				</div>
				<div>
					<label>
						<span class="font-medium">Small image (thumbnail)</span>
						<i
							class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-slate-400"
							title="Optional - the embed thumbnail"
						></i>
						<input type="url" class="input form-input" bind:value={panel.thumbnail} />
					</label>
				</div>
				<div>
					<label class="font-medium">
						<span class="font-medium">Description</span>
						<i
							class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-slate-400"
							title="Optional - the embed description"
						></i>
						<textarea
							class="input form-input h-24"
							maxlength="4096"
							bind:value={panel.description}></textarea>
					</label>
				</div>
				<div class="place-self-center">
					<button
						type="submit"
						disabled={loading}
						class="mt-4 rounded-lg bg-green-300 p-2 px-5 font-medium transition duration-300 hover:bg-green-500 hover:text-white disabled:cursor-not-allowed dark:bg-green-500/50 dark:hover:bg-green-500 dark:hover:text-white"
					>
						{#if loading}
							<i class="fa-solid fa-spinner animate-spin"></i>
						{/if}
						{panel.message ? 'Save changes' : 'Create panel'}
					</button>
				</div>
			</div>
		</form>
	</div>
	<div class="mx-auto mt-8 max-w-lg text-center text-base">
		<div class="rounded-xl border-2 border-cyan-500 bg-cyan-500/20 p-2">
			<i class="fa-solid fa-circle-info text-2xl text-cyan-500"></i>
			<br />
			Save changes updates the same Discord message. To remove a panel, delete its message in Discord.
		</div>
	</div>
</div>
