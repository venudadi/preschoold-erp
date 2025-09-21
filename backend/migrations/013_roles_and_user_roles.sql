-- Create roles catalog
CREATE TABLE IF NOT EXISTS roles (
    name VARCHAR(64) PRIMARY KEY
);

-- Seed roles
INSERT INTO roles (name) VALUES
    ('super_admin'),
    ('owner'),
    ('admin'),
    ('academic_coordinator'),
    ('teacher'),
    ('parent'),
    ('financial_manager')
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- Map users to multiple roles
CREATE TABLE IF NOT EXISTS user_roles (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    role VARCHAR(64) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uniq_user_role (user_id, role),
    INDEX idx_ur_user (user_id),
    CONSTRAINT fk_ur_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_ur_role FOREIGN KEY (role) REFERENCES roles(name) ON DELETE CASCADE
);

-- Ensure users.role enum includes financial_manager for backward compatibility
ALTER TABLE users 
    MODIFY COLUMN role ENUM('super_admin','owner','admin','academic_coordinator','teacher','parent','financial_manager') NOT NULL;

-- Seed user_roles from existing primary role
INSERT INTO user_roles (id, user_id, role)
SELECT UUID(), u.id, u.role
FROM users u
WHERE u.role IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM user_roles ur WHERE ur.user_id = u.id AND ur.role = u.role
  );
