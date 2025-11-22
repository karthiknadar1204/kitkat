# Kyra SDK Production Test Server

Production-grade end-to-end testing server for the Kyra Observability SDK. This server provides comprehensive test endpoints to validate all SDK functionality in a production-like environment.

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd prod-test/server
npm install
```

### 2. Configure Environment

Copy the example environment file and fill in your credentials:

```bash
cp .env.example .env
```

Edit `.env` and set:
- `KYRA_API_KEY` - Your Kyra API key from the dashboard
- `KYRA_ENDPOINT` - Backend endpoint (default: https://kitkat-production.up.railway.app/api)
- `KYRA_PROJECT` - Project name for traces
- `OPENAI_API_KEY` - Your OpenAI API key

### 3. Start Server

```bash
npm start
```

Or for development with auto-reload:

```bash
npm run dev
```

### 4. Run Tests

In a separate terminal:

```bash
npm test
```

## 📋 Available Endpoints

### Health & Status

- **GET `/health`** - Health check endpoint
- **GET `/status`** - Server status and documentation

### Core SDK Features

- **POST `/chat`** - Chat completions
  ```json
  {
    "message": "Hello!",
    "model": "gpt-4o-mini",
    "systemPrompt": "You are a helpful assistant.",
    "max_tokens": 100,
    "temperature": 0.7
  }
  ```

- **POST `/embeddings`** - Create embeddings
  ```json
  {
    "input": "Text to embed",
    "model": "text-embedding-3-small"
  }
  ```

- **POST `/tools`** - Chat with tool calling
  ```json
  {
    "message": "What is the weather in Paris?",
    "model": "gpt-4o-mini",
    "tools": [] // Optional, uses default tools if empty
  }
  ```

- **POST `/chain`** - Multi-step chain execution
  ```json
  {
    "steps": [
      {
        "name": "step-1",
        "fn": "async function reference",
        "params": {},
        "tokens": { "input": 0, "output": 0 }
      }
    ],
    "appName": "optional-project-name"
  }
  ```

- **POST `/chain/rag`** - RAG pipeline with chain
  ```json
  {
    "query": "What is Kyra?",
    "context": ["Optional context documents"],
    "appName": "optional-project-name"
  }
  ```

### Testing Endpoints

- **POST `/test/error`** - Test error handling and tracing
  ```json
  {
    "errorType": "invalid_model" // or "invalid_key"
  }
  ```

- **POST `/test/batch`** - Test batch requests
  ```json
  {
    "count": 3,
    "type": "chat" // or "embeddings"
  }
  ```

- **GET `/test/metrics`** - Get server metrics

## 🧪 Testing Examples

### Using cURL

#### Chat Completions
```bash
curl -X POST http://localhost:5000/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Hello from production test!"}'
```

#### Embeddings
```bash
curl -X POST http://localhost:5000/embeddings \
  -H "Content-Type: application/json" \
  -d '{"input":"Testing Kyra observability"}'
```

#### Tool Calling
```bash
curl -X POST http://localhost:5000/tools \
  -H "Content-Type: application/json" \
  -d '{"message":"What is the weather in Tokyo? Also calculate 15 * 23."}'
```

#### RAG Pipeline
```bash
curl -X POST http://localhost:5000/chain/rag \
  -H "Content-Type: application/json" \
  -d '{"query":"What is Kyra observability?"}'
```

#### Error Handling Test
```bash
curl -X POST http://localhost:5000/test/error \
  -H "Content-Type: application/json" \
  -d '{"errorType":"invalid_model"}'
```

#### Batch Test
```bash
curl -X POST http://localhost:5000/test/batch \
  -H "Content-Type: application/json" \
  -d '{"count":5,"type":"chat"}'
```

### Using the Test Runner

The automated test runner executes all endpoints and validates responses:

```bash
npm test
```

## 📊 Features Tested

✅ **Chat Completions** - Basic conversational AI
✅ **Embeddings** - Vector embeddings generation
✅ **Tool Calling** - Function calling with multiple tools
✅ **Chain Execution** - Multi-step workflow tracing
✅ **RAG Pipeline** - Retrieval-augmented generation
✅ **Error Handling** - Error tracing and reporting
✅ **Batch Processing** - Concurrent request handling
✅ **Health Monitoring** - Server health and metrics

## 🔍 What Gets Traced

All SDK calls automatically trace to your Kyra dashboard:

- **Latency** - Request/response timing
- **Tokens** - Input/output token usage
- **Errors** - Error details and stack traces
- **Spans** - Individual operation traces
- **Chains** - Multi-step workflow traces
- **Metadata** - Custom metadata and context

## 📦 SDK Details

- **Package**: `kyra-observability-sdk` (from npm)
- **Version**: Latest from npm registry
- **Tracing**: Enabled by default (set `KYRA_TRACING=false` to disable)

## 🛠️ Production Features

- **Helmet** - Security headers
- **CORS** - Cross-origin resource sharing
- **Morgan** - HTTP request logging
- **Error Handling** - Comprehensive error catching
- **Health Checks** - Server monitoring endpoints
- **Metrics** - Performance and usage metrics

## 📝 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `KYRA_API_KEY` | Your Kyra API key | Required |
| `KYRA_ENDPOINT` | Backend endpoint | `https://kitkat-production.up.railway.app/api` |
| `KYRA_PROJECT` | Project name for traces | `prod-test` |
| `KYRA_TRACING` | Enable/disable tracing | `true` |
| `OPENAI_API_KEY` | OpenAI API key | Required |
| `PORT` | Server port | `5000` |
| `NODE_ENV` | Environment | `production` |

## 🔗 Dashboard

After running tests, check your Kyra dashboard to see:

- All traced API calls
- Token usage metrics
- Latency statistics
- Error rates
- Chain executions
- Tool invocations

Dashboard URL: `http://localhost:3000/dashboard/{project}/{sessionId}`

## 🐛 Troubleshooting

### SDK Not Found
```bash
npm install kyra-observability-sdk
```

### API Key Errors
- Ensure `KYRA_API_KEY` is set in `.env`
- Verify API key is valid in dashboard
- Check API key is bound to a session

### OpenAI Errors
- Verify `OPENAI_API_KEY` is set
- Check OpenAI API key is valid
- Ensure sufficient API credits

### Connection Errors
- Verify backend is accessible
- Check `KYRA_ENDPOINT` is correct
- Ensure network connectivity

## 📚 Next Steps

1. Run all test endpoints
2. Check traces in dashboard
3. Monitor metrics and performance
4. Adjust configuration as needed
5. Integrate into CI/CD pipeline

## 🎯 Production Checklist

- [ ] Environment variables configured
- [ ] API keys validated
- [ ] All endpoints tested
- [ ] Traces appearing in dashboard
- [ ] Error handling verified
- [ ] Performance metrics monitored
- [ ] Logs reviewed
- [ ] Health checks passing

---

**Built for production-grade testing of Kyra Observability SDK** 🚀

