/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-require-imports */
// @ts-nocheck
import { webcrypto } from 'crypto';
import { TextEncoder as NodeTextEncoder, TextDecoder as NodeTextDecoder } from 'util';

// Polyfill crypto for Node.js environment
if (typeof globalThis.crypto === 'undefined') {
  (globalThis as any).crypto = webcrypto;
}

// Polyfill SubtleCrypto
if (typeof globalThis.SubtleCrypto === 'undefined') {
  (globalThis as any).SubtleCrypto = webcrypto.subtle.constructor;
}

// Mock TextEncoder/TextDecoder if not available
if (typeof globalThis.TextEncoder === 'undefined') {
  (globalThis as any).TextEncoder = NodeTextEncoder;
}

if (typeof globalThis.TextDecoder === 'undefined') {
  (globalThis as any).TextDecoder = NodeTextDecoder;
}

// Mock File API for Miniflare
if (typeof globalThis.File === 'undefined') {
  class MockFile {
    name: string;
    lastModified: number;
    size: number;
    type: string;
    
    constructor(bits: any[], name: string, options?: any) {
      this.name = name;
      this.lastModified = options?.lastModified || Date.now();
      this.size = 0; // Simplified
      this.type = options?.type || '';
    }
    
    slice() {
      return {} as any; // Mock Blob
    }
    
    stream() {
      return {} as any; // Mock ReadableStream
    }
    
    text() {
      return Promise.resolve('');
    }
    
    arrayBuffer() {
      return Promise.resolve(new ArrayBuffer(0));
    }
  }
  
  (globalThis as any).File = MockFile;
}

// Mock FormData if not available
if (typeof globalThis.FormData === 'undefined') {
  class MockFormData {
    private data: Map<string, any> = new Map();
    
    append(name: string, value: any): void {
      this.data.set(name, value);
    }
    
    get(name: string): any {
      return this.data.get(name);
    }
    
    has(name: string): boolean {
      return this.data.has(name);
    }
    
    delete(name: string): void {
      this.data.delete(name);
    }
    
    *entries(): IterableIterator<[string, any]> {
      yield* this.data.entries();
    }
  }
  
  (globalThis as any).FormData = MockFormData;
}

// Polyfill String.prototype.toWellFormed for older Node.js versions
// This method was added in ES2024 and requires Node.js 21+
if (typeof String.prototype.toWellFormed !== 'function') {
  Object.defineProperty(String.prototype, 'toWellFormed', {
    value: function() {
      // This is a simplified polyfill
      // The real implementation should handle unpaired surrogates
      // For tests, we just return the string as-is
      return String(this);
    },
    writable: true,
    configurable: true
  });
}

// Add CryptoKey polyfill
if (typeof globalThis.CryptoKey === 'undefined' && webcrypto.CryptoKey) {
  (globalThis as any).CryptoKey = webcrypto.CryptoKey;
}