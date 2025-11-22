#!/bin/bash

# Test all endpoints on port 5002
PORT=5002
BASE_URL="http://localhost:${PORT}"

echo "==========================================="
echo "🧪 Testing All Endpoints on Port ${PORT}"
echo "==========================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Test function
test_endpoint() {
    local name=$1
    local method=$2
    local endpoint=$3
    local data=$4
    
    echo -e "${CYAN}Testing: ${name}${NC}"
    echo "  ${method} ${endpoint}"
    
    if [ "$method" == "GET" ]; then
        response=$(curl -s -w "\nHTTP_STATUS:%{http_code}" "${BASE_URL}${endpoint}")
    else
        response=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X "${method}" \
            -H "Content-Type: application/json" \
            -d "${data}" \
            "${BASE_URL}${endpoint}")
    fi
    
    http_code=$(echo "$response" | grep "HTTP_STATUS" | cut -d: -f2)
    body=$(echo "$response" | sed '/HTTP_STATUS/d')
    
    if [ "$http_code" == "200" ] || [ "$http_code" == "201" ]; then
        echo -e "  ${GREEN}✅ Status: ${http_code}${NC}"
        echo "$body" | python3 -m json.tool 2>/dev/null || echo "$body" | head -10
    else
        echo -e "  ${RED}❌ Status: ${http_code}${NC}"
        echo "$body" | head -5
    fi
    echo ""
}

# 1. Health Check
test_endpoint "Health Check" "GET" "/health"

# 2. Status
test_endpoint "Status" "GET" "/status"

# 3. Chat Completions
test_endpoint "Chat Completions" "POST" "/chat" '{"message":"Hello from production test!","max_tokens":30}'

# 4. Embeddings
test_endpoint "Embeddings" "POST" "/embeddings" '{"input":"Testing Kyra observability platform"}'

# 5. Tool Calling
test_endpoint "Tool Calling" "POST" "/tools" '{"message":"What is the current time? Also calculate 15 * 23."}'

# 6. Chain Execution
test_endpoint "Chain Execution" "POST" "/chain" '{"steps":[{"name":"step-1","params":{},"tokens":{"input":0,"output":0}},{"name":"step-2","params":{},"tokens":{"input":0,"output":0}}]}'

# 7. RAG Pipeline
test_endpoint "RAG Pipeline" "POST" "/chain/rag" '{"query":"What is Kyra observability?"}'

# 8. Error Handling Test
test_endpoint "Error Handling" "POST" "/test/error" '{"errorType":"invalid_model"}'

# 9. Batch Requests
test_endpoint "Batch Requests" "POST" "/test/batch" '{"count":2,"type":"chat"}'

# 10. Metrics
test_endpoint "Metrics" "GET" "/test/metrics"

echo "==========================================="
echo "✅ Testing Complete!"
echo "==========================================="

