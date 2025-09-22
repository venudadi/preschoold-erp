-- Create tables for multi-center and multi-role functionality
-- MySQL-compatible syntax for neldrac_admin database

-- Create roles catalog first (required for FK reference from user_roles)
CREATE TABLE roles (
    name VARCHAR(64) PRIMARY KEY,
    description VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed default roles (using MySQL ON DUPLICATE KEY UPDATE to make it idempotent)
INSERT INTO roles (name) VALUES
    ('super_admin'),
    ('owner'),
    ('admin'),
    ('academic_coordinator'),
    ('teacher'),
    ('parent'),
    ('financial_manager')
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- Create user_roles mapping table (many-to-many relationship)
CREATE TABLE user_roles (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    role VARCHAR(64) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uniq_user_role (user_id, role),
    INDEX idx_ur_user (user_id),
    CONSTRAINT fk_ur_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_ur_role FOREIGN KEY (role) REFERENCES roles(name) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create user_centers mapping table (many-to-many relationship)
CREATE TABLE user_centers (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    center_id VARCHAR(36) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uniq_user_center (user_id, center_id),
    INDEX idx_uc_user (user_id),
    INDEX idx_uc_center (center_id),
    CONSTRAINT fk_uc_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_uc_center FOREIGN KEY (center_id) REFERENCES centers(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;