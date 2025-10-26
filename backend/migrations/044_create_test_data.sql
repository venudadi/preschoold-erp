-- ================================================================
-- TEST DATA CREATION MIGRATION
-- ================================================================
-- Creates test users for all roles with complete FK relationships
-- All test accounts use password: Test@123
-- ================================================================

-- Create test center first (required for FK constraints)
INSERT INTO centers (id, name, address, phone_number, email, is_active) VALUES
('test-center-1', 'Test Preschool Center', '123 Test Street, Test City', '555-0100', 'testcenter@vansris.com', TRUE)
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- Create test users for all roles
-- Password hash for 'Test@123' = $2b$10$8K1p/pxGKwU2YvnZ8Hc.5uKjKnmZxR.G9tqZ3xX5nVzN8vYrZqX5y
INSERT INTO users (id, username, email, password_hash, role, full_name, phone_number, center_id, is_active, email_verified, phone_verified, must_reset_password) VALUES
('test-super-admin', 'superadmin', 'superadmin@vansris.com', '$2b$10$8K1p/pxGKwU2YvnZ8Hc.5uKjKnmZxR.G9tqZ3xX5nVzN8vYrZqX5y', 'super_admin', 'Test Super Admin', '555-0001', NULL, TRUE, TRUE, TRUE, FALSE),
('test-owner', 'owner', 'owner@vansris.com', '$2b$10$8K1p/pxGKwU2YvnZ8Hc.5uKjKnmZxR.G9tqZ3xX5nVzN8vYrZqX5y', 'owner', 'Test Owner', '555-0002', 'test-center-1', TRUE, TRUE, TRUE, FALSE),
('test-center-director', 'director', 'director@vansris.com', '$2b$10$8K1p/pxGKwU2YvnZ8Hc.5uKjKnmZxR.G9tqZ3xX5nVzN8vYrZqX5y', 'center_director', 'Test Center Director', '555-0003', 'test-center-1', TRUE, TRUE, TRUE, FALSE),
('test-admin', 'admin', 'admin@vansris.com', '$2b$10$8K1p/pxGKwU2YvnZ8Hc.5uKjKnmZxR.G9tqZ3xX5nVzN8vYrZqX5y', 'admin', 'Test Admin', '555-0004', 'test-center-1', TRUE, TRUE, TRUE, FALSE),
('test-financial-manager', 'finance', 'finance@vansris.com', '$2b$10$8K1p/pxGKwU2YvnZ8Hc.5uKjKnmZxR.G9tqZ3xX5nVzN8vYrZqX5y', 'financial_manager', 'Test Financial Manager', '555-0005', 'test-center-1', TRUE, TRUE, TRUE, FALSE),
('test-teacher-1', 'teacher1', 'teacher1@vansris.com', '$2b$10$8K1p/pxGKwU2YvnZ8Hc.5uKjKnmZxR.G9tqZ3xX5nVzN8vYrZqX5y', 'teacher', 'Test Teacher One', '555-0006', 'test-center-1', TRUE, TRUE, TRUE, FALSE),
('test-teacher-2', 'teacher2', 'teacher2@vansris.com', '$2b$10$8K1p/pxGKwU2YvnZ8Hc.5uKjKnmZxR.G9tqZ3xX5nVzN8vYrZqX5y', 'teacher', 'Test Teacher Two', '555-0007', 'test-center-1', TRUE, TRUE, TRUE, FALSE),
('test-parent-1', 'parent1', 'parent1@vansris.com', '$2b$10$8K1p/pxGKwU2YvnZ8Hc.5uKjKnmZxR.G9tqZ3xX5nVzN8vYrZqX5y', 'parent', 'Test Parent One', '555-0008', 'test-center-1', TRUE, TRUE, TRUE, FALSE),
('test-parent-2', 'parent2', 'parent2@vansris.com', '$2b$10$8K1p/pxGKwU2YvnZ8Hc.5uKjKnmZxR.G9tqZ3xX5nVzN8vYrZqX5y', 'parent', 'Test Parent Two', '555-0009', 'test-center-1', TRUE, TRUE, TRUE, FALSE)
ON DUPLICATE KEY UPDATE
  password_hash=VALUES(password_hash),
  role=VALUES(role),
  full_name=VALUES(full_name);

-- Update center manager
UPDATE centers SET manager_user_id = 'test-center-director' WHERE id = 'test-center-1';

-- Create test classrooms
INSERT INTO classrooms (id, name, capacity, age_group, center_id, teacher_id, is_active) VALUES
('test-classroom-1', 'Sunshine Room', 15, '3-4 years', 'test-center-1', 'test-teacher-1', TRUE),
('test-classroom-2', 'Rainbow Room', 12, '4-5 years', 'test-center-1', 'test-teacher-2', TRUE)
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- Create test children
INSERT INTO children (id, first_name, last_name, date_of_birth, gender, admission_number, classroom_id, center_id, medical_info, allergies, emergency_contact_name, emergency_contact_phone, is_active) VALUES
('test-child-1', 'Alice', 'Johnson', '2021-03-15', 'Female', 'ADM001', 'test-classroom-1', 'test-center-1', 'No medical conditions', 'None', 'Parent One', '555-0008', TRUE),
('test-child-2', 'Bob', 'Smith', '2020-07-22', 'Male', 'ADM002', 'test-classroom-1', 'test-center-1', 'Asthma', 'Peanuts', 'Parent One', '555-0008', TRUE),
('test-child-3', 'Charlie', 'Brown', '2020-11-30', 'Male', 'ADM003', 'test-classroom-2', 'test-center-1', 'No medical conditions', 'None', 'Parent Two', '555-0009', TRUE),
('test-child-4', 'Diana', 'Davis', '2021-01-10', 'Female', 'ADM004', 'test-classroom-2', 'test-center-1', 'No medical conditions', 'Dairy', 'Parent Two', '555-0009', TRUE)
ON DUPLICATE KEY UPDATE first_name=VALUES(first_name);

-- Create parent records
INSERT INTO parents (id, user_id, first_name, last_name, email, phone_number, relationship_to_child, is_primary_contact) VALUES
('test-parent-rec-1', 'test-parent-1', 'Test', 'Parent One', 'parent1@vansris.com', '555-0008', 'Mother', TRUE),
('test-parent-rec-2', 'test-parent-2', 'Test', 'Parent Two', 'parent2@vansris.com', '555-0009', 'Father', TRUE)
ON DUPLICATE KEY UPDATE user_id=VALUES(user_id);

-- Create parent-child relationships
INSERT INTO parent_children (id, parent_id, child_id, relationship_type, is_primary) VALUES
('test-pc-1', 'test-parent-rec-1', 'test-child-1', 'Mother', TRUE),
('test-pc-2', 'test-parent-rec-1', 'test-child-2', 'Mother', TRUE),
('test-pc-3', 'test-parent-rec-2', 'test-child-3', 'Father', TRUE),
('test-pc-4', 'test-parent-rec-2', 'test-child-4', 'Father', TRUE)
ON DUPLICATE KEY UPDATE relationship_type=VALUES(relationship_type);

-- Create staff records for teachers and admin users
INSERT INTO staff (id, user_id, employee_id, first_name, last_name, email, phone_number, position, department, hire_date, center_id, is_active) VALUES
('test-staff-1', 'test-teacher-1', 'EMP001', 'Test', 'Teacher One', 'teacher1@vansris.com', '555-0006', 'Lead Teacher', 'Education', '2023-01-01', 'test-center-1', TRUE),
('test-staff-2', 'test-teacher-2', 'EMP002', 'Test', 'Teacher Two', 'teacher2@vansris.com', '555-0007', 'Assistant Teacher', 'Education', '2023-02-01', 'test-center-1', TRUE),
('test-staff-3', 'test-admin', 'EMP003', 'Test', 'Admin', 'admin@vansris.com', '555-0004', 'Administrator', 'Administration', '2022-06-01', 'test-center-1', TRUE),
('test-staff-4', 'test-center-director', 'EMP004', 'Test', 'Center Director', 'director@vansris.com', '555-0003', 'Center Director', 'Management', '2022-01-01', 'test-center-1', TRUE),
('test-staff-5', 'test-financial-manager', 'EMP005', 'Test', 'Financial Manager', 'finance@vansris.com', '555-0005', 'Financial Manager', 'Finance', '2022-03-01', 'test-center-1', TRUE)
ON DUPLICATE KEY UPDATE user_id=VALUES(user_id);

-- Create staff assignments
INSERT INTO staff_assignments (id, staff_id, classroom_id, center_id, role, start_date, is_active) VALUES
('test-assignment-1', 'test-staff-1', 'test-classroom-1', 'test-center-1', 'Lead Teacher', '2023-01-01', TRUE),
('test-assignment-2', 'test-staff-2', 'test-classroom-2', 'test-center-1', 'Assistant Teacher', '2023-02-01', TRUE)
ON DUPLICATE KEY UPDATE role=VALUES(role);

-- Create teacher-class relationships
INSERT INTO teacher_classes (teacher_id, classroom_id, center_id, is_primary) VALUES
('test-teacher-1', 'test-classroom-1', 'test-center-1', TRUE),
('test-teacher-2', 'test-classroom-2', 'test-center-1', TRUE)
ON DUPLICATE KEY UPDATE is_primary=VALUES(is_primary);

-- Create sample enquiry
INSERT INTO enquiries (id, parent_name, email, phone_number, child_name, child_age, preferred_start_date, center_id, status, notes, assigned_to_user_id) VALUES
('test-enquiry-1', 'John Doe', 'john.doe@example.com', '555-9999', 'Jane Doe', 3, CURDATE() + INTERVAL 1 MONTH, 'test-center-1', 'New', 'Looking for morning sessions', 'test-admin')
ON DUPLICATE KEY UPDATE status=VALUES(status);

-- Create sample fee structure
INSERT INTO fee_structures (id, center_id, age_group, monthly_fee, admission_fee, activity_fee, transport_fee, meal_fee, academic_year, is_active) VALUES
('test-fee-1', 'test-center-1', '3-4 years', 500.00, 100.00, 50.00, 30.00, 40.00, '2025', TRUE),
('test-fee-2', 'test-center-1', '4-5 years', 550.00, 100.00, 50.00, 30.00, 40.00, '2025', TRUE)
ON DUPLICATE KEY UPDATE monthly_fee=VALUES(monthly_fee);

-- Create sample invoices
INSERT INTO invoices (id, invoice_number, child_id, center_id, parent_id, billing_period_start, billing_period_end, due_date, subtotal, tax_amount, discount_amount, total_amount, amount_paid, balance, status, created_by_user_id) VALUES
('test-invoice-1', 'INV-2025-001', 'test-child-1', 'test-center-1', 'test-parent-rec-1', '2025-01-01', '2025-01-31', '2025-02-05', 500.00, 50.00, 0.00, 550.00, 0.00, 550.00, 'Sent', 'test-admin'),
('test-invoice-2', 'INV-2025-002', 'test-child-3', 'test-center-1', 'test-parent-rec-2', '2025-01-01', '2025-01-31', '2025-02-05', 550.00, 55.00, 0.00, 605.00, 605.00, 0.00, 'Paid', 'test-admin')
ON DUPLICATE KEY UPDATE status=VALUES(status);

-- Create sample attendance records
INSERT INTO attendance (child_id, center_id, date, status, check_in_time, check_out_time, notes) VALUES
('test-child-1', 'test-center-1', CURDATE(), 'present', '08:30:00', '15:30:00', 'On time'),
('test-child-2', 'test-center-1', CURDATE(), 'present', '08:45:00', '15:30:00', 'Slightly late'),
('test-child-3', 'test-center-1', CURDATE(), 'present', '08:30:00', '15:30:00', 'On time'),
('test-child-4', 'test-center-1', CURDATE(), 'absent', NULL, NULL, 'Sick')
ON DUPLICATE KEY UPDATE status=VALUES(status);

-- Create roles if not exist (for older schemas)
INSERT INTO roles (id, name, description) VALUES
('role-super-admin', 'Super Admin', 'Full system access'),
('role-owner', 'Owner', 'School owner with financial access'),
('role-center-director', 'Center Director', 'Center management access'),
('role-admin', 'Admin', 'Administrative access'),
('role-financial-manager', 'Financial Manager', 'Financial operations access'),
('role-teacher', 'Teacher', 'Classroom and student access'),
('role-parent', 'Parent', 'Parent portal access')
ON DUPLICATE KEY UPDATE description=VALUES(description);

-- Create budget approval limits for financial roles
INSERT INTO budget_approval_limits (user_id, center_id, monthly_limit, per_transaction_limit, requires_approval_above) VALUES
('test-financial-manager', 'test-center-1', 10000.00, 2000.00, 5000.00),
('test-center-director', 'test-center-1', 50000.00, 10000.00, 25000.00),
('test-owner', 'test-center-1', 999999.00, 999999.00, 999999.00)
ON DUPLICATE KEY UPDATE monthly_limit=VALUES(monthly_limit);

-- Create sample expenses
INSERT INTO expenses (expense_id, invoice_number, date, amount, description, category, payment_mode, vendor, created_by, status, approved_by) VALUES
('test-expense-1', 'EXP-2025-001', CURDATE(), 150.00, 'Office Supplies', 'Supplies', 'card', 'ABC Stationery', 'test-admin', 'approved', 'test-financial-manager'),
('test-expense-2', 'EXP-2025-002', CURDATE() - INTERVAL 1 DAY, 500.00, 'Monthly Internet', 'Utilities', 'bank_transfer', 'ISP Provider', 'test-admin', 'pending', NULL)
ON DUPLICATE KEY UPDATE status=VALUES(status);

-- Print summary of created test accounts
SELECT '==============================================' AS '';
SELECT 'TEST ACCOUNTS CREATED SUCCESSFULLY' AS '';
SELECT '==============================================' AS '';
SELECT 'All test accounts use password: Test@123' AS '';
SELECT '' AS '';
SELECT 'Super Admin: superadmin@vansris.com / superadmin' AS '';
SELECT 'Owner: owner@vansris.com / owner' AS '';
SELECT 'Center Director: director@vansris.com / director' AS '';
SELECT 'Admin: admin@vansris.com / admin' AS '';
SELECT 'Financial Manager: finance@vansris.com / finance' AS '';
SELECT 'Teacher 1: teacher1@vansris.com / teacher1' AS '';
SELECT 'Teacher 2: teacher2@vansris.com / teacher2' AS '';
SELECT 'Parent 1: parent1@vansris.com / parent1' AS '';
SELECT 'Parent 2: parent2@vansris.com / parent2' AS '';
SELECT '==============================================' AS '';