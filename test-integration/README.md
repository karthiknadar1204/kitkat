# Kyra SDK Test Integration

Simple Express server to test Kyra observability integration.

## Setup

Already done! Your `.env` file is configured with:
- Project: `usagi`
- Backend: `http://localhost:3002/api`
- API Key: ✅ Set
- OpenAI Key: ✅ Set

## Start the Server

```bash
npm start
```

## Test Endpoints

Visit these URLs in your browser or use curl:

1. **Health Check**: http://localhost:4000/
2. **Chat Completion**: http://localhost:4000/test-chat
3. **Embeddings**: http://localhost:4000/test-embeddings
4. **Multi-step Chain**: http://localhost:4000/test-chain

## What Happens

Each endpoint will:
1. Call OpenAI with the Kyra SDK
2. Automatically send traces to your backend
3. You'll see the traces in your dashboard at http://localhost:3000/dashboard/usagi/{sessionId}

## Logs

Watch the terminal for:
- ✅ Success messages
- 🧪 Test indicators
- ❌ Any errors

