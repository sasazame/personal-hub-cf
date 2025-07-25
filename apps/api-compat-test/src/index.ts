import { runTestSuite, generateReport } from './utils/test-runner';
import { authTests } from './tests/auth.test';
import { config } from './config';

async function runAllTests() {
  console.log('🚀 Starting API Compatibility Tests');
  console.log(`Old Backend: ${config.oldBackendUrl}`);
  console.log(`New Backend: ${config.newBackendUrl}`);
  console.log('');

  const allTests = [
    ...authTests,
    // Additional test suites will be added here
  ];

  const results = await runTestSuite(allTests);
  const report = generateReport(results);
  
  console.log(report);
  
  // Exit with appropriate code
  const failedCount = results.filter(r => !r.passed && !r.skipped).length;
  process.exit(failedCount > 0 ? 1 : 0);
}

// Run tests if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { runAllTests, authTests };