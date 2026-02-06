const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../database/jsStudy.db');
const db = new sqlite3.Database(dbPath);

console.log('=== Checking All Menu Items ===\n');

db.all(`SELECT id, title, path, parent_id, order_index, icon FROM menus ORDER BY CASE WHEN parent_id IS NULL THEN 0 ELSE 1 END, parent_id, order_index`, [], (err, rows) => {
  if (err) {
    console.error('Error:', err);
    process.exit(1);
  }
  
  if (!rows || rows.length === 0) {
    console.log('No menu items found!');
    db.close();
    return;
  }
  
  console.log('Total menu items:', rows.length);
  console.log('\n=== Menu Structure ===\n');
  
  rows.forEach(row => {
    const indent = row.parent_id ? '  ' : '';
    const pathInfo = row.path ? ` → ${row.path}` : ' (group)';
    console.log(`${indent}${row.icon || '•'} ${row.title}${pathInfo}`);
  });
  
  console.log('\n=== Routes Required ===');
  const routes = rows.filter(r => r.path).map(r => r.path);
  console.log('Total routes:', routes.length);
  routes.forEach(route => console.log(`  ${route}`));
  
  db.close();
});
