const ISO = /^\d{4}-\d{2}-\d{2}$/;

function isValidIsoDate(value) {
  if (typeof value !== 'string' || !ISO.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

const toIso = (d) => d.toISOString().slice(0, 10);

/** Monday-Sunday week that contains the given YYYY-MM-DD date (pure UTC math, no timezone drift). */
function weekRange(value) {
  const d = new Date(`${value}T00:00:00Z`);
  const offsetFromMonday = (d.getUTCDay() + 6) % 7;
  const start = new Date(d);
  start.setUTCDate(d.getUTCDate() - offsetFromMonday);
  const end = new Date(start);
  end.setUTCDate(start.getUTCDate() + 6);
  return { start: toIso(start), end: toIso(end) };
}

module.exports = { isValidIsoDate, weekRange };
