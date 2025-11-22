require('dotenv').config();
const axios = require('axios');

const BASE_URL = process.env.TEST_URL || 'http://localhost:5002';

async function quickTest() {
  console.log('🚀 Quick Test Suite for Kyra Production Server\n');
  console.log(`📍 Testing server at: ${BASE_URL}\n`);

  // Test 1: Health Check
  try {
    console.log('1️⃣  Testing /health...');
    const health = await axios.get(`${BASE_URL}/health`);
    console.log('   ✅ Health:', health.data.status);
    console.log('   📊 Uptime:', health.data.uptime.toFixed(2), 'seconds');
    console.log('   🔍 Tracing:', health.data.sdk.tracingEnabled ? 'Enabled' : 'Disabled');
  } catch (error) {
    console.log('   ❌ Failed:', error.message);
    return;
  }

  // Test 2: Status
  try {
    console.log('\n2️⃣  Testing /status...');
    const status = await axios.get(`${BASE_URL}/status`);
    console.log('   ✅ Server:', status.data.message);
    console.log('   📦 SDK:', status.data.sdk);
    console.log('   📊 Project:', status.data.project);
  } catch (error) {
    console.log('   ❌ Failed:', error.message);
  }

  // Test 3: Chat
  try {
    console.log('\n3️⃣  Testing /chat...');
    const chat = await axios.post(`${BASE_URL}/chat`, {
      message: 'Say "Hello from production test!" in one sentence.',
      max_tokens: 30,
    });
    console.log('   ✅ Response:', chat.data.message.substring(0, 60) + '...');
    console.log('   ⏱️  Latency:', chat.data.latency + 'ms');
    console.log('   🎫 Tokens:', chat.data.usage.total_tokens);
  } catch (error) {
    console.log('   ❌ Failed:', error.response?.data?.error || error.message);
  }

  // Test 4: Embeddings
  try {
    console.log('\n4️⃣  Testing /embeddings...');
    const emb = await axios.post(`${BASE_URL}/embeddings`, {
      input: 'Testing Kyra observability platform',
    });
    console.log('   ✅ Created:', emb.data.count, 'vectors');
    console.log('   📐 Dimensions:', emb.data.dimensions);
    console.log('   ⏱️  Latency:', emb.data.latency + 'ms');
  } catch (error) {
    console.log('   ❌ Failed:', error.response?.data?.error || error.message);
  }

  // Test 5: Tools
  try {
    console.log('\n5️⃣  Testing /tools...');
    const tools = await axios.post(`${BASE_URL}/tools`, {
      message: 'What is the current time?',
    });
    console.log('   ✅ Response:', tools.data.message.substring(0, 60) + '...');
    console.log('   ⏱️  Latency:', tools.data.latency + 'ms');
  } catch (error) {
    console.log('   ❌ Failed:', error.response?.data?.error || error.message);
  }

  console.log('\n✅ Quick test complete!\n');
  console.log('💡 Run full test suite: npm test');
  console.log('💡 Or test individual endpoints with curl (see README.md)\n');
}

quickTest().catch(console.error);

