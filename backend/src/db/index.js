import config from '../config/config.js';
import sqliteDb from './sqlite.js';
import postgresqlDb from './postgresql.js';

// Database abstraction layer - automatically selects the correct database
const db = config.db.type === 'postgresql' ? postgresqlDb : sqliteDb;

export default db;
