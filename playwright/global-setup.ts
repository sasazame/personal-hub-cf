import { chromium } from '@playwright/test';

async function globalSetup() {
  // Log CI environment if detected
  if (process.env.CI) {
    console.log('CI environment detected');
  }
  
  // Get the base URL from environment or use default
  const baseUrl = process.env.E2E_BASE_URL || 'http://localhost:3000';
  
  // Optionally, start a browser to ensure everything is working
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    await page.goto(baseUrl, { timeout: 10000 });
    console.log(`Application is accessible at ${baseUrl}`);
  } catch (error) {
    console.error('Failed to access application:', error);
    // Don't throw - just log the error
  } finally {
    await browser.close();
  }
}

export default globalSetup;