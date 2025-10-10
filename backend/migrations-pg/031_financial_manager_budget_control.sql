-- 031_financial_manager_budget_control.sql
-- Add Financial Manager control over budget approval limits and oversight

-- Create budget_approval_limits table for Financial Manager to control limits
CREATE TABLE IF NOT EXISTS budget_approval_limits (
    id VARCHAR(36) PRIMARY KEY,
    center_id VARCHAR(36) NOT NULL,
    role VARCHAR(50) CHECK (role IN ('center_director', 'admin', 'academic_coordinator')) NOT NULL,
    user_id VARCHAR(36), -- Specific user override, NULL for role-based
    approval_limit DECIMAL(12,2) NOT NULL DEFAULT 0,
    category_limits JSON COMMENT 'Category-specific limits: {"operations": 10000, "staff": 5000}',
    fiscal_year INT NOT NULL,
    effective_date DATE NOT NULL,
    expiry_date DATE,
    created_by VARCHAR(36) NOT NULL COMMENT 'Financial Manager who set this limit',
    approved_by VARCHAR(36) COMMENT 'Higher authority approval if needed',
    notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ,

    UNIQUE KEY unique_role_center_year (center_id, role, fiscal_year, user_id),
    INDEX idx_budget_limits_center (center_id),
    INDEX idx_budget_limits_role (role),
    INDEX idx_budget_limits_active (is_active),
    INDEX idx_budget_limits_fiscal (fiscal_year)
)   ;

-- Create financial_oversight table for FM dashboard and reporting
CREATE TABLE IF NOT EXISTS financial_oversight (
    id VARCHAR(36) PRIMARY KEY,
    center_id VARCHAR(36) NOT NULL,
    oversight_type VARCHAR(50) CHECK (role IN ('budget_alert', 'limit_exceeded', 'unusual_spending', 'approval_required')) NOT NULL,
    severity VARCHAR(50) CHECK (role IN ('info', 'warning', 'critical')) NOT NULL DEFAULT 'info',
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    amount DECIMAL(12,2),
    related_request_id VARCHAR(36), -- Link to budget_approvals
    related_user_id VARCHAR(36), -- User who triggered this oversight
    action_required BOOLEAN DEFAULT FALSE,
    action_taken TEXT,
    handled_by VARCHAR(36), -- Financial Manager who handled it
    handled_at TIMESTAMP NULL,
    status VARCHAR(50) CHECK (role IN ('open', 'reviewing', 'resolved', 'dismissed')) DEFAULT 'open',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ,

    INDEX idx_oversight_center (center_id),
    INDEX idx_oversight_type (oversight_type),
    INDEX idx_oversight_status (status),
    INDEX idx_oversight_severity (severity),
    INDEX idx_oversight_date (created_at)
)   ;

-- Create budget_categories table for standardized categories
CREATE TABLE IF NOT EXISTS budget_categories (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    parent_category VARCHAR(36), -- For subcategories
    default_limit DECIMAL(12,2) DEFAULT 0,
    requires_justification BOOLEAN DEFAULT FALSE,
    requires_fm_approval BOOLEAN DEFAULT FALSE, -- Always requires FM approval regardless of amount
    is_active BOOLEAN DEFAULT TRUE,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_categories_active (is_active),
    INDEX idx_categories_parent (parent_category)
)   ;

-- Add Financial Manager role if it doesn't exist
ALTER TABLE users ALTER COLUMN role TYPE ENUM(
    'super_admin',
    'owner',
    'financial_manager',
    'center_director',
    'admin',
    'academic_coordinator',
    'teacher',
    'parent'
) NOT NULL;

-- Add financial management columns to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS financial_authority_level VARCHAR(50) CHECK (role IN ('none', 'center', 'multi_center', 'corporate')) DEFAULT 'none',
ADD COLUMN IF NOT EXISTS can_set_budget_limits BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS max_budget_authority DECIMAL(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS assigned_centers JSON COMMENT 'Centers this Financial Manager oversees';

-- Update budget_approvals table to track financial oversight
ALTER TABLE budget_approvals
ADD COLUMN IF NOT EXISTS fm_review_required BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS fm_reviewed_by VARCHAR(36),
ADD COLUMN IF NOT EXISTS fm_review_date TIMESTAMP NULL,
ADD COLUMN IF NOT EXISTS fm_review_notes TEXT,
ADD COLUMN IF NOT EXISTS escalated_to_fm BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS actual_approver_role VARCHAR(50) CHECK (role IN ('center_director', 'admin', 'financial_manager', 'owner', 'super_admin'));

-- Create budget approval workflow triggers
DELIMITER //

CREATE OR REPLACE TRIGGER check_budget_approval_limits
    BEFORE UPDATE ON budget_approvals
    FOR EACH ROW
BEGIN
    DECLARE user_limit DECIMAL(12,2) DEFAULT 0;
    DECLARE requires_fm BOOLEAN DEFAULT FALSE;

    -- Only check when status changes to 'approved'
    IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
        -- Get the approver's limit
        SELECT
            COALESCE(bal.approval_limit, u.budget_approval_limit, 0) INTO user_limit
        FROM users u
        LEFT JOIN budget_approval_limits bal ON (
            bal.center_id = (SELECT center_id FROM users WHERE id = NEW.approved_by)
            AND bal.role = (SELECT role FROM users WHERE id = NEW.approved_by)
            AND bal.is_active = TRUE
            AND bal.fiscal_year = YEAR(CURDATE())
        )
        WHERE u.id = NEW.approved_by;

        -- Check if category requires FM approval
        SELECT requires_fm_approval INTO requires_fm
        FROM budget_categories
        WHERE name = NEW.category;

        -- If amount exceeds limit or category requires FM approval, escalate
        IF NEW.amount > user_limit OR requires_fm = TRUE THEN
            SET NEW.fm_review_required = TRUE;
            SET NEW.escalated_to_fm = TRUE;

            -- Create oversight record
            INSERT INTO financial_oversight (
                id, center_id, oversight_type, severity, title, description,
                amount, related_request_id, related_user_id, action_required
            ) VALUES (
                UUID(),
                (SELECT center_id FROM users WHERE id = NEW.approved_by),
                'approval_required',
                CASE WHEN NEW.amount > user_limit * 2 THEN 'critical'
                     WHEN NEW.amount > user_limit * 1.5 THEN 'warning'
                     ELSE 'info' END,
                CONCAT('Budget approval exceeds authority: ', NEW.description),
                CONCAT('Amount: $', NEW.amount, ' exceeds approval limit of $', user_limit),
                NEW.amount,
                NEW.id,
                NEW.approved_by,
                TRUE
            );
        END IF;

        -- Set the actual approver role
        SET NEW.actual_approver_role = (SELECT role FROM users WHERE id = NEW.approved_by);
    END IF;
END//

DELIMITER ;

-- Insert default budget categories
INSERT IGNORE INTO budget_categories (id, name, description, default_limit, requires_justification, requires_fm_approval) VALUES
(UUID(), 'operations', 'General operational expenses', 5000, FALSE, FALSE),
(UUID(), 'staff', 'Staff-related expenses including overtime, bonuses', 3000, TRUE, FALSE),
(UUID(), 'maintenance', 'Facility maintenance and repairs', 2000, FALSE, FALSE),
(UUID(), 'supplies', 'Educational and office supplies', 1500, FALSE, FALSE),
(UUID(), 'marketing', 'Marketing and promotional activities', 2500, TRUE, FALSE),
(UUID(), 'technology', 'Technology equipment and software', 5000, TRUE, TRUE),
(UUID(), 'emergency', 'Emergency and urgent expenses', 10000, TRUE, TRUE),
(UUID(), 'other', 'Miscellaneous expenses', 1000, TRUE, FALSE);

-- Set default approval limits for existing centers (these will be managed by Financial Manager)
INSERT IGNORE INTO budget_approval_limits (id, center_id, role, approval_limit, fiscal_year, effective_date, created_by)
SELECT
    UUID(),
    c.id,
    'center_director',
    50000.00, -- Default limit, to be updated by Financial Manager
    YEAR(CURDATE()),
    CURDATE(),
    'system'
FROM centers c;

INSERT IGNORE INTO budget_approval_limits (id, center_id, role, approval_limit, fiscal_year, effective_date, created_by)
SELECT
    UUID(),
    c.id,
    'admin',
    15000.00, -- Default limit for admins
    YEAR(CURDATE()),
    CURDATE(),
    'system'
FROM centers c;

-- Update existing users with financial authority (to be properly set by system admin)
UPDATE users
SET financial_authority_level = 'corporate',
    can_set_budget_limits = TRUE,
    max_budget_authority = 500000.00
WHERE role = 'financial_manager';

UPDATE users
SET financial_authority_level = 'center',
    max_budget_authority = 100000.00
WHERE role = 'center_director';