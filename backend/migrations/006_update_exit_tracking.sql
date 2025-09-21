-- Add status field to students and staff tables
ALTER TABLE students 
ADD COLUMN status ENUM('active', 'left') NOT NULL DEFAULT 'active';

ALTER TABLE staff 
ADD COLUMN status ENUM('active', 'left') NOT NULL DEFAULT 'active';

-- Create exit records table with separate tracking for teachers and other staff
CREATE TABLE exit_records (
    id INT PRIMARY KEY AUTO_INCREMENT,
    person_id INT NOT NULL,
    person_type ENUM('student', 'teacher', 'staff') NOT NULL,
    exit_date DATE NOT NULL,
    exit_reason VARCHAR(500) NOT NULL,
    center_id INT NOT NULL,
    recorded_by INT NOT NULL,
    recorded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (center_id) REFERENCES centers(id),
    FOREIGN KEY (recorded_by) REFERENCES users(id)
);