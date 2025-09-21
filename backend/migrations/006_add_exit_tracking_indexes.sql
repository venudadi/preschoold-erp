-- Add indexes for better performance
ALTER TABLE staff ADD INDEX idx_job_title (job_title);
ALTER TABLE exit_records ADD INDEX idx_person_type (person_type);
ALTER TABLE exit_records ADD INDEX idx_exit_date (exit_date);