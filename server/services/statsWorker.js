import { db } from '../config/db.js';
import { stats } from '../config/schema.js';
import { eq } from 'drizzle-orm';

export const processTraceStats = async (sessionId, spans) => {

  setImmediate(async () => {
    const totalLatency = spans.reduce((sum, span) => sum + (span.latency || 0), 0);
    const totalTokens = spans.reduce((sum, span) => sum + (span.tokens?.input || 0) + (span.tokens?.output || 0), 0);
    const totalCost = Math.round((totalTokens / 1000) * 0.01 * 100);  // Fake: $0.01 per 1k tokens, in cents

    // Upsert stats for session
    const [existingStat] = await db.select().from(stats).where(eq(stats.sessionId, sessionId));
    if (existingStat) {
      // Update: Simple avg (in prod, use weighted avg)
      const newAvgLatency = ((existingStat.avgLatency * existingStat.totalTokens + totalLatency) / (existingStat.totalTokens + totalTokens)) || totalLatency;
      await db.update(stats).set({
        avgLatency: Math.round(newAvgLatency),
        totalTokens: existingStat.totalTokens + totalTokens,
        totalCost: existingStat.totalCost + totalCost,
        updatedAt: new Date(),
      }).where(eq(stats.id, existingStat.id));
    } else {
      await db.insert(stats).values({
        sessionId,
        avgLatency: totalLatency,
        totalTokens,
        totalCost,
      });
    }
    console.log(`Stats updated for session ${sessionId}: Latency=${totalLatency}ms, Tokens=${totalTokens}`);
  });
};
