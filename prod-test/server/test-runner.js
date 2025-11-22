require('dotenv').config();
const axios = require('axios');

const BASE_URL = process.env.TEST_URL || 'http://localhost:5002';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logTest(name) {
  log(`\n🧪 Testing: ${name}`, 'cyan');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runTests() {
  log('\n' + '='.repeat(60), 'blue');
  log('🚀 Kyra SDK Production Test Runner', 'blue');
  log('='.repeat(60), 'blue');

  const results = {
    passed: 0,
    failed: 0,
    tests: [],
  };

  // Test 1: Health Check
  logTest('Health Check');
  try {
    const response = await axios.get(`${BASE_URL}/health`);
    if (response.data.status === 'healthy') {
      logSuccess('Health check passed');
      results.passed++;
      results.tests.push({ name: 'Health Check', status: 'passed' });
    } else {
      throw new Error('Health check returned unhealthy status');
    }
  } catch (error) {
    logError(`Health check failed: ${error.message}`);
    results.failed++;
    results.tests.push({ name: 'Health Check', status: 'failed', error: error.message });
  }

  // Test 2: Status Check
  logTest('Status Check');
  try {
    const response = await axios.get(`${BASE_URL}/status`);
    if (response.data.message && response.data.endpoints) {
      logSuccess('Status check passed');
      logInfo(`Project: ${response.data.project}`);
      logInfo(`SDK: ${response.data.sdk}`);
      results.passed++;
      results.tests.push({ name: 'Status Check', status: 'passed' });
    } else {
      throw new Error('Status check returned invalid response');
    }
  } catch (error) {
    logError(`Status check failed: ${error.message}`);
    results.failed++;
    results.tests.push({ name: 'Status Check', status: 'failed', error: error.message });
  }

  // Test 3: Chat Completions
  logTest('Chat Completions');
  try {
    const response = await axios.post(`${BASE_URL}/chat`, {
      message: 'Say "Hello from production test!" in one sentence.',
      max_tokens: 30,
    });
    if (response.data.success && response.data.message) {
      logSuccess(`Chat completions passed (${response.data.latency}ms)`);
      logInfo(`Response: ${response.data.message.substring(0, 50)}...`);
      logInfo(`Tokens: ${response.data.usage.total_tokens}`);
      results.passed++;
      results.tests.push({ name: 'Chat Completions', status: 'passed', latency: response.data.latency });
    } else {
      throw new Error('Chat completions returned invalid response');
    }
  } catch (error) {
    logError(`Chat completions failed: ${error.message}`);
    results.failed++;
    results.tests.push({ name: 'Chat Completions', status: 'failed', error: error.message });
  }

  await sleep(1000);

  // Test 4: Embeddings
  logTest('Embeddings');
  try {
    const response = await axios.post(`${BASE_URL}/embeddings`, {
      input: 'Testing Kyra observability platform for production',
    });
    if (response.data.success && response.data.data) {
      logSuccess(`Embeddings passed (${response.data.latency}ms)`);
      logInfo(`Vectors: ${response.data.count}`);
      logInfo(`Dimensions: ${response.data.dimensions}`);
      results.passed++;
      results.tests.push({ name: 'Embeddings', status: 'passed', latency: response.data.latency });
    } else {
      throw new Error('Embeddings returned invalid response');
    }
  } catch (error) {
    logError(`Embeddings failed: ${error.message}`);
    results.failed++;
    results.tests.push({ name: 'Embeddings', status: 'failed', error: error.message });
  }

  await sleep(1000);

  // Test 5: Tool Calling
  logTest('Tool Calling');
  try {
    const response = await axios.post(`${BASE_URL}/tools`, {
      message: 'What is the weather in Paris? Also, what is 25 * 17?',
    });
    if (response.data.success && response.data.message) {
      logSuccess(`Tool calling passed (${response.data.latency}ms)`);
      logInfo(`Response: ${response.data.message.substring(0, 80)}...`);
      results.passed++;
      results.tests.push({ name: 'Tool Calling', status: 'passed', latency: response.data.latency });
    } else {
      throw new Error('Tool calling returned invalid response');
    }
  } catch (error) {
    logError(`Tool calling failed: ${error.message}`);
    results.failed++;
    results.tests.push({ name: 'Tool Calling', status: 'failed', error: error.message });
  }

  await sleep(1000);

  // Test 6: Chain Execution
  logTest('Chain Execution');
  try {
    const response = await axios.post(`${BASE_URL}/chain`, {
      steps: [
        {
          name: 'step-1',
          fn: async () => {
            await sleep(50);
            return { value: 'Step 1 completed' };
          },
          params: {},
        },
        {
          name: 'step-2',
          fn: async () => {
            await sleep(50);
            return { value: 'Step 2 completed' };
          },
          params: {},
        },
      ],
    });
    if (response.data.success && response.data.results) {
      logSuccess(`Chain execution passed (${response.data.latency}ms)`);
      logInfo(`Steps: ${response.data.stepsCompleted}`);
      logInfo(`Trace ID: ${response.data.traceId || 'N/A'}`);
      results.passed++;
      results.tests.push({ name: 'Chain Execution', status: 'passed', latency: response.data.latency });
    } else {
      throw new Error('Chain execution returned invalid response');
    }
  } catch (error) {
    logError(`Chain execution failed: ${error.message}`);
    results.failed++;
    results.tests.push({ name: 'Chain Execution', status: 'failed', error: error.message });
  }

  await sleep(1000);

  // Test 7: RAG Pipeline
  logTest('RAG Pipeline');
  try {
    const response = await axios.post(`${BASE_URL}/chain/rag`, {
      query: 'What is Kyra?',
    });
    if (response.data.success && response.data.answer) {
      logSuccess(`RAG pipeline passed (${response.data.latency}ms)`);
      logInfo(`Retrieved docs: ${response.data.retrievedDocs}`);
      logInfo(`Answer: ${response.data.answer.substring(0, 80)}...`);
      results.passed++;
      results.tests.push({ name: 'RAG Pipeline', status: 'passed', latency: response.data.latency });
    } else {
      throw new Error('RAG pipeline returned invalid response');
    }
  } catch (error) {
    logError(`RAG pipeline failed: ${error.message}`);
    results.failed++;
    results.tests.push({ name: 'RAG Pipeline', status: 'failed', error: error.message });
  }

  await sleep(1000);

  // Test 8: Error Handling
  logTest('Error Handling');
  try {
    const response = await axios.post(`${BASE_URL}/test/error`, {
      errorType: 'invalid_model',
    });
    if (response.data.success && response.data.error) {
      logSuccess(`Error handling passed (${response.data.latency}ms)`);
      logInfo(`Error type: ${response.data.errorType}`);
      logInfo(`Error traced: ${response.data.traced ? 'Yes' : 'No'}`);
      results.passed++;
      results.tests.push({ name: 'Error Handling', status: 'passed' });
    } else {
      throw new Error('Error handling returned invalid response');
    }
  } catch (error) {
    logError(`Error handling test failed: ${error.message}`);
    results.failed++;
    results.tests.push({ name: 'Error Handling', status: 'failed', error: error.message });
  }

  await sleep(1000);

  // Test 9: Batch Requests
  logTest('Batch Requests');
  try {
    const response = await axios.post(`${BASE_URL}/test/batch`, {
      count: 3,
      type: 'chat',
    });
    if (response.data.success) {
      logSuccess(`Batch requests passed (${response.data.latency}ms)`);
      logInfo(`Requests: ${response.data.count}`);
      logInfo(`Avg latency: ${response.data.avgLatency.toFixed(0)}ms`);
      results.passed++;
      results.tests.push({ name: 'Batch Requests', status: 'passed', latency: response.data.latency });
    } else {
      throw new Error('Batch requests returned invalid response');
    }
  } catch (error) {
    logError(`Batch requests failed: ${error.message}`);
    results.failed++;
    results.tests.push({ name: 'Batch Requests', status: 'failed', error: error.message });
  }

  await sleep(1000);

  // Test 10: Metrics
  logTest('Metrics');
  try {
    const response = await axios.get(`${BASE_URL}/test/metrics`);
    if (response.data.success && response.data.metrics) {
      logSuccess('Metrics check passed');
      logInfo(`Uptime: ${response.data.metrics.uptime.toFixed(2)}s`);
      results.passed++;
      results.tests.push({ name: 'Metrics', status: 'passed' });
    } else {
      throw new Error('Metrics returned invalid response');
    }
  } catch (error) {
    logError(`Metrics check failed: ${error.message}`);
    results.failed++;
    results.tests.push({ name: 'Metrics', status: 'failed', error: error.message });
  }

  // Summary
  log('\n' + '='.repeat(60), 'blue');
  log('📊 Test Results Summary', 'blue');
  log('='.repeat(60), 'blue');
  log(`✅ Passed: ${results.passed}`, 'green');
  log(`❌ Failed: ${results.failed}`, results.failed > 0 ? 'red' : 'green');
  log(`📈 Success Rate: ${((results.passed / (results.passed + results.failed)) * 100).toFixed(1)}%`, 'cyan');
  log('='.repeat(60), 'blue');

  if (results.failed > 0) {
    log('\nFailed Tests:', 'red');
    results.tests
      .filter(t => t.status === 'failed')
      .forEach(t => {
        log(`  - ${t.name}: ${t.error}`, 'red');
      });
  }

  process.exit(results.failed > 0 ? 1 : 0);
}

// Run tests
runTests().catch(error => {
  logError(`Test runner error: ${error.message}`);
  process.exit(1);
});

