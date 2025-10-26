-- 025_add_center_id_to_teacher_and_messaging_tables.sql
-- Add center_id to lesson_plans, assignments, assignment_submissions, messages, and message_threads for multi-center compliance

-- Add center_id to lesson_plans
ALTER TABLE lesson_plans ADD COLUMN center_id VARCHAR(36) AFTER classroom_id;
ALTER TABLE lesson_plans ADD CONSTRAINT fk_lesson_plans_center FOREIGN KEY (center_id) REFERENCES centers(id);
CREATE INDEX idx_lesson_plans_center_id ON lesson_plans(center_id);

-- Add center_id to assignments
ALTER TABLE assignments ADD COLUMN center_id VARCHAR(36) AFTER classroom_id;
ALTER TABLE assignments ADD CONSTRAINT fk_assignments_center FOREIGN KEY (center_id) REFERENCES centers(id);
CREATE INDEX idx_assignments_center_id ON assignments(center_id);

-- Add center_id to assignment_submissions
ALTER TABLE assignment_submissions ADD COLUMN center_id VARCHAR(36) AFTER assignment_id;
ALTER TABLE assignment_submissions ADD CONSTRAINT fk_assignment_submissions_center FOREIGN KEY (center_id) REFERENCES centers(id);
CREATE INDEX idx_assignment_submissions_center_id ON assignment_submissions(center_id);

-- Add center_id to messages
ALTER TABLE messages ADD COLUMN center_id VARCHAR(36) AFTER thread_id;
ALTER TABLE messages ADD CONSTRAINT fk_messages_center FOREIGN KEY (center_id) REFERENCES centers(id);
CREATE INDEX idx_messages_center_id ON messages(center_id);

-- Add center_id to message_threads
ALTER TABLE message_threads ADD COLUMN center_id VARCHAR(36) AFTER child_id;
ALTER TABLE message_threads ADD CONSTRAINT fk_message_threads_center FOREIGN KEY (center_id) REFERENCES centers(id);
CREATE INDEX idx_message_threads_center_id ON message_threads(center_id);
