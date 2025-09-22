-- 023_add_class_promotion_and_assignment.sql
-- Add support for class promotion and assignment within a center

-- Table to track student-class assignments (if not already present)
CREATE TABLE IF NOT EXISTS student_class_assignments (
    id VARCHAR(36) PRIMARY KEY,
    student_id VARCHAR(36) NOT NULL,
    class_id VARCHAR(36) NOT NULL,
    center_id VARCHAR(36) NOT NULL,
    assigned_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    promoted_from_class_id VARCHAR(36),
    promoted_at DATETIME,
    FOREIGN KEY (student_id) REFERENCES students(id),
    FOREIGN KEY (class_id) REFERENCES classrooms(id),
    FOREIGN KEY (center_id) REFERENCES centers(id)
);

-- Add index for fast lookup
CREATE INDEX idx_student_class_assignments_student_id ON student_class_assignments(student_id);
CREATE INDEX idx_student_class_assignments_class_id ON student_class_assignments(class_id);
CREATE INDEX idx_student_class_assignments_center_id ON student_class_assignments(center_id);
