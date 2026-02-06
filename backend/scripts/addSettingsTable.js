import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = path.join(__dirname, '../database/jsStudy.db');

const db = new sqlite3.Database(dbPath);

console.log('Starting migration: Adding settings table...');

db.serialize(() => {
  // 1. Create settings table
  db.run(`
    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT UNIQUE NOT NULL,
      value TEXT NOT NULL,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) {
      console.error('Error creating settings table:', err);
      process.exit(1);
    }
    console.log('Settings table ready.');
  });

  // 2. Default settings to seed
  const defaultSettings = [
    { key: 'page_title_size', value: '2rem', description: '메인 페이지 타이틀 크기' },
    { key: 'page_subtitle_size', value: '1rem', description: '페이지 서브타이틀 크기' },
    { key: 'section_title_size', value: '1.5rem', description: '섹션 헤더(h2) 크기' },
    { key: 'base_font_size', value: '16px', description: '전체 기본 폰트 크기' },
    { key: 'code_font_size', value: '0.85rem', description: '코드 에디터 및 콘솔 폰트 크기' },
    { key: 'primary_color', value: '#667eea', description: '메인 포인트 색상' }
  ];

  // 3. Insert settings (using INSERT OR IGNORE to avoid duplicates if run multiple times)
  const stmt = db.prepare(`
    INSERT OR IGNORE INTO settings (key, value, description)
    VALUES (?, ?, ?)
  `);

  defaultSettings.forEach(setting => {
    stmt.run(setting.key, setting.value, setting.description);
  });

  stmt.finalize((err) => {
    if (err) {
      console.error('Error seeding settings:', err);
    } else {
      console.log('Default settings seeded successfully.');
    }
    
    db.close((err) => {
      if (err) {
        console.error('Error closing database:', err);
      } else {
        console.log('Migration complete.');
      }
    });
  });
});
