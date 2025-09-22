-- Ensure roles catalog exists
CREATE TABLE IF NOT EXISTS roles (
    name VARCHAR(64) PRIMARY KEY
);

-- Seed roles (idempotent)
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

-- Assign existing primary role into user_roles (idempotent)
INSERT INTO user_roles (id, user_id, role)
SELECT UUID(), u.id, u.role
FROM users u
WHERE u.role IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM user_roles ur WHERE ur.user_id = u.id AND ur.role = u.role
  );

-- Allow assigning multiple centers to a user
CREATE TABLE IF NOT EXISTS user_centers (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    center_id VARCHAR(36) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uniq_user_center (user_id, center_id),
    INDEX idx_uc_user (user_id),
    INDEX idx_uc_center (center_id),
    CONSTRAINT fk_uc_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_uc_center FOREIGN KEY (center_id) REFERENCES centers(id) ON DELETE CASCADE
);

-- Seed mapping from existing users.center_id values (idempotent)
INSERT INTO user_centers (id, user_id, center_id)
SELECT 
    UUID(), u.id, u.center_id
FROM users u
WHERE u.center_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM user_centers uc WHERE uc.user_id = u.id AND uc.center_id = u.center_id
  );
