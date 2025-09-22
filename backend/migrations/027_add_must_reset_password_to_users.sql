-- 027_add_must_reset_password_to_users.sql
-- Add must_reset_password column to users table for mandatory password reset enforcement

ALTER TABLE users ADD COLUMN must_reset_password BOOLEAN DEFAULT FALSE;
