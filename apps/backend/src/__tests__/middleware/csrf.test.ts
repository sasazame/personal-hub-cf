import { describe, it, expect, beforeEach } from 'vitest';
import { Hono } from 'hono';
import { csrfMiddleware, generateAndSetCSRFToken } from '../../middleware/csrf';
import type { Bindings, Variables } from '../../types';

describe('CSRF Middleware', () => {
  let app: Hono<{ Bindings: Bindings; Variables: Variables }>;

  beforeEach(() => {
    app = new Hono<{ Bindings: Bindings; Variables: Variables }>();
    
    // Add CSRF middleware
    app.use('*', csrfMiddleware);
    
    // Test routes
    app.get('/test', (c) => {
      return c.json({ message: 'GET success' });
    });
    
    app.post('/test', (c) => {
      return c.json({ message: 'POST success' });
    });
    
    app.put('/test', (c) => {
      return c.json({ message: 'PUT success' });
    });
    
    app.delete('/test', (c) => {
      return c.json({ message: 'DELETE success' });
    });
    
    // Protected auth endpoint (should skip CSRF)
    app.post('/api/v1/auth/login', (c) => {
      return c.json({ message: 'Login success' });
    });
  });

  describe('Safe methods', () => {
    it('should allow GET requests without CSRF token', async () => {
      const response = await app.request('/test', {
        method: 'GET',
      });
      
      expect(response.status).toBe(200);
      const data = await response.json() as { message: string };
      expect(data.message).toBe('GET success');
    });

    it('should allow HEAD requests without CSRF token', async () => {
      const response = await app.request('/test', {
        method: 'HEAD',
      });
      
      expect(response.status).toBe(200);
    });

    it('should allow OPTIONS requests without CSRF token', async () => {
      // Add OPTIONS handler
      app.options('/test', (c) => {
        return c.json({ message: 'OPTIONS success' });
      });
      
      const response = await app.request('/test', {
        method: 'OPTIONS',
      });
      
      expect(response.status).toBe(200);
    });
  });

  describe('State-changing methods', () => {
    it('should reject POST requests without CSRF token', async () => {
      const response = await app.request('/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data: 'test' }),
      });
      
      expect(response.status).toBe(403);
      const data = await response.json() as { code: string; message: string };
      expect(data.message).toBe('CSRF token missing');
    });

    it('should reject PUT requests without CSRF token', async () => {
      const response = await app.request('/test', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data: 'test' }),
      });
      
      expect(response.status).toBe(403);
      const data = await response.json() as { code: string; message: string };
      expect(data.message).toBe('CSRF token missing');
    });

    it('should reject DELETE requests without CSRF token', async () => {
      const response = await app.request('/test', {
        method: 'DELETE',
      });
      
      expect(response.status).toBe(403);
      const data = await response.json() as { code: string; message: string };
      expect(data.message).toBe('CSRF token missing');
    });

    it('should accept requests with valid CSRF token', async () => {
      const token = 'test-csrf-token';
      
      const response = await app.request('/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': token,
          'Cookie': `csrf-token=${token}`,
        },
        body: JSON.stringify({ data: 'test' }),
      });
      
      expect(response.status).toBe(200);
      const data = await response.json() as { message: string };
      expect(data.message).toBe('POST success');
    });

    it('should reject requests with mismatched CSRF tokens', async () => {
      const response = await app.request('/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': 'token-in-header',
          'Cookie': 'csrf-token=different-token-in-cookie',
        },
        body: JSON.stringify({ data: 'test' }),
      });
      
      expect(response.status).toBe(403);
      const data = await response.json() as { code: string; message: string };
      expect(data.message).toBe('CSRF token invalid');
    });
  });

  describe('Excluded paths', () => {
    it('should skip CSRF check for login endpoint', async () => {
      const response = await app.request('/api/v1/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: 'test@example.com', password: 'password' }),
      });
      
      expect(response.status).toBe(200);
      const data = await response.json() as { message: string };
      expect(data.message).toBe('Login success');
    });
  });

  describe('CSRF token generation', () => {
    it('should generate and set CSRF token cookie', async () => {
      const testApp = new Hono<{ Bindings: Bindings; Variables: Variables }>();
      
      testApp.get('/generate', (c) => {
        const token = generateAndSetCSRFToken(c);
        return c.json({ csrfToken: token });
      });

      const response = await testApp.request('/generate', {
        method: 'GET',
      });

      expect(response.status).toBe(200);
      const data = await response.json() as { csrfToken: string };
      expect(data.csrfToken).toBeDefined();
      expect(typeof data.csrfToken).toBe('string');
      
      // Check that cookie is set
      const setCookieHeader = response.headers.get('Set-Cookie');
      expect(setCookieHeader).toBeDefined();
      expect(setCookieHeader).toContain('csrf-token=');
      expect(setCookieHeader).toContain('SameSite=Lax');
      expect(setCookieHeader).toContain('Path=/');
    });
  });

  describe('CSRF token validation edge cases', () => {
    it('should reject requests with empty CSRF token in header', async () => {
      const response = await app.request('/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': '',
          'Cookie': 'csrf-token=valid-token',
        },
        body: JSON.stringify({ data: 'test' }),
      });
      
      expect(response.status).toBe(403);
      const data = await response.json() as { code: string; message: string };
      expect(data.message).toBe('CSRF token missing');
    });

    it('should reject requests with empty CSRF token in cookie', async () => {
      const response = await app.request('/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': 'valid-token',
          'Cookie': 'csrf-token=',
        },
        body: JSON.stringify({ data: 'test' }),
      });
      
      expect(response.status).toBe(403);
      const data = await response.json() as { code: string; message: string };
      expect(data.message).toBe('CSRF token missing');
    });

    it('should accept case-insensitive CSRF header', async () => {
      const token = 'test-csrf-token';
      
      const response = await app.request('/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': token, // lowercase header
          'Cookie': `csrf-token=${token}`,
        },
        body: JSON.stringify({ data: 'test' }),
      });
      
      expect(response.status).toBe(200);
      const data = await response.json() as { message: string };
      expect(data.message).toBe('POST success');
    });

    it('should reject requests with malformed CSRF tokens', async () => {
      const response = await app.request('/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': 'token-with-special-chars-<script>',
          'Cookie': 'csrf-token=different-token',
        },
        body: JSON.stringify({ data: 'test' }),
      });
      
      expect(response.status).toBe(403);
      const data = await response.json() as { code: string; message: string };
      expect(data.message).toBe('CSRF token invalid');
    });
  });
});