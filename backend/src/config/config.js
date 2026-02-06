import dotenv from 'dotenv';

dotenv.config();

const config = {
  env: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 3000,
  db: {
    type: process.env.DB_TYPE || 'sqlite',
    sqlite: {
      path: process.env.SQLITE_PATH || './database/jsStudy.db'
    },
    postgresql: {
      host: process.env.PG_HOST || 'localhost',
      port: process.env.PG_PORT || 5432,
      database: process.env.PG_DATABASE || 'cssstudy',
      user: process.env.PG_USER || 'postgres',
      password: process.env.PG_PASSWORD || 'password'
    }
  }
};

export default config;
