import type { D1Database } from '@cloudflare/workers-types';
import type { User } from 'lucia';

export type AuthEnv = {
  Bindings: {
    DB: D1Database;
  };
  Variables: {
    user: User;
  };
};