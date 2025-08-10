async function globalTeardown() {
  console.log('Running global teardown...');
  
  // Add a small delay to ensure all test reporters have finished writing
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Clean up any lingering resources
  if (process.env.CI) {
    console.log('CI environment: Ensuring clean shutdown');
    // Give CI environment extra time to clean up
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  console.log('Global teardown complete');
}

export default globalTeardown;