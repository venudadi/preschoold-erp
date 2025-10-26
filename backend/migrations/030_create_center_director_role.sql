-- 030_create_center_director_role.sql
-- Add center_director role and related operational management features
-- Drop existing tables if they have incompatible schema from previous deployments
DROP TABLE IF EXISTS staff_performance;
DROP TABLE IF EXISTS center_policies;
DROP TABLE IF EXISTS parent_feedback;
DROP TABLE IF EXISTS incident_reports;
DROP TABLE IF EXISTS operational_kpis;
DROP TABLE IF EXISTS staff_schedules;
DROP TABLE IF EXISTS budget_approvals;

-- 1. Add center_director to the users role enum
ALTER TABLE users MODIFY COLUMN role ENUM(
    'super_admin',
    'owner',
    'center_director',
    'admin',
    'academic_coordinator',
    'teacher',
    'parent'
) NOT NULL;

-- 2. Create budget_approvals table for center director budget management
CREATE TABLE budget_approvals (
    id VARCHAR(36) PRIMARY KEY,
    center_id VARCHAR(36) NOT NULL,
    requested_by VARCHAR(36) NOT NULL,
    approved_by VARCHAR(36),
    amount DECIMAL(12,2) NOT NULL,
    category ENUM(
        'operations',
        'staff',
        'maintenance',
        'supplies',
        'marketing',
        'technology',
        'emergency',
        'other'
    ) NOT NULL,
    description TEXT NOT NULL,
    justification TEXT,
    requested_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    approved_date TIMESTAMP NULL,
    status ENUM('pending', 'approved', 'rejected', 'revision_required') DEFAULT 'pending',
    approval_notes TEXT,
    priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
    fiscal_year INT NOT NULL,
    quarter INT NOT NULL,
    budget_code VARCHAR(50),
    attachments JSON COMMENT 'File URLs and metadata for supporting documents',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_budget_center (center_id),
    INDEX idx_budget_requested_by (requested_by),
    INDEX idx_budget_approved_by (approved_by),
    INDEX idx_budget_status (status),
    INDEX idx_budget_date (requested_date),
    INDEX idx_budget_amount (amount),
    INDEX idx_budget_fiscal (fiscal_year, quarter)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Create staff_schedules table for staff management
CREATE TABLE staff_schedules (
    id VARCHAR(36) PRIMARY KEY,
    center_id VARCHAR(36) NOT NULL,
    staff_id VARCHAR(36) NOT NULL,
    schedule_date DATE NOT NULL,
    shift_start TIME NOT NULL,
    shift_end TIME NOT NULL,
    break_start TIME,
    break_end TIME,
    role_assignment VARCHAR(100),
    classroom_assignment VARCHAR(36),
    status ENUM('scheduled', 'confirmed', 'absent', 'substitute', 'overtime') DEFAULT 'scheduled',
    notes TEXT,
    created_by VARCHAR(36) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY unique_staff_date (staff_id, schedule_date),
    INDEX idx_schedule_center (center_id),
    INDEX idx_schedule_staff (staff_id),
    INDEX idx_schedule_date (schedule_date),
    INDEX idx_schedule_status (status),
    INDEX idx_schedule_classroom (classroom_assignment)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Create operational_kpis table for performance tracking
CREATE TABLE operational_kpis (
    id VARCHAR(36) PRIMARY KEY,
    center_id VARCHAR(36) NOT NULL,
    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL(10,4) NOT NULL,
    target_value DECIMAL(10,4),
    metric_unit VARCHAR(20),
    measurement_date DATE NOT NULL,
    measurement_period ENUM('daily', 'weekly', 'monthly', 'quarterly', 'yearly') NOT NULL,
    category ENUM(
        'enrollment',
        'attendance',
        'financial',
        'staff',
        'safety',
        'satisfaction',
        'operational'
    ) NOT NULL,
    subcategory VARCHAR(50),
    notes TEXT,
    created_by VARCHAR(36) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_kpi_center (center_id),
    INDEX idx_kpi_date (measurement_date),
    INDEX idx_kpi_metric (metric_name),
    INDEX idx_kpi_category (category),
    INDEX idx_kpi_period (measurement_period)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Create incident_reports table for emergency and incident management
CREATE TABLE incident_reports (
    id VARCHAR(36) PRIMARY KEY,
    center_id VARCHAR(36) NOT NULL,
    incident_type ENUM(
        'injury',
        'medical_emergency',
        'behavioral',
        'safety_hazard',
        'equipment_failure',
        'security_breach',
        'weather_emergency',
        'fire_drill',
        'other'
    ) NOT NULL,
    severity ENUM('low', 'medium', 'high', 'critical') NOT NULL,
    incident_date DATETIME NOT NULL,
    location VARCHAR(100),
    description TEXT NOT NULL,
    immediate_actions TEXT,
    people_involved JSON COMMENT 'Children, staff, visitors involved',
    witnesses JSON COMMENT 'Witness information',
    injuries_sustained TEXT,
    medical_attention BOOLEAN DEFAULT FALSE,
    medical_provider VARCHAR(200),
    parents_notified BOOLEAN DEFAULT FALSE,
    notification_time DATETIME,
    authorities_contacted BOOLEAN DEFAULT FALSE,
    authority_details TEXT,
    follow_up_required BOOLEAN DEFAULT FALSE,
    follow_up_actions TEXT,
    preventive_measures TEXT,
    reported_by VARCHAR(36) NOT NULL,
    reviewed_by VARCHAR(36),
    review_date DATETIME,
    status ENUM('reported', 'under_review', 'resolved', 'closed') DEFAULT 'reported',
    attachments JSON COMMENT 'Photos, documents related to incident',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_incident_center (center_id),
    INDEX idx_incident_date (incident_date),
    INDEX idx_incident_type (incident_type),
    INDEX idx_incident_severity (severity),
    INDEX idx_incident_status (status),
    INDEX idx_incident_reporter (reported_by)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Create parent_feedback table for communication oversight
CREATE TABLE parent_feedback (
    id VARCHAR(36) PRIMARY KEY,
    center_id VARCHAR(36) NOT NULL,
    parent_id VARCHAR(36),
    child_id VARCHAR(36),
    feedback_type ENUM(
        'compliment',
        'complaint',
        'suggestion',
        'concern',
        'question',
        'general'
    ) NOT NULL,
    category ENUM(
        'academic',
        'staff',
        'facilities',
        'communication',
        'safety',
        'food_nutrition',
        'billing',
        'policies',
        'other'
    ) NOT NULL,
    priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
    subject VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    submission_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('new', 'acknowledged', 'in_progress', 'resolved', 'closed') DEFAULT 'new',
    assigned_to VARCHAR(36),
    response TEXT,
    response_date TIMESTAMP,
    satisfaction_rating INT CHECK (satisfaction_rating BETWEEN 1 AND 5),
    satisfaction_notes TEXT,
    is_anonymous BOOLEAN DEFAULT FALSE,
    requires_follow_up BOOLEAN DEFAULT FALSE,
    follow_up_date DATE,
    follow_up_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_feedback_center (center_id),
    INDEX idx_feedback_parent (parent_id),
    INDEX idx_feedback_child (child_id),
    INDEX idx_feedback_type (feedback_type),
    INDEX idx_feedback_status (status),
    INDEX idx_feedback_date (submission_date),
    INDEX idx_feedback_assigned (assigned_to)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Create center_policies table for policy management
CREATE TABLE center_policies (
    id VARCHAR(36) PRIMARY KEY,
    center_id VARCHAR(36) NOT NULL,
    policy_name VARCHAR(200) NOT NULL,
    policy_category ENUM(
        'enrollment',
        'attendance',
        'behavior',
        'safety',
        'health',
        'nutrition',
        'communication',
        'billing',
        'emergency',
        'staff',
        'general'
    ) NOT NULL,
    policy_content TEXT NOT NULL,
    effective_date DATE NOT NULL,
    expiry_date DATE,
    version VARCHAR(10) DEFAULT '1.0',
    requires_parent_acknowledgment BOOLEAN DEFAULT FALSE,
    requires_staff_training BOOLEAN DEFAULT FALSE,
    corporate_approved BOOLEAN DEFAULT FALSE,
    approved_by VARCHAR(36),
    approval_date TIMESTAMP,
    status ENUM('draft', 'pending_approval', 'active', 'archived') DEFAULT 'draft',
    created_by VARCHAR(36) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_policy_center (center_id),
    INDEX idx_policy_category (policy_category),
    INDEX idx_policy_status (status),
    INDEX idx_policy_effective (effective_date),
    INDEX idx_policy_created_by (created_by)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Create staff_performance table for staff management
CREATE TABLE staff_performance (
    id VARCHAR(36) PRIMARY KEY,
    center_id VARCHAR(36) NOT NULL,
    staff_id VARCHAR(36) NOT NULL,
    evaluation_period_start DATE NOT NULL,
    evaluation_period_end DATE NOT NULL,
    evaluation_type ENUM('probation', 'annual', 'mid_year', 'project_based', 'disciplinary') NOT NULL,
    overall_rating ENUM('outstanding', 'exceeds_expectations', 'meets_expectations', 'below_expectations', 'unsatisfactory') NOT NULL,
    teaching_skills_rating INT CHECK (teaching_skills_rating BETWEEN 1 AND 5),
    communication_rating INT CHECK (communication_rating BETWEEN 1 AND 5),
    teamwork_rating INT CHECK (teamwork_rating BETWEEN 1 AND 5),
    professionalism_rating INT CHECK (professionalism_rating BETWEEN 1 AND 5),
    reliability_rating INT CHECK (reliability_rating BETWEEN 1 AND 5),
    strengths TEXT,
    areas_for_improvement TEXT,
    goals_set TEXT,
    training_recommendations TEXT,
    evaluator_id VARCHAR(36) NOT NULL,
    evaluation_date DATE NOT NULL,
    next_review_date DATE,
    staff_acknowledged BOOLEAN DEFAULT FALSE,
    staff_comments TEXT,
    status ENUM('draft', 'completed', 'acknowledged', 'disputed') DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_performance_center (center_id),
    INDEX idx_performance_staff (staff_id),
    INDEX idx_performance_date (evaluation_date),
    INDEX idx_performance_evaluator (evaluator_id),
    INDEX idx_performance_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. Add budget approval limits to centers table
ALTER TABLE centers
ADD COLUMN IF NOT EXISTS director_budget_limit DECIMAL(12,2) DEFAULT 50000.00 COMMENT 'Maximum amount center director can approve',
ADD COLUMN IF NOT EXISTS monthly_budget DECIMAL(12,2) COMMENT 'Monthly operational budget',
ADD COLUMN IF NOT EXISTS emergency_fund DECIMAL(12,2) COMMENT 'Emergency fund allocation';

-- 10. Add center director specific columns to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS budget_approval_limit DECIMAL(12,2) COMMENT 'Individual budget approval limit',
ADD COLUMN IF NOT EXISTS management_level ENUM('junior', 'senior', 'executive') DEFAULT 'junior' COMMENT 'Management level for role hierarchy';

-- Create some initial KPI metrics for centers
INSERT IGNORE INTO operational_kpis (
    id, center_id, metric_name, metric_value, target_value, metric_unit,
    measurement_date, measurement_period, category, created_by
)
SELECT
    UUID() as id,
    c.id as center_id,
    'Enrollment Capacity' as metric_name,
    0 as metric_value,
    100 as target_value,
    'percentage' as metric_unit,
    CURDATE() as measurement_date,
    'monthly' as measurement_period,
    'enrollment' as category,
    'system' as created_by
FROM centers c;