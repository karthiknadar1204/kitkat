# Testing Guide - Production Test Server

## 🚀 Quick Start Testing

### Prerequisites
- Server must be running on port 5002
- Environment variables configured in `.env`

### Option 1: Quick Test Script (Recommended)

```bash
# In a new terminal (keep server running in another terminal)
cd prod-test/server
node test-quick.js
```

This will test:
- ✅ Health check
- ✅ Status endpoint
- ✅ Chat completions
- ✅ Embeddings
- ✅ Tool calling

### Option 2: Full Test Suite

```bash
# Run comprehensive test suite
npm test
```

This tests all 10 endpoints with detailed results.

### Option 3: Manual Testing with cURL

#### 1. Health Check
```bash
curl http://localhost:5002/health
```

#### 2. Status
```bash
curl http://localhost:5002/status
```

#### 3. Chat Completions
```bash
curl -X POST http://localhost:5002/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Hello from production test!",
    "max_tokens": 50
  }'
```

#### 4. Embeddings
```bash
curl -X POST http://localhost:5002/embeddings \
  -H "Content-Type: application/json" \
  -d '{
    "input": "Testing Kyra observability platform"
  }'
```

#### 5. Tool Calling
```bash
curl -X POST http://localhost:5002/tools \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What is the weather in Paris? Also calculate 15 * 23."
  }'
```

#### 6. Chain Execution
```bash
curl -X POST http://localhost:5002/chain \
  -H "Content-Type: application/json" \
  -d '{
    "steps": [
      {
        "name": "step-1",
        "params": {},
        "tokens": { "input": 0, "output": 0 }
      },
      {
        "name": "step-2",
        "params": {},
        "tokens": { "input": 0, "output": 0 }
      }
    ]
  }'
```

#### 7. RAG Pipeline
```bash
curl -X POST http://localhost:5002/chain/rag \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What is Kyra observability?"
  }'
```

#### 8. Error Handling Test
```bash
curl -X POST http://localhost:5002/test/error \
  -H "Content-Type: application/json" \
  -d '{
    "errorType": "invalid_model"
  }'
```

#### 9. Batch Requests
```bash
curl -X POST http://localhost:5002/test/batch \
  -H "Content-Type: application/json" \
  -d '{
    "count": 3,
    "type": "chat"
  }'
```

#### 10. Metrics
```bash
curl http://localhost:5002/test/metrics
```

## 🧪 Testing in Browser

Open these URLs in your browser:

- Health: http://localhost:5002/health
- Status: http://localhost:5002/status
- Metrics: http://localhost:5002/test/metrics

## 📊 Expected Results

### Successful Response Example (Chat)
```json
{
  "success": true,
  "message": "Hello from production test!",
  "usage": {
    "prompt_tokens": 10,
    "completion_tokens": 5,
    "total_tokens": 15
  },
  "model": "gpt-4o-mini",
  "latency": 1234,
  "traced": true
}
```

## 🔍 Verify Traces in Dashboard

After running tests:

1. Go to your Kyra dashboard
2. Navigate to your project (check `/status` endpoint for project name)
3. You should see traces for:
   - Chat completions
   - Embeddings
   - Tool calls
   - Chain executions

## 🐛 Troubleshooting

### Server not responding
```bash
# Check if server is running
lsof -i :5002

# Check server logs in the terminal where you ran `npm start`
```

### Port already in use
```bash
# Kill process on port 5002
lsof -ti:5002 | xargs kill -9

# Or use different port
PORT=5003 npm start
```

### SDK not initialized
- Check `.env` file has `KYRA_API_KEY` and `OPENAI_API_KEY`
- Verify keys are valid
- Check server logs for initialization errors

### No traces appearing
- Verify `KYRA_TRACING` is not set to `false`
- Check API key is valid and bound to a session
- Verify `KYRA_ENDPOINT` is correct
- Check server logs for trace sending errors

## 📝 Test Checklist

- [ ] Health endpoint returns 200
- [ ] Status endpoint shows correct project
- [ ] Chat completions work
- [ ] Embeddings created successfully
- [ ] Tool calling executes tools
- [ ] Chain execution completes
- [ ] RAG pipeline returns answer
- [ ] Error handling captures errors
- [ ] Batch requests complete
- [ ] Metrics endpoint accessible
- [ ] Traces appear in dashboard

---

**Happy Testing! 🚀**

