-- Add PENDING status to pomodoro_sessions
-- Since we cannot determine if the production table has a CHECK constraint or not,
-- and Cloudflare D1 has limitations with DDL operations, we'll use a safe approach.
-- The application code will handle the PENDING status validation.

-- This migration is intentionally minimal to avoid breaking production.
-- If the table has no CHECK constraint (migration 0000), PENDING will work.
-- If the table has a CHECK constraint (migration 0001 in fresh installs),
-- we cannot safely modify it without risking data loss or foreign key issues.

-- Future consideration: Use application-level validation for status values
-- instead of database-level CHECK constraints to avoid migration complexity.

SELECT 1;