-- Migration 047: Admission Fee Details and Approval System
-- Created: 2025-11-06
-- Purpose: Add fee details tracking and approval workflow for enquiry-to-admission conversion

-- =================================================================
-- TABLE 1: admission_fee_details
-- Purpose: Store fee-related information for admission conversions
-- =================================================================
CREATE TABLE IF NOT EXISTS admission_fee_details (
    id VARCHAR(36) PRIMARY KEY,
    enquiry_id VARCHAR(36) NOT NULL COMMENT 'Reference to enquiries table',
    child_id VARCHAR(36) NULL COMMENT 'Reference to children table (populated after conversion)',
    original_fee_per_month DECIMAL(10,2) NOT NULL COMMENT 'Original monthly fee amount',
    final_fee_per_month DECIMAL(10,2) NOT NULL COMMENT 'Final monthly fee amount after discounts',
    annual_fee_waive_off BOOLEAN DEFAULT FALSE COMMENT 'Annual fee waiver flag',
    student_kit_amount DECIMAL(10,2) DEFAULT 0.00 COMMENT 'Student kit amount',
    discount_percentage DECIMAL(5,2) DEFAULT 0.00 COMMENT 'Discount percentage (5, 10, 15, 20, 25, 30)',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_enquiry_id (enquiry_id),
    INDEX idx_child_id (child_id),
    FOREIGN KEY (enquiry_id) REFERENCES enquiries(id) ON DELETE CASCADE,
    FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Fee details for admission conversions';

-- =================================================================
-- TABLE 2: admission_approvals
-- Purpose: Track approval workflow for admission conversions
-- =================================================================
CREATE TABLE IF NOT EXISTS admission_approvals (
    id VARCHAR(36) PRIMARY KEY,
    enquiry_id VARCHAR(36) NOT NULL COMMENT 'Reference to enquiries table',
    fee_details_id VARCHAR(36) NOT NULL COMMENT 'Reference to admission_fee_details',
    approval_status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending' COMMENT 'Approval status',
    submitted_by VARCHAR(36) NOT NULL COMMENT 'User who submitted for approval',
    approved_by VARCHAR(36) NULL COMMENT 'User who approved/rejected (center director)',
    approval_notes TEXT NULL COMMENT 'Notes from approver',
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Submission timestamp',
    reviewed_at TIMESTAMP NULL COMMENT 'Review timestamp',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_enquiry_id (enquiry_id),
    INDEX idx_fee_details_id (fee_details_id),
    INDEX idx_approval_status (approval_status),
    INDEX idx_submitted_by (submitted_by),
    INDEX idx_approved_by (approved_by),
    FOREIGN KEY (enquiry_id) REFERENCES enquiries(id) ON DELETE CASCADE,
    FOREIGN KEY (fee_details_id) REFERENCES admission_fee_details(id) ON DELETE CASCADE,
    FOREIGN KEY (submitted_by) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Approval tracking for admissions';

-- =================================================================
-- Add approval_required column to enquiries
-- Purpose: Track which enquiries require approval before final conversion
-- =================================================================
ALTER TABLE enquiries
ADD COLUMN IF NOT EXISTS approval_required BOOLEAN DEFAULT FALSE COMMENT 'Requires center director approval',
ADD COLUMN IF NOT EXISTS approval_status ENUM('not_required', 'pending', 'approved', 'rejected') DEFAULT 'not_required' COMMENT 'Current approval status';

CREATE INDEX IF NOT EXISTS idx_approval_status ON enquiries(approval_status);
CREATE INDEX IF NOT EXISTS idx_approval_required ON enquiries(approval_required);

SELECT '✅ Migration 047 completed: Admission fee details and approval system created' as status;
