import { chromium } from '@playwright/test';

async function waitForServer(url: string, maxAttempts = 30, delayMs = 2000): Promise<boolean> {
  console.log(`Waiting for server at ${url}...`);
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      if (response.ok || response.status < 500) {
        console.log(`Server is ready at ${url} (attempt ${attempt}/${maxAttempts})`);
        return true;
      }
    } catch (error) {
      // Server not ready yet, continue waiting
    }
    
    if (attempt < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  
  console.warn(`Server at ${url} did not become ready after ${maxAttempts} attempts`);
  return false;
}

async function globalSetup() {
  // Log CI environment if detected
  if (process.env.CI) {
    console.log('CI environment detected');
  }
  
  // Get the base URL from environment or use default
  const baseUrl = process.env.E2E_BASE_URL || 'http://localhost:3000';
  const backendUrl = process.env.BACKEND_URL || 'http://localhost:8787/health';
  
  // Skip setup if webserver is being skipped
  if (process.env.SKIP_WEBSERVER) {
    console.log('Skipping global setup - SKIP_WEBSERVER is set');
    return;
  }
  
  // Wait for servers to be ready
  const [frontendReady, backendReady] = await Promise.all([
    waitForServer(baseUrl),
    waitForServer(backendUrl)
  ]);
  
  if (!frontendReady || !backendReady) {
    console.error('One or more servers failed to start');
    // Don't throw in CI to avoid blocking the pipeline
    if (!process.env.CI) {
      throw new Error('Servers failed to start');
    }
  }
  
  // Optionally validate the application is working
  if (frontendReady) {
    const browser = await chromium.launch({
      headless: true,
      args: ['--disable-gpu', '--no-sandbox', '--disable-setuid-sandbox']
    });
    
    try {
      const context = await browser.newContext();
      const page = await context.newPage();
      
      // Set a shorter timeout for the initial check
      page.setDefaultTimeout(5000);
      
      try {
        await page.goto(baseUrl, { 
          waitUntil: 'domcontentloaded',
          timeout: 10000 
        });
        
        // Check if the page loaded successfully
        const title = await page.title();
        console.log(`Application loaded successfully. Page title: "${title}"`);
        
        // Close properly to avoid EPIPE errors
        await page.close();
        await context.close();
      } catch (error) {
        console.error('Failed to access application:', error);
        // Don't throw - just log the error
      }
    } finally {
      // Ensure browser is closed properly
      await browser.close();
    }
  }
  
  // Add a small delay to ensure everything is settled
  await new Promise(resolve => setTimeout(resolve, 1000));
}

export default globalSetup;