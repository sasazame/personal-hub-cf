import { describe, it, expect, beforeEach, afterEach, afterAll } from 'vitest';
import { Hono } from 'hono';
import { setupTestDatabase, cleanupTestDatabase, closeTestDatabase } from '../integration/setup-test-db';
import { createTestUserData } from '../integration/fixtures';
import * as jwt from '@tsndr/cloudflare-worker-jwt';
import type { Bindings, Variables } from '../../types';
import * as schema from '../../db/schema';
import todosRoutes from '../../routes/todos';
import notesRoutes from '../../routes/notes';
import momentsRoutes from '../../routes/moments';
import analyticsRoutes from '../../routes/analytics';
import type { Database } from '../../db';

describe('SQL Injection Security Tests', () => {
  let app: Hono<{ Bindings: Bindings; Variables: Variables }>;
  let db: Database;
  let env: Bindings;
  let testUser: typeof schema.users.$inferSelect;
  let accessToken: string;

  beforeEach(async () => {
    // Setup test database
    const setup = await setupTestDatabase();
    db = setup.db;
    env = setup.env as Bindings;

    // Create test user
    const userData = await createTestUserData();
    const users = await db.insert(schema.users).values(userData).returning();
    testUser = users[0];
    
    // Generate access token
    accessToken = await jwt.sign(
      { 
        sub: testUser.id, 
        type: 'access',
        exp: Math.floor(Date.now() / 1000) + (15 * 60)
      },
      env.JWT_SECRET
    );

    app = new Hono<{ Bindings: Bindings; Variables: Variables }>();
    
    // Add database middleware
    app.use('*', async (c, next) => {
      c.set('db', db);
      await next();
    });
    
    // Mount routes
    app.route('/todos', todosRoutes);
    app.route('/notes', notesRoutes);
    app.route('/moments', momentsRoutes);
    app.route('/analytics', analyticsRoutes);
  });

  afterEach(async () => {
    await cleanupTestDatabase();
  });
  
  afterAll(async () => {
    await closeTestDatabase();
  });

  describe('Query Parameter Injection', () => {
    it('should handle SQL injection in search parameter', async () => {
      // Create some test data
      await db.insert(schema.todos).values({
        userId: testUser.id,
        title: 'Test Todo',
        description: 'Normal description',
        status: 'TODO',
        priority: 'MEDIUM',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      // Common SQL injection attempts
      const injectionAttempts = [
        "'; DROP TABLE todos; --",
        "1' OR '1'='1",
        "1'; DELETE FROM users WHERE '1'='1",
        "1' UNION SELECT * FROM users --",
        "admin'--",
        "' OR 1=1--",
        "1' AND (SELECT COUNT(*) FROM users) > 0--",
        "%' OR '1'='1' --",
      ];

      for (const injection of injectionAttempts) {
        const res = await app.request(`/todos?search=${encodeURIComponent(injection)}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }, env);

        // Should not cause error, should handle gracefully
        expect(res.status).toBe(200);
        const body = await res.json();
        expect((body as { items: unknown[] }).items).toBeDefined();
        
        // Verify tables still exist
        const tables = await db.select().from(schema.todos).limit(1);
        expect(tables).toBeDefined();
      }
    });

    it('should handle SQL injection in tag filters', async () => {
      await db.insert(schema.notes).values({
        userId: testUser.id,
        title: 'Test Note',
        content: 'Content',
        tags: 'work,important',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      const injectionAttempts = [
        "work' OR tags LIKE '%",
        "'; UPDATE notes SET userId='hacker' WHERE '1'='1",
        "1' UNION SELECT password FROM users--",
      ];

      for (const injection of injectionAttempts) {
        const res = await app.request(`/notes?tags=${encodeURIComponent(injection)}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }, env);

        expect(res.status).toBe(200);
        const body = await res.json();
        expect((body as { items: unknown[] }).items).toBeDefined();
      }
    });

    it('should handle SQL injection in date range queries', async () => {
      const injectionAttempts = [
        "2025-01-01'; DROP TABLE events; --",
        "2025-01-01' OR '1'='1",
      ];

      for (const fromDate of injectionAttempts) {
        const res = await app.request(`/analytics/productivity?fromDate=${encodeURIComponent(fromDate)}&toDate=2025-12-31`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }, env);

        // Should either validate and reject or handle safely
        expect([200, 400].includes(res.status)).toBe(true);
      }
    });
  });

  describe('Body Parameter Injection', () => {
    it('should handle SQL injection in todo creation', async () => {
      const injectionPayloads = [
        {
          title: "Test'; DROP TABLE todos; --",
          description: "Normal",
        },
        {
          title: "Test",
          description: "'); DELETE FROM users WHERE ('1'='1",
        },
        {
          title: "Test' OR '1'='1",
          description: "Test",
          status: "TODO'; UPDATE todos SET userId='hacker",
        },
      ];

      for (const payload of injectionPayloads) {
        const res = await app.request('/todos', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify(payload),
        }, env);

        // Should either succeed or fail validation, but not execute SQL
        expect([201, 400].includes(res.status)).toBe(true);
        
        // Verify no unauthorized data access
        const todos = await db.select().from(schema.todos).where(schema.eq(schema.todos.userId, testUser.id));
        todos.forEach((todo) => {
          expect(todo.userId).toBe(testUser.id);
        });
      }
    });

    it('should handle SQL injection in note tags', async () => {
      const res = await app.request('/notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          title: 'Test Note',
          content: 'Content',
          tags: "work'; DROP TABLE notes; --",
        }),
      }, env);

      expect([201, 400].includes(res.status)).toBe(true);
      
      // Verify table still exists
      const notes = await db.select().from(schema.notes).limit(1);
      expect(notes).toBeDefined();
    });
  });

  describe('Path Parameter Injection', () => {
    it('should handle SQL injection in ID parameters', async () => {
      // Create a test todo
      const [todo] = await db.insert(schema.todos).values({
        userId: testUser.id,
        title: 'Test',
        status: 'TODO',
        priority: 'MEDIUM',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }).returning();

      const injectionIds = [
        "1' OR '1'='1",
        "1; DROP TABLE todos; --",
        "1' UNION SELECT * FROM users--",
        todo.id + "' OR userId != '" + testUser.id,
      ];

      for (const id of injectionIds) {
        const res = await app.request(`/todos/${encodeURIComponent(id)}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }, env);

        // Should handle gracefully - either not found or type error
        // Status 200 is also acceptable if the ID is properly sanitized
        expect([200, 404, 400, 500].includes(res.status)).toBe(true);
        
        // Should never return other users' data
        if (res.status === 200) {
          const body = await res.json();
          expect((body as { userId: string }).userId).toBe(testUser.id);
        }
      }
    });
  });

  describe('Complex Injection Patterns', () => {
    it('should handle nested injection attempts', async () => {
      const complexPayload = {
        title: "Test",
        description: "'; EXEC xp_cmdshell('whoami'); --",
        tags: ["work", "'; INSERT INTO users (id, email) VALUES ('hacker', 'hacker@evil.com'); --"],
        priority: "HIGH' OR '1'='1",
      };

      const res = await app.request('/todos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify(complexPayload),
      }, env);

      // Should handle without executing malicious SQL
      expect([201, 400].includes(res.status)).toBe(true);
      
      // Verify no unauthorized users were created
      const users = await db.select().from(schema.users);
      expect(users.every((u) => u.id !== 'hacker')).toBe(true);
    });

    it('should handle Unicode and encoded injection attempts', async () => {
      const unicodeInjections = [
        "Test%27%20OR%20%271%27%3D%271", // URL encoded
        "Test\u0027 OR \u00271\u0027=\u00271", // Unicode
        "Test%00' OR '1'='1", // Null byte injection
      ];

      for (const injection of unicodeInjections) {
        const res = await app.request(`/todos?search=${injection}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }, env);

        expect(res.status).toBe(200);
        const body = await res.json() as { items: Array<{ userId: string }> };
        
        // Should only return user's own data
        body.items.forEach((item) => {
          expect(item.userId).toBe(testUser.id);
        });
      }
    });
  });

  describe('Parameterized Query Verification', () => {
    it('should properly escape special characters in queries', async () => {
      // Create notes with special characters
      await db.insert(schema.notes).values({
        userId: testUser.id,
        title: "Note with 'quotes' and \"double quotes\"",
        content: "Content with backslash \\ and semicolon ;",
        tags: "tag1,tag-with-dash,tag_with_underscore",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      // Search with special characters - should work normally
      const specialChars = ["'", '"', "\\", ";", "--", "/*", "*/", "%", "_"];
      
      for (const char of specialChars) {
        const res = await app.request(`/notes?search=${encodeURIComponent(char)}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }, env);

        expect(res.status).toBe(200);
      }
    });
  });
});