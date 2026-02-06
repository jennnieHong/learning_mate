import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = path.join(__dirname, '../database/jsStudy.db');
const db = new sqlite3.Database(dbPath);

const menu = { 
  title: 'Modern Viewport Units', 
  path: '/viewport-units', 
  parent_id: 1, // Under "Units & Sizing" or similar
  order_index: 2, // After Units (usually 1)
  icon: '📱' 
};

db.run(
  'INSERT INTO menus (title, path, parent_id, order_index, icon) VALUES (?, ?, ?, ?, ?)',
  [menu.title, menu.path, menu.parent_id, menu.order_index, menu.icon],
  function(err) {
    if (err) {
      console.error('Error inserting menu:', err);
    } else {
      console.log(`✓ Added menu: ${menu.title} (ID: ${this.lastID})`);
    }
    db.close();
  }
);
