// Expense analytics (totals, by category, by status, recurring, cost of acquisition)
export async function getExpenseAnalytics(req, res) {
  try {
    // Total expenses
    const [[{ total_expenses }]] = await pool.query('SELECT SUM(amount) as total_expenses FROM expenses WHERE status="approved"');
    // By category
    const [byCategory] = await pool.query('SELECT category, SUM(amount) as total FROM expenses WHERE status="approved" GROUP BY category');
    // By status
    const [byStatus] = await pool.query('SELECT status, SUM(amount) as total FROM expenses GROUP BY status');
    // Recurring
    const [[{ recurring_total }]] = await pool.query('SELECT SUM(amount) as recurring_total FROM expenses WHERE recurring="Yes" AND status="approved"');
    // Marketing spend (for acquisition)
    const [[{ marketing_total }]] = await pool.query('SELECT SUM(amount) as marketing_total FROM expenses WHERE category="marketing" AND status="approved"');
    // New students (acquisition)
    const [[{ new_students }]] = await pool.query('SELECT COUNT(*) as new_students FROM children WHERE YEAR(created_at) = YEAR(CURDATE())');
    // Cost of acquisition
    const cost_of_acquisition = new_students > 0 ? (marketing_total || 0) / new_students : 0;
    res.json({
      total_expenses: total_expenses || 0,
      byCategory,
      byStatus,
      recurring_total: recurring_total || 0,
      marketing_total: marketing_total || 0,
      new_students: new_students || 0,
      cost_of_acquisition: Math.round(cost_of_acquisition * 100) / 100
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}
// controllers/expenseController.js
import pool from '../db.js';
import { v4 as uuidv4 } from 'uuid';
import ExcelJS from 'exceljs';
import path from 'path';
import fs from 'fs';

// Helper: Audit log
async function logAudit(expense_id, action, performed_by, details) {
  await pool.query(
    'INSERT INTO expense_audit_logs (expense_id, action, performed_by, details) VALUES (?, ?, ?, ?)',
    [expense_id, action, performed_by, details || null]
  );
}

// Log a new expense (financial manager)
export async function logExpense(req, res) {
  try {
    const {
      date, amount, description, category, subcategory, payment_mode, vendor, receipt_image_url,
      recurring, recurring_type, next_due_date, GST, proforma_invoice_number
    } = req.body;
    const created_by = req.user.id;
    const raised_by_role = 'financial_manager';
    const [result] = await pool.query(
      `INSERT INTO expenses (date, amount, description, category, subcategory, payment_mode, vendor, receipt_image_url, created_by, raised_by_role, recurring, recurring_type, next_due_date, GST, proforma_invoice_number, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'approved')`,
      [date, amount, description, category, subcategory, payment_mode, vendor, receipt_image_url, created_by, raised_by_role, recurring, recurring_type, next_due_date, GST, proforma_invoice_number]
    );
    await logAudit(result.insertId, 'log', created_by, 'Logged new expense');
    res.status(201).json({ success: true, expense_id: result.insertId });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

// Upload receipt image (financial manager)
export async function uploadReceipt(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }
    // Optionally, associate with an expense_id if provided
    const { expense_id } = req.body;
    const filePath = path.relative(process.cwd(), req.file.path);
    let updateResult = null;
    if (expense_id) {
      [updateResult] = await pool.query(
        'UPDATE expenses SET receipt_image_url=? WHERE expense_id=?',
        [filePath, expense_id]
      );
      await logAudit(expense_id, 'upload_receipt', req.user.id, 'Uploaded receipt image');
    }
    res.status(200).json({ success: true, filePath, updated: !!updateResult });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

// Raise expense request (admin, owner)
export async function raiseExpenseRequest(req, res) {
  try {
    const {
      date, amount, description, category, subcategory, payment_mode, vendor, receipt_image_url,
      recurring, recurring_type, next_due_date, GST, proforma_invoice_number
    } = req.body;
    const created_by = req.user.id;
    const raised_by_role = req.user.role;
    const [result] = await pool.query(
      `INSERT INTO expenses (date, amount, description, category, subcategory, payment_mode, vendor, receipt_image_url, created_by, raised_by_role, recurring, recurring_type, next_due_date, GST, proforma_invoice_number, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [date, amount, description, category, subcategory, payment_mode, vendor, receipt_image_url, created_by, raised_by_role, recurring, recurring_type, next_due_date, GST, proforma_invoice_number]
    );
    await logAudit(result.insertId, 'request', created_by, 'Raised expense request');
    res.status(201).json({ success: true, expense_id: result.insertId });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

// Approve expense request (financial manager)
export async function approveExpenseRequest(req, res) {
  try {
    const expenseId = req.params.expenseId;
    const approved_by = req.user.id;
    await pool.query(
      `UPDATE expenses SET status='approved', approved_by=? WHERE expense_id=?`,
      [approved_by, expenseId]
    );
    await logAudit(expenseId, 'approve', approved_by, 'Approved expense request');
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

// Reject expense request (financial manager)
export async function rejectExpenseRequest(req, res) {
  try {
    const expenseId = req.params.expenseId;
    const approved_by = req.user.id;
    const { approval_notes } = req.body;
    await pool.query(
      `UPDATE expenses SET status='rejected', approved_by=?, approval_notes=? WHERE expense_id=?`,
      [approved_by, approval_notes, expenseId]
    );
    await logAudit(expenseId, 'reject', approved_by, 'Rejected expense request');
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

// Remove recurring expense (financial manager)
export async function removeRecurringExpense(req, res) {
  try {
    const expenseId = req.params.expenseId;
    const { recurring_remove_reason } = req.body;
    const userId = req.user.id;
    await pool.query(
      `UPDATE expenses SET recurring='No', recurring_remove_reason=? WHERE expense_id=?`,
      [recurring_remove_reason, expenseId]
    );
    await logAudit(expenseId, 'remove_recurring', userId, 'Removed recurring expense');
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

// Get expenses (with filters)
export async function getExpenses(req, res) {
  try {
    // Add filters as needed (date, category, status, etc.)
    const [rows] = await pool.query('SELECT * FROM expenses');
    res.json({ success: true, expenses: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

// Export expenses to Excel
export async function exportExpenses(req, res) {
  try {
    // Add filters as needed
    const [rows] = await pool.query('SELECT * FROM expenses');
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Expenses');
    if (rows.length > 0) {
      worksheet.columns = Object.keys(rows[0]).map(key => ({ header: key, key }));
      worksheet.addRows(rows);
    }
    const filePath = path.join(process.cwd(), 'tmp', `expenses_export_${Date.now()}.xlsx`);
    // Ensure tmp directory exists
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    await workbook.xlsx.writeFile(filePath);
    res.download(filePath, 'expenses.xlsx', () => {
      fs.unlinkSync(filePath);
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

// Get notifications
export async function getExpenseNotifications(req, res) {
  try {
    const userId = req.user.id;
    const [rows] = await pool.query('SELECT * FROM expense_notifications WHERE user_id=?', [userId]);
    res.json({ success: true, notifications: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

// Mark notification as read
export async function markNotificationRead(req, res) {
  try {
    const notificationId = req.params.notificationId;
    await pool.query('UPDATE expense_notifications SET is_read=1 WHERE notification_id=?', [notificationId]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}
