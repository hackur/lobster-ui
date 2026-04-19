#!/bin/bash
# Smoke test script for lobster-ui

set -e

BASE_URL="${1:-http://localhost:3000}"
echo "=== lobster-ui Smoke Tests ==="
echo "Testing: $BASE_URL"
echo ""

# Setup test directory
TEST_DIR="/tmp/lobster-smoke-test"
rm -rf "$TEST_DIR"
mkdir -p "$TEST_DIR"

# Create test workflow
cat > "$TEST_DIR/test.yaml" << 'YAML'
name: Smoke Test Workflow
steps:
  - id: step1
    command: echo "hello"
  - id: step2
    command: echo "world"
    stdin: $step1.stdout
YAML

PASSED=0
FAILED=0

# Test 1: Discovery API
echo "Test 1: Discovery API (list workflows)"
RESULT=$(curl -s "$BASE_URL/api/workflows?dir=$TEST_DIR")
if echo "$RESULT" | grep -q "Smoke Test Workflow"; then
  echo "  ✓ PASS"
  PASSED=$((PASSED + 1))
else
  echo "  ✗ FAIL"
  FAILED=$((FAILED + 1))
fi

# Test 2: Single workflow GET
echo "Test 2: Single workflow GET"
RESULT=$(curl -s "$BASE_URL/api/workflows/test.yaml?path=$TEST_DIR/test.yaml")
if echo "$RESULT" | grep -q '"workflow"'; then
  echo "  ✓ PASS"
  PASSED=$((PASSED + 1))
else
  echo "  ✗ FAIL"
  FAILED=$((FAILED + 1))
fi

# Test 3: Workflow validation
echo "Test 3: Workflow validation"
if echo "$RESULT" | grep -q '"steps"'; then
  STEPS=$(echo "$RESULT" | grep -o '"steps":\[' | wc -l)
  if [ "$STEPS" -eq 1 ]; then
    echo "  ✓ PASS"
    PASSED=$((PASSED + 1))
  else
    echo "  ✗ FAIL"
    FAILED=$((FAILED + 1))
  fi
else
  echo "  ✗ FAIL"
  FAILED=$((FAILED + 1))
fi

# Test 4: Workflow PUT
echo "Test 4: Workflow PUT (save)"
cat > /tmp/smoke-put.json << 'JSON'
{"workflow":{"name":"Updated","steps":[{"id":"s1","command":"test"}]},"format":"yaml"}
JSON
RESULT=$(curl -s -X PUT "$BASE_URL/api/workflows/test.yaml?path=$TEST_DIR/test.yaml" \
  -H "Content-Type: application/json" \
  -d @/tmp/smoke-put.json)
if echo "$RESULT" | grep -q '"success"'; then
  echo "  ✓ PASS"
  PASSED=$((PASSED + 1))
else
  echo "  ✗ FAIL"
  FAILED=$((FAILED + 1))
fi

# Test 5: Verify save
echo "Test 5: Verify saved workflow"
RESULT=$(curl -s "$BASE_URL/api/workflows/test.yaml?path=$TEST_DIR/test.yaml")
if echo "$RESULT" | grep -q '"name":"Updated"'; then
  echo "  ✓ PASS"
  PASSED=$((PASSED + 1))
else
  echo "  ✗ FAIL"
  FAILED=$((FAILED + 1))
fi

# Test 6: Main page loads
echo "Test 6: Main page loads"
RESULT=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/")
if [ "$RESULT" = "200" ]; then
  echo "  ✓ PASS"
  PASSED=$((PASSED + 1))
else
  echo "  ✗ FAIL (HTTP $RESULT)"
  FAILED=$((FAILED + 1))
fi

# Summary
echo ""
echo "=== Results ==="
echo "Passed: $PASSED"
echo "Failed: $FAILED"

# Cleanup
rm -rf "$TEST_DIR" /tmp/smoke-put.json

if [ $FAILED -gt 0 ]; then
  exit 1
fi
exit 0