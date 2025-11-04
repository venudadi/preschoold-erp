-- Fix Schema Mismatches Between Code and Database
-- Created: 2025-11-04
-- Purpose: Add missing columns that the application code expects

-- =================================================================
-- ISSUE 1: children.student_id column missing
-- =================================================================
-- Referenced in: invoiceRoutes.js, adminRoutes.js, child profile system
-- Error: Unknown column 'c.student_id' in 'field list'

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
-- Referenced in: enquiryRoutes.js
-- Error: Unknown column 'source' in 'field list'

-- Add all missing enquiry columns
ALTER TABLE enquiries
ADD COLUMN IF NOT EXISTS source VARCHAR(50) DEFAULT 'Walk-in' COMMENT 'Source of enquiry (Walk-in, Phone, Email, Website, etc.)',
ADD COLUMN IF NOT EXISTS enquiry_date DATE NULL COMMENT 'Date of enquiry',
ADD COLUMN IF NOT EXISTS child_dob DATE NULL COMMENT 'Child date of birth',
ADD COLUMN IF NOT EXISTS mobile_number VARCHAR(20) NULL COMMENT 'Mobile contact number',
ADD COLUMN IF NOT EXISTS company VARCHAR(255) NULL COMMENT 'Company name for tie-up',
ADD COLUMN IF NOT EXISTS has_tie_up BOOLEAN DEFAULT FALSE COMMENT 'Whether enquiry is through company tie-up',
ADD COLUMN IF NOT EXISTS parent_location VARCHAR(255) NULL COMMENT 'Parent location/address',
ADD COLUMN IF NOT EXISTS major_program VARCHAR(100) NULL COMMENT 'Major program (Pre-school, Daycare, etc.)',
ADD COLUMN IF NOT EXISTS specific_program VARCHAR(100) NULL COMMENT 'Specific program (Playgroup, Nursery, etc.)',
ADD COLUMN IF NOT EXISTS service_hours DECIMAL(4,2) NULL COMMENT 'Required service hours',
ADD COLUMN IF NOT EXISTS reason_for_closure TEXT NULL COMMENT 'Reason if enquiry is closed',
ADD COLUMN IF NOT EXISTS follow_up_flag BOOLEAN DEFAULT FALSE COMMENT 'Whether follow-up is required',
ADD COLUMN IF NOT EXISTS assigned_to VARCHAR(255) NULL COMMENT 'Person assigned to follow up',
ADD COLUMN IF NOT EXISTS remarks TEXT NULL COMMENT 'Additional remarks',
ADD COLUMN IF NOT EXISTS follow_up_date DATE NULL COMMENT 'Date for follow-up',
ADD COLUMN IF NOT EXISTS visited BOOLEAN DEFAULT FALSE COMMENT 'Whether parent has visited center';

-- Update existing enquiries with default values
UPDATE enquiries SET enquiry_date = DATE(created_at) WHERE enquiry_date IS NULL;
UPDATE enquiries SET mobile_number = phone_number WHERE mobile_number IS NULL AND phone_number IS NOT NULL;
UPDATE enquiries SET source = 'Walk-in' WHERE source IS NULL;

-- Create indexes for commonly queried fields
CREATE INDEX IF NOT EXISTS idx_enquiry_date ON enquiries(enquiry_date);
CREATE INDEX IF NOT EXISTS idx_follow_up_date ON enquiries(follow_up_date);
CREATE INDEX IF NOT EXISTS idx_follow_up_flag ON enquiries(follow_up_flag);
CREATE INDEX IF NOT EXISTS idx_source ON enquiries(source);

-- =================================================================
-- ISSUE 3: children table missing status and pause columns
-- =================================================================
-- Referenced in: adminRoutes.js, studentRoutes.js, child profile system

ALTER TABLE children
ADD COLUMN IF NOT EXISTS status ENUM('active', 'paused', 'left') NOT NULL DEFAULT 'active' COMMENT 'Student status',
ADD COLUMN IF NOT EXISTS pause_start_date DATE NULL COMMENT 'Date when student was paused',
ADD COLUMN IF NOT EXISTS pause_end_date DATE NULL COMMENT 'Date when student should resume',
ADD COLUMN IF NOT EXISTS pause_reason TEXT NULL COMMENT 'Reason for pausing',
ADD COLUMN IF NOT EXISTS pause_notes TEXT NULL COMMENT 'Additional notes about pause',
ADD COLUMN IF NOT EXISTS paused_by VARCHAR(36) NULL COMMENT 'User ID who paused the student';

-- Create index for status
CREATE INDEX IF NOT EXISTS idx_status ON children(status);

-- Add foreign key for paused_by (only if not exists)
-- Check first to avoid error if FK already exists
SET @fk_exists = (SELECT COUNT(*)
    FROM information_schema.TABLE_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = DATABASE()
    AND CONSTRAINT_NAME = 'fk_children_paused_by'
    AND TABLE_NAME = 'children');

SET @sql = IF(@fk_exists = 0,
    'ALTER TABLE children ADD CONSTRAINT fk_children_paused_by FOREIGN KEY (paused_by) REFERENCES users(id) ON DELETE SET NULL',
    'SELECT "FK fk_children_paused_by already exists" as status');

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- =================================================================
-- ISSUE 4: children table missing service hours and program timing
-- =================================================================
-- Referenced in: adminRoutes.js (child profile), fee calculation

ALTER TABLE children
ADD COLUMN IF NOT EXISTS service_hours DECIMAL(4,2) NULL COMMENT 'Daily service hours',
ADD COLUMN IF NOT EXISTS program_start_time TIME NULL COMMENT 'Daily program start time',
ADD COLUMN IF NOT EXISTS program_end_time TIME NULL COMMENT 'Daily program end time';

-- =================================================================
-- VERIFICATION QUERIES
-- =================================================================

-- Show added columns in children table
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
AND TABLE_NAME = 'children'
AND COLUMN_NAME IN ('student_id', 'status', 'pause_start_date', 'pause_end_date',
                     'pause_reason', 'paused_by', 'service_hours', 'program_start_time', 'program_end_time')
ORDER BY ORDINAL_POSITION;

-- Show added columns in enquiries table
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
AND TABLE_NAME = 'enquiries'
AND COLUMN_NAME IN ('source', 'enquiry_date', 'child_dob', 'mobile_number', 'company',
                     'has_tie_up', 'parent_location', 'major_program', 'specific_program',
                     'service_hours', 'reason_for_closure', 'follow_up_flag', 'assigned_to',
                     'remarks', 'follow_up_date', 'visited')
ORDER BY ORDINAL_POSITION;

-- Count children by status
SELECT status, COUNT(*) as count
FROM children
GROUP BY status;

-- Count enquiries by source
SELECT source, COUNT(*) as count
FROM enquiries
GROUP BY source;

SELECT '✅ Schema fixes completed successfully!' as status;
