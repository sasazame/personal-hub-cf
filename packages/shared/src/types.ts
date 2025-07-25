import { z } from 'zod';
import * as schemas from './schemas';

// Infer types from schemas
export type LoginRequest = z.infer<typeof schemas.loginRequestSchema>;
export type LoginResponse = z.infer<typeof schemas.loginResponseSchema>;
export type ErrorResponse = z.infer<typeof schemas.errorResponseSchema>;