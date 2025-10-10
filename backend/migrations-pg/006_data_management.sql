-- Data Management System Migration
-- This script adds tables for backup management and data archival

-- 1. Create backup_logs table
CREATE TABLE IF NOT EXISTS backup_logs (
    id VARCHAR(36) PRIMARY KEY,
    backup_type VARCHAR(50) CHECK (role IN ('full', 'incremental', 'differential')) NOT NULL,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP,
    status VARCHAR(50) CHECK (role IN ('in_progress', 'completed', 'failed')) NOT NULL,
    file_path VARCHAR(255),
    file_size BIGINT,
    checksum VARCHAR(64),
    error_message TEXT,
    created_by VARCHAR(36),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- 2. Create archived_data table
CREATE TABLE IF NOT EXISTS archived_data (
    id VARCHAR(36) PRIMARY KEY,
    source_table VARCHAR(100) NOT NULL,
    record_id VARCHAR(36) NOT NULL,
    data JSON NOT NULL,
    archived_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    archived_by VARCHAR(36),
    reason VARCHAR(255),
    restore_status VARCHAR(50) CHECK (role IN ('none', 'requested', 'restored')) DEFAULT 'none',
    restore_requested_by VARCHAR(36),
    restore_requested_at TIMESTAMP,
    FOREIGN KEY (archived_by) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (restore_requested_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_source_record (source_table, record_id)
);

-- 3. Create data_validation_rules table
CREATE TABLE IF NOT EXISTS data_validation_rules (
    id VARCHAR(36) PRIMARY KEY,
    table_name VARCHAR(100) NOT NULL,
    column_name VARCHAR(100) NOT NULL,
    rule_type VARCHAR(50) CHECK (role IN ('required', 'format', 'range', 'unique', 'custom')) NOT NULL,
    rule_definition JSON NOT NULL,
    error_message VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ,
    UNIQUE KEY unique_table_column_rule (table_name, column_name, rule_type)
);

-- 4. Create data_validation_logs table
CREATE TABLE IF NOT EXISTS data_validation_logs (
    id VARCHAR(36) PRIMARY KEY,
    validation_rule_id VARCHAR(36) NOT NULL,
    table_name VARCHAR(100) NOT NULL,
    record_id VARCHAR(36) NOT NULL,
    validation_status VARCHAR(50) CHECK (role IN ('pass', 'fail')) NOT NULL,
    error_message VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (validation_rule_id) REFERENCES data_validation_rules(id) ON DELETE CASCADE,
    INDEX idx_validation_record (table_name, record_id)
);

-- 5. Create default validation rules
INSERT INTO data_validation_rules 
(id, table_name, column_name, rule_type, rule_definition, error_message)
VALUES
-- Email validation
(UUID(), 'users', 'email', 'format', 
 '{"pattern": "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$"}',
 'Invalid email format'),

-- Phone number validation
(UUID(), 'users', 'phone', 'format',
 '{"pattern": "^\\+?[1-9]\\d{1,14}$"}',
 'Invalid phone number format'),

-- Age validation for children
(UUID(), 'children', 'date_of_birth', 'range',
 '{"min": "2000-01-01", "max": "CURRENT_DATE"}',
 'Date of birth must be between 2000 and current date'),

-- Required fields for children
(UUID(), 'children', 'first_name', 'required',
 '{"required": true}',
 'First name is required'),

-- Unique employee ID
(UUID(), 'staff_profiles', 'employee_id', 'unique',
 '{"unique": true}',
 'Employee ID must be unique');

-- 6. Create archival triggers
DELIMITER //

CREATE TRIGGER before_delete_children
BEFORE DELETE ON children
FOR EACH ROW
BEGIN
    INSERT INTO archived_data (id, source_table, record_id, data, archived_by)
    VALUES (
        UUID(),
        'children',
        OLD.id,
        JSON_OBJECT(
            'id', OLD.id,
            'first_name', OLD.first_name,
            'last_name', OLD.last_name,
            'date_of_birth', OLD.date_of_birth,
            'center_id', OLD.center_id,
            'classroom_id', OLD.classroom_id,
            'created_at', OLD.created_at,
            'updated_at', OLD.updated_at
        ),
        @current_user_id
    );
END//

CREATE TRIGGER before_delete_staff_profiles
BEFORE DELETE ON staff_profiles
FOR EACH ROW
BEGIN
    INSERT INTO archived_data (id, source_table, record_id, data, archived_by)
    VALUES (
        UUID(),
        'staff_profiles',
        OLD.id,
        JSON_OBJECT(
            'id', OLD.id,
            'user_id', OLD.user_id,
            'employee_id', OLD.employee_id,
            'designation', OLD.designation,
            'department', OLD.department,
            'joining_date', OLD.joining_date,
            'created_at', OLD.created_at,
            'updated_at', OLD.updated_at
        ),
        @current_user_id
    );
END//

DELIMITER ;