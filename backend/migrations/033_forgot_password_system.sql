-- Forgot Password System Migration
-- This migration creates the password reset functionality with security features

-- 1. Create password_reset_tokens table
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    email VARCHAR(255) NOT NULL,
    challenge_code VARCHAR(10) NOT NULL,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    attempts_used INT DEFAULT 0,
    max_attempts INT DEFAULT 3,
    is_used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    ip_address VARCHAR(45),
    user_agent TEXT,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_email (email),
    INDEX idx_challenge_code (challenge_code),
    INDEX idx_expires_at (expires_at),
    INDEX idx_token_hash (token_hash),
    INDEX idx_user_id (user_id)
);

-- 2. Add password reset tracking columns to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS last_password_reset TIMESTAMP NULL,
ADD COLUMN IF NOT EXISTS failed_reset_attempts INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS reset_locked_until TIMESTAMP NULL;

-- 3. Create indexes for performance on users table
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_reset_locked ON users(reset_locked_until);

-- 4. Create cleanup procedure for expired tokens
DELIMITER //

CREATE PROCEDURE IF NOT EXISTS CleanupExpiredResetTokens()
BEGIN
    -- Delete expired tokens (older than 24 hours)
    DELETE FROM password_reset_tokens
    WHERE expires_at < NOW() - INTERVAL 1 DAY;

    -- Delete used tokens older than 7 days
    DELETE FROM password_reset_tokens
    WHERE is_used = TRUE AND updated_at < NOW() - INTERVAL 7 DAY;

    -- Reset failed attempts for users where lockout has expired
    UPDATE users
    SET failed_reset_attempts = 0, reset_locked_until = NULL
    WHERE reset_locked_until IS NOT NULL AND reset_locked_until < NOW();
END //

DELIMITER ;

-- 5. Create event to run cleanup daily (if events are enabled)
SET @event_exists = (
    SELECT COUNT(*)
    FROM information_schema.events
    WHERE event_name = 'password_reset_cleanup'
    AND event_schema = DATABASE()
);

SET @sql = IF(@event_exists = 0,
    'CREATE EVENT password_reset_cleanup
    ON SCHEDULE EVERY 1 DAY
    STARTS CURRENT_DATE + INTERVAL 1 DAY
    DO CALL CleanupExpiredResetTokens()',
    'SELECT "Event already exists"'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 6. Insert sample data for testing (optional - remove in production)
-- This creates a test entry to verify the migration worked
INSERT INTO password_reset_tokens (id, user_id, email, challenge_code, token_hash, expires_at, ip_address, user_agent)
SELECT
    'test-reset-001',
    (SELECT id FROM users LIMIT 1),
    (SELECT email FROM users LIMIT 1),
    'TEST01',
    '$2b$12$test.hash.for.migration.verification.only',
    NOW() + INTERVAL 15 MINUTE,
    '127.0.0.1',
    'Migration Test'
WHERE EXISTS (SELECT 1 FROM users LIMIT 1);

-- 7. Verify migration success
SELECT
    'Migration Verification' as status,
    (SELECT COUNT(*) FROM password_reset_tokens) as reset_tokens_count,
    (SELECT COUNT(*) FROM users WHERE last_password_reset IS NULL) as users_with_new_columns
;