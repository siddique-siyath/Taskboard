const mysql = require('mysql2/promise');
const { db } = require('./env');

// dateStrings keeps DATE columns as 'YYYY-MM-DD' (no timezone shifting).
const pool = mysql.createPool({
  ...db,
  waitForConnections: true,
  connectionLimit: 10,
  dateStrings: true,
});

/** Runs `work(conn)` inside a transaction; commits on success, rolls back on error. */
async function withTransaction(work) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const result = await work(conn);
    await conn.commit();
    return result;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

module.exports = { pool, withTransaction };
