require('dotenv').config();
const readline = require('readline');
const Kyra = require('kyra-observability-sdk');

// Initialize Kyra SDK
const kyra = new Kyra();

// Define our tools
const tools = [
  {
    name: 'get_weather',
    description: 'Get the current weather for a location',
    parameters: {
      type: 'object',
      properties: {
        location: {
          type: 'string',
          description: 'The city and country, e.g. London, UK'
        }
      },
      required: ['location']
    },
    fn: async ({ location }) => {
      // Mock weather data
      const conditions = ['sunny', 'cloudy', 'rainy', 'snowy', 'windy'];
      const temp = Math.floor(Math.random() * 30) + 10;
      const condition = conditions[Math.floor(Math.random() * conditions.length)];
      
      console.log(`🔧 [TOOL CALLED] get_weather(${location})`);
      return {
        location,
        temperature: `${temp}°C`,
        condition,
        humidity: `${Math.floor(Math.random() * 40) + 40}%`
      };
    }
  },
  {
    name: 'get_random_day',
    description: 'Get a random day of the week',
    parameters: {
      type: 'object',
      properties: {},
      required: []
    },
    fn: async () => {
      const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      const randomDay = days[Math.floor(Math.random() * days.length)];
      
      console.log(`🔧 [TOOL CALLED] get_random_day()`);
      return {
        day: randomDay,
        isWeekend: randomDay === 'Saturday' || randomDay === 'Sunday'
      };
    }
  },
  {
    name: 'add_numbers',
    description: 'Add two numbers together',
    parameters: {
      type: 'object',
      properties: {
        a: {
          type: 'number',
          description: 'The first number'
        },
        b: {
          type: 'number',
          description: 'The second number'
        }
      },
      required: ['a', 'b']
    },
    fn: async ({ a, b }) => {
      console.log(`🔧 [TOOL CALLED] add_numbers(${a}, ${b})`);
      return {
        a,
        b,
        sum: a + b
      };
    }
  }
];

// Conversation history
const messages = [
  { 
    role: 'system', 
    content: 'You are a helpful assistant with access to tools. Use the tools when needed to answer questions accurately.' 
  }
];

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('\n🛠️  Kyra Tool Calling Test');
console.log('📊 Project:', process.env.KYRA_PROJECT);
console.log('🔗 Endpoint:', process.env.KYRA_ENDPOINT);
console.log('\n🔧 Available Tools:');
console.log('  - get_weather(location) - Get weather for any city');
console.log('  - get_random_day() - Get a random day of the week');
console.log('  - add_numbers(a, b) - Add two numbers');
console.log('\n💬 Try asking:');
console.log('  "What\'s the weather in Tokyo?"');
console.log('  "Give me a random day and add 25 + 17"');
console.log('  "Add 42 and 58, then tell me the weather in Paris"');
console.log('\nType "exit" to quit\n');

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
      console.log('\n⏳ Processing (may call tools)...\n');
      
      // Call OpenAI with tools via Kyra SDK (automatically traced!)
      const response = await kyra.chatCompletionsWithTools({
        model: 'gpt-4o-mini',
        messages: messages,
      }, tools);

      const assistantMessage = response.choices[0].message.content;
      
      // Add assistant response to history
      messages.push({ role: 'assistant', content: assistantMessage });

      console.log(`🤖 Assistant: ${assistantMessage}\n`);
      
      // Show token usage
      console.log(`📊 Tokens: ${response.usage.total_tokens} (prompt: ${response.usage.prompt_tokens}, completion: ${response.usage.completion_tokens})`);
      console.log(`🔄 Tool iterations completed\n`);

    } catch (error) {
      console.error('\n❌ Error:', error.message, '\n');
    }

    // Continue conversation
    chat();
  });
}

// Start chatting
chat();

