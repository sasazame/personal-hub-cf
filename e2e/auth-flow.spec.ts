import { test, expect } from './fixtures/base-test';
import { login, logout, ensureLoggedOut, registerNewUser, isAuthenticated } from './helpers/auth';
import { createUniqueTestUser, waitForApp } from './helpers/setup';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await ensureLoggedOut(page);
    await waitForApp(page);
  });

  test('should display login form', async ({ page }) => {
    await page.goto('/login');
    
    // Check for login form elements
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toHaveText(/log\s*in/i);
  });

  test('should display register form', async ({ page }) => {
    await page.goto('/register');
    
    // Check for register form elements
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('input[name="username"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toHaveText(/register/i);
  });

  test('should navigate between login and register', async ({ page }) => {
    await page.goto('/login');
    
    // Click on register link
    await page.click('text=Don\'t have an account');
    await expect(page).toHaveURL('/register');
    
    // Click on login link
    await page.click('text=Already have an account');
    await expect(page).toHaveURL('/login');
  });

  test('should show validation errors for invalid login', async ({ page }) => {
    await page.goto('/login');
    
    // Submit empty form
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Email is required')).toBeVisible();
    
    // Submit with invalid email
    await page.fill('input[name="email"]', 'invalid-email');
    await page.fill('input[name="password"]', 'short');
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Invalid email')).toBeVisible();
  });

  test('should register a new user', async ({ page }) => {
    const newUser = createUniqueTestUser();
    await registerNewUser(page, newUser.email, newUser.password, newUser.username);
    
    // Should be redirected to dashboard
    await expect(page).toHaveURL('/');
    
    // Should see logout button
    await expect(page.locator('button:has-text("Logout")')).toBeVisible();
    
    // Verify we're authenticated
    const authenticated = await isAuthenticated(page);
    expect(authenticated).toBe(true);
  });

  test('should login with valid credentials', async ({ page }) => {
    // First register a user
    const user = createUniqueTestUser();
    await registerNewUser(page, user.email, user.password, user.username);
    
    // Logout
    await logout(page);
    
    // Login again
    await login(page, user.email, user.password);
    
    // Should be redirected to dashboard
    await expect(page).toHaveURL('/');
    
    // Verify we're authenticated
    const authenticated = await isAuthenticated(page);
    expect(authenticated).toBe(true);
  });

  test('should logout successfully', async ({ page }) => {
    // First register and login
    const user = createUniqueTestUser();
    await registerNewUser(page, user.email, user.password, user.username);
    
    // Verify we're logged in
    let authenticated = await isAuthenticated(page);
    expect(authenticated).toBe(true);
    
    // Logout
    await logout(page);
    
    // Should be redirected to login
    await expect(page).toHaveURL('/login');
    
    // Verify we're logged out
    authenticated = await isAuthenticated(page);
    expect(authenticated).toBe(false);
  });

  test('should persist session across page reloads', async ({ page }) => {
    // Register and login
    const user = createUniqueTestUser();
    await registerNewUser(page, user.email, user.password, user.username);
    
    // Reload the page
    await page.reload();
    await waitForApp(page);
    
    // Should still be authenticated
    await expect(page).toHaveURL('/');
    const authenticated = await isAuthenticated(page);
    expect(authenticated).toBe(true);
  });

  test('should redirect to login when accessing protected route while logged out', async ({ page }) => {
    await ensureLoggedOut(page);
    
    // Try to access dashboard
    await page.goto('/');
    
    // Should be redirected to login
    await expect(page).toHaveURL('/login');
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login');
    
    // Try to login with invalid credentials
    await page.fill('input[name="email"]', 'nonexistent@example.com');
    await page.fill('input[name="password"]', 'WrongPassword123!');
    await page.click('button[type="submit"]');
    
    // Should see error message
    await expect(page.locator('text=Invalid email or password')).toBeVisible();
    
    // Should still be on login page
    await expect(page).toHaveURL('/login');
  });
});