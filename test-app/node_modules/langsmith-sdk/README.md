# LangSmith SDK

A lightweight SDK for tracing LLM calls and multi-step chains with OpenAI integration. Capture latency, tokens, and detailed execution traces for debugging and monitoring AI applications.

## Features

- 🚀 **Zero-config OpenAI Integration** - Drop-in replacement for OpenAI SDK
- 📊 **Automatic Tracing** - Capture input, output, latency, and token usage
- 🔗 **Multi-step Chain Support** - Track complex RAG flows with multiple spans
- 🎯 **Sampling & Control** - Configurable tracing rates for production
- 🛡️ **Error Handling** - Graceful failure without breaking your app
- 🔧 **Environment-based Config** - Control via environment variables

## Installation

```bash
npm install langsmith-sdk
```

## Setup

### Environment Variables

Set the following environment variables in your `.env` file:

```bash
# Required
LANGSMITH_API_KEY=lsv2_your_api_key_here
OPENAI_API_KEY=sk-your_openai_key_here

# Optional (with defaults)
LANGSMITH_ENDPOINT=http://localhost:3002/api
LANGSMITH_PROJECT=my-app
LANGSMITH_TRACING=true
LANGSMITH_SAMPLE_RATE=1.0
```

### Configuration Options

| Variable | Description | Default |
|----------|-------------|---------|
| `LANGSMITH_API_KEY` | Your LangSmith API key (required) | - |
| `OPENAI_API_KEY` | Your OpenAI API key (required) | - |
| `LANGSMITH_ENDPOINT` | Backend endpoint URL | `http://localhost:3002/api` |
| `LANGSMITH_PROJECT` | Project name for organizing traces | `default` |
| `LANGSMITH_TRACING` | Enable/disable tracing | `true` |
| `LANGSMITH_SAMPLE_RATE` | Sample rate (0.0 to 1.0) | `1.0` (100%) |

## Usage

### Basic Example

```javascript
require('dotenv').config();
const LangSmithSDK = require('langsmith-sdk');

const sdk = new LangSmithSDK();

async function main() {
  const response = await sdk.chatCompletions({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: 'Hello, how are you?' }],
    max_tokens: 50,
  });
  
  console.log(response.choices[0].message.content);
}

main();
```

### Chain Example (Multi-step RAG)

```javascript
const sdk = new LangSmithSDK();

async function ragPipeline() {
  const steps = [
    {
      name: 'retrieval',
      fn: async (params) => {
        // Your retrieval logic here
        return { docs: ['Retrieved document content'] };
      },
      params: { query: 'What is AI?' },
      tokens: { input: 5, output: 10 },
    },
    {
      name: 'llm-generation',
      fn: async (params) => {
        return await sdk.openai.chat.completions.create(params);
      },
      params: {
        model: 'gpt-4o-mini',
        messages: [
          { role: 'user', content: 'Summarize: Retrieved document content' }
        ],
        max_tokens: 100,
      },
    },
  ];

  const { results, traceId } = await sdk.wrapChain(steps);
  
  console.log('Chain Results:', results);
  console.log('Trace ID:', traceId);
}

ragPipeline();
```

### Custom Configuration

```javascript
const sdk = new LangSmithSDK({
  apiKey: 'lsv2_your_key',
  endpoint: 'https://your-backend.com/api',
  project: 'my-custom-project',
  tracingEnabled: true,
  sampleRate: 0.5, // Trace 50% of requests
});
```

### Error Handling

The SDK automatically captures and traces errors:

```javascript
try {
  const response = await sdk.chatCompletions({
    model: 'invalid-model',
    messages: [{ role: 'user', content: 'Test' }],
  });
} catch (error) {
  console.error('OpenAI error:', error.message);
  // Error trace is automatically sent to backend
}
```

## API Reference

### `new LangSmithSDK(options)`

Creates a new SDK instance.

**Options:**
- `apiKey` (string): LangSmith API key (defaults to `LANGSMITH_API_KEY`)
- `endpoint` (string): Backend endpoint (defaults to `LANGSMITH_ENDPOINT`)
- `project` (string): Project name (defaults to `LANGSMITH_PROJECT`)
- `tracingEnabled` (boolean): Enable tracing (defaults to `LANGSMITH_TRACING === 'true'`)
- `sampleRate` (number): Sample rate 0.0-1.0 (defaults to `LANGSMITH_SAMPLE_RATE`)

### `sdk.chatCompletions(params)`

Wrapper for OpenAI's `chat.completions.create()` with automatic tracing.

**Parameters:**
- `params` (object): Standard OpenAI chat completion parameters

**Returns:** OpenAI response object

### `sdk.wrapChain(steps, appName?)`

Execute and trace a multi-step chain.

**Parameters:**
- `steps` (array): Array of step objects with:
  - `name` (string): Step name
  - `fn` (function): Async function to execute
  - `params` (object): Parameters for the function
  - `tokens` (object, optional): Token counts `{ input, output }`
- `appName` (string, optional): Override project name for this chain

**Returns:** 
```javascript
{
  results: Array,  // Array of step outputs
  traceId: string  // Trace ID for debugging
}
```

### `sdk.startSession(appName)`

Manually create a session (optional, auto-created by default).

**Parameters:**
- `appName` (string): Application name

**Returns:** Session ID (number) or null if tracing disabled

## Production Usage

### Sampling for High-Volume Applications

```bash
# Trace 10% of requests
LANGSMITH_SAMPLE_RATE=0.1
```

### Disable Tracing in Production

```bash
LANGSMITH_TRACING=false
```

### Non-blocking Behavior

Tracing failures never crash your application. If the backend is unavailable, traces are silently dropped with console warnings.

## Testing the Package Locally

Before publishing, test the package locally:

```bash
# In SDK directory
npm pack

# Creates langsmith-sdk-0.1.0.tgz
```

Install in a test app:

```bash
mkdir test-app && cd test-app
npm init -y
npm install ../langsmith-sdk/langsmith-sdk-0.1.0.tgz
```

Create `test-app/test.js`:

```javascript
require('dotenv').config();
const LangSmithSDK = require('langsmith-sdk');

async function test() {
  const sdk = new LangSmithSDK();
  
  try {
    const response = await sdk.chatCompletions({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: 'Test publish!' }],
      max_tokens: 50,
    });
    console.log('✅ Response:', response.choices[0].message.content);

    const steps = [
      { 
        name: 'mock', 
        fn: async () => ({ data: 'test' }), 
        params: {}, 
        tokens: { input: 1, output: 1 } 
      },
      { 
        name: 'llm', 
        fn: async (p) => await sdk.openai.chat.completions.create(p), 
        params: { 
          model: 'gpt-4o-mini', 
          messages: [{ role: 'user', content: 'Hi' }] 
        } 
      },
    ];
    
    const { results, traceId } = await sdk.wrapChain(steps);
    console.log('✅ Chain Trace ID:', traceId);
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

test();
```

Copy `.env` to test-app and run:

```bash
node test.js
```

## Architecture

```
┌──────────────┐
│  Your App    │
└──────┬───────┘
       │
       │ SDK Wrapper
       ▼
┌──────────────┐     Traces      ┌──────────────┐
│   OpenAI     │ ◄────────────► │   LangSmith  │
│     API      │                 │   Backend    │
└──────────────┘                 └──────────────┘
                                        │
                         ┌──────────────┴──────────────┐
                         │                             │
                         ▼                             ▼
                  ┌─────────────┐            ┌─────────────┐
                  │  MongoDB    │            │  PostgreSQL │
                  │  (Traces)   │            │   (Stats)   │
                  └─────────────┘            └─────────────┘
```

## Examples

### Stream Responses (Coming Soon)

```javascript
// Streaming support planned for v0.2.0
const stream = await sdk.chatCompletions({
  model: 'gpt-4o-mini',
  messages: [{ role: 'user', content: 'Hello' }],
  stream: true,
});
```

### Feedback Integration (Coming Soon)

```javascript
// Feedback API planned for v0.2.0
await sdk.addFeedback(traceId, {
  score: 5,
  comment: 'Great response!',
});
```

## Troubleshooting

### Traces Not Appearing

1. Check backend is running: `curl http://localhost:3002/api/traces -H "X-API-Key: your_key"`
2. Verify `LANGSMITH_TRACING=true` in `.env`
3. Check API key is valid
4. Review console logs for error messages

### High Latency

- Reduce `LANGSMITH_SAMPLE_RATE` to lower tracing overhead
- Ensure backend is responding quickly
- Consider async tracing (default behavior)

## License

MIT

## Contributing

Contributions welcome! Please open an issue or PR.

## Support

For issues and questions:
- GitHub Issues: https://github.com/yourusername/langsmith-sdk/issues
- Email: your.email@example.com

## Changelog

### v0.1.0 (Initial Release)
- OpenAI chat completions tracing
- Multi-step chain support
- Error handling and sampling
- Environment-based configuration

