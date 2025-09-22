-- 016_create_expenses_module.sql
-- Migration for enterprise-grade expense management module


CREATE TABLE expenses (
    expense_id INT AUTO_INCREMENT PRIMARY KEY,
    date DATE NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    description TEXT,
    category VARCHAR(32) NOT NULL,
    subcategory VARCHAR(32),
    payment_mode ENUM('cheque','cash','UPI','online','RTGS') NOT NULL,
    vendor VARCHAR(128),
    receipt_image_url VARCHAR(255),
    created_by VARCHAR(36) NOT NULL,
    raised_by_role ENUM('admin','owner','financial_manager') NOT NULL,
    approved_by VARCHAR(36),
    status ENUM('pending','approved','rejected') DEFAULT 'pending',
    approval_notes TEXT,
    recurring ENUM('No','Yes') DEFAULT 'No',
    recurring_type ENUM('monthly','quarterly','yearly'),
    next_due_date DATE,
    recurring_remove_reason TEXT,
    GST VARCHAR(32),
    proforma_invoice_number VARCHAR(64),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (approved_by) REFERENCES users(id)
);

CREATE INDEX idx_expenses_category ON expenses(category);
CREATE INDEX idx_expenses_status ON expenses(status);
CREATE INDEX idx_expenses_recurring ON expenses(recurring);

-- Audit log for expense actions

CREATE TABLE expense_audit_logs (
    log_id INT AUTO_INCREMENT PRIMARY KEY,
    expense_id INT NOT NULL,
    action VARCHAR(32) NOT NULL,
    performed_by VARCHAR(36) NOT NULL,
    performed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    details TEXT,
    FOREIGN KEY (expense_id) REFERENCES expenses(expense_id),
    FOREIGN KEY (performed_by) REFERENCES users(id)
);

-- For notifications (in-app)

CREATE TABLE expense_notifications (
    notification_id INT AUTO_INCREMENT PRIMARY KEY,
    expense_id INT NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (expense_id) REFERENCES expenses(expense_id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);
