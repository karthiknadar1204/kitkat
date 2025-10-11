import express from 'express';
import { getDashboardTraces, getDashboardStats, getTimeSeriesData, triggerSnapshot } from '../controllers/dashboard.controller.js';
import { authenticateToken } from '../middlewares/auth.js';

const router = express.Router();
router.use(authenticateToken);
router.get('/traces/:sessionId', getDashboardTraces);
router.get('/stats/:sessionId', getDashboardStats);
router.get('/timeseries/:sessionId', getTimeSeriesData);
router.post('/snapshot/:sessionId', triggerSnapshot); // Manual trigger for testing

export default router;

