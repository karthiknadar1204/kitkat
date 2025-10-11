import { v4 as uuidv4 } from 'uuid';
import { db } from '../config/db.js';
import { apiKeys, sessions } from '../config/schema.js';
import { eq } from 'drizzle-orm';

export const createApiKey = async (req, res) => {
  const { name, sessionId } = req.body;
  const { id: userId } = req.user;
  
  if (!sessionId) {
    return res.status(400).json({ error: 'sessionId is required' });
  }
  
  // Verify session belongs to user
  const [session] = await db.select().from(sessions).where(eq(sessions.id, sessionId));
  if (!session || session.userId !== userId) {
    return res.status(403).json({ error: 'Invalid session or access denied' });
  }
  
  const key = `lsv2_${uuidv4().replace(/-/g, '')}`.substring(0, 64);
  const [newKey] = await db.insert(apiKeys).values({ userId, sessionId, key, name }).returning();
  res.status(201).json({ message: 'API key created', key, id: newKey.id, sessionId });
};

export const getApiKeys = async (req, res) => {
  const { id: userId } = req.user;
  const { sessionId } = req.query;
  
  let userKeys;
  if (sessionId) {
    // Get keys for specific session
    userKeys = await db.select().from(apiKeys).where(eq(apiKeys.sessionId, parseInt(sessionId)));
  } else {
    // Get all user's keys
    userKeys = await db.select().from(apiKeys).where(eq(apiKeys.userId, userId));
  }
  
  res.json(userKeys.map(k => ({ id: k.id, name: k.name, sessionId: k.sessionId, createdAt: k.createdAt })));
};
