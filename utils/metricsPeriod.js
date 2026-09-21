function getMonthRange(value, now = new Date()) {
  const match = /^(\d{4})-(\d{2})$/.exec(String(value || ''));
  const year = match ? Number(match[1]) : now.getFullYear();
  const month = match ? Number(match[2]) - 1 : now.getMonth();
  if (month < 0 || month > 11) return null;

  return {
    start: new Date(year, month, 1),
    end: new Date(year, month + 1, 1),
    key: `${year}-${String(month + 1).padStart(2, '0')}`
  };
}

function getPreviousMonthRange(range) {
  return {
    start: new Date(range.start.getFullYear(), range.start.getMonth() - 1, 1),
    end: range.start
  };
}

function percentageChange(current, previous) {
  if (!previous) return current ? 100 : 0;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

module.exports = { getMonthRange, getPreviousMonthRange, percentageChange };
