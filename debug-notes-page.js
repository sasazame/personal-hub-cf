const { chromium } = require('playwright');

async function debugNotesPage() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // Set English locale
    await context.addCookies([{ name: 'locale', value: 'en', domain: 'localhost', path: '/' }]);
    
    // Login
    await page.goto('http://localhost:3000/login');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button[type="submit"]');
    
    // Wait for redirect
    await page.waitForURL((url) => !url.href.includes('/login'), { timeout: 10000 });
    console.log('Logged in successfully');
    
    // Navigate to notes
    await page.goto('http://localhost:3000/notes');
    await page.waitForTimeout(2000);
    
    // Take screenshot
    await page.screenshot({ path: 'debug-notes-page.png' });
    console.log('Screenshot saved as debug-notes-page.png');
    
    // Check page content
    const title = await page.title();
    console.log('Page title:', title);
    
    const url = page.url();
    console.log('Current URL:', url);
    
    // Check for heading
    const headings = await page.locator('h1').allTextContents();
    console.log('H1 headings:', headings);
    
    // Check page content
    const bodyText = await page.locator('body').textContent();
    console.log('Page contains "Notes"?', bodyText.includes('Notes'));
    
    // Check for auth redirect
    if (url.includes('/login')) {
      console.log('Redirected to login - authentication might have failed');
    }
    
    // Keep browser open for inspection
    console.log('Browser will stay open for 30 seconds for inspection...');
    await page.waitForTimeout(30000);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
}

debugNotesPage();