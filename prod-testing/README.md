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

### Option 2: Express Server

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
- **server.js** - Simple Express API server
- **.env** - Pre-configured with your credentials
- **package.json** - All dependencies installed

## How It Works

1. Uses `kyra-observability-sdk` from npm (v0.1.4)
2. Automatically traces all OpenAI calls to your dashboard
3. View traces at: http://localhost:3000/dashboard/test8/[your-session-id]

## Features

- Conversation history (chat remembers context)
- Token usage display
- Automatic tracing to Kyra production
- Error handling
- Simple and clean interface

Enjoy testing! 🚀

