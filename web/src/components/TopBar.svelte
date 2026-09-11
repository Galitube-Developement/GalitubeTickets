<script>
	import { base } from '$app/paths';
	import cookie from 'cookie';
	import ms from 'ms';
	/** @type {{user: any, isDark: any}} */
	let { user, theme } = $props();

	const toggle = () => {
		document.cookie = cookie.serialize('theme', theme === 'dark' ? 'light' : 'dark', {
			maxAge: ms('1y') / 1000,
			path: '/',
			sameSite: 'lax'
		});
		window.location = window.location; // eslint-disable-line
	};
</script>

<div class="my-8 rounded-xl bg-white p-4 shadow-sm dark:bg-slate-700">
	<div class="grid grid-cols-1 gap-4 sm:mx-8 md:grid-cols-2">
		<div>
			<a href={base + '/settings'} class="flex justify-center md:justify-start">
				<img src="/favicon.svg" class="mr-3 h-8" alt="" />
				<span class="text-left leading-tight"
					><strong class="block text-lg">Galitube Tickets</strong><span
						class="block text-xs text-gray-500 dark:text-slate-300"
						>Galitube Hosting</span
					></span
				>
			</a>
		</div>
		<div>
			<div
				class="mx-auto flex w-64 flex-shrink-0 items-center justify-center text-center md:float-right md:mx-0 md:justify-end md:text-left"
			>
				<a
					href={`/auth/logout`}
					class="flex items-center justify-center hover:font-medium md:justify-end"
					title="Logout"
				>
					<img
						src={user.avatar
							? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.webp`
							: '/favicon.svg'}
						class="h-8 rounded-full"
						alt=""
					/>
					<span class="ml-3">{user.username}</span>
				</a>
				<button
					type="button"
					class="ml-4 cursor-pointer p-1 text-lg transition duration-300 hover:text-blurple"
					title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
					onclick={toggle}
				>
					<i class="fa-solid {theme === 'dark' ? 'fa-moon' : 'fa-sun'}"></i>
				</button>
			</div>
		</div>
	</div>
</div>
