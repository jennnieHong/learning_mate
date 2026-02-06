import settingsModel from '../models/settingsModel.js';

const settingsController = {
  // GET /api/settings - Get all application settings
  getSettings: async (req, res) => {
    try {
      const settings = await settingsModel.getAllSettings();
      res.json({
        success: true,
        data: settings
      });
    } catch (error) {
      console.error('Error fetching settings:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch settings'
      });
    }
  }
};

export default settingsController;
