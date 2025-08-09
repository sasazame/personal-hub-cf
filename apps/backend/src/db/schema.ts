import { sqliteTable, text, integer, foreignKey } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// Users table
export const users = sqliteTable('users', {
  id: text('id').primaryKey(), // UUID as text
  email: text('email').unique().notNull(),
  password: text('password'), // nullable for social login
  username: text('username').unique().notNull(),
  enabled: integer('enabled', { mode: 'boolean' }).default(true).notNull(),
  emailVerified: integer('email_verified', { mode: 'boolean' }).default(false).notNull(),
  profilePictureUrl: text('profile_picture_url'),
  givenName: text('given_name'),
  familyName: text('family_name'),
  locale: text('locale'),
  weekStartDay: integer('week_start_day').default(1).notNull(),
  featurePreferences: text('feature_preferences'), // JSON string with feature toggles
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// Todos table
export const todos = sqliteTable('todos', {
  id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
  userId: text('user_id').notNull().references(() => users.id),
  title: text('title', { length: 255 }).notNull(),
  description: text('description'),
  status: text('status', { enum: ['TODO', 'IN_PROGRESS', 'DONE', 'CANCELLED'] }).default('TODO').notNull(),
  priority: text('priority', { enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] }).default('MEDIUM').notNull(),
  dueDate: text('due_date'), // ISO date string
  parentId: integer('parent_id'),
  isRepeatable: integer('is_repeatable', { mode: 'boolean' }).default(false).notNull(),
  repeatType: text('repeat_type', { enum: ['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'] }),
  repeatInterval: integer('repeat_interval'),
  repeatDaysOfWeek: text('repeat_days_of_week'), // JSON array as text
  repeatDayOfMonth: integer('repeat_day_of_month'),
  repeatEndDate: text('repeat_end_date'),
  originalTodoId: integer('original_todo_id'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => ({
  parentReference: foreignKey({
    columns: [table.parentId],
    foreignColumns: [table.id],
    name: 'todos_parent_id_fkey',
  }),
}));

// Events table
export const events = sqliteTable('events', {
  id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
  userId: text('user_id').notNull().references(() => users.id),
  title: text('title').notNull(),
  description: text('description'),
  startDateTime: text('start_date_time').notNull(), // ISO datetime string
  endDateTime: text('end_date_time').notNull(),
  location: text('location'),
  allDay: integer('all_day', { mode: 'boolean' }).default(false).notNull(),
  reminderMinutes: integer('reminder_minutes'),
  color: text('color'),
  googleCalendarId: text('google_calendar_id'),
  googleEventId: text('google_event_id'),
  lastSyncedAt: text('last_synced_at'),
  syncStatus: text('sync_status'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// Notes table
export const notes = sqliteTable('notes', {
  id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
  userId: text('user_id').notNull().references(() => users.id),
  title: text('title').notNull(),
  content: text('content'),
  tags: text('tags', { length: 1000 }),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// Moments table
export const moments = sqliteTable('moments', {
  id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
  userId: text('user_id').notNull().references(() => users.id),
  content: text('content').notNull(),
  tags: text('tags', { length: 1000 }),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// Goals table
export const goals = sqliteTable('goals', {
  id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
  userId: text('user_id').notNull().references(() => users.id),
  title: text('title').notNull(),
  description: text('description'),
  goalType: text('goal_type'),
  isActive: integer('is_active', { mode: 'boolean' }).default(true).notNull(),
  startDate: text('start_date').notNull(),
  endDate: text('end_date').notNull(),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// Goal achievement history table
export const goalAchievementHistory = sqliteTable('goal_achievement_history', {
  id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
  goalId: integer('goal_id').notNull().references(() => goals.id),
  achievedDate: text('achieved_date').notNull(),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// Pomodoro sessions table
export const pomodoroSessions = sqliteTable('pomodoro_sessions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  startTime: text('start_time'),
  endTime: text('end_time'),
  workDuration: integer('work_duration').notNull(),
  breakDuration: integer('break_duration').notNull(),
  completedCycles: integer('completed_cycles').default(0).notNull(),
  status: text('status', { enum: ['ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED'] }).notNull(),
  sessionType: text('session_type'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// Pomodoro tasks table
export const pomodoroTasks = sqliteTable('pomodoro_tasks', {
  id: text('id').primaryKey(),
  sessionId: text('session_id').notNull().references(() => pomodoroSessions.id),
  todoId: integer('todo_id').references(() => todos.id),
  description: text('description', { length: 500 }).notNull(),
  completed: integer('completed', { mode: 'boolean' }).default(false).notNull(),
  orderIndex: integer('order_index').notNull(),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// Pomodoro configs table
export const pomodoroConfigs = sqliteTable('pomodoro_configs', {
  id: text('id').primaryKey(),
  userId: text('user_id').unique().notNull().references(() => users.id),
  workDuration: integer('work_duration').default(25).notNull(),
  shortBreakDuration: integer('short_break_duration').default(5).notNull(),
  longBreakDuration: integer('long_break_duration').default(15).notNull(),
  cyclesBeforeLongBreak: integer('cycles_before_long_break').default(4).notNull(),
  alarmSound: text('alarm_sound').default('default').notNull(),
  alarmVolume: integer('alarm_volume').default(50).notNull(),
  autoStartBreaks: integer('auto_start_breaks', { mode: 'boolean' }).default(true).notNull(),
  autoStartWork: integer('auto_start_work', { mode: 'boolean' }).default(false).notNull(),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// Calendar sync settings table
export const calendarSyncSettings = sqliteTable('calendar_sync_settings', {
  id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
  userId: text('user_id').notNull().references(() => users.id),
  googleCalendarId: text('google_calendar_id').notNull(),
  calendarName: text('calendar_name'),
  syncEnabled: integer('sync_enabled', { mode: 'boolean' }).default(true).notNull(),
  lastSyncAt: text('last_sync_at'),
  syncDirection: text('sync_direction', { length: 20 }).default('BIDIRECTIONAL').notNull(),
  autoSync: integer('auto_sync', { mode: 'boolean' }).default(true).notNull(),
  syncInterval: integer('sync_interval').default(30).notNull(),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// User social accounts table
export const userSocialAccounts = sqliteTable('user_social_accounts', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  provider: text('provider').notNull(),
  providerUserId: text('provider_user_id').notNull(),
  email: text('email'),
  emailVerified: integer('email_verified', { mode: 'boolean' }),
  name: text('name'),
  givenName: text('given_name'),
  familyName: text('family_name'),
  picture: text('picture'),
  locale: text('locale'),
  profileData: text('profile_data'), // JSON as text
  accessTokenEncrypted: text('access_token_encrypted'),
  refreshTokenEncrypted: text('refresh_token_encrypted'),
  tokenExpiresAt: text('token_expires_at'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// OAuth applications table
export const oauthApplications = sqliteTable('oauth_applications', {
  id: text('id').primaryKey(),
  clientId: text('client_id').unique().notNull(),
  clientSecretHash: text('client_secret_hash'),
  redirectUris: text('redirect_uris').notNull(),
  scopes: text('scopes'),
  grantTypes: text('grant_types'),
  responseTypes: text('response_types'),
  applicationType: text('application_type').default('web').notNull(),
  tokenEndpointAuthMethod: text('token_endpoint_auth_method').default('client_secret_basic').notNull(),
  applicationName: text('application_name').notNull(),
  applicationUri: text('application_uri'),
  logoUri: text('logo_uri'),
  tosUri: text('tos_uri'),
  policyUri: text('policy_uri'),
  contacts: text('contacts'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// Authorization codes table
export const authorizationCodes = sqliteTable('authorization_codes', {
  code: text('code').primaryKey(),
  clientId: text('client_id').notNull(),
  userId: text('user_id').notNull().references(() => users.id),
  redirectUri: text('redirect_uri').notNull(),
  scopes: text('scopes'),
  codeChallenge: text('code_challenge'),
  codeChallengeMethod: text('code_challenge_method'),
  nonce: text('nonce'),
  state: text('state'),
  authTime: text('auth_time').notNull(),
  expiresAt: text('expires_at').notNull(),
  used: integer('used', { mode: 'boolean' }).default(false).notNull(),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// Refresh tokens table
export const refreshTokens = sqliteTable('refresh_tokens', {
  id: text('id').primaryKey(),
  tokenHash: text('token_hash').unique().notNull(),
  userId: text('user_id').notNull().references(() => users.id),
  clientId: text('client_id').notNull(),
  scopes: text('scopes'),
  expiresAt: text('expires_at').notNull(),
  revoked: integer('revoked', { mode: 'boolean' }).default(false).notNull(),
  revokedAt: text('revoked_at'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// Password reset tokens table
export const passwordResetTokens = sqliteTable('password_reset_tokens', {
  id: text('id').primaryKey(),
  token: text('token').unique().notNull(),
  userId: text('user_id').notNull().references(() => users.id),
  expiresAt: text('expires_at').notNull(),
  used: integer('used', { mode: 'boolean' }).default(false).notNull(),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// Security events table
export const securityEvents = sqliteTable('security_events', {
  id: text('id').primaryKey(),
  eventType: text('event_type').notNull(),
  userId: text('user_id').references(() => users.id),
  clientId: text('client_id'),
  ipAddress: text('ip_address').notNull(),
  userAgent: text('user_agent'),
  success: integer('success', { mode: 'boolean' }).notNull(),
  errorCode: text('error_code'),
  errorDescription: text('error_description'),
  metadata: text('metadata'), // JSON as text
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// Export all tables
export * from 'drizzle-orm';