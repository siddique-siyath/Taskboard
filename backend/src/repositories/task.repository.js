const { pool } = require('../config/db');

const COLUMNS = `id, title, description, story_points, priority, status, planned_date, due_date, created_at, updated_at`;

const toDto = (r) => ({
  id: r.id,
  title: r.title,
  description: r.description,
  storyPoints: r.story_points,
  priority: r.priority,
  status: r.status,
  plannedDate: r.planned_date,
  dueDate: r.due_date,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

// Whitelist: user input never reaches ORDER BY directly (prevents SQL injection).
const SORT_COLUMNS = {
  title: 'title',
  storyPoints: 'story_points',
  priority: 'priority', // ENUM sorts by declaration order: Low < Medium < High < Critical
  status: 'status',
  plannedDate: 'planned_date',
  dueDate: 'due_date',
  createdAt: 'created_at',
};

const escapeLike = (s) => s.replace(/[\\%_]/g, '\\$&');

async function findPage({ search, priority, status, sortBy, sortOrder, page, limit }) {
  const where = [];
  const params = [];
  if (search) { where.push('title LIKE ?'); params.push(`%${escapeLike(search)}%`); }
  if (priority) { where.push('priority = ?'); params.push(priority); }
  if (status) { where.push('status = ?'); params.push(status); }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const order = `${SORT_COLUMNS[sortBy]} ${String(sortOrder).toUpperCase() === 'DESC' ? 'DESC' : 'ASC'}`;

  const [[{ total }]] = await pool.query(`SELECT COUNT(*) AS total FROM tasks ${whereSql}`, params);
  const [rows] = await pool.query(
    `SELECT ${COLUMNS} FROM tasks ${whereSql} ORDER BY ${order}, id ASC LIMIT ? OFFSET ?`,
    [...params, limit, (page - 1) * limit],
  );
  return { items: rows.map(toDto), total };
}

async function findAll() {
  const [rows] = await pool.query(`SELECT ${COLUMNS} FROM tasks ORDER BY planned_date ASC, id ASC`);
  return rows.map(toDto);
}

async function findById(id, conn = pool, { lock = false } = {}) {
  const [rows] = await conn.query(`SELECT ${COLUMNS} FROM tasks WHERE id = ? ${lock ? 'FOR UPDATE' : ''}`, [id]);
  return rows[0] ? toDto(rows[0]) : null;
}

async function insert(t, conn = pool) {
  const [res] = await conn.query(
    `INSERT INTO tasks (title, description, story_points, priority, status, planned_date, due_date) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [t.title, t.description || null, t.storyPoints, t.priority, t.status, t.plannedDate, t.dueDate || null],
  );
  return res.insertId;
}

async function update(id, t, conn = pool) {
  await conn.query(
    `UPDATE tasks SET title = ?, description = ?, story_points = ?, priority = ?, status = ?, planned_date = ?, due_date = ? WHERE id = ?`,
    [t.title, t.description || null, t.storyPoints, t.priority, t.status, t.plannedDate, t.dueDate || null, id],
  );
}

async function updateStatus(id, status, conn = pool) {
  await conn.query('UPDATE tasks SET status = ? WHERE id = ?', [status, id]);
}

async function remove(id) {
  const [res] = await pool.query('DELETE FROM tasks WHERE id = ?', [id]);
  return res.affectedRows > 0;
}

/** Sum of story points for tasks with the given statuses between two dates (inclusive). */
async function sumPoints({ from, to, statuses, excludeId }, conn = pool) {
  const params = [from, to, statuses];
  let sql = 'SELECT COALESCE(SUM(story_points), 0) AS points FROM tasks WHERE planned_date BETWEEN ? AND ? AND status IN (?)';
  if (excludeId) { sql += ' AND id <> ?'; params.push(excludeId); }
  const [[row]] = await conn.query(sql, params);
  return Number(row.points);
}

async function summary() {
  const [rows] = await pool.query('SELECT status, COUNT(*) AS count, COALESCE(SUM(story_points), 0) AS points FROM tasks GROUP BY status');
  return rows;
}

module.exports = { findPage, findAll, findById, insert, update, updateStatus, remove, sumPoints, summary };
