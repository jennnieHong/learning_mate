const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

export const api = {
  // Fetch all menus
  getMenus: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/menus`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching menus:', error);
      throw error;
    }
  },

  // Fetch menu by ID
  getMenuById: async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/menus/${id}`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching menu:', error);
      throw error;
    }
  }
};
