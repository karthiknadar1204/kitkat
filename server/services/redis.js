import Redis from 'ioredis';

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: null,
});

const pubRedis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: 3,
});

const subRedis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: 3,
});

redis.on('connect', () => {
  console.log(' Redis connected');
});

redis.on('error', (err) => {
  console.error(' Redis connection error:', err.message);
});

redis.on('close', () => {
  console.warn(' Redis connection closed');
});

pubRedis.on('connect', () => {
  console.log(' Redis Pub connected');
});

subRedis.on('connect', () => {
  console.log(' Redis Sub connected');
});

export const emitLogEvent = async (sessionId, event) => {
  try {
    const channel = `logs:sessionId:${sessionId}`;
    const message = JSON.stringify({
      ...event,
      timestamp: new Date().toISOString(),
    });
    const subscribers = await pubRedis.publish(channel, message);
    console.log(` Published ${event.event || event.type} to ${channel} (${subscribers} subscribers)`);
  } catch (error) {
    console.error(' Error emitting log event:', error);
  }
};

export const subscribeToLogs = (sessionId, callback) => {
  const channel = `logs:sessionId:${sessionId}`;
  
  subRedis.subscribe(channel, (err) => {
    if (err) {
      console.error(`Error subscribing to ${channel}:`, err);
      return;
    }
    console.log(` Subscribed to ${channel}`);
  });

  subRedis.on('message', (receivedChannel, message) => {
    if (receivedChannel === channel) {
      try {
        const event = JSON.parse(message);
        callback(event);
      } catch (error) {
        console.error('Error parsing log event:', error);
      }
    }
  });

  return () => {
    subRedis.unsubscribe(channel);
  };
};

export { redis, pubRedis, subRedis };
export default redis;

