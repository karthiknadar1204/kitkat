import { db } from '../config/db.js';
import { sessions } from '../config/schema.js';
import { eq } from 'drizzle-orm';

export const createSession = async (req, res) => {
  const { appName } = req.body;
  const { id: userId } = req.user;
  const [newSession] = await db.insert(sessions).values({ userId, appName }).returning();
  res.status(201).json({ message: 'Session created', sessionId: newSession.id });
};

export const getSessions = async (req, res) => {
  const { id: userId } = req.user;
  const userSessions = await db.select().from(sessions).where(eq(sessions.userId, userId));
  res.json(userSessions);
};
