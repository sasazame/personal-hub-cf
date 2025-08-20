-- Add carryOverIncompleteTasks and soundEnabled fields to pomodoro_configs table
ALTER TABLE pomodoro_configs 
ADD COLUMN carry_over_incomplete_tasks INTEGER DEFAULT 1 NOT NULL;

ALTER TABLE pomodoro_configs
ADD COLUMN sound_enabled INTEGER DEFAULT 1 NOT NULL;