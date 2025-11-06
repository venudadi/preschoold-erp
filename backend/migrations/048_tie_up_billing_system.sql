-- Migration 048: Tie-Up Billing System with Main Vendors & Contribution Management
-- Created: 2025-11-06
-- Purpose: Implement comprehensive billing system for company tie-ups with main vendor hierarchy

-- =================================================================
-- TABLE 1: main_vendors
-- Purpose: Track main vendor firms (Krisla Pvt Ltd, Sevis) for consolidated billing
-- =================================================================
CREATE TABLE IF NOT EXISTS main_vendors (
    id VARCHAR(36) PRIMARY KEY,
    vendor_name VARCHAR(255) NOT NULL UNIQUE COMMENT 'Main vendor company name',
    gst_number VARCHAR(15) NULL COMMENT 'GST number for invoice generation',
    billing_address TEXT NULL COMMENT 'Billing address for invoices',
    contact_person VARCHAR(255) NULL COMMENT 'Primary contact person',
    contact_email VARCHAR(255) NULL COMMENT 'Contact email',
    contact_phone VARCHAR(20) NULL COMMENT 'Contact phone number',
    is_active BOOLEAN DEFAULT TRUE COMMENT 'Active status',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_vendor_name (vendor_name),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Main vendor firms for tie-up billing';

-- Seed main vendor data
INSERT INTO main_vendors (id, vendor_name, gst_number, billing_address, contact_person, is_active)
VALUES
    (UUID(), 'Krisla Pvt Ltd', NULL, NULL, NULL, TRUE),
    (UUID(), 'Sevis', NULL, NULL, NULL, TRUE)
ON DUPLICATE KEY UPDATE vendor_name = vendor_name;

-- =================================================================
-- TABLE 2: Update companies table
-- Purpose: Add main vendor linkage and contribution percentages
-- =================================================================
ALTER TABLE companies
ADD COLUMN IF NOT EXISTS main_vendor_id VARCHAR(36) NULL COMMENT 'Link to main vendor firm',
ADD COLUMN IF NOT EXISTS parent_contribution_percent DECIMAL(5,2) DEFAULT 30.00 COMMENT 'Percentage paid by parent (0-100)',
ADD COLUMN IF NOT EXISTS company_contribution_percent DECIMAL(5,2) DEFAULT 70.00 COMMENT 'Percentage paid by company (0-100)',
ADD COLUMN IF NOT EXISTS gst_number VARCHAR(15) NULL COMMENT 'Company GST number (reference only)',
ADD CONSTRAINT fk_companies_main_vendor
    FOREIGN KEY (main_vendor_id) REFERENCES main_vendors(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_companies_main_vendor ON companies(main_vendor_id);

-- =================================================================
-- TABLE 3: Update children table
-- Purpose: Add payment and billing configuration
-- =================================================================
ALTER TABLE children
ADD COLUMN IF NOT EXISTS payment_mode ENUM('Cash', 'Online') DEFAULT 'Online' COMMENT 'Payment method',
ADD COLUMN IF NOT EXISTS billing_frequency ENUM('Monthly', 'Term', 'Annual') DEFAULT 'Monthly' COMMENT 'Billing frequency',
ADD COLUMN IF NOT EXISTS locked_monthly_fee DECIMAL(10,2) NULL COMMENT 'Final calculated monthly fee after approval';

CREATE INDEX IF NOT EXISTS idx_payment_mode ON children(payment_mode);
CREATE INDEX IF NOT EXISTS idx_billing_frequency ON children(billing_frequency);

-- =================================================================
-- TABLE 4: Update admission_fee_details table
-- Purpose: Store complete billing configuration from admission
-- =================================================================
ALTER TABLE admission_fee_details
ADD COLUMN IF NOT EXISTS payment_mode ENUM('Cash', 'Online') DEFAULT 'Online' COMMENT 'Selected payment mode',
ADD COLUMN IF NOT EXISTS billing_frequency ENUM('Monthly', 'Term', 'Annual') DEFAULT 'Monthly' COMMENT 'Selected billing frequency',
ADD COLUMN IF NOT EXISTS parent_contribution_percent DECIMAL(5,2) DEFAULT 100.00 COMMENT 'Parent contribution % (100 for non-tie-up)',
ADD COLUMN IF NOT EXISTS company_contribution_percent DECIMAL(5,2) DEFAULT 0.00 COMMENT 'Company contribution % (0 for non-tie-up)',
ADD COLUMN IF NOT EXISTS parent_amount_before_gst DECIMAL(10,2) NULL COMMENT 'Parent portion before GST',
ADD COLUMN IF NOT EXISTS company_amount_before_gst DECIMAL(10,2) NULL COMMENT 'Company portion before GST',
ADD COLUMN IF NOT EXISTS gst_rate DECIMAL(5,2) DEFAULT 18.00 COMMENT 'GST percentage',
ADD COLUMN IF NOT EXISTS parent_gst_amount DECIMAL(10,2) NULL COMMENT 'GST on parent portion',
ADD COLUMN IF NOT EXISTS company_gst_amount DECIMAL(10,2) NULL COMMENT 'GST on company portion',
ADD COLUMN IF NOT EXISTS parent_total_with_gst DECIMAL(10,2) NULL COMMENT 'Parent total including GST',
ADD COLUMN IF NOT EXISTS company_total_with_gst DECIMAL(10,2) NULL COMMENT 'Company total including GST';

-- =================================================================
-- TABLE 5: payment_receipts
-- Purpose: Track cash payments with receipt generation
-- =================================================================
CREATE TABLE IF NOT EXISTS payment_receipts (
    id VARCHAR(36) PRIMARY KEY,
    receipt_number VARCHAR(50) UNIQUE NOT NULL COMMENT 'Format: RCP{YY}{MM}{XXXX}',
    child_id VARCHAR(36) NOT NULL COMMENT 'Reference to children table',
    parent_id VARCHAR(36) NOT NULL COMMENT 'Reference to parents table',
    center_id VARCHAR(36) NOT NULL COMMENT 'Reference to centers table',
    billing_period_start DATE NOT NULL COMMENT 'Start of billing period',
    billing_period_end DATE NOT NULL COMMENT 'End of billing period',
    due_date DATE NOT NULL COMMENT 'Payment due date',
    base_amount DECIMAL(10,2) NOT NULL DEFAULT 0 COMMENT 'Base monthly fee',
    other_fees DECIMAL(10,2) DEFAULT 0 COMMENT 'Additional fees (kit, materials, etc.)',
    total_amount DECIMAL(10,2) NOT NULL COMMENT 'Total amount to be collected',
    amount_collected DECIMAL(10,2) DEFAULT 0 COMMENT 'Amount actually collected',
    payment_date DATE NULL COMMENT 'Date payment was collected',
    payment_method ENUM('Cash', 'Card', 'UPI', 'Other') DEFAULT 'Cash' COMMENT 'Method of payment',
    collected_by VARCHAR(36) NULL COMMENT 'User ID who collected payment',
    notes TEXT NULL COMMENT 'Additional notes',
    status ENUM('Pending', 'Collected', 'Partial', 'Cancelled') DEFAULT 'Pending' COMMENT 'Receipt status',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_receipt_number (receipt_number),
    INDEX idx_child_id (child_id),
    INDEX idx_parent_id (parent_id),
    INDEX idx_center_id (center_id),
    INDEX idx_status (status),
    INDEX idx_due_date (due_date),
    INDEX idx_payment_date (payment_date),
    FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_id) REFERENCES parents(id) ON DELETE CASCADE,
    FOREIGN KEY (center_id) REFERENCES centers(id) ON DELETE CASCADE,
    FOREIGN KEY (collected_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Cash payment receipts tracking';

-- =================================================================
-- TABLE 6: Update invoices table
-- Purpose: Support company and main vendor invoicing
-- =================================================================
ALTER TABLE invoices
ADD COLUMN IF NOT EXISTS invoice_type ENUM('parent', 'company', 'main_vendor') DEFAULT 'parent' COMMENT 'Type of invoice',
ADD COLUMN IF NOT EXISTS company_id VARCHAR(36) NULL COMMENT 'For company invoices',
ADD COLUMN IF NOT EXISTS main_vendor_id VARCHAR(36) NULL COMMENT 'For main vendor invoices',
ADD COLUMN IF NOT EXISTS consolidation_type ENUM('per_child', 'per_company', 'per_main_vendor') NULL COMMENT 'Invoice consolidation strategy',
ADD COLUMN IF NOT EXISTS contribution_percent DECIMAL(5,2) NULL COMMENT 'Contribution percentage for split billing',
ADD COLUMN IF NOT EXISTS base_amount_before_gst DECIMAL(10,2) NULL COMMENT 'Base amount before GST',
ADD COLUMN IF NOT EXISTS gst_rate DECIMAL(5,2) DEFAULT 18.00 COMMENT 'GST percentage applied',
ADD CONSTRAINT fk_invoices_company
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL,
ADD CONSTRAINT fk_invoices_main_vendor
    FOREIGN KEY (main_vendor_id) REFERENCES main_vendors(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_invoice_type ON invoices(invoice_type);
CREATE INDEX IF NOT EXISTS idx_company_id ON invoices(company_id);
CREATE INDEX IF NOT EXISTS idx_main_vendor_id ON invoices(main_vendor_id);
CREATE INDEX IF NOT EXISTS idx_consolidation_type ON invoices(consolidation_type);

-- =================================================================
-- Validation Check: Ensure contribution percentages sum to 100
-- =================================================================
-- Note: This is enforced in application logic, but adding a comment for reference
-- parent_contribution_percent + company_contribution_percent should always equal 100

SELECT '✅ Migration 048 completed: Tie-up billing system with main vendors created' as status;
