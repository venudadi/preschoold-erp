-- =====================================================
-- Migration 039: Fix Schema Synchronization Issues
-- =====================================================
-- Fixes all missing FK constraints, data type mismatches,
-- and ensures perfect sync with local MySQL database
-- =====================================================

-- CRITICAL: Fix observation_logs.child_id data type mismatch
-- Currently INT, should be VARCHAR(36) to match children.id
ALTER TABLE observation_logs
MODIFY COLUMN child_id VARCHAR(36) NOT NULL;

ALTER TABLE observation_logs
MODIFY COLUMN observer_id VARCHAR(36);

-- Now add the missing FK constraints for observation_logs
ALTER TABLE observation_logs
ADD CONSTRAINT fk_observation_logs_child
FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE CASCADE;

ALTER TABLE observation_logs
ADD CONSTRAINT fk_observation_logs_center
FOREIGN KEY (center_id) REFERENCES centers(id) ON DELETE CASCADE;

ALTER TABLE observation_logs
ADD CONSTRAINT fk_observation_logs_observer
FOREIGN KEY (observer_id) REFERENCES users(id) ON DELETE SET NULL;

-- =====================================================
-- Fix lesson_plans FK constraints
-- =====================================================
ALTER TABLE lesson_plans
ADD CONSTRAINT fk_lesson_plans_teacher
FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE lesson_plans
ADD CONSTRAINT fk_lesson_plans_classroom
FOREIGN KEY (classroom_id) REFERENCES classrooms(id) ON DELETE CASCADE;

ALTER TABLE lesson_plans
ADD CONSTRAINT fk_lesson_plans_center
FOREIGN KEY (center_id) REFERENCES centers(id) ON DELETE CASCADE;

-- =====================================================
-- Fix student_pause_history FK constraints
-- =====================================================
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

-- =====================================================
-- Fix image_processing_jobs FK constraints
-- =====================================================
ALTER TABLE image_processing_jobs
ADD CONSTRAINT fk_image_processing_jobs_portfolio
FOREIGN KEY (portfolio_id) REFERENCES digital_portfolios(id) ON DELETE CASCADE;

-- =====================================================
-- Fix emergency_alerts FK constraints
-- =====================================================
ALTER TABLE emergency_alerts
ADD CONSTRAINT fk_emergency_alerts_center
FOREIGN KEY (center_id) REFERENCES centers(id) ON DELETE CASCADE;

ALTER TABLE emergency_alerts
ADD CONSTRAINT fk_emergency_alerts_created_by
FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE emergency_alerts
ADD CONSTRAINT fk_emergency_alerts_resolved_by
FOREIGN KEY (resolved_by) REFERENCES users(id) ON DELETE SET NULL;

-- =====================================================
-- Fix emergency_contacts FK constraints
-- =====================================================
ALTER TABLE emergency_contacts
ADD CONSTRAINT fk_emergency_contacts_center
FOREIGN KEY (center_id) REFERENCES centers(id) ON DELETE CASCADE;

-- =====================================================
-- Fix emergency_procedures FK constraints
-- =====================================================
ALTER TABLE emergency_procedures
ADD CONSTRAINT fk_emergency_procedures_center
FOREIGN KEY (center_id) REFERENCES centers(id) ON DELETE CASCADE;

ALTER TABLE emergency_procedures
ADD CONSTRAINT fk_emergency_procedures_created_by
FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;

-- =====================================================
-- Fix emergency_drill_logs FK constraints
-- =====================================================
ALTER TABLE emergency_drill_logs
ADD CONSTRAINT fk_emergency_drill_logs_center
FOREIGN KEY (center_id) REFERENCES centers(id) ON DELETE CASCADE;

ALTER TABLE emergency_drill_logs
ADD CONSTRAINT fk_emergency_drill_logs_procedure
FOREIGN KEY (procedure_id) REFERENCES emergency_procedures(id) ON DELETE CASCADE;

ALTER TABLE emergency_drill_logs
ADD CONSTRAINT fk_emergency_drill_logs_conducted_by
FOREIGN KEY (conducted_by) REFERENCES users(id) ON DELETE SET NULL;

-- =====================================================
-- Fix daily_food_tracking FK constraints
-- =====================================================
ALTER TABLE daily_food_tracking
ADD CONSTRAINT fk_daily_food_tracking_child
FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE CASCADE;

ALTER TABLE daily_food_tracking
ADD CONSTRAINT fk_daily_food_tracking_recorded_by
FOREIGN KEY (recorded_by) REFERENCES users(id) ON DELETE SET NULL;

-- =====================================================
-- Fix daily_sleep_tracking FK constraints
-- =====================================================
ALTER TABLE daily_sleep_tracking
ADD CONSTRAINT fk_daily_sleep_tracking_child
FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE CASCADE;

ALTER TABLE daily_sleep_tracking
ADD CONSTRAINT fk_daily_sleep_tracking_recorded_by
FOREIGN KEY (recorded_by) REFERENCES users(id) ON DELETE SET NULL;

-- =====================================================
-- Fix daily_potty_tracking FK constraints
-- =====================================================
ALTER TABLE daily_potty_tracking
ADD CONSTRAINT fk_daily_potty_tracking_child
FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE CASCADE;

ALTER TABLE daily_potty_tracking
ADD CONSTRAINT fk_daily_potty_tracking_recorded_by
FOREIGN KEY (recorded_by) REFERENCES users(id) ON DELETE SET NULL;

-- =====================================================
-- Fix other tables with missing FK constraints
-- =====================================================

-- attendance table
ALTER TABLE attendance
ADD CONSTRAINT fk_attendance_child
FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE CASCADE;

ALTER TABLE attendance
ADD CONSTRAINT fk_attendance_center
FOREIGN KEY (center_id) REFERENCES centers(id) ON DELETE CASCADE;

-- audit_logs table
ALTER TABLE audit_logs
ADD CONSTRAINT fk_audit_logs_user
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;

-- budget_approval_limits table
ALTER TABLE budget_approval_limits
ADD CONSTRAINT fk_budget_approval_limits_center
FOREIGN KEY (center_id) REFERENCES centers(id) ON DELETE CASCADE;

ALTER TABLE budget_approval_limits
ADD CONSTRAINT fk_budget_approval_limits_user
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- budget_approvals table
ALTER TABLE budget_approvals
ADD CONSTRAINT fk_budget_approvals_center
FOREIGN KEY (center_id) REFERENCES centers(id) ON DELETE CASCADE;

-- center_policies table
ALTER TABLE center_policies
ADD CONSTRAINT fk_center_policies_center
FOREIGN KEY (center_id) REFERENCES centers(id) ON DELETE CASCADE;

-- digital_portfolio_items table (if it has child_id)
ALTER TABLE digital_portfolio_items
ADD CONSTRAINT fk_digital_portfolio_items_child
FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE CASCADE;

-- financial_oversight table
ALTER TABLE financial_oversight
ADD CONSTRAINT fk_financial_oversight_center
FOREIGN KEY (center_id) REFERENCES centers(id) ON DELETE CASCADE;

-- incident_reports table
ALTER TABLE incident_reports
ADD CONSTRAINT fk_incident_reports_center
FOREIGN KEY (center_id) REFERENCES centers(id) ON DELETE CASCADE;

-- invoice_requests table
ALTER TABLE invoice_requests
ADD CONSTRAINT fk_invoice_requests_child
FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE CASCADE;

-- messaging table
ALTER TABLE messaging
ADD CONSTRAINT fk_messaging_sender
FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE messaging
ADD CONSTRAINT fk_messaging_recipient
FOREIGN KEY (recipient_id) REFERENCES users(id) ON DELETE CASCADE;

-- operational_kpis table
ALTER TABLE operational_kpis
ADD CONSTRAINT fk_operational_kpis_center
FOREIGN KEY (center_id) REFERENCES centers(id) ON DELETE CASCADE;

-- parent_feedback table
ALTER TABLE parent_feedback
ADD CONSTRAINT fk_parent_feedback_center
FOREIGN KEY (center_id) REFERENCES centers(id) ON DELETE CASCADE;

ALTER TABLE parent_feedback
ADD CONSTRAINT fk_parent_feedback_parent
FOREIGN KEY (parent_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE parent_feedback
ADD CONSTRAINT fk_parent_feedback_child
FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE SET NULL;

-- staff_performance table
ALTER TABLE staff_performance
ADD CONSTRAINT fk_staff_performance_center
FOREIGN KEY (center_id) REFERENCES centers(id) ON DELETE CASCADE;

ALTER TABLE staff_performance
ADD CONSTRAINT fk_staff_performance_staff
FOREIGN KEY (staff_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE staff_performance
ADD CONSTRAINT fk_staff_performance_evaluator
FOREIGN KEY (evaluator_id) REFERENCES users(id) ON DELETE SET NULL;

-- staff_schedules table
ALTER TABLE staff_schedules
ADD CONSTRAINT fk_staff_schedules_center
FOREIGN KEY (center_id) REFERENCES centers(id) ON DELETE CASCADE;

ALTER TABLE staff_schedules
ADD CONSTRAINT fk_staff_schedules_staff
FOREIGN KEY (staff_id) REFERENCES users(id) ON DELETE CASCADE;

-- teacher_classes table
ALTER TABLE teacher_classes
ADD CONSTRAINT fk_teacher_classes_teacher
FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE teacher_classes
ADD CONSTRAINT fk_teacher_classes_classroom
FOREIGN KEY (classroom_id) REFERENCES classrooms(id) ON DELETE CASCADE;

ALTER TABLE teacher_classes
ADD CONSTRAINT fk_teacher_classes_center
FOREIGN KEY (center_id) REFERENCES centers(id) ON DELETE CASCADE;

-- =====================================================
-- Add missing indexes
-- =====================================================

-- Add index for parent_name if the column exists (check first)
-- Note: Based on analysis, this column doesn't exist, so skipping

-- Add performance indexes for frequently queried columns
CREATE INDEX IF NOT EXISTS idx_observation_logs_date ON observation_logs(date);
CREATE INDEX IF NOT EXISTS idx_observation_logs_child_date ON observation_logs(child_id, date DESC);

CREATE INDEX IF NOT EXISTS idx_daily_food_tracking_date ON daily_food_tracking(date);
CREATE INDEX IF NOT EXISTS idx_daily_food_tracking_child_date ON daily_food_tracking(child_id, date DESC);

CREATE INDEX IF NOT EXISTS idx_daily_sleep_tracking_date ON daily_sleep_tracking(date);
CREATE INDEX IF NOT EXISTS idx_daily_sleep_tracking_child_date ON daily_sleep_tracking(child_id, date DESC);

CREATE INDEX IF NOT EXISTS idx_daily_potty_tracking_date ON daily_potty_tracking(date);
CREATE INDEX IF NOT EXISTS idx_daily_potty_tracking_child_date ON daily_potty_tracking(child_id, date DESC);

CREATE INDEX IF NOT EXISTS idx_emergency_alerts_severity ON emergency_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_emergency_alerts_status ON emergency_alerts(status);
CREATE INDEX IF NOT EXISTS idx_emergency_alerts_created_at ON emergency_alerts(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_student_pause_history_student ON student_pause_history(student_id);
CREATE INDEX IF NOT EXISTS idx_student_pause_history_dates ON student_pause_history(pause_start_date, pause_end_date);

-- =====================================================
-- Migration complete
-- =====================================================
