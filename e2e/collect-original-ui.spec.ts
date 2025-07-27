import { test, expect } from '@playwright/test';

test.describe('Collect Original UI Information', () => {
  test.beforeEach(async ({ page, context }) => {
    // Clear cookies and set locale
    await context.clearCookies();
    await context.addCookies([{ name: 'locale', value: 'en', domain: 'localhost', path: '/' }]);
  });

  test('collect login page UI information', async ({ page }) => {
    // Navigate to original frontend
    await page.goto('http://localhost:3001/login');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Take screenshot
    await page.screenshot({ 
      path: 'e2e/screenshots/original-login-page.png',
      fullPage: true 
    });
    
    // Extract styles and structure
    const loginPageInfo = await page.evaluate(() => {
      const container = document.querySelector('main') || document.querySelector('body');
      const form = document.querySelector('form');
      const heading = document.querySelector('h1, h2, h3');
      const inputs = Array.from(document.querySelectorAll('input'));
      const buttons = Array.from(document.querySelectorAll('button'));
      const links = Array.from(document.querySelectorAll('a'));
      
      return {
        containerClasses: container?.className || '',
        containerStyles: container ? window.getComputedStyle(container) : null,
        formClasses: form?.className || '',
        heading: {
          text: heading?.textContent || '',
          tagName: heading?.tagName || '',
          classes: heading?.className || ''
        },
        inputs: inputs.map(input => ({
          type: input.type,
          placeholder: input.placeholder,
          name: input.name,
          classes: input.className,
          parentClasses: input.parentElement?.className || ''
        })),
        buttons: buttons.map(button => ({
          text: button.textContent?.trim() || '',
          type: button.type,
          classes: button.className
        })),
        links: links.map(link => ({
          text: link.textContent?.trim() || '',
          href: link.getAttribute('href') || '',
          classes: link.className
        })),
        backgroundColor: window.getComputedStyle(document.body).backgroundColor,
        primaryColors: {
          background: window.getComputedStyle(document.body).backgroundColor,
          text: window.getComputedStyle(document.body).color
        }
      };
    });
    
    // Save extracted information
    await page.evaluate((info) => {
      console.log('Login Page UI Information:', JSON.stringify(info, null, 2));
    }, loginPageInfo);
    
    // Write to file for reference
    const fs = require('fs').promises;
    await fs.writeFile(
      'e2e/screenshots/original-login-page-info.json',
      JSON.stringify(loginPageInfo, null, 2)
    );
  });

  test('collect register page UI information', async ({ page }) => {
    // Navigate to original frontend register page
    await page.goto('http://localhost:3001/register');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Take screenshot
    await page.screenshot({ 
      path: 'e2e/screenshots/original-register-page.png',
      fullPage: true 
    });
    
    // Extract styles and structure
    const registerPageInfo = await page.evaluate(() => {
      const container = document.querySelector('main') || document.querySelector('body');
      const form = document.querySelector('form');
      const heading = document.querySelector('h1, h2, h3');
      const inputs = Array.from(document.querySelectorAll('input'));
      const buttons = Array.from(document.querySelectorAll('button'));
      const links = Array.from(document.querySelectorAll('a'));
      
      return {
        containerClasses: container?.className || '',
        formClasses: form?.className || '',
        heading: {
          text: heading?.textContent || '',
          tagName: heading?.tagName || '',
          classes: heading?.className || ''
        },
        inputs: inputs.map(input => ({
          type: input.type,
          placeholder: input.placeholder,
          name: input.name,
          classes: input.className,
          parentClasses: input.parentElement?.className || ''
        })),
        buttons: buttons.map(button => ({
          text: button.textContent?.trim() || '',
          type: button.type,
          classes: button.className
        })),
        links: links.map(link => ({
          text: link.textContent?.trim() || '',
          href: link.getAttribute('href') || '',
          classes: link.className
        }))
      };
    });
    
    // Save extracted information
    const fs = require('fs').promises;
    await fs.writeFile(
      'e2e/screenshots/original-register-page-info.json',
      JSON.stringify(registerPageInfo, null, 2)
    );
  });

  test('collect authenticated dashboard UI', async ({ page }) => {
    // First login to the original frontend
    await page.goto('http://localhost:3001/login');
    
    // Perform login (adjust credentials as needed)
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'Password123!');
    await page.click('button[type="submit"]');
    
    // Wait for redirect to dashboard
    await page.waitForURL('**/dashboard', { timeout: 10000 }).catch(() => {
      // If no /dashboard route, wait for navigation away from login
      return page.waitForURL((url) => !url.href.includes('/login'), { timeout: 10000 });
    });
    
    // Take screenshot of dashboard
    await page.screenshot({ 
      path: 'e2e/screenshots/original-dashboard.png',
      fullPage: true 
    });
    
    // Extract header and navigation structure
    const dashboardInfo = await page.evaluate(() => {
      const header = document.querySelector('header');
      const nav = document.querySelector('nav');
      const sidebar = document.querySelector('aside');
      
      return {
        header: {
          classes: header?.className || '',
          content: header?.textContent || '',
          structure: header?.innerHTML || ''
        },
        navigation: {
          classes: nav?.className || '',
          links: Array.from(nav?.querySelectorAll('a') || []).map(link => ({
            text: link.textContent?.trim() || '',
            href: link.getAttribute('href') || '',
            classes: link.className
          }))
        },
        sidebar: {
          exists: !!sidebar,
          classes: sidebar?.className || ''
        }
      };
    });
    
    // Save dashboard information
    const fs = require('fs').promises;
    await fs.writeFile(
      'e2e/screenshots/original-dashboard-info.json',
      JSON.stringify(dashboardInfo, null, 2)
    );
  });
});