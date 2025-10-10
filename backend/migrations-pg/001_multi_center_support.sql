-- Multi-Center Support Migration
-- This script adds missing tables and columns for multi-center functionality

-- 1. Create centers table
CREATE TABLE IF NOT EXISTS centers (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    phone_number VARCHAR(20),
    email VARCHAR(255),
    manager_user_id VARCHAR(36),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ,
    FOREIGN KEY (manager_user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Legacy compatibility: backfill name from center_name if such legacy column exists
ALTER TABLE centers ADD COLUMN name VARCHAR(255);
UPDATE centers SET name = center_name WHERE (name IS NULL OR name = '') AND center_name IS NOT NULL;
ALTER TABLE centers ALTER COLUMN name TYPE VARCHAR(255) NOT NULL;
ALTER TABLE centers DROP COLUMN center_name;

-- 2. Add center_id to users table if not exists
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS center_id VARCHAR(36),
ADD FOREIGN KEY (center_id) REFERENCES centers(id) ON DELETE SET NULL;

-- 3. Update user roles to include super_admin
ALTER TABLE users ALTER COLUMN role TYPE VARCHAR(50) CHECK (role IN ('super_admin', 'admin', 'owner', 'teacher', 'parent')) NOT NULL;

-- 4. Add center_id to tables that might be missing it
ALTER TABLE classrooms 
ADD COLUMN IF NOT EXISTS center_id VARCHAR(36),
ADD FOREIGN KEY (center_id) REFERENCES centers(id) ON DELETE CASCADE;

ALTER TABLE enquiries 
ADD COLUMN IF NOT EXISTS center_id VARCHAR(36),
ADD FOREIGN KEY (center_id) REFERENCES centers(id) ON DELETE CASCADE;

ALTER TABLE staff_assignments 
ADD COLUMN IF NOT EXISTS center_id VARCHAR(36),
ADD FOREIGN KEY (center_id) REFERENCES centers(id) ON DELETE CASCADE;

-- 5. Add missing fee_structures table (referenced in invoice code)
CREATE TABLE IF NOT EXISTS fee_structures (
    id VARCHAR(36) PRIMARY KEY,
    classroom_id VARCHAR(36) NOT NULL,
    center_id VARCHAR(36) NOT NULL,
    program_name VARCHAR(255) NOT NULL,
    monthly_fee DECIMAL(10, 2) NOT NULL,
    billing_frequency VARCHAR(50) CHECK (role IN ('Monthly', 'Quarterly', 'Annually')) DEFAULT 'Monthly',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ,
    FOREIGN KEY (classroom_id) REFERENCES classrooms(id) ON DELETE CASCADE,
    FOREIGN KEY (center_id) REFERENCES centers(id) ON DELETE CASCADE,
    UNIQUE KEY unique_classroom_program (classroom_id, program_name)
);

-- 6. Choose a valid default center id, prefer an existing one
SET @preferred_center_id := (SELECT id FROM centers WHERE name = 'Neldrac - Kondapur' LIMIT 1);
SET @existing_center_id := (SELECT id FROM centers LIMIT 1);
SET @default_center_id := COALESCE(@preferred_center_id, @existing_center_id, 'default-center-001');

-- Insert a default center only if centers table is empty
INSERT INTO centers (id, name, address, phone_number, email, is_active, created_at)
SELECT @default_center_id, 'Main Campus', 'Default Address - Please Update', '0000000000', 'admin@neldrac.com', 1, NOW()
WHERE NOT EXISTS (SELECT 1 FROM centers);

-- 7. Update existing records to use default center
UPDATE users SET center_id = @default_center_id WHERE center_id IS NULL;
UPDATE children SET center_id = @default_center_id WHERE center_id IS NULL;
UPDATE classrooms SET center_id = @default_center_id WHERE center_id IS NULL;
UPDATE enquiries SET center_id = @default_center_id WHERE center_id IS NULL;
UPDATE invoices SET center_id = @default_center_id WHERE center_id IS NULL;
UPDATE staff_assignments SET center_id = @default_center_id WHERE center_id IS NULL;

-- 8. Create indexes for performance
CREATE INDEX idx_users_center_id ON users(center_id);
CREATE INDEX idx_children_center_id ON children(center_id);
CREATE INDEX idx_classrooms_center_id ON classrooms(center_id);
CREATE INDEX idx_enquiries_center_id ON enquiries(center_id);
CREATE INDEX idx_invoices_center_id ON invoices(center_id);
CREATE INDEX idx_fee_structures_center_id ON fee_structures(center_id);

-- 9. Create sample fee structures for existing classrooms
INSERT INTO fee_structures (id, classroom_id, center_id, program_name, monthly_fee, billing_frequency, is_active)
SELECT 
    CONCAT(SUBSTR(MD5(RAND()), 1, 8), '-', SUBSTR(MD5(RAND()), 1, 4), '-', SUBSTR(MD5(RAND()), 1, 4), '-', SUBSTR(MD5(RAND()), 1, 4), '-', SUBSTR(MD5(RAND()), 1, 12)) as id,
    c.id as classroom_id,
    c.center_id,
    CONCAT(c.name, ' - Monthly Fee') as program_name,
    2500.00 as monthly_fee,
    'Monthly' as billing_frequency,
    1 as is_active
FROM classrooms c 
WHERE c.id NOT IN (SELECT DISTINCT classroom_id FROM fee_structures)
ON DUPLICATE KEY UPDATE program_name = program_name;