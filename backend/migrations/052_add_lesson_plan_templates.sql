
CREATE TABLE IF NOT EXISTS lesson_plan_templates (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    age_group VARCHAR(50),
    theme VARCHAR(100),
    activities JSON NOT NULL, -- Storing activities as JSON for flexible template structure
    created_by VARCHAR(36) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_template_creator (created_by),
    INDEX idx_template_age_group (age_group)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
