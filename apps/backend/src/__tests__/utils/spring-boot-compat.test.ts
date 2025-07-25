import { describe, it, expect } from 'vitest';
import {
  createErrorResponse,
  createValidationError,
  ErrorCodes,
  StatusCodes,
} from '../../utils/spring-boot-compat';

describe('Spring Boot Compatibility Utils', () => {
  describe('createErrorResponse', () => {
    it('should create error response with default message', () => {
      const response = createErrorResponse(ErrorCodes.NOT_FOUND);
      
      expect(response).toMatchObject({
        code: 'NOT_FOUND',
        message: 'Resource not found',
        details: null,
      });
      expect(response.timestamp).toBeDefined();
      expect(new Date(response.timestamp).getTime()).toBeCloseTo(Date.now(), -2);
    });

    it('should create error response with custom message', () => {
      const response = createErrorResponse(ErrorCodes.INTERNAL_ERROR, 'Custom error message');
      
      expect(response).toMatchObject({
        code: 'INTERNAL_ERROR',
        message: 'Custom error message',
        details: null,
      });
    });

    it('should create error response with details', () => {
      const details = { field: 'email', reason: 'Invalid format' };
      const response = createErrorResponse(
        ErrorCodes.VALIDATION_ERROR,
        'Validation failed',
        details
      );
      
      expect(response).toMatchObject({
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details,
      });
    });
  });

  describe('createValidationError', () => {
    it('should create validation error from field errors', () => {
      const fieldErrors = {
        email: 'Invalid email',
        password: 'String must contain at least 8 character(s)',
      };

      const response = createValidationError(fieldErrors);
      
      expect(response).toMatchObject({
        code: 'VALIDATION_ERROR',
        message: 'Invalid input',
        details: {
          email: 'Invalid email',
          password: 'String must contain at least 8 character(s)',
        },
      });
    });

    it('should handle nested field paths', () => {
      const fieldErrors = {
        'address.street': 'Street is required',
      };

      const response = createValidationError(fieldErrors);
      
      expect(response.details).toEqual({
        'address.street': 'Street is required',
      });
    });
  });

  describe('StatusCodes', () => {
    it('should have correct HTTP status codes', () => {
      expect(StatusCodes.OK).toBe(200);
      expect(StatusCodes.CREATED).toBe(201);
      expect(StatusCodes.NO_CONTENT).toBe(204);
      expect(StatusCodes.BAD_REQUEST).toBe(400);
      expect(StatusCodes.UNAUTHORIZED).toBe(401);
      expect(StatusCodes.FORBIDDEN).toBe(403);
      expect(StatusCodes.NOT_FOUND).toBe(404);
      expect(StatusCodes.CONFLICT).toBe(409);
      expect(StatusCodes.INTERNAL_ERROR).toBe(500);
    });
  });

  describe('ErrorCodes', () => {
    it('should have all required error codes', () => {
      const expectedCodes = [
        'VALIDATION_ERROR',
        'AUTHENTICATION_FAILED',
        'UNAUTHORIZED',
        'FORBIDDEN',
        'NOT_FOUND',
        'USER_EXISTS',
        'INVALID_CREDENTIALS',
        'TOKEN_EXPIRED',
        'INVALID_TOKEN',
        'INTERNAL_ERROR',
        'CONFLICT',
      ];

      expectedCodes.forEach(code => {
        expect(ErrorCodes).toHaveProperty(code);
      });
    });
  });
});