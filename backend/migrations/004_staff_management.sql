-- Staff Management System Migration
-- This script adds tables and relationships for staff management

-- 1. Create staff_profiles table
CREATE TABLE IF NOT EXISTS staff_profiles (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    center_id VARCHAR(36) NOT NULL,
    employee_id VARCHAR(50) UNIQUE,
    date_of_birth DATE,
    joining_date DATE NOT NULL,
    designation VARCHAR(100) NOT NULL,
    department VARCHAR(100),
    education_qualification TEXT,
    experience_years INT,
    specialization VARCHAR(255),
    contact_number VARCHAR(20),
    emergency_contact VARCHAR(20),
    address TEXT,
    document_status JSON,
    contract_type ENUM('full-time', 'part-time', 'contract', 'temporary') NOT NULL,
    active_status BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (center_id) REFERENCES centers(id) ON DELETE CASCADE
);

-- 2. Create staff_schedules table
CREATE TABLE IF NOT EXISTS staff_schedules (
    id VARCHAR(36) PRIMARY KEY,
    staff_id VARCHAR(36) NOT NULL,
    center_id VARCHAR(36) NOT NULL,
    day_of_week ENUM('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday') NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    break_start TIME,
    break_end TIME,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (staff_id) REFERENCES staff_profiles(id) ON DELETE CASCADE,
    FOREIGN KEY (center_id) REFERENCES centers(id) ON DELETE CASCADE
);

-- 3. Create staff_attendance table
CREATE TABLE IF NOT EXISTS staff_attendance (
    id VARCHAR(36) PRIMARY KEY,
    staff_id VARCHAR(36) NOT NULL,
    center_id VARCHAR(36) NOT NULL,
    date DATE NOT NULL,
    check_in TIMESTAMP,
    check_out TIMESTAMP,
    status ENUM('present', 'absent', 'late', 'half-day', 'on-leave') NOT NULL,
    remarks TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (staff_id) REFERENCES staff_profiles(id) ON DELETE CASCADE,
    FOREIGN KEY (center_id) REFERENCES centers(id) ON DELETE CASCADE
);

-- 4. Create staff_leaves table
CREATE TABLE IF NOT EXISTS staff_leaves (
    id VARCHAR(36) PRIMARY KEY,
    staff_id VARCHAR(36) NOT NULL,
    center_id VARCHAR(36) NOT NULL,
    leave_type ENUM('casual', 'sick', 'annual', 'maternity', 'paternity', 'unpaid') NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT,
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    approved_by VARCHAR(36),
    approval_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (staff_id) REFERENCES staff_profiles(id) ON DELETE CASCADE,
    FOREIGN KEY (center_id) REFERENCES centers(id) ON DELETE CASCADE,
    FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL
);

-- 5. Create staff_documents table
CREATE TABLE IF NOT EXISTS staff_documents (
    id VARCHAR(36) PRIMARY KEY,
    staff_id VARCHAR(36) NOT NULL,
    center_id VARCHAR(36) NOT NULL,
    document_type VARCHAR(100) NOT NULL,
    document_number VARCHAR(100),
    file_path VARCHAR(255) NOT NULL,
    expiry_date DATE,
    verification_status ENUM('pending', 'verified', 'rejected') DEFAULT 'pending',
    verified_by VARCHAR(36),
    verification_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (staff_id) REFERENCES staff_profiles(id) ON DELETE CASCADE,
    FOREIGN KEY (center_id) REFERENCES centers(id) ON DELETE CASCADE,
    FOREIGN KEY (verified_by) REFERENCES users(id) ON DELETE SET NULL
);

-- 6. Create staff_performance_reviews table
CREATE TABLE IF NOT EXISTS staff_performance_reviews (
    id VARCHAR(36) PRIMARY KEY,
    staff_id VARCHAR(36) NOT NULL,
    center_id VARCHAR(36) NOT NULL,
    review_period_start DATE NOT NULL,
    review_period_end DATE NOT NULL,
    reviewer_id VARCHAR(36) NOT NULL,
    performance_metrics JSON,
    overall_rating DECIMAL(3,2),
    comments TEXT,
    acknowledgement_date TIMESTAMP,
    status ENUM('draft', 'published', 'acknowledged') DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (staff_id) REFERENCES staff_profiles(id) ON DELETE CASCADE,
    FOREIGN KEY (center_id) REFERENCES centers(id) ON DELETE CASCADE,
    FOREIGN KEY (reviewer_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 7. Create staff_qualifications table
CREATE TABLE IF NOT EXISTS staff_qualifications (
    id VARCHAR(36) PRIMARY KEY,
    staff_id VARCHAR(36) NOT NULL,
    center_id VARCHAR(36) NOT NULL,
    qualification_type VARCHAR(100) NOT NULL,
    qualification_name VARCHAR(255) NOT NULL,
    institution VARCHAR(255) NOT NULL,
    completion_year YEAR,
    grade_or_score VARCHAR(50),
    document_path VARCHAR(255),
    verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (staff_id) REFERENCES staff_profiles(id) ON DELETE CASCADE,
    FOREIGN KEY (center_id) REFERENCES centers(id) ON DELETE CASCADE
);

-- 8. Create indexes for performance
CREATE INDEX idx_staff_profiles_center ON staff_profiles(center_id);
CREATE INDEX idx_staff_profiles_employee_id ON staff_profiles(employee_id);
CREATE INDEX idx_staff_schedules_staff_center ON staff_schedules(staff_id, center_id);
CREATE INDEX idx_staff_attendance_date ON staff_attendance(date);
CREATE INDEX idx_staff_attendance_staff_center ON staff_attendance(staff_id, center_id);
CREATE INDEX idx_staff_leaves_staff ON staff_leaves(staff_id);
CREATE INDEX idx_staff_leaves_dates ON staff_leaves(start_date, end_date);
CREATE INDEX idx_staff_documents_staff ON staff_documents(staff_id);
CREATE INDEX idx_staff_performance_staff ON staff_performance_reviews(staff_id);

-- 9. Add leave quota settings to centers table if not exists
ALTER TABLE centers 
ADD COLUMN IF NOT EXISTS leave_settings JSON;