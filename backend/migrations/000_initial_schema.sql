-- ================================================================
-- PRESCHOOL ERP - INITIAL DATABASE SCHEMA
-- ================================================================
-- This migration creates all base tables that other migrations depend on
-- Tables are created without foreign keys first, then FKs are added
-- to handle circular dependencies

-- ================================================================
-- PHASE 1: CREATE BASE TABLES WITHOUT FOREIGN KEYS
-- ================================================================

-- Core Users Table (referenced by almost all other tables)
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('super_admin', 'admin', 'owner', 'teacher', 'parent', 'financial_manager', 'center_director') NOT NULL DEFAULT 'teacher',
    full_name VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    must_reset_password BOOLEAN DEFAULT FALSE,
    two_fa_enabled BOOLEAN DEFAULT FALSE,
    two_fa_secret VARCHAR(255),
    center_id VARCHAR(36),  -- FK added later
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_username (username),
    INDEX idx_role (role),
    INDEX idx_center_id (center_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Centers Table (has circular dependency with users)
CREATE TABLE IF NOT EXISTS centers (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    phone_number VARCHAR(20),
    email VARCHAR(255),
    manager_user_id VARCHAR(36),  -- FK added later
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_manager (manager_user_id),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Classrooms Table
CREATE TABLE IF NOT EXISTS classrooms (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    capacity INT NOT NULL DEFAULT 20,
    age_group VARCHAR(50),
    center_id VARCHAR(36),  -- FK added later
    teacher_id VARCHAR(36),  -- FK added later
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_center_id (center_id),
    INDEX idx_teacher_id (teacher_id),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Children/Students Table
CREATE TABLE IF NOT EXISTS children (
    id VARCHAR(36) PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    date_of_birth DATE NOT NULL,
    gender ENUM('Male', 'Female', 'Other'),
    admission_number VARCHAR(50) UNIQUE,
    classroom_id VARCHAR(36),  -- FK added later
    center_id VARCHAR(36),  -- FK added later
    medical_info TEXT,
    allergies TEXT,
    emergency_contact_name VARCHAR(255),
    emergency_contact_phone VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    is_paused BOOLEAN DEFAULT FALSE,
    paused_at TIMESTAMP NULL,
    paused_by_user_id VARCHAR(36),  -- FK added later
    pause_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_classroom (classroom_id),
    INDEX idx_center (center_id),
    INDEX idx_is_active (is_active),
    INDEX idx_admission_number (admission_number),
    INDEX idx_full_name (first_name, last_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Parents Table
CREATE TABLE IF NOT EXISTS parents (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36),  -- FK added later
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE,
    phone_number VARCHAR(20),
    relationship_to_child ENUM('Mother', 'Father', 'Guardian', 'Other') DEFAULT 'Guardian',
    is_primary_contact BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Parent-Child Relationship Table
CREATE TABLE IF NOT EXISTS parent_children (
    id VARCHAR(36) PRIMARY KEY,
    parent_id VARCHAR(36) NOT NULL,  -- FK added later
    child_id VARCHAR(36) NOT NULL,  -- FK added later
    relationship_type ENUM('Mother', 'Father', 'Guardian', 'Other') DEFAULT 'Guardian',
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_parent (parent_id),
    INDEX idx_child (child_id),
    UNIQUE KEY unique_parent_child (parent_id, child_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Staff Table
CREATE TABLE IF NOT EXISTS staff (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36),  -- FK added later
    employee_id VARCHAR(50) UNIQUE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE,
    phone_number VARCHAR(20),
    position VARCHAR(100),
    department VARCHAR(100),
    hire_date DATE,
    center_id VARCHAR(36),  -- FK added later
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_center_id (center_id),
    INDEX idx_employee_id (employee_id),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Staff Assignments Table
CREATE TABLE IF NOT EXISTS staff_assignments (
    id VARCHAR(36) PRIMARY KEY,
    staff_id VARCHAR(36) NOT NULL,  -- FK added later
    classroom_id VARCHAR(36),  -- FK added later
    center_id VARCHAR(36),  -- FK added later
    role VARCHAR(100),
    start_date DATE,
    end_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_staff (staff_id),
    INDEX idx_classroom (classroom_id),
    INDEX idx_center (center_id),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_company_name (company_name),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Enquiries Table
CREATE TABLE IF NOT EXISTS enquiries (
    id VARCHAR(36) PRIMARY KEY,
    parent_name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone_number VARCHAR(20) NOT NULL,
    child_name VARCHAR(255),
    child_age INT,
    preferred_start_date DATE,
    center_id VARCHAR(36),  -- FK added later
    status ENUM('New', 'Contacted', 'Visit Scheduled', 'Enrolled', 'Declined') DEFAULT 'New',
    notes TEXT,
    assigned_to_user_id VARCHAR(36),  -- FK added later
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_center (center_id),
    INDEX idx_status (status),
    INDEX idx_assigned_to (assigned_to_user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Invoices Table
CREATE TABLE IF NOT EXISTS invoices (
    id VARCHAR(36) PRIMARY KEY,
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    child_id VARCHAR(36) NOT NULL,  -- FK added later
    center_id VARCHAR(36),  -- FK added later
    parent_id VARCHAR(36),  -- FK added later
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
    created_by_user_id VARCHAR(36),  -- FK added later
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_invoice_number (invoice_number),
    INDEX idx_child (child_id),
    INDEX idx_center (center_id),
    INDEX idx_parent (parent_id),
    INDEX idx_status (status),
    INDEX idx_due_date (due_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Invoice Line Items Table
CREATE TABLE IF NOT EXISTS invoice_line_items (
    id VARCHAR(36) PRIMARY KEY,
    invoice_id VARCHAR(36) NOT NULL,  -- FK added later
    description VARCHAR(255) NOT NULL,
    quantity INT DEFAULT 1,
    unit_price DECIMAL(10, 2) NOT NULL,
    discount_amount DECIMAL(10, 2) DEFAULT 0,
    tax_amount DECIMAL(10, 2) DEFAULT 0,
    total_amount DECIMAL(10, 2) NOT NULL,
    item_type ENUM('Tuition', 'Activity', 'Material', 'Transport', 'Meal', 'Late Fee', 'Other') DEFAULT 'Other',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_invoice (invoice_id),
    INDEX idx_item_type (item_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================================
-- PHASE 2: ADD FOREIGN KEY CONSTRAINTS
-- ================================================================

-- Add FK for users.center_id → centers.id
ALTER TABLE users
ADD CONSTRAINT fk_users_center
FOREIGN KEY (center_id) REFERENCES centers(id) ON DELETE SET NULL;

-- Add FK for centers.manager_user_id → users.id
ALTER TABLE centers
ADD CONSTRAINT fk_centers_manager
FOREIGN KEY (manager_user_id) REFERENCES users(id) ON DELETE SET NULL;

-- Add FK for classrooms
ALTER TABLE classrooms
ADD CONSTRAINT fk_classrooms_center
FOREIGN KEY (center_id) REFERENCES centers(id) ON DELETE CASCADE,
ADD CONSTRAINT fk_classrooms_teacher
FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE SET NULL;

-- Add FK for children
ALTER TABLE children
ADD CONSTRAINT fk_children_classroom
FOREIGN KEY (classroom_id) REFERENCES classrooms(id) ON DELETE SET NULL,
ADD CONSTRAINT fk_children_center
FOREIGN KEY (center_id) REFERENCES centers(id) ON DELETE CASCADE,
ADD CONSTRAINT fk_children_paused_by
FOREIGN KEY (paused_by_user_id) REFERENCES users(id) ON DELETE SET NULL;

-- Add FK for parents
ALTER TABLE parents
ADD CONSTRAINT fk_parents_user
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Add FK for parent_children
ALTER TABLE parent_children
ADD CONSTRAINT fk_parent_children_parent
FOREIGN KEY (parent_id) REFERENCES parents(id) ON DELETE CASCADE,
ADD CONSTRAINT fk_parent_children_child
FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE CASCADE;

-- Add FK for staff
ALTER TABLE staff
ADD CONSTRAINT fk_staff_user
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
ADD CONSTRAINT fk_staff_center
FOREIGN KEY (center_id) REFERENCES centers(id) ON DELETE CASCADE;

-- Add FK for staff_assignments
ALTER TABLE staff_assignments
ADD CONSTRAINT fk_staff_assignments_staff
FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE CASCADE,
ADD CONSTRAINT fk_staff_assignments_classroom
FOREIGN KEY (classroom_id) REFERENCES classrooms(id) ON DELETE SET NULL,
ADD CONSTRAINT fk_staff_assignments_center
FOREIGN KEY (center_id) REFERENCES centers(id) ON DELETE CASCADE;

-- Add FK for enquiries
ALTER TABLE enquiries
ADD CONSTRAINT fk_enquiries_center
FOREIGN KEY (center_id) REFERENCES centers(id) ON DELETE CASCADE,
ADD CONSTRAINT fk_enquiries_assigned_to
FOREIGN KEY (assigned_to_user_id) REFERENCES users(id) ON DELETE SET NULL;

-- Add FK for invoices
ALTER TABLE invoices
ADD CONSTRAINT fk_invoices_child
FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE CASCADE,
ADD CONSTRAINT fk_invoices_center
FOREIGN KEY (center_id) REFERENCES centers(id) ON DELETE CASCADE,
ADD CONSTRAINT fk_invoices_parent
FOREIGN KEY (parent_id) REFERENCES parents(id) ON DELETE SET NULL,
ADD CONSTRAINT fk_invoices_created_by
FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON DELETE SET NULL;

-- Add FK for invoice_line_items
ALTER TABLE invoice_line_items
ADD CONSTRAINT fk_invoice_items_invoice
FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE;

-- ================================================================
-- PHASE 3: CREATE STUDENTS VIEW
-- ================================================================

-- Students is a VIEW based on children table (for backward compatibility)
CREATE OR REPLACE VIEW students AS
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
