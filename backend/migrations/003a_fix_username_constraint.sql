-- Fix username field to ensure it has a DEFAULT value
-- This migration handles cases where cached super admin INSERT doesn't include username

-- Ensure username column allows NULL and has DEFAULT NULL
ALTER TABLE users
MODIFY COLUMN username VARCHAR(100) UNIQUE DEFAULT NULL;

-- Update any existing users with NULL username to use email prefix as username
UPDATE users
SET username = SUBSTRING_INDEX(email, '@', 1)
WHERE username IS NULL;
