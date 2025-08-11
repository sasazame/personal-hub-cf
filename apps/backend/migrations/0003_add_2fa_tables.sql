-- Add 2FA settings table
CREATE TABLE IF NOT EXISTS user_2fa_settings (
  id TEXT PRIMARY KEY,
  user_id TEXT UNIQUE NOT NULL,
  totp_secret_encrypted TEXT NOT NULL,
  totp_backup_codes TEXT, -- JSON array of encrypted backup codes
  enabled INTEGER DEFAULT 0 NOT NULL,
  enabled_at TEXT,
  last_used_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Add 2FA recovery codes table
CREATE TABLE IF NOT EXISTS two_factor_recovery_codes (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  code_hash TEXT NOT NULL,
  used INTEGER DEFAULT 0 NOT NULL,
  used_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_user_2fa_settings_user_id ON user_2fa_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_two_factor_recovery_codes_user_id ON two_factor_recovery_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_two_factor_recovery_codes_code_hash ON two_factor_recovery_codes(code_hash);