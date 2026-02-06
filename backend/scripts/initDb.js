import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = path.join(__dirname, '../database/jsStudy.db');
const dbDir = path.dirname(dbPath);

// Create database directory if it doesn't exist
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new sqlite3.Database(dbPath);

// Initialize database
db.serialize(() => {
  // Create menus table
  db.run(`
    CREATE TABLE IF NOT EXISTS menus (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      path TEXT,
      parent_id INTEGER,
      order_index INTEGER DEFAULT 0,
      icon TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (parent_id) REFERENCES menus(id)
    )
  `, (err) => {
    if (err) {
      console.error('Error creating table:', err);
    } else {
      console.log('Menus table created successfully');
    }
  });

  // Check if data already exists
  db.get('SELECT COUNT(*) as count FROM menus', (err, row) => {
    if (err) {
      console.error('Error checking data:', err);
      return;
    }

    if (row.count > 0) {
      console.log('Database already contains data. Skipping seed.');
      db.close();
      return;
    }

    // Insert sample menu data
    const menus = [
      { title: 'Home', path: '/', parent_id: null, order_index: 1, icon: '🏠' },
      { title: 'CSS Basics', path: null, parent_id: null, order_index: 2, icon: '📚' },
      { title: 'Flexbox Study', path: '/flexbox', parent_id: 2, order_index: 1, icon: '📦' },
      { title: 'Grid Study', path: '/grid', parent_id: 2, order_index: 2, icon: '🎯' },
      { title: 'Animation Study', path: '/animation', parent_id: 2, order_index: 3, icon: '✨' },
      { title: 'Responsive Study', path: '/responsive', parent_id: 2, order_index: 4, icon: '📱' },
      { title: 'Advanced Topics', path: null, parent_id: null, order_index: 3, icon: '🚀' },
      { title: 'Custom Properties', path: '/custom-properties', parent_id: 7, order_index: 1, icon: '🎨' },
      { title: 'CSS Architecture', path: '/architecture', parent_id: 7, order_index: 2, icon: '🏗️' }
    ];

    const stmt = db.prepare(`
      INSERT INTO menus (title, path, parent_id, order_index, icon)
      VALUES (?, ?, ?, ?, ?)
    `);

    menus.forEach(menu => {
      stmt.run(menu.title, menu.path, menu.parent_id, menu.order_index, menu.icon);
    });

    stmt.finalize((err) => {
      if (err) {
        console.error('Error inserting data:', err);
      } else {
        console.log('Sample menu data inserted successfully');
      }
      
      db.close((err) => {
        if (err) {
          console.error('Error closing database:', err);
        } else {
          console.log('Database initialization complete');
        }
      });
    });
  });
});
