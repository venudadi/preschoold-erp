-- Migration 050: Lesson Planning System
-- This migration creates tables for the complete lesson planning workflow
-- Academic Coordinator → Admin → Teacher → Feedback loop

-- ============================================================================
-- 1. LESSON PLANS TABLE
-- ============================================================================
-- Stores weekly lesson plans for individual children
CREATE TABLE IF NOT EXISTS lesson_plans (
    id CHAR(36) PRIMARY KEY,
    child_id CHAR(36) NOT NULL,
    center_id CHAR(36) NOT NULL,
    classroom_id CHAR(36),
    academic_year VARCHAR(20),

    -- Week identification
    week_number INT NOT NULL COMMENT 'Week number (1-52)',
    week_start_date DATE NOT NULL,
    week_end_date DATE NOT NULL,

    -- Tracking
    created_by CHAR(36) NOT NULL COMMENT 'Academic Coordinator user ID',
    last_modified_by CHAR(36),
    version INT DEFAULT 1 COMMENT 'Version number for redesigns',

    -- Status
    status ENUM('draft', 'submitted', 'forwarded_to_teacher', 'in_progress', 'feedback_received', 'completed', 'archived') DEFAULT 'draft',

    -- Notes
    overall_objectives TEXT COMMENT 'Overall learning objectives for the week',
    special_notes TEXT COMMENT 'Special instructions or considerations',
    previous_week_summary TEXT COMMENT 'Summary from previous week feedback',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE CASCADE,
    FOREIGN KEY (center_id) REFERENCES centers(id) ON DELETE CASCADE,
    FOREIGN KEY (classroom_id) REFERENCES classrooms(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY (last_modified_by) REFERENCES users(id) ON DELETE SET NULL,

    INDEX idx_child_week (child_id, week_start_date),
    INDEX idx_center_week (center_id, week_start_date),
    INDEX idx_status (status),
    INDEX idx_week_number (week_number, academic_year),

    UNIQUE KEY unique_child_week (child_id, week_start_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 2. LESSON PLAN ACTIVITIES TABLE
-- ============================================================================
-- Stores the 8 activity categories for each lesson plan
CREATE TABLE IF NOT EXISTS lesson_plan_activities (
    id CHAR(36) PRIMARY KEY,
    lesson_plan_id CHAR(36) NOT NULL,

    -- Activity category (based on the curriculum table)
    category ENUM(
        'circle_time_music',
        'literacy_numeracy',
        'evs',
        'art_creative',
        'play_indoor_outdoor',
        'skill_development',
        'life_skill',
        'methodology'
    ) NOT NULL,

    -- Activity details
    day_of_week ENUM('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday') NOT NULL,
    activity_title VARCHAR(200) NOT NULL,
    activity_description TEXT,
    learning_outcomes TEXT COMMENT 'Expected learning outcomes',
    materials_needed TEXT COMMENT 'Required materials/resources',
    duration_minutes INT COMMENT 'Estimated duration in minutes',

    -- Instructions
    instructions TEXT COMMENT 'Detailed instructions for teacher',
    adaptations TEXT COMMENT 'Adaptations for different learning needs',

    -- Tracking
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (lesson_plan_id) REFERENCES lesson_plans(id) ON DELETE CASCADE,

    INDEX idx_lesson_plan (lesson_plan_id),
    INDEX idx_category (category),
    INDEX idx_day (day_of_week),

    UNIQUE KEY unique_plan_day_category (lesson_plan_id, day_of_week, category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 3. LESSON PLAN FEEDBACK TABLE
-- ============================================================================
-- Stores teacher feedback on lesson plans
CREATE TABLE IF NOT EXISTS lesson_plan_feedback (
    id CHAR(36) PRIMARY KEY,
    lesson_plan_id CHAR(36) NOT NULL,
    activity_id CHAR(36) COMMENT 'Specific activity feedback (NULL for overall feedback)',

    -- Feedback provider
    teacher_id CHAR(36) NOT NULL,

    -- Feedback content
    feedback_type ENUM('activity', 'overall', 'incident', 'achievement') DEFAULT 'activity',
    rating ENUM('excellent', 'good', 'satisfactory', 'needs_improvement') COMMENT 'Activity effectiveness rating',

    child_engagement ENUM('highly_engaged', 'engaged', 'somewhat_engaged', 'not_engaged') COMMENT 'Child engagement level',
    completion_status ENUM('completed', 'partially_completed', 'not_completed', 'modified') COMMENT 'Activity completion',

    -- Detailed feedback
    observations TEXT NOT NULL COMMENT 'Teacher observations',
    challenges_faced TEXT COMMENT 'Challenges during activity',
    child_response TEXT COMMENT 'How the child responded',
    suggested_modifications TEXT COMMENT 'Suggestions for future plans',
    achievements TEXT COMMENT 'Notable achievements',

    -- Media attachments
    attachments JSON COMMENT 'Photos/videos of activities',

    -- Workflow
    submitted_at TIMESTAMP NULL,
    reviewed_by CHAR(36) COMMENT 'Academic coordinator who reviewed',
    reviewed_at TIMESTAMP NULL,
    review_notes TEXT COMMENT 'Academic coordinator notes on feedback',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (lesson_plan_id) REFERENCES lesson_plans(id) ON DELETE CASCADE,
    FOREIGN KEY (activity_id) REFERENCES lesson_plan_activities(id) ON DELETE CASCADE,
    FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL,

    INDEX idx_lesson_plan (lesson_plan_id),
    INDEX idx_teacher (teacher_id),
    INDEX idx_submitted (submitted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 4. LESSON PLAN WORKFLOW TABLE
-- ============================================================================
-- Tracks the workflow state transitions (Academic Coordinator → Admin → Teacher → Feedback)
CREATE TABLE IF NOT EXISTS lesson_plan_workflow (
    id CHAR(36) PRIMARY KEY,
    lesson_plan_id CHAR(36) NOT NULL,

    -- Workflow stage
    action ENUM(
        'created',
        'submitted_by_coordinator',
        'forwarded_to_teacher',
        'assigned_to_teacher',
        'viewed_by_teacher',
        'feedback_submitted',
        'feedback_forwarded_to_coordinator',
        'feedback_reviewed',
        'plan_revised',
        'archived'
    ) NOT NULL,

    -- Actor information
    performed_by CHAR(36) NOT NULL COMMENT 'User who performed action',
    performed_by_role ENUM('academic_coordinator', 'admin', 'center_director', 'teacher', 'system') NOT NULL,

    -- Target user (for forwarding actions)
    forwarded_to CHAR(36) COMMENT 'User ID action was forwarded to',

    -- Action details
    notes TEXT COMMENT 'Additional notes or comments',
    metadata JSON COMMENT 'Additional metadata',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (lesson_plan_id) REFERENCES lesson_plans(id) ON DELETE CASCADE,
    FOREIGN KEY (performed_by) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY (forwarded_to) REFERENCES users(id) ON DELETE SET NULL,

    INDEX idx_lesson_plan (lesson_plan_id),
    INDEX idx_performed_by (performed_by),
    INDEX idx_action (action),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 5. LESSON PLAN ASSIGNMENTS TABLE
-- ============================================================================
-- Tracks which teachers are assigned to which lesson plans
CREATE TABLE IF NOT EXISTS lesson_plan_assignments (
    id CHAR(36) PRIMARY KEY,
    lesson_plan_id CHAR(36) NOT NULL,
    teacher_id CHAR(36) NOT NULL,

    -- Assignment details
    assigned_by CHAR(36) NOT NULL COMMENT 'Admin who assigned',
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Status tracking
    status ENUM('pending', 'acknowledged', 'in_progress', 'completed') DEFAULT 'pending',
    acknowledged_at TIMESTAMP NULL COMMENT 'When teacher acknowledged receipt',
    completed_at TIMESTAMP NULL COMMENT 'When teacher completed feedback',

    -- Reminders
    reminder_sent BOOLEAN DEFAULT FALSE,
    reminder_sent_at TIMESTAMP NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (lesson_plan_id) REFERENCES lesson_plans(id) ON DELETE CASCADE,
    FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE RESTRICT,

    INDEX idx_lesson_plan (lesson_plan_id),
    INDEX idx_teacher (teacher_id),
    INDEX idx_status (status),

    UNIQUE KEY unique_plan_teacher (lesson_plan_id, teacher_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 6. LESSON PLAN TEMPLATES TABLE (OPTIONAL)
-- ============================================================================
-- Stores reusable lesson plan templates
CREATE TABLE IF NOT EXISTS lesson_plan_templates (
    id CHAR(36) PRIMARY KEY,
    template_name VARCHAR(200) NOT NULL,
    description TEXT,

    -- Target demographics
    age_group VARCHAR(50) COMMENT 'e.g., "2-3 years", "3-4 years"',
    skill_level ENUM('beginner', 'intermediate', 'advanced'),

    -- Template category
    category ENUM(
        'circle_time_music',
        'literacy_numeracy',
        'evs',
        'art_creative',
        'play_indoor_outdoor',
        'skill_development',
        'life_skill',
        'methodology'
    ),

    -- Template content
    activity_title VARCHAR(200),
    activity_description TEXT,
    learning_outcomes TEXT,
    materials_needed TEXT,
    instructions TEXT,
    duration_minutes INT,

    -- Tracking
    created_by CHAR(36) NOT NULL,
    center_id CHAR(36) COMMENT 'NULL for global templates',
    is_active BOOLEAN DEFAULT TRUE,
    usage_count INT DEFAULT 0 COMMENT 'How many times used',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY (center_id) REFERENCES centers(id) ON DELETE CASCADE,

    INDEX idx_category (category),
    INDEX idx_age_group (age_group),
    INDEX idx_center (center_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 7. ADD INDEXES FOR PERFORMANCE
-- ============================================================================

-- Composite indexes for common queries
ALTER TABLE lesson_plans
ADD INDEX idx_center_status_week (center_id, status, week_start_date),
ADD INDEX idx_child_status (child_id, status);

ALTER TABLE lesson_plan_feedback
ADD INDEX idx_lesson_teacher (lesson_plan_id, teacher_id),
ADD INDEX idx_submitted_reviewed (submitted_at, reviewed_at);

-- ============================================================================
-- 8. INSERT DEFAULT TEMPLATES (OPTIONAL SEED DATA)
-- ============================================================================

-- You can add default templates here if needed
-- For now, leaving it empty to be populated by the application

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Add a migration tracking entry if you have a migrations table
-- INSERT INTO migrations (version, name, executed_at)
-- VALUES (50, '050_create_lesson_planning_system', NOW());
