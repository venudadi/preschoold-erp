-- Migration: Create lesson_plans table for teacher lesson planning
CREATE TABLE IF NOT EXISTS lesson_plans (
    id VARCHAR(36) PRIMARY KEY,
    teacher_id VARCHAR(36) NOT NULL,
    classroom_id INT NOT NULL,
    date DATE NOT NULL,
    topic VARCHAR(255) NOT NULL,
    objectives TEXT,
    activities TEXT,
    resources TEXT,
    attachments JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ,
    FOREIGN KEY (teacher_id) REFERENCES users(id),
    FOREIGN KEY (classroom_id) REFERENCES classrooms(id)
);
