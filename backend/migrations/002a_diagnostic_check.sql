-- Diagnostic migration to verify deployment version
-- This file should appear BEFORE 003_super_admin_setup.sql
-- If this runs, we know we're on commit d96ffc7 or later

-- Create a diagnostic table
CREATE TABLE IF NOT EXISTS deployment_diagnostics (
    id VARCHAR(36) PRIMARY KEY,
    deployment_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    commit_identifier VARCHAR(100) DEFAULT 'd96ffc7-force-rebuild',
    notes TEXT
);

-- Insert diagnostic record
INSERT INTO deployment_diagnostics (id, commit_identifier, notes)
VALUES (UUID(), 'd96ffc7-force-rebuild', 'If you see this, the latest code is being deployed');
