import { WebSocketServer } from 'ws';
import { subRedis } from './redis.js';

const connections = new Map();

const subscriptions = new Map();

export const initializeWebSocket = (server) => {
  const wss = new WebSocketServer({
    server,
    path: '/ws',
  });

  wss.on('connection', (ws, req) => {
    console.log(' New WebSocket connection');

    const url = new URL(req.url, `http://${req.headers.host}`);
    const sessionId = url.searchParams.get('sessionId');

    if (!sessionId) {
      console.warn(' WebSocket connection without sessionId, closing');
      ws.close(1008, 'sessionId required');
      return;
    }

    if (!connections.has(sessionId)) {
      connections.set(sessionId, new Set());
    }
    connections.get(sessionId).add(ws);

    if (!subscriptions.has(ws)) {
      subscriptions.set(ws, new Set());
    }
    subscriptions.get(ws).add(sessionId);

    const channel = `logs:sessionId:${sessionId}`;
    
    const subscriber = subRedis.duplicate();
    let isSubscribed = false;
    
    subscriber.subscribe(channel, (err) => {
      if (err) {
        console.error(`Error subscribing to ${channel}:`, err);
        ws.close(1011, 'Subscription failed');
        return;
      }
      isSubscribed = true;
      console.log(` WebSocket subscribed to ${channel}`);
    });

    subscriber.on('message', (receivedChannel, message) => {
      if (receivedChannel === channel && connections.get(sessionId)?.has(ws) && ws.readyState === 1) {
        try {
          const event = JSON.parse(message);
          const { type: eventType, ...eventData } = event;
          const wsMessage = JSON.stringify({
            ...eventData,
            type: 'log',
          });
          console.log(` Forwarding ${event.event || event.type} to WebSocket client for session ${sessionId}`);
          ws.send(wsMessage);
        } catch (error) {
          console.error('Error parsing Redis message:', error);
        }
      } else {
        console.log(` Message received but not forwarded: channel=${receivedChannel}, hasConnection=${connections.get(sessionId)?.has(ws)}, readyState=${ws.readyState}`);
      }
    });

    subscriber.on('error', (err) => {
      console.error('Redis subscriber error:', err);
    });

    ws.send(JSON.stringify({
      type: 'connected',
      sessionId,
      message: 'WebSocket connected successfully',
    }));

    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        if (data.type === 'ping') {
          ws.send(JSON.stringify({ type: 'pong' }));
        }
      } catch (error) {
        console.error('Error handling WebSocket message:', error);
      }
    });

    ws.on('close', () => {
      console.log(` WebSocket disconnected for session ${sessionId}`);
      
      const sessionConnections = connections.get(sessionId);
      if (sessionConnections) {
        sessionConnections.delete(ws);
        if (sessionConnections.size === 0) {
          connections.delete(sessionId);
        }
      }

      subscriptions.delete(ws);

      if (isSubscribed) {
        subscriber.unsubscribe(channel, () => {
          subscriber.quit();
        });
      } else {
        subscriber.quit();
      }
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  });

  console.log('WebSocket server initialized on /ws');
  return wss;
};

export const getActiveConnections = (sessionId) => {
  return connections.get(sessionId)?.size || 0;
};

export const broadcastToSession = (sessionId, message) => {
  const sessionConnections = connections.get(sessionId);
  if (sessionConnections) {
    const data = JSON.stringify(message);
    sessionConnections.forEach((ws) => {
      if (ws.readyState === 1) {
        ws.send(data);
      }
    });
  }
};

export default { initializeWebSocket, getActiveConnections, broadcastToSession };

