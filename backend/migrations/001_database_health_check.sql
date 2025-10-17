-- ================================================================
-- Database Health Check Migration
-- ================================================================
-- Purpose: Verify database connection and basic schema readiness
-- This migration does NOT create, alter, or drop any tables
-- It only checks if the database is accessible and ready
-- ================================================================

-- Check if we can query the database
SELECT 1 AS health_check;

-- Verify core tables exist (non-destructive check)
-- This will fail gracefully if tables don't exist
SELECT
    COUNT(*) as table_count,
    'Database schema check passed' as status
FROM information_schema.tables
WHERE table_schema = DATABASE()
AND table_name IN ('users', 'centers', 'children', 'classrooms')
HAVING COUNT(*) >= 4;

-- Note: If this query fails, it means core tables are missing
-- The database administrator should manually create required tables
-- DO NOT run CREATE TABLE commands via migrations
