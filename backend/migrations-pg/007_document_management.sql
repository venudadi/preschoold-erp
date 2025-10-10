-- Document Management System Migration
-- This script adds tables for document management

-- 1. Create document_categories table
CREATE TABLE IF NOT EXISTS document_categories (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    parent_id VARCHAR(36),
    center_id VARCHAR(36) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ,
    FOREIGN KEY (parent_id) REFERENCES document_categories(id) ON DELETE SET NULL,
    FOREIGN KEY (center_id) REFERENCES centers(id) ON DELETE CASCADE,
    UNIQUE KEY unique_category_name_center (name, center_id)
);

-- 2. Create documents table
CREATE TABLE IF NOT EXISTS documents (
    id VARCHAR(36) PRIMARY KEY,
    category_id VARCHAR(36),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    file_path VARCHAR(255) NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    file_size BIGINT NOT NULL,
    center_id VARCHAR(36) NOT NULL,
    uploaded_by VARCHAR(36) NOT NULL,
    version INT DEFAULT 1,
    status VARCHAR(50) CHECK (role IN ('draft', 'active', 'archived')) DEFAULT 'active',
    tags JSON,
    metadata JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ,
    FOREIGN KEY (category_id) REFERENCES document_categories(id) ON DELETE SET NULL,
    FOREIGN KEY (center_id) REFERENCES centers(id) ON DELETE CASCADE,
    FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE CASCADE
);

-- 3. Create document_versions table
CREATE TABLE IF NOT EXISTS document_versions (
    id VARCHAR(36) PRIMARY KEY,
    document_id VARCHAR(36) NOT NULL,
    version_number INT NOT NULL,
    file_path VARCHAR(255) NOT NULL,
    file_size BIGINT NOT NULL,
    modified_by VARCHAR(36) NOT NULL,
    change_summary TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
    FOREIGN KEY (modified_by) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_document_version (document_id, version_number)
);

-- 4. Create document_shares table
CREATE TABLE IF NOT EXISTS document_shares (
    id VARCHAR(36) PRIMARY KEY,
    document_id VARCHAR(36) NOT NULL,
    shared_with VARCHAR(36) NOT NULL,
    permission_level VARCHAR(50) CHECK (role IN ('view', 'edit', 'manage')) DEFAULT 'view',
    expires_at TIMESTAMP NULL,
    shared_by VARCHAR(36) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ,
    FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
    FOREIGN KEY (shared_with) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (shared_by) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_document_share (document_id, shared_with)
);

-- 5. Create document_access_logs table
CREATE TABLE IF NOT EXISTS document_access_logs (
    id VARCHAR(36) PRIMARY KEY,
    document_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    action VARCHAR(50) CHECK (role IN ('view', 'download', 'edit', 'share', 'delete')) NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 6. Create document_comments table
CREATE TABLE IF NOT EXISTS document_comments (
    id VARCHAR(36) PRIMARY KEY,
    document_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    comment TEXT NOT NULL,
    parent_comment_id VARCHAR(36),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ,
    FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_comment_id) REFERENCES document_comments(id) ON DELETE CASCADE
);

-- 7. Create indexes for better performance
CREATE INDEX idx_documents_category ON documents(category_id);
CREATE INDEX idx_documents_center ON documents(center_id);
CREATE INDEX idx_documents_status ON documents(status);
CREATE INDEX idx_document_versions_document ON document_versions(document_id);
CREATE INDEX idx_document_shares_document ON document_shares(document_id);
CREATE INDEX idx_document_access_logs_document ON document_access_logs(document_id);
CREATE INDEX idx_document_comments_document ON document_comments(document_id);

-- 8. Insert default document categories
INSERT INTO document_categories (id, name, description, center_id)
SELECT 
    UUID(),
    'Administrative Documents',
    'Official school administrative documents and policies',
    id
FROM centers;

INSERT INTO document_categories (id, name, description, center_id)
SELECT 
    UUID(),
    'Student Records',
    'Student-related documents and records',
    id
FROM centers;

INSERT INTO document_categories (id, name, description, center_id)
SELECT 
    UUID(),
    'Staff Documents',
    'Staff-related documents and certifications',
    id
FROM centers;

INSERT INTO document_categories (id, name, description, center_id)
SELECT 
    UUID(),
    'Learning Materials',
    'Educational resources and learning materials',
    id
FROM centers;

INSERT INTO document_categories (id, name, description, center_id)
SELECT 
    UUID(),
    'Financial Records',
    'Financial documents and reports',
    id
FROM centers;