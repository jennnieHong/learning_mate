import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = path.join(__dirname, '../database/jsStudy.db');
const db = new sqlite3.Database(dbPath);

console.log('🚀 Initializing JavaScript Curriculum...');

db.serialize(() => {
  // 1. Clear existing menus
  db.run('DELETE FROM menus', (err) => {
    if (err) console.error('Error clearing menus:', err);
    else console.log('✅ Existing menus cleared.');
  });

  // 2. Define JS Curriculum Structure
  const curriculum = [
    // Parent Groups
    { title: 'JavaScript 기초', path: null, parent_id: null, order_index: 1, icon: '🚀' },
    { title: '제어 흐름', path: null, parent_id: null, order_index: 2, icon: '🔀' },
    { title: '함수와 스코프', path: null, parent_id: null, order_index: 3, icon: '🎯' },
    { title: '객체와 배열', path: null, parent_id: null, order_index: 4, icon: '📦' },
    { title: '브라우저와 DOM', path: null, parent_id: null, order_index: 5, icon: '🌐' },
    { title: '비동기 프로그래밍', path: null, parent_id: null, order_index: 6, icon: '⏳' },

    // JS Basics Sub-items
    { title: '변수와 데이터 타입', path: '/js-basics/variables', parent_name: 'JavaScript 기초', order_index: 1, icon: '💎' },
    { title: '기본 연산자', path: '/js-basics/operators', parent_name: 'JavaScript 기초', order_index: 2, icon: '🧮' },

    // Control Flow Sub-items
    { title: '조건문 (if, switch)', path: '/js-control/conditionals', parent_name: '제어 흐름', order_index: 1, icon: '❓' },
    { title: '반복문 (for, while)', path: '/js-control/loops', parent_name: '제어 흐름', order_index: 2, icon: '🔁' },

    // Functions Sub-items
    { title: '함수 선언과 호출', path: '/js-functions/basics', parent_name: '함수와 스코프', order_index: 1, icon: '📣' },
    { title: '화살표 함수 & This', path: '/js-functions/arrow', parent_name: '함수와 스코프', order_index: 2, icon: '🏹' },

    // Objects & Arrays Sub-items
    { title: '배열과 고차 함수', path: '/js-objects/arrays', parent_name: '객체와 배열', order_index: 1, icon: '📜' },
    { title: '객체와 구조 분해', path: '/js-objects/objects', parent_name: '객체와 배열', order_index: 2, icon: '🏗️' },

    // DOM Sub-items
    { title: '요소 선택과 수정', path: '/js-dom/manipulation', parent_name: '브라우저와 DOM', order_index: 1, icon: '🎨' },
    { title: '이벤트 핸들링', path: '/js-dom/events', parent_name: '브라우저와 DOM', order_index: 2, icon: '⚡' },

    // Async Sub-items
    { title: 'Promise & Async/Await', path: '/js-async/basics', parent_name: '비동기 프로그래밍', order_index: 1, icon: '🤝' },
    { title: 'Fetch API & 서버 통신', path: '/js-async/fetch', parent_name: '비동기 프로그래밍', order_index: 2, icon: '📡' },
  ];

  const groupMap = {};

  // Insert Groups First
  const insertStmt = db.prepare(`
    INSERT INTO menus (title, path, parent_id, order_index, icon)
    VALUES (?, ?, ?, ?, ?)
  `);

  const groups = curriculum.filter(m => m.path === null);
  const items = curriculum.filter(m => m.path !== null);

  groups.forEach(g => {
    insertStmt.run(g.title, g.path, null, g.order_index, g.icon, function(err) {
      if (err) console.error(`Error inserting group ${g.title}:`, err);
      else {
        groupMap[g.title] = this.lastID;
        console.log(`Added group: ${g.title} (ID: ${this.lastID})`);
        
        // After all groups are inserted, process items belonging to this group
        const groupItems = items.filter(i => i.parent_name === g.title);
        groupItems.forEach(item => {
          insertStmt.run(item.title, item.path, this.lastID, item.order_index, item.icon, (err) => {
            if (err) console.error(`Error inserting item ${item.title}:`, err);
            else console.log(`  Added item: ${item.title}`);
          });
        });
      }
    });
  });

  setTimeout(() => {
    insertStmt.finalize();
    db.close(() => console.log('\n✅ Database reset to JS Curriculum complete.'));
  }, 1000);
});
