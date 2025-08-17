import js from '@eslint/js';
import typescript from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';
import prettier from 'eslint-config-prettier';

export default [
  js.configs.recommended,
  {
    files: ['**/*.ts', '**/*.tsx'],
    plugins: {
      '@typescript-eslint': typescript,
    },
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
      globals: {
        // Browser globals
        window: 'readonly',
        document: 'readonly',
        console: 'readonly',
        localStorage: 'readonly',
        sessionStorage: 'readonly',
        fetch: 'readonly',
        FormData: 'readonly',
        File: 'readonly',
        URLSearchParams: 'readonly',
        HTMLElement: 'readonly',
        HTMLDivElement: 'readonly',
        HTMLInputElement: 'readonly',
        HTMLTextAreaElement: 'readonly',
        HTMLAudioElement: 'readonly',
        HTMLButtonElement: 'readonly',
        HTMLSelectElement: 'readonly',
        Audio: 'readonly',
        MouseEvent: 'readonly',
        Node: 'readonly',
        IntersectionObserver: 'readonly',
        HeadersInit: 'readonly',
        KeyboardEvent: 'readonly',
        alert: 'readonly',
        confirm: 'readonly',
        setTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        clearTimeout: 'readonly',
        performance: 'readonly',
        StorageEvent: 'readonly',
        // Node globals
        __dirname: 'readonly',
        process: 'readonly',
        NodeJS: 'readonly',
        Buffer: 'readonly',
        atob: 'readonly',
        btoa: 'readonly',
        // React
        React: 'readonly',
        // Cloudflare Workers globals
        crypto: 'readonly',
        TextEncoder: 'readonly',
        Response: 'readonly',
        Request: 'readonly',
        URL: 'readonly',
        Headers: 'readonly',
      },
    },
    rules: {
      ...typescript.configs.recommended.rules,
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
    },
  },
  {
    ignores: ['**/dist/**', '**/build/**', '**/node_modules/**', '**/.turbo/**', '**/.wrangler/**'],
  },
  prettier,
];