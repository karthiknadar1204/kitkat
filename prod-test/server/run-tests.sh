#!/bin/bash

# Test all endpoints on port 5002
# Make sure server is running: npm start

PORT=5002
BASE="http://localhost:${PORT}"

echo "=========================================="
echo "🧪 Testing All Endpoints on Port ${PORT}"
echo "=========================================="
echo ""

# Check if server is running
if ! curl -s "${BASE}/health" > /dev/null 2>&1; then
    echo "❌ Server is not running on port ${PORT}"
    echo "💡 Start the server first: npm start"
    exit 1
fi

echo "✅ Server is running!"
echo ""

# 1. Health Check
echo "1️⃣  GET /health"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
curl -s "${BASE}/health" | python3 -m json.tool 2>/dev/null || curl -s "${BASE}/health"
echo -e "\n"

# 2. Status
echo "2️⃣  GET /status"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
curl -s "${BASE}/status" | python3 -m json.tool 2>/dev/null || curl -s "${BASE}/status"
echo -e "\n"

# 3. Chat Completions
echo "3️⃣  POST /chat"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
curl -s -X POST "${BASE}/chat" \
  -H "Content-Type: application/json" \
  -d '{"message":"Hello from production test!","max_tokens":30}' | python3 -m json.tool 2>/dev/null || curl -s -X POST "${BASE}/chat" -H "Content-Type: application/json" -d '{"message":"Hello from production test!","max_tokens":30}'
echo -e "\n"

# 4. Embeddings
echo "4️⃣  POST /embeddings"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
curl -s -X POST "${BASE}/embeddings" \
  -H "Content-Type: application/json" \
  -d '{"input":"Testing Kyra observability platform"}' | python3 -m json.tool 2>/dev/null || curl -s -X POST "${BASE}/embeddings" -H "Content-Type: application/json" -d '{"input":"Testing Kyra observability platform"}'
echo -e "\n"

# 5. Tool Calling
echo "5️⃣  POST /tools"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
curl -s -X POST "${BASE}/tools" \
  -H "Content-Type: application/json" \
  -d '{"message":"What is the current time? Also calculate 15 * 23."}' | python3 -m json.tool 2>/dev/null || curl -s -X POST "${BASE}/tools" -H "Content-Type: application/json" -d '{"message":"What is the current time? Also calculate 15 * 23."}'
echo -e "\n"

# 6. Chain Execution
echo "6️⃣  POST /chain"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
curl -s -X POST "${BASE}/chain" \
  -H "Content-Type: application/json" \
  -d '{"steps":[{"name":"step-1","params":{},"tokens":{"input":0,"output":0}},{"name":"step-2","params":{},"tokens":{"input":0,"output":0}}]}' | python3 -m json.tool 2>/dev/null || curl -s -X POST "${BASE}/chain" -H "Content-Type: application/json" -d '{"steps":[{"name":"step-1","params":{},"tokens":{"input":0,"output":0}},{"name":"step-2","params":{},"tokens":{"input":0,"output":0}}]}'
echo -e "\n"

# 7. RAG Pipeline
echo "7️⃣  POST /chain/rag"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
curl -s -X POST "${BASE}/chain/rag" \
  -H "Content-Type: application/json" \
  -d '{"query":"What is Kyra observability?"}' | python3 -m json.tool 2>/dev/null || curl -s -X POST "${BASE}/chain/rag" -H "Content-Type: application/json" -d '{"query":"What is Kyra observability?"}'
echo -e "\n"

# 8. Error Handling Test
echo "8️⃣  POST /test/error"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
curl -s -X POST "${BASE}/test/error" \
  -H "Content-Type: application/json" \
  -d '{"errorType":"invalid_model"}' | python3 -m json.tool 2>/dev/null || curl -s -X POST "${BASE}/test/error" -H "Content-Type: application/json" -d '{"errorType":"invalid_model"}'
echo -e "\n"

# 9. Batch Requests
echo "9️⃣  POST /test/batch"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
curl -s -X POST "${BASE}/test/batch" \
  -H "Content-Type: application/json" \
  -d '{"count":2,"type":"chat"}' | python3 -m json.tool 2>/dev/null || curl -s -X POST "${BASE}/test/batch" -H "Content-Type: application/json" -d '{"count":2,"type":"chat"}'
echo -e "\n"

# 10. Metrics
echo "🔟 GET /test/metrics"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
curl -s "${BASE}/test/metrics" | python3 -m json.tool 2>/dev/null || curl -s "${BASE}/test/metrics"
echo -e "\n"

echo "=========================================="
echo "✅ All endpoints tested!"
echo "=========================================="

