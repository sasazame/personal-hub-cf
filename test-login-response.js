const API_URL = 'http://localhost:8787';

async function testLoginResponse() {
  try {
    const response = await fetch(`${API_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'Password123!'
      })
    });
    
    const data = await response.json();
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(data, null, 2));
    
    if (data.data && data.data.accessToken) {
      console.log('Token received:', data.data.accessToken.substring(0, 20) + '...');
      console.log('User data:', data.data.user);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

testLoginResponse();