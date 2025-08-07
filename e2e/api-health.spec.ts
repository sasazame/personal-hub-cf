import { test, expect } from '@playwright/test';

test.describe('API Health Check', () => {
  const apiUrl = process.env.VITE_API_BASE_URL || 'http://localhost:8787';
  
  test('should return 200 for health endpoint', async ({ request }) => {
    const response = await request.get(`${apiUrl}/health`);
    expect(response.status()).toBe(200);
    
    const body = await response.json();
    expect(body).toHaveProperty('status', 'ok');
    expect(body).toHaveProperty('environment');
  });

  test('should return API version information', async ({ request }) => {
    const response = await request.get(`${apiUrl}/api/v1`);
    expect(response.status()).toBe(200);
    
    const body = await response.json();
    expect(body).toHaveProperty('message');
    expect(body).toHaveProperty('version');
  });
});