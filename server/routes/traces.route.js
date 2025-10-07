import express from 'express';
import { ingestTrace, getTraces, getStats } from '../controllers/traces.controller.js';
import { authenticateToken } from '../middlewares/auth.js';

const router = express.Router();
router.use(authenticateToken);
router.post('/', ingestTrace);
router.get('/', getTraces);
router.get('/stats', getStats);

export default router;