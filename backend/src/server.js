const { port } = require('./config/env');
const { pool } = require('./config/db');
const app = require('./app');

(async () => {
  try {
    await pool.query('SELECT 1');
    app.listen(port, () => console.log(`Task Board API running on http://localhost:${port}`));
  } catch (err) {
    console.error('Could not connect to MySQL. Check your .env DB settings:', err.message);
    process.exit(1);
  }
})();
