import http from 'http';

function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ status: res.statusCode, data: jsonData });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', reject);
    
    if (postData) {
      req.write(postData);
    }
    
    req.end();
  });
}

async function testAuth() {
  try {
    console.log('🔄 Testing authentication and database integration...\n');

    // Test login
    const loginOptions = {
      hostname: 'localhost',
      port: 3001,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    };

    const loginData = JSON.stringify({
      email: 'patient@example.com',
      password: 'password123'
    });

    console.log('📤 Testing login...');
    const loginResponse = await makeRequest(loginOptions, loginData);
    console.log('✅ Login Response Status:', loginResponse.status);
    console.log('📋 Login Response:', loginResponse.data);

    if (loginResponse.data && loginResponse.data.data && loginResponse.data.data.accessToken) {
      const token = loginResponse.data.data.accessToken;
      console.log('\n🔑 Token received, testing API endpoints...\n');

      // Test patient endpoint with token
      const patientOptions = {
        hostname: 'localhost',
        port: 3001,
        path: '/api/patients/me',
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      };

      console.log('📤 Testing /patients/me endpoint...');
      const patientResponse = await makeRequest(patientOptions);
      console.log('✅ Patient Endpoint Status:', patientResponse.status);
      console.log('📋 Patient Response:', patientResponse.data);

      // Test patient programs endpoint
      const programsOptions = {
        hostname: 'localhost',
        port: 3001,
        path: '/api/patients/me/programs',
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      };

      console.log('\n📤 Testing /patients/me/programs endpoint...');
      const programsResponse = await makeRequest(programsOptions);
      console.log('✅ Programs Endpoint Status:', programsResponse.status);
      console.log('📋 Programs Response:', programsResponse.data);

      // Test patient stats endpoint
      const statsOptions = {
        hostname: 'localhost',
        port: 3001,
        path: '/api/patients/me/stats',
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      };

      console.log('\n📤 Testing /patients/me/stats endpoint...');
      const statsResponse = await makeRequest(statsOptions);
      console.log('✅ Stats Endpoint Status:', statsResponse.status);
      console.log('📋 Stats Response:', statsResponse.data);

    } else {
      console.log('❌ Login failed - no token received');
    }
  } catch (error) {
    console.error('❌ Test Error:', error);
  }
}

testAuth();