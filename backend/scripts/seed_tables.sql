-- Seed data for roles, user_roles, and user_centers tables
-- MySQL-compatible syntax for neldrac_admin database

-- Make sure all primary users have their role in user_roles
INSERT INTO user_roles (id, user_id, role)
SELECT 
    UUID(), u.id, u.role
FROM users u
WHERE u.role IS NOT NULL
AND NOT EXISTS (
    SELECT 1 FROM user_roles ur WHERE ur.user_id = u.id AND ur.role = u.role
);

-- Make sure all user center assignments are in user_centers
INSERT INTO user_centers (id, user_id, center_id)
SELECT 
    UUID(), u.id, u.center_id
FROM users u
WHERE u.center_id IS NOT NULL
AND NOT EXISTS (
    SELECT 1 FROM user_centers uc WHERE uc.user_id = u.id AND uc.center_id = u.center_id
);