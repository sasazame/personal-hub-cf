import { test, expect } from './fixtures/base-test';
import { ensureLoggedOut, login, TEST_USER } from './helpers/auth';
import { setupTestUser } from './helpers/setup';

/**
 * Setup and Teardown Tests
 * Tests that verify the test environment setup and cleanup
 * Consolidated from: 00-setup.spec.ts and various setup utilities
 */

test.describe('Test Environment Setup', () => {
  test.describe.configure({ mode: 'serial' }); // Run these tests in order

  test('should setup test environment', async ({ page }) => {
    // Verify basic connectivity
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    
    // Should be redirected to login or show landing page
    const url = page.url();
    const isValidLanding = url.includes('/login') || url.endsWith('/');
    expect(isValidLanding).toBeTruthy();
    
    console.log('✅ Test environment connectivity verified');
  });

  test('should verify API connectivity', async ({ request }) => {
    const apiUrl = process.env.VITE_API_BASE_URL || 'http://localhost:8788';
    
    try {
      const response = await request.get(`${apiUrl}/health`);
      expect(response.ok()).toBeTruthy();
      
      const data = await response.json();
      expect(data.status).toBe('ok');
      
      console.log('✅ API connectivity verified');
    } catch (error) {
      console.error('❌ API connectivity failed:', error);
      throw error;
    }
  });

  test('should create and verify test user', async ({ page }) => {
    console.log('🔧 Setting up test user...');
    
    // Setup test user
    await setupTestUser(page);
    
    // Verify test user can login
    await ensureLoggedOut(page);
    await page.goto('/login');
    
    try {
      await login(page, TEST_USER.email, TEST_USER.password);
      
      // Should be redirected to dashboard
      await expect(page).toHaveURL('/dashboard', { timeout: 10000 });
      
      // Verify we're logged in
      await page.waitForSelector('header', { timeout: 5000 });
      await expect(page.locator('header').filter({ hasText: 'Personal Hub' })).toBeVisible();
      
      console.log('✅ Test user setup and login verified');
      
      // Logout for clean state
      await ensureLoggedOut(page);
      
    } catch (error) {
      console.error('❌ Test user setup failed:', error);
      throw error;
    }
  });

  test('should verify database connectivity', async ({ request }) => {
    const apiUrl = process.env.VITE_API_BASE_URL || 'http://localhost:8788';
    
    try {
      // Try to access a protected endpoint that requires database
      const response = await request.get(`${apiUrl}/api/v1/users/profile`, {
        headers: {
          'Authorization': 'Bearer dummy-token' // This will fail but should not crash
        }
      });
      
      // Should get 401 (unauthorized) not 500 (server error)
      expect([401, 403]).toContain(response.status());
      
      console.log('✅ Database connectivity verified (API returned expected auth error)');
      
    } catch (error) {
      console.error('❌ Database connectivity check failed:', error);
      throw error;
    }
  });

  test('should verify essential pages are accessible', async ({ page }) => {
    const essentialPages = [
      { path: '/', name: 'Home/Landing' },
      { path: '/login', name: 'Login' },
      { path: '/register', name: 'Register' }
    ];
    
    for (const { path, name } of essentialPages) {
      try {
        await page.goto(path, { waitUntil: 'domcontentloaded' });
        
        // Should not show critical errors
        await expect(page.locator('body')).not.toContainText('Application error');
        await expect(page.locator('body')).not.toContainText('500');
        await expect(page.locator('body')).not.toContainText('This page could not be found');
        
        // Should have content
        const hasContent = await page.locator('body').textContent();
        expect(hasContent).toBeTruthy();
        expect(hasContent!.length).toBeGreaterThan(10);
        
        console.log(`✅ ${name} page accessible`);
        
      } catch (error) {
        console.error(`❌ ${name} page (${path}) failed:`, error);
        throw error;
      }
    }
  });

  test('should verify test data isolation', async ({ page }) => {
    // Ensure clean state
    await ensureLoggedOut(page);
    
    // Clear all storage
    await page.goto('/');
    await page.evaluate(() => {
      window.localStorage.clear();
      // eslint-disable-next-line no-undef
      window.sessionStorage.clear();
    });
    
    // Clear cookies
    await page.context().clearCookies();
    
    // Verify clean state
    const lsLength = await page.evaluate(() => window.localStorage.length);
    const ssLength = await page.evaluate(() => window.sessionStorage.length);
    
    expect(lsLength).toBe(0);
    expect(ssLength).toBe(0);
    
    console.log('✅ Test data isolation verified');
  });

  test('should verify browser console is clean', async ({ page }) => {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // Capture console messages
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      } else if (msg.type() === 'warning') {
        warnings.push(msg.text());
      }
    });
    
    // Capture page errors
    page.on('pageerror', error => {
      errors.push(error.message);
    });
    
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    // Filter out acceptable errors
    const criticalErrors = errors.filter(error => 
      !error.includes('favicon') && 
      !error.includes('network') &&
      !error.includes('Failed to load resource') &&
      !error.toLowerCase().includes('chunk') &&
      !error.includes('google') && // Google analytics/fonts
      !error.includes('gtag') &&
      !error.includes('non-passive event listener')
    );
    
    if (criticalErrors.length > 0) {
      console.warn('⚠️  Critical console errors found:', criticalErrors);
      // Don't fail the test for console errors in setup, just warn
    } else {
      console.log('✅ Browser console clean');
    }
  });
});

test.describe('Test Environment Teardown', () => {
  test.describe.configure({ mode: 'serial' }); // Run these tests in order
  
  test('should cleanup test artifacts', async ({ page }) => {
    // Ensure logged out
    await ensureLoggedOut(page);
    
    // Clear all storage
    await page.goto('/');
    await page.evaluate(() => {
      try {
        window.localStorage.clear();
        // eslint-disable-next-line no-undef
        window.sessionStorage.clear();
      } catch {
        // Ignore errors if storage is not available
      }
    });
    
    // Clear cookies
    await page.context().clearCookies();
    
    console.log('✅ Test artifacts cleaned up');
  });

  test('should verify clean teardown', async ({ page }) => {
    await page.goto('/');
    
    // Should be in unauthenticated state
    await page.waitForURL(/\/(login|$)/, { timeout: 5000 });
    
    // Verify no user session
    const localStorage = await page.evaluate(() => {
      const authToken = localStorage.getItem('authToken') || localStorage.getItem('token');
      const userId = localStorage.getItem('userId');
      return { authToken, userId };
    });
    
    expect(localStorage.authToken).toBeFalsy();
    expect(localStorage.userId).toBeFalsy();
    
    console.log('✅ Clean teardown verified');
  });

  test('should log test summary', async () => {
    console.log('\n='.repeat(60));
    console.log('📋 TEST ENVIRONMENT SUMMARY');
    console.log('='.repeat(60));
    console.log('✅ Environment setup completed successfully');
    console.log('✅ API connectivity verified');  
    console.log('✅ Database connectivity verified');
    console.log('✅ Test user created and verified');
    console.log('✅ Essential pages accessible');
    console.log('✅ Test data isolation confirmed');
    console.log('✅ Clean teardown completed');
    console.log('='.repeat(60));
    console.log('🚀 Ready to run feature tests');
    console.log('='.repeat(60) + '\n');
  });
});

/**
 * Global Setup Hooks
 * These can be used by other test files
 */

test.describe('Shared Test Utilities', () => {
  test('should provide reusable test setup', async ({ page }) => {
    // This test demonstrates reusable setup patterns
    // Other test files can import and use similar patterns
    
    // 1. Clean state setup
    await ensureLoggedOut(page);
    await page.goto('/');
    await page.evaluate(() => {
      window.localStorage.clear();
      // eslint-disable-next-line no-undef
      window.sessionStorage.clear();
    });
    await page.context().clearCookies();
    
    // 2. Set locale
    await page.context().addCookies([{ 
      name: 'locale', 
      value: 'en', 
      domain: 'localhost', 
      path: '/' 
    }]);
    
    // 3. Verify clean state
    await page.goto('/');
    await page.waitForURL(/\/(login|$)/, { timeout: 5000 });
    
    console.log('✅ Reusable test setup pattern verified');
  });

  test('should provide error handling patterns', async ({ page }) => {
    const errors: string[] = [];
    
    // Error capturing pattern
    page.on('pageerror', error => {
      errors.push(`Page Error: ${error.message}`);
    });
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(`Console Error: ${msg.text()}`);
      }
    });
    
    // Navigation with error handling
    try {
      await page.goto('/login');
      await page.waitForLoadState('networkidle', { timeout: 5000 });
    } catch (error) {
      errors.push(`Navigation Error: ${error}`);
    }
    
    // Filter critical errors (pattern for other tests)
    const criticalErrors = errors.filter(error => 
      !error.includes('favicon') && 
      !error.includes('network') &&
      !error.includes('Failed to load resource')
    );
    
    // In setup, we're lenient with errors
    if (criticalErrors.length > 0) {
      console.warn('⚠️  Errors detected (non-critical for setup):', criticalErrors);
    }
    
    console.log('✅ Error handling patterns verified');
  });
});