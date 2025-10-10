-- Attendance System Migration
-- This script adds tables and relationships for attendance tracking

-- 1. Create attendance_records table
CREATE TABLE IF NOT EXISTS attendance_records (
    id VARCHAR(36) PRIMARY KEY,
    child_id VARCHAR(36) NOT NULL,
    center_id VARCHAR(36) NOT NULL,
    classroom_id VARCHAR(36) NOT NULL,
    date DATE NOT NULL,
    check_in TIMESTAMP,
    check_out TIMESTAMP,
    status VARCHAR(50) CHECK (role IN ('present', 'absent', 'late', 'half_day', 'excused')) NOT NULL,
    reason TEXT,
    marked_by VARCHAR(36) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ,
    FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE CASCADE,
    FOREIGN KEY (center_id) REFERENCES centers(id) ON DELETE CASCADE,
    FOREIGN KEY (classroom_id) REFERENCES classrooms(id) ON DELETE CASCADE,
    FOREIGN KEY (marked_by) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_attendance (child_id, date)
);

-- 2. Create attendance_notifications table
CREATE TABLE IF NOT EXISTS attendance_notifications (
    id VARCHAR(36) PRIMARY KEY,
    attendance_id VARCHAR(36) NOT NULL,
    parent_id VARCHAR(36) NOT NULL,
    type VARCHAR(50) CHECK (role IN ('check_in', 'check_out', 'absent', 'late')) NOT NULL,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    delivered_at TIMESTAMP,
    read_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (attendance_id) REFERENCES attendance_records(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_id) REFERENCES parents(id) ON DELETE CASCADE
);

-- 3. Create attendance_summaries table for reports
CREATE TABLE IF NOT EXISTS attendance_summaries (
    id VARCHAR(36) PRIMARY KEY,
    child_id VARCHAR(36) NOT NULL,
    classroom_id VARCHAR(36) NOT NULL,
    center_id VARCHAR(36) NOT NULL,
    month INT NOT NULL,
    year INT NOT NULL,
    total_days INT NOT NULL DEFAULT 0,
    present_days INT NOT NULL DEFAULT 0,
    absent_days INT NOT NULL DEFAULT 0,
    late_days INT NOT NULL DEFAULT 0,
    excused_days INT NOT NULL DEFAULT 0,
    last_calculated TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ,
    FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE CASCADE,
    FOREIGN KEY (classroom_id) REFERENCES classrooms(id) ON DELETE CASCADE,
    FOREIGN KEY (center_id) REFERENCES centers(id) ON DELETE CASCADE,
    UNIQUE KEY unique_summary (child_id, classroom_id, month, year)
);

-- 4. Create indexes for performance
CREATE INDEX idx_attendance_date ON attendance_records(date);
CREATE INDEX idx_attendance_child_id ON attendance_records(child_id);
CREATE INDEX idx_attendance_classroom_id ON attendance_records(classroom_id);
CREATE INDEX idx_attendance_center_id ON attendance_records(center_id);
CREATE INDEX idx_attendance_status ON attendance_records(status);
CREATE INDEX idx_summaries_month_year ON attendance_summaries(month, year);

-- 5. Create attendance settings table
CREATE TABLE IF NOT EXISTS attendance_settings (
    id VARCHAR(36) PRIMARY KEY,
    center_id VARCHAR(36) NOT NULL,
    late_threshold TIME DEFAULT '09:30:00',
    half_day_threshold TIME DEFAULT '12:00:00',
    notify_parents_on_absent BOOLEAN DEFAULT true,
    notify_parents_on_late BOOLEAN DEFAULT true,
    auto_mark_absent_time TIME DEFAULT '11:00:00',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ,
    FOREIGN KEY (center_id) REFERENCES centers(id) ON DELETE CASCADE,
    UNIQUE KEY unique_center_settings (center_id)
);

-- 6. Insert default attendance settings for existing centers
INSERT INTO attendance_settings (id, center_id)
SELECT UUID(), id FROM centers
ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP;