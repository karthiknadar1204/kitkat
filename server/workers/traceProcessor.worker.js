import { Worker } from 'bullmq';
import { redis } from '../services/redis.js';
import { emitLogEvent } from '../services/redis.js';
import Trace from '../models/trace.model.js';
import { db } from '../config/db.js';
import { stats } from '../config/schema.js';
import { eq } from 'drizzle-orm';


const worker = new Worker(
  'trace-processing',
  async (job) => {
    const { traceId, userId, sessionId, appName, spans, metadata } = job.data;

    console.log(` Processing trace ${traceId} for session ${sessionId}`);

    try {
      await emitLogEvent(sessionId, {
        type: 'trace-started',
        event: 'trace-started',
        traceId,
        sessionId,
        appName,
        status: 'processing',
      });

      for (let i = 0; i < spans.length; i++) {
        const span = spans[i];
        const spanId = `${traceId}-span-${i}`;

        await emitLogEvent(sessionId, {
          type: 'span-started',
          event: 'span-started',
          traceId,
          spanId,
          sessionId,
          spanName: span.name,
          spanIndex: i,
          totalSpans: spans.length,
        });

        await new Promise((resolve) => setTimeout(resolve, 50));

        await emitLogEvent(sessionId, {
          type: 'span-completed',
          event: 'span-completed',
          traceId,
          spanId,
          sessionId,
          spanName: span.name,
          latency: span.latency || 0,
          inputTokens: span.tokens?.input || 0,
          outputTokens: span.tokens?.output || 0,
          status: 'success',
        });
      }

      await processTraceStats(sessionId, spans);

      await emitLogEvent(sessionId, {
        type: 'trace-completed',
        event: 'trace-completed',
        traceId,
        sessionId,
        appName,
        totalSpans: spans.length,
        status: 'success',
      });

      console.log(` Trace ${traceId} processed successfully`);
      return { success: true, traceId };
    } catch (error) {
      console.error(` Error processing trace ${traceId}:`, error);

      await emitLogEvent(sessionId, {
        type: 'trace-error',
        event: 'trace-error',
        traceId,
        sessionId,
        appName,
        error: error.message,
        status: 'error',
      });

      throw error;
    }
  },
  {
    connection: redis,
    concurrency: 5,
  }
);

// Worker event handlers
worker.on('completed', (job) => {
  console.log(` Job ${job.id} completed`);
});

worker.on('failed', (job, err) => {
  console.error(` Job ${job.id} failed:`, err.message);
});

worker.on('error', (err) => {
  console.error(' Worker error:', err);
});

const processTraceStats = async (sessionId, spans) => {
  const totalLatency = spans.reduce((sum, span) => sum + (span.latency || 0), 0);
  const totalTokens = spans.reduce(
    (sum, span) => sum + (span.tokens?.input || 0) + (span.tokens?.output || 0),
    0
  );
  const totalCost = Math.round((totalTokens / 1000) * 0.01 * 100); // Fake: $0.01 per 1k tokens, in cents

  const [existingStat] = await db.select().from(stats).where(eq(stats.sessionId, sessionId));
  if (existingStat) {
    const newAvgLatency =
      ((existingStat.avgLatency * existingStat.totalTokens + totalLatency) /
        (existingStat.totalTokens + totalTokens)) || totalLatency;
    await db
      .update(stats)
      .set({
        avgLatency: Math.round(newAvgLatency),
        totalTokens: existingStat.totalTokens + totalTokens,
        totalCost: existingStat.totalCost + totalCost,
        updatedAt: new Date(),
      })
      .where(eq(stats.id, existingStat.id));
  } else {
    await db.insert(stats).values({
      sessionId,
      avgLatency: totalLatency,
      totalTokens,
      totalCost,
    });
  }
  console.log(`Stats updated for session ${sessionId}: Latency=${totalLatency}ms, Tokens=${totalTokens}`);
};

console.log(' Trace processor worker started');

process.on('SIGTERM', async () => {
  console.log(' Shutting down worker...');
  await worker.close();
  process.exit(0);
});

export default worker;

