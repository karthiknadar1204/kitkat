require('dotenv').config();
const axios = require('axios');
const Kyra = require('kyra');

if (process.env.LANGSMITH_TRACING !== 'true') {
  console.log('Tracing disabled—set LANGSMITH_TRACING=true');
  process.exit(0);
}

async function runTests() {
  const sdk = new Kyra({
    endpoint: process.env.LANGSMITH_ENDPOINT,
    project: process.env.LANGSMITH_PROJECT,
  });

  // Test 1: Normal LLM call
  console.log('\n🧪 Test 1: Normal LLM call...');
  try {
    const response = await sdk.chatCompletions({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: 'Hello from SDK test!' }],
      max_tokens: 50,
    });
    console.log('✅ Response:', response.choices[0].message.content);
  } catch (err) {
    console.error('❌ Test 1 failed:', err.message);
  }

  // Test 2: Error case (invalid model)
  console.log('\n🧪 Test 2: Error case (invalid model)...');
  try {
    await sdk.chatCompletions({
      model: 'invalid-model',
      messages: [{ role: 'user', content: 'This should fail' }],
    });
  } catch (err) {
    console.log('✅ Expected error:', err.message);
  }

  // Test 3: Chain with fake retrieval + LLM
  console.log('\n🧪 Test 3: Chain test...');
  try {
    const steps = [
      {
        name: 'retrieval',
        fn: async () => {
          console.log('🔍 Mock retrieval step...');
          await new Promise(resolve => setTimeout(resolve, 100)); // Simulate retrieval delay
          return { docs: ['Fake doc content about AI and machine learning'] };
        },
        params: { query: 'test query' },
        tokens: { input: 5, output: 10 },
      },
      {
        name: 'llm-prompt',
        fn: async (params) => {
          console.log('🤖 Mock LLM step...');
          return await sdk.openai.chat.completions.create(params);
        },
        params: {
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: 'Summarize: Fake doc content about AI and machine learning' }],
          max_tokens: 50,
        },
      },
    ];
    const { results, traceId } = await sdk.wrapChain(steps);
    console.log('✅ Chain Results:', results);
    console.log('✅ Trace ID:', traceId);
  } catch (err) {
    console.error('❌ Test 3 failed:', err.message);
  }

  // Verify traces
  try {
    const tracesRes = await axios.get(`${process.env.LANGSMITH_ENDPOINT}/api/traces`, {
      headers: { 'X-API-Key': process.env.LANGSMITH_API_KEY },
    });
    console.log('\n🔍 Latest Traces:', tracesRes.data.slice(0, 2).map(t => t.traceId));
  } catch (err) {
    console.error('❌ Trace fetch failed:', err.message);
  }
}


runTests();