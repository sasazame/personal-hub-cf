import { APITest, config } from '../config';
import { makeAPIRequest } from './api-client';
import { compareResponses, ComparisonResult } from './comparator';

export interface TestResult {
  testName: string;
  passed: boolean;
  comparison?: ComparisonResult;
  error?: string;
  executionTime: number;
  skipped?: boolean;
  skipReason?: string;
}

export async function runTest(test: APITest): Promise<TestResult> {
  const startTime = Date.now();

  if (test.skip) {
    return {
      testName: test.name,
      passed: true,
      skipped: true,
      skipReason: test.skipReason,
      executionTime: 0,
    };
  }

  try {
    // Add auth token if required
    const headers = { ...test.headers };
    if (test.requiresAuth && test.authToken) {
      headers['Authorization'] = `Bearer ${test.authToken}`;
    }

    // Make requests to both backends
    const [oldResponse, newResponse] = await Promise.all([
      makeAPIRequest(config.oldBackendUrl, test.method, test.endpoint, headers, test.body),
      makeAPIRequest(config.newBackendUrl, test.method, test.endpoint, headers, test.body),
    ]);

    // Compare responses
    const comparison = compareResponses(oldResponse, newResponse);

    // Run custom validation if provided
    if (test.validateResponse && comparison.match) {
      try {
        test.validateResponse(oldResponse, newResponse);
      } catch (error) {
        comparison.match = false;
        comparison.differences.push({
          path: 'custom-validation',
          type: 'value',
          oldValue: null,
          newValue: null,
          message: error instanceof Error ? error.message : 'Custom validation failed',
        });
      }
    }

    return {
      testName: test.name,
      passed: comparison.match,
      comparison,
      executionTime: Date.now() - startTime,
    };
  } catch (error) {
    return {
      testName: test.name,
      passed: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      executionTime: Date.now() - startTime,
    };
  }
}

export async function runTestSuite(tests: APITest[]): Promise<TestResult[]> {
  const results: TestResult[] = [];
  
  // Run tests sequentially to avoid rate limiting
  for (const test of tests) {
    if (config.verbose) {
      console.log(`Running test: ${test.name}`);
    }
    
    const result = await runTest(test);
    results.push(result);
    
    if (config.verbose && !result.passed) {
      console.log(`  ❌ Failed: ${result.error || result.comparison?.differences[0]?.message}`);
    } else if (config.verbose && result.passed) {
      console.log(`  ✅ Passed`);
    }
  }
  
  return results;
}

export function generateReport(results: TestResult[]): string {
  const total = results.length;
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed && !r.skipped).length;
  const skipped = results.filter(r => r.skipped).length;
  
  let report = `\n${'='.repeat(80)}\n`;
  report += `API COMPATIBILITY TEST REPORT\n`;
  report += `${'='.repeat(80)}\n\n`;
  
  report += `Total Tests: ${total}\n`;
  report += `✅ Passed: ${passed}\n`;
  report += `❌ Failed: ${failed}\n`;
  report += `⏩ Skipped: ${skipped}\n`;
  report += `Success Rate: ${((passed / (total - skipped)) * 100).toFixed(2)}%\n\n`;
  
  if (failed > 0) {
    report += `FAILED TESTS:\n`;
    report += `${'-'.repeat(80)}\n`;
    
    for (const result of results.filter(r => !r.passed && !r.skipped)) {
      report += `\n❌ ${result.testName}\n`;
      
      if (result.error) {
        report += `   Error: ${result.error}\n`;
      } else if (result.comparison) {
        for (const diff of result.comparison.differences) {
          report += `   - ${diff.message}\n`;
          if (config.verbose) {
            report += `     Old: ${JSON.stringify(diff.oldValue)}\n`;
            report += `     New: ${JSON.stringify(diff.newValue)}\n`;
          }
        }
      }
    }
  }
  
  if (skipped > 0) {
    report += `\nSKIPPED TESTS:\n`;
    report += `${'-'.repeat(80)}\n`;
    
    for (const result of results.filter(r => r.skipped)) {
      report += `⏩ ${result.testName}: ${result.skipReason}\n`;
    }
  }
  
  report += `\n${'='.repeat(80)}\n`;
  
  return report;
}