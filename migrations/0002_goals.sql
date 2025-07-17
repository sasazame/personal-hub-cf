-- Goals table
CREATE TABLE IF NOT EXISTS goals (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL, -- ANNUAL, MONTHLY, WEEKLY, DAILY
  target_value REAL,
  current_value REAL DEFAULT 0,
  unit TEXT,
  start_date INTEGER NOT NULL,
  end_date INTEGER NOT NULL,
  status TEXT DEFAULT 'ACTIVE' NOT NULL,
  color TEXT,
  created_at INTEGER DEFAULT (unixepoch()) NOT NULL,
  updated_at INTEGER DEFAULT (unixepoch()) NOT NULL
);

-- Goal Progress table
CREATE TABLE IF NOT EXISTS goal_progress (
  id TEXT PRIMARY KEY,
  goal_id TEXT NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
  value REAL NOT NULL,
  note TEXT,
  date INTEGER NOT NULL,
  created_at INTEGER DEFAULT (unixepoch()) NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_goals_user_id ON goals(user_id);
CREATE INDEX IF NOT EXISTS idx_goals_status ON goals(status);
CREATE INDEX IF NOT EXISTS idx_goals_type ON goals(type);
CREATE INDEX IF NOT EXISTS idx_goals_start_date ON goals(start_date);
CREATE INDEX IF NOT EXISTS idx_goals_end_date ON goals(end_date);
CREATE INDEX IF NOT EXISTS idx_goal_progress_goal_id ON goal_progress(goal_id);
CREATE INDEX IF NOT EXISTS idx_goal_progress_date ON goal_progress(date);