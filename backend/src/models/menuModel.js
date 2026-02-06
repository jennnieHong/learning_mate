import db from '../db/index.js';

// Menu model - handles all menu-related database operations
const menuModel = {
  // Get all menus
  getAllMenus: async () => {
    const sql = 'SELECT * FROM menus ORDER BY order_index, id';
    return await db.all(sql);
  },

  // Get menu by ID
  getMenuById: async (id) => {
    const sql = 'SELECT * FROM menus WHERE id = ?';
    return await db.get(sql, [id]);
  },

  // Get menu hierarchy (nested structure)
  getMenuHierarchy: async () => {
    const allMenus = await menuModel.getAllMenus();
    
    // Build hierarchy
    const menuMap = {};
    const rootMenus = [];

    // First pass: create menu map
    allMenus.forEach(menu => {
      menuMap[menu.id] = { ...menu, children: [] };
    });

    // Second pass: build hierarchy
    allMenus.forEach(menu => {
      if (menu.parent_id === null) {
        rootMenus.push(menuMap[menu.id]);
      } else if (menuMap[menu.parent_id]) {
        menuMap[menu.parent_id].children.push(menuMap[menu.id]);
      }
    });

    return rootMenus;
  }
};

export default menuModel;
