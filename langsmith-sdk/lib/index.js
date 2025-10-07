const OpenAI = require('openai');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();  // Loads env vars

class LangSmithSDK {
  constructor({ apiKey, endpoint = 'http://localhost:3002/api', project = 'default' }) {
    if (!process.env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY environment variable required');
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    this.endpoint = endpoint;
    this.apiKey = apiKey || process.env.LANGSMITH_API_KEY;
    this.project = project || process.env.LANGSMITH_PROJECT;
    this.sessionId = null;  // Auto-managed
    if (!this.apiKey) throw new Error('LANGSMITH_API_KEY required');
  }

  // Optional: Start explicit session (defaults to auto)
  async startSession(appName) {
    const response = await axios.post(`${this.endpoint}/traces`, {
      appName,
      spans: [],  // Empty to just create session
      metadata: { action: 'start-session' },
    }, { headers: { 'X-API-Key': this.apiKey } });
    this.sessionId = response.data.sessionId;
    return this.sessionId;
  }

  // Wrapped OpenAI call (intercepts everything)
  async chatCompletions(params) {
    console.log('\n🚀 ===== LANGSMITH SDK TRACE START =====');
    console.log('📝 Input Parameters:', JSON.stringify(params, null, 2));
    
    const startTime = Date.now();
    let response;
    let latency;
    let tokens = { input: 0, output: 0 };

    try {
      console.log('🤖 Making OpenAI API call...');
      response = await this.openai.chat.completions.create(params);
      latency = Date.now() - startTime;
      tokens = {
        input: response.usage?.prompt_tokens || 0,
        output: response.usage?.completion_tokens || 0,
      };
      
      console.log('✅ OpenAI Response received!');
      console.log('📊 Response Data:', JSON.stringify(response, null, 2));
      console.log('⏱️  Latency:', latency + 'ms');
      console.log('🔢 Tokens - Input:', tokens.input, 'Output:', tokens.output);
      
    } catch (error) {
      latency = Date.now() - startTime;
      console.error('❌ OpenAI API Error:', error.message);
      console.error('🔍 Error Details:', error);
      throw error; // Re-throw OpenAI errors
    }

    const span = {
      name: 'openai-chat',
      input: params,
      output: response,
      latency,
      tokens,
    };

    console.log('📦 Trace Span Data:', JSON.stringify(span, null, 2));

    // Send trace (auto-session if not set)
    try {
      const payload = {
        appName: this.project,
        spans: [span],
        metadata: { method: 'chat.completions.create' },
        sessionId: this.sessionId,  // Optional; backend auto-creates if null
      };
      
      console.log('📤 Sending trace to backend...');
      console.log('🎯 Endpoint:', `${this.endpoint}/traces`);
      console.log('🔑 API Key:', this.apiKey.substring(0, 10) + '...');
      console.log('📋 Payload:', JSON.stringify(payload, null, 2));
      
      const traceResponse = await axios.post(`${this.endpoint}/traces`, payload, {
        headers: { 'X-API-Key': this.apiKey },
      });
      
      console.log('✅ Trace sent successfully!');
      console.log('📨 Backend Response:', JSON.stringify(traceResponse.data, null, 2));
      
    } catch (traceError) {
      console.error('❌ Failed to send trace:', traceError.message);
      console.error('🔍 Trace Error Details:', traceError.response?.data || traceError);
      // Don't throw - tracing failure shouldn't break the app
    }

    console.log('🏁 ===== LANGSMITH SDK TRACE END =====\n');
    return response;
  }

  // Extend for other methods (e.g., completions.create) similarly
}

module.exports = LangSmithSDK;