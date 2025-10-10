-- 026_parent_module_enhancements.sql
-- Adds tables for parent preferences, read/seen status, feedback, notification log, and audit log

-- 1. Parent Preferences Table
CREATE TABLE IF NOT EXISTS parent_preferences (
    id VARCHAR(36) PRIMARY KEY,
    parent_id VARCHAR(36) NOT NULL,
    preference_key VARCHAR(64) NOT NULL,
    preference_value TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ,
    FOREIGN KEY (parent_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY uniq_parent_pref (parent_id, preference_key)
);

-- 2. Parent Read/Seen Status Table
CREATE TABLE IF NOT EXISTS parent_read_status (
    id VARCHAR(36) PRIMARY KEY,
    parent_id VARCHAR(36) NOT NULL,
    item_type VARCHAR(50) CHECK (role IN ('announcement','portfolio','message','observation')) NOT NULL,
    item_id VARCHAR(36) NOT NULL,
    seen_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY uniq_parent_item (parent_id, item_type, item_id)
);

-- 3. Parent Feedback Table
CREATE TABLE IF NOT EXISTS parent_feedback (
    id VARCHAR(36) PRIMARY KEY,
    parent_id VARCHAR(36) NOT NULL,
    feedback_type VARCHAR(50) CHECK (role IN ('feature','event','communication','general')) NOT NULL,
    target_id VARCHAR(36),
    rating INT,
    comment TEXT,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 4. Parent Notification Log Table
CREATE TABLE IF NOT EXISTS parent_notification_log (
    id VARCHAR(36) PRIMARY KEY,
    parent_id VARCHAR(36) NOT NULL,
    notification_type VARCHAR(50) CHECK (role IN ('push','email','sms')) NOT NULL,
    message TEXT,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP NULL,
    status VARCHAR(50) CHECK (role IN ('sent','delivered','failed','read')) DEFAULT 'sent',
    FOREIGN KEY (parent_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 5. Parent Action Audit Log Table
CREATE TABLE IF NOT EXISTS parent_action_audit (
    id VARCHAR(36) PRIMARY KEY,
    parent_id VARCHAR(36) NOT NULL,
    action_type VARCHAR(64) NOT NULL,
    action_details TEXT,
    action_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES users(id) ON DELETE CASCADE
);
