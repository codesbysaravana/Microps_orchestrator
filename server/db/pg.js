const { Pool } = require('pg');

require('dotenv').config();

const pool = new Pool({
  user: process.env.PG_USER || 'postgres',
  host: process.env.PG_HOST || 'localhost',
  database: process.env.PG_DATABASE || 'microps',
  password: process.env.PG_PASSWORD || '1111',
  port: process.env.PG_PORT ? parseInt(process.env.PG_PORT, 10) : 5432,
});

module.exports = { pool }

async function queryDatabase() {
  try {
    const res = await pool.query('SELECT NOW()');
    //console.log('Current Time:', res.rows[0]);
  } catch (err) {
    console.error('Database query error:', err.stack);
  } finally {
    await pool.end();
  }
}

module.exports = { createUser, fetchUser, projectsDB };