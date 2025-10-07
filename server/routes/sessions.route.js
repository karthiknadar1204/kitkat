import express from 'express';
import { createSession, getSessions } from '../controllers/sessions.controller.js';
import { authenticateToken } from '../middlewares/auth.js';

const router = express.Router();
router.use(authenticateToken);  // Protect all
router.post('/', createSession);
router.get('/', getSessions);

export default router;
