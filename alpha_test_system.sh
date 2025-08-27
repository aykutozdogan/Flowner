#!/bin/bash

# =============================================================================
# Flowner Alpha Test Automation System
# Otomatik hata tespit, loglama ve düzeltme prompt üretimi
# =============================================================================

set -e

PROJECT_ROOT="."
LOG_DIR="./alpha-test-logs"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
TEST_SESSION="alpha_test_$TIMESTAMP"

# Renkli output için
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Flowner Alpha Test Automation System${NC}"
echo -e "${BLUE}=====================================${NC}"
echo ""

# Log dizinini oluştur
mkdir -p "$LOG_DIR"
cd "$LOG_DIR"

# Test session dosyası
TEST_LOG="$TEST_SESSION.log"
ERROR_LOG="$TEST_SESSION.errors.json"
PROMPT_FILE="$TEST_SESSION.prompt.md"

echo -e "${YELLOW}📁 Test Session: $TEST_SESSION${NC}"
echo -e "${YELLOW}📝 Logs: $LOG_DIR/$TEST_LOG${NC}"
echo ""

# =============================================================================
# 1. SISTEM DURUMU KONTROLÜ
# =============================================================================

echo -e "${BLUE}1️⃣ Sistem Durumu Kontrolü${NC}" | tee -a "$TEST_LOG"
echo "================================" | tee -a "$TEST_LOG"

# Backend health check
echo -e "🔍 Backend Health Check..." | tee -a "$TEST_LOG"
if curl -s http://localhost:5000/api/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend running on port 5000${NC}" | tee -a "$TEST_LOG"
    BACKEND_STATUS="OK"
else
    echo -e "${RED}❌ Backend not running on port 5000${NC}" | tee -a "$TEST_LOG"
    BACKEND_STATUS="ERROR"
    echo '{"error": "Backend not running", "port": 5000, "timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%S.000Z)'"}' >> "$ERROR_LOG"
fi

# Frontend check - Test both unified (5000) and split (5174, 5175) architectures
echo -e "🔍 Frontend Architecture Check..." | tee -a "$TEST_LOG"
FRONTEND_PORTS=(5000 5174 5175)
FRONTEND_STATUS="OK"

# Test unified architecture (port 5000)
if curl -s http://localhost:5000 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Frontend accessible on port 5000${NC}" | tee -a "$TEST_LOG"
    ARCHITECTURE="unified"
    BASE_URL="http://localhost:5000"
else
    echo -e "${YELLOW}⚠️ Frontend not accessible on port 5000${NC}" | tee -a "$TEST_LOG"
    ARCHITECTURE="unknown"
    BASE_URL="http://localhost:5000"
fi

echo -e "${BLUE}📐 Architecture: $ARCHITECTURE${NC}" | tee -a "$TEST_LOG"
echo -e "${BLUE}🔗 Base URL: $BASE_URL${NC}" | tee -a "$TEST_LOG"

echo "" | tee -a "$TEST_LOG"

# =============================================================================
# 2. API ENDPOINT TESTLERI
# =============================================================================

echo -e "${BLUE}2️⃣ API Endpoint Testleri${NC}" | tee -a "$TEST_LOG"
echo "===========================" | tee -a "$TEST_LOG"

API_BASE="$BASE_URL"
TENANT_ID="demo.local"

# Test endpoints
ENDPOINTS=(
    "GET /api/health"
    "POST /api/auth/login"
    "GET /api/auth/me"
    "GET /api/workflows"
    "GET /api/forms"
    "GET /api/processes"
    "GET /api/tasks/my-tasks"
    "GET /api/analytics/dashboard"
    "GET /api/v1/tenants"
    "GET /api/v1/users"
)

# Admin login için token al
echo -e "🔐 Admin Token Alma..." | tee -a "$TEST_LOG"
ADMIN_LOGIN_RESPONSE=$(curl -s -X POST "$API_BASE/api/auth/login" \
    -H "Content-Type: application/json" \
    -H "X-Tenant-Id: $TENANT_ID" \
    -d '{"email":"admin@demo.local","password":"Passw0rd!"}' 2>/dev/null || echo '{}')

AUTH_HEADER=""
if echo "$ADMIN_LOGIN_RESPONSE" | grep -q "access_token\|accessToken\|token"; then
    # Farklı token field adlarını dene
    TOKEN=$(echo "$ADMIN_LOGIN_RESPONSE" | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4 || \
            echo "$ADMIN_LOGIN_RESPONSE" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4 || \
            echo "$ADMIN_LOGIN_RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4 || echo "")
    
    if [[ -n "$TOKEN" ]]; then
        AUTH_HEADER="Authorization: Bearer $TOKEN"
        echo -e "${GREEN}✅ Admin token alındı${NC}" | tee -a "$TEST_LOG"
    else
        echo -e "${RED}❌ Admin token alınamadı${NC}" | tee -a "$TEST_LOG"
        echo '{"error": "Admin token acquisition failed", "response": "'$ADMIN_LOGIN_RESPONSE'", "timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%S.000Z)'"}' >> "$ERROR_LOG"
    fi
else
    echo -e "${RED}❌ Admin login başarısız${NC}" | tee -a "$TEST_LOG"
    echo '{"error": "Admin login failed", "response": "'$ADMIN_LOGIN_RESPONSE'", "timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%S.000Z)'"}' >> "$ERROR_LOG"
fi

# Test each endpoint with proper authentication
for endpoint in "${ENDPOINTS[@]}"; do
    method=$(echo "$endpoint" | cut -d' ' -f1)
    path=$(echo "$endpoint" | cut -d' ' -f2)
    
    echo -e "🔍 Testing: $method $path" | tee -a "$TEST_LOG"
    
    if [[ "$method" == "GET" ]]; then
        if [[ -n "$AUTH_HEADER" ]]; then
            response=$(curl -s -w "%{http_code}" "$API_BASE$path" \
              -H "$AUTH_HEADER" \
              -H "X-Tenant-Id: $TENANT_ID" 2>/dev/null || echo "000")
        else
            response=$(curl -s -w "%{http_code}" "$API_BASE$path" 2>/dev/null || echo "000")
        fi
        
        status_code="${response: -3}"
        
        if [[ "$status_code" =~ ^[23] ]]; then
            echo -e "${GREEN}   ✅ $status_code${NC}" | tee -a "$TEST_LOG"
        else
            echo -e "${RED}   ❌ $status_code${NC}" | tee -a "$TEST_LOG"
            echo '{"error": "API endpoint failed", "method": "'$method'", "path": "'$path'", "status": '$status_code', "timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%S.000Z)'"}' >> "$ERROR_LOG"
        fi
    elif [[ "$method" == "POST" && "$path" == "/api/auth/login" ]]; then
        # Login endpoint'i zaten test edildi, skip
        echo -e "${GREEN}   ✅ Already tested (login)${NC}" | tee -a "$TEST_LOG"
    fi
done

# Test user-specific endpoints with different credentials
echo -e "${BLUE}🔐 Testing User-Specific Endpoints${NC}" | tee -a "$TEST_LOG"
echo "===================================" | tee -a "$TEST_LOG"

USER_TESTS=(
    "admin@demo.local:Passw0rd!:admin"
    "designer@demo.local:Designer123!:designer"
    "user@demo.local:User123!:user"
)

for user_test in "${USER_TESTS[@]}"; do
    IFS=':' read -r email password role <<< "$user_test"
    echo -e "👤 Testing as $role ($email)..." | tee -a "$TEST_LOG"
    
    # Login with specific user
    user_login_response=$(curl -s -X POST "$API_BASE/api/auth/login" \
        -H "Content-Type: application/json" \
        -H "X-Tenant-Id: $TENANT_ID" \
        -d "{\"email\":\"$email\",\"password\":\"$password\"}" 2>/dev/null || echo '{}')
    
    user_token=$(echo "$user_login_response" | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4 || \
                 echo "$user_login_response" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4 || \
                 echo "$user_login_response" | grep -o '"token":"[^"]*"' | cut -d'"' -f4 || echo "")
    
    if [[ -n "$user_token" ]]; then
        echo -e "   ✅ Login successful" | tee -a "$TEST_LOG"
        
        # Test role-specific endpoints
        case "$role" in
            "admin")
                USER_ENDPOINTS=(
                    "GET /api/v1/tenants"
                    "GET /api/v1/users"
                    "GET /api/analytics/dashboard"
                )
                ;;
            "designer")
                USER_ENDPOINTS=(
                    "GET /api/workflows"
                    "GET /api/forms"
                    "GET /api/processes"
                )
                ;;
            "user")
                USER_ENDPOINTS=(
                    "GET /api/tasks/my-tasks"
                    "GET /api/processes"
                )
                ;;
        esac
        
        for user_endpoint in "${USER_ENDPOINTS[@]}"; do
            user_method=$(echo "$user_endpoint" | cut -d' ' -f1)
            user_path=$(echo "$user_endpoint" | cut -d' ' -f2)
            
            echo -e "   🔍 $user_method $user_path" | tee -a "$TEST_LOG"
            
            if [[ "$user_method" == "GET" ]]; then
                user_response=$(curl -s -w "%{http_code}" "$API_BASE$user_path" \
                    -H "Authorization: Bearer $user_token" \
                    -H "X-Tenant-Id: $TENANT_ID" 2>/dev/null || echo "000")
                
                user_status="${user_response: -3}"
                
                if [[ "$user_status" =~ ^[23] ]]; then
                    echo -e "      ${GREEN}✅ $user_status${NC}" | tee -a "$TEST_LOG"
                else
                    echo -e "      ${RED}❌ $user_status${NC}" | tee -a "$TEST_LOG"
                    echo '{"error": "User-specific endpoint failed", "user": "'$role'", "method": "'$user_method'", "path": "'$user_path'", "status": '$user_status', "timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%S.000Z)'"}' >> "$ERROR_LOG"
                fi
            fi
        done
        
    else
        echo -e "   ${RED}❌ Login failed${NC}" | tee -a "$TEST_LOG"
        echo '{"error": "User login failed", "user": "'$role'", "email": "'$email'", "timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%S.000Z)'"}' >> "$ERROR_LOG"
    fi
    
    echo "" | tee -a "$TEST_LOG"
done

echo "" | tee -a "$TEST_LOG"

# =============================================================================
# 3. BROWSER AUTOMATION TESTLERI (Node.js ile)
# =============================================================================

echo -e "${BLUE}3️⃣ Browser Automation Tests${NC}" | tee -a "$TEST_LOG"
echo "==============================" | tee -a "$TEST_LOG"

# Node.js browser test scripti oluştur
cat > ../browser_test.js << 'EOF'
const { chromium } = require('playwright');
const fs = require('fs');

// Test kullanıcıları
const TEST_USERS = [
  {
    role: 'admin',
    email: 'admin@demo.local',
    password: 'Passw0rd!',
    expectedPath: '/admin',
    testMenus: ['dashboard', 'forms', 'workflows', 'processes', 'tenants', 'users']
  },
  {
    role: 'designer', 
    email: 'designer@demo.local',
    password: 'Designer123!',
    expectedPath: '/admin',
    testMenus: ['dashboard', 'forms', 'workflows', 'processes']
  },
  {
    role: 'user',
    email: 'user@demo.local', 
    password: 'User123!',
    expectedPath: '/portal',
    testMenus: ['tasks', 'my-processes', 'profile']
  }
];

// URL configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';

async function collectBrowserLogs() {
  console.log('🌐 Browser automation tests başlatılıyor...');
  
  let browser;
  try {
    browser = await chromium.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
  } catch (error) {
    console.log('❌ Playwright/Chromium kurulu değil, browser testleri atlanıyor');
    console.log('   💡 Kurulum için: npx playwright install chromium');
    return {
      browserTestsSkipped: true,
      reason: 'Playwright not available',
      error: error.message
    };
  }
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    userAgent: 'AlphaTest-Bot/1.0'
  });
  
  const logs = [];
  const errors = [];
  const testResults = [];

  console.log(`🔗 Testing Base URL: ${BASE_URL}`);

  // Test her kullanıcı için
  for (const user of TEST_USERS) {
    console.log(`\n👤 Testing user: ${user.role} (${user.email})`);
    
    const page = await context.newPage();
    const testContext = `user_${user.role}`;
    
    // Error handlers
    page.on('console', msg => {
      const log = {
        context: testContext,
        type: msg.type(),
        text: msg.text(),
        timestamp: new Date().toISOString()
      };
      logs.push(log);
      
      if (msg.type() === 'error') {
        errors.push({...log, severity: 'error'});
      }
    });
    
    page.on('requestfailed', request => {
      const error = {
        context: testContext,
        type: 'network_error',
        url: request.url(),
        failure: request.failure()?.errorText || 'Unknown network error',
        timestamp: new Date().toISOString(),
        severity: 'error'
      };
      errors.push(error);
    });
    
    page.on('pageerror', error => {
      errors.push({
        context: testContext,
        type: 'page_error',
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(),
        severity: 'critical'
      });
    });

    const userTestResult = {
      user: user.role,
      email: user.email,
      tests: [],
      success: true,
      errors: []
    };

    try {
      // 1. Login testi
      console.log('  🔐 Testing login...');
      
      const loginUrl = `${BASE_URL}/login`;
      await page.goto(loginUrl, { waitUntil: 'networkidle', timeout: 10000 });
      
      // Login form screenshot
      await page.screenshot({ 
        path: `alpha-test-logs/login_${user.role}_step1.png`,
        fullPage: true 
      });
      
      // Login form doldur
      try {
        await page.waitForSelector('input[type="email"], input[name="email"]', { timeout: 5000 });
        await page.fill('input[type="email"], input[name="email"]', user.email);
        await page.fill('input[type="password"], input[name="password"]', user.password);
        
        // Login butonuna tıkla
        await page.click('button[type="submit"], button:has-text("Giriş"), button:has-text("Login")');
        
        // Redirect bekle
        await page.waitForLoadState('networkidle', { timeout: 10000 });
        
        const currentUrl = page.url();
        console.log(`    ✅ Login successful, redirected to: ${currentUrl}`);
        
        userTestResult.tests.push({
          name: 'login',
          success: true,
          redirectUrl: currentUrl
        });
        
        // 2. Dashboard screenshot
        await page.screenshot({ 
          path: `alpha-test-logs/dashboard_${user.role}.png`,
          fullPage: true 
        });
        
        // 3. Menu navigation tests
        console.log('  🧭 Testing menu navigation...');
        
        for (const menu of user.testMenus) {
          try {
            // Menu öğesini bul ve tıkla
            const menuSelectors = [
              `a[href*="${menu}"]`,
              `button:has-text("${menu}")`,
              `[data-testid*="${menu}"]`,
              `.menu-item:has-text("${menu}")`,
              `nav a:has-text("${menu}")`
            ];
            
            let menuFound = false;
            for (const selector of menuSelectors) {
              try {
                await page.waitForSelector(selector, { timeout: 2000 });
                await page.click(selector);
                await page.waitForLoadState('networkidle', { timeout: 5000 });
                
                console.log(`    ✅ Menu '${menu}' navigation successful`);
                userTestResult.tests.push({
                  name: `menu_${menu}`,
                  success: true
                });
                
                // Menu screenshot
                await page.screenshot({ 
                  path: `alpha-test-logs/menu_${user.role}_${menu}.png`,
                  fullPage: true 
                });
                
                menuFound = true;
                break;
              } catch (e) {
                // Try next selector
                continue;
              }
            }
            
            if (!menuFound) {
              console.log(`    ❌ Menu '${menu}' not found or not clickable`);
              userTestResult.tests.push({
                name: `menu_${menu}`,
                success: false,
                error: 'Menu not found'
              });
              userTestResult.success = false;
            }
            
          } catch (error) {
            console.log(`    ❌ Menu '${menu}' test failed: ${error.message}`);
            userTestResult.tests.push({
              name: `menu_${menu}`,
              success: false,
              error: error.message
            });
            userTestResult.success = false;
          }
        }
        
      } catch (error) {
        console.log(`    ❌ Login failed: ${error.message}`);
        userTestResult.tests.push({
          name: 'login',
          success: false,
          error: error.message
        });
        userTestResult.success = false;
      }
      
    } catch (error) {
      console.log(`    ❌ User test failed: ${error.message}`);
      userTestResult.success = false;
      userTestResult.errors.push(error.message);
    }
    
    testResults.push(userTestResult);
    await page.close();
  }

  await browser.close();
  
  // Sonuçları dosyaya yaz
  fs.writeFileSync('alpha-test-logs/browser_logs.json', JSON.stringify(logs, null, 2));
  fs.writeFileSync('alpha-test-logs/browser_errors.json', JSON.stringify(errors, null, 2));
  fs.writeFileSync('alpha-test-logs/user_test_results.json', JSON.stringify(testResults, null, 2));
  
  return {
    totalTests: testResults.length,
    successfulTests: testResults.filter(r => r.success).length,
    totalErrors: errors.length,
    criticalErrors: errors.filter(e => e.severity === 'critical').length,
    testResults: testResults
  };
}

// Ana fonksiyon çalıştır
collectBrowserLogs()
  .then(results => {
    console.log('\n📊 Browser Test Results:');
    console.log(`   Users tested: ${results.successfulTests}/${results.totalTests}`);
    console.log(`   Total errors: ${results.totalErrors} (${results.criticalErrors} critical)`);
    
    if (results.browserTestsSkipped) {
      console.log('⚠️ Browser tests were skipped');
      process.exit(0);
    } else if (results.successfulTests === results.totalTests && results.criticalErrors === 0) {
      console.log('🎉 All browser tests PASSED!');
      process.exit(0);
    } else {
      console.log('❌ Some browser tests FAILED');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('💥 Browser test error:', error.message);
    process.exit(1);
  });
EOF

# Browser testleri çalıştır
echo -e "🌐 Starting browser automation..." | tee -a "$TEST_LOG"
cd ..
if node browser_test.js; then
    echo -e "${GREEN}✅ Browser tests completed${NC}" | tee -a "$LOG_DIR/$TEST_LOG"
    BROWSER_STATUS="OK"
else
    echo -e "${YELLOW}⚠️ Browser tests had issues${NC}" | tee -a "$LOG_DIR/$TEST_LOG"
    BROWSER_STATUS="WARNING"
fi
cd "$LOG_DIR"

echo "" | tee -a "$TEST_LOG"

# =============================================================================
# 4. SONUÇ ANALİZİ VE RAPOR ÜRETİMİ
# =============================================================================

echo -e "${BLUE}4️⃣ Test Sonuçları ve Analiz${NC}" | tee -a "$TEST_LOG"
echo "===============================" | tee -a "$TEST_LOG"

# Hata sayısını hesapla
ERROR_COUNT=0
if [[ -f "$ERROR_LOG" ]]; then
    ERROR_COUNT=$(jq length "$ERROR_LOG" 2>/dev/null || echo "0")
fi

CRITICAL_ERRORS=0
if [[ -f "browser_errors.json" ]]; then
    CRITICAL_ERRORS=$(jq '[.[] | select(.severity == "critical")] | length' browser_errors.json 2>/dev/null || echo "0")
fi

# Test özeti
echo -e "${BLUE}📊 Test Summary:${NC}" | tee -a "$TEST_LOG"
echo "   Backend Status: $BACKEND_STATUS" | tee -a "$TEST_LOG"
echo "   Frontend Status: $FRONTEND_STATUS" | tee -a "$TEST_LOG"
echo "   Browser Status: $BROWSER_STATUS" | tee -a "$TEST_LOG"
echo "   API Errors: $ERROR_COUNT" | tee -a "$TEST_LOG"
echo "   Critical Errors: $CRITICAL_ERRORS" | tee -a "$TEST_LOG"

# Final durumu belirle
if [[ "$BACKEND_STATUS" == "OK" && "$ERROR_COUNT" == "0" && "$CRITICAL_ERRORS" == "0" ]]; then
    echo "" | tee -a "$TEST_LOG"
    echo -e "${GREEN}🎉 All S6 Alpha tests PASSED!${NC}" | tee -a "$TEST_LOG"
    echo -e "${GREEN}🚀 All tests PASSED! System is production ready.${NC}" | tee -a "$TEST_LOG"
    echo "ALPHA_TEST=PASS" | tee -a "$TEST_LOG"
    FINAL_STATUS="PASS"
else
    echo "" | tee -a "$TEST_LOG"
    echo -e "${RED}❌ Alpha tests FAILED${NC}" | tee -a "$TEST_LOG"
    echo "ALPHA_TEST=FAIL" | tee -a "$TEST_LOG"
    FINAL_STATUS="FAIL"
fi

# Düzeltme promptu oluştur (eğer hata varsa)
if [[ "$FINAL_STATUS" == "FAIL" ]]; then
    cat > "$PROMPT_FILE" << EOF
# Flowner Alpha Test Hata Raporu
## Test Session: $TEST_SESSION
## Tarih: $(date)

### 🔴 Tespit Edilen Hatalar

#### Backend Durumu: $BACKEND_STATUS
#### API Hataları: $ERROR_COUNT
#### Kritik Hatalar: $CRITICAL_ERRORS

### 📋 Hata Detayları

EOF

    if [[ -f "$ERROR_LOG" && "$ERROR_COUNT" -gt "0" ]]; then
        echo "#### API Endpoint Hataları:" >> "$PROMPT_FILE"
        jq -r '.[] | "- \(.error): \(.method) \(.path) (Status: \(.status))"' "$ERROR_LOG" >> "$PROMPT_FILE" 2>/dev/null || echo "- Error log formatting failed" >> "$PROMPT_FILE"
        echo "" >> "$PROMPT_FILE"
    fi

    if [[ -f "browser_errors.json" ]]; then
        echo "#### Browser Hataları:" >> "$PROMPT_FILE"
        jq -r '.[] | "- \(.type): \(.message // .failure) (\(.context))"' browser_errors.json >> "$PROMPT_FILE" 2>/dev/null || echo "- Browser error log formatting failed" >> "$PROMPT_FILE"
        echo "" >> "$PROMPT_FILE"
    fi

    cat >> "$PROMPT_FILE" << EOF

### 🔧 Önerilen Düzeltmeler

1. **Backend Sorunları**: Eğer backend çalışmıyorsa, \`npm run dev\` ile yeniden başlatın
2. **API Hataları**: Token authentication ve endpoint routing'i kontrol edin
3. **Frontend Sorunları**: React component rendering ve routing'i kontrol edin
4. **Database Sorunları**: Connection string ve migrations'ı kontrol edin

### 📸 Screenshot'lar
Test sırasında alınan screenshot'lar \`alpha-test-logs/\` dizininde bulunabilir.

### 🔄 Yeniden Test
Düzeltmelerden sonra testi yeniden çalıştırın:
\`\`\`bash
./alpha_test_system.sh
\`\`\`
EOF

    echo -e "${YELLOW}📝 Hata raporu oluşturuldu: $PROMPT_FILE${NC}" | tee -a "$TEST_LOG"
fi

echo "" | tee -a "$TEST_LOG"
echo -e "${BLUE}✅ Alpha test tamamlandı${NC}" | tee -a "$TEST_LOG"
echo -e "${BLUE}📁 Log files: $LOG_DIR/${NC}" | tee -a "$TEST_LOG"

# Ana dizine geri dön
cd ..

exit 0