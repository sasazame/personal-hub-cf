import type { ContentfulStatusCode } from 'hono/utils/http-status';
import type { Hook } from '@hono/zod-validator';
import { createValidationError, StatusCodes } from './spring-boot-compat';

// Custom validation hook that converts Zod errors to Spring Boot format
export const springBootValidator: Hook<unknown, Record<string, unknown>, string> = (result, c) => {
  if (!result.success) {
    const fieldErrors: Record<string, string> = {};
    
    // Handle ZodError structure
    if ('error' in result && result.error && 'issues' in result.error) {
      result.error.issues.forEach((issue: { path: PropertyKey[]; message: string }) => {
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