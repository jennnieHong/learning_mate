import sqlite3 from 'sqlite3';
const dbPath = 'C:/workspace/cssStudy/backend/database/jsStudy.db';
const db = new sqlite3.Database(dbPath);
db.all('SELECT title FROM menus LIMIT 5', (err, rows) => {
  if (err) console.error(err);
  else console.log(JSON.stringify(rows, null, 2));
  db.close();
});
