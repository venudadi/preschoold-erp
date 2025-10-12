-- Fix username field to ensure it's properly set
-- This migration handles cases where username might be NULL due to cached deployments

-- Update any users with NULL username to use email as username
UPDATE users
SET username = SUBSTRING_INDEX(email, '@', 1)
WHERE username IS NULL;

-- Now make username NOT NULL since all rows should have values
ALTER TABLE users
MODIFY COLUMN username VARCHAR(100) NOT NULL UNIQUE;
