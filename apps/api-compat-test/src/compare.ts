#!/usr/bin/env node
import { runAllTests } from './index';

console.log('API Compatibility Test Runner');
console.log('=============================\n');

runAllTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});