# Live Logs System Setup

This document explains how to set up and run the live logs system with BullMQ, Redis, and WebSockets.

## Architecture Overview

The live logs system consists of:
1. **API Server** - Receives traces and enqueues them to BullMQ
2. **Worker Process** - Processes traces asynchronously and emits log events
3. **Redis** - Used for BullMQ queue and Pub/Sub for real-time events
4. **WebSocket Server** - Forwards Redis Pub/Sub events to connected clients
5. **Frontend** - Displays live logs in the dashboard

## Prerequisites

1. **Redis Server** - Must be running and accessible
   - Default: `localhost:6379`
   - Can be configured via environment variables

## Environment Variables

Add these to your `.env` file:

```bash
# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=  # Optional, leave empty if no password

# WebSocket URL (for frontend)
NEXT_PUBLIC_WS_URL=ws://localhost:3002/ws
```

## Installation

Dependencies are already installed:
- `ioredis` - Redis client
- `bullmq` - Job queue
- `ws` - WebSocket server

## Running the System

### 1. Start Redis

Make sure Redis is running:

```bash
# Using Docker
docker run -d -p 6379:6379 redis:latest

# Or using local Redis
redis-server
```

### 2. Start the API Server

```bash
cd server
npm run dev
# or
npm start
```

The server will start on port 3002 with WebSocket support at `/ws`.

### 3. Start the Worker Process

In a **separate terminal**, start the worker:

```bash
cd server
npm run worker
# or for development with auto-reload
npm run dev:worker
```

The worker will:
- Process trace jobs from BullMQ
- Emit log events to Redis Pub/Sub
- Update stats in the database

### 4. Start the Frontend

```bash
cd client
npm run dev
```

## How It Works

### Trace Flow

1. **Trace Ingestion** (`POST /api/traces`)
   - Trace is saved to MongoDB immediately
   - Trace is enqueued to BullMQ
   - `trace-received` event is emitted
   - API returns 202 Accepted

2. **Worker Processing**
   - Worker picks up the job from BullMQ
   - Emits `trace-started` event
   - For each span, emits `span-started` and `span-completed` events
   - Updates stats in database
   - Emits `trace-completed` event

3. **Real-time Updates**
   - All events are published to Redis Pub/Sub channel: `logs:sessionId:{sessionId}`
   - WebSocket server subscribes to these channels
   - Connected clients receive events in real-time

### WebSocket Connection

Frontend connects to: `ws://localhost:3002/ws?sessionId={sessionId}`

The WebSocket will:
- Automatically reconnect on disconnect
- Filter events by sessionId
- Forward all log events to the client

### Frontend Live Logs

The `LiveLogsPanel` component:
- Connects to WebSocket on mount
- Displays real-time log events
- Filters by type (All, Traces, Spans, Errors)
- Shows active traces count
- Auto-scrolls to latest logs

## Monitoring

### Check Worker Status

The worker logs:
- `✅ Trace {traceId} processed successfully` - Success
- `❌ Error processing trace {traceId}` - Error
- `🔄 Processing trace {traceId}` - In progress

### Check WebSocket Connections

The server logs:
- `🔌 New WebSocket connection` - New client connected
- `✅ WebSocket subscribed to logs:sessionId:{id}` - Subscription successful
- `🔌 WebSocket disconnected` - Client disconnected

### Check Redis Connection

The server logs:
- `✅ Redis connected` - Redis connection successful
- `❌ Redis connection error` - Connection failed

## Troubleshooting

### Worker Not Processing Jobs

1. Check Redis is running: `redis-cli ping` (should return `PONG`)
2. Check worker is running: Look for worker logs
3. Check BullMQ queue: Use Redis CLI to inspect queue

### WebSocket Not Connecting

1. Check WebSocket URL in frontend: `NEXT_PUBLIC_WS_URL`
2. Check server is running on correct port
3. Check browser console for connection errors
4. Verify sessionId is being passed correctly

### No Logs Appearing

1. Verify trace is being ingested (check API response)
2. Check worker is processing jobs (check worker logs)
3. Check Redis Pub/Sub is working
4. Check WebSocket connection status in frontend

## Production Considerations

1. **Redis Persistence** - Enable AOF or RDB for data durability
2. **Worker Scaling** - Run multiple worker instances for high throughput
3. **WebSocket Load Balancing** - Use sticky sessions or Redis adapter for Socket.IO
4. **Error Handling** - Implement retry logic and dead letter queues
5. **Monitoring** - Add metrics and alerting for queue depth, worker health
6. **Security** - Add authentication to WebSocket connections
7. **Rate Limiting** - Limit trace ingestion rate per session

## Development Tips

- Use `npm run dev:worker` for auto-reload during development
- Check Redis with `redis-cli MONITOR` to see all commands
- Use BullMQ Dashboard for queue visualization (optional)
- Test WebSocket with `wscat`: `wscat -c ws://localhost:3002/ws?sessionId=1`

