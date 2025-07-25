// Worker globals
/* eslint-disable no-undef */
declare global {
  const console: Console;
  const crypto: Crypto;
  const TextEncoder: typeof globalThis.TextEncoder;
  const URL: typeof globalThis.URL;
}

export {};