-- Migration: Essential Session Management Tables
-- Created: 2025-09-18
-- Purpose: Add minimal session management tables needed for authentication

-- User Sessions Table (Required for authentication)
CREATE TABLE IF NOT EXISTS user_sessions (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    session_token VARCHAR(64) NOT NULL UNIQUE,
    csrf_token VARCHAR(64) NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    expires_at TIMESTAMP NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_session_token (session_token),
    INDEX idx_user_id (user_id),
    INDEX idx_expires_at (expires_at),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Login Attempts Table (Required for security tracking)
CREATE TABLE IF NOT EXISTS login_attempts (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36),
    ip_address VARCHAR(45),
    user_agent TEXT,
    success BOOLEAN NOT NULL,
    attempt_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    failure_reason VARCHAR(255),
    INDEX idx_user_id (user_id),
    INDEX idx_attempt_time (attempt_time),
    INDEX idx_ip_address (ip_address),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Update users table to support account locking (Required for security)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS account_locked BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS lock_reason VARCHAR(255),
ADD COLUMN IF NOT EXISTS locked_at TIMESTAMP NULL;

-- Add indexes for performance
ALTER TABLE users 
ADD INDEX IF NOT EXISTS idx_email (email),
ADD INDEX IF NOT EXISTS idx_account_locked (account_locked);

-- Add password policy column to centers table (Required for password validation)
ALTER TABLE centers 
ADD COLUMN IF NOT EXISTS password_policy JSON DEFAULT ('{"minLength": 8, "requireUppercase": true, "requireLowercase": true, "requireNumbers": true, "requireSpecialChars": false}');

-- Update existing centers with default password policy
UPDATE centers 
SET password_policy = JSON_OBJECT(
    'minLength', 8,
    'requireUppercase', true,
    'requireLowercase', true,
    'requireNumbers', true,
    'requireSpecialChars', false
)
WHERE password_policy IS NULL;