import { execSync } from 'child_process';
import { drizzle } from 'drizzle-orm/d1';
import * as schema from '../../db/schema';
import { Miniflare } from 'miniflare';

let mf: Miniflare | null = null;

export async function setupTestDatabase() {
  // Create miniflare instance with D1 database
  mf = new Miniflare({
    script: '',
    modules: true,
    d1Databases: {
      DB: 'd1-test-database',
    },
    bindings: {
      JWT_SECRET: 'test-jwt-secret',
      OAUTH_GITHUB_CLIENT_ID: 'test-github-id',
      OAUTH_GITHUB_CLIENT_SECRET: 'test-github-secret',
      OAUTH_GOOGLE_CLIENT_ID: 'test-google-id',
      OAUTH_GOOGLE_CLIENT_SECRET: 'test-google-secret',
    },
  });

  const d1 = await mf.getD1Database('DB');
  
  // Run migrations - execute the schema creation
  // Execute each CREATE TABLE statement separately
  await d1.exec('CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, email TEXT UNIQUE NOT NULL, password TEXT, username TEXT UNIQUE NOT NULL, enabled INTEGER DEFAULT 1, email_verified INTEGER DEFAULT 0, profile_picture_url TEXT, given_name TEXT, family_name TEXT, locale TEXT, week_start_day INTEGER DEFAULT 1, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)');
  
  await d1.exec('CREATE TABLE IF NOT EXISTS refresh_tokens (id TEXT PRIMARY KEY, token_hash TEXT UNIQUE NOT NULL, user_id TEXT NOT NULL, client_id TEXT NOT NULL, scopes TEXT, expires_at TEXT NOT NULL, revoked INTEGER DEFAULT 0, revoked_at TEXT, created_at TEXT NOT NULL, FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE)');
  
  await d1.exec('CREATE TABLE IF NOT EXISTS todos (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id TEXT NOT NULL, title TEXT NOT NULL, description TEXT, status TEXT DEFAULT "TODO", priority TEXT DEFAULT "MEDIUM", due_date TEXT, parent_id INTEGER, is_repeatable INTEGER DEFAULT 0, repeat_type TEXT, repeat_interval INTEGER, repeat_days_of_week TEXT, repeat_day_of_month INTEGER, repeat_end_date TEXT, original_todo_id INTEGER, created_at TEXT NOT NULL, updated_at TEXT NOT NULL, FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE, FOREIGN KEY (parent_id) REFERENCES todos(id) ON DELETE CASCADE)');
  
  await d1.exec('CREATE TABLE IF NOT EXISTS goals (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id TEXT NOT NULL, title TEXT NOT NULL, description TEXT, goal_type TEXT, start_date TEXT, end_date TEXT, is_active INTEGER DEFAULT 1, created_at TEXT NOT NULL, updated_at TEXT NOT NULL, FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE)');
  
  await d1.exec('CREATE TABLE IF NOT EXISTS events (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id TEXT NOT NULL, title TEXT NOT NULL, description TEXT, start_date_time TEXT NOT NULL, end_date_time TEXT NOT NULL, location TEXT, all_day INTEGER DEFAULT 0, reminder_minutes INTEGER, color TEXT, google_calendar_id TEXT, google_event_id TEXT, last_synced_at TEXT, sync_status TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL, FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE)');
  
  await d1.exec('CREATE TABLE IF NOT EXISTS notes (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id TEXT NOT NULL, title TEXT NOT NULL, content TEXT, tags TEXT, is_archived INTEGER DEFAULT 0, created_at TEXT NOT NULL, updated_at TEXT NOT NULL, FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE)');
  
  const db = drizzle(d1, { schema });
  return { db, env: await mf.getBindings() };
}

export async function cleanupTestDatabase() {
  if (!mf) return;
  
  const d1 = await mf.getD1Database('DB');
  
  // Clear all tables
  const tables = [
    'users',
    'refresh_tokens',
    'todos',
    'goals',
    'events',
    'notes',
  ];
  
  for (const table of tables) {
    await d1.exec(`DELETE FROM ${table}`);
  }
}

export async function closeTestDatabase() {
  if (mf) {
    await mf.dispose();
    mf = null;
  }
}

export async function createTestUser(db: any, userData = {}) {
  const defaultUser = {
    id: 'test-user-id',
    username: 'testuser',
    email: 'test@example.com',
    password: 'hashed-password',
    enabled: 1,
    emailVerified: 0,
    profilePictureUrl: null,
    givenName: null,
    familyName: null,
    locale: null,
    weekStartDay: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...userData,
  };
  
  const [user] = await db.insert(schema.users).values(defaultUser).returning();
  return user;
}