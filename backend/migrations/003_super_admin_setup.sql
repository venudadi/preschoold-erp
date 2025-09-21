-- Add super_admin role and create super admin user
ALTER TABLE users 
MODIFY COLUMN role enum('super_admin','owner','admin','academic_coordinator','teacher','parent') NOT NULL;

INSERT INTO users (
    id,
    full_name,
    email,
    password_hash,
    role,
    created_at,
    updated_at,
    is_active
) VALUES (
    UUID(),
    'Vani',
    'venudadi@outlook.com',
    '$2b$10$dcG8qaxvilxXWnfOr6tqK.apUnC655B3QYZ9C6k58ir814dp8T1D.',
    'super_admin',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP,
    1
);