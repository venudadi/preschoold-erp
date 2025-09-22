-- 022_create_classroom_announcements.sql
-- Classroom announcements table for push notifications and parent/teacher access

CREATE TABLE classroom_announcements (
    id VARCHAR(36) PRIMARY KEY,
    classroom_id VARCHAR(36) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    posted_by VARCHAR(36) NOT NULL, -- teacher id
    posted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME DEFAULT NULL,
    is_important BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (classroom_id) REFERENCES classrooms(id),
    FOREIGN KEY (posted_by) REFERENCES users(id)
);

-- Index for fast retrieval
CREATE INDEX idx_classroom_announcements_classroom_id ON classroom_announcements(classroom_id);
CREATE INDEX idx_classroom_announcements_posted_at ON classroom_announcements(posted_at);
