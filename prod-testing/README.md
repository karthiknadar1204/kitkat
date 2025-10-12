# Kyra Production Testing

Simple chatbot setup to test the Kyra Observability SDK in production.

## Setup Complete!

All dependencies installed and configured with:
- Kyra SDK (from npm)
- Production endpoint
- OpenAI API key configured

## Usage

### Option 1: Terminal Chat (Recommended)

Start an interactive chat in your terminal:

```bash
npm run chat
```

Type your messages and get responses. Type `exit` to quit.

### Option 2: Tool Calling / Function Calling (NEW!)

Test AI agent with function calling capabilities:

```bash
npm run tools
```

The AI has access to 3 tools:
- **get_weather(location)** - Get weather for any city
- **get_random_day()** - Get a random day of the week  
- **add_numbers(a, b)** - Add two numbers

Try asking:
- "What's the weather in Tokyo?"
- "Give me a random day and add 25 + 17"
- "Add 42 and 58, then tell me the weather in Paris"

The SDK will automatically handle multiple tool calls and iterations!

### Option 3: Embeddings Test (NEW!)

Test semantic search with embeddings:

```bash
npm run embeddings
```

Features:
- Creates embeddings for test texts
- Stores them locally in `embeddings-store.json`
- Performs semantic similarity search
- Demonstrates vector search without a database

### Option 4: RAG System (NEW!)

Interactive RAG (Retrieval-Augmented Generation) with sample resume:

```bash
npm run rag
```

Features:
- Uses sample resume text (no PDF parsing needed)
- Creates embeddings for all chunks (stored in `rag-embeddings.json`)
- Performs semantic search to find relevant context
- Uses `wrapChain` to trace the full RAG pipeline (retrieval + generation)
- Answers questions based on resume content

**Test Questions to Try:**
1. "What are Karthik's technical skills?"
2. "Tell me about his work experience at TechCorp"
3. "What projects has he built?"
4. "Where did he go to university?"
5. "What certifications does he have?"
6. "What programming languages does he know?"
7. "Describe his e-commerce project"
8. "What databases has he worked with?"

The first run will create embeddings (takes a moment). Subsequent runs load from cache instantly!

### Option 5: Express Server

Start the HTTP server:

```bash
npm run server
```

Then test with curl:

```bash
curl -X POST http://localhost:5001/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Hello! Tell me a joke."}'
```

## What's Included

- **chat.js** - Interactive terminal chatbot with conversation history
- **tools-chat.js** - Tool calling / function calling demo (agent with 3 tools)
- **embeddings-test.js** - Semantic search with embeddings
- **rag-simple.js** - Full RAG system with sample resume (no PDF needed)
- **server.js** - Simple Express API server
- **.env** - Pre-configured with your credentials
- **package.json** - All dependencies installed

## How It Works

1. Uses `kyra-observability-sdk` from npm (v0.1.4)
2. Automatically traces all OpenAI calls to your dashboard
3. View traces at: http://localhost:3000/dashboard/test8/[your-session-id]

## Features Tested

✅ **Chat Completions** - Basic conversational AI with history  
✅ **Function Calling** - AI agents with tool access (3 custom tools)  
✅ **Embeddings** - Semantic search and vector similarity  
✅ **RAG Pipeline** - Full retrieval-augmented generation with `wrapChain`  
✅ **Error Tracing** - Automatic error capture and tracing  
✅ **Token Tracking** - Real-time usage monitoring  
✅ **Multi-step Chains** - Complex workflows with multiple spans  

All features automatically traced to your Kyra dashboard! 🎯

## Generated Files

After running tests, you'll have:
- `embeddings-store.json` - Cached embeddings from embeddings test
- `rag-embeddings.json` - Cached resume chunks + embeddings for RAG

These files enable instant subsequent runs without re-creating embeddings!

## What to See in Dashboard

After each test, check your Kyra dashboard to see:
- **Embeddings**: Single-span traces with token usage
- **Tool Calling**: Multi-span traces showing each tool execution
- **RAG Pipeline**: Two-span traces (retrieval + generation steps)
- **Chains**: Full workflow visualization with `wrapChain`

Enjoy testing! 🚀

