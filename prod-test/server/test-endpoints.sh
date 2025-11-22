#!/bin/bash

# Test all endpoints - Run this when server is running on port 5002
PORT=5002
BASE="http://localhost:${PORT}"

echo "🧪 Testing All Endpoints on Port ${PORT}"
echo "=========================================="
echo ""

echo "1️⃣ GET /health"
curl -s "${BASE}/health" | python3 -m json.tool || curl -s "${BASE}/health"
echo -e "\n"

echo "2️⃣ GET /status"
curl -s "${BASE}/status" | python3 -m json.tool || curl -s "${BASE}/status"
echo -e "\n"

echo "3️⃣ POST /chat"
curl -s -X POST "${BASE}/chat" \
  -H "Content-Type: application/json" \
  -d '{"message":"Hello from production test!","max_tokens":30}' | python3 -m json.tool || curl -s -X POST "${BASE}/chat" -H "Content-Type: application/json" -d '{"message":"Hello from production test!","max_tokens":30}'
echo -e "\n"

echo "4️⃣ POST /embeddings"
curl -s -X POST "${BASE}/embeddings" \
  -H "Content-Type: application/json" \
  -d '{"input":"Testing Kyra observability platform"}' | python3 -m json.tool || curl -s -X POST "${BASE}/embeddings" -H "Content-Type: application/json" -d '{"input":"Testing Kyra observability platform"}'
echo -e "\n"

echo "5️⃣ POST /tools"
curl -s -X POST "${BASE}/tools" \
  -H "Content-Type: application/json" \
  -d '{"message":"What is the current time? Also calculate 15 * 23."}' | python3 -m json.tool || curl -s -X POST "${BASE}/tools" -H "Content-Type: application/json" -d '{"message":"What is the current time? Also calculate 15 * 23."}'
echo -e "\n"

echo "6️⃣ POST /chain"
curl -s -X POST "${BASE}/chain" \
  -H "Content-Type: application/json" \
  -d '{"steps":[{"name":"step-1","params":{},"tokens":{"input":0,"output":0}},{"name":"step-2","params":{},"tokens":{"input":0,"output":0}}]}' | python3 -m json.tool || curl -s -X POST "${BASE}/chain" -H "Content-Type: application/json" -d '{"steps":[{"name":"step-1","params":{},"tokens":{"input":0,"output":0}},{"name":"step-2","params":{},"tokens":{"input":0,"output":0}}]}'
echo -e "\n"

echo "7️⃣ POST /chain/rag"
curl -s -X POST "${BASE}/chain/rag" \
  -H "Content-Type: application/json" \
  -d '{"query":"What is Kyra observability?"}' | python3 -m json.tool || curl -s -X POST "${BASE}/chain/rag" -H "Content-Type: application/json" -d '{"query":"What is Kyra observability?"}'
echo -e "\n"

echo "8️⃣ POST /test/error"
curl -s -X POST "${BASE}/test/error" \
  -H "Content-Type: application/json" \
  -d '{"errorType":"invalid_model"}' | python3 -m json.tool || curl -s -X POST "${BASE}/test/error" -H "Content-Type: application/json" -d '{"errorType":"invalid_model"}'
echo -e "\n"

echo "9️⃣ POST /test/batch"
curl -s -X POST "${BASE}/test/batch" \
  -H "Content-Type: application/json" \
  -d '{"count":2,"type":"chat"}' | python3 -m json.tool || curl -s -X POST "${BASE}/test/batch" -H "Content-Type: application/json" -d '{"count":2,"type":"chat"}'
echo -e "\n"

echo "🔟 GET /test/metrics"
curl -s "${BASE}/test/metrics" | python3 -m json.tool || curl -s "${BASE}/test/metrics"
echo -e "\n"

echo "✅ All endpoints tested!"

