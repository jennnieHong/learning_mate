import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = path.join(__dirname, '../database/jsStudy.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  // 1. "JS: Advanced Mechanics" 그룹 ID 찾기
  db.get("SELECT id FROM menus WHERE title = 'JS: Advanced Mechanics'", (err, row) => {
    if (err) {
      console.error('Error finding parent group:', err);
      db.close();
      return;
    }

    if (!row) {
      console.error('Parent group "JS: Advanced Mechanics" not found.');
      db.close();
      return;
    }

    const parentId = row.id;

    // 2. RegExp 메뉴 추가
    const menuData = {
      title: 'RegExp: Regular Expressions',
      path: '/js/regexp',
      parentId: parentId,
      order: 20,
      icon: '🧩'
    };

    db.run(
      'INSERT INTO menus (title, path, parent_id, order_index, icon) VALUES (?, ?, ?, ?, ?)',
      [menuData.title, menuData.path, menuData.parentId, menuData.order, menuData.icon],
      function(err) {
        if (err) {
          console.error('Error inserting RegExp menu:', err);
        } else {
          console.log(`✓ RegExp menu added successfully (ID: ${this.lastID})`);
        }
        db.close();
      }
    );
  });
});
