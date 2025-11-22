require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const Kyra = require('kyra-observability-sdk');

const app = express();
const PORT = process.env.PORT || 5002;

// Initialize Kyra SDK
const kyra = new Kyra({
  apiKey: process.env.KYRA_API_KEY,
  endpoint: process.env.KYRA_ENDPOINT,
  project: process.env.KYRA_PROJECT,
  tracingEnabled: process.env.KYRA_TRACING,
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logger
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ============================================================================
// HEALTH & STATUS ENDPOINTS
// ============================================================================

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    sdk: {
      project: kyra.project,
      endpoint: kyra.endpoint,
      tracingEnabled: kyra.tracingEnabled,
    },
  });
});

app.get('/status', (req, res) => {
  res.json({
    message: '🚀 Kyra Production Test Server',
    version: '1.0.0',
    sdk: 'kyra-observability-sdk (from npm)',
    project: process.env.KYRA_PROJECT,
    endpoint: process.env.KYRA_ENDPOINT,
    endpoints: [
      'GET /health - Health check',
      'GET /status - Server status',
      'POST /chat - Chat completion',
      'POST /chat/stream - Chat with streaming (not implemented)',
      'POST /embeddings - Create embeddings',
      'POST /tools - Chat with tool calling',
      'POST /chain - Multi-step chain execution',
      'POST /chain/rag - RAG pipeline with chain',
      'POST /test/error - Test error handling',
      'POST /test/batch - Batch requests',
      'GET /test/metrics - Get test metrics',
    ],
  });
});

// ============================================================================
// CORE SDK ENDPOINTS
// ============================================================================

// 1. Chat Completions
app.post('/chat', async (req, res) => {
  const startTime = Date.now();
  try {
    const { message, model = 'gpt-4o-mini', systemPrompt, max_tokens, temperature } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        error: 'Message is required',
      });
    }

    const messages = [];
    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }
    messages.push({ role: 'user', content: message });

    const params = {
      model,
      messages,
    };

    if (max_tokens) params.max_tokens = max_tokens;
    if (temperature !== undefined) params.temperature = temperature;

    console.log(`💬 Chat request: ${message.substring(0, 50)}...`);

    const response = await kyra.chatCompletions(params);
    const latency = Date.now() - startTime;

    const reply = response.choices[0].message.content;

    console.log(`✅ Chat response received (${latency}ms)`);

    res.json({
      success: true,
      message: reply,
      usage: response.usage,
      model: response.model,
      latency,
      traced: kyra.tracingEnabled,
    });
  } catch (error) {
    const latency = Date.now() - startTime;
    console.error(`❌ Chat error (${latency}ms):`, error.message);

    res.status(500).json({
      success: false,
      error: error.message,
      latency,
      traced: kyra.tracingEnabled,
    });
  }
});

// 2. Embeddings
app.post('/embeddings', async (req, res) => {
  const startTime = Date.now();
  try {
    const { input, model = 'text-embedding-3-small' } = req.body;

    if (!input) {
      return res.status(400).json({
        success: false,
        error: 'Input is required',
      });
    }

    console.log(`📊 Embeddings request: ${typeof input === 'string' ? input.substring(0, 50) : `${input.length} items`}...`);

    const response = await kyra.embeddings({
      model,
      input,
    });

    const latency = Date.now() - startTime;

    console.log(`✅ Embeddings created (${latency}ms): ${response.data.length} vectors`);

    res.json({
      success: true,
      data: response.data,
      usage: response.usage,
      model: response.model,
      dimensions: response.data[0]?.embedding?.length || 0,
      count: response.data.length,
      latency,
      traced: kyra.tracingEnabled,
    });
  } catch (error) {
    const latency = Date.now() - startTime;
    console.error(`❌ Embeddings error (${latency}ms):`, error.message);

    res.status(500).json({
      success: false,
      error: error.message,
      latency,
      traced: kyra.tracingEnabled,
    });
  }
});

// 3. Chat with Tool Calling
app.post('/tools', async (req, res) => {
  const startTime = Date.now();
  try {
    const { message, model = 'gpt-4o-mini', tools = [] } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        error: 'Message is required',
      });
    }

    // Default tools if none provided
    const defaultTools = [
      {
        name: 'get_weather',
        description: 'Get current weather for a city',
        parameters: {
          type: 'object',
          properties: {
            city: { type: 'string', description: 'City name' },
          },
          required: ['city'],
        },
        fn: async (args) => {
          console.log(`🔧 Tool called: get_weather for ${args.city}`);
          return {
            temperature: Math.floor(Math.random() * 30) + 10,
            condition: ['sunny', 'cloudy', 'rainy'][Math.floor(Math.random() * 3)],
            city: args.city,
            humidity: Math.floor(Math.random() * 60) + 30,
          };
        },
      },
      {
        name: 'calculate',
        description: 'Perform a mathematical calculation',
        parameters: {
          type: 'object',
          properties: {
            expression: { type: 'string', description: 'Mathematical expression to evaluate' },
          },
          required: ['expression'],
        },
        fn: async (args) => {
          console.log(`🔧 Tool called: calculate for ${args.expression}`);
          try {
            // Simple eval for demo - in production use a proper math parser
            const result = Function(`"use strict"; return (${args.expression})`)();
            return { result, expression: args.expression };
          } catch (err) {
            return { error: 'Invalid expression', expression: args.expression };
          }
        },
      },
      {
        name: 'get_time',
        description: 'Get current date and time',
        parameters: {
          type: 'object',
          properties: {},
        },
        fn: async () => {
          console.log(`🔧 Tool called: get_time`);
          return {
            datetime: new Date().toISOString(),
            timestamp: Date.now(),
          };
        },
      },
    ];

    const toolsToUse = tools.length > 0 ? tools : defaultTools;

    console.log(`🛠️ Tools request: ${message.substring(0, 50)}...`);

    const response = await kyra.chatCompletionsWithTools(
      {
        model,
        messages: [{ role: 'user', content: message }],
      },
      toolsToUse
    );

    const latency = Date.now() - startTime;

    console.log(`✅ Tools response received (${latency}ms)`);

    res.json({
      success: true,
      message: response.choices[0].message.content,
      usage: response.usage,
      model: response.model,
      latency,
      traced: kyra.tracingEnabled,
    });
  } catch (error) {
    const latency = Date.now() - startTime;
    console.error(`❌ Tools error (${latency}ms):`, error.message);

    res.status(500).json({
      success: false,
      error: error.message,
      latency,
      traced: kyra.tracingEnabled,
    });
  }
});

// 4. Chain Execution
app.post('/chain', async (req, res) => {
  const startTime = Date.now();
  try {
    const { steps, appName } = req.body;

    if (!steps || !Array.isArray(steps) || steps.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Steps array is required',
      });
    }

    console.log(`🔗 Chain request: ${steps.length} steps`);

    // Build chain steps
    const chainSteps = steps.map((step, index) => ({
      name: step.name || `step-${index + 1}`,
      fn: step.fn || (async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
        return { result: `Mock result from step ${index + 1}` };
      }),
      params: step.params || {},
      tokens: step.tokens || { input: 0, output: 0 },
    }));

    const { results, traceId } = await kyra.wrapChain(chainSteps, appName);

    const latency = Date.now() - startTime;

    console.log(`✅ Chain completed (${latency}ms): ${results.length} steps, traceId: ${traceId}`);

    res.json({
      success: true,
      results,
      traceId,
      stepsCompleted: results.length,
      latency,
      traced: kyra.tracingEnabled,
    });
  } catch (error) {
    const latency = Date.now() - startTime;
    console.error(`❌ Chain error (${latency}ms):`, error.message);

    res.status(500).json({
      success: false,
      error: error.message,
      latency,
      traced: kyra.tracingEnabled,
    });
  }
});

// 5. RAG Pipeline with Chain
app.post('/chain/rag', async (req, res) => {
  const startTime = Date.now();
  try {
    const { query, context = [] } = req.body;

    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Query is required',
      });
    }

    console.log(`🔍 RAG request: ${query.substring(0, 50)}...`);

    // Mock document store
    const mockDocs = context.length > 0 ? context : [
      'Kyra is an observability platform for AI applications.',
      'It provides tracing, monitoring, and analytics for LLM calls.',
      'The SDK supports OpenAI, embeddings, tool calling, and chains.',
      'All API calls are automatically traced to the dashboard.',
    ];

    const steps = [
      {
        name: 'retrieval',
        fn: async () => {
          console.log('  📚 Step 1: Retrieval');
          await new Promise(resolve => setTimeout(resolve, 100));
          // Simple keyword matching (in production use vector search)
          const relevantDocs = mockDocs.filter(doc =>
            doc.toLowerCase().includes(query.toLowerCase().split(' ')[0])
          );
          return {
            docs: relevantDocs.length > 0 ? relevantDocs : mockDocs.slice(0, 2),
            query,
          };
        },
        params: { query },
        tokens: { input: 10, output: 5 },
      },
      {
        name: 'llm-generation',
        fn: async (params) => {
          console.log('  🤖 Step 2: LLM Generation');
          const { docs } = params;
          const context = docs.join('\n\n');
          return await kyra.chatCompletions({
            model: 'gpt-4o-mini',
            messages: [
              {
                role: 'system',
                content: 'You are a helpful assistant that answers questions based on the provided context.',
              },
              {
                role: 'user',
                content: `Context:\n${context}\n\nQuestion: ${query}`,
              },
            ],
            max_tokens: 200,
          });
        },
        params: {},
      },
    ];

    const { results, traceId } = await kyra.wrapChain(steps, req.body.appName);

    const latency = Date.now() - startTime;

    console.log(`✅ RAG completed (${latency}ms): traceId: ${traceId}`);

    const finalResponse = results[1]?.choices?.[0]?.message?.content || 'No response generated';

    res.json({
      success: true,
      query,
      answer: finalResponse,
      retrievedDocs: results[0]?.docs?.length || 0,
      traceId,
      latency,
      traced: kyra.tracingEnabled,
    });
  } catch (error) {
    const latency = Date.now() - startTime;
    console.error(`❌ RAG error (${latency}ms):`, error.message);

    res.status(500).json({
      success: false,
      error: error.message,
      latency,
      traced: kyra.tracingEnabled,
    });
  }
});

// ============================================================================
// TESTING & VALIDATION ENDPOINTS
// ============================================================================

// Test Error Handling
app.post('/test/error', async (req, res) => {
  const startTime = Date.now();
  try {
    const { errorType = 'invalid_model' } = req.body;

    console.log(`🧪 Testing error handling: ${errorType}`);

    let testError;
    switch (errorType) {
      case 'invalid_model':
        testError = await kyra.chatCompletions({
          model: 'invalid-model-name-xyz',
          messages: [{ role: 'user', content: 'This should fail' }],
        });
        break;
      case 'invalid_key':
        // This will be caught by OpenAI SDK
        const originalKey = process.env.OPENAI_API_KEY;
        process.env.OPENAI_API_KEY = 'invalid-key';
        const tempKyra = new Kyra();
        testError = await tempKyra.chatCompletions({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: 'Test' }],
        });
        process.env.OPENAI_API_KEY = originalKey;
        break;
      default:
        throw new Error(`Unknown error type: ${errorType}`);
    }

    res.json({
      success: true,
      message: 'Error test completed',
      errorType,
      latency: Date.now() - startTime,
    });
  } catch (error) {
    const latency = Date.now() - startTime;
    console.log(`✅ Error caught as expected (${latency}ms):`, error.message);

    res.json({
      success: true,
      errorType: req.body.errorType,
      error: error.message,
      latency,
      traced: kyra.tracingEnabled,
      note: 'This error was traced to the dashboard',
    });
  }
});

// Batch Requests Test
app.post('/test/batch', async (req, res) => {
  const startTime = Date.now();
  try {
    const { count = 3, type = 'chat' } = req.body;

    console.log(`📦 Batch test: ${count} requests of type ${type}`);

    const requests = [];
    for (let i = 0; i < count; i++) {
      if (type === 'chat') {
        requests.push(
          kyra.chatCompletions({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: `Batch test message ${i + 1}` }],
            max_tokens: 20,
          })
        );
      } else if (type === 'embeddings') {
        requests.push(
          kyra.embeddings({
            model: 'text-embedding-3-small',
            input: `Batch test text ${i + 1}`,
          })
        );
      }
    }

    const results = await Promise.all(requests);
    const latency = Date.now() - startTime;

    console.log(`✅ Batch completed (${latency}ms): ${results.length} requests`);

    res.json({
      success: true,
      type,
      count: results.length,
      latency,
      avgLatency: latency / count,
      traced: kyra.tracingEnabled,
    });
  } catch (error) {
    const latency = Date.now() - startTime;
    console.error(`❌ Batch error (${latency}ms):`, error.message);

    res.status(500).json({
      success: false,
      error: error.message,
      latency,
      traced: kyra.tracingEnabled,
    });
  }
});

// Test Metrics
app.get('/test/metrics', (req, res) => {
  res.json({
    success: true,
    metrics: {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      sdk: {
        project: kyra.project,
        endpoint: kyra.endpoint,
        tracingEnabled: kyra.tracingEnabled,
      },
      timestamp: new Date().toISOString(),
    },
  });
});

// ============================================================================
// ERROR HANDLING
// ============================================================================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.path,
  });
});

app.use((err, req, res, next) => {
  console.error('❌ Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: err.message || 'Internal server error',
  });
});

// ============================================================================
// SERVER START
// ============================================================================

app.listen(PORT, () => {
  console.log('\n' + '='.repeat(60));
  console.log('🚀 Kyra Production Test Server');
  console.log('='.repeat(60));
  console.log(`📍 Port: ${PORT}`);
  console.log(`📊 Project: ${kyra.project}`);
  console.log(`🔗 Endpoint: ${kyra.endpoint}`);
  console.log(`📦 SDK: kyra-observability-sdk (from npm)`);
  console.log(`🔍 Tracing: ${kyra.tracingEnabled ? '✅ Enabled' : '❌ Disabled'}`);
  console.log('='.repeat(60));
  console.log('\n📋 Available Endpoints:');
  console.log('  GET  /health           - Health check');
  console.log('  GET  /status           - Server status & docs');
  console.log('  POST /chat             - Chat completion');
  console.log('  POST /embeddings       - Create embeddings');
  console.log('  POST /tools            - Chat with tool calling');
  console.log('  POST /chain            - Multi-step chain');
  console.log('  POST /chain/rag        - RAG pipeline');
  console.log('  POST /test/error       - Test error handling');
  console.log('  POST /test/batch       - Batch requests');
  console.log('  GET  /test/metrics     - Server metrics');
  console.log('\n📖 Example:');
  console.log(`  curl -X POST http://localhost:${PORT}/chat \\`);
  console.log(`    -H "Content-Type: application/json" \\`);
  console.log(`    -d '{"message":"Hello from production test!"}'`);
  console.log('\n' + '='.repeat(60) + '\n');
});

