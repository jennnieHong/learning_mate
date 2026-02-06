import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = path.join(__dirname, '../database/jsStudy.db');
const db = new sqlite3.Database(dbPath);

const UNITS_MENU = {
  title: 'Units (단위)',
  path: '/units',
  parent_id: 4, // Under Visual & Design
  order_index: 3,
  icon: '📏'
};

db.serialize(() => {
  // Check if it exists
  db.get('SELECT id FROM menus WHERE path = ?', [UNITS_MENU.path], (err, row) => {
    if (err) {
      console.error('Error checking menu:', err);
      db.close();
      return;
    }

    if (row) {
      console.log('Units menu already exists.');
      db.close();
    } else {
      const stmt = db.prepare(`
        INSERT INTO menus (title, path, parent_id, order_index, icon)
        VALUES (?, ?, ?, ?, ?)
      `);
      
      stmt.run(
        UNITS_MENU.title, 
        UNITS_MENU.path, 
        UNITS_MENU.parent_id, 
        UNITS_MENU.order_index, 
        UNITS_MENU.icon,
        function(err) {
          if (err) {
            console.error('Error inserting menu:', err);
          } else {
            console.log('Units menu inserted with ID:', this.lastID);
          }
          stmt.finalize();
          db.close();
        }
      );
    }
  });
});
