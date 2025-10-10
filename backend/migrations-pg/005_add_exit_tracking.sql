-- Add exit tracking for students
ALTER TABLE students
ADD COLUMN status VARCHAR(50) CHECK (role IN ('active', 'inactive', 'left')) DEFAULT 'active',
ADD COLUMN exit_date DATE NULL,
ADD COLUMN exit_reason TEXT NULL,
ADD COLUMN exit_notes TEXT NULL;

-- Add exit tracking for staff/teachers
ALTER TABLE users
ADD COLUMN status VARCHAR(50) CHECK (role IN ('active', 'inactive', 'left')) DEFAULT 'active',
ADD COLUMN exit_date DATE NULL,
ADD COLUMN exit_reason TEXT NULL,
ADD COLUMN exit_notes TEXT NULL;

-- Create table for exit history (maintains record of all exits)
CREATE TABLE exit_records (
    id VARCHAR(36) PRIMARY KEY,
    person_id VARCHAR(36) NOT NULL,
    person_type VARCHAR(50) CHECK (role IN ('student', 'staff')) NOT NULL,
    exit_date DATE NOT NULL,
    exit_reason TEXT NOT NULL,
    exit_notes TEXT,
    center_id VARCHAR(36) NOT NULL,
    recorded_by VARCHAR(36) NOT NULL,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (center_id) REFERENCES centers(id),
    FOREIGN KEY (recorded_by) REFERENCES users(id)
);