-- Digital Portfolio for Each Child
-- Table: digital_portfolios
CREATE TABLE IF NOT EXISTS digital_portfolios (
    id VARCHAR(36) PRIMARY KEY,
    child_id VARCHAR(36) NOT NULL,
    teacher_id VARCHAR(36) NOT NULL,
    title VARCHAR(255),
    description TEXT,
    media_files JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (child_id) REFERENCES children(id),
    FOREIGN KEY (teacher_id) REFERENCES users(id)
);
