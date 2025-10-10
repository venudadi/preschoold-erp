-- Parent-Teacher Messaging
-- Table: messages
CREATE TABLE IF NOT EXISTS messages (
    id VARCHAR(36) PRIMARY KEY,
    thread_id VARCHAR(36) NOT NULL,
    sender_id VARCHAR(36) NOT NULL,
    recipient_id VARCHAR(36) NOT NULL,
    content TEXT NOT NULL,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_read BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (sender_id) REFERENCES users(id),
    FOREIGN KEY (recipient_id) REFERENCES users(id)
);

-- Table: message_threads
CREATE TABLE IF NOT EXISTS message_threads (
    id VARCHAR(36) PRIMARY KEY,
    child_id VARCHAR(36) NOT NULL,
    parent_id VARCHAR(36) NOT NULL,
    teacher_id VARCHAR(36) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_message_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (child_id) REFERENCES children(id),
    FOREIGN KEY (parent_id) REFERENCES users(id),
    FOREIGN KEY (teacher_id) REFERENCES users(id)
);
