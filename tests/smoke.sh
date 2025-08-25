#!/bin/bash

echo "🧪 S1 Sprint Smoke Tests Başlatılıyor..."
echo "========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

BASE_URL="http://localhost:5000"
TENANT_ID="1992ddc5-622c-489d-a758-df471b2595ad"

# Test counter
PASSED=0
FAILED=0

# Helper function for API tests
test_endpoint() {
    local name="$1"
    local method="$2"
    local url="$3"
    local headers="$4"
    local body="$5"
    local expected_status="$6"
    
    echo -n "Testing $name... "
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" $(echo $headers) "$BASE_URL$url")
    else
        response=$(curl -s -w "\n%{http_code}" -X $method $(echo $headers) -d "$body" "$BASE_URL$url")
    fi
    
    # Extract status code (last line)
    status_code=$(echo "$response" | tail -n1)
    response_body=$(echo "$response" | head -n -1)
    
    if [ "$status_code" = "$expected_status" ]; then
        echo -e "${GREEN}✅ PASSED${NC} ($status_code)"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}❌ FAILED${NC} (Expected: $expected_status, Got: $status_code)"
        echo "Response: $response_body"
        ((FAILED++))
        return 1
    fi
}

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
echo "🧪 Test Senaryoları:"
echo "==================="

# Test 1: Health Check
test_endpoint "Health Check" "GET" "/api/health" "-H 'Content-Type: application/json'" "" "200"

# Test 2: Login with valid credentials
echo -n "Testing Login (Valid)... "
login_response=$(curl -s -w "\n%{http_code}" -X POST \
    -H "Content-Type: application/json" \
    -H "X-Tenant-Id: $TENANT_ID" \
    -d '{"email": "admin@demo.local", "password": "Passw0rd!"}' \
    "$BASE_URL/api/auth/login")

login_status=$(echo "$login_response" | tail -n1)
login_body=$(echo "$login_response" | head -n -1)

if [ "$login_status" = "200" ]; then
    ACCESS_TOKEN=$(echo "$login_body" | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)
    if [ -n "$ACCESS_TOKEN" ]; then
        echo -e "${GREEN}✅ PASSED${NC} (200) - Token alındı"
        ((PASSED++))
    else
        echo -e "${RED}❌ FAILED${NC} - Token bulunamadı"
        ((FAILED++))
        ACCESS_TOKEN=""
    fi
else
    echo -e "${RED}❌ FAILED${NC} (Expected: 200, Got: $login_status)"
    echo "Response: $login_body"
    ((FAILED++))
    ACCESS_TOKEN=""
fi

# Test 3: Login with invalid credentials
test_endpoint "Login (Invalid)" "POST" "/api/auth/login" \
    "-H 'Content-Type: application/json' -H 'X-Tenant-Id: $TENANT_ID'" \
    '{"email": "admin@demo.local", "password": "wrongpassword"}' "400"

# Test 4: Protected endpoint without token
test_endpoint "Protected endpoint (No Token)" "GET" "/api/auth/me" \
    "-H 'Content-Type: application/json' -H 'X-Tenant-Id: $TENANT_ID'" "" "401"

# Test 5: Protected endpoint with valid token
if [ -n "$ACCESS_TOKEN" ]; then
    test_endpoint "Protected endpoint (Valid Token)" "GET" "/api/auth/me" \
        "-H 'Content-Type: application/json' -H 'X-Tenant-Id: $TENANT_ID' -H 'Authorization: Bearer $ACCESS_TOKEN'" "" "200"
        
    # Test 6: Dashboard Analytics
    test_endpoint "Dashboard Analytics" "GET" "/api/analytics/dashboard" \
        "-H 'Content-Type: application/json' -H 'X-Tenant-Id: $TENANT_ID' -H 'Authorization: Bearer $ACCESS_TOKEN'" "" "200"
        
    # Test 7: Forms endpoint
    test_endpoint "Forms List" "GET" "/api/forms" \
        "-H 'Content-Type: application/json' -H 'X-Tenant-Id: $TENANT_ID' -H 'Authorization: Bearer $ACCESS_TOKEN'" "" "200"
else
    echo "⚠️  Auth token alınamadı, protected endpoint testleri atlandı"
    ((FAILED += 3))
fi

# Test 8: Missing tenant header
test_endpoint "Missing Tenant Header" "GET" "/api/forms" \
    "-H 'Content-Type: application/json'" "" "400"

# Test 9: Invalid tenant header
test_endpoint "Invalid Tenant Header" "GET" "/api/forms" \
    "-H 'Content-Type: application/json' -H 'X-Tenant-Id: invalid-uuid'" "" "400"

echo
echo "📊 Test Sonuçları:"
echo "=================="
echo -e "✅ Başarılı: ${GREEN}$PASSED${NC}"
echo -e "❌ Başarısız: ${RED}$FAILED${NC}"
echo -e "📊 Toplam: $((PASSED + FAILED))"

if [ $FAILED -eq 0 ]; then
    echo -e "\n🎉 ${GREEN}TÜM TESTLER BAŞARILI!${NC}"
    echo "S1 Sprint hazır production'a alınabilir."
    exit 0
else
    echo -e "\n⚠️  ${YELLOW}$FAILED test başarısız oldu.${NC}"
    echo "Lütfen hataları düzeltin ve tekrar çalıştırın."
    exit 1
fi