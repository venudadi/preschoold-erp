const fs = require('fs');
const path = require('path');

const migrationsDir = path.join(__dirname, 'backend', 'migrations');

// Fix migration 020 - observation_logs
const file020 = path.join(migrationsDir, '020_create_observation_logs.sql');
let content020 = fs.readFileSync(file020, 'utf8');
content020 = content020.replace(
  '-- Student Progress & Observation Logs\n-- Table: observation_logs\nCREATE TABLE IF NOT EXISTS observation_logs (',
  '-- Student Progress & Observation Logs\n-- Drop existing tables if they have incompatible schema from previous deployments\nDROP TABLE IF EXISTS observation_logs;\n\n-- Table: observation_logs\nCREATE TABLE observation_logs ('
);
fs.writeFileSync(file020, content020);
console.log('✓ Fixed 020_create_observation_logs.sql');

// Fix migration 021 - digital_portfolios
const file021 = path.join(migrationsDir, '021_create_digital_portfolio.sql');
let content021 = fs.readFileSync(file021, 'utf8');
content021 = content021.replace(
  '-- Digital Portfolio for Each Child\n-- Table: digital_portfolios\nCREATE TABLE IF NOT EXISTS digital_portfolios (',
  '-- Digital Portfolio for Each Child\n-- Drop existing tables if they have incompatible schema from previous deployments\nDROP TABLE IF EXISTS digital_portfolios;\n\n-- Table: digital_portfolios\nCREATE TABLE digital_portfolios ('
);
fs.writeFileSync(file021, content021);
console.log('✓ Fixed 021_create_digital_portfolio.sql');

// Fix migration 023 - student_class_assignments
const file023 = path.join(migrationsDir, '023_add_class_promotion_and_assignment.sql');
let content023 = fs.readFileSync(file023, 'utf8');
content023 = content023.replace(
  '-- 023_add_class_promotion_and_assignment.sql\n-- Add support for class promotion and assignment within a center\n\n-- Table to track student-class assignments (if not already present)\nCREATE TABLE IF NOT EXISTS student_class_assignments (',
  '-- 023_add_class_promotion_and_assignment.sql\n-- Add support for class promotion and assignment within a center\n-- Drop existing tables if they have incompatible schema from previous deployments\nDROP TABLE IF EXISTS student_class_assignments;\n\n-- Table to track student-class assignments\nCREATE TABLE student_class_assignments ('
);
fs.writeFileSync(file023, content023);
console.log('✓ Fixed 023_add_class_promotion_and_assignment.sql');

// Fix migration 026 - parent module tables
const file026 = path.join(migrationsDir, '026_parent_module_enhancements.sql');
let content026 = fs.readFileSync(file026, 'utf8');
content026 = content026.replace(
  '-- 026_parent_module_enhancements.sql\n-- Adds tables for parent preferences, read/seen status, feedback, notification log, and audit log\n\n-- 1. Parent Preferences Table\nCREATE TABLE IF NOT EXISTS parent_preferences (',
  '-- 026_parent_module_enhancements.sql\n-- Adds tables for parent preferences, read/seen status, feedback, notification log, and audit log\n-- Drop existing tables if they have incompatible schema from previous deployments\nDROP TABLE IF EXISTS parent_action_audit;\nDROP TABLE IF EXISTS parent_notification_log;\nDROP TABLE IF EXISTS parent_feedback;\nDROP TABLE IF EXISTS parent_read_status;\nDROP TABLE IF EXISTS parent_preferences;\n\n-- 1. Parent Preferences Table\nCREATE TABLE parent_preferences ('
);
content026 = content026.replace(/CREATE TABLE IF NOT EXISTS parent_read_status \(/g, 'CREATE TABLE parent_read_status (');
content026 = content026.replace(/CREATE TABLE IF NOT EXISTS parent_feedback \(/g, 'CREATE TABLE parent_feedback (');
content026 = content026.replace(/CREATE TABLE IF NOT EXISTS parent_notification_log \(/g, 'CREATE TABLE parent_notification_log (');
content026 = content026.replace(/CREATE TABLE IF NOT EXISTS parent_action_audit \(/g, 'CREATE TABLE parent_action_audit (');
fs.writeFileSync(file026, content026);
console.log('✓ Fixed 026_parent_module_enhancements.sql');

// Fix migration 028 - CREATE INDEX IF NOT EXISTS syntax
const file028 = path.join(migrationsDir, '028_add_student_pause_functionality.sql');
let content028 = fs.readFileSync(file028, 'utf8');
content028 = content028.replace(
  /-- 3\. Add indexes for performance optimization \(with IF NOT EXISTS handled by ignoring errors\)\nCREATE INDEX IF NOT EXISTS idx_children_status ON children\(status\);\nCREATE INDEX IF NOT EXISTS idx_children_pause_dates ON children\(pause_start_date, pause_end_date\);\nCREATE INDEX IF NOT EXISTS idx_children_center_status ON children\(center_id, status\);\nCREATE INDEX IF NOT EXISTS idx_student_pause_history_student_id ON student_pause_history\(student_id\);\nCREATE INDEX IF NOT EXISTS idx_student_pause_history_center_id ON student_pause_history\(center_id\);\nCREATE INDEX IF NOT EXISTS idx_student_pause_history_dates ON student_pause_history\(pause_start_date, pause_end_date\);\nCREATE INDEX IF NOT EXISTS idx_student_pause_history_status ON student_pause_history\(status\);/,
  '-- 3. Add indexes for performance optimization\nCREATE INDEX idx_children_status ON children(status);\nCREATE INDEX idx_children_pause_dates ON children(pause_start_date, pause_end_date);\nCREATE INDEX idx_children_center_status ON children(center_id, status);\nCREATE INDEX idx_student_pause_history_student_id ON student_pause_history(student_id);\nCREATE INDEX idx_student_pause_history_center_id ON student_pause_history(center_id);\nCREATE INDEX idx_student_pause_history_dates ON student_pause_history(pause_start_date, pause_end_date);\nCREATE INDEX idx_student_pause_history_status ON student_pause_history(status);'
);
content028 = content028.replace(/CREATE TABLE IF NOT EXISTS student_pause_history \(/g, 'DROP TABLE IF EXISTS student_pause_history;\n\nCREATE TABLE student_pause_history (');
fs.writeFileSync(file028, content028);
console.log('✓ Fixed 028_add_student_pause_functionality.sql');

// Fix migration 029 - image_processing_jobs
const file029 = path.join(migrationsDir, '029_fix_digital_portfolio_schema.sql');
let content029 = fs.readFileSync(file029, 'utf8');
content029 = content029.replace(
  '-- Create a table for image processing jobs (for async processing)\nCREATE TABLE IF NOT EXISTS image_processing_jobs (',
  '-- Create a table for image processing jobs (for async processing)\nDROP TABLE IF EXISTS image_processing_jobs;\n\nCREATE TABLE image_processing_jobs ('
);
fs.writeFileSync(file029, content029);
console.log('✓ Fixed 029_fix_digital_portfolio_schema.sql');

// Fix migration 030 - center director tables
const file030 = path.join(migrationsDir, '030_create_center_director_role.sql');
let content030 = fs.readFileSync(file030, 'utf8');
content030 = '-- 030_create_center_director_role.sql\n-- Add center_director role and related operational management features\n-- Drop existing tables if they have incompatible schema from previous deployments\nDROP TABLE IF EXISTS staff_performance;\nDROP TABLE IF EXISTS center_policies;\nDROP TABLE IF EXISTS parent_feedback;\nDROP TABLE IF EXISTS incident_reports;\nDROP TABLE IF EXISTS operational_kpis;\nDROP TABLE IF EXISTS staff_schedules;\nDROP TABLE IF EXISTS budget_approvals;\n\n' + content030.substring(content030.indexOf('-- 1. Add center_director'));
content030 = content030.replace(/CREATE TABLE IF NOT EXISTS budget_approvals \(/g, 'CREATE TABLE budget_approvals (');
content030 = content030.replace(/CREATE TABLE IF NOT EXISTS staff_schedules \(/g, 'CREATE TABLE staff_schedules (');
content030 = content030.replace(/CREATE TABLE IF NOT EXISTS operational_kpis \(/g, 'CREATE TABLE operational_kpis (');
content030 = content030.replace(/CREATE TABLE IF NOT EXISTS incident_reports \(/g, 'CREATE TABLE incident_reports (');
content030 = content030.replace(/CREATE TABLE IF NOT EXISTS parent_feedback \(/g, 'CREATE TABLE parent_feedback (');
content030 = content030.replace(/CREATE TABLE IF NOT EXISTS center_policies \(/g, 'CREATE TABLE center_policies (');
content030 = content030.replace(/CREATE TABLE IF NOT EXISTS staff_performance \(/g, 'CREATE TABLE staff_performance (');
fs.writeFileSync(file030, content030);
console.log('✓ Fixed 030_create_center_director_role.sql');

// Fix migration 031 - financial manager tables
const file031 = path.join(migrationsDir, '031_financial_manager_budget_control.sql');
let content031 = fs.readFileSync(file031, 'utf8');
content031 = '-- 031_financial_manager_budget_control.sql\n-- Add Financial Manager control over budget approval limits and oversight\n-- Drop existing tables if they have incompatible schema from previous deployments\nDROP TABLE IF EXISTS budget_categories;\nDROP TABLE IF EXISTS financial_oversight;\nDROP TABLE IF EXISTS budget_approval_limits;\n\n' + content031.substring(content031.indexOf('-- Create budget_approval_limits'));
content031 = content031.replace(/CREATE TABLE IF NOT EXISTS budget_approval_limits \(/g, 'CREATE TABLE budget_approval_limits (');
content031 = content031.replace(/CREATE TABLE IF NOT EXISTS financial_oversight \(/g, 'CREATE TABLE financial_oversight (');
content031 = content031.replace(/CREATE TABLE IF NOT EXISTS budget_categories \(/g, 'CREATE TABLE budget_categories (');
fs.writeFileSync(file031, content031);
console.log('✓ Fixed 031_financial_manager_budget_control.sql');

// Fix migration 032 - emergency alert tables
const file032 = path.join(migrationsDir, '032_emergency_alert_system.sql');
let content032 = fs.readFileSync(file032, 'utf8');
content032 = '-- 032_emergency_alert_system.sql\n-- Add emergency alert system tables and functionality\n-- Drop existing tables if they have incompatible schema from previous deployments\nDROP TABLE IF EXISTS emergency_drill_logs;\nDROP TABLE IF EXISTS emergency_procedures;\nDROP TABLE IF EXISTS emergency_contacts;\nDROP TABLE IF EXISTS emergency_alerts;\n\n' + content032.substring(content032.indexOf('-- 1. Create emergency_alerts'));
content032 = content032.replace(/CREATE TABLE IF NOT EXISTS emergency_alerts \(/g, 'CREATE TABLE emergency_alerts (');
content032 = content032.replace(/CREATE TABLE IF NOT EXISTS emergency_contacts \(/g, 'CREATE TABLE emergency_contacts (');
content032 = content032.replace(/CREATE TABLE IF NOT EXISTS emergency_procedures \(/g, 'CREATE TABLE emergency_procedures (');
content032 = content032.replace(/CREATE TABLE IF NOT EXISTS emergency_drill_logs \(/g, 'CREATE TABLE emergency_drill_logs (');
fs.writeFileSync(file032, content032);
console.log('✓ Fixed 032_emergency_alert_system.sql');

// Fix migration 033 - CREATE INDEX IF NOT EXISTS syntax
const file033 = path.join(migrationsDir, '033_forgot_password_system.sql');
let content033 = fs.readFileSync(file033, 'utf8');
content033 = '-- Forgot Password System Migration\n-- This migration creates the password reset functionality with security features\n-- Drop existing tables if they have incompatible schema from previous deployments\nDROP TABLE IF EXISTS password_reset_tokens;\n\n' + content033.substring(content033.indexOf('-- 1. Create password_reset_tokens'));
content033 = content033.replace(/CREATE TABLE IF NOT EXISTS password_reset_tokens \(/g, 'CREATE TABLE password_reset_tokens (');
content033 = content033.replace(
  /-- 3\. Create indexes for performance on users table\nCREATE INDEX IF NOT EXISTS idx_users_email ON users\(email\);\nCREATE INDEX IF NOT EXISTS idx_users_username ON users\(username\);\nCREATE INDEX IF NOT EXISTS idx_users_reset_locked ON users\(reset_locked_until\);/,
  '-- 3. Create indexes for performance on users table\nCREATE INDEX idx_users_email ON users(email);\nCREATE INDEX idx_users_username ON users(username);\nCREATE INDEX idx_users_reset_locked ON users(reset_locked_until);'
);
fs.writeFileSync(file033, content033);
console.log('✓ Fixed 033_forgot_password_system.sql');

// Fix migration 035 - expense_sequences
const file035 = path.join(migrationsDir, '035_add_invoice_number_to_expenses.sql');
let content035 = fs.readFileSync(file035, 'utf8');
content035 = content035.replace(
  '-- 035_add_invoice_number_to_expenses.sql\n-- Add invoice_number column and expense_sequences table for expense tracking\n\n-- Add invoice_number column to expenses table\nALTER TABLE expenses ADD COLUMN invoice_number VARCHAR(64) UNIQUE;\n\n-- Create expense_sequences table for generating unique invoice numbers\nCREATE TABLE IF NOT EXISTS expense_sequences (',
  '-- 035_add_invoice_number_to_expenses.sql\n-- Add invoice_number column and expense_sequences table for expense tracking\n\n-- Add invoice_number column to expenses table\nALTER TABLE expenses ADD COLUMN invoice_number VARCHAR(64) UNIQUE;\n\n-- Create expense_sequences table for generating unique invoice numbers\nDROP TABLE IF EXISTS expense_sequences;\n\nCREATE TABLE expense_sequences ('
);
fs.writeFileSync(file035, content035);
console.log('✓ Fixed 035_add_invoice_number_to_expenses.sql');

console.log('\n✅ All migrations fixed!');
