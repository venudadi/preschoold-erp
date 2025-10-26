-- =====================================================
-- Migration 040: Fix Schema Synchronization (Corrected)
-- =====================================================
-- Comprehensive fix for all data type mismatches and
-- missing FK constraints
-- =====================================================

-- STEP 1: Fix column data types to match VARCHAR(36)
-- =====================================================

-- Fix lesson_plans INT columns to VARCHAR(36)
ALTER TABLE lesson_plans
MODIFY COLUMN teacher_id VARCHAR(36) NOT NULL;

ALTER TABLE lesson_plans
MODIFY COLUMN classroom_id VARCHAR(36) NOT NULL;

-- Fix attendance INT columns to VARCHAR(36)
ALTER TABLE attendance
MODIFY COLUMN center_id VARCHAR(36) NOT NULL;

-- Fix messaging INT columns to VARCHAR(36)
ALTER TABLE messaging
MODIFY COLUMN sender_id VARCHAR(36) NOT NULL;

ALTER TABLE messaging
MODIFY COLUMN recipient_id VARCHAR(36) NOT NULL;

-- STEP 2: Fix NOT NULL constraints for SET NULL FK references
-- =====================================================

-- Fix emergency_procedures.created_by to allow NULL
ALTER TABLE emergency_procedures
MODIFY COLUMN created_by VARCHAR(36) NULL;

-- Fix emergency_drill_logs.conducted_by to allow NULL
ALTER TABLE emergency_drill_logs
MODIFY COLUMN conducted_by VARCHAR(36) NULL;

-- Fix daily tracking tables recorded_by to allow NULL
ALTER TABLE daily_food_tracking
MODIFY COLUMN recorded_by VARCHAR(36) NULL;

ALTER TABLE daily_sleep_tracking
MODIFY COLUMN recorded_by VARCHAR(36) NULL;

ALTER TABLE daily_potty_tracking
MODIFY COLUMN recorded_by VARCHAR(36) NULL;

-- STEP 3: Add missing columns
-- =====================================================

-- Add created_by to emergency_alerts if it doesn't exist
ALTER TABLE emergency_alerts
ADD COLUMN IF NOT EXISTS created_by VARCHAR(36) NULL;

-- STEP 4: Add all missing FK constraints
-- =====================================================

-- observation_logs FK constraints
ALTER TABLE observation_logs
ADD CONSTRAINT fk_observation_logs_child
FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE CASCADE;

ALTER TABLE observation_logs
ADD CONSTRAINT fk_observation_logs_center
FOREIGN KEY (center_id) REFERENCES centers(id) ON DELETE CASCADE;

ALTER TABLE observation_logs
ADD CONSTRAINT fk_observation_logs_observer
FOREIGN KEY (observer_id) REFERENCES users(id) ON DELETE SET NULL;

-- lesson_plans FK constraints
ALTER TABLE lesson_plans
ADD CONSTRAINT fk_lesson_plans_teacher
FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE lesson_plans
ADD CONSTRAINT fk_lesson_plans_classroom
FOREIGN KEY (classroom_id) REFERENCES classrooms(id) ON DELETE CASCADE;

ALTER TABLE lesson_plans
ADD CONSTRAINT fk_lesson_plans_center
FOREIGN KEY (center_id) REFERENCES centers(id) ON DELETE CASCADE;

-- student_pause_history FK constraints
ALTER TABLE student_pause_history
ADD CONSTRAINT fk_student_pause_history_student
FOREIGN KEY (student_id) REFERENCES children(id) ON DELETE CASCADE;

ALTER TABLE student_pause_history
ADD CONSTRAINT fk_student_pause_history_paused_by
FOREIGN KEY (paused_by) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE student_pause_history
ADD CONSTRAINT fk_student_pause_history_resumed_by
FOREIGN KEY (resumed_by) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE student_pause_history
ADD CONSTRAINT fk_student_pause_history_center
FOREIGN KEY (center_id) REFERENCES centers(id) ON DELETE CASCADE;

-- image_processing_jobs FK constraints
ALTER TABLE image_processing_jobs
ADD CONSTRAINT fk_image_processing_jobs_portfolio
FOREIGN KEY (portfolio_id) REFERENCES digital_portfolios(id) ON DELETE CASCADE;

-- emergency_alerts FK constraints
ALTER TABLE emergency_alerts
ADD CONSTRAINT fk_emergency_alerts_center
FOREIGN KEY (center_id) REFERENCES centers(id) ON DELETE CASCADE;

ALTER TABLE emergency_alerts
ADD CONSTRAINT fk_emergency_alerts_created_by
FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE emergency_alerts
ADD CONSTRAINT fk_emergency_alerts_resolved_by
FOREIGN KEY (resolved_by) REFERENCES users(id) ON DELETE SET NULL;

-- emergency_contacts FK constraints
ALTER TABLE emergency_contacts
ADD CONSTRAINT fk_emergency_contacts_center
FOREIGN KEY (center_id) REFERENCES centers(id) ON DELETE CASCADE;

-- emergency_procedures FK constraints
ALTER TABLE emergency_procedures
ADD CONSTRAINT fk_emergency_procedures_center
FOREIGN KEY (center_id) REFERENCES centers(id) ON DELETE CASCADE;

ALTER TABLE emergency_procedures
ADD CONSTRAINT fk_emergency_procedures_created_by
FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;

-- emergency_drill_logs FK constraints
ALTER TABLE emergency_drill_logs
ADD CONSTRAINT fk_emergency_drill_logs_center
FOREIGN KEY (center_id) REFERENCES centers(id) ON DELETE CASCADE;

ALTER TABLE emergency_drill_logs
ADD CONSTRAINT fk_emergency_drill_logs_procedure
FOREIGN KEY (procedure_id) REFERENCES emergency_procedures(id) ON DELETE CASCADE;

ALTER TABLE emergency_drill_logs
ADD CONSTRAINT fk_emergency_drill_logs_conducted_by
FOREIGN KEY (conducted_by) REFERENCES users(id) ON DELETE SET NULL;

-- daily_food_tracking FK constraints
ALTER TABLE daily_food_tracking
ADD CONSTRAINT fk_daily_food_tracking_child
FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE CASCADE;

ALTER TABLE daily_food_tracking
ADD CONSTRAINT fk_daily_food_tracking_recorded_by
FOREIGN KEY (recorded_by) REFERENCES users(id) ON DELETE SET NULL;

-- daily_sleep_tracking FK constraints
ALTER TABLE daily_sleep_tracking
ADD CONSTRAINT fk_daily_sleep_tracking_child
FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE CASCADE;

ALTER TABLE daily_sleep_tracking
ADD CONSTRAINT fk_daily_sleep_tracking_recorded_by
FOREIGN KEY (recorded_by) REFERENCES users(id) ON DELETE SET NULL;

-- daily_potty_tracking FK constraints
ALTER TABLE daily_potty_tracking
ADD CONSTRAINT fk_daily_potty_tracking_child
FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE CASCADE;

ALTER TABLE daily_potty_tracking
ADD CONSTRAINT fk_daily_potty_tracking_recorded_by
FOREIGN KEY (recorded_by) REFERENCES users(id) ON DELETE SET NULL;

-- attendance FK constraints
ALTER TABLE attendance
ADD CONSTRAINT fk_attendance_child
FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE CASCADE;

ALTER TABLE attendance
ADD CONSTRAINT fk_attendance_center
FOREIGN KEY (center_id) REFERENCES centers(id) ON DELETE CASCADE;

-- audit_logs FK constraints
ALTER TABLE audit_logs
ADD CONSTRAINT fk_audit_logs_user
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;

-- budget_approval_limits FK constraints
ALTER TABLE budget_approval_limits
ADD CONSTRAINT fk_budget_approval_limits_center
FOREIGN KEY (center_id) REFERENCES centers(id) ON DELETE CASCADE;

ALTER TABLE budget_approval_limits
ADD CONSTRAINT fk_budget_approval_limits_user
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- budget_approvals FK constraints
ALTER TABLE budget_approvals
ADD CONSTRAINT fk_budget_approvals_center
FOREIGN KEY (center_id) REFERENCES centers(id) ON DELETE CASCADE;

-- center_policies FK constraints
ALTER TABLE center_policies
ADD CONSTRAINT fk_center_policies_center
FOREIGN KEY (center_id) REFERENCES centers(id) ON DELETE CASCADE;

-- digital_portfolio_items FK constraints
ALTER TABLE digital_portfolio_items
ADD CONSTRAINT fk_digital_portfolio_items_child
FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE CASCADE;

-- financial_oversight FK constraints
ALTER TABLE financial_oversight
ADD CONSTRAINT fk_financial_oversight_center
FOREIGN KEY (center_id) REFERENCES centers(id) ON DELETE CASCADE;

-- incident_reports FK constraints
ALTER TABLE incident_reports
ADD CONSTRAINT fk_incident_reports_center
FOREIGN KEY (center_id) REFERENCES centers(id) ON DELETE CASCADE;

-- invoice_requests FK constraints
ALTER TABLE invoice_requests
ADD CONSTRAINT fk_invoice_requests_child
FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE CASCADE;

-- messaging FK constraints
ALTER TABLE messaging
ADD CONSTRAINT fk_messaging_sender
FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE messaging
ADD CONSTRAINT fk_messaging_recipient
FOREIGN KEY (recipient_id) REFERENCES users(id) ON DELETE CASCADE;

-- operational_kpis FK constraints
ALTER TABLE operational_kpis
ADD CONSTRAINT fk_operational_kpis_center
FOREIGN KEY (center_id) REFERENCES centers(id) ON DELETE CASCADE;

-- parent_feedback FK constraints
ALTER TABLE parent_feedback
ADD CONSTRAINT fk_parent_feedback_center
FOREIGN KEY (center_id) REFERENCES centers(id) ON DELETE CASCADE;

ALTER TABLE parent_feedback
ADD CONSTRAINT fk_parent_feedback_parent
FOREIGN KEY (parent_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE parent_feedback
ADD CONSTRAINT fk_parent_feedback_child
FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE SET NULL;

-- staff_performance FK constraints
ALTER TABLE staff_performance
ADD CONSTRAINT fk_staff_performance_center
FOREIGN KEY (center_id) REFERENCES centers(id) ON DELETE CASCADE;

ALTER TABLE staff_performance
ADD CONSTRAINT fk_staff_performance_staff
FOREIGN KEY (staff_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE staff_performance
ADD CONSTRAINT fk_staff_performance_evaluator
FOREIGN KEY (evaluator_id) REFERENCES users(id) ON DELETE SET NULL;

-- staff_schedules FK constraints
ALTER TABLE staff_schedules
ADD CONSTRAINT fk_staff_schedules_center
FOREIGN KEY (center_id) REFERENCES centers(id) ON DELETE CASCADE;

ALTER TABLE staff_schedules
ADD CONSTRAINT fk_staff_schedules_staff
FOREIGN KEY (staff_id) REFERENCES users(id) ON DELETE CASCADE;

-- teacher_classes FK constraints
ALTER TABLE teacher_classes
ADD CONSTRAINT fk_teacher_classes_teacher
FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE teacher_classes
ADD CONSTRAINT fk_teacher_classes_classroom
FOREIGN KEY (classroom_id) REFERENCES classrooms(id) ON DELETE CASCADE;

ALTER TABLE teacher_classes
ADD CONSTRAINT fk_teacher_classes_center
FOREIGN KEY (center_id) REFERENCES centers(id) ON DELETE CASCADE;

-- STEP 5: Add performance indexes (MySQL 8.0 doesn't support IF NOT EXISTS for indexes)
-- =====================================================

CREATE INDEX idx_observation_logs_date ON observation_logs(date);
CREATE INDEX idx_observation_logs_child_date ON observation_logs(child_id, date DESC);

CREATE INDEX idx_daily_food_tracking_date ON daily_food_tracking(date);
CREATE INDEX idx_daily_food_tracking_child_date ON daily_food_tracking(child_id, date DESC);

CREATE INDEX idx_daily_sleep_tracking_date ON daily_sleep_tracking(date);
CREATE INDEX idx_daily_sleep_tracking_child_date ON daily_sleep_tracking(child_id, date DESC);

CREATE INDEX idx_daily_potty_tracking_date ON daily_potty_tracking(date);
CREATE INDEX idx_daily_potty_tracking_child_date ON daily_potty_tracking(child_id, date DESC);

CREATE INDEX idx_emergency_alerts_severity ON emergency_alerts(severity);
CREATE INDEX idx_emergency_alerts_status ON emergency_alerts(status);
CREATE INDEX idx_emergency_alerts_created_at ON emergency_alerts(created_at DESC);

CREATE INDEX idx_student_pause_history_student ON student_pause_history(student_id);
CREATE INDEX idx_student_pause_history_dates ON student_pause_history(pause_start_date, pause_end_date);

-- =====================================================
-- Migration complete
-- =====================================================
