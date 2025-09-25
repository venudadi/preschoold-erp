-- 029_fix_digital_portfolio_schema.sql
-- Fix digital_portfolios table schema to match controller expectations and add camera support

-- First, check if the new columns already exist, if not add them
SET @col_exists = 0;
SELECT COUNT(*)
INTO @col_exists
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
AND TABLE_NAME = 'digital_portfolios'
AND COLUMN_NAME = 'file_url';

-- Add new columns if they don't exist
SET @sql = IF(@col_exists = 0,
'ALTER TABLE digital_portfolios
ADD COLUMN file_url VARCHAR(500) AFTER description,
ADD COLUMN file_name VARCHAR(255) AFTER file_url,
ADD COLUMN uploaded_by VARCHAR(36) AFTER file_name,
ADD COLUMN file_type VARCHAR(50) AFTER uploaded_by,
ADD COLUMN file_size BIGINT AFTER file_type,
ADD COLUMN mime_type VARCHAR(100) AFTER file_size,
ADD COLUMN upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP AFTER mime_type',
'SELECT "Columns already exist" as message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add camera-specific columns for enhanced functionality
ALTER TABLE digital_portfolios
ADD COLUMN IF NOT EXISTS capture_metadata JSON COMMENT 'Camera settings, GPS, timestamp',
ADD COLUMN IF NOT EXISTS thumbnail_url VARCHAR(500) COMMENT 'Optimized thumbnail URL',
ADD COLUMN IF NOT EXISTS original_dimensions VARCHAR(20) COMMENT 'Original image dimensions (WxH)',
ADD COLUMN IF NOT EXISTS compressed_size BIGINT COMMENT 'Compressed file size in bytes',
ADD COLUMN IF NOT EXISTS capture_method ENUM('camera', 'upload', 'import') DEFAULT 'upload' COMMENT 'How the media was captured',
ADD COLUMN IF NOT EXISTS processing_status ENUM('pending', 'processing', 'completed', 'failed') DEFAULT 'completed' COMMENT 'Image processing status',
ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT FALSE COMMENT 'Teacher marked as favorite',
ADD COLUMN IF NOT EXISTS tags JSON COMMENT 'Activity tags and labels';

-- Add foreign key constraint for uploaded_by if it doesn't exist
SET @fk_exists = 0;
SELECT COUNT(*)
INTO @fk_exists
FROM information_schema.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = DATABASE()
AND TABLE_NAME = 'digital_portfolios'
AND COLUMN_NAME = 'uploaded_by'
AND REFERENCED_TABLE_NAME = 'users';

SET @fk_sql = IF(@fk_exists = 0,
'ALTER TABLE digital_portfolios ADD FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL',
'SELECT "Foreign key already exists" as message'
);

PREPARE fk_stmt FROM @fk_sql;
EXECUTE fk_stmt;
DEALLOCATE PREPARE fk_stmt;

-- Create performance indexes
CREATE INDEX IF NOT EXISTS idx_digital_portfolios_uploaded_by ON digital_portfolios(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_digital_portfolios_file_type ON digital_portfolios(file_type);
CREATE INDEX IF NOT EXISTS idx_digital_portfolios_capture_method ON digital_portfolios(capture_method);
CREATE INDEX IF NOT EXISTS idx_digital_portfolios_upload_date ON digital_portfolios(upload_date);
CREATE INDEX IF NOT EXISTS idx_digital_portfolios_child_upload_date ON digital_portfolios(child_id, upload_date DESC);
CREATE INDEX IF NOT EXISTS idx_digital_portfolios_is_favorite ON digital_portfolios(is_favorite);

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

-- Create a view for easy querying of media with metadata
CREATE OR REPLACE VIEW portfolio_media_view AS
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
    -- Child information
    c.first_name as child_first_name,
    c.last_name as child_last_name,
    c.student_id,
    -- Teacher information
    u.full_name as uploaded_by_name,
    -- Center information
    ct.name as center_name
FROM digital_portfolios dp
LEFT JOIN children c ON dp.child_id = c.id
LEFT JOIN users u ON dp.uploaded_by = u.id
LEFT JOIN centers ct ON dp.center_id = ct.id;

-- Update existing records to have default values
UPDATE digital_portfolios
SET
    capture_method = 'upload',
    processing_status = 'completed',
    is_favorite = FALSE
WHERE capture_method IS NULL
   OR processing_status IS NULL
   OR is_favorite IS NULL;

-- Migrate existing media_files JSON data to new structure if needed
-- This is a safe migration that preserves existing data
UPDATE digital_portfolios
SET
    file_name = JSON_UNQUOTE(JSON_EXTRACT(media_files, '$[0].name')),
    file_type = JSON_UNQUOTE(JSON_EXTRACT(media_files, '$[0].type')),
    file_size = JSON_EXTRACT(media_files, '$[0].size')
WHERE media_files IS NOT NULL
  AND JSON_VALID(media_files) = 1
  AND file_name IS NULL;

-- Create triggers for automatic thumbnail generation requests
DELIMITER //
CREATE OR REPLACE TRIGGER create_thumbnail_job
    AFTER INSERT ON digital_portfolios
    FOR EACH ROW
BEGIN
    IF NEW.file_type LIKE 'image/%' AND NEW.thumbnail_url IS NULL THEN
        INSERT INTO image_processing_jobs (
            id,
            portfolio_id,
            original_file_url,
            job_type,
            job_params
        ) VALUES (
            UUID(),
            NEW.id,
            NEW.file_url,
            'thumbnail',
            JSON_OBJECT('width', 300, 'height', 300, 'quality', 80)
        );
    END IF;
END//
DELIMITER ;

-- Add constraint to ensure file_url or media_files exists
-- ALTER TABLE digital_portfolios
-- ADD CONSTRAINT chk_file_data CHECK (
--     file_url IS NOT NULL OR media_files IS NOT NULL
-- );