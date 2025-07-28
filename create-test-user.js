const API_URL = 'http://localhost:8787';

async function createTestUser() {
  try {
    // Try to register the test user
    const response = await fetch(`${API_URL}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'Password123!',
        username: 'testuser'
      })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log('Test user created successfully');
    } else if (data.error && data.error.includes('already exists')) {
      console.log('Test user already exists');
    } else {
      console.error('Failed to create test user:', data);
    }
    
    // Also create a second test user
    const response2 = await fetch(`${API_URL}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test2@example.com',
        password: 'Password123!',
        username: 'testuser2'
      })
    });
    
    const data2 = await response2.json();
    
    if (response2.ok) {
      console.log('Test user 2 created successfully');
    } else if (data2.error && data2.error.includes('already exists')) {
      console.log('Test user 2 already exists');
    } else {
      console.error('Failed to create test user 2:', data2);
    }
    
  } catch (error) {
    console.error('Error creating test users:', error);
  }
}

createTestUser();