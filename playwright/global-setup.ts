import { chromium } from '@playwright/test';

async function waitForServer(url: string, maxAttempts = 60, delayMs = 1000): Promise<boolean> {
  console.log(`Waiting for server at ${url}...`);
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await fetch(url, { 
        method: 'HEAD',
        signal: AbortSignal.timeout(5000) // 5 second timeout per request
      });
      if (response.ok || response.status < 500) {
        console.log(`Server is ready at ${url} (attempt ${attempt}/${maxAttempts})`);
        return true;
      }
    } catch {
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
    console.error(`Frontend ready: ${frontendReady}, Backend ready: ${backendReady}`);
    // Always throw to prevent running tests against non-existent servers
    throw new Error('Servers failed to start - check if ports 3000 and 8787 are available');
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
        
        // Verify we can navigate to login page
        await page.goto(`${baseUrl}/login`, { 
          waitUntil: 'domcontentloaded',
          timeout: 10000 
        });
        
        // Check for critical elements
        const hasForm = await page.locator('form').count() > 0;
        if (!hasForm) {
          console.warn('Warning: No form element found on login page');
        }
        
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
  
  // Add a delay to ensure everything is settled and React is hydrated
  await new Promise(resolve => setTimeout(resolve, 2000));
  console.log('Global setup completed successfully');
}

export default globalSetup;