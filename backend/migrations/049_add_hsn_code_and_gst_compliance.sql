-- Migration 049: Add HSN Code and GST Compliance Fields
-- Created: 2025-12-08
-- Purpose: Add HSN/SAC codes and GST breakdown for invoice compliance

-- =================================================================
-- TABLE 1: Add HSN code reference table
-- Purpose: Store HSN/SAC codes for different service types
-- =================================================================
CREATE TABLE IF NOT EXISTS hsn_codes (
    id VARCHAR(36) PRIMARY KEY,
    hsn_code VARCHAR(10) NOT NULL UNIQUE COMMENT 'HSN/SAC code',
    description VARCHAR(255) NOT NULL COMMENT 'Service description',
    gst_rate DECIMAL(5,2) DEFAULT 18.00 COMMENT 'Default GST rate for this service',
    is_active BOOLEAN DEFAULT TRUE COMMENT 'Active status',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_hsn_code (hsn_code),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='HSN/SAC codes for GST compliance';

-- Seed HSN codes for educational services
INSERT INTO hsn_codes (id, hsn_code, description, gst_rate, is_active)
VALUES
    (UUID(), '999210', 'Pre-School', 18.00, TRUE),
    (UUID(), '999351', 'Daycare', 18.00, TRUE)
ON DUPLICATE KEY UPDATE description = VALUES(description);

-- =================================================================
-- TABLE 2: Add GSTIN to centers table
-- Purpose: Store center's GST registration details
-- =================================================================
ALTER TABLE centers
ADD COLUMN IF NOT EXISTS gstin VARCHAR(15) NULL COMMENT 'GST Identification Number',
ADD COLUMN IF NOT EXISTS pan VARCHAR(10) NULL COMMENT 'PAN number',
ADD COLUMN IF NOT EXISTS state_code VARCHAR(2) NULL COMMENT 'State code for GST',
ADD COLUMN IF NOT EXISTS billing_address TEXT NULL COMMENT 'Billing address for invoices',
ADD COLUMN IF NOT EXISTS place_of_supply VARCHAR(100) NULL COMMENT 'Place of supply for GST';

-- =================================================================
-- TABLE 3: Update invoices table with GST breakdown
-- Purpose: Add GST compliance fields for invoices
-- =================================================================
ALTER TABLE invoices
ADD COLUMN IF NOT EXISTS hsn_code VARCHAR(10) NULL COMMENT 'HSN/SAC code for service',
ADD COLUMN IF NOT EXISTS subtotal_before_tax DECIMAL(10,2) NULL COMMENT 'Subtotal before GST',
ADD COLUMN IF NOT EXISTS cgst_rate DECIMAL(5,2) NULL COMMENT 'CGST rate',
ADD COLUMN IF NOT EXISTS cgst_amount DECIMAL(10,2) NULL COMMENT 'CGST amount',
ADD COLUMN IF NOT EXISTS sgst_rate DECIMAL(5,2) NULL COMMENT 'SGST rate',
ADD COLUMN IF NOT EXISTS sgst_amount DECIMAL(10,2) NULL COMMENT 'SGST amount',
ADD COLUMN IF NOT EXISTS igst_rate DECIMAL(5,2) NULL COMMENT 'IGST rate',
ADD COLUMN IF NOT EXISTS igst_amount DECIMAL(10,2) NULL COMMENT 'IGST amount',
ADD COLUMN IF NOT EXISTS place_of_supply VARCHAR(100) NULL COMMENT 'Place of supply',
ADD COLUMN IF NOT EXISTS is_interstate BOOLEAN DEFAULT FALSE COMMENT 'Interstate transaction flag';

CREATE INDEX IF NOT EXISTS idx_hsn_code ON invoices(hsn_code);

-- =================================================================
-- TABLE 4: Update invoice_line_items with HSN and tax details
-- Purpose: Add HSN code and GST breakdown per line item
-- =================================================================
ALTER TABLE invoice_line_items
ADD COLUMN IF NOT EXISTS hsn_code VARCHAR(10) NULL COMMENT 'HSN/SAC code for line item',
ADD COLUMN IF NOT EXISTS base_amount DECIMAL(10,2) NULL COMMENT 'Amount before tax',
ADD COLUMN IF NOT EXISTS cgst_rate DECIMAL(5,2) NULL COMMENT 'CGST rate',
ADD COLUMN IF NOT EXISTS cgst_amount DECIMAL(10,2) NULL COMMENT 'CGST amount',
ADD COLUMN IF NOT EXISTS sgst_rate DECIMAL(5,2) NULL COMMENT 'SGST rate',
ADD COLUMN IF NOT EXISTS sgst_amount DECIMAL(10,2) NULL COMMENT 'SGST amount',
ADD COLUMN IF NOT EXISTS igst_rate DECIMAL(5,2) NULL COMMENT 'IGST rate',
ADD COLUMN IF NOT EXISTS igst_amount DECIMAL(10,2) NULL COMMENT 'IGST amount',
ADD COLUMN IF NOT EXISTS total_price DECIMAL(10,2) NULL COMMENT 'Total including tax';

CREATE INDEX IF NOT EXISTS idx_line_item_hsn ON invoice_line_items(hsn_code);

-- =================================================================
-- TABLE 5: Add service_type to children/classrooms for HSN mapping
-- Purpose: Map classrooms to appropriate HSN codes
-- =================================================================
ALTER TABLE classrooms
ADD COLUMN IF NOT EXISTS service_type ENUM('Pre-School', 'Daycare') DEFAULT 'Pre-School' COMMENT 'Type of service for HSN code mapping',
ADD COLUMN IF NOT EXISTS hsn_code VARCHAR(10) NULL COMMENT 'Default HSN code for this classroom';

-- Update existing classrooms with default HSN code
UPDATE classrooms
SET service_type = 'Pre-School',
    hsn_code = '999210'
WHERE hsn_code IS NULL;

-- =================================================================
-- Validation and Documentation
-- =================================================================
-- Note: GST Structure
-- For Intrastate (same state): CGST + SGST = Total GST (9% + 9% = 18%)
-- For Interstate (different state): IGST = Total GST (18%)
--
-- HSN Codes for Educational Services:
-- 999210 - Pre-School Education
-- 999351 - Daycare Services
--
-- Invoice must contain:
-- 1. GSTIN of supplier (center)
-- 2. HSN/SAC code
-- 3. Taxable amount
-- 4. GST breakdown (CGST/SGST or IGST)
-- 5. Place of supply
-- 6. Total amount

SELECT '✅ Migration 049 completed: HSN code and GST compliance fields added' as status;
