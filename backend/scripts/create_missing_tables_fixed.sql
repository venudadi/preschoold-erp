-- MySQL-compatible script to create missing tables
-- aligned with existing neldrac_admin schema

-- Create user_roles mapping table with VARCHAR to match users.id
CREATE TABLE IF NOT EXISTS user_roles (
    id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    role VARCHAR(64) NOT NULL,
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uniq_user_role (user_id, role),
    KEY idx_ur_user (user_id),
    KEY idx_ur_role (role),
    CONSTRAINT fk_ur_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_ur_role FOREIGN KEY (role) REFERENCES roles(name) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Create user_centers mapping table with VARCHAR to match users.id and centers.id
CREATE TABLE IF NOT EXISTS user_centers (
    id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    center_id VARCHAR(36) NOT NULL,
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uniq_user_center (user_id, center_id),
    KEY idx_uc_user (user_id),
    KEY idx_uc_center (center_id),
    CONSTRAINT fk_uc_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_uc_center FOREIGN KEY (center_id) REFERENCES centers(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Seed user_roles from existing users.role
INSERT IGNORE INTO user_roles (id, user_id, role)
SELECT
    -- Generate UUID v4-compatible IDs using UNHEX and REPLACE
    CONCAT(
        SUBSTRING(REPLACE(UUID(), '-', ''), 1, 8), '-',
        SUBSTRING(REPLACE(UUID(), '-', ''), 9, 4), '-',
        '4', SUBSTRING(REPLACE(UUID(), '-', ''), 14, 3), '-',
        'a', SUBSTRING(REPLACE(UUID(), '-', ''), 18, 3), '-',
        SUBSTRING(REPLACE(UUID(), '-', ''), 21, 12)
    ) AS generated_uuid,
    id,
    role
FROM
    users
WHERE
    role IS NOT NULL
    AND role IN (SELECT name FROM roles);

-- Seed user_centers from existing users.center_id
INSERT IGNORE INTO user_centers (id, user_id, center_id)
SELECT
    -- Generate UUID v4-compatible IDs using UNHEX and REPLACE
    CONCAT(
        SUBSTRING(REPLACE(UUID(), '-', ''), 1, 8), '-',
        SUBSTRING(REPLACE(UUID(), '-', ''), 9, 4), '-',
        '4', SUBSTRING(REPLACE(UUID(), '-', ''), 14, 3), '-',
        'a', SUBSTRING(REPLACE(UUID(), '-', ''), 18, 3), '-',
        SUBSTRING(REPLACE(UUID(), '-', ''), 21, 12)
    ) AS generated_uuid,
    id,
    center_id
FROM
    users
WHERE
    center_id IS NOT NULL
    AND center_id IN (SELECT id FROM centers);