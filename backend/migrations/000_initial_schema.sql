-- ================================================================
-- PRESCHOOL ERP - INITIAL DATABASE SCHEMA
-- ================================================================
-- This migration creates all base tables that other migrations depend on
-- Tables are created without foreign keys or indexes first
-- Then indexes and FKs are added separately
-- ================================================================

-- ================================================================
-- PHASE 1: CREATE BASE TABLES (NO INDEXES, NO FOREIGN KEYS)
-- ================================================================

-- Core Users Table
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('super_admin', 'admin', 'owner', 'teacher', 'parent', 'financial_manager', 'center_director') NOT NULL DEFAULT 'teacher',
    full_name VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20),
    parent_id VARCHAR(36),
    last_login TIMESTAMP NULL,
    failed_login_attempts INT DEFAULT 0,
    locked_until TIMESTAMP NULL,
    password_reset_token VARCHAR(255) NULL,
    password_reset_expires TIMESTAMP NULL,
    email_verified BOOLEAN DEFAULT 0,
    phone_verified BOOLEAN DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    must_reset_password BOOLEAN DEFAULT FALSE,
    two_fa_enabled BOOLEAN DEFAULT FALSE,
    two_fa_secret VARCHAR(255),
    center_id VARCHAR(36),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Centers Table
CREATE TABLE IF NOT EXISTS centers (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    phone_number VARCHAR(20),
    email VARCHAR(255),
    manager_user_id VARCHAR(36),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Classrooms Table
CREATE TABLE IF NOT EXISTS classrooms (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    capacity INT NOT NULL DEFAULT 20,
    age_group VARCHAR(50),
    center_id VARCHAR(36),
    teacher_id VARCHAR(36),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Children/Students Table
CREATE TABLE IF NOT EXISTS children (
    id VARCHAR(36) PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    date_of_birth DATE NOT NULL,
    gender ENUM('Male', 'Female', 'Other'),
    admission_number VARCHAR(50) UNIQUE,
    classroom_id VARCHAR(36),
    center_id VARCHAR(36),
    medical_info TEXT,
    allergies TEXT,
    emergency_contact_name VARCHAR(255),
    emergency_contact_phone VARCHAR(20),
    verification_code VARCHAR(8) NULL,
    verification_code_expires TIMESTAMP NULL,
    is_active BOOLEAN DEFAULT TRUE,
    is_paused BOOLEAN DEFAULT FALSE,
    paused_at TIMESTAMP NULL,
    paused_by_user_id VARCHAR(36),
    pause_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Parents Table
CREATE TABLE IF NOT EXISTS parents (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE,
    phone_number VARCHAR(20),
    relationship_to_child ENUM('Mother', 'Father', 'Guardian', 'Other') DEFAULT 'Guardian',
    is_primary_contact BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Parent-Child Relationship Table
CREATE TABLE IF NOT EXISTS parent_children (
    id VARCHAR(36) PRIMARY KEY,
    parent_id VARCHAR(36) NOT NULL,
    child_id VARCHAR(36) NOT NULL,
    relationship_type ENUM('Mother', 'Father', 'Guardian', 'Other') DEFAULT 'Guardian',
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_parent_child (parent_id, child_id)
);

-- Staff Table
CREATE TABLE IF NOT EXISTS staff (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36),
    employee_id VARCHAR(50) UNIQUE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE,
    phone_number VARCHAR(20),
    position VARCHAR(100),
    department VARCHAR(100),
    hire_date DATE,
    center_id VARCHAR(36),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Staff Assignments Table
CREATE TABLE IF NOT EXISTS staff_assignments (
    id VARCHAR(36) PRIMARY KEY,
    staff_id VARCHAR(36) NOT NULL,
    classroom_id VARCHAR(36),
    center_id VARCHAR(36),
    role VARCHAR(100),
    start_date DATE,
    end_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Companies Table (for company tie-ups)
CREATE TABLE IF NOT EXISTS companies (
    id VARCHAR(36) PRIMARY KEY,
    company_name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255),
    email VARCHAR(255),
    phone_number VARCHAR(20),
    address TEXT,
    discount_percentage DECIMAL(5, 2) DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Enquiries Table
CREATE TABLE IF NOT EXISTS enquiries (
    id VARCHAR(36) PRIMARY KEY,
    parent_name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone_number VARCHAR(20) NOT NULL,
    child_name VARCHAR(255),
    child_age INT,
    preferred_start_date DATE,
    center_id VARCHAR(36),
    status ENUM('New', 'Contacted', 'Visit Scheduled', 'Enrolled', 'Declined') DEFAULT 'New',
    notes TEXT,
    assigned_to_user_id VARCHAR(36),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Invoices Table
CREATE TABLE IF NOT EXISTS invoices (
    id VARCHAR(36) PRIMARY KEY,
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    child_id VARCHAR(36) NOT NULL,
    center_id VARCHAR(36),
    parent_id VARCHAR(36),
    billing_period_start DATE NOT NULL,
    billing_period_end DATE NOT NULL,
    due_date DATE NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL DEFAULT 0,
    tax_amount DECIMAL(10, 2) DEFAULT 0,
    discount_amount DECIMAL(10, 2) DEFAULT 0,
    total_amount DECIMAL(10, 2) NOT NULL,
    amount_paid DECIMAL(10, 2) DEFAULT 0,
    balance DECIMAL(10, 2) NOT NULL,
    status ENUM('Draft', 'Sent', 'Partial', 'Paid', 'Overdue', 'Cancelled') DEFAULT 'Draft',
    payment_method ENUM('Cash', 'Card', 'Bank Transfer', 'Check', 'Online', 'Other'),
    payment_date DATE,
    notes TEXT,
    created_by_user_id VARCHAR(36),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Invoice Line Items Table
CREATE TABLE IF NOT EXISTS invoice_line_items (
    id VARCHAR(36) PRIMARY KEY,
    invoice_id VARCHAR(36) NOT NULL,
    description VARCHAR(255) NOT NULL,
    quantity INT DEFAULT 1,
    unit_price DECIMAL(10, 2) NOT NULL,
    discount_amount DECIMAL(10, 2) DEFAULT 0,
    tax_amount DECIMAL(10, 2) DEFAULT 0,
    total_amount DECIMAL(10, 2) NOT NULL,
    item_type ENUM('Tuition', 'Activity', 'Material', 'Transport', 'Meal', 'Late Fee', 'Other') DEFAULT 'Other',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ================================================================
-- PHASE 2: ADD INDEXES
-- ================================================================

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_center_id ON users(center_id);

CREATE INDEX idx_centers_manager ON centers(manager_user_id);
CREATE INDEX idx_centers_is_active ON centers(is_active);

CREATE INDEX idx_classrooms_center_id ON classrooms(center_id);
CREATE INDEX idx_classrooms_teacher_id ON classrooms(teacher_id);
CREATE INDEX idx_classrooms_is_active ON classrooms(is_active);

CREATE INDEX idx_children_classroom ON children(classroom_id);
CREATE INDEX idx_children_center ON children(center_id);
CREATE INDEX idx_children_is_active ON children(is_active);
CREATE INDEX idx_children_admission_number ON children(admission_number);
CREATE INDEX idx_children_full_name ON children(first_name, last_name);

CREATE INDEX idx_parents_user_id ON parents(user_id);
CREATE INDEX idx_parents_email ON parents(email);

CREATE INDEX idx_parent_children_parent ON parent_children(parent_id);
CREATE INDEX idx_parent_children_child ON parent_children(child_id);

CREATE INDEX idx_staff_user_id ON staff(user_id);
CREATE INDEX idx_staff_center_id ON staff(center_id);
CREATE INDEX idx_staff_employee_id ON staff(employee_id);
CREATE INDEX idx_staff_is_active ON staff(is_active);

CREATE INDEX idx_staff_assignments_staff ON staff_assignments(staff_id);
CREATE INDEX idx_staff_assignments_classroom ON staff_assignments(classroom_id);
CREATE INDEX idx_staff_assignments_center ON staff_assignments(center_id);
CREATE INDEX idx_staff_assignments_is_active ON staff_assignments(is_active);

CREATE INDEX idx_companies_company_name ON companies(company_name);
CREATE INDEX idx_companies_is_active ON companies(is_active);

CREATE INDEX idx_enquiries_center ON enquiries(center_id);
CREATE INDEX idx_enquiries_status ON enquiries(status);
CREATE INDEX idx_enquiries_assigned_to ON enquiries(assigned_to_user_id);

CREATE INDEX idx_invoices_invoice_number ON invoices(invoice_number);
CREATE INDEX idx_invoices_child ON invoices(child_id);
CREATE INDEX idx_invoices_center ON invoices(center_id);
CREATE INDEX idx_invoices_parent ON invoices(parent_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_due_date ON invoices(due_date);

CREATE INDEX idx_invoice_line_items_invoice ON invoice_line_items(invoice_id);
CREATE INDEX idx_invoice_line_items_item_type ON invoice_line_items(item_type);

-- ================================================================
-- PHASE 3: ADD FOREIGN KEY CONSTRAINTS
-- ================================================================

ALTER TABLE users
ADD CONSTRAINT fk_users_center
FOREIGN KEY (center_id) REFERENCES centers(id) ON DELETE SET NULL;

ALTER TABLE centers
ADD CONSTRAINT fk_centers_manager
FOREIGN KEY (manager_user_id) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE classrooms
ADD CONSTRAINT fk_classrooms_center
FOREIGN KEY (center_id) REFERENCES centers(id) ON DELETE CASCADE,
ADD CONSTRAINT fk_classrooms_teacher
FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE children
ADD CONSTRAINT fk_children_classroom
FOREIGN KEY (classroom_id) REFERENCES classrooms(id) ON DELETE SET NULL,
ADD CONSTRAINT fk_children_center
FOREIGN KEY (center_id) REFERENCES centers(id) ON DELETE CASCADE,
ADD CONSTRAINT fk_children_paused_by
FOREIGN KEY (paused_by_user_id) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE parents
ADD CONSTRAINT fk_parents_user
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE parent_children
ADD CONSTRAINT fk_parent_children_parent
FOREIGN KEY (parent_id) REFERENCES parents(id) ON DELETE CASCADE,
ADD CONSTRAINT fk_parent_children_child
FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE CASCADE;

ALTER TABLE staff
ADD CONSTRAINT fk_staff_user
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
ADD CONSTRAINT fk_staff_center
FOREIGN KEY (center_id) REFERENCES centers(id) ON DELETE CASCADE;

ALTER TABLE staff_assignments
ADD CONSTRAINT fk_staff_assignments_staff
FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE CASCADE,
ADD CONSTRAINT fk_staff_assignments_classroom
FOREIGN KEY (classroom_id) REFERENCES classrooms(id) ON DELETE SET NULL,
ADD CONSTRAINT fk_staff_assignments_center
FOREIGN KEY (center_id) REFERENCES centers(id) ON DELETE CASCADE;

ALTER TABLE enquiries
ADD CONSTRAINT fk_enquiries_center
FOREIGN KEY (center_id) REFERENCES centers(id) ON DELETE CASCADE,
ADD CONSTRAINT fk_enquiries_assigned_to
FOREIGN KEY (assigned_to_user_id) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE invoices
ADD CONSTRAINT fk_invoices_child
FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE CASCADE,
ADD CONSTRAINT fk_invoices_center
FOREIGN KEY (center_id) REFERENCES centers(id) ON DELETE CASCADE,
ADD CONSTRAINT fk_invoices_parent
FOREIGN KEY (parent_id) REFERENCES parents(id) ON DELETE SET NULL,
ADD CONSTRAINT fk_invoices_created_by
FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE invoice_line_items
ADD CONSTRAINT fk_invoice_items_invoice
FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE;

-- ================================================================
-- PHASE 4: CREATE STUDENTS VIEW
-- ================================================================

DROP VIEW IF EXISTS students;
CREATE VIEW students AS
SELECT
    id,
    first_name,
    last_name,
    date_of_birth,
    gender,
    admission_number,
    classroom_id,
    center_id,
    is_active,
    created_at,
    updated_at
FROM children;

-- ================================================================
-- INITIAL SCHEMA COMPLETE
-- ================================================================
