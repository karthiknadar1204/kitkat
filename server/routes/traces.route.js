import express from 'express';
import { ingestTrace, getTraces, getStats } from '../controllers/traces.controller.js';
import { verifyApiKey } from '../middlewares/apiKeyAuth.js';

const router = express.Router();
router.use(verifyApiKey);
router.post('/', ingestTrace);
router.get('/', getTraces);
router.get('/stats', getStats);

export default router;