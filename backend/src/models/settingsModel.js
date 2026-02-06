import db from '../db/index.js';

const settingsModel = {
  // Get all settings as a key-value pair object
  getAllSettings: async () => {
    const sql = 'SELECT key, value FROM settings';
    const rows = await db.all(sql);
    
    // Convert array of rows to a single object: { key1: value1, key2: value2 }
    return rows.reduce((acc, row) => {
      acc[row.key] = row.value;
      return acc;
    }, {});
  }
};

export default settingsModel;
