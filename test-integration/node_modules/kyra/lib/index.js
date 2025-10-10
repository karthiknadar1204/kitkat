const OpenAI = require('openai');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

class KyraError extends Error {
  constructor(message, originalError, method) {
    super(message);
    this.name = 'KyraError';
    this.originalError = originalError;
    this.method = method;
    this.timestamp = new Date().toISOString();
  }
}

class Kyra {
  constructor(options = {}) {
    const {
      apiKey = process.env.LANGSMITH_API_KEY,
      endpoint = process.env.LANGSMITH_ENDPOINT || 'https://kitkat-production.up.railway.app/api',
      project = process.env.LANGSMITH_PROJECT || 'default',
      tracingEnabled = process.env.LANGSMITH_TRACING !== 'false',
    } = options;
    
    if (!apiKey) throw new Error('LANGSMITH_API_KEY required');
    if (!process.env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY required');
    
    this.openai = new OpenAI({ 
      apiKey: process.env.OPENAI_API_KEY,
      timeout: 30000,
      maxRetries: 2,
    });
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
      const errorDetails = {
        message: err.message,
        code: err.code || err.type || 'unknown',
        status: err.status || err.statusCode,
      };
      
      if (this.shouldTrace()) {
        await this.sendTrace({
          appName: this.project,
          spans: [{
            name: 'openai-chat-error',
            input: params,
            output: { 
              error: errorDetails.message,
              code: errorDetails.code,
              status: errorDetails.status,
            },
            latency,
            tokens: { input: 0, output: 0 },
          }],
          metadata: { 
            method: 'chat.completions.create', 
            error: true,
            errorCode: errorDetails.code,
            httpStatus: errorDetails.status,
          },
          sessionId: this.sessionId,
        });
      }
      
      throw new KyraError(
        `Chat completion failed: ${errorDetails.message}`,
        err,
        'chatCompletions'
      );
    }
  }

  async embeddings(params) {
    const startTime = Date.now();
    
    try {
      const response = await this.openai.embeddings.create(params);
      const latency = Date.now() - startTime;

      if (this.shouldTrace()) {
        const span = {
          name: 'openai-embeddings',
          input: params,
          output: response,
          latency,
          tokens: {
            input: response.usage?.prompt_tokens || 0,
            output: 0,
          },
        };

        await this.sendTrace({
          appName: this.project,
          spans: [span],
          metadata: { method: 'embeddings.create' },
          sessionId: this.sessionId,
        });
      }

      return response;
      
    } catch (err) {
      const latency = Date.now() - startTime;
      const errorDetails = {
        message: err.message,
        code: err.code || err.type || 'unknown',
        status: err.status || err.statusCode,
      };
      
      if (this.shouldTrace()) {
        await this.sendTrace({
          appName: this.project,
          spans: [{
            name: 'openai-embeddings-error',
            input: params,
            output: { 
              error: errorDetails.message,
              code: errorDetails.code,
              status: errorDetails.status,
            },
            latency,
            tokens: { input: 0, output: 0 },
          }],
          metadata: { 
            method: 'embeddings.create', 
            error: true,
            errorCode: errorDetails.code,
            httpStatus: errorDetails.status,
          },
          sessionId: this.sessionId,
        });
      }
      
      throw new KyraError(
        `Embeddings failed: ${errorDetails.message}`,
        err,
        'embeddings'
      );
    }
  }

  async chatCompletionsWithTools(params, tools = []) {
    const startTime = Date.now();
    const allSpans = [];
    let messages = [...params.messages];
    const maxIterations = 10;
    let iterations = 0;

    try {
      while (iterations < maxIterations) {
        iterations++;
        const iterStart = Date.now();
        
        const toolSchemas = tools.map(t => ({
          type: 'function',
          function: {
            name: t.name,
            description: t.description,
            parameters: t.parameters,
          }
        }));

        const response = await this.openai.chat.completions.create({
          ...params,
          messages,
          tools: toolSchemas.length > 0 ? toolSchemas : undefined,
        });

        const iterLatency = Date.now() - iterStart;
        
        allSpans.push({
          name: `llm-call-${iterations}`,
          input: { messages, tools: toolSchemas },
          output: response,
          latency: iterLatency,
          tokens: {
            input: response.usage?.prompt_tokens || 0,
            output: response.usage?.completion_tokens || 0,
          },
        });

        const assistantMessage = response.choices[0].message;
        messages.push(assistantMessage);

        if (!assistantMessage.tool_calls || assistantMessage.tool_calls.length === 0) {
          if (this.shouldTrace()) {
            await this.sendTrace({
              appName: this.project,
              spans: allSpans,
              metadata: { method: 'chat.completions.withTools', iterations },
              sessionId: this.sessionId,
            });
          }
          return response;
        }

        for (const toolCall of assistantMessage.tool_calls) {
          const tool = tools.find(t => t.name === toolCall.function.name);
          if (!tool) continue;

          const toolStart = Date.now();
          const args = JSON.parse(toolCall.function.arguments);
          const toolResult = await tool.fn(args);
          const toolLatency = Date.now() - toolStart;

          allSpans.push({
            name: `tool-${toolCall.function.name}`,
            input: args,
            output: toolResult,
            latency: toolLatency,
            tokens: { input: 0, output: 0 },
          });

          messages.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            content: JSON.stringify(toolResult),
          });
        }
      }

      throw new Error('Max tool iterations reached');
      
    } catch (err) {
      const latency = Date.now() - startTime;
      const errorDetails = {
        message: err.message,
        code: err.code || err.type || 'unknown',
        status: err.status || err.statusCode,
      };
      
      if (this.shouldTrace()) {
        await this.sendTrace({
          appName: this.project,
          spans: [...allSpans, {
            name: 'tool-error',
            input: params,
            output: { 
              error: errorDetails.message,
              code: errorDetails.code,
              status: errorDetails.status,
            },
            latency,
            tokens: { input: 0, output: 0 },
          }],
          metadata: { 
            method: 'chat.completions.withTools', 
            error: true,
            errorCode: errorDetails.code,
            httpStatus: errorDetails.status,
            iterations,
          },
          sessionId: this.sessionId,
        });
      }
      
      throw new KyraError(
        `Tool completion failed: ${errorDetails.message}`,
        err,
        'chatCompletionsWithTools'
      );
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
      const errorDetails = {
        message: err.message,
        code: err.code || err.type || 'unknown',
        status: err.status || err.statusCode,
      };
      
      if (this.shouldTrace()) {
        await this.sendTrace({
          appName,
          spans: [...spans, {
            name: 'chain-error',
            input: steps[spans.length]?.params || {},
            output: { 
              error: errorDetails.message,
              code: errorDetails.code,
              status: errorDetails.status,
            },
            latency: Date.now() - startTime,
            tokens: { input: 0, output: 0 },
          }],
          metadata: { 
            method: 'chain', 
            error: true,
            errorCode: errorDetails.code,
            httpStatus: errorDetails.status,
            completedSteps: spans.length,
          },
          sessionId: this.sessionId,
        });
      }
      throw new KyraError(
        `Chain failed at step ${spans.length + 1}: ${errorDetails.message}`,
        err,
        'wrapChain'
      );
    }
  }

  async sendTrace(payload, retries = 2) {
    try {
      const response = await axios.post(`${this.endpoint}/traces`, payload, {
        headers: { 'X-API-Key': this.apiKey },
        timeout: 5000,
      });
      return response;
    } catch (err) {
      if (retries > 0 && err.code !== 'ECONNABORTED') {
        const delay = 1000 * (3 - retries);
        console.warn(`Retrying trace send (${retries} attempts left) after ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.sendTrace(payload, retries - 1);
      }
      console.warn('Failed to send trace after retries:', err.message);
      return { data: {} };
    }
  }
}

module.exports = Kyra;
