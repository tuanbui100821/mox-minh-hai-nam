/* Count calendar days at UTC+7, rather than elapsed 24-hour periods. */
const StoryCalendar = (() => {
  const calendar = new Intl.DateTimeFormat('en-CA', {timeZone:'Asia/Ho_Chi_Minh', year:'numeric', month:'2-digit', day:'2-digit'});
  const dayNumber = value => {
    const [year, month, day] = value.split('-').map(Number);
    return Math.floor(Date.UTC(year, month - 1, day) / 86400000);
  };
  const display = value => value.split('-').reverse().join('.');
  function at(now, start, anniversary) {
    const parts = Object.fromEntries(calendar.formatToParts(now).filter(part => part.type !== 'literal').map(part => [part.type, part.value]));
    const today = `${parts.year}-${parts.month}-${parts.day}`;
    const elapsed = Math.max(0, dayNumber(today) - dayNumber(start));
    const remaining = dayNumber(anniversary) - dayNumber(today);
    const status = remaining > 0 ? `Còn ${remaining} ngày đến ${display(anniversary)}.`
      : remaining === 0 ? 'Hôm nay, mình tròn hai năm.' : `Mốc hai năm của mình · ${display(anniversary)}.`;
    return {today, todayDisplay:display(today), elapsed, remaining, status};
  }
  return Object.freeze({at});
})();
