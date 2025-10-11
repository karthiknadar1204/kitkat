require('dotenv').config();
const express = require('express');
const Kyra = require('kyra-observability-sdk');

const app = express();
const PORT = 5000;

// Initialize Kyra SDK
const kyra = new Kyra();

app.use(express.json());

// Simple chat endpoint
app.post('/chat', async (req, res) => {
  try {
    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    console.log(`💬 User: ${message}`);
    
    const response = await kyra.chatCompletions({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: message }
      ]
    });
    
    const reply = response.choices[0].message.content;
    console.log(`🤖 Assistant: ${reply}`);
    
    res.json({
      success: true,
      message: reply,
      usage: response.usage,
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
    message: '🚀 Kyra Production Test Server',
    project: process.env.KYRA_PROJECT,
    sdk: 'kyra-observability-sdk@0.1.1 (published)',
    endpoints: [
      'POST /chat - Chat with AI (body: { message: "your text" })'
    ]
  });
});

app.listen(PORT, () => {
  console.log(`\n🚀 Production Test Server running on http://localhost:${PORT}`);
  console.log(`📊 Project: ${process.env.KYRA_PROJECT}`);
  console.log(`📦 SDK: kyra-observability-sdk@0.1.1 (from npm)`);
  console.log(`🔗 Backend: ${process.env.KYRA_ENDPOINT}`);
  console.log(`\nTest it:`);
  console.log(`  curl -X POST http://localhost:${PORT}/chat -H "Content-Type: application/json" -d '{"message":"Hello!"}'`);
  console.log('');
});

