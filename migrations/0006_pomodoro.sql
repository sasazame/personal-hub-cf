-- Pomodoro Sessions table
CREATE TABLE IF NOT EXISTS pomodoro_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  task_id TEXT,
  start_time INTEGER NOT NULL,
  end_time INTEGER,
  duration INTEGER NOT NULL,
  session_type TEXT NOT NULL,
  completed INTEGER DEFAULT 0 NOT NULL,
  created_at INTEGER DEFAULT (unixepoch()) NOT NULL
);

-- Pomodoro Config table
CREATE TABLE IF NOT EXISTS pomodoro_configs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  work_duration INTEGER DEFAULT 25 NOT NULL,
  short_break_duration INTEGER DEFAULT 5 NOT NULL,
  long_break_duration INTEGER DEFAULT 15 NOT NULL,
  long_break_interval INTEGER DEFAULT 4 NOT NULL,
  auto_start_breaks INTEGER DEFAULT 0 NOT NULL,
  auto_start_pomodoros INTEGER DEFAULT 0 NOT NULL,
  sound_enabled INTEGER DEFAULT 1 NOT NULL,
  created_at INTEGER DEFAULT (unixepoch()) NOT NULL,
  updated_at INTEGER DEFAULT (unixepoch()) NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_pomodoro_sessions_user_id ON pomodoro_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_pomodoro_sessions_start_time ON pomodoro_sessions(start_time);
CREATE INDEX IF NOT EXISTS idx_pomodoro_sessions_session_type ON pomodoro_sessions(session_type);
CREATE INDEX IF NOT EXISTS idx_pomodoro_configs_user_id ON pomodoro_configs(user_id);