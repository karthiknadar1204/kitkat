// OpenAI pricing per 1M tokens (as of 2024)
// Prices are in dollars per million tokens
export const OPENAI_PRICING = {
  // GPT-4o models
  'gpt-4o': {
    input: 2.50,
    output: 10.00,
  },
  'gpt-4o-2024-08-06': {
    input: 2.50,
    output: 10.00,
  },
  'gpt-4o-2024-05-13': {
    input: 5.00,
    output: 15.00,
  },
  
  // GPT-4o-mini models
  'gpt-4o-mini': {
    input: 0.15,
    output: 0.60,
  },
  'gpt-4o-mini-2024-07-18': {
    input: 0.15,
    output: 0.60,
  },
  
  // GPT-4 Turbo
  'gpt-4-turbo': {
    input: 10.00,
    output: 30.00,
  },
  'gpt-4-turbo-2024-04-09': {
    input: 10.00,
    output: 30.00,
  },
  'gpt-4-turbo-preview': {
    input: 10.00,
    output: 30.00,
  },
  
  // GPT-4
  'gpt-4': {
    input: 30.00,
    output: 60.00,
  },
  'gpt-4-0613': {
    input: 30.00,
    output: 60.00,
  },
  
  // GPT-3.5 Turbo
  'gpt-3.5-turbo': {
    input: 0.50,
    output: 1.50,
  },
  'gpt-3.5-turbo-0125': {
    input: 0.50,
    output: 1.50,
  },
  
  // Embeddings
  'text-embedding-3-small': {
    input: 0.02,
    output: 0,
  },
  'text-embedding-3-large': {
    input: 0.13,
    output: 0,
  },
  'text-embedding-ada-002': {
    input: 0.10,
    output: 0,
  },
  
  // Default fallback
  'default': {
    input: 0.15,
    output: 0.60,
  },
};

/**
 * Calculate cost for a given model and token counts
 * @param {string} model - Model name (e.g., 'gpt-4o-mini')
 * @param {number} inputTokens - Number of input tokens
 * @param {number} outputTokens - Number of output tokens
 * @returns {number} - Cost in dollars
 */
export function calculateCost(model, inputTokens, outputTokens) {
  // Get pricing for the model, fallback to default
  const pricing = OPENAI_PRICING[model] || OPENAI_PRICING['default'];
  
  // Calculate cost per million tokens, then multiply by actual tokens
  const inputCost = (inputTokens / 1_000_000) * pricing.input;
  const outputCost = (outputTokens / 1_000_000) * pricing.output;
  
  return inputCost + outputCost;
}

/**
 * Extract model name from span input
 * @param {object} spanInput - The input object from a span
 * @returns {string} - Model name or 'default'
 */
export function extractModelName(spanInput) {
  if (!spanInput) return 'default';
  
  // Direct model field
  if (spanInput.model) return spanInput.model;
  
  // Nested in params
  if (spanInput.params && spanInput.params.model) return spanInput.params.model;
  
  return 'default';
}

