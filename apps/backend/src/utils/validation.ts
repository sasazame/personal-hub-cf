import { hook } from '@hono/zod-validator';
import { createValidationError, StatusCodes } from './spring-boot-compat';

// Custom validation hook that converts Zod errors to Spring Boot format
export const springBootValidator = (result: any, c: any) => {
  if (!result.success) {
    const fieldErrors: Record<string, string> = {};
    
    result.error.errors.forEach((error: any) => {
      const field = error.path.join('.');
      fieldErrors[field] = error.message;
    });
    
    return c.json(
      createValidationError(fieldErrors),
      StatusCodes.VALIDATION_ERROR
    );
  }
  
  // Return the validated data on success
  return result.data;
};