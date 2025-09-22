-- Migration: Create invoice_requests table for approval workflow
CREATE TABLE IF NOT EXISTS invoice_requests (
    id VARCHAR(36) PRIMARY KEY,
    child_id VARCHAR(36) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    due_date DATE NOT NULL,
    description VARCHAR(255),
    status ENUM('Pending','Approved','Rejected') DEFAULT 'Pending',
    requested_by VARCHAR(36) NOT NULL,
    reviewed_by VARCHAR(36),
    reviewed_at DATETIME,
    rejection_reason VARCHAR(255),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_invoice_req_child FOREIGN KEY (child_id) REFERENCES children(id),
    CONSTRAINT fk_invoice_req_requested_by FOREIGN KEY (requested_by) REFERENCES users(id),
    CONSTRAINT fk_invoice_req_reviewed_by FOREIGN KEY (reviewed_by) REFERENCES users(id)
);
