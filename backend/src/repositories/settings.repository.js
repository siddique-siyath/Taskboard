const { pool } = require('../config/db');

const toDto = (r) => ({ dailyPointLimit: r.daily_point_limit, weeklyPointLimit: r.weekly_point_limit, updatedAt: r.updated_at });

/** Pass `conn` + lock=true inside a transaction to serialise capacity-affecting writes. */
async function get(conn = pool, { lock = false } = {}) {
  const [rows] = await conn.query(`SELECT * FROM settings WHERE id = 1 ${lock ? 'FOR UPDATE' : ''}`);
  return rows[0] ? toDto(rows[0]) : null;
}

async function update({ dailyPointLimit, weeklyPointLimit }) {
  await pool.query(
    `INSERT INTO settings (id, daily_point_limit, weekly_point_limit) VALUES (1, ?, ?)
     ON DUPLICATE KEY UPDATE daily_point_limit = VALUES(daily_point_limit), weekly_point_limit = VALUES(weekly_point_limit)`,
    [dailyPointLimit, weeklyPointLimit],
  );
  return get();
}

module.exports = { get, update };
