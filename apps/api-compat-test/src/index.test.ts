import { describe, it, expect } from 'vitest';
import { compareResponses } from './utils/comparator';

describe('API Compatibility Test Utils', () => {
  describe('compareResponses', () => {
    it('should detect matching responses', () => {
      const response = {
        status: 200,
        headers: { 'content-type': 'application/json' },
        data: { message: 'success', value: 42 },
        responseTime: 100,
      };

      const result = compareResponses(response, response);
      expect(result.match).toBe(true);
      expect(result.differences).toHaveLength(0);
    });

    it('should detect status code differences', () => {
      const oldResponse = {
        status: 200,
        headers: {},
        data: {},
        responseTime: 100,
      };

      const newResponse = {
        status: 201,
        headers: {},
        data: {},
        responseTime: 100,
      };

      const result = compareResponses(oldResponse, newResponse);
      expect(result.match).toBe(false);
      expect(result.differences).toHaveLength(1);
      expect(result.differences[0].type).toBe('status');
    });

    it('should detect data differences', () => {
      const oldResponse = {
        status: 200,
        headers: {},
        data: { message: 'old' },
        responseTime: 100,
      };

      const newResponse = {
        status: 200,
        headers: {},
        data: { message: 'new' },
        responseTime: 100,
      };

      const result = compareResponses(oldResponse, newResponse);
      expect(result.match).toBe(false);
      expect(result.differences).toHaveLength(1);
      expect(result.differences[0].path).toBe('data.message');
    });

    it('should ignore timestamp differences', () => {
      const oldResponse = {
        status: 200,
        headers: {},
        data: { 
          message: 'success',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
        responseTime: 100,
      };

      const newResponse = {
        status: 200,
        headers: {},
        data: { 
          message: 'success',
          createdAt: '2024-01-02T00:00:00Z',
          updatedAt: '2024-01-02T00:00:00Z',
        },
        responseTime: 100,
      };

      const result = compareResponses(oldResponse, newResponse);
      expect(result.match).toBe(true);
      expect(result.differences).toHaveLength(0);
    });
  });
});