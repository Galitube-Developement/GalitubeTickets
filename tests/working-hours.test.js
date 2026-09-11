const { test } = require('node:test');
const assert = require('node:assert/strict');
const { getWorkingHours, validateWorkingHours } = require('../src/lib/working-hours');
const schedule = (days = {}, zone = 'UTC') => [zone, ...Array.from({length: 7}, (_, i) => days[i] || ['00:00', '00:00'])];
const at = (hours, date) => getWorkingHours(hours, Date.parse(date));

test('does not mutate cached settings over repeated checks', () => {
	const hours = schedule({4:['09:00','17:00']}); const before = JSON.stringify(hours);
	for (let i=0;i<3;i++) assert.equal(at(hours,'2026-09-10T10:00:00Z').working,true);
	assert.equal(JSON.stringify(hours),before);
});
test('same-day opening and exact closing boundary', () => {
	const h=schedule({4:['09:00','17:00']});
	assert.deepEqual(at(h,'2026-09-10T08:00:00Z'),{working:false,today:true,timestamp:Date.parse('2026-09-10T09:00:00Z')/1000});
	assert.equal(at(h,'2026-09-10T09:00:00Z').working,true);
	assert.equal(at(h,'2026-09-10T17:00:00Z').timestamp,Date.parse('2026-09-17T09:00:00Z')/1000);
});
test('Sunday is a valid next working day across week boundaries', () => {
	assert.equal(at(schedule({0:['10:00','12:00']}),'2026-09-12T18:00:00Z').timestamp,Date.parse('2026-09-13T10:00:00Z')/1000);
});
test('all closed days report no next timestamp', () => { assert.equal(at(schedule(),'2026-09-10T10:00:00Z').timestamp,null); });
test('overnight shifts include previous day and wrap Saturday to Sunday', () => {
	const h=schedule({6:['22:00','06:00']});
	assert.equal(at(h,'2026-09-13T05:59:00Z').working,true);
	assert.equal(at(h,'2026-09-13T06:00:00Z').working,false);
	assert.equal(at(h,'2026-09-12T22:00:00Z').working,true);
});
test('default 23:59 includes last minute of day', () => { assert.equal(at(schedule({4:['00:00','23:59']}),'2026-09-10T23:59:59Z').working,true); });
test('Zurich timezone and DST transition produce real UTC timestamps', () => {
	const h=schedule({0:['09:00','17:00']},'Europe/Zurich');
	assert.equal(at(h,'2026-03-28T10:00:00Z').timestamp,Date.parse('2026-03-29T07:00:00Z')/1000);
	assert.equal(at(h,'2026-10-24T10:00:00Z').timestamp,Date.parse('2026-10-25T08:00:00Z')/1000);
});
test('reject malformed schedules and timezones', () => {
	for(const value of [null,[],schedule({},'Invalid/Zone'),schedule({1:null}).slice(0,7),schedule({2:['25:00','09:00']}),schedule({2:['','09:00']})]) assert.throws(()=>validateWorkingHours(value));
});
