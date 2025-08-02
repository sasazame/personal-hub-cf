// Global type declarations for test environment
declare global {
  interface String {
    toWellFormed(): string;
  }
}

// This is needed to make the file a module
export {};