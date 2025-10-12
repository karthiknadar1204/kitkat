# Kyra Observability SDK

A lightweight SDK for tracing LLM calls and multi-step chains with OpenAI integration. Capture latency, tokens, and detailed execution traces for debugging and monitoring AI applications.

## Features

- **Zero-config OpenAI Integration** - Drop-in replacement for OpenAI SDK
- **Automatic Tracing** - Capture input, output, latency, and token usage
- **Multi-step Chain Support** - Track complex RAG flows with multiple spans
- **Error Handling** - Graceful failure without breaking your app

## Installation

```bash
npm install kyra-observability-sdk
```

## Getting Started

### 1. Get Your API Key

Sign up for Kyra and generate an API key from your dashboard. The SDK connects to Kyra cloud by default - no additional configuration needed.

### 2. Environment Variables

Set the following environment variables in your `.env` file:

```bash
# Required
KYRA_API_KEY=lsv2_your_api_key_here
OPENAI_API_KEY=sk-your_openai_key_here

# Optional
KYRA_PROJECT=my-app
KYRA_TRACING=true

# Optional - Only needed if self-hosting
# KYRA_ENDPOINT=https://your-kyra-instance.com/api
```

## Usage

### Basic Example

```javascript
require('dotenv').config();
const Kyra = require('kyra-observability-sdk');

const sdk = new Kyra();

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
const sdk = new Kyra();

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
// Override defaults if needed (e.g., for self-hosted instances)
const sdk = new Kyra({
  apiKey: 'lsv2_your_key',
  project: 'my-custom-project',
  tracingEnabled: true,
  endpoint: 'https://your-self-hosted-kyra.com/api', // Only for self-hosting
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

### `new Kyra(options)`

Creates a new SDK instance.

**Options:**
- `apiKey` (string): Kyra API key (defaults to `KYRA_API_KEY` env var) - **Required**
- `project` (string): Project name (defaults to `KYRA_PROJECT` env var or `'default'`)
- `tracingEnabled` (boolean): Enable tracing (defaults to `true` unless `KYRA_TRACING='false'`)
- `endpoint` (string): Backend endpoint (defaults to Kyra cloud, override with `KYRA_ENDPOINT` for self-hosting)

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

### Disable Tracing in Production

```bash
KYRA_TRACING=false
```

### Non-blocking Behavior

Tracing failures never crash your application. If the backend is unavailable, traces are silently dropped with console warnings.

## Testing the Package Locally

Before publishing, test the package locally:

```bash
# In SDK directory
npm pack

# Creates kyra-observability-sdk-0.1.1.tgz
```

Install in a test app:

```bash
mkdir test-app && cd test-app
npm init -y
npm install ../langsmith-sdk/kyra-observability-sdk-0.1.1.tgz
```

Create `test-app/test.js`:

```javascript
require('dotenv').config();
const Kyra = require('kyra-observability-sdk');

async function test() {
  const sdk = new Kyra();
  
  try {
    const response = await sdk.chatCompletions({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: 'Test publish!' }],
      max_tokens: 50,
    });
    console.log('Response:', response.choices[0].message.content);

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
    console.log('Chain Trace ID:', traceId);
  } catch (err) {
    console.error('Error:', err.message);
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
│   OpenAI     │ ◄────────────► │     Kyra     │
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

1. Verify `KYRA_TRACING=true` in `.env`
2. Check API key is valid and properly set
3. Review console logs for error messages
4. Ensure network connectivity to Kyra backend
5. Check if traces appear in your Kyra dashboard

### High Latency

- Ensure backend is responding quickly
- Tracing is async by default and shouldn't impact latency
- Consider disabling tracing in high-load scenarios

## License

MIT

## Contributing

Contributions welcome! Please open an issue or PR.

## Support

For issues and questions:
- GitHub Issues: https://github.com/karthiknadar1204/kyra/issues
- Email: support@kyra.dev

## Changelog

### v0.1.0 (Initial Release)
- OpenAI chat completions tracing
- Multi-step chain support
- Error handling and sampling
- Environment-based configuration

