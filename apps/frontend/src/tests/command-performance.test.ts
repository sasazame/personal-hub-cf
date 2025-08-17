import { describe, test, expect, beforeEach } from 'vitest';
import { commandRegistry } from '../lib/command-registry';
import { Command } from '../types/command-palette';

// Performance test for command registry
describe('Command Registry Performance', () => {
  const generateCommands = (count: number): Command[] => {
    return Array.from({ length: count }, (_, i) => ({
      id: `cmd-${i}`,
      title: `Command ${i}`,
      description: `Description for command ${i}`,
      category: 'navigation' as const,
      keywords: [`keyword${i}`, `test${i}`, `command${i}`],
      action: () => console.log(`Command ${i} executed`),
    }));
  };

  beforeEach(() => {
    commandRegistry.clear();
  });

  test('should handle 100 commands efficiently', () => {
    const commands = generateCommands(100);
    
    // Test registration performance
    const registerStart = performance.now();
    commands.forEach(cmd => commandRegistry.register(cmd));
    const registerTime = performance.now() - registerStart;
    
    console.log(`Registration time for 100 commands: ${registerTime.toFixed(2)}ms`);
    expect(registerTime).toBeLessThan(50); // Should register 100 commands in under 50ms
  });

  test('should search through 100 commands quickly', () => {
    const commands = generateCommands(100);
    commands.forEach(cmd => commandRegistry.register(cmd));
    
    // Test search performance
    const searchQueries = ['command', 'Command 5', 'keyword99', 'test42', 'nonexistent'];
    
    searchQueries.forEach(query => {
      const searchStart = performance.now();
      const results = commandRegistry.searchCommands(query);
      const searchTime = performance.now() - searchStart;
      
      console.log(`Search "${query}": ${results.length} results in ${searchTime.toFixed(2)}ms`);
      expect(searchTime).toBeLessThan(5); // Each search should complete in under 5ms
    });
  });

  test('should utilize cache for repeated searches', () => {
    const commands = generateCommands(100);
    commands.forEach(cmd => commandRegistry.register(cmd));
    
    const query = 'command';
    
    // First search (uncached)
    const firstStart = performance.now();
    const firstResults = commandRegistry.searchCommands(query);
    const firstTime = performance.now() - firstStart;
    
    // Second search (cached)
    const secondStart = performance.now();
    const secondResults = commandRegistry.searchCommands(query);
    const secondTime = performance.now() - secondStart;
    
    console.log(`First search: ${firstTime.toFixed(2)}ms`);
    console.log(`Cached search: ${secondTime.toFixed(2)}ms`);
    
    expect(secondResults).toEqual(firstResults);
    expect(secondTime).toBeLessThan(firstTime); // Cached should be faster
    expect(secondTime).toBeLessThan(0.5); // Cached should be nearly instant
  });

  test('should handle 1000 commands for stress testing', () => {
    const commands = generateCommands(1000);
    
    const registerStart = performance.now();
    commands.forEach(cmd => commandRegistry.register(cmd));
    const registerTime = performance.now() - registerStart;
    
    console.log(`Registration time for 1000 commands: ${registerTime.toFixed(2)}ms`);
    expect(registerTime).toBeLessThan(500); // Should handle 1000 commands in under 500ms (includes validation)
    
    // Search performance with 1000 commands
    const searchStart = performance.now();
    const results = commandRegistry.searchCommands('Command 500');
    const searchTime = performance.now() - searchStart;
    
    console.log(`Search in 1000 commands: ${searchTime.toFixed(2)}ms`);
    expect(searchTime).toBeLessThan(50); // Should search 1000 commands in under 50ms (adjusted for validation)
    expect(results.length).toBeGreaterThan(0);
  });

  test('should efficiently handle getAvailableCommands with caching', () => {
    const commands = generateCommands(100);
    commands.forEach(cmd => commandRegistry.register(cmd));
    
    // First call (uncached)
    const firstStart = performance.now();
    const firstResults = commandRegistry.getAvailableCommands();
    const firstTime = performance.now() - firstStart;
    
    // Second call (cached)
    const secondStart = performance.now();
    const secondResults = commandRegistry.getAvailableCommands();
    const secondTime = performance.now() - secondStart;
    
    console.log(`First getAvailableCommands: ${firstTime.toFixed(2)}ms`);
    console.log(`Cached getAvailableCommands: ${secondTime.toFixed(2)}ms`);
    
    expect(secondResults).toEqual(firstResults);
    expect(secondTime).toBeLessThan(0.1); // Cached should be nearly instant
  });
});