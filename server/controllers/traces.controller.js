import { v4 as uuidv4 } from 'uuid';
import Trace from '../models/trace.model.js';
import { eq } from 'drizzle-orm';
import { sessions, stats } from '../config/schema.js';  
import { db } from '../config/db.js';
import { processTraceStats } from '../services/statsWorker.js';

export const ingestTrace = async (req, res) => {
  const { sessionId, appName, spans, metadata = {} } = req.body;
  const { id: userId } = req.user;
  const apiKeySessionId = req.apiKeySession; // Session ID from the API key

  let finalSessionId = sessionId;
  
  // Validate API key is bound to a session
  if (!apiKeySessionId) {
    return res.status(403).json({ 
      error: 'API key not bound to a project. Please generate a new API key from your dashboard.' 
    });
  }
  
  if (!sessionId) {
    // If no sessionId provided, use the one from API key
    finalSessionId = apiKeySessionId;
    console.log(`Using API key's bound session ${finalSessionId}`);
  } else {
    // If sessionId provided, validate it matches the API key's session
    if (sessionId !== apiKeySessionId) {
      return res.status(403).json({ 
        error: `API key is bound to a different project. This key can only be used for session ${apiKeySessionId}.` 
      });
    }
    finalSessionId = sessionId;
  }
  
  // Verify session exists and belongs to user
  const [session] = await db.select().from(sessions).where(eq(sessions.id, finalSessionId));
  if (!session || session.userId !== userId) {
    return res.status(404).json({ error: 'Invalid session or access denied' });
  }

  // SECURITY: Validate that the appName matches the session's project name
  if (appName && session.appName !== appName) {
    return res.status(403).json({ 
      error: `Project name mismatch. This API key is bound to project "${session.appName}" (session ${finalSessionId}), but you're trying to send traces to "${appName}". Please update KYRA_PROJECT=${session.appName} in your .env file.`,
      expectedProject: session.appName,
      providedProject: appName,
      sessionId: finalSessionId
    });
  }

  const traceId = uuidv4();
  const newTrace = new Trace({
    traceId,
    userId,
    sessionId: finalSessionId,
    appName,
    spans,
    metadata,
  });
  await newTrace.save();

  processTraceStats(finalSessionId, spans);

  res.status(201).json({ message: 'Trace ingested', traceId, sessionId: finalSessionId });
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