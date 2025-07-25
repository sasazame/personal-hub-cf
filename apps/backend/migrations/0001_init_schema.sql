-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password TEXT,
  username TEXT UNIQUE NOT NULL,
  enabled INTEGER DEFAULT 1 NOT NULL,
  email_verified INTEGER DEFAULT 0 NOT NULL,
  profile_picture_url TEXT,
  given_name TEXT,
  family_name TEXT,
  locale TEXT,
  week_start_day INTEGER DEFAULT 1 NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create todos table
CREATE TABLE IF NOT EXISTS todos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'TODO' NOT NULL CHECK (status IN ('TODO', 'IN_PROGRESS', 'DONE', 'CANCELLED')),
  priority TEXT DEFAULT 'MEDIUM' NOT NULL CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'URGENT')),
  due_date TEXT,
  parent_id INTEGER REFERENCES todos(id),
  is_repeatable INTEGER DEFAULT 0 NOT NULL,
  repeat_type TEXT CHECK (repeat_type IN ('DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY')),
  repeat_interval INTEGER,
  repeat_days_of_week TEXT,
  repeat_day_of_month INTEGER,
  repeat_end_date TEXT,
  original_todo_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create events table
CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  description TEXT,
  start_date_time TEXT NOT NULL,
  end_date_time TEXT NOT NULL,
  location TEXT,
  all_day INTEGER DEFAULT 0 NOT NULL,
  reminder_minutes INTEGER,
  color TEXT,
  google_calendar_id TEXT,
  google_event_id TEXT,
  last_synced_at TEXT,
  sync_status TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create notes table
CREATE TABLE IF NOT EXISTS notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  content TEXT,
  tags TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create moments table
CREATE TABLE IF NOT EXISTS moments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL REFERENCES users(id),
  content TEXT NOT NULL,
  tags TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create goals table
CREATE TABLE IF NOT EXISTS goals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  description TEXT,
  goal_type TEXT,
  is_active INTEGER DEFAULT 1 NOT NULL,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create goal_achievement_history table
CREATE TABLE IF NOT EXISTS goal_achievement_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  goal_id INTEGER NOT NULL REFERENCES goals(id),
  achieved_date TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
  UNIQUE(goal_id, achieved_date)
);

-- Create pomodoro_sessions table
CREATE TABLE IF NOT EXISTS pomodoro_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  start_time TEXT,
  end_time TEXT,
  work_duration INTEGER NOT NULL,
  break_duration INTEGER NOT NULL,
  completed_cycles INTEGER DEFAULT 0 NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED')),
  session_type TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create pomodoro_tasks table
CREATE TABLE IF NOT EXISTS pomodoro_tasks (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES pomodoro_sessions(id),
  todo_id INTEGER REFERENCES todos(id),
  description TEXT NOT NULL,
  completed INTEGER DEFAULT 0 NOT NULL,
  order_index INTEGER NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create pomodoro_configs table
CREATE TABLE IF NOT EXISTS pomodoro_configs (
  id TEXT PRIMARY KEY,
  user_id TEXT UNIQUE NOT NULL REFERENCES users(id),
  work_duration INTEGER DEFAULT 25 NOT NULL,
  short_break_duration INTEGER DEFAULT 5 NOT NULL,
  long_break_duration INTEGER DEFAULT 15 NOT NULL,
  cycles_before_long_break INTEGER DEFAULT 4 NOT NULL,
  alarm_sound TEXT DEFAULT 'default' NOT NULL,
  alarm_volume INTEGER DEFAULT 50 NOT NULL,
  auto_start_breaks INTEGER DEFAULT 1 NOT NULL,
  auto_start_work INTEGER DEFAULT 0 NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create calendar_sync_settings table
CREATE TABLE IF NOT EXISTS calendar_sync_settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL REFERENCES users(id),
  google_calendar_id TEXT NOT NULL,
  calendar_name TEXT,
  sync_enabled INTEGER DEFAULT 1 NOT NULL,
  last_sync_at TEXT,
  sync_direction TEXT DEFAULT 'BIDIRECTIONAL' NOT NULL,
  auto_sync INTEGER DEFAULT 1 NOT NULL,
  sync_interval INTEGER DEFAULT 30 NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create user_social_accounts table
CREATE TABLE IF NOT EXISTS user_social_accounts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  provider TEXT NOT NULL,
  provider_user_id TEXT NOT NULL,
  email TEXT,
  email_verified INTEGER,
  name TEXT,
  given_name TEXT,
  family_name TEXT,
  picture TEXT,
  locale TEXT,
  profile_data TEXT,
  access_token_encrypted TEXT,
  refresh_token_encrypted TEXT,
  token_expires_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
  UNIQUE(provider, provider_user_id)
);

-- Create oauth_applications table
CREATE TABLE IF NOT EXISTS oauth_applications (
  id TEXT PRIMARY KEY,
  client_id TEXT UNIQUE NOT NULL,
  client_secret_hash TEXT,
  redirect_uris TEXT NOT NULL,
  scopes TEXT,
  grant_types TEXT,
  response_types TEXT,
  application_type TEXT DEFAULT 'web' NOT NULL,
  token_endpoint_auth_method TEXT DEFAULT 'client_secret_basic' NOT NULL,
  application_name TEXT NOT NULL,
  application_uri TEXT,
  logo_uri TEXT,
  tos_uri TEXT,
  policy_uri TEXT,
  contacts TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create authorization_codes table
CREATE TABLE IF NOT EXISTS authorization_codes (
  code TEXT PRIMARY KEY,
  client_id TEXT NOT NULL,
  user_id TEXT NOT NULL REFERENCES users(id),
  redirect_uri TEXT NOT NULL,
  scopes TEXT,
  code_challenge TEXT,
  code_challenge_method TEXT,
  nonce TEXT,
  state TEXT,
  auth_time TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  used INTEGER DEFAULT 0 NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create refresh_tokens table
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id TEXT PRIMARY KEY,
  token_hash TEXT UNIQUE NOT NULL,
  user_id TEXT NOT NULL REFERENCES users(id),
  client_id TEXT NOT NULL,
  scopes TEXT,
  expires_at TEXT NOT NULL,
  revoked INTEGER DEFAULT 0 NOT NULL,
  revoked_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create password_reset_tokens table
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id TEXT PRIMARY KEY,
  token TEXT UNIQUE NOT NULL,
  user_id TEXT NOT NULL REFERENCES users(id),
  expires_at TEXT NOT NULL,
  used INTEGER DEFAULT 0 NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create security_events table
CREATE TABLE IF NOT EXISTS security_events (
  id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  user_id TEXT REFERENCES users(id),
  client_id TEXT,
  ip_address TEXT NOT NULL,
  user_agent TEXT,
  success INTEGER NOT NULL,
  error_code TEXT,
  error_description TEXT,
  metadata TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create indexes
CREATE INDEX idx_todos_user_id ON todos(user_id);
CREATE INDEX idx_events_user_id ON events(user_id);
CREATE INDEX idx_notes_user_id ON notes(user_id);
CREATE INDEX idx_moments_user_id ON moments(user_id);
CREATE INDEX idx_goals_user_id ON goals(user_id);
CREATE INDEX idx_pomodoro_sessions_user_id ON pomodoro_sessions(user_id);
CREATE INDEX idx_user_social_accounts_user_id ON user_social_accounts(user_id);
CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_security_events_user_id ON security_events(user_id);
CREATE INDEX idx_security_events_created_at ON security_events(created_at);