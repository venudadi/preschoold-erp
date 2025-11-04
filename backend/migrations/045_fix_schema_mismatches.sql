-- Migration 045: Fix Schema Mismatches Between Code and Database
-- Created: 2025-11-04
-- Purpose: Add missing columns that the application code expects

-- =================================================================
-- ISSUE 1: children.student_id column missing
-- =================================================================
ALTER TABLE children
ADD COLUMN IF NOT EXISTS student_id VARCHAR(50) UNIQUE NULL COMMENT 'Auto-generated student ID (e.g., NKD2511001)';

-- Migrate existing admission_number to student_id if needed
UPDATE children
SET student_id = admission_number
WHERE student_id IS NULL AND admission_number IS NOT NULL;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_student_id ON children(student_id);

-- =================================================================
-- ISSUE 2: enquiries table missing many columns
-- =================================================================
ALTER TABLE enquiries
ADD COLUMN IF NOT EXISTS source VARCHAR(50) DEFAULT 'Walk-in' COMMENT 'Source of enquiry',
ADD COLUMN IF NOT EXISTS enquiry_date DATE NULL COMMENT 'Date of enquiry',
ADD COLUMN IF NOT EXISTS child_dob DATE NULL COMMENT 'Child date of birth',
ADD COLUMN IF NOT EXISTS mobile_number VARCHAR(20) NULL COMMENT 'Mobile contact number',
ADD COLUMN IF NOT EXISTS company VARCHAR(255) NULL COMMENT 'Company name for tie-up',
ADD COLUMN IF NOT EXISTS has_tie_up BOOLEAN DEFAULT FALSE COMMENT 'Company tie-up flag',
ADD COLUMN IF NOT EXISTS parent_location VARCHAR(255) NULL COMMENT 'Parent location',
ADD COLUMN IF NOT EXISTS major_program VARCHAR(100) NULL COMMENT 'Major program',
ADD COLUMN IF NOT EXISTS specific_program VARCHAR(100) NULL COMMENT 'Specific program',
ADD COLUMN IF NOT EXISTS service_hours DECIMAL(4,2) NULL COMMENT 'Required service hours',
ADD COLUMN IF NOT EXISTS reason_for_closure TEXT NULL COMMENT 'Closure reason',
ADD COLUMN IF NOT EXISTS follow_up_flag BOOLEAN DEFAULT FALSE COMMENT 'Follow-up required',
ADD COLUMN IF NOT EXISTS assigned_to VARCHAR(255) NULL COMMENT 'Assigned person',
ADD COLUMN IF NOT EXISTS remarks TEXT NULL COMMENT 'Additional remarks',
ADD COLUMN IF NOT EXISTS follow_up_date DATE NULL COMMENT 'Follow-up date',
ADD COLUMN IF NOT EXISTS visited BOOLEAN DEFAULT FALSE COMMENT 'Parent visited flag';

-- Update existing enquiries with default values
UPDATE enquiries SET enquiry_date = DATE(created_at) WHERE enquiry_date IS NULL;
UPDATE enquiries SET mobile_number = phone_number WHERE mobile_number IS NULL AND phone_number IS NOT NULL;
UPDATE enquiries SET source = 'Walk-in' WHERE source IS NULL;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_enquiry_date ON enquiries(enquiry_date);
CREATE INDEX IF NOT EXISTS idx_follow_up_date ON enquiries(follow_up_date);
CREATE INDEX IF NOT EXISTS idx_follow_up_flag ON enquiries(follow_up_flag);
CREATE INDEX IF NOT EXISTS idx_source ON enquiries(source);

-- =================================================================
-- ISSUE 3: children table missing status and pause columns
-- =================================================================
ALTER TABLE children
ADD COLUMN IF NOT EXISTS status ENUM('active', 'paused', 'left') NOT NULL DEFAULT 'active' COMMENT 'Student status',
ADD COLUMN IF NOT EXISTS pause_start_date DATE NULL COMMENT 'Pause start date',
ADD COLUMN IF NOT EXISTS pause_end_date DATE NULL COMMENT 'Pause end date',
ADD COLUMN IF NOT EXISTS pause_reason TEXT NULL COMMENT 'Pause reason',
ADD COLUMN IF NOT EXISTS pause_notes TEXT NULL COMMENT 'Pause notes',
ADD COLUMN IF NOT EXISTS paused_by VARCHAR(36) NULL COMMENT 'Paused by user ID';

CREATE INDEX IF NOT EXISTS idx_status ON children(status);

-- =================================================================
-- ISSUE 4: children table missing service hours and program timing
-- =================================================================
ALTER TABLE children
ADD COLUMN IF NOT EXISTS service_hours DECIMAL(4,2) NULL COMMENT 'Daily service hours',
ADD COLUMN IF NOT EXISTS program_start_time TIME NULL COMMENT 'Program start time',
ADD COLUMN IF NOT EXISTS program_end_time TIME NULL COMMENT 'Program end time';

SELECT '✅ Migration 045 completed: Schema mismatches fixed' as status;
