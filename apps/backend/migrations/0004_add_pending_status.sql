-- Add PENDING status to pomodoro_sessions
-- Need to update the CHECK constraint for environments where it exists (from 0001_init_schema.sql)
-- Using simplified approach compatible with Cloudflare D1 limitations

-- Step 1: Rename old table
ALTER TABLE pomodoro_sessions RENAME TO pomodoro_sessions_old;

-- Step 2: Create new table with updated CHECK constraint including PENDING
CREATE TABLE pomodoro_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  start_time TEXT,
  end_time TEXT,
  work_duration INTEGER NOT NULL,
  break_duration INTEGER NOT NULL,
  completed_cycles INTEGER DEFAULT 0 NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED', 'PENDING')),
  session_type TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Step 3: Copy data from old table
INSERT INTO pomodoro_sessions
SELECT id, user_id, start_time, end_time, work_duration, break_duration, completed_cycles, status, session_type, created_at, updated_at
FROM pomodoro_sessions_old;

-- Step 4: Drop old table
DROP TABLE pomodoro_sessions_old;

-- Step 5: Recreate index
CREATE INDEX idx_pomodoro_sessions_user_id ON pomodoro_sessions(user_id);