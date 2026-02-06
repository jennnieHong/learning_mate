import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = path.join(__dirname, '../database/jsStudy.db');
const db = new sqlite3.Database(dbPath);

// Find parent_id for Interaction category
db.get('SELECT id FROM menus WHERE title LIKE "%Interaction%" LIMIT 1', (err, row) => {
  if (err) {
    console.error('Error finding parent:', err);
    db.close();
    return;
  }
  
  const parentId = row ? row.id : null;
  console.log('Found parent ID:', parentId);
  
  db.run(
    'INSERT INTO menus (title, path, parent_id, order_index, icon) VALUES (?, ?, ?, ?, ?)',
    ['Modal & Popup 패턴', '/modal-pattern', parentId, 2, '🪟'],
    function(err) {
      if (err) {
        console.error('Error inserting menu:', err);
      } else {
        console.log('✓ Added menu: Modal & Popup 패턴 (ID: ' + this.lastID + ')');
      }
      db.close();
    }
  );
});
