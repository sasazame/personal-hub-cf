import { sql } from 'drizzle-orm';
import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

// Users table
export const users = sqliteTable('users', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  email: text('email').unique().notNull(),
  username: text('username').unique(),
  password: text('password'), // nullable for OAuth users
  firstName: text('first_name'),
  lastName: text('last_name'),
  enabled: integer('enabled', { mode: 'boolean' }).default(true).notNull(),
  emailVerified: integer('email_verified', { mode: 'boolean' }).default(false).notNull(),
  profilePictureUrl: text('profile_picture_url'),
  locale: text('locale').default('en'),
  weekStartDay: integer('week_start_day').default(0),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .default(sql`(unixepoch())`)
    .notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .default(sql`(unixepoch())`)
    .notNull(),
});

// Sessions table for Lucia Auth
export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expiresAt: integer('expires_at').notNull(), // Lucia expects number, not Date
});

// Todos table
export const todos = sqliteTable('todos', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description'),
  status: text('status').default('TODO').notNull(),
  priority: text('priority').default('MEDIUM'),
  dueDate: integer('due_date', { mode: 'timestamp' }),
  parentId: text('parent_id'),
  isRepeatable: integer('is_repeatable', { mode: 'boolean' }).default(false).notNull(),
  repeatType: text('repeat_type'),
  repeatInterval: integer('repeat_interval'),
  repeatDaysOfWeek: text('repeat_days_of_week'),
  repeatDayOfMonth: integer('repeat_day_of_month'),
  repeatEndDate: integer('repeat_end_date', { mode: 'timestamp' }),
  originalTodoId: text('original_todo_id'),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .default(sql`(unixepoch())`)
    .notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .default(sql`(unixepoch())`)
    .notNull(),
});

// Events table
export const events = sqliteTable('events', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description'),
  startDateTime: integer('start_date_time', { mode: 'timestamp' }).notNull(),
  endDateTime: integer('end_date_time', { mode: 'timestamp' }).notNull(),
  location: text('location'),
  allDay: integer('all_day', { mode: 'boolean' }).default(false).notNull(),
  reminderMinutes: integer('reminder_minutes'),
  color: text('color'),
  googleEventId: text('google_event_id'),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .default(sql`(unixepoch())`)
    .notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .default(sql`(unixepoch())`)
    .notNull(),
});

// Notes table
export const notes = sqliteTable('notes', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  content: text('content'),
  tags: text('tags'), // JSON array stored as text
  createdAt: integer('created_at', { mode: 'timestamp' })
    .default(sql`(unixepoch())`)
    .notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .default(sql`(unixepoch())`)
    .notNull(),
});

// Moments table
export const moments = sqliteTable('moments', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  tags: text('tags'), // JSON array stored as text
  createdAt: integer('created_at', { mode: 'timestamp' })
    .default(sql`(unixepoch())`)
    .notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .default(sql`(unixepoch())`)
    .notNull(),
});

// Goals table
export const goals = sqliteTable('goals', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description'),
  type: text('type').notNull(), // ANNUAL, MONTHLY, WEEKLY, DAILY
  targetValue: real('target_value'),
  currentValue: real('current_value').default(0),
  unit: text('unit'),
  startDate: integer('start_date', { mode: 'timestamp' }).notNull(),
  endDate: integer('end_date', { mode: 'timestamp' }).notNull(),
  status: text('status').default('ACTIVE').notNull(),
  color: text('color'),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .default(sql`(unixepoch())`)
    .notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .default(sql`(unixepoch())`)
    .notNull(),
});

// Goal Progress table
export const goalProgress = sqliteTable('goal_progress', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  goalId: text('goal_id')
    .notNull()
    .references(() => goals.id, { onDelete: 'cascade' }),
  value: real('value').notNull(),
  note: text('note'),
  date: integer('date', { mode: 'timestamp' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .default(sql`(unixepoch())`)
    .notNull(),
});

// Pomodoro Sessions table
export const pomodoroSessions = sqliteTable('pomodoro_sessions', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  taskId: text('task_id'),
  startTime: integer('start_time', { mode: 'timestamp' }).notNull(),
  endTime: integer('end_time', { mode: 'timestamp' }),
  duration: integer('duration').notNull(),
  sessionType: text('session_type').notNull(), // WORK, SHORT_BREAK, LONG_BREAK
  completed: integer('completed', { mode: 'boolean' }).default(false).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .default(sql`(unixepoch())`)
    .notNull(),
});

// Pomodoro Config table
export const pomodoroConfigs = sqliteTable('pomodoro_configs', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id')
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: 'cascade' }),
  workDuration: integer('work_duration').default(25).notNull(),
  shortBreakDuration: integer('short_break_duration').default(5).notNull(),
  longBreakDuration: integer('long_break_duration').default(15).notNull(),
  longBreakInterval: integer('long_break_interval').default(4).notNull(),
  autoStartBreaks: integer('auto_start_breaks', { mode: 'boolean' }).default(false).notNull(),
  autoStartPomodoros: integer('auto_start_pomodoros', { mode: 'boolean' }).default(false).notNull(),
  soundEnabled: integer('sound_enabled', { mode: 'boolean' }).default(true).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .default(sql`(unixepoch())`)
    .notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .default(sql`(unixepoch())`)
    .notNull(),
});

// OAuth Applications table
export const oauthApplications = sqliteTable('oauth_applications', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull(),
  clientId: text('client_id').unique().notNull(),
  clientSecret: text('client_secret').notNull(),
  redirectUris: text('redirect_uris').notNull(), // JSON array stored as text
  scopes: text('scopes').notNull(), // JSON array stored as text
  createdAt: integer('created_at', { mode: 'timestamp' })
    .default(sql`(unixepoch())`)
    .notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .default(sql`(unixepoch())`)
    .notNull(),
});

// User Social Accounts table
export const userSocialAccounts = sqliteTable('user_social_accounts', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  provider: text('provider').notNull(), // google, github, etc.
  providerUserId: text('provider_user_id').notNull(),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  expiresAt: integer('expires_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .default(sql`(unixepoch())`)
    .notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .default(sql`(unixepoch())`)
    .notNull(),
});

// Calendar Sync Settings table
export const calendarSyncSettings = sqliteTable('calendar_sync_settings', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id')
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: 'cascade' }),
  provider: text('provider').notNull(),
  enabled: integer('enabled', { mode: 'boolean' }).default(true).notNull(),
  syncDirection: text('sync_direction').default('BOTH').notNull(),
  lastSyncAt: integer('last_sync_at', { mode: 'timestamp' }),
  syncToken: text('sync_token'),
  selectedCalendars: text('selected_calendars'), // JSON array stored as text
  createdAt: integer('created_at', { mode: 'timestamp' })
    .default(sql`(unixepoch())`)
    .notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .default(sql`(unixepoch())`)
    .notNull(),
});

// Export all table types
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
export type Todo = typeof todos.$inferSelect;
export type NewTodo = typeof todos.$inferInsert;
export type Event = typeof events.$inferSelect;
export type NewEvent = typeof events.$inferInsert;
export type Note = typeof notes.$inferSelect;
export type NewNote = typeof notes.$inferInsert;
export type Moment = typeof moments.$inferSelect;
export type NewMoment = typeof moments.$inferInsert;
export type Goal = typeof goals.$inferSelect;
export type NewGoal = typeof goals.$inferInsert;
export type GoalProgress = typeof goalProgress.$inferSelect;
export type NewGoalProgress = typeof goalProgress.$inferInsert;
export type PomodoroSession = typeof pomodoroSessions.$inferSelect;
export type NewPomodoroSession = typeof pomodoroSessions.$inferInsert;
export type PomodoroConfig = typeof pomodoroConfigs.$inferSelect;
export type NewPomodoroConfig = typeof pomodoroConfigs.$inferInsert;