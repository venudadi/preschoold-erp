-- Migration to create central password management system
-- This table manages default passwords, policies, and temporary access

CREATE TABLE IF NOT EXISTS central_passwords (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    type VARCHAR(50) CHECK (role IN ('default_password', 'temp_password', 'reset_token', 'system_policy')) NOT NULL,
    role VARCHAR(50) CHECK (role IN ('super_admin', 'owner', 'admin', 'academic_coordinator', 'teacher', 'parent')) NULL,
    password_value VARCHAR(255) NULL, -- Hashed password for defaults/temps
    policy_name VARCHAR(100) NULL, -- For policy entries
    policy_value TEXT NULL, -- JSON or text policy data
    description TEXT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    expires_at TIMESTAMP NULL,
    created_by VARCHAR(36) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ,
    
    -- Indexes
    INDEX idx_type (type),
    INDEX idx_role (role),
    INDEX idx_active (is_active),
    INDEX idx_expires (expires_at),
    
    -- Foreign key for creator
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Insert default system passwords and policies
INSERT INTO central_passwords (type, role, password_value, description, is_active) VALUES
('default_password', 'parent', '$2b$10$dcG8qaxvilxXWnfOr6tqK.apUnC655B3QYZ9C6k58ir814dp8T1D.', 'Default password for new parent accounts: password123', TRUE),
('default_password', 'teacher', '$2b$10$dcG8qaxvilxXWnfOr6tqK.apUnC655B3QYZ9C6k58ir814dp8T1D.', 'Default password for new teacher accounts: password123', TRUE),
('default_password', 'academic_coordinator', '$2b$10$dcG8qaxvilxXWnfOr6tqK.apUnC655B3QYZ9C6k58ir814dp8T1D.', 'Default password for new coordinator accounts: password123', TRUE);

-- Insert password policies
INSERT INTO central_passwords (type, policy_name, policy_value, description, is_active) VALUES
('system_policy', 'min_length', '8', 'Minimum password length', TRUE),
('system_policy', 'require_uppercase', 'true', 'Require at least one uppercase letter', TRUE),
('system_policy', 'require_lowercase', 'true', 'Require at least one lowercase letter', TRUE),
('system_policy', 'require_numbers', 'true', 'Require at least one number', TRUE),
('system_policy', 'require_special', 'false', 'Require special characters', TRUE),
('system_policy', 'max_login_attempts', '5', 'Maximum failed login attempts before lockout', TRUE),
('system_policy', 'lockout_duration', '900', 'Account lockout duration in seconds (15 minutes)', TRUE);

-- Create view for easy policy access
CREATE VIEW password_policies AS
SELECT 
    policy_name,
    policy_value,
    description,
    is_active,
    updated_at
FROM central_passwords 
WHERE type = 'system_policy' AND is_active = TRUE;