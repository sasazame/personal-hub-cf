-- Timeline entries table for chronological table (separate from calendar events)
CREATE TABLE IF NOT EXISTS timeline_entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  memo TEXT,
  category TEXT,
  tags TEXT,
  event_id INTEGER,
  date TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_timeline_entries_user_date ON timeline_entries(user_id, date);
CREATE INDEX IF NOT EXISTS idx_timeline_entries_category ON timeline_entries(category);
