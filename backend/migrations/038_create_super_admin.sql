-- Create super admin user
INSERT INTO users (
    id,
    username,
    full_name,
    email,
    password_hash,
    role,
    created_at,
    updated_at,
    is_active
) VALUES (
    UUID(),
    'superadmin',
    'Vani',
    'venudadi@outlook.com',
    -- Will be replaced with actual hashed password
    '$2b$10$dcG8qaxvilxXWnfOr6tqK.apUnC655B3QYZ9C6k58ir814dp8T1D.',
    'super_admin',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP,
    1
)
ON DUPLICATE KEY UPDATE
    username = VALUES(username),
    full_name = VALUES(full_name),
    password_hash = VALUES(password_hash),
    role = VALUES(role);