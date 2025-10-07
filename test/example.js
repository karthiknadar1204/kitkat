require('dotenv').config();  // Loads .env
const axios = require('axios');
const LangSmithSDK = require('../langsmith-sdk/lib/index.js');  // Import from SDK folder

// Optional: Enable tracing only if env var set (LangSmith style)
if (process.env.LANGSMITH_TRACING !== 'true') {
  console.log('Tracing disabled—set LANGSMITH_TRACING=true');
  process.exit(0);
}

async function runTest() {
  try {
    console.log('\n🎯 ===== EXAMPLE.JS TEST START =====');
    console.log('🔧 Environment Variables:');
    console.log('  - LANGSMITH_ENDPOINT:', process.env.LANGSMITH_ENDPOINT);
    console.log('  - LANGSMITH_PROJECT:', process.env.LANGSMITH_PROJECT);
    console.log('  - LANGSMITH_API_KEY:', process.env.LANGSMITH_API_KEY?.substring(0, 10) + '...');
    console.log('  - OPENAI_API_KEY:', process.env.OPENAI_API_KEY?.substring(0, 10) + '...');
    console.log('  - LANGSMITH_TRACING:', process.env.LANGSMITH_TRACING);
    
    console.log('\n🚀 Initializing SDK...');
    const sdk = new LangSmithSDK({
      endpoint: process.env.LANGSMITH_ENDPOINT,
      project: process.env.LANGSMITH_PROJECT,
    });
    console.log('✅ SDK initialized successfully!');

    console.log('\n🤖 Starting intercepted OpenAI call...');
    console.log('📋 Request Parameters:');
    const requestParams = {
      model: 'gpt-4o-mini',  // Cheap/fast for testing
      messages: [{ role: 'user', content: 'who is the prime minister of india and how old is he and how to make pizza?' }],
      max_tokens: 50,
    };
    console.log(JSON.stringify(requestParams, null, 2));

    const response = await sdk.chatCompletions(requestParams);

    console.log('\n🎉 ===== FINAL RESULTS =====');
    console.log('✅ OpenAI Response:', response.choices[0].message.content);
    console.log('✅ Usage Stats:', response.usage);
    console.log('✅ Latency/Tokens intercepted & trace sent to backend!');
    
    console.log('\n🔍 Fetching traces to verify...');
    try {
      const tracesRes = await axios.get(`${process.env.LANGSMITH_ENDPOINT}/api/traces`, {
        headers: { 'X-API-Key': process.env.LANGSMITH_API_KEY },
      });
      console.log('📊 Traces Response:', JSON.stringify(tracesRes.data, null, 2));
      console.log('🔍 Latest Trace ID:', tracesRes.data[0]?.traceId || 'No traces yet');
      console.log('📈 Total Traces Found:', tracesRes.data.length);
    } catch (traceError) {
      console.error('❌ Failed to fetch traces:', traceError.message);
    }
    
    console.log('\n🏁 ===== EXAMPLE.JS TEST END =====\n');
    
  } catch (err) {
    console.error('\n❌ ===== TEST FAILED =====');
    console.error('❌ Test failed:', err.message);
    console.error('🔍 Full error:', err);
    if (err.response) {
      console.error('📡 Backend error:', err.response.data);
      console.error('📊 Status:', err.response.status);
      console.error('🔗 URL:', err.config?.url);
    }
    console.error('🏁 ===== ERROR END =====\n');
  }
}

runTest();