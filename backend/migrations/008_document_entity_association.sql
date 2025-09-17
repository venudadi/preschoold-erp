-- Add entity association columns to documents table
ALTER TABLE documents
ADD COLUMN IF NOT EXISTS entity_type ENUM('child', 'staff', 'center', 'general') DEFAULT 'general',
ADD COLUMN IF NOT EXISTS entity_id VARCHAR(36),
ADD INDEX idx_documents_entity (entity_type, entity_id);