-- Migration 011: Add authentication enhancements (password reset and 2FA)

-- Add password reset functionality to users table
ALTER TABLE users ADD COLUMN reset_token VARCHAR(255) NULL;
ALTER TABLE users ADD COLUMN reset_token_expires DATETIME NULL;
ALTER TABLE users ADD COLUMN reset_token_used BOOLEAN DEFAULT FALSE;

-- Add 2FA functionality to users table
ALTER TABLE users ADD COLUMN two_fa_secret VARCHAR(255) NULL;
ALTER TABLE users ADD COLUMN two_fa_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN two_fa_backup_codes JSON NULL;

-- Add failed login attempt tracking
ALTER TABLE users ADD COLUMN failed_login_attempts INT DEFAULT 0;
ALTER TABLE users ADD COLUMN account_locked_until DATETIME NULL;
ALTER TABLE users ADD COLUMN last_login_at DATETIME NULL;

-- Create password reset requests log table for audit purposes
CREATE TABLE password_reset_requests (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    email VARCHAR(255) NOT NULL,
    token VARCHAR(255) NOT NULL,
    requested_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    used_at DATETIME NULL,
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_token (token),
    INDEX idx_user_id (user_id),
    INDEX idx_requested_at (requested_at)
);

-- Create 2FA sessions table to track temporary 2FA states
CREATE TABLE two_fa_sessions (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    session_token VARCHAR(255) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME NOT NULL,
    verified BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_session_token (session_token),
    INDEX idx_user_id (user_id),
    INDEX idx_expires_at (expires_at)
);

-- Create login attempts log for security monitoring
CREATE TABLE login_attempt_logs (
    id VARCHAR(36) PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    user_id VARCHAR(36) NULL,
    success BOOLEAN NOT NULL,
    failure_reason VARCHAR(100) NULL,
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,
    attempted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_email (email),
    INDEX idx_user_id (user_id),
    INDEX idx_attempted_at (attempted_at),
    INDEX idx_success (success)
);