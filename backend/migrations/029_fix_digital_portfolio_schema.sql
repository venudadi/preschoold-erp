-- 029_fix_digital_portfolio_schema.sql
-- Fix digital_portfolios table schema to match controller expectations and add camera support

-- Add columns one by one (will be ignored if they exist via migrate.js error handling)
ALTER TABLE digital_portfolios ADD COLUMN file_url VARCHAR(500) AFTER description;
ALTER TABLE digital_portfolios ADD COLUMN file_name VARCHAR(255) AFTER file_url;
ALTER TABLE digital_portfolios ADD COLUMN uploaded_by VARCHAR(36) AFTER file_name;
ALTER TABLE digital_portfolios ADD COLUMN file_type VARCHAR(50) AFTER uploaded_by;
ALTER TABLE digital_portfolios ADD COLUMN file_size BIGINT AFTER file_type;
ALTER TABLE digital_portfolios ADD COLUMN mime_type VARCHAR(100) AFTER file_size;
ALTER TABLE digital_portfolios ADD COLUMN upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP AFTER mime_type;

-- Add camera-specific columns for enhanced functionality
ALTER TABLE digital_portfolios ADD COLUMN capture_metadata JSON COMMENT 'Camera settings, GPS, timestamp';
ALTER TABLE digital_portfolios ADD COLUMN thumbnail_url VARCHAR(500) COMMENT 'Optimized thumbnail URL';
ALTER TABLE digital_portfolios ADD COLUMN original_dimensions VARCHAR(20) COMMENT 'Original image dimensions (WxH)';
ALTER TABLE digital_portfolios ADD COLUMN compressed_size BIGINT COMMENT 'Compressed file size in bytes';
ALTER TABLE digital_portfolios ADD COLUMN capture_method ENUM('camera', 'upload', 'import') DEFAULT 'upload' COMMENT 'How the media was captured';
ALTER TABLE digital_portfolios ADD COLUMN processing_status ENUM('pending', 'processing', 'completed', 'failed') DEFAULT 'completed' COMMENT 'Image processing status';
ALTER TABLE digital_portfolios ADD COLUMN is_favorite BOOLEAN DEFAULT FALSE COMMENT 'Teacher marked as favorite';
ALTER TABLE digital_portfolios ADD COLUMN tags JSON COMMENT 'Activity tags and labels';

-- Add foreign key constraint for uploaded_by
ALTER TABLE digital_portfolios ADD CONSTRAINT fk_digital_portfolios_uploaded_by FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL;

-- Create performance indexes
CREATE INDEX idx_digital_portfolios_uploaded_by ON digital_portfolios(uploaded_by);
CREATE INDEX idx_digital_portfolios_file_type ON digital_portfolios(file_type);
CREATE INDEX idx_digital_portfolios_capture_method ON digital_portfolios(capture_method);
CREATE INDEX idx_digital_portfolios_upload_date ON digital_portfolios(upload_date);
CREATE INDEX idx_digital_portfolios_child_upload_date ON digital_portfolios(child_id, upload_date DESC);
CREATE INDEX idx_digital_portfolios_is_favorite ON digital_portfolios(is_favorite);

-- Create a table for image processing jobs (for async processing)
CREATE TABLE IF NOT EXISTS image_processing_jobs (
    id VARCHAR(36) PRIMARY KEY,
    portfolio_id VARCHAR(36) NOT NULL,
    original_file_url VARCHAR(500) NOT NULL,
    job_type ENUM('thumbnail', 'compress', 'watermark', 'crop') NOT NULL,
    job_status ENUM('queued', 'processing', 'completed', 'failed') DEFAULT 'queued',
    job_params JSON COMMENT 'Processing parameters',
    result_url VARCHAR(500) COMMENT 'Processed file URL',
    error_message TEXT COMMENT 'Error details if failed',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    FOREIGN KEY (portfolio_id) REFERENCES digital_portfolios(id) ON DELETE CASCADE,
    INDEX idx_processing_jobs_status (job_status),
    INDEX idx_processing_jobs_portfolio (portfolio_id),
    INDEX idx_processing_jobs_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create a view for easy querying of media with metadata (CREATE OR REPLACE not supported, use DROP then CREATE)
DROP VIEW IF EXISTS portfolio_media_view;
CREATE VIEW portfolio_media_view AS
SELECT
    dp.id,
    dp.child_id,
    dp.center_id,
    dp.teacher_id,
    dp.uploaded_by,
    dp.title,
    dp.description,
    dp.file_url,
    dp.file_name,
    dp.file_type,
    dp.file_size,
    dp.mime_type,
    dp.thumbnail_url,
    dp.original_dimensions,
    dp.compressed_size,
    dp.capture_method,
    dp.capture_metadata,
    dp.processing_status,
    dp.is_favorite,
    dp.tags,
    dp.upload_date,
    dp.created_at,
    dp.updated_at,
    c.first_name as child_first_name,
    c.last_name as child_last_name,
    c.student_id,
    u.full_name as uploaded_by_name,
    ct.name as center_name
FROM digital_portfolios dp
LEFT JOIN children c ON dp.child_id = c.id
LEFT JOIN users u ON dp.uploaded_by = u.id
LEFT JOIN centers ct ON dp.center_id = ct.id;

-- Update existing records to have default values
UPDATE digital_portfolios
SET
    capture_method = COALESCE(capture_method, 'upload'),
    processing_status = COALESCE(processing_status, 'completed'),
    is_favorite = COALESCE(is_favorite, FALSE)
WHERE capture_method IS NULL
   OR processing_status IS NULL
   OR is_favorite IS NULL;

-- Migrate existing media_files JSON data to new structure if needed
UPDATE digital_portfolios
SET
    file_name = JSON_UNQUOTE(JSON_EXTRACT(media_files, '$[0].name')),
    file_type = JSON_UNQUOTE(JSON_EXTRACT(media_files, '$[0].type')),
    file_size = JSON_EXTRACT(media_files, '$[0].size')
WHERE media_files IS NOT NULL
  AND JSON_VALID(media_files) = 1
  AND file_name IS NULL;
