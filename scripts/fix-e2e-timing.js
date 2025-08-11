#!/usr/bin/env node

/**
 * Script to automatically detect and suggest fixes for timing issues in E2E tests
 * 
 * Usage:
 *   node scripts/fix-e2e-timing.js
 *   
 * This will analyze all .spec.ts and .test.ts files in the e2e directory
 * and output:
 * - A summary of timing issues found
 * - Specific line-by-line suggestions for improvements
 * - A JSON file with detailed fixes (e2e-timing-fixes.json)
 * 
 * Common issues detected:
 * - Fixed timeouts instead of condition-based waits
 * - Hardcoded timeout values that should be adaptive
 * - Direct element interactions without retry logic
 * - Navigation without proper wait conditions
 * 
 * Example output:
 *   📄 e2e/auth.spec.ts
 *     Line 42: Using fixed timeout instead of condition-based waiting
 *       Current: page.waitForTimeout(3000)
 *       Suggest: // TODO: Replace with condition-based wait
 *     Line 58: Direct interaction without retry logic
 *       Current: await page.click('#submit')
 *       Suggest: // Consider using clickWithRetry for better reliability
 */

const fs = require('fs');
const path = require('path');

// Patterns that indicate potential timing issues
const timingPatterns = [
  {
    pattern: /page\.waitForTimeout\((\d+)\)/g,
    issue: 'Using fixed timeout instead of condition-based waiting',
    fix: (match, timeout) => {
      const ms = parseInt(timeout);
      if (ms < 1000) return match; // Keep small delays
      return `// TODO: Replace with condition-based wait\n    ${match} // Consider using waitForSelector, waitForFunction, or waitForLoadState instead`;
    }
  },
  {
    pattern: /timeout:\s*(\d+)(?!\d)/g,
    issue: 'Hardcoded timeout value',
    fix: (match, timeout) => {
      const ms = parseInt(timeout);
      if (ms <= 5000) return match; // Keep reasonable timeouts
      return `timeout: getAdaptiveTimeout(${ms}, attemptNumber) // Adaptive timeout`;
    }
  },
  {
    pattern: /await page\.(click|fill|type)\(/g,
    issue: 'Direct interaction without retry logic',
    fix: (match) => {
      if (match.includes('click')) {
        return '// Consider using clickWithRetry for better reliability\n    ' + match;
      }
      if (match.includes('fill')) {
        return '// Consider using fillWithRetry for better reliability\n    ' + match;
      }
      return match;
    }
  },
  {
    pattern: /page\.goto\([^)]+\)(?!.*waitUntil)/g,
    issue: 'Navigation without explicit wait condition',
    fix: (match) => {
      return match.replace(')', ', { waitUntil: "networkidle" })');
    }
  },
  {
    pattern: /page\.waitForSelector\([^)]+\)(?!.*state)/g,
    issue: 'Selector wait without explicit state',
    fix: (match) => {
      return match.replace(')', ', { state: "visible" })');
    }
  }
];

// Files to check
function getTestFiles(dir) {
  const files = [];
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
      files.push(...getTestFiles(fullPath));
    } else if (item.endsWith('.spec.ts') || item.endsWith('.test.ts')) {
      files.push(fullPath);
    }
  }
  
  return files;
}

// Analyze a single file
function analyzeFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const issues = [];
  const lines = content.split('\n');
  
  for (const { pattern, issue, fix } of timingPatterns) {
    let match;
    const regex = new RegExp(pattern);
    
    while ((match = regex.exec(content)) !== null) {
      const lineNumber = content.substring(0, match.index).split('\n').length;
      const line = lines[lineNumber - 1];
      
      issues.push({
        file: filePath,
        line: lineNumber,
        issue,
        original: line.trim(),
        suggestion: fix ? fix(match[0], ...match.slice(1)) : null
      });
    }
  }
  
  return issues;
}

// Check for missing imports
function checkImports(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const suggestions = [];
  
  // Check if timing utilities are used but not imported
  if (content.includes('WithRetry') && !content.includes('retry-utils')) {
    suggestions.push({
      file: filePath,
      issue: 'Missing import for retry utilities',
      suggestion: "import { clickWithRetry, fillWithRetry } from './helpers/retry-utils';"
    });
  }
  
  if ((content.includes('getTimingConfig') || content.includes('getAdaptiveTimeout')) && 
      !content.includes('timing-config')) {
    suggestions.push({
      file: filePath,
      issue: 'Missing import for timing configuration',
      suggestion: "import { getTimingConfig, getAdaptiveTimeout } from './helpers/timing-config';"
    });
  }
  
  return suggestions;
}

// Main execution
function main() {
  console.log('🔍 Analyzing E2E tests for timing issues...\n');
  
  const testDir = path.join(process.cwd(), 'e2e');
  const testFiles = getTestFiles(testDir);
  
  let totalIssues = 0;
  const allIssues = [];
  
  for (const file of testFiles) {
    const issues = analyzeFile(file);
    const importIssues = checkImports(file);
    
    if (issues.length > 0 || importIssues.length > 0) {
      const relPath = path.relative(process.cwd(), file);
      console.log(`📄 ${relPath}`);
      
      for (const issue of issues) {
        console.log(`  Line ${issue.line}: ${issue.issue}`);
        if (issue.original) {
          console.log(`    Current: ${issue.original}`);
        }
        if (issue.suggestion) {
          console.log(`    Suggest: ${issue.suggestion}`);
        }
        totalIssues++;
      }
      
      for (const issue of importIssues) {
        console.log(`  ${issue.issue}`);
        if (issue.suggestion) {
          console.log(`    Add: ${issue.suggestion}`);
        }
        totalIssues++;
      }
      
      console.log('');
      allIssues.push(...issues, ...importIssues);
    }
  }
  
  // Summary
  console.log('📊 Summary:');
  console.log(`  Files analyzed: ${testFiles.length}`);
  console.log(`  Issues found: ${totalIssues}`);
  
  if (totalIssues > 0) {
    console.log('\n💡 Recommendations:');
    console.log('  1. Replace fixed timeouts with condition-based waits');
    console.log('  2. Use retry utilities for element interactions');
    console.log('  3. Configure adaptive timeouts for different environments');
    console.log('  4. Add proper wait conditions for navigation and selectors');
    
    // Generate fix suggestions file
    const fixFile = path.join(process.cwd(), 'e2e-timing-fixes.json');
    fs.writeFileSync(fixFile, JSON.stringify(allIssues, null, 2));
    console.log(`\n✅ Detailed fixes saved to: ${fixFile}`);
  } else {
    console.log('\n✅ No timing issues detected!');
  }
}

// Run the script
if (require.main === module) {
  main();
}