-- Events table
CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  start_date_time INTEGER NOT NULL,
  end_date_time INTEGER NOT NULL,
  location TEXT,
  all_day INTEGER DEFAULT 0 NOT NULL,
  reminder_minutes INTEGER,
  color TEXT,
  google_event_id TEXT,
  created_at INTEGER DEFAULT (unixepoch()) NOT NULL,
  updated_at INTEGER DEFAULT (unixepoch()) NOT NULL
);

-- Indexes for events
CREATE INDEX IF NOT EXISTS idx_events_user_id ON events(user_id);
CREATE INDEX IF NOT EXISTS idx_events_start_date_time ON events(start_date_time);
CREATE INDEX IF NOT EXISTS idx_events_end_date_time ON events(end_date_time);
CREATE INDEX IF NOT EXISTS idx_events_google_event_id ON events(google_event_id);