-- Add feature_preferences column to users table
ALTER TABLE users ADD COLUMN feature_preferences TEXT DEFAULT NULL;

-- Default feature preferences JSON structure:
-- {
--   "todos": true,
--   "goals": true,
--   "pomodoro": true,
--   "calendar": true,
--   "notes": true,
--   "moments": true,
--   "analytics": true
-- }