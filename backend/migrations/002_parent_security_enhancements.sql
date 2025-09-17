-- Parent Security and Authentication Enhancements
-- This script adds security features and parent authentication support

-- 1. Add security fields to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS parent_id VARCHAR(36),
ADD COLUMN IF NOT EXISTS last_login TIMESTAMP NULL,
ADD COLUMN IF NOT EXISTS failed_login_attempts INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS locked_until TIMESTAMP NULL,
ADD COLUMN IF NOT EXISTS password_reset_token VARCHAR(255) NULL,
ADD COLUMN IF NOT EXISTS password_reset_expires TIMESTAMP NULL,
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT 0,
ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT 0,
ADD FOREIGN KEY (parent_id) REFERENCES parents(id) ON DELETE SET NULL;

-- 2. Add verification and security fields to children table
ALTER TABLE children 
ADD COLUMN IF NOT EXISTS verification_code VARCHAR(8) NULL,
ADD COLUMN IF NOT EXISTS verification_code_expires TIMESTAMP NULL,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT 1;

-- 3. Add security fields to parents table
ALTER TABLE parents 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT 1,
ADD COLUMN IF NOT EXISTS emergency_contact_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS emergency_contact_phone VARCHAR(20),
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT 0,
ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT 0;

-- 4. Create audit log table for security monitoring
CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(36) PRIMARY KEY,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    action VARCHAR(100) NOT NULL,
    entity VARCHAR(50) NOT NULL,
    user_id VARCHAR(36),
    user_role VARCHAR(20),
    ip_address VARCHAR(45),
    user_agent TEXT,
    method VARCHAR(10),
    url VARCHAR(255),
    status_code INT,
    response_time INT,
    details JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_timestamp (timestamp),
    INDEX idx_user_id (user_id),
    INDEX idx_action (action),
    INDEX idx_entity (entity)
);

-- 5. Create parent notifications table
CREATE TABLE IF NOT EXISTS parent_notifications (
    id VARCHAR(36) PRIMARY KEY,
    parent_id VARCHAR(36) NOT NULL,
    child_id VARCHAR(36),
    type ENUM('info', 'warning', 'urgent', 'success') DEFAULT 'info',
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT 0,
    is_urgent BOOLEAN DEFAULT 0,
    scheduled_for TIMESTAMP NULL,
    sent_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES parents(id) ON DELETE CASCADE,
    FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE SET NULL,
    INDEX idx_parent_id (parent_id),
    INDEX idx_is_read (is_read),
    INDEX idx_created_at (created_at)
);

-- 6. Create parent sessions table for session management
CREATE TABLE IF NOT EXISTS parent_sessions (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    session_token VARCHAR(255) NOT NULL UNIQUE,
    device_info TEXT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    is_active BOOLEAN DEFAULT 1,
    last_accessed TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_session_token (session_token),
    INDEX idx_expires_at (expires_at)
);

-- 7. Create child daily reports table
CREATE TABLE IF NOT EXISTS child_daily_reports (
    id VARCHAR(36) PRIMARY KEY,
    child_id VARCHAR(36) NOT NULL,
    report_date DATE NOT NULL,
    arrival_time TIME,
    departure_time TIME,
    mood_morning ENUM('happy', 'sad', 'tired', 'excited', 'anxious') DEFAULT 'happy',
    mood_afternoon ENUM('happy', 'sad', 'tired', 'excited', 'anxious') DEFAULT 'happy',
    meals_breakfast BOOLEAN DEFAULT 0,
    meals_lunch BOOLEAN DEFAULT 0,
    meals_snack_morning BOOLEAN DEFAULT 0,
    meals_snack_afternoon BOOLEAN DEFAULT 0,
    nap_duration INT DEFAULT 0, -- in minutes
    activities TEXT,
    notes TEXT,
    created_by VARCHAR(36),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE KEY unique_child_date (child_id, report_date),
    INDEX idx_child_id (child_id),
    INDEX idx_report_date (report_date)
);

-- 8. Create parent_child_media table for photo/video sharing
CREATE TABLE IF NOT EXISTS parent_child_media (
    id VARCHAR(36) PRIMARY KEY,
    child_id VARCHAR(36) NOT NULL,
    uploaded_by VARCHAR(36) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_type ENUM('image', 'video') NOT NULL,
    file_size INT,
    mime_type VARCHAR(100),
    title VARCHAR(255),
    description TEXT,
    is_approved BOOLEAN DEFAULT 0,
    approved_by VARCHAR(36),
    approved_at TIMESTAMP NULL,
    is_visible_to_parents BOOLEAN DEFAULT 0,
    upload_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE CASCADE,
    FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_child_id (child_id),
    INDEX idx_upload_date (upload_date),
    INDEX idx_is_approved (is_approved)
);

-- 9. Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_parent_id ON users(parent_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_center_id_role ON users(center_id, role);
CREATE INDEX IF NOT EXISTS idx_children_verification_code ON children(verification_code);
CREATE INDEX IF NOT EXISTS idx_parents_phone_number ON parents(phone_number);
CREATE INDEX IF NOT EXISTS idx_parents_email ON parents(email);

-- 10. Generate verification codes for existing children (one-time operation)
UPDATE children 
SET verification_code = UPPER(SUBSTRING(SHA2(CONCAT(id, first_name, UNIX_TIMESTAMP()), 256), 1, 8))
WHERE verification_code IS NULL AND is_active = 1;

-- 11. Create secure configuration table
CREATE TABLE IF NOT EXISTS security_config (
    id VARCHAR(36) PRIMARY KEY,
    config_key VARCHAR(100) NOT NULL UNIQUE,
    config_value TEXT NOT NULL,
    description TEXT,
    is_encrypted BOOLEAN DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_config_key (config_key)
);

-- 12. Insert default security configurations
INSERT INTO security_config (id, config_key, config_value, description, is_encrypted) VALUES
(UUID(), 'max_login_attempts', '5', 'Maximum failed login attempts before account lockout', 0),
(UUID(), 'lockout_duration_minutes', '30', 'Account lockout duration in minutes', 0),
(UUID(), 'session_timeout_hours', '24', 'Parent session timeout in hours', 0),
(UUID(), 'password_min_length', '8', 'Minimum password length requirement', 0),
(UUID(), 'verification_code_expires_hours', '24', 'Verification code expiry time in hours', 0),
(UUID(), 'file_upload_max_size_mb', '10', 'Maximum file upload size in MB', 0),
(UUID(), 'daily_report_cutoff_hour', '18', 'Hour after which daily reports are finalized', 0)
ON DUPLICATE KEY UPDATE config_value = VALUES(config_value);

-- 13. Create parent feedback table
CREATE TABLE IF NOT EXISTS parent_feedback (
    id VARCHAR(36) PRIMARY KEY,
    parent_id VARCHAR(36) NOT NULL,
    child_id VARCHAR(36),
    feedback_type ENUM('suggestion', 'complaint', 'compliment', 'question') NOT NULL,
    subject VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    priority ENUM('low', 'medium', 'high') DEFAULT 'medium',
    status ENUM('pending', 'in_progress', 'resolved', 'closed') DEFAULT 'pending',
    response TEXT,
    responded_by VARCHAR(36),
    responded_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES parents(id) ON DELETE CASCADE,
    FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE SET NULL,
    FOREIGN KEY (responded_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_parent_id (parent_id),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
);

-- 14. Add cleanup procedures (stored procedures for maintenance)
DELIMITER //

CREATE PROCEDURE IF NOT EXISTS CleanupExpiredSessions()
BEGIN
    DELETE FROM parent_sessions 
    WHERE expires_at < NOW() OR (last_accessed < DATE_SUB(NOW(), INTERVAL 30 DAY));
END //

CREATE PROCEDURE IF NOT EXISTS CleanupExpiredVerificationCodes()
BEGIN
    UPDATE children 
    SET verification_code = NULL, verification_code_expires = NULL
    WHERE verification_code_expires < NOW();
END //

CREATE PROCEDURE IF NOT EXISTS CleanupOldAuditLogs()
BEGIN
    DELETE FROM audit_logs 
    WHERE created_at < DATE_SUB(NOW(), INTERVAL 1 YEAR);
END //

DELIMITER ;

-- 15. Create events for automatic cleanup (if event scheduler is enabled)
-- Note: These may need to be enabled manually depending on MySQL configuration

/*
CREATE EVENT IF NOT EXISTS cleanup_expired_sessions
ON SCHEDULE EVERY 1 HOUR
DO CALL CleanupExpiredSessions();

CREATE EVENT IF NOT EXISTS cleanup_expired_verification_codes
ON SCHEDULE EVERY 6 HOUR
DO CALL CleanupExpiredVerificationCodes();

CREATE EVENT IF NOT EXISTS cleanup_old_audit_logs
ON SCHEDULE EVERY 1 WEEK
DO CALL CleanupOldAuditLogs();
*/