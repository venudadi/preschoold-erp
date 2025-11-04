-- Migration 046: Fix enquiries.status ENUM to include 'Open' and other statuses
-- Created: 2025-11-04
-- Purpose: Add missing status values that the application code uses

-- Current ENUM: ('New', 'Contacted', 'Visit Scheduled', 'Enrolled', 'Declined')
-- Code uses: 'Open' as default
-- Solution: Modify ENUM to include all necessary statuses

-- Modify the status column ENUM to include 'Open' and 'Closed'
ALTER TABLE enquiries
MODIFY COLUMN status ENUM(
    'Open',
    'New',
    'Contacted',
    'Visit Scheduled',
    'Enrolled',
    'Declined',
    'Closed'
) DEFAULT 'Open' COMMENT 'Enquiry status';

-- Update any existing 'New' statuses to 'Open' for consistency
UPDATE enquiries
SET status = 'Open'
WHERE status = 'New';

SELECT '✅ Migration 046 completed: Enquiries status ENUM fixed to include Open' as status;
