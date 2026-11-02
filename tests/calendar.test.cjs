const {readFileSync}=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const at=vm.runInNewContext(readFileSync(require('node:path').join(__dirname,'../web/calendar.js'),'utf8')+'; StoryCalendar.at;');
const state=iso=>at(new Date(iso),'2024-11-25','2026-11-25');
assert.equal(state('2026-11-02T05:00:00Z').elapsed,707);
assert.equal(state('2026-11-02T05:00:00Z').remaining,23);
assert.equal(state('2026-11-01T16:59:59Z').elapsed,706);
assert.equal(state('2026-11-01T17:00:00Z').elapsed,707);
assert.equal(state('2026-11-01T17:00:00Z').today,'2026-11-02');
assert.equal(state('2024-11-24T17:00:00Z').elapsed,0);
assert.equal(state('2024-11-23T17:00:00Z').elapsed,0);
assert.equal(state('2026-11-24T17:00:00Z').elapsed,730);
assert.equal(state('2026-11-24T17:00:00Z').remaining,0);
assert.match(state('2026-11-24T17:00:00Z').status,/Hôm nay/);
assert.match(state('2026-11-02T05:00:00Z').lead,/Sắp/);
assert.equal(state('2026-11-25T17:00:00Z').elapsed,731);
assert.match(state('2026-11-25T17:00:00Z').together,/viết tiếp/);
assert.equal(at(new Date('2024-02-29T17:00:00Z'),'2024-02-28','2026-02-28').elapsed,2);
console.log('Passed: Vietnam calendar days, midnight boundaries, anniversary, future date and leap day.');

for(const now of ['2026-11-02T05:00:00Z','2026-11-25T05:00:00Z','2028-02-02T05:00:00Z']){
 const gift=at(new Date(now),'2024-11-25','2026-11-25','anniversary');
 assert.equal(gift.today,'2026-11-25');assert.equal(gift.todayDisplay,'25.11.2026');
 assert.equal(gift.elapsed,730);assert.equal(gift.remaining,0);
 assert.equal(gift.lead,'Hai năm rồi.');assert.equal(gift.together,'đã bên nhau hai năm.');
 assert.match(gift.status,/Hôm nay/);assert.ok(!gift.status.includes('Còn '));
 assert.match(gift.note,/Chúc mừng/);assert.equal(gift.label,'Hôm nay');
}
console.log('Passed: anniversary presentation stays on 25.11.2026, 730 days, without a countdown.');
