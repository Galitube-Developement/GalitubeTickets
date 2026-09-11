<script>
	import TopBar from '$components/TopBar.svelte';
	import { onMount } from 'svelte';
	import { fade } from 'svelte/transition';
	import { page, navigating } from '$app/stores';
	import { Modals, modals } from 'svelte-modals';
	import cookie from 'cookie';
	import WelcomeModal from '$components/WelcomeModal.svelte';
	import Spinner from '$components/Spinner.svelte';
	/** @type {{data: import('./$types').PageData, children?: import('svelte').Snippet}} */
	let { data, children } = $props();

	const { client, user, theme } = data;
	let mounted = $state(false);
	let cookies = $state({});
	onMount(() => {
		cookies = cookie.parse(document.cookie || '');
		if (!cookies.welcomed) modals.open(WelcomeModal, { client });
		mounted = true;
	});

	const dismissCookies = () => {
		document.cookie = cookie.serialize('dismissedCookies', 'true', {
			maxAge: 2592000,
			path: '/',
			sameSite: 'lax'
		});
		cookies.dismissedCookies = true;
	};

	const links = [
		{
			icon: 'fa-solid fa-book',
			name: 'Documentation',
			url: 'https://github.com/Galitube-Developement/GalitubeTickets#readme'
		},
		{
			icon: 'fab fa-discord',
			name: 'Support',
			url: 'https://github.com/Galitube-Developement/GalitubeTickets/issues'
		},
		{
			icon: 'fa-solid fa-comments',
			name: 'Feedback',
			url: 'https://github.com/Galitube-Developement/GalitubeTickets/issues'
		}
	];
</script>

<svelte:head>
	<title>Galitube Tickets</title>
	<link rel="icon" href="/favicon.svg" />
</svelte:head>

<div class="absolute h-max min-h-screen w-full bg-gray-200 dark:bg-slate-900">
	<Modals>
		{#snippet backdrop({ close })}
			<button
				type="button"
				aria-label="Close dialog"
				class="backdrop"
				transition:fade
				onclick={close}
			></button>
		{/snippet}
		{#snippet loading()}
			<div>
				<Spinner />
			</div>
		{/snippet}
	</Modals>
	{#if mounted && client.public && !cookies.dismissedCookies}
		<div
			class="m-0 flex w-full flex-row justify-center gap-8 bg-blurple p-1 font-medium text-white sm:px-8"
		>
			<p>Cookies are being used to store credentials and preferences.</p>
			<button type="button" title="Dismiss" aria-label="Dismiss" onclick={dismissCookies}>
				<i class="fa-sharp fa-solid fa-circle-xmark justify-self-end hover:cursor-pointer"
				></i>
			</button>
		</div>
	{/if}
	<div class="text-gray-800 dark:text-slate-300">
		{#if $navigating || !mounted}
			<div class="flex h-dvh items-center justify-center">
				<Spinner />
			</div>
		{:else}
			<div class="m-2 sm:m-6 lg:m-12">
				<div class="mx-auto max-w-7xl">
					<TopBar {user} {theme} />
					{@render children?.()}
					<footer class="my-16 text-center">
						<div class="mb-6 p-2 text-sm">
							<a
								href="/"
								class="cursor-pointer text-gray-500 transition duration-300 hover:text-blurple dark:text-slate-400 dark:hover:text-blurple"
							>
								<i class="fa-solid fa-arrow-left"></i>
								Back to the portal
							</a>
						</div>
						{#if $page.route.id !== '/settings'}
							<div class="my-4 flex justify-center gap-3">
								{#each links as link}
									<a
										href={link.url}
										target="_blank"
										rel="noopener noreferrer"
										class="link rounded-3xl bg-gray-50/75 p-0.5 px-2 font-medium text-gray-500 shadow-sm dark:bg-slate-800/75 dark:text-slate-400"
									>
										<i class={link.icon}></i>
										{link.name}
									</a>
								{/each}
							</div>
						{/if}
						<p>
							<a
								href="https://github.com/Galitube-Developement/GalitubeTickets#readme"
								target="_blank"
								rel="noopener noreferrer"
								class="cursor-pointer transition duration-300 hover:text-blurple dark:hover:text-blurple"
								>Galitube Tickets</a
							>
							by
							<a
								href="https://github.com/Galitube-Developement/GalitubeTickets"
								target="_blank"
								rel="noopener noreferrer"
								class="cursor-pointer transition duration-300 hover:text-blurple dark:hover:text-blurple"
								>Galitube Hosting</a
							>
						</p>
						<p>Galitube Hosting · Based on Discord Tickets (GPLv3)</p>
						<!-- <p class="my-4">
								<a
									href="https://github.com/Galitube-Developement/GalitubeTickets/issues"
									target="_blank"
									class="hover:text-blurple text-lg transition duration-300"
								>
									<i class="fab fa-discord" />
								</a>
							</p> -->
						<p class="my-4 text-xs">
							Galitube Tickets is not an official Discord product.
							<br />
							It is not affiliated with nor endorsed by Discord Inc.
						</p>
					</footer>
				</div>
			</div>
		{/if}
	</div>
</div>
