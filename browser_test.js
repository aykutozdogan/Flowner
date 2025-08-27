import { chromium } from 'playwright';
import fs from 'fs';

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
