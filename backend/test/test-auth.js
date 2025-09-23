const fetch = require('node-fetch');

async function testAuth() {
  try {
    // Test login
    const loginResponse = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'patient@example.com',
        password: 'password123'
      })
    });

    console.log('Login Response Status:', loginResponse.status);
    const loginData = await loginResponse.json();
    console.log('Login Response:', loginData);

    if (loginData.token) {
      // Test patient endpoint with token
      const patientResponse = await fetch('http://localhost:3001/api/patients/me', {
        headers: {
          'Authorization': `Bearer ${loginData.token}`,
        }
      });

      console.log('\nPatient Endpoint Status:', patientResponse.status);
      const patientData = await patientResponse.json();
      console.log('Patient Response:', patientData);
    }
  } catch (error) {
    console.error('Test Error:', error);
  }
}

testAuth();