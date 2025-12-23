
CREATE TABLE IF NOT EXISTS system_settings (
    setting_key VARCHAR(50) PRIMARY KEY,
    setting_value TEXT,
    is_encrypted BOOLEAN DEFAULT FALSE,
    description VARCHAR(255),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    updated_by VARCHAR(36)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Insert default placeholder rows if they don't exist
INSERT IGNORE INTO system_settings (setting_key, setting_value, description) VALUES 
('smtp_host', 'smtp.hostinger.com', 'SMTP Server Host'),
('smtp_port', '465', 'SMTP Server Port'),
('smtp_user', 'info@vanisris.com', 'SMTP Username'),
('smtp_pass', '', 'SMTP Password (Encrypted)'),
('smtp_secure', 'true', 'Use SSL/TLS'),
('from_email', 'info@vanisris.com', 'Sender Email Address'),
('from_name', 'Vanisris Preschool', 'Sender Name');
