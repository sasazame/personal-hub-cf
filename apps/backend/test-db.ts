import { drizzle } from 'drizzle-orm/d1';
import type { D1Database } from '@cloudflare/workers-types';
// import { users } from './src/db/schema';
import { nanoid } from './src/utils/nanoid';

// Test database connection
async function testDb() {
  // Mock the D1 database for testing
  drizzle({} as D1Database);
  
  const testUser = {
    id: nanoid(),
    email: 'test@example.com',
    password: 'hashed',
    username: 'testuser',
    emailVerified: false,
    enabled: true,
    weekStartDay: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  console.log('Test user:', testUser);
  console.log('UUID:', testUser.id);
}

testDb();