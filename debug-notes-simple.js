const { chromium } = require('playwright');

async function debugNotes() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // Login
    await page.goto('http://localhost:3000/login');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button[type="submit"]');
    
    // Wait for navigation
    await page.waitForTimeout(2000);
    
    const currentUrl = page.url();
    console.log('After login URL:', currentUrl);
    
    if (!currentUrl.includes('/login')) {
      console.log('Login successful!');
      
      // Navigate to notes
      await page.goto('http://localhost:3000/notes');
      await page.waitForTimeout(2000);
      
      const notesUrl = page.url();
      console.log('Notes page URL:', notesUrl);
      
      // Check for heading
      const heading = await page.locator('h1').textContent();
      console.log('Page heading:', heading);
      
      // Check if Notes heading exists
      const notesHeading = await page.getByRole('heading', { name: 'Notes' }).isVisible();
      console.log('Notes heading visible:', notesHeading);
      
      // Take screenshot
      await page.screenshot({ path: 'debug-notes-working.png' });
      console.log('Screenshot saved');
    } else {
      console.log('Still on login page after login attempt');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
}

debugNotes();