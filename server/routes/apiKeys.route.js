import express from 'express';
import { createApiKey, getApiKeys } from '../controllers/apiKeys.controller.js';
import { authenticateToken } from '../middlewares/auth.js';

const router = express.Router();
router.use(authenticateToken);
router.post('/', createApiKey);
router.get('/', getApiKeys);

export default router;
