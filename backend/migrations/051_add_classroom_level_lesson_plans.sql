-- Migration 051: Add Classroom-Level Lesson Plans Support
-- This migration modifies the lesson_plans table to support lesson plans
-- at both individual child level AND classroom level

-- ============================================================================
-- 1. DROP EXISTING CONSTRAINTS
-- ============================================================================

-- Drop the unique constraint on child_id + week_start_date
ALTER TABLE lesson_plans DROP INDEX unique_child_week;

-- Drop the NOT NULL constraint on child_id by modifying the column
ALTER TABLE lesson_plans MODIFY COLUMN child_id CHAR(36) NULL;

-- ============================================================================
-- 2. ADD CHECK CONSTRAINT
-- ============================================================================
-- Ensure either child_id OR classroom_id is provided (but not both, not neither)
-- Note: MySQL 8.0.16+ supports CHECK constraints

ALTER TABLE lesson_plans
ADD CONSTRAINT chk_child_or_classroom CHECK (
    (child_id IS NOT NULL AND classroom_id IS NULL) OR
    (child_id IS NULL AND classroom_id IS NOT NULL)
);

-- ============================================================================
-- 3. ADD NEW UNIQUE CONSTRAINTS
-- ============================================================================
-- For child-level plans: child_id + week_start_date must be unique
ALTER TABLE lesson_plans
ADD UNIQUE INDEX unique_child_week_plan (child_id, week_start_date);

-- For classroom-level plans: classroom_id + week_start_date must be unique
ALTER TABLE lesson_plans
ADD UNIQUE INDEX unique_classroom_week_plan (classroom_id, week_start_date);

-- ============================================================================
-- 4. ADD NEW INDEXES FOR PERFORMANCE
-- ============================================================================
-- Index for querying classroom-level plans
ALTER TABLE lesson_plans
ADD INDEX idx_classroom_week (classroom_id, week_start_date),
ADD INDEX idx_classroom_status (classroom_id, status);

-- ============================================================================
-- 5. UPDATE FOREIGN KEY CONSTRAINT
-- ============================================================================
-- The existing foreign key on child_id needs to allow NULL
-- We need to drop and recreate it

ALTER TABLE lesson_plans DROP FOREIGN KEY lesson_plans_ibfk_1;

ALTER TABLE lesson_plans
ADD CONSTRAINT fk_lesson_plans_child
FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE CASCADE;

-- ============================================================================
-- 6. ADD METADATA COLUMN (OPTIONAL)
-- ============================================================================
-- Add a computed column to easily identify plan type
ALTER TABLE lesson_plans
ADD COLUMN plan_type VARCHAR(20) GENERATED ALWAYS AS (
    CASE
        WHEN child_id IS NOT NULL THEN 'child'
        WHEN classroom_id IS NOT NULL THEN 'classroom'
        ELSE 'unknown'
    END
) STORED;

-- Add index on plan_type for filtering
ALTER TABLE lesson_plans
ADD INDEX idx_plan_type (plan_type);

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Add a migration tracking entry if you have a migrations table
-- INSERT INTO migrations (version, name, executed_at)
-- VALUES (51, '051_add_classroom_level_lesson_plans', NOW());
