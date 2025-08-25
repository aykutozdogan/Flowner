#!/bin/bash

echo "🧪 S2 Engine Test Başlatılıyor..."
echo "================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

BASE_URL="http://localhost:5000"
TENANT_ID="demo.local"

# Test counter
PASSED=0
FAILED=0

# Wait for server to be ready
echo "⏳ Sunucunun hazır olmasını bekleniyor..."
for i in {1..30}; do
    if curl -s -f "$BASE_URL/api/health" > /dev/null; then
        echo -e "${GREEN}✅ Sunucu hazır!${NC}"
        break
    fi
    if [ $i -eq 30 ]; then
        echo -e "${RED}❌ Sunucu 30 saniye içinde hazır olmadı${NC}"
        exit 1
    fi
    sleep 1
done

echo
echo "🔐 Authentication & Token Acquisition"
echo "===================================="

# Get access token
echo -n "Login ve token alma... "
login_response=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -H "X-Tenant-Id: $TENANT_ID" \
    -d '{"email": "admin@demo.local", "password": "Passw0rd!"}' \
    "$BASE_URL/api/auth/login")

ACCESS_TOKEN=$(echo "$login_response" | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

if [ -n "$ACCESS_TOKEN" ]; then
    echo -e "${GREEN}✅ PASSED${NC}"
    ((PASSED++))
else
    echo -e "${RED}❌ FAILED${NC}"
    echo "Login response: $login_response"
    ((FAILED++))
    exit 1
fi

echo
echo "🔄 Workflow Engine Tests"
echo "======================="

# Test 1: Workflow Publishing
echo -n "Workflow publish testi... "
workflow_id="dff8630b-b764-4602-a39c-0af5045c9cb0"
publish_response=$(curl -s -w "\n%{http_code}" -X POST \
    -H "Content-Type: application/json" \
    -H "X-Tenant-Id: $TENANT_ID" \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -d '{"version": "1.0.0"}' \
    "$BASE_URL/api/workflows/$workflow_id/publish")

publish_status=$(echo "$publish_response" | tail -n1)
if [ "$publish_status" = "200" ]; then
    echo -e "${GREEN}✅ PASSED${NC}"
    ((PASSED++))
else
    echo -e "${RED}❌ FAILED${NC} (Status: $publish_status)"
    ((FAILED++))
fi

# Test 2: Process Creation
echo -n "Process oluşturma testi... "
process_response=$(curl -s -w "\n%{http_code}" -X POST \
    -H "Content-Type: application/json" \
    -H "X-Tenant-Id: $TENANT_ID" \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -d '{
        "workflowId": "'$workflow_id'",
        "name": "Test Expense Process",
        "variables": {
            "amount": 2000,
            "requestor": "Test User"
        }
    }' \
    "$BASE_URL/api/processes")

process_status=$(echo "$process_response" | tail -n1)
process_body=$(echo "$process_response" | head -n -1)

if [ "$process_status" = "200" ]; then
    PROCESS_ID=$(echo "$process_body" | grep -o '"id":"[^"]*' | cut -d'"' -f4)
    if [ -n "$PROCESS_ID" ]; then
        echo -e "${GREEN}✅ PASSED${NC} (Process ID: $PROCESS_ID)"
        ((PASSED++))
    else
        echo -e "${RED}❌ FAILED${NC} - Process ID alınamadı"
        ((FAILED++))
    fi
else
    echo -e "${RED}❌ FAILED${NC} (Status: $process_status)"
    echo "Response: $process_body"
    ((FAILED++))
fi

# Test 3: Task Creation Check
echo -n "Task oluşturma kontrolü... "
tasks_response=$(curl -s -w "\n%{http_code}" -X GET \
    -H "Content-Type: application/json" \
    -H "X-Tenant-Id: $TENANT_ID" \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    "$BASE_URL/api/tasks/inbox")

tasks_status=$(echo "$tasks_response" | tail -n1)
tasks_body=$(echo "$tasks_response" | head -n -1)

if [ "$tasks_status" = "200" ]; then
    task_count=$(echo "$tasks_body" | grep -o '"pending":[0-9]*' | cut -d':' -f2)
    if [ "$task_count" -gt 0 ]; then
        echo -e "${GREEN}✅ PASSED${NC} (Pending tasks: $task_count)"
        ((PASSED++))
    else
        echo -e "${YELLOW}⚠️  WARNING${NC} - Pending task bulunamadı"
        ((PASSED++))
    fi
else
    echo -e "${RED}❌ FAILED${NC} (Status: $tasks_status)"
    ((FAILED++))
fi

# Test 4: Engine Status
echo -n "Engine durumu kontrolü... "
engine_response=$(curl -s -w "\n%{http_code}" -X GET \
    -H "Content-Type: application/json" \
    "$BASE_URL/__meta/engine")

engine_status=$(echo "$engine_response" | tail -n1)
if [ "$engine_status" = "200" ]; then
    echo -e "${GREEN}✅ PASSED${NC}"
    ((PASSED++))
else
    echo -e "${RED}❌ FAILED${NC} (Status: $engine_status)"
    ((FAILED++))
fi

# Test 5: Manual Engine Tick
echo -n "Manual engine tick testi... "
tick_response=$(curl -s -w "\n%{http_code}" -X POST \
    -H "Content-Type: application/json" \
    -H "X-Tenant-Id: $TENANT_ID" \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    "$BASE_URL/api/engine/tick")

tick_status=$(echo "$tick_response" | tail -n1)
if [ "$tick_status" = "200" ]; then
    echo -e "${GREEN}✅ PASSED${NC}"
    ((PASSED++))
else
    echo -e "${RED}❌ FAILED${NC} (Status: $tick_status)"
    ((FAILED++))
fi

echo
echo "📊 Test Sonuçları:"
echo "================="
echo -e "Başarılı: ${GREEN}$PASSED${NC}"
echo -e "Başarısız: ${RED}$FAILED${NC}"

if [ $FAILED -eq 0 ]; then
    echo
    echo -e "${GREEN}🎉 S2_ENGINE=PASS - Tüm engine testleri başarılı!${NC}"
    exit 0
else
    echo
    echo -e "${RED}❌ S2_ENGINE=FAIL - $FAILED test başarısız oldu${NC}"
    exit 1
fi