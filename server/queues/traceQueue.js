import { Queue } from 'bullmq';
import { redis } from '../services/redis.js';

export const traceQueue = new Queue('trace-processing', {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: {
      age: 3600,
      count: 1000,
    },
    removeOnFail: {
      age: 86400,
    },
  },
});

export const enqueueTrace = async (traceData) => {
  try {
    const job = await traceQueue.add('process-trace', traceData, {
      jobId: traceData.traceId,
    });
    console.log(` Enqueued trace ${traceData.traceId} to queue`);
    return job;
  } catch (error) {
    console.error('Error adding job to queue:', error);
    throw error;
  }
};

export default traceQueue;

