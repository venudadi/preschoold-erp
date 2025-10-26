-- 043_add_missing_roles_to_enum.sql
-- Add financial_manager and center_director roles back to users.role enum
-- These were lost during table recreation in migration 042

ALTER TABLE users MODIFY COLUMN role ENUM(
    'super_admin',
    'owner',
    'financial_manager',
    'center_director',
    'admin',
    'academic_coordinator',
    'teacher',
    'parent'
) NOT NULL;
