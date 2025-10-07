import { v4 as uuidv4 } from 'uuid';
import { db } from '../config/db.js';
import { apiKeys } from '../config/schema.js';
import { eq } from 'drizzle-orm';

export const createApiKey = async (req, res) => {
  const { name } = req.body;
  const { id: userId } = req.user;
  const key = `lsv2_${uuidv4().replace(/-/g, '')}`.substring(0, 64);
  const [newKey] = await db.insert(apiKeys).values({ userId, key, name }).returning();
  res.status(201).json({ message: 'API key created', key, id: newKey.id });
};

export const getApiKeys = async (req, res) => {
  const { id: userId } = req.user;
  const userKeys = await db.select().from(apiKeys).where(eq(apiKeys.userId, userId));
  res.json(userKeys.map(k => ({ id: k.id, name: k.name, createdAt: k.createdAt })));
};
