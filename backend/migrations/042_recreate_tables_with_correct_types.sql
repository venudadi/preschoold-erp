-- =====================================================
-- Migration 042: Recreate Tables with Correct Types
-- =====================================================
-- Since tables are empty, drop and recreate with VARCHAR(36)
-- =====================================================

-- DROP problematic tables (they're empty anyway)
DROP TABLE IF EXISTS observation_logs;
DROP TABLE IF EXISTS lesson_plans;
DROP TABLE IF EXISTS attendance;
DROP TABLE IF EXISTS messaging;
DROP TABLE IF EXISTS parent_feedback;
DROP TABLE IF EXISTS staff_performance;
DROP TABLE IF EXISTS staff_schedules;
DROP TABLE IF EXISTS teacher_classes;

-- RECREATE observation_logs with correct types
CREATE TABLE observation_logs (
    id VARCHAR(36) PRIMARY KEY,
    child_id VARCHAR(36) NOT NULL,
    center_id VARCHAR(36) NULL,
    observer_id VARCHAR(36) NULL,
    observation_date DATE NOT NULL,
    observation_time TIME NOT NULL,
    category VARCHAR(100) NULL,
    observation TEXT NOT NULL,
    developmental_area VARCHAR(100) NULL,
    notes TEXT NULL,
    is_significant BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE CASCADE,
    FOREIGN KEY (center_id) REFERENCES centers(id) ON DELETE CASCADE,
    FOREIGN KEY (observer_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_observation_logs_child_id ON observation_logs(child_id);
CREATE INDEX idx_observation_logs_observation_date ON observation_logs(observation_date);
CREATE INDEX idx_observation_logs_child_observation_date ON observation_logs(child_id, observation_date DESC);

-- RECREATE lesson_plans with correct types
CREATE TABLE lesson_plans (
    id VARCHAR(36) PRIMARY KEY,
    teacher_id VARCHAR(36) NOT NULL,
    classroom_id VARCHAR(36) NOT NULL,
    center_id VARCHAR(36) NULL,
    week_start_date DATE NOT NULL,
    week_end_date DATE NOT NULL,
    theme VARCHAR(255),
    objectives TEXT,
    activities TEXT,
    materials TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (classroom_id) REFERENCES classrooms(id) ON DELETE CASCADE,
    FOREIGN KEY (center_id) REFERENCES centers(id) ON DELETE CASCADE
);

CREATE INDEX idx_lesson_plans_teacher_id ON lesson_plans(teacher_id);
CREATE INDEX idx_lesson_plans_classroom_id ON lesson_plans(classroom_id);
CREATE INDEX idx_lesson_plans_center_id ON lesson_plans(center_id);

-- RECREATE attendance with correct types
CREATE TABLE attendance (
    id VARCHAR(36) PRIMARY KEY,
    child_id VARCHAR(36) NOT NULL,
    center_id VARCHAR(36) NOT NULL,
    date DATE NOT NULL,
    status ENUM('present', 'absent', 'late', 'half_day') NOT NULL,
    check_in_time TIME NULL,
    check_out_time TIME NULL,
    notes TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE CASCADE,
    FOREIGN KEY (center_id) REFERENCES centers(id) ON DELETE CASCADE
);

CREATE INDEX idx_attendance_child_id ON attendance(child_id);
CREATE INDEX idx_attendance_center_id ON attendance(center_id);
CREATE INDEX idx_attendance_date ON attendance(date);

-- RECREATE messaging with correct types
CREATE TABLE messaging (
    id VARCHAR(36) PRIMARY KEY,
    sender_id VARCHAR(36) NOT NULL,
    recipient_id VARCHAR(36) NOT NULL,
    subject VARCHAR(255),
    message TEXT NOT NULL,
    read_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (recipient_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_messaging_sender_id ON messaging(sender_id);
CREATE INDEX idx_messaging_recipient_id ON messaging(recipient_id);
CREATE INDEX idx_messaging_created_at ON messaging(created_at DESC);

-- RECREATE parent_feedback with correct types
CREATE TABLE parent_feedback (
    id VARCHAR(36) PRIMARY KEY,
    center_id VARCHAR(36) NOT NULL,
    parent_id VARCHAR(36) NOT NULL,
    child_id VARCHAR(36) NULL,
    feedback_type ENUM('compliment', 'concern', 'suggestion', 'question') NOT NULL,
    subject VARCHAR(255),
    feedback TEXT NOT NULL,
    status ENUM('pending', 'reviewed', 'resolved') DEFAULT 'pending',
    response TEXT NULL,
    responded_by VARCHAR(36) NULL,
    responded_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (center_id) REFERENCES centers(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE SET NULL
);

CREATE INDEX idx_parent_feedback_center_id ON parent_feedback(center_id);
CREATE INDEX idx_parent_feedback_parent_id ON parent_feedback(parent_id);
CREATE INDEX idx_parent_feedback_status ON parent_feedback(status);

-- RECREATE staff_performance with correct types
CREATE TABLE staff_performance (
    id VARCHAR(36) PRIMARY KEY,
    center_id VARCHAR(36) NOT NULL,
    staff_id VARCHAR(36) NOT NULL,
    evaluator_id VARCHAR(36) NULL,
    evaluation_date DATE NOT NULL,
    performance_period_start DATE NOT NULL,
    performance_period_end DATE NOT NULL,
    overall_rating DECIMAL(3,2),
    strengths TEXT,
    areas_for_improvement TEXT,
    goals TEXT,
    comments TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (center_id) REFERENCES centers(id) ON DELETE CASCADE,
    FOREIGN KEY (staff_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (evaluator_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_staff_performance_center_id ON staff_performance(center_id);
CREATE INDEX idx_staff_performance_staff_id ON staff_performance(staff_id);
CREATE INDEX idx_staff_performance_evaluation_date ON staff_performance(evaluation_date);

-- RECREATE staff_schedules with correct types
CREATE TABLE staff_schedules (
    id VARCHAR(36) PRIMARY KEY,
    center_id VARCHAR(36) NOT NULL,
    staff_id VARCHAR(36) NOT NULL,
    schedule_date DATE NOT NULL,
    shift_start TIME NOT NULL,
    shift_end TIME NOT NULL,
    schedule_type ENUM('regular', 'overtime', 'on_call') DEFAULT 'regular',
    notes TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (center_id) REFERENCES centers(id) ON DELETE CASCADE,
    FOREIGN KEY (staff_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_staff_schedules_center_id ON staff_schedules(center_id);
CREATE INDEX idx_staff_schedules_staff_id ON staff_schedules(staff_id);
CREATE INDEX idx_staff_schedules_date ON staff_schedules(schedule_date);

-- RECREATE teacher_classes with correct types
CREATE TABLE teacher_classes (
    id VARCHAR(36) PRIMARY KEY,
    teacher_id VARCHAR(36) NOT NULL,
    classroom_id VARCHAR(36) NOT NULL,
    center_id VARCHAR(36) NOT NULL,
    academic_year VARCHAR(20) NOT NULL,
    is_primary BOOLEAN DEFAULT TRUE,
    start_date DATE NOT NULL,
    end_date DATE NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (classroom_id) REFERENCES classrooms(id) ON DELETE CASCADE,
    FOREIGN KEY (center_id) REFERENCES centers(id) ON DELETE CASCADE
);

CREATE INDEX idx_teacher_classes_teacher_id ON teacher_classes(teacher_id);
CREATE INDEX idx_teacher_classes_classroom_id ON teacher_classes(classroom_id);
CREATE INDEX idx_teacher_classes_center_id ON teacher_classes(center_id);

-- Fix remaining tables that need NULL constraints
ALTER TABLE emergency_procedures
MODIFY COLUMN created_by VARCHAR(36) NULL;

ALTER TABLE emergency_drill_logs
MODIFY COLUMN conducted_by VARCHAR(36) NULL;

ALTER TABLE daily_food_tracking
MODIFY COLUMN recorded_by VARCHAR(36) NULL;

-- Add created_by to emergency_alerts
ALTER TABLE emergency_alerts
ADD COLUMN created_by VARCHAR(36) NULL;

-- Now add all remaining FK constraints that couldn't be added before

-- student_pause_history
ALTER TABLE student_pause_history
ADD CONSTRAINT fk_student_pause_history_paused_by
FOREIGN KEY (paused_by) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE student_pause_history
ADD CONSTRAINT fk_student_pause_history_resumed_by
FOREIGN KEY (resumed_by) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE student_pause_history
ADD CONSTRAINT fk_student_pause_history_center
FOREIGN KEY (center_id) REFERENCES centers(id) ON DELETE CASCADE;

-- emergency_alerts
ALTER TABLE emergency_alerts
ADD CONSTRAINT fk_emergency_alerts_created_by
FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE emergency_alerts
ADD CONSTRAINT fk_emergency_alerts_resolved_by
FOREIGN KEY (resolved_by) REFERENCES users(id) ON DELETE SET NULL;

-- emergency_procedures
ALTER TABLE emergency_procedures
ADD CONSTRAINT fk_emergency_procedures_created_by
FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;

-- emergency_drill_logs
ALTER TABLE emergency_drill_logs
ADD CONSTRAINT fk_emergency_drill_logs_conducted_by
FOREIGN KEY (conducted_by) REFERENCES users(id) ON DELETE SET NULL;

-- daily_food_tracking
ALTER TABLE daily_food_tracking
ADD CONSTRAINT fk_daily_food_tracking_recorded_by
FOREIGN KEY (recorded_by) REFERENCES users(id) ON DELETE SET NULL;

-- daily_sleep_tracking
ALTER TABLE daily_sleep_tracking
ADD CONSTRAINT fk_daily_sleep_tracking_recorded_by
FOREIGN KEY (recorded_by) REFERENCES users(id) ON DELETE SET NULL;

-- daily_potty_tracking
ALTER TABLE daily_potty_tracking
ADD CONSTRAINT fk_daily_potty_tracking_recorded_by
FOREIGN KEY (recorded_by) REFERENCES users(id) ON DELETE SET NULL;

-- budget_approval_limits
ALTER TABLE budget_approval_limits
ADD CONSTRAINT fk_budget_approval_limits_user
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- =====================================================
-- Migration complete
-- =====================================================
