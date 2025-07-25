export interface TestConfig {
  oldBackendUrl: string;
  newBackendUrl: string;
  testTimeout: number;
  verbose: boolean;
}

export const config: TestConfig = {
  oldBackendUrl: process.env.OLD_BACKEND_URL || 'http://localhost:8080/api/v1',
  newBackendUrl: process.env.NEW_BACKEND_URL || 'http://localhost:8787/api/v1',
  testTimeout: 30000,
  verbose: process.env.VERBOSE === 'true',
};

export interface APITest {
  name: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  endpoint: string;
  headers?: Record<string, string>;
  body?: any;
  expectedStatus?: number;
  requiresAuth?: boolean;
  authToken?: string;
  validateResponse?: (oldResponse: any, newResponse: any) => void;
  skip?: boolean;
  skipReason?: string;
}