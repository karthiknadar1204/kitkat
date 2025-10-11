import { db } from '../config/db.js';
import { apiKeys } from '../config/schema.js';
import { eq } from 'drizzle-orm';

export const verifyApiKey = async (req, res, next) => {
  const apiKey = req.headers['x-api-key'] || req.query.apiKey;
  if (!apiKey) return res.status(401).json({ error: 'API key required' });

  const [keyRecord] = await db.select().from(apiKeys).where(eq(apiKeys.key, apiKey));
  if (!keyRecord) return res.status(403).json({ error: 'Invalid API key' });

  req.user = { id: keyRecord.userId };
  req.apiKeySession = keyRecord.sessionId; // Attach session ID from API key
  next();
};
