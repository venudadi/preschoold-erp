-- Migration: Add Company Tie-up Tracking to Children
-- Created: 2025-09-19
-- Purpose: Add company tie-up tracking to children/students table

-- Add company tie-up columns to children table
ALTER TABLE children 
ADD COLUMN IF NOT EXISTS company_id VARCHAR(36) NULL,
ADD COLUMN IF NOT EXISTS has_tie_up BOOLEAN DEFAULT false;

-- Add foreign key constraint to companies table
ALTER TABLE children 
ADD CONSTRAINT IF NOT EXISTS fk_children_company 
FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL;

-- Add index for performance
ALTER TABLE children 
ADD INDEX IF NOT EXISTS idx_company_id (company_id),
ADD INDEX IF NOT EXISTS idx_has_tie_up (has_tie_up);

-- Update existing children to have has_tie_up = false where NULL
UPDATE children 
SET has_tie_up = false 
WHERE has_tie_up IS NULL;

-- Create a view for easier student management (compatibility with existing code)
CREATE OR REPLACE VIEW students AS
SELECT 
    id,
    CONCAT(first_name, ' ', COALESCE(last_name, '')) as name,
    first_name,
    last_name,
    date_of_birth,
    gender,
    student_id,
    enrollment_date,
    probable_joining_date,
    classroom_id,
    center_id,
    company_id,
    has_tie_up,
    allergies,
    emergency_contact_name,
    emergency_contact_phone,
    fee_structure_type,
    is_on_recurring_billing,
    created_at,
    -- Add placeholder columns for timing (to be added later if needed)
    NULL as program_start_time,
    NULL as program_end_time,
    NULL as address,
    CURRENT_TIMESTAMP as updated_at
FROM children;