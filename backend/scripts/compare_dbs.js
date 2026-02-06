import sqlite3 from 'sqlite3';
import path from 'path';

async function checkDb(label, dbPath) {
  return new Promise((resolve) => {
    const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
      if (err) {
        resolve(`${label} (${dbPath}): Error opening - ${err.message}`);
        return;
      }
      db.all('SELECT title FROM menus ORDER BY id LIMIT 3', (err, rows) => {
        if (err) {
          resolve(`${label} (${dbPath}): Error reading - ${err.message}`);
        } else {
          const titles = rows.map(r => r.title).join(', ');
          resolve(`${label} [${dbPath}]: ${titles}`);
        }
        db.close();
      });
    });
  });
}

const dbD = 'D:/workspace/javascript/backend/database/jsStudy.db';
const dbC = 'C:/workspace/cssStudy/backend/database/jsStudy.db';

const results = await Promise.all([
  checkDb('D Drive', dbD),
  checkDb('C Drive', dbC)
]);

console.log(results.join('\n'));
