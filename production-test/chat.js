require('dotenv').config();
const readline = require('readline');
const Kyra = require('kyra-observability-sdk');

// Initialize Kyra SDK
const kyra = new Kyra();

// Conversation history
const messages = [
  { role: 'system', content: 'You are a helpful assistant.' }
];

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('\n🎯 Kyra Chat Terminal');
console.log('📊 Project:', process.env.KYRA_PROJECT);
console.log('📦 SDK: kyra-observability-sdk@0.1.1 (published from npm)');
console.log('💬 Start chatting! (type "exit" to quit)\n');

function chat() {
  rl.question('You: ', async (userMessage) => {
    if (!userMessage.trim()) {
      return chat();
    }

    if (userMessage.toLowerCase() === 'exit') {
      console.log('\n👋 Goodbye!\n');
      rl.close();
      process.exit(0);
    }

    // Add user message to history
    messages.push({ role: 'user', content: userMessage });

    try {
      // Call OpenAI via Kyra SDK (automatically traced!)
      const response = await kyra.chatCompletions({
        model: 'gpt-4o-mini',
        messages: messages,
      });

      const assistantMessage = response.choices[0].message.content;
      
      // Add assistant response to history
      messages.push({ role: 'assistant', content: assistantMessage });

      console.log(`\n🤖 Assistant: ${assistantMessage}\n`);
      
      // Show token usage
      console.log(`📊 Tokens: ${response.usage.total_tokens} (prompt: ${response.usage.prompt_tokens}, completion: ${response.usage.completion_tokens})\n`);

    } catch (error) {
      console.error('\n❌ Error:', error.message, '\n');
    }

    // Continue conversation
    chat();
  });
}

// Start chatting
chat();

