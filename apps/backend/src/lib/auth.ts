import { Lucia } from 'lucia';
import { DrizzleSQLiteAdapter } from '@lucia-auth/adapter-drizzle';
import { drizzle } from 'drizzle-orm/d1';
import { users, sessions } from '@personal-hub/shared';

export function initializeLucia(db: D1Database) {
  const drizzleDb = drizzle(db);
  const adapter = new DrizzleSQLiteAdapter(drizzleDb, sessions, users);

  return new Lucia(adapter, {
    sessionCookie: {
      attributes: {
        secure: true, // Always use HTTPS in production
        sameSite: 'lax',
      },
    },
    getUserAttributes: (attributes) => {
      return {
        email: attributes.email,
        username: attributes.username,
        firstName: attributes.firstName,
        lastName: attributes.lastName,
        emailVerified: attributes.emailVerified,
        profilePictureUrl: attributes.profilePictureUrl,
      };
    },
  });
}

declare module 'lucia' {
  interface Register {
    Lucia: ReturnType<typeof initializeLucia>;
    DatabaseUserAttributes: DatabaseUserAttributes;
  }
}

interface DatabaseUserAttributes {
  email: string;
  username: string | null;
  firstName: string | null;
  lastName: string | null;
  emailVerified: boolean;
  profilePictureUrl: string | null;
}