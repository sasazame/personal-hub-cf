-- Add PENDING status to pomodoro_sessions
-- SQLite doesn't support ALTER COLUMN, so we need to recreate the table with updated CHECK constraint

-- Step 1: Create a new table with the updated CHECK constraint including PENDING
CREATE TABLE pomodoro_sessions_new (
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
  FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE no action ON DELETE no action
);

-- Step 2: Copy existing data from the old table to the new table
INSERT INTO pomodoro_sessions_new (id, user_id, start_time, end_time, work_duration, break_duration, completed_cycles, status, session_type, created_at, updated_at)
SELECT id, user_id, start_time, end_time, work_duration, break_duration, completed_cycles, status, session_type, created_at, updated_at
FROM pomodoro_sessions;

-- Step 3: Drop the old table
DROP TABLE pomodoro_sessions;

-- Step 4: Rename the new table to the original name
ALTER TABLE pomodoro_sessions_new RENAME TO pomodoro_sessions;

-- Step 5: Recreate the index
CREATE INDEX idx_pomodoro_sessions_user_id ON pomodoro_sessions(user_id);