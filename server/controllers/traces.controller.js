import { v4 as uuidv4 } from 'uuid';
import Trace from '../models/trace.model.js';
import { eq } from 'drizzle-orm';
import { sessions, stats } from '../config/schema.js';  
import { db } from '../config/db.js';
import { processTraceStats } from '../services/statsWorker.js';

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
  

  processTraceStats(sessionId, spans);
  
  res.status(201).json({ message: 'Trace ingested', traceId });
};

export const getTraces = async (req, res) => {
  const { id: userId } = req.user;
  const { sessionId } = req.query;  
  const filter = sessionId ? { userId, sessionId: parseInt(sessionId) } : { userId };
  const traces = await Trace.find(filter).sort({ createdAt: -1 }).limit(20);
  res.json(traces);
};

export const getStats = async (req, res) => {
  const { id: userId } = req.user;
  const { sessionId } = req.query;
  const userSessions = await db.select().from(sessions).where(eq(sessions.userId, userId));
  const validSessionIds = userSessions.map(s => s.id);

  let sessionStats;
  if (sessionId) {
    sessionStats = await db.select().from(stats).where(eq(stats.sessionId, parseInt(sessionId)));
  } else {
    sessionStats = await db.select().from(stats);
  }
  
  res.json(sessionStats.filter(stat => validSessionIds.includes(stat.sessionId)));
};