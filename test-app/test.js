require('dotenv').config();
const LangSmithSDK = require('langsmith-sdk');

async function test() {
  console.log('🚀 Testing LangSmith SDK Package...\n');
  
  const sdk = new LangSmithSDK();
  
  try {
    // Test 1: Single LLM call
    console.log('📝 Test 1: Single LLM Call');
    const response = await sdk.chatCompletions({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: 'Test publish!' }],
      max_tokens: 50,
    });
    console.log('✅ Response:', response.choices[0].message.content);
    console.log('');

    // Test 2: Multi-step chain
    console.log('📝 Test 2: Multi-step Chain');
    const steps = [
      { 
        name: 'mock-retrieval', 
        fn: async () => {
          console.log('  🔍 Executing mock retrieval...');
          return { data: 'test document content' };
        }, 
        params: {}, 
        tokens: { input: 1, output: 1 } 
      },
      { 
        name: 'llm-generation', 
        fn: async (p) => {
          console.log('  🤖 Executing LLM generation...');
          return await sdk.openai.chat.completions.create(p);
        }, 
        params: { 
          model: 'gpt-4o-mini', 
          messages: [{ role: 'user', content: 'Say hi!' }],
          max_tokens: 20,
        } 
      },
    ];
    
    const { results, traceId } = await sdk.wrapChain(steps);
    console.log('✅ Chain Trace ID:', traceId);
    console.log('✅ Chain Results:', results.length, 'steps completed');
    console.log('');

    console.log('🎉 All tests passed! Package working correctly.\n');
    
  } catch (err) {
    console.error('❌ Error:', err.message);
    console.error('🔍 Full error:', err);
    process.exit(1);
  }
}

test();

