-- Security Enhancements Migration
-- This script adds security-related tables and columns

-- 1. Add password policy settings to center table
ALTER TABLE centers
ADD COLUMN IF NOT EXISTS password_policy JSON;

-- 2. Create failed login attempts tracking
CREATE TABLE IF NOT EXISTS login_attempts (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    ip_address VARCHAR(45) NOT NULL,
    user_agent TEXT,
    attempt_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    success BOOLEAN DEFAULT false,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_attempts (user_id, attempt_time)
);

-- 3. Create session management table
CREATE TABLE IF NOT EXISTS user_sessions (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    session_token VARCHAR(255) NOT NULL,
    csrf_token VARCHAR(255) NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_session_token (session_token),
    UNIQUE KEY unique_csrf_token (csrf_token),
    INDEX idx_user_sessions (user_id, is_active)
);

-- 4. Add security-related columns to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS require_password_change BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS password_history JSON,
ADD COLUMN IF NOT EXISTS security_questions JSON,
ADD COLUMN IF NOT EXISTS last_password_reset TIMESTAMP,
ADD COLUMN IF NOT EXISTS account_locked BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS lock_reason VARCHAR(255),
ADD COLUMN IF NOT EXISTS unlock_token VARCHAR(255),
ADD COLUMN IF NOT EXISTS unlock_token_expires TIMESTAMP;

-- 5. Create security audit log
CREATE TABLE IF NOT EXISTS security_audit_log (
    id VARCHAR(36) PRIMARY KEY,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    user_id VARCHAR(36),
    action VARCHAR(100) NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    details JSON,
    severity ENUM('info', 'warning', 'critical') DEFAULT 'info',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_security_audit (timestamp, severity)
);

-- 6. Update default password policy for existing centers
UPDATE centers
SET password_policy = JSON_OBJECT(
    'minLength', 8,
    'requireUppercase', true,
    'requireLowercase', true,
    'requireNumbers', true,
    'requireSpecialChars', true,
    'passwordExpiryDays', 90,
    'preventReuse', 5,
    'maxLoginAttempts', 5,
    'lockoutDurationMinutes', 30
)
WHERE password_policy IS NULL;