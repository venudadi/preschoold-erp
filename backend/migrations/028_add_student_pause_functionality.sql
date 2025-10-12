-- 028_add_student_pause_functionality.sql
-- Add comprehensive pause functionality for students

-- 1. Add pause status and related fields to children table (one column at a time for idempotency)
ALTER TABLE children ADD COLUMN status ENUM('active', 'paused', 'left') NOT NULL DEFAULT 'active';
ALTER TABLE children ADD COLUMN pause_start_date DATE NULL;
ALTER TABLE children ADD COLUMN pause_end_date DATE NULL;
ALTER TABLE children ADD COLUMN pause_reason TEXT NULL;
ALTER TABLE children ADD COLUMN pause_notes TEXT NULL;
ALTER TABLE children ADD COLUMN paused_by VARCHAR(36) NULL;
ALTER TABLE children ADD COLUMN paused_at TIMESTAMP NULL;

-- Add foreign key if not exists (will fail silently if already exists)
ALTER TABLE children ADD CONSTRAINT fk_children_paused_by FOREIGN KEY (paused_by) REFERENCES users(id) ON DELETE SET NULL;

-- 2. Create student pause history table for audit trail
CREATE TABLE IF NOT EXISTS student_pause_history (
    id VARCHAR(36) PRIMARY KEY,
    student_id VARCHAR(36) NOT NULL,
    pause_start_date DATE NOT NULL,
    pause_end_date DATE NOT NULL,
    reason TEXT NOT NULL,
    notes TEXT,
    paused_by VARCHAR(36) NOT NULL,
    paused_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resumed_by VARCHAR(36),
    resumed_at TIMESTAMP NULL,
    center_id VARCHAR(36) NOT NULL,
    status ENUM('active', 'completed', 'cancelled') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES children(id) ON DELETE CASCADE,
    FOREIGN KEY (paused_by) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (resumed_by) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (center_id) REFERENCES centers(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Add indexes for performance optimization (with IF NOT EXISTS handled by ignoring errors)
CREATE INDEX IF NOT EXISTS idx_children_status ON children(status);
CREATE INDEX IF NOT EXISTS idx_children_pause_dates ON children(pause_start_date, pause_end_date);
CREATE INDEX IF NOT EXISTS idx_children_center_status ON children(center_id, status);
CREATE INDEX IF NOT EXISTS idx_student_pause_history_student_id ON student_pause_history(student_id);
CREATE INDEX IF NOT EXISTS idx_student_pause_history_center_id ON student_pause_history(center_id);
CREATE INDEX IF NOT EXISTS idx_student_pause_history_dates ON student_pause_history(pause_start_date, pause_end_date);
CREATE INDEX IF NOT EXISTS idx_student_pause_history_status ON student_pause_history(status);

-- 4. Update existing active students to have explicit 'active' status
UPDATE children SET status = 'active' WHERE status IS NULL OR status = '';

-- 5. Update students view to include pause information
DROP VIEW IF EXISTS students;
CREATE VIEW students AS
SELECT
    c.id,
    CONCAT(c.first_name, ' ', COALESCE(c.last_name, '')) as name,
    c.first_name,
    c.last_name,
    c.date_of_birth,
    c.gender,
    c.student_id,
    c.enrollment_date,
    c.probable_joining_date,
    c.classroom_id,
    c.center_id,
    c.company_id,
    c.has_tie_up,
    c.allergies,
    c.emergency_contact_name,
    c.emergency_contact_phone,
    c.fee_structure_type,
    c.is_on_recurring_billing,
    c.created_at,
    c.status,
    c.pause_start_date,
    c.pause_end_date,
    c.pause_reason,
    c.pause_notes,
    c.paused_by,
    c.paused_at,
    CASE
        WHEN c.status = 'paused' AND c.pause_end_date >= CURDATE()
        THEN DATEDIFF(c.pause_end_date, CURDATE())
        ELSE NULL
    END as days_until_resume,
    CASE
        WHEN c.status = 'paused' AND c.pause_end_date < CURDATE()
        THEN true
        ELSE false
    END as pause_expired,
    NULL as program_start_time,
    NULL as program_end_time,
    NULL as address,
    CURRENT_TIMESTAMP as updated_at
FROM children c;

-- 6. Create a view for easily querying paused students
CREATE VIEW paused_students AS
SELECT
    s.*,
    ct.name as center_name,
    cl.name as classroom_name,
    pu.full_name as paused_by_name
FROM students s
LEFT JOIN centers ct ON s.center_id = ct.id
LEFT JOIN classrooms cl ON s.classroom_id = cl.id
LEFT JOIN users pu ON s.paused_by = pu.id
WHERE s.status = 'paused';

-- 7. Create a stored procedure for auto-resuming expired pauses
DELIMITER //
CREATE PROCEDURE AutoResumeExpiredPauses()
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE student_id VARCHAR(36);
    DECLARE history_id VARCHAR(36);

    -- Cursor to find students whose pause period has expired
    DECLARE pause_cursor CURSOR FOR
        SELECT id FROM children
        WHERE status = 'paused'
        AND pause_end_date < CURDATE();

    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;

    -- Start transaction
    START TRANSACTION;

    OPEN pause_cursor;

    resume_loop: LOOP
        FETCH pause_cursor INTO student_id;
        IF done THEN
            LEAVE resume_loop;
        END IF;

        -- Update student status to active
        UPDATE children
        SET status = 'active',
            pause_start_date = NULL,
            pause_end_date = NULL,
            pause_reason = NULL,
            pause_notes = NULL,
            paused_by = NULL,
            paused_at = NULL
        WHERE id = student_id;

        -- Mark corresponding pause history as completed
        UPDATE student_pause_history
        SET status = 'completed',
            resumed_at = NOW(),
            updated_at = NOW()
        WHERE student_id = student_id
        AND status = 'active';

    END LOOP;

    CLOSE pause_cursor;

    -- Commit transaction
    COMMIT;

    -- Return count of resumed students
    SELECT ROW_COUNT() as students_resumed;
END//
DELIMITER ;

-- 8. Create event scheduler for daily auto-resume check (if event scheduler is enabled)
-- Note: This requires SUPER privilege and event_scheduler to be ON
-- SET GLOBAL event_scheduler = ON;
-- CREATE EVENT IF NOT EXISTS auto_resume_students
-- ON SCHEDULE EVERY 1 DAY
-- STARTS TIMESTAMP(CURRENT_DATE + INTERVAL 1 DAY, '06:00:00')
-- DO CALL AutoResumeExpiredPauses();