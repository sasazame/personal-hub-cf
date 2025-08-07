import { Page, APIRequestContext, test as base } from '@playwright/test';

/**
 * Test optimization utilities for better E2E performance
 */

// Cache for authenticated sessions to avoid repeated logins
interface CachedSession {
  cookies: any[];
  localStorage: any;
  timestamp: number;
}

const sessionCache = new Map<string, CachedSession>();
const SESSION_TTL = 30 * 60 * 1000; // 30 minutes

function isSessionValid(session: CachedSession): boolean {
  return Date.now() - session.timestamp < SESSION_TTL;
}

export interface OptimizedFixtures {
  authenticatedPage: Page;
  apiContext: APIRequestContext;
  testUser: {
    username: string;
    email: string;
    password: string;
  };
}

/**
 * Optimized test fixture that provides pre-authenticated pages
 */
export const test = base.extend<OptimizedFixtures>({
  testUser: async ({}, use) => {
    // Generate unique test user data
    const timestamp = Date.now().toString().slice(-10);
    const testUser = {
      username: `user${timestamp}`,
      email: `user${timestamp}@test.com`,
      password: 'Test123456!',
    };
    await use(testUser);
  },

  apiContext: async ({ playwright }, use) => {
    // Create API context for direct API calls (faster than UI)
    const apiContext = await playwright.request.newContext({
      baseURL: process.env.VITE_API_BASE_URL || 'http://localhost:8787',
      extraHTTPHeaders: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });
    await use(apiContext);
    await apiContext.dispose();
  },

  authenticatedPage: async ({ page, apiContext, testUser }, use) => {
    const cacheKey = `${testUser.email}`;
    
    // Check if we have cached session
    if (sessionCache.has(cacheKey)) {
      const cached = sessionCache.get(cacheKey)!;
      if (isSessionValid(cached)) {
        await page.context().addCookies(cached.cookies);
        await page.goto('/dashboard');
        await use(page);
        return;
      } else {
        // Session expired, remove from cache
        sessionCache.delete(cacheKey);
      }
    }

    // Register via API (faster than UI)
    const registerResponse = await apiContext.post('/api/v1/auth/register', {
      data: {
        username: testUser.username,
        email: testUser.email,
        password: testUser.password,
      },
    });

    if (registerResponse.ok()) {
      // Navigate to dashboard first to establish session
      await page.goto('/dashboard');
      
      // Now get cookies and localStorage after navigation
      const cookies = await page.context().cookies();
      
      // Cache the session with timestamp
      sessionCache.set(cacheKey, {
        cookies,
        localStorage: await page.evaluate(() => {
          const items: any = {};
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key) items[key] = localStorage.getItem(key);
          }
          return items;
        }),
        timestamp: Date.now(),
      });

      await use(page);
    } else {
      // Fallback to UI registration if API fails
      await page.goto('/register');
      await page.fill('input[name="username"]', testUser.username);
      await page.fill('input[name="email"]', testUser.email);
      await page.fill('input[name="password"]', testUser.password);
      await page.fill('input[name="confirmPassword"]', testUser.password);
      await page.click('button[type="submit"]');
      await page.waitForURL('**/dashboard', { timeout: 10000 });
      await use(page);
    }
  },
});

/**
 * Batch API operations for faster test data setup
 */
export class TestDataHelper {
  constructor(private apiContext: APIRequestContext) {}

  async createMultipleTodos(count: number) {
    const timestamp = Date.now();
    const todos = [];
    for (let i = 0; i < count; i++) {
      todos.push({
        title: `Test Todo ${i}-${timestamp}`,
        description: `Description ${i}-${timestamp}`,
        priority: 'MEDIUM',
      });
    }

    // Create all todos in parallel with error handling
    const promises = todos.map(async todo => {
      const response = await this.apiContext.post('/api/v1/todos', { data: todo });
      if (!response.ok()) {
        throw new Error(`Failed to create todo: ${response.status()}`);
      }
      return response;
    });
    
    return Promise.all(promises);
  }

  async createMultipleNotes(count: number) {
    const timestamp = Date.now();
    const notes = [];
    for (let i = 0; i < count; i++) {
      notes.push({
        title: `Test Note ${i}-${timestamp}`,
        content: `Content ${i}-${timestamp}`,
      });
    }

    // Create all notes in parallel with error handling
    const promises = notes.map(async note => {
      const response = await this.apiContext.post('/api/v1/notes', { data: note });
      if (!response.ok()) {
        throw new Error(`Failed to create note: ${response.status()}`);
      }
      return response;
    });
    
    return Promise.all(promises);
  }

  async cleanupTestData(userId: string) {
    // Clean up test data in parallel with error logging
    await Promise.all([
      this.apiContext.delete(`/api/v1/todos/user/${userId}`)
        .catch(err => console.error('Cleanup todos failed:', err)),
      this.apiContext.delete(`/api/v1/notes/user/${userId}`)
        .catch(err => console.error('Cleanup notes failed:', err)),
      this.apiContext.delete(`/api/v1/goals/user/${userId}`)
        .catch(err => console.error('Cleanup goals failed:', err)),
    ]);
  }
}

/**
 * Performance monitoring helper
 */
export class PerformanceMonitor {
  private marks = new Map<string, number>();

  mark(name: string) {
    this.marks.set(name, Date.now());
  }

  measure(name: string, startMark: string, endMark?: string) {
    const start = this.marks.get(startMark);
    const end = endMark ? this.marks.get(endMark) : Date.now();
    
    if (start && end) {
      const duration = end - start;
      console.log(`[PERF] ${name}: ${duration}ms`);
      return duration;
    }
    return 0;
  }

  async measureAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const start = Date.now();
    try {
      const result = await fn();
      console.log(`[PERF] ${name}: ${Date.now() - start}ms`);
      return result;
    } catch (error) {
      console.log(`[PERF] ${name} (failed): ${Date.now() - start}ms`);
      throw error;
    }
  }
}

/**
 * Parallel test execution helper
 */
export async function runInParallel<T>(
  tasks: (() => Promise<T>)[],
  maxConcurrency = 4
): Promise<T[]> {
  const results: T[] = [];
  const executing: Promise<void>[] = [];
  
  for (const task of tasks) {
    const promise = task().then(result => {
      results.push(result);
    });
    
    executing.push(promise);
    
    if (executing.length >= maxConcurrency) {
      await Promise.race(executing);
      executing.splice(executing.findIndex(p => p), 1);
    }
  }
  
  await Promise.all(executing);
  return results;
}

export { expect } from '@playwright/test';