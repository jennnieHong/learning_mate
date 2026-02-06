import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = path.join(__dirname, '../database/jsStudy.db');
const db = new sqlite3.Database(dbPath);

const POSITION_MENU = {
  title: 'Position Study',
  path: '/position',
  parent_id: 2, // Under CSS Basics
  order_index: 5,
  icon: '📌'
};

db.serialize(() => {
  // Check if it exists
  db.get('SELECT id FROM menus WHERE path = ?', [POSITION_MENU.path], (err, row) => {
    if (err) {
      console.error('Error checking menu:', err);
      db.close();
      return;
    }

    if (row) {
      console.log('Position Study menu already exists.');
      db.close();
    } else {
      const stmt = db.prepare(`
        INSERT INTO menus (title, path, parent_id, order_index, icon)
        VALUES (?, ?, ?, ?, ?)
      `);
      
      stmt.run(
        POSITION_MENU.title, 
        POSITION_MENU.path, 
        POSITION_MENU.parent_id, 
        POSITION_MENU.order_index, 
        POSITION_MENU.icon,
        function(err) {
          if (err) {
            console.error('Error inserting menu:', err);
          } else {
            console.log('Position Study menu inserted with ID:', this.lastID);
          }
          stmt.finalize();
          db.close();
        }
      );
    }
  });
});
