-- Fix missing columns for MySQL database compatibility
-- This migration adds all the missing columns that the application code expects

-- 1. Fix invoices table - add missing parent and amount columns
ALTER TABLE invoices 
ADD COLUMN IF NOT EXISTS parent_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS parent_phone VARCHAR(20),
ADD COLUMN IF NOT EXISTS parent_email VARCHAR(255),
ADD COLUMN IF NOT EXISTS total_amount DECIMAL(10, 2);

-- 2. Fix staff_assignments table - add center_id if missing
ALTER TABLE staff_assignments 
ADD COLUMN IF NOT EXISTS center_id VARCHAR(36);

-- 3. Add foreign key constraint for staff_assignments center_id if not exists
-- First check if the constraint doesn't already exist
SET @constraint_exists = (
    SELECT COUNT(*) 
    FROM information_schema.table_constraints 
    WHERE constraint_schema = DATABASE() 
    AND table_name = 'staff_assignments' 
    AND constraint_name = 'fk_staff_assignments_center'
);

SET @sql = IF(@constraint_exists = 0, 
    'ALTER TABLE staff_assignments ADD CONSTRAINT fk_staff_assignments_center FOREIGN KEY (center_id) REFERENCES centers(id) ON DELETE SET NULL',
    'SELECT "Constraint already exists" as message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 4. Update existing invoices to populate missing parent information from children/parents tables
UPDATE invoices i
JOIN children c ON i.child_id = c.id
LEFT JOIN parents p ON c.id = p.child_id
SET 
    i.parent_name = COALESCE(CONCAT(p.first_name, ' ', p.last_name), 'N/A'),
    i.parent_phone = COALESCE(p.phone_number, 'N/A'),
    i.parent_email = COALESCE(p.email, 'N/A')
WHERE i.parent_name IS NULL OR i.parent_name = '';

-- 5. Update existing invoices to populate total_amount from line items
UPDATE invoices i
SET i.total_amount = (
    SELECT COALESCE(SUM(ili.total_price), 0)
    FROM invoice_line_items ili
    WHERE ili.invoice_id = i.id
)
WHERE i.total_amount IS NULL;

-- 6. Update staff_assignments to populate center_id based on user's center
UPDATE staff_assignments sa
JOIN users u ON sa.user_id = u.id
SET sa.center_id = u.center_id
WHERE sa.center_id IS NULL AND u.center_id IS NOT NULL;

-- 7. For staff_assignments where user doesn't have center_id, use default center
UPDATE staff_assignments sa
JOIN users u ON sa.user_id = u.id
SET sa.center_id = 'default-center-001'
WHERE sa.center_id IS NULL;

-- 8. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_invoices_parent_name ON invoices(parent_name);
CREATE INDEX IF NOT EXISTS idx_invoices_total_amount ON invoices(total_amount);
CREATE INDEX IF NOT EXISTS idx_staff_assignments_center_id ON staff_assignments(center_id);

-- 9. Update any NULL center_id references to use default center
UPDATE invoices SET center_id = 'default-center-001' WHERE center_id IS NULL;
UPDATE staff_assignments SET center_id = 'default-center-001' WHERE center_id IS NULL;