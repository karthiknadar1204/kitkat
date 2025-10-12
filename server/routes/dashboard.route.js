import express from 'express';
import { getDashboardTraces, getDashboardStats } from '../controllers/dashboard.controller.js';
import { authenticateToken } from '../middlewares/auth.js';

const router = express.Router();
router.use(authenticateToken);
router.get('/traces/:sessionId', getDashboardTraces);
router.get('/stats/:sessionId', getDashboardStats);

export default router;

