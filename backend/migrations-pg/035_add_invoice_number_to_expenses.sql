-- 035_add_invoice_number_to_expenses.sql
-- Add invoice_number column and expense_sequences table for expense tracking

-- Add invoice_number column to expenses table
ALTER TABLE expenses ADD COLUMN invoice_number VARCHAR(64) UNIQUE;

-- Create expense_sequences table for generating unique invoice numbers
CREATE TABLE IF NOT EXISTS expense_sequences (
    type VARCHAR(32) PRIMARY KEY,
    last_seq INT NOT NULL DEFAULT 0
);
