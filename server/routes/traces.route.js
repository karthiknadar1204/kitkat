import express from 'express';
import { ingestTrace, getTraces } from '../controllers/traces.controller.js';
import { authenticateToken } from '../middlewares/auth.js';

const router = express.Router();
router.use(authenticateToken);
router.post('/', ingestTrace);
router.get('/', getTraces);

export default router;