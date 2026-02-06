import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = path.join(__dirname, '../database/jsStudy.db');
const db = new sqlite3.Database(dbPath);

console.log('Adding comprehensive curriculum menus...');

db.serialize(() => {
  // New menu items to add
  const newMenus = [
    // CSS Foundations Group (parent_id: null, comes after "CSS Basics")
    { title: 'CSS Foundations', path: null, parent_id: null, order_index: 21, icon: '🏛️' },
    
    // Under CSS Foundations
    { title: 'Display Study', path: '/display', parent_id: 'FOUNDATIONS', order_index: 1, icon: '📐' },
    { title: 'Box Model Study', path: '/box-model', parent_id: 'FOUNDATIONS', order_index: 2, icon: '📦' },
    { title: 'Float & Clear Study', path: '/float', parent_id: 'FOUNDATIONS', order_index: 3, icon: '🌊' },
    
    // Visual & Design Group
    { title: 'Visual & Design', path: null, parent_id: null, order_index: 22, icon: '🎨' },
    
    // Under Visual & Design
    { title: 'Colors & Backgrounds', path: '/colors', parent_id: 'VISUAL', order_index: 1, icon: '🌈' },
    { title: 'Typography', path: '/typography', parent_id: 'VISUAL', order_index: 2, icon: '✍️' },
    
    // Interaction Group
    { title: 'Interaction', path: null, parent_id: null, order_index: 23, icon: '👆' },
    
    // Under Interaction
    { title: 'States & Pseudo-classes', path: '/interaction', parent_id: 'INTERACTION', order_index: 1, icon: '🔄' },
    { title: 'Form Styling', path: '/forms', parent_id: 'INTERACTION', order_index: 2, icon: '📝' },
    
    // Advanced Layout Group (or update existing "Advanced Topics")
    { title: 'Container Queries', path: '/container-queries', parent_id: 7, order_index: 3, icon: '📦' },
    { title: 'Stacking & Layers', path: '/stacking', parent_id: 7, order_index: 4, icon: '📚' },
    { title: 'Pseudo Elements', path: '/pseudo-elements', parent_id: 7, order_index: 5, icon: '::' }
  ];

  // First, get the ID for "Advanced Topics" (parent_id: 7)
  // Then insert new groups and items
  db.get('SELECT MAX(id) as maxId FROM menus', (err, row) => {
    if (err) {
      console.error('Error getting max ID:', err);
      db.close();
      return;
    }

    let currentId = row.maxId || 10;
    const groupIds = {};

    const stmt = db.prepare(`
      INSERT INTO menus (title, path, parent_id, order_index, icon)
      VALUES (?, ?, ?, ?, ?)
    `);

    newMenus.forEach((menu) => {
      currentId++;
      
      // Replace placeholder parent_id with actual IDs
      let actualParentId = menu.parent_id;
      if (menu.parent_id === 'FOUNDATIONS') {
        actualParentId = groupIds['CSS Foundations'];
      } else if (menu.parent_id === 'VISUAL') {
        actualParentId = groupIds['Visual & Design'];
      } else if (menu.parent_id === 'INTERACTION') {
        actualParentId = groupIds['Interaction'];
      }

      stmt.run(menu.title, menu.path, actualParentId, menu.order_index, menu.icon, function(err) {
        if (err) {
          console.error(`Error inserting ${menu.title}:`, err);
        } else {
          console.log(`✓ Added: ${menu.title}`);
          // Store group IDs for child references
          if (!menu.path) {
            groupIds[menu.title] = this.lastID;
          }
        }
      });
    });

    stmt.finalize((err) => {
      if (err) {
        console.error('Error finalizing statement:', err);
      } else {
        console.log('\n✅ All new menus added successfully!');
      }

      db.close((err) => {
        if (err) {
          console.error('Error closing database:', err);
        } else {
          console.log('Database connection closed.');
        }
      });
    });
  });
});
