// S3 Form API Node.js Test (basit HTTP testleri)
// Jest dependency gerekmez, sadece Node.js fetch API kullanır

interface TestResponse {
  status: number;
  body: any;
}

async function makeRequest(method: string, url: string, options: any = {}): Promise<TestResponse> {
  const response = await fetch(url, {
    method,
    ...options
  });
  
  const body = await response.json().catch(() => ({}));
  return { status: response.status, body };
}

describe('S3 Form API Tests', () => {
  let accessToken: string;
  const apiBase = 'http://localhost:5000';
  const tenantId = 'demo.local';
  const testFormKey = `test-form-${Date.now()}`;

  beforeAll(async () => {
    // Admin login
    const loginResponse = await makeRequest('POST', `${apiBase}/api/auth/login`, {
      headers: {
        'Content-Type': 'application/json',
        'X-Tenant-Id': tenantId
      },
      body: JSON.stringify({
        email: 'admin@demo.local',
        password: 'Passw0rd!'
      })
    });

    expect(loginResponse.status).toBe(200);
    expect(loginResponse.body.success).toBe(true);
    accessToken = loginResponse.body.data.access_token;
  });

  test('Form create should return 200', async () => {
    const formData = {
      key: testFormKey,
      name: `Test Form ${Date.now()}`,
      description: 'Jest test form',
      schema_json: {
        fields: [
          { name: 'amount', type: 'number', required: true, label: 'Tutar' },
          { name: 'description', type: 'text', required: false, label: 'Açıklama' }
        ]
      },
      ui_schema_json: {
        layout: 'grid',
        columns: 2,
        fields: {
          amount: { placeholder: 'Tutarı giriniz' },
          description: { placeholder: 'Açıklama giriniz' }
        }
      }
    };

    const response = await makeRequest('POST', `${apiBase}/api/v1/forms`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'X-Tenant-Id': tenantId,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(formData)
    });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toBeDefined();
    expect(response.body.data.form).toBeDefined();
    expect(response.body.data.version).toBeDefined();
  });

  test('Form publish should return 200', async () => {
    const response = await makeRequest('POST', `${apiBase}/api/v1/forms/${testFormKey}/publish`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'X-Tenant-Id': tenantId,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({})
    });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toContain('published');
  });

  test('Form preview should return 200 with expected fields', async () => {
    const response = await makeRequest('GET', `${apiBase}/api/v1/forms/${testFormKey}/preview`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'X-Tenant-Id': tenantId
      }
    });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toBeDefined();
    expect(response.body.data.form).toBeDefined();
    expect(response.body.data.version).toBeDefined();
    expect(response.body.data.schema_json).toBeDefined();
    expect(response.body.data.ui_schema_json).toBeDefined();
    
    // Schema alanları kontrolü
    expect(response.body.data.schema_json.fields).toBeDefined();
    expect(Array.isArray(response.body.data.schema_json.fields)).toBe(true);
    expect(response.body.data.schema_json.fields.length).toBeGreaterThan(0);
    
    // UI Schema kontrolü
    expect(response.body.data.ui_schema_json.layout).toBeDefined();
    expect(response.body.data.ui_schema_json.fields).toBeDefined();
  });

  test('Form validate should handle validation', async () => {
    const validData = {
      data: {
        amount: 1500,
        description: 'Test açıklama'
      }
    };

    const response = await makeRequest('POST', `${apiBase}/api/v1/forms/${testFormKey}/validate`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'X-Tenant-Id': tenantId,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(validData)
    });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toBeDefined();
    expect(response.body.data.valid).toBeDefined();
  });
});

// Node.js testleri için basit expect implementation
function expect(actual: any) {
  return {
    toBe: (expected: any) => {
      if (actual !== expected) {
        throw new Error(`Expected ${actual} to be ${expected}`);
      }
    },
    toBeDefined: () => {
      if (actual === undefined) {
        throw new Error(`Expected ${actual} to be defined`);
      }
    },
    toContain: (expected: any) => {
      if (!actual.includes(expected)) {
        throw new Error(`Expected ${actual} to contain ${expected}`);
      }
    },
    toBeGreaterThan: (expected: any) => {
      if (actual <= expected) {
        throw new Error(`Expected ${actual} to be greater than ${expected}`);
      }
    }
  };
}

// Test runner
async function runTests() {
  console.log('🧪 S3 Form API Tests başlatılıyor...');
  
  // Mock test framework functions
  let currentDescribe = '';
  let testCount = 0;
  let passedCount = 0;
  
  global.describe = (name: string, fn: Function) => {
    currentDescribe = name;
    console.log(`\n📋 ${name}`);
    fn();
  };
  
  global.beforeAll = (fn: Function) => {
    // Setup çalıştır
    return fn();
  };
  
  global.test = async (name: string, fn: Function) => {
    testCount++;
    try {
      await fn();
      passedCount++;
      console.log(`  ✅ ${name}`);
    } catch (error) {
      console.log(`  ❌ ${name}: ${error.message}`);
    }
  };
  
  // Test süitini çalıştır
  describe('S3 Form API Tests', () => {
    let accessToken: string;
    const apiBase = 'http://localhost:5000';
    const tenantId = 'demo.local';
    const testFormKey = `test-form-${Date.now()}`;

    beforeAll(async () => {
      // Admin login
      const loginResponse = await makeRequest('POST', `${apiBase}/api/auth/login`, {
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-Id': tenantId
        },
        body: JSON.stringify({
          email: 'admin@demo.local',
          password: 'Passw0rd!'
        })
      });

      expect(loginResponse.status).toBe(200);
      expect(loginResponse.body.success).toBe(true);
      accessToken = loginResponse.body.data.access_token;
    });

    test('Form create should return 200', async () => {
      const formData = {
        key: testFormKey,
        name: `Test Form ${Date.now()}`,
        description: 'Node.js test form',
        schema_json: {
          fields: [
            { name: 'amount', type: 'number', required: true, label: 'Tutar' },
            { name: 'description', type: 'text', required: false, label: 'Açıklama' }
          ]
        },
        ui_schema_json: {
          layout: 'grid',
          columns: 2,
          fields: {
            amount: { placeholder: 'Tutarı giriniz' },
            description: { placeholder: 'Açıklama giriniz' }
          }
        }
      };

      const response = await makeRequest('POST', `${apiBase}/api/v1/forms`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'X-Tenant-Id': tenantId,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.form).toBeDefined();
      expect(response.body.data.version).toBeDefined();
    });

    test('Form publish should return 200', async () => {
      const response = await makeRequest('POST', `${apiBase}/api/v1/forms/${testFormKey}/publish`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'X-Tenant-Id': tenantId,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('published');
    });

    test('Form preview should return 200 with expected fields', async () => {
      const response = await makeRequest('GET', `${apiBase}/api/v1/forms/${testFormKey}/preview`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'X-Tenant-Id': tenantId
        }
      });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.form).toBeDefined();
      expect(response.body.data.version).toBeDefined();
      expect(response.body.data.schema_json).toBeDefined();
      expect(response.body.data.ui_schema_json).toBeDefined();
      
      // Schema alanları kontrolü
      expect(response.body.data.schema_json.fields).toBeDefined();
      expect(Array.isArray(response.body.data.schema_json.fields)).toBe(true);
      expect(response.body.data.schema_json.fields.length).toBeGreaterThan(0);
      
      // UI Schema kontrolü
      expect(response.body.data.ui_schema_json.layout).toBeDefined();
      expect(response.body.data.ui_schema_json.fields).toBeDefined();
    });
  });
  
  console.log(`\n📊 Test Sonuçları: ${passedCount}/${testCount} geçti`);
  return passedCount === testCount;
}

// Sadece doğrudan çalıştırılırsa testleri çalıştır
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests();
}