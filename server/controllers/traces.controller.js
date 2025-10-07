import { v4 as uuidv4 } from 'uuid';
import Trace from '../models/trace.model.js';
import { eq } from 'drizzle-orm';
import { sessions } from '../config/schema.js';  // To validate session
import { db } from '../config/db.js';

export const ingestTrace = async (req, res) => {
  const { sessionId, appName, spans, metadata = {} } = req.body;
  const { id: userId } = req.user;

  const [session] = await db.select().from(sessions).where(eq(sessions.id, sessionId));
  if (!session || session.userId !== userId) {
    return res.status(404).json({ error: 'Invalid session' });
  }

  const traceId = uuidv4();
  const newTrace = new Trace({
    traceId,
    userId,
    sessionId,
    appName,
    spans,
    metadata,
  });
  await newTrace.save();
  res.status(201).json({ message: 'Trace ingested', traceId });
};

export const getTraces = async (req, res) => {
  const { id: userId } = req.user;
  const { sessionId } = req.query;  
  const filter = sessionId ? { userId, sessionId: parseInt(sessionId) } : { userId };
  const traces = await Trace.find(filter).sort({ createdAt: -1 }).limit(20);
  res.json(traces);
};