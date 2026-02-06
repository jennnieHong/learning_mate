import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = path.join(__dirname, '../database/jsStudy.db');
const db = new sqlite3.Database(dbPath);

console.log('Adding Symbol Deep Dive menu item...');

db.get('SELECT id FROM menus WHERE title LIKE "%Basics & Logic%" LIMIT 1', (err, parent) => {
  if (err) {
    console.error('Error finding parent:', err);
    db.close();
    return;
  }

  const parentId = parent ? parent.id : null;
  console.log('Found parent ID:', parentId);

  // Get current max order in this group
  db.get('SELECT MAX(order_index) as maxOrder FROM menus WHERE parent_id = ?', [parentId], (err, row) => {
    const nextOrder = (row && row.maxOrder ? row.maxOrder : 0) + 1;
    
    db.run(
      'INSERT INTO menus (title, path, parent_id, order_index, icon) VALUES (?, ?, ?, ?, ?)',
      ['7. Symbol Deep Dive', '/js/symbol', parentId, nextOrder, '🔮'],
      function(err) {
        if (err) {
          console.error('Error inserting menu:', err);
        } else {
          console.log(`✅ Success: Added Symbol menu item with ID ${this.lastID} at order ${nextOrder}`);
        }
        db.close();
      }
    );
  });
});
