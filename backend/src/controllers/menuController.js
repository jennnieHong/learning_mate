import menuModel from '../models/menuModel.js';

// Menu controller - handles HTTP requests for menu endpoints
const menuController = {
  // GET /api/menus - Get all menus with hierarchy
  getAllMenus: async (req, res) => {
    try {
      const menus = await menuModel.getMenuHierarchy();
      res.json({
        success: true,
        data: menus
      });
    } catch (error) {
      console.error('Error fetching menus:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch menus'
      });
    }
  },

  // GET /api/menus/:id - Get specific menu by ID
  getMenuById: async (req, res) => {
    try {
      const { id } = req.params;
      const menu = await menuModel.getMenuById(id);
      
      if (!menu) {
        return res.status(404).json({
          success: false,
          error: 'Menu not found'
        });
      }

      res.json({
        success: true,
        data: menu
      });
    } catch (error) {
      console.error('Error fetching menu:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch menu'
      });
    }
  }
};

export default menuController;
