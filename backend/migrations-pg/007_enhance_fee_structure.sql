-- Enhance fee_structures table with new columns
ALTER TABLE fee_structures
ADD COLUMN service_hours DECIMAL(4,2) AFTER program_name,
ADD COLUMN registration_fee DECIMAL(10,2) DEFAULT 10000.00,
ADD COLUMN security_deposit DECIMAL(10,2) DEFAULT 10000.00,
ADD COLUMN material_fee DECIMAL(10,2),
ADD COLUMN quarterly_discount_percent DECIMAL(5,2) DEFAULT 0.00,
ADD COLUMN annual_discount_percent DECIMAL(5,2) DEFAULT 0.00,
ADD COLUMN program_type VARCHAR(50) CHECK (role IN ('preschool', 'daycare')) 
    GENERATED ALWAYS AS (CASE WHEN service_hours > 4 THEN 'daycare' ELSE 'preschool' END) STORED,
ADD COLUMN age_group VARCHAR(50),
ADD COLUMN academic_year VARCHAR(9);

-- Create fee_components table for flexible fee management
CREATE TABLE fee_components (
    id VARCHAR(36) PRIMARY KEY,
    fee_structure_id VARCHAR(36) NOT NULL,
    name VARCHAR(100) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    component_type VARCHAR(50) CHECK (role IN ('one_time', 'recurring', 'annual')) NOT NULL,
    is_refundable BOOLEAN DEFAULT FALSE,
    is_optional BOOLEAN DEFAULT FALSE,
    applicable_months JSON,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ,
    FOREIGN KEY (fee_structure_id) REFERENCES fee_structures(id) ON DELETE CASCADE
);

-- Enhance students table with program timing
ALTER TABLE students
ADD COLUMN program_start_time TIME,
ADD COLUMN program_end_time TIME,
ADD COLUMN service_hours DECIMAL(4,2) 
    GENERATED ALWAYS AS (
        TIMESTAMPDIFF(MINUTE, program_start_time, program_end_time) / 60.0
    ) STORED;

-- Enhance invoices table with additional fields
ALTER TABLE invoices
ADD COLUMN fee_component_id VARCHAR(36),
ADD COLUMN billing_period_start DATE,
ADD COLUMN billing_period_end DATE,
ADD COLUMN payment_frequency VARCHAR(50) CHECK (role IN ('Monthly', 'Quarterly', 'Annually')) DEFAULT 'Monthly',
ADD FOREIGN KEY (fee_component_id) REFERENCES fee_components(id);

-- Add indexes for better performance
CREATE INDEX idx_fee_structures_program_type ON fee_structures(program_type);
CREATE INDEX idx_fee_structures_academic_year ON fee_structures(academic_year);
CREATE INDEX idx_fee_components_type ON fee_components(component_type);
CREATE INDEX idx_invoices_billing_period ON invoices(billing_period_start, billing_period_end);

-- Add default fee components for existing fee structures
INSERT INTO fee_components (
    id, 
    fee_structure_id, 
    name, 
    amount, 
    component_type, 
    is_refundable, 
    is_optional
)
SELECT 
    UUID(),
    id,
    'Registration Fee',
    10000.00,
    'one_time',
    FALSE,
    FALSE
FROM fee_structures
ON DUPLICATE KEY UPDATE amount = amount;