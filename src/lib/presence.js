const ms = require('ms');
const {
	getAverageTimes,
	getAverageRating,
} = require('./stats');

module.exports = client => {
	let next = 0;
	let timer;
	let updating = false;

	const apply = async () => {
		if (updating) return;
		updating = true;
		try {
			const presence = client.config.presence || {};
			const activities = Array.isArray(presence.activities) ? presence.activities : [];
			if (activities.length === 0) {
				await client.user.setPresence({ activities: [], status: presence.status || 'online' });
				return;
			}

			if (next >= activities.length) next = 0;
			const cacheKey = 'cache/presence';
			let cached = await client.keyv.get(cacheKey);
			if (!cached) {
				const tickets = await client.prisma.ticket.findMany({
					select: {
						closedAt: true,
						createdAt: true,
						feedback: { select: { rating: true } },
						firstResponseAt: true,
					},
				});
				const closedTickets = tickets.filter(ticket => ticket.closedAt);
				const closedTicketsWithResponse = closedTickets.filter(ticket => ticket.firstResponseAt);
				const { avgResolutionTime, avgResponseTime } = await getAverageTimes(closedTicketsWithResponse);
				const avgRating = await getAverageRating(closedTickets);

				cached = {
					avgRating: avgRating.toFixed(1),
					avgResolutionTime: ms(avgResolutionTime),
					avgResponseTime: ms(avgResponseTime),
					guilds: client.guilds.cache.size,
					openTickets: tickets.length - closedTickets.length,
					totalTickets: tickets.length,
				};
				await client.keyv.set(cacheKey, cached, ms('15m'));
			}

			const activity = { ...activities[next] };
			activity.name = activity.name
				.replace(/{+avgResolutionTime}+/gi, cached.avgResolutionTime)
				.replace(/{+avgResponseTime}+/gi, cached.avgResponseTime)
				.replace(/{+avgRating}+/gi, cached.avgRating)
				.replace(/{+guilds}+/gi, cached.guilds)
				.replace(/{+openTickets}+/gi, cached.openTickets)
				.replace(/{+totalTickets}+/gi, cached.totalTickets);
			await client.user.setPresence({
				activities: [activity],
				status: presence.status || 'online',
			});
			next = (next + 1) % activities.length;
		} finally {
			updating = false;
		}
	};

	return async () => {
		if (timer) clearInterval(timer);
		timer = undefined;
		next = 0;

		const activities = client.config.presence?.activities;
		if (!Array.isArray(activities) || activities.length === 0) {
			client.log.info('Presence activities are disabled');
			await apply();
			return;
		}

		await apply();
		if (activities.length > 1) {
			const interval = Math.max(15, Number(client.config.presence.interval) || 20);
			timer = setInterval(() => apply().catch(error => client.log.error(error)), interval * 1000);
		}
	};
};
