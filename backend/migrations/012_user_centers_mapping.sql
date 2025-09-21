-- Create mapping table for assigning multiple centers to users (owners/admins)
CREATE TABLE IF NOT EXISTS user_centers (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    center_id VARCHAR(36) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uniq_user_center (user_id, center_id),
    INDEX idx_uc_user (user_id),
    INDEX idx_uc_center (center_id),
    CONSTRAINT fk_uc_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_uc_center FOREIGN KEY (center_id) REFERENCES centers(id) ON DELETE CASCADE
);

-- Seed mapping from existing users.center_id values if present
INSERT INTO user_centers (id, user_id, center_id)
SELECT 
    UUID(), u.id, u.center_id
FROM users u
WHERE u.center_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM user_centers uc WHERE uc.user_id = u.id AND uc.center_id = u.center_id
  );
