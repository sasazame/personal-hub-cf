import { Context } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import { createValidationError, StatusCodes } from './spring-boot-compat';

// Custom validation hook that converts Zod errors to Spring Boot format
export const springBootValidator = (result: any, c: Context) => {
  if (!result.success) {
    const fieldErrors: Record<string, string> = {};
    
    // Handle ZodError structure
    if (result.error && result.error.issues) {
      result.error.issues.forEach((issue: any) => {
        const field = issue.path.join('.');
        fieldErrors[field] = issue.message;
      });
    }
    
    return c.json(
      createValidationError(fieldErrors),
      StatusCodes.VALIDATION_ERROR as ContentfulStatusCode
    );
  }
  
  // Return undefined to let the handler proceed with the validated data
  return;
};