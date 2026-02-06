import pg from 'pg';
import config from '../config/config.js';

const { Pool } = pg;

// PostgreSQL connection pool
const pool = new Pool({
  host: config.db.postgresql.host,
  port: config.db.postgresql.port,
  database: config.db.postgresql.database,
  user: config.db.postgresql.user,
  password: config.db.postgresql.password
});

pool.on('connect', () => {
  console.log('Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('PostgreSQL connection error:', err);
});

// Unified interface matching SQLite
const postgresqlDb = {
  all: async (sql, params = []) => {
    const result = await pool.query(sql, params);
    return result.rows;
  },

  get: async (sql, params = []) => {
    const result = await pool.query(sql, params);
    return result.rows[0];
  },

  run: async (sql, params = []) => {
    const result = await pool.query(sql, params);
    return { 
      lastID: result.rows[0]?.id, 
      changes: result.rowCount 
    };
  }
};

export default postgresqlDb;
