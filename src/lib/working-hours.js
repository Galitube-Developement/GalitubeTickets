const spacetime = require('spacetime');

function validateWorkingHours(value) {
	if (!Array.isArray(value) || value.length !== 8 || typeof value[0] !== 'string') throw new Error('Working hours must contain a timezone and seven days (Sunday first).');
	try {
		new Intl.DateTimeFormat('en', { timeZone: value[0] });
	} catch {
		throw new Error('Invalid working hours timezone.');
	}
	const normalized = value.map((hours, i) => i > 0 && (hours === null || (Array.isArray(hours) && hours.length === 0)) ? ['00:00', '00:00'] : hours);
	for (const hours of normalized.slice(1)) {
		if (!Array.isArray(hours) || hours.length !== 2 || hours.some(time => typeof time !== 'string' || !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(time))) throw new Error('Working hours require two HH:mm times per day.');
	}
	return normalized;
}

// Equal times mean closed. An end before the start is an overnight shift.
function getWorkingHours(value, epoch = Date.now()) {
	const [timezone, ...days] = validateWorkingHours(value);
	const now = spacetime(epoch, timezone);
	let next;
	for (let offset = -1; offset <= 7; offset++) {
		const date = now.add(offset, 'day');
		const [from, until] = days[date.day()];
		if (from === until) continue;
		const start = date.startOf('day').time(from);
		let end = date.startOf('day').time(until);
		if (until < from) end = end.add(1, 'day');
		// The historical 00:00-23:59 default covers the entire day.
		if (until === '23:59') end = end.add(1, 'minute');
		if (now.epoch >= start.epoch && now.epoch < end.epoch) return { working: true };
		if (start.epoch > now.epoch && (!next || start.epoch < next.epoch)) next = start;
	}
	return {
		working: false,
		timestamp: next ? Math.floor(next.epoch / 1000) : null,
		today: next?.format('iso-short') === now.format('iso-short'),
	};
}

module.exports = {
	getWorkingHours,
	validateWorkingHours,
};
