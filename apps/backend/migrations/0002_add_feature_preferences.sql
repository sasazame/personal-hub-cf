-- Add feature_preferences column to users table with JSON validation and default
ALTER TABLE users 
  ADD COLUMN feature_preferences TEXT 
  CHECK (feature_preferences IS NULL OR json_valid(feature_preferences))
  DEFAULT '{"todos":true,"goals":true,"pomodoro":true,"calendar":true,"notes":true,"moments":true,"analytics":true}';

-- Backfill existing users with default preferences
UPDATE users
SET feature_preferences = '{"todos":true,"goals":true,"pomodoro":true,"calendar":true,"notes":true,"moments":true,"analytics":true}'
WHERE feature_preferences IS NULL;

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