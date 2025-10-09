const OpenAI = require('openai');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

class Kyra {
  constructor(options = {}) {
    const {
      apiKey = process.env.LANGSMITH_API_KEY,
      endpoint = process.env.LANGSMITH_ENDPOINT || 'http://localhost:3002/api',
      project = process.env.LANGSMITH_PROJECT || 'default',
      tracingEnabled = process.env.LANGSMITH_TRACING !== 'false',
    } = options;
    
    if (!apiKey) throw new Error('LANGSMITH_API_KEY required');
    if (!process.env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY required');
    
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    this.endpoint = endpoint;
    this.apiKey = apiKey;
    this.project = project;
    this.tracingEnabled = tracingEnabled;
    this.sessionId = null;
  }

  shouldTrace() {
    return this.tracingEnabled;
  }

  async chatCompletions(params) {
    const startTime = Date.now();
    
    try {
      const response = await this.openai.chat.completions.create(params);
      const latency = Date.now() - startTime;

      if (this.shouldTrace()) {
        const span = {
          name: 'openai-chat',
          input: params,
          output: response,
          latency,
          tokens: {
            input: response.usage?.prompt_tokens || 0,
            output: response.usage?.completion_tokens || 0,
          },
        };

        await this.sendTrace({
          appName: this.project,
          spans: [span],
          metadata: { method: 'chat.completions.create' },
          sessionId: this.sessionId,
        });
      }

      return response;
      
    } catch (err) {
      const latency = Date.now() - startTime;
      
      if (this.shouldTrace()) {
        await this.sendTrace({
          appName: this.project,
          spans: [{
            name: 'openai-chat-error',
            input: params,
            output: { error: err.message },
            latency,
            tokens: { input: 0, output: 0 },
          }],
          metadata: { method: 'chat.completions.create', error: true },
          sessionId: this.sessionId,
        });
      }
      
      throw err;
    }
  }

  async wrapChain(steps, appName = this.project) {
    const startTime = Date.now();
    const spans = [];

    try {
      for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        const stepStart = Date.now();
        const result = await step.fn(step.params);
        const latency = Date.now() - stepStart;

        const span = {
          name: step.name || `step-${spans.length + 1}`,
          input: step.params,
          output: result,
          latency,
          tokens: step.tokens || undefined,
        };
        spans.push(span);
      }

      if (this.shouldTrace()) {
        const payload = {
          appName,
          spans,
          metadata: { method: 'chain', totalLatency: Date.now() - startTime },
          sessionId: this.sessionId,
        };

        const response = await this.sendTrace(payload);
        this.sessionId = response.data.sessionId || this.sessionId;
        
        return { 
          results: spans.map(s => s.output), 
          traceId: response.data.traceId 
        };
      }

      return { 
        results: spans.map(s => s.output), 
        traceId: null 
      };
      
    } catch (err) {
      if (this.shouldTrace()) {
        await this.sendTrace({
          appName,
          spans: [...spans, {
            name: 'chain-error',
            input: steps[spans.length]?.params || {},
            output: { error: err.message },
            latency: Date.now() - startTime,
            tokens: { input: 0, output: 0 },
          }],
          metadata: { method: 'chain', error: true },
          sessionId: this.sessionId,
        });
      }
      throw err;
    }
  }

  async sendTrace(payload) {
    try {
      const response = await axios.post(`${this.endpoint}/traces`, payload, {
        headers: { 'X-API-Key': this.apiKey },
      });
      return response;
    } catch (err) {
      console.warn('Failed to send trace:', err.message);
      return { data: {} };
    }
  }
}

module.exports = Kyra;
