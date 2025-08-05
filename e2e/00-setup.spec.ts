import { test, expect } from '@playwright/test';
import { ensureTestUser, defaultTestUser } from './setup/ensure-test-user';

test.describe('Setup', () => {
  test('ensure test user exists', async ({ request }) => {
    // Check backend health first
    const healthResponse = await request.get('/health');
    expect(healthResponse.ok()).toBeTruthy();
    
    // Set up test user
    await ensureTestUser(defaultTestUser);
    
    // Verify login works
    const loginResponse = await request.post('/api/v1/auth/login', {
      data: {
        email: defaultTestUser.email,
        password: defaultTestUser.password,
      },
    });
    
    expect(loginResponse.ok()).toBeTruthy();
    const loginData = await loginResponse.json();
    expect(loginData).toHaveProperty('user');
    expect(loginData).toHaveProperty('csrfToken');
  });
});