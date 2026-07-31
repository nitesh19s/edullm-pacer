#!/bin/bash

# EduLLM API Test Script
# Tests all major API endpoints to verify functionality

API_URL="http://localhost:3000"
API_KEY="your-secure-api-key-123"

echo "🧪 Testing EduLLM Platform API"
echo "================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Test counter
PASSED=0
FAILED=0

# Helper function to test endpoint
test_endpoint() {
    local name=$1
    local method=$2
    local endpoint=$3
    local data=$4
    local expected_status=$5

    echo -n "Testing $name... "

    if [ -z "$data" ]; then
        response=$(curl -s -w "\n%{http_code}" -X "$method" "$API_URL$endpoint" \
            -H "X-API-Key: $API_KEY" \
            -H "Content-Type: application/json")
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" "$API_URL$endpoint" \
            -H "X-API-Key: $API_KEY" \
            -H "Content-Type: application/json" \
            -d "$data")
    fi

    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')

    if [ "$http_code" == "$expected_status" ]; then
        echo -e "${GREEN}✓ PASSED${NC} (HTTP $http_code)"
        PASSED=$((PASSED + 1))
    else
        echo -e "${RED}✗ FAILED${NC} (Expected $expected_status, got $http_code)"
        echo "Response: $body"
        FAILED=$((FAILED + 1))
    fi
}

# Health Check Tests
echo "📊 Health Check Endpoints"
echo "------------------------"
test_endpoint "Basic Health Check" "GET" "/health" "" "200"
test_endpoint "Detailed Health Check" "GET" "/health/detailed" "" "200"
test_endpoint "Readiness Check" "GET" "/health/ready" "" "200"
test_endpoint "Liveness Check" "GET" "/health/live" "" "200"
echo ""

# Experiment Tests
echo "🔬 Experiment Management"
echo "------------------------"
test_endpoint "Create Experiment" "POST" "/api/v1/experiments" \
    '{"name":"Test Experiment","description":"API Test","configuration":{"provider":"openai","model":"gpt-3.5-turbo","temperature":0.7}}' \
    "201"
test_endpoint "List Experiments" "GET" "/api/v1/experiments" "" "200"
echo ""

# Research Features Tests
echo "📚 Research Features"
echo "--------------------"
test_endpoint "Track Learning Interaction" "POST" "/api/v1/research/progression/track" \
    '{"studentId":"test_student","conceptId":"test_001","conceptName":"Test Concept","subject":"Math","success":true,"confidence":0.85}' \
    "201"
test_endpoint "List Students" "GET" "/api/v1/research/students" "" "200"
test_endpoint "Analyze Curriculum Gaps" "POST" "/api/v1/research/gaps/analyze" \
    '{"studentId":"test_student","targetGrade":10,"targetSubject":"Math"}' \
    "200"
test_endpoint "Analyze Cross-Subject" "POST" "/api/v1/research/cross-subject/analyze" \
    '{"studentId":"test_student"}' \
    "200"
echo ""

# Vector Database Tests
echo "🔍 Vector Database"
echo "------------------"
test_endpoint "Create Collection" "POST" "/api/v1/vector/collections" \
    '{"name":"Test Collection","description":"API Test Collection"}' \
    "201"
test_endpoint "List Collections" "GET" "/api/v1/vector/collections" "" "200"
test_endpoint "Vector Stats" "GET" "/api/v1/vector/stats" "" "200"
echo ""

# RAG Chat Tests
echo "💬 RAG Chat"
echo "-----------"
test_endpoint "Send Chat Message" "POST" "/api/v1/rag/chat" \
    '{"message":"Test question","context":{"subject":"Math","grade":10}}' \
    "200"
test_endpoint "List Chat Sessions" "GET" "/api/v1/rag/sessions" "" "200"
test_endpoint "RAG Stats" "GET" "/api/v1/rag/stats" "" "200"
echo ""

# Analytics Tests
echo "📈 Analytics & Reporting"
echo "------------------------"
test_endpoint "Generate Report" "POST" "/api/v1/analytics/reports/generate" \
    '{"type":"summary"}' \
    "201"
test_endpoint "List Reports" "GET" "/api/v1/analytics/reports" "" "200"
test_endpoint "Create Baseline" "POST" "/api/v1/analytics/baseline/create" \
    '{"name":"Test Baseline","metrics":{"precision":0.85,"recall":0.80}}' \
    "201"
test_endpoint "List Baselines" "GET" "/api/v1/analytics/baseline" "" "200"
test_endpoint "Create A/B Test" "POST" "/api/v1/analytics/ab-tests" \
    '{"name":"Test A/B","variantA":{"model":"gpt-3.5"},"variantB":{"model":"gpt-4"}}' \
    "201"
test_endpoint "List A/B Tests" "GET" "/api/v1/analytics/ab-tests" "" "200"
test_endpoint "Analytics Dashboard" "GET" "/api/v1/analytics/dashboard" "" "200"
echo ""

# Summary
echo "================================"
echo "Test Summary:"
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo "Total: $((PASSED + FAILED))"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}✗ Some tests failed.${NC}"
    exit 1
fi
