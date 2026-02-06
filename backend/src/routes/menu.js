import express from 'express';
import menuController from '../controllers/menuController.js';

const router = express.Router();

// Menu routes
router.get('/', menuController.getAllMenus);
router.get('/:id', menuController.getMenuById);

export default router;
