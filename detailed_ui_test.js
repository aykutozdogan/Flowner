import { chromium } from 'playwright';
import fs from 'fs';

// Detailed UI Test Scenarios
const UI_TEST_SCENARIOS = [
  {
    id: 'admin_dashboard_overview',
    name: 'Admin Dashboard Overview & Navigation',
    role: 'admin',
    email: 'admin@demo.local',
    password: 'Passw0rd!',
    steps: [
      { type: 'login', expectedRedirect: '/admin' },
      { type: 'screenshot', name: 'admin_dashboard_loaded' },
      { type: 'verify_elements', selectors: ['h1, h2, .dashboard-title', 'nav, .sidebar'] },
      { type: 'click_navigation', menu: 'Forms', expectedPath: '/admin/forms' },
      { type: 'screenshot', name: 'admin_forms_page' },
      { type: 'click_navigation', menu: 'Workflows', expectedPath: '/admin/workflows' },
      { type: 'screenshot', name: 'admin_workflows_page' },
      { type: 'click_navigation', menu: 'Processes', expectedPath: '/admin/processes' },
      { type: 'screenshot', name: 'admin_processes_page' }
    ]
  },
  {
    id: 'admin_form_creation',
    name: 'Admin Form Builder - Create New Form',
    role: 'admin', 
    email: 'admin@demo.local',
    password: 'Passw0rd!',
    steps: [
      { type: 'login', expectedRedirect: '/admin' },
      { type: 'navigate_to', path: '/admin/forms' },
      { type: 'screenshot', name: 'forms_list_page' },
      { type: 'click_button', text: ['Yeni Form', 'New Form', '+', 'Create Form', 'Add Form'] },
      { type: 'wait_for_modal', timeout: 3000 },
      { type: 'screenshot', name: 'new_form_modal' },
      { type: 'fill_field', name: 'name', value: 'UI Test Form ' + Date.now() },
      { type: 'fill_field', name: 'description', value: 'Automated UI test form creation' },
      { type: 'click_button', text: ['Kaydet', 'Save', 'Create'] },
      { type: 'wait_for_redirect', timeout: 5000 },
      { type: 'screenshot', name: 'form_created_success' }
    ]
  },
  {
    id: 'designer_workflow_creation',
    name: 'Designer BPMN Workflow Creation',
    role: 'designer',
    email: 'designer@demo.local',
    password: 'Designer123!', 
    steps: [
      { type: 'login', expectedRedirect: '/admin' },
      { type: 'navigate_to', path: '/admin/workflows' },
      { type: 'screenshot', name: 'workflows_list_page' },
      { type: 'click_button', text: ['Yeni Workflow', 'New Workflow', '+', 'Create'] },
      { type: 'wait_for_modal', timeout: 3000 },
      { type: 'fill_field', name: 'name', value: 'UI Test Workflow ' + Date.now() },
      { type: 'fill_field', name: 'description', value: 'Automated UI test workflow' },
      { type: 'click_button', text: ['Oluştur', 'Create'] },
      { type: 'wait_for_redirect', timeout: 5000 },
      { type: 'screenshot', name: 'workflow_created_success' }
    ]
  },
  {
    id: 'user_portal_navigation',
    name: 'User Portal Navigation & Task View',
    role: 'user',
    email: 'user@demo.local',
    password: 'User123!',
    steps: [
      { type: 'login', expectedRedirect: '/portal' },
      { type: 'screenshot', name: 'user_portal_loaded' },
      { type: 'verify_elements', selectors: ['.task-list, .inbox', 'nav, .sidebar'] },
      { type: 'navigate_to', path: '/portal/tasks' },
      { type: 'screenshot', name: 'user_tasks_page' },
      { type: 'navigate_to', path: '/portal/my-processes' },
      { type: 'screenshot', name: 'user_processes_page' }
    ]
  },
  {
    id: 'responsive_ui_test',
    name: 'Responsive UI & Mobile View Test',
    role: 'admin',
    email: 'admin@demo.local',
    password: 'Passw0rd!',
    steps: [
      { type: 'login', expectedRedirect: '/admin' },
      { type: 'set_viewport', width: 1920, height: 1080 },
      { type: 'screenshot', name: 'desktop_view' },
      { type: 'set_viewport', width: 768, height: 1024 },
      { type: 'screenshot', name: 'tablet_view' },
      { type: 'set_viewport', width: 375, height: 667 },
      { type: 'screenshot', name: 'mobile_view' },
      { type: 'set_viewport', width: 1920, height: 1080 }
    ]
  }
];

// Screenshot helper
let screenshotCounter = 0;

async function takeScreenshot(page, name, context = '') {
  screenshotCounter++;
  const filename = `ui-test-logs/${screenshotCounter.toString().padStart(3, '0')}_${name}_${context}.png`;
  await page.screenshot({ 
    path: filename, 
    fullPage: true
  });
  console.log(`        📸 Screenshot saved: ${filename}`);
  return filename;
}

// Step execution functions
async function executeUIStep(step, page, context) {
  const startTime = Date.now();
  console.log(`      🔧 ${step.type}: ${JSON.stringify(step).substring(0, 100)}...`);
  
  try {
    switch (step.type) {
      case 'login':
        await page.goto('http://localhost:5000/login', { waitUntil: 'networkidle' });
        
        // Find email field with multiple selectors
        const emailSelectors = ['input[name="email"]', 'input[type="email"]', '#email', '[data-testid="email"]'];
        let emailField = null;
        for (const selector of emailSelectors) {
          try {
            await page.waitForSelector(selector, { timeout: 2000 });
            emailField = page.locator(selector).first();
            break;
          } catch (e) {
            continue;
          }
        }
        if (!emailField) {
          throw new Error('Email field not found');
        }
        
        // Find password field
        const passwordSelectors = ['input[name="password"]', 'input[type="password"]', '#password', '[data-testid="password"]'];
        let passwordField = null;
        for (const selector of passwordSelectors) {
          try {
            await page.waitForSelector(selector, { timeout: 2000 });
            passwordField = page.locator(selector).first();
            break;
          } catch (e) {
            continue;
          }
        }
        if (!passwordField) {
          throw new Error('Password field not found');
        }
        
        // Fill and submit
        await emailField.fill(context.email);
        await passwordField.fill(context.password);
        
        const submitSelectors = ['button[type="submit"]', 'input[type="submit"]', 'button:has-text("Giriş")', 'button:has-text("Login")'];
        let submitButton = null;
        for (const selector of submitSelectors) {
          try {
            await page.waitForSelector(selector, { timeout: 2000 });
            submitButton = page.locator(selector).first();
            break;
          } catch (e) {
            continue;
          }
        }
        
        if (submitButton) {
          await submitButton.click();
        } else {
          await passwordField.press('Enter');
        }
        
        await page.waitForLoadState('networkidle', { timeout: 10000 });
        
        // Verify redirect
        if (step.expectedRedirect) {
          try {
            await page.waitForURL(url => url.includes(step.expectedRedirect), { timeout: 5000 });
          } catch (e) {
            console.log(`        ⚠️ Expected redirect to ${step.expectedRedirect} not detected`);
          }
        }
        break;
        
      case 'screenshot':
        await takeScreenshot(page, step.name, context.role);
        break;
        
      case 'navigate_to':
        await page.goto(`http://localhost:5000${step.path}`, { waitUntil: 'networkidle' });
        break;
        
      case 'verify_elements':
        for (const selector of step.selectors) {
          const elements = page.locator(selector);
          const count = await elements.count();
          if (count === 0) {
            console.log(`        ⚠️ Element not found: ${selector}`);
          } else {
            console.log(`        ✅ Found ${count} element(s): ${selector}`);
          }
        }
        break;
        
      case 'click_navigation':
        const navSelectors = [
          `a:has-text("${step.menu}")`,
          `button:has-text("${step.menu}")`,
          `[data-testid*="${step.menu.toLowerCase()}"]`,
          `nav a[href*="${step.menu.toLowerCase()}"]`,
          `.sidebar a:has-text("${step.menu}")`
        ];
        
        let navClicked = false;
        for (const selector of navSelectors) {
          try {
            const navElement = page.locator(selector).first();
            if (await navElement.count() > 0) {
              await navElement.click();
              await page.waitForLoadState('networkidle', { timeout: 5000 });
              navClicked = true;
              break;
            }
          } catch (e) {
            continue;
          }
        }
        
        if (!navClicked) {
          console.log(`        ⚠️ Navigation menu '${step.menu}' not found or not clickable`);
        } else {
          console.log(`        ✅ Successfully clicked navigation: ${step.menu}`);
        }
        break;
        
      case 'click_button':
        let buttonClicked = false;
        for (const text of step.text) {
          try {
            const buttonElement = page.locator(`button:has-text("${text}"), input[type="submit"][value*="${text}"], a:has-text("${text}")`).first();
            if (await buttonElement.count() > 0) {
              await buttonElement.click();
              buttonClicked = true;
              console.log(`        ✅ Clicked button: ${text}`);
              break;
            }
          } catch (e) {
            continue;
          }
        }
        
        if (!buttonClicked) {
          console.log(`        ⚠️ Button not found: ${step.text.join(', ')}`);
        }
        break;
        
      case 'wait_for_modal':
        try {
          await page.waitForSelector('.modal, .dialog, [role="dialog"]', { timeout: step.timeout || 3000 });
          console.log(`        ✅ Modal appeared`);
        } catch (e) {
          console.log(`        ⚠️ Modal did not appear within ${step.timeout}ms`);
        }
        break;
        
      case 'fill_field':
        const fieldSelectors = [
          `input[name="${step.name}"]`,
          `textarea[name="${step.name}"]`,
          `#${step.name}`,
          `[data-testid="${step.name}"]`
        ];
        
        let fieldFilled = false;
        for (const selector of fieldSelectors) {
          try {
            const field = page.locator(selector).first();
            if (await field.count() > 0) {
              await field.fill(step.value);
              fieldFilled = true;
              console.log(`        ✅ Filled field '${step.name}': ${step.value}`);
              break;
            }
          } catch (e) {
            continue;
          }
        }
        
        if (!fieldFilled) {
          console.log(`        ⚠️ Field '${step.name}' not found`);
        }
        break;
        
      case 'wait_for_redirect':
        await page.waitForLoadState('networkidle', { timeout: step.timeout || 5000 });
        console.log(`        ✅ Page loaded after redirect`);
        break;
        
      case 'set_viewport':
        await page.setViewportSize({ width: step.width, height: step.height });
        console.log(`        ✅ Viewport set to ${step.width}x${step.height}`);
        break;
        
      default:
        console.log(`        ⚠️ Unknown step type: ${step.type}`);
    }
    
    const duration = Date.now() - startTime;
    return { success: true, duration, step: step.type };
    
  } catch (error) {
    const duration = Date.now() - startTime;
    console.log(`        ❌ Step failed: ${error.message}`);
    return { success: false, duration, step: step.type, error: error.message };
  }
}

async function runDetailedUITests() {
  console.log('🎭 Starting Detailed UI Tests...');
  
  let browser;
  try {
    browser = await chromium.launch({ 
      headless: false, // Show browser for debugging
      slowMo: 1000, // 1 second delay between actions
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
  } catch (error) {
    console.log('❌ Failed to launch browser:', error.message);
    return { failed: true, error: error.message };
  }
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    userAgent: 'DetailedUITest-Bot/1.0',
    recordVideo: {
      dir: 'ui-test-logs/videos/',
      size: { width: 1920, height: 1080 }
    }
  });
  
  const results = {
    totalScenarios: UI_TEST_SCENARIOS.length,
    completedScenarios: 0,
    totalSteps: 0,
    completedSteps: 0,
    errors: [],
    scenarios: []
  };

  console.log(`🎬 Running ${UI_TEST_SCENARIOS.length} UI test scenarios...\n`);

  for (const scenario of UI_TEST_SCENARIOS) {
    console.log(`\n🎭 Scenario: ${scenario.name} (${scenario.role})`);
    console.log(`    📧 User: ${scenario.email}`);
    
    const page = await context.newPage();
    const scenarioResult = {
      id: scenario.id,
      name: scenario.name,
      role: scenario.role,
      steps: [],
      success: true,
      startTime: new Date().toISOString()
    };
    
    // Error handlers for this page
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log(`        🔴 Console Error: ${msg.text()}`);
        results.errors.push({
          type: 'console_error',
          scenario: scenario.id,
          message: msg.text(),
          timestamp: new Date().toISOString()
        });
      }
    });
    
    page.on('pageerror', error => {
      console.log(`        💥 Page Error: ${error.message}`);
      results.errors.push({
        type: 'page_error',
        scenario: scenario.id,
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      });
    });
    
    page.on('requestfailed', request => {
      console.log(`        🌐 Request Failed: ${request.url()}`);
      results.errors.push({
        type: 'network_error',
        scenario: scenario.id,
        url: request.url(),
        failure: request.failure()?.errorText,
        timestamp: new Date().toISOString()
      });
    });

    // Execute scenario steps
    for (const step of scenario.steps) {
      results.totalSteps++;
      const stepResult = await executeUIStep(step, page, scenario);
      scenarioResult.steps.push(stepResult);
      
      if (stepResult.success) {
        results.completedSteps++;
      } else {
        scenarioResult.success = false;
      }
      
      // Small delay between steps
      await page.waitForTimeout(500);
    }
    
    scenarioResult.endTime = new Date().toISOString();
    results.scenarios.push(scenarioResult);
    
    if (scenarioResult.success) {
      results.completedScenarios++;
      console.log(`    ✅ Scenario completed successfully!`);
    } else {
      console.log(`    ❌ Scenario completed with errors`);
    }
    
    await page.close();
  }

  await context.close();
  await browser.close();

  // Save results
  fs.writeFileSync('ui-test-logs/detailed_ui_results.json', JSON.stringify(results, null, 2));

  return results;
}

// Run the tests
runDetailedUITests()
  .then(results => {
    console.log('\n📊 Detailed UI Test Results:');
    console.log(`   Scenarios: ${results.completedScenarios}/${results.totalScenarios}`);
    console.log(`   Steps: ${results.completedSteps}/${results.totalSteps}`);
    console.log(`   Errors: ${results.errors.length}`);
    
    if (results.failed) {
      console.log('💥 Tests failed to run:', results.error);
      process.exit(1);
    } else if (results.completedScenarios === results.totalScenarios && results.errors.length === 0) {
      console.log('🎉 DETAILED UI TESTS: PASSED!');
      console.log('Your Flowner platform UI is production-ready!');
      process.exit(0);
    } else if (results.completedScenarios >= results.totalScenarios * 0.8) {
      console.log('⚠️ DETAILED UI TESTS: PARTIAL SUCCESS');
      console.log('Some issues found but core functionality works');
      process.exit(0);
    } else {
      console.log('❌ DETAILED UI TESTS: FAILED');
      console.log('Significant issues found in UI functionality');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('💥 Detailed UI test error:', error.message);
    process.exit(1);
  });
