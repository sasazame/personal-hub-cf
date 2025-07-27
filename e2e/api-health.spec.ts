import { test, expect } from '@playwright/test';

test.describe('API Health Check', () => {
  test('should return 200 for health endpoint', async ({ request }) => {
    const response = await request.get('/health');
    expect(response.status()).toBe(200);
    
    const body = await response.json();
    expect(body).toHaveProperty('status', 'ok');
    expect(body).toHaveProperty('environment');
  });

  test('should return API version information', async ({ request }) => {
    const response = await request.get('/api/v1');
    expect(response.status()).toBe(200);
    
    const body = await response.json();
    expect(body).toHaveProperty('message');
    expect(body).toHaveProperty('version');
  });
});