import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = path.join(__dirname, '../database/jsStudy.db');
const db = new sqlite3.Database(dbPath);

console.log('Adding Attributes & JS Menu item...');

db.serialize(() => {
  // 아이디 7번 (Advanced Topics) 하위에 추가
  const title = 'Attributes & JS';
  const path = '/attributes-js';
  const parent_id = 7;
  const order_index = 6;
  const icon = '⚙️';

  db.run(`
    INSERT INTO menus (title, path, parent_id, order_index, icon)
    VALUES (?, ?, ?, ?, ?)
  `, [title, path, parent_id, order_index, icon], function(err) {
    if (err) {
      console.error('Error inserting menu:', err);
    } else {
      console.log(`✅ Success: Added "${title}" menu item with ID ${this.lastID}`);
    }
    db.close();
  });
});
