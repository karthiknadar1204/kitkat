require('dotenv').config();
const express = require('express');
const Kyra = require('kyra');

const app = express();
const PORT = 4000;

// Initialize Kyra SDK
const kyra = new Kyra();

// No need to set sessionId - it will auto-find the "usagi" session!

app.use(express.json());

// Test endpoint - Simple chat completion
app.get('/test-chat', async (req, res) => {
  try {
    console.log('🧪 Testing chat completion...');
    
    const response = await kyra.chatCompletions({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: 'Hello! Say "Kyra is working!" in a fun way.' }],
      max_tokens: 50,
    });
    
    const message = response.choices[0].message.content;
    console.log('✅ Response:', message);
    
    res.json({
      success: true,
      message,
      traced: true
    });
  } catch (error) {
    console.error('❌ Error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Test endpoint - Embeddings
app.get('/test-embeddings', async (req, res) => {
  try {
    console.log('🧪 Testing embeddings...');
    
    const response = await kyra.embeddings({
      model: 'text-embedding-3-small',
      input: 'Testing Kyra observability platform',
    });
    
    console.log('✅ Embeddings created:', response.data.length, 'vectors');
    
    res.json({
      success: true,
      vectors: response.data.length,
      dimensions: response.data[0].embedding.length,
      traced: true
    });
  } catch (error) {
    console.error('❌ Error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Test endpoint - Chain
app.get('/test-chain', async (req, res) => {
  try {
    console.log('🧪 Testing chain...');
    
    const steps = [
      {
        name: 'retrieval',
        fn: async () => {
          console.log('  📚 Step 1: Mock retrieval');
          await new Promise(resolve => setTimeout(resolve, 100));
          return { docs: ['Document about AI and machine learning'] };
        },
        params: { query: 'What is AI?' },
        tokens: { input: 5, output: 10 },
      },
      {
        name: 'llm-generation',
        fn: async (params) => {
          console.log('  🤖 Step 2: LLM generation');
          return await kyra.chatCompletions(params);
        },
        params: {
          model: 'gpt-4o-mini',
          messages: [
            { role: 'user', content: 'Summarize: AI is a field of computer science' }
          ],
          max_tokens: 50,
        },
      },
    ];
    
    const { results, traceId } = await kyra.wrapChain(steps);
    console.log('✅ Chain completed! Trace ID:', traceId);
    
    res.json({
      success: true,
      steps: results.length,
      traceId,
      traced: true
    });
  } catch (error) {
    console.error('❌ Error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Health check
app.get('/', (req, res) => {
  res.json({
    message: 'Kyra Test Server Running! 🚀',
    project: process.env.LANGSMITH_PROJECT,
    endpoints: [
      'GET /test-chat - Test chat completion',
      'GET /test-embeddings - Test embeddings',
      'GET /test-chain - Test multi-step chain'
    ]
  });
});

app.listen(PORT, () => {
  console.log(`\n🚀 Kyra Test Server running on http://localhost:${PORT}`);
  console.log(`📊 Project: ${process.env.LANGSMITH_PROJECT}`);
  console.log(`🔗 Backend: ${process.env.LANGSMITH_ENDPOINT}`);
  console.log(`\nTest endpoints:`);
  console.log(`  http://localhost:${PORT}/test-chat`);
  console.log(`  http://localhost:${PORT}/test-embeddings`);
  console.log(`  http://localhost:${PORT}/test-chain\n`);
});

