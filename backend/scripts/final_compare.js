import sqlite3 from 'sqlite3';

function getTitles(dbPath) {
  return new Promise((resolve) => {
    const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
      if (err) { resolve(`Error: ${err.message}`); return; }
      db.all('SELECT title FROM menus ORDER BY id LIMIT 3', (err, rows) => {
        if (err) resolve(`Error: ${err.message}`);
        else resolve(rows.map(r => r.title));
        db.close();
      });
    });
  });
}

const dTitles = await getTitles('D:/workspace/javascript/backend/database/jsStudy.db');
const cTitles = await getTitles('C:/workspace/cssStudy/backend/database/jsStudy.db');

console.log('--- DATABASE COMPARISON ---');
console.log('D-Drive (JS Project):', JSON.stringify(dTitles));
console.log('C-Drive (CSS Project):', JSON.stringify(cTitles));
console.log('---------------------------');
