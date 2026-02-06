import express from 'express';
import settingsController from '../controllers/settingsController.js';

const router = express.Router();

// Settings routes
router.get('/', settingsController.getSettings);

export default router;
