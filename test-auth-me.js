const API_URL = 'http://localhost:8787';

async function testAuthMe() {
  try {
    // First login to get token
    const loginResponse = await fetch(`${API_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'Password123!'
      })
    });
    
    const loginData = await loginResponse.json();
    const token = loginData.accessToken;
    
    console.log('Got token:', token.substring(0, 20) + '...');
    
    // Now test /api/v1/auth/me
    const meResponse = await fetch(`${API_URL}/api/v1/auth/me`, {
      headers: { 
        'Authorization': `Bearer ${token}`
      }
    });
    
    const meData = await meResponse.json();
    console.log('Response status:', meResponse.status);
    console.log('Response data:', JSON.stringify(meData, null, 2));
  } catch (error) {
    console.error('Error:', error);
  }
}

testAuthMe();