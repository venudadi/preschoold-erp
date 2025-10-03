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

// Helper: generate next invoice number per type (atomic)
async function generateInvoiceNumber(type) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    // initialize row if not exists
    await conn.query(
      `INSERT INTO expense_sequences (type, last_seq) VALUES (?, 0) ON DUPLICATE KEY UPDATE last_seq=last_seq`,
      [type]
    );
    const [rows] = await conn.query('SELECT last_seq FROM expense_sequences WHERE type=? FOR UPDATE', [type]);
    let last = 0;
    if (rows && rows.length > 0) last = rows[0].last_seq || 0;
    const next = last + 1;
    await conn.query('UPDATE expense_sequences SET last_seq=? WHERE type=?', [next, type]);
    await conn.commit();
    // Format invoice number: TYPE-YYYYMM-00000
    const now = new Date();
    const ym = `${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}`;
    const padded = String(next).padStart(5, '0');
    return `${type.toUpperCase()}-${ym}-${padded}`;
  } catch (err) {
    try { await conn.rollback(); } catch(e){}
    throw err;
  } finally {
    conn.release();
  }
}

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
      date, amount, description, category, subcategory, payment_mode = 'online', vendor, receipt_image_url,
      recurring = 'No', recurring_type = null, next_due_date = null, GST = 0, proforma_invoice_number = null
    } = req.body;
    const created_by = req.user.id;
    const raised_by_role = 'financial_manager';

    // Prepare expense id and invoice number
    const expense_id = uuidv4();
    const invoice_type = payment_mode || 'online';
    const invoice_number = await generateInvoiceNumber(invoice_type);

    const [result] = await pool.query(
      `INSERT INTO expenses (expense_id, invoice_number, date, amount, description, category, subcategory, payment_mode, vendor, receipt_image_url, created_by, raised_by_role, recurring, recurring_type, next_due_date, GST, proforma_invoice_number, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'approved')`,
      [expense_id, invoice_number, date, amount, description, category, subcategory, payment_mode, vendor, receipt_image_url, created_by, raised_by_role, recurring, recurring_type, next_due_date, GST, proforma_invoice_number]
    );
    await logAudit(expense_id, 'log', created_by, `Logged new expense, invoice:${invoice_number}`);
    res.status(201).json({ success: true, expense_id, invoice_number });
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
    // Prepare expense id and invoice number (for pending requests we'll still reserve an invoice)
    const expense_id = uuidv4();
    const invoice_type = payment_mode || 'online';
    const invoice_number = await generateInvoiceNumber(invoice_type);

    const [result] = await pool.query(
      `INSERT INTO expenses (expense_id, invoice_number, date, amount, description, category, subcategory, payment_mode, vendor, receipt_image_url, created_by, raised_by_role, recurring, recurring_type, next_due_date, GST, proforma_invoice_number, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [expense_id, invoice_number, date, amount, description, category, subcategory, payment_mode, vendor, receipt_image_url, created_by, raised_by_role, recurring, recurring_type, next_due_date, GST, proforma_invoice_number]
    );
    await logAudit(expense_id, 'request', created_by, `Raised expense request invoice:${invoice_number}`);
    res.status(201).json({ success: true, expense_id, invoice_number });
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
      `UPDATE expenses SET status='approved', approved_by=?, updated_at=CURRENT_TIMESTAMP WHERE expense_id=?`,
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
      `UPDATE expenses SET status='rejected', approved_by=?, approval_notes=?, updated_at=CURRENT_TIMESTAMP WHERE expense_id=?`,
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
      `UPDATE expenses SET recurring='No', recurring_remove_reason=?, updated_at=CURRENT_TIMESTAMP WHERE expense_id=?`,
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
    const filters = [];
    const params = [];
    if (req.query.status) { filters.push('status=?'); params.push(req.query.status); }
    if (req.query.category) { filters.push('category=?'); params.push(req.query.category); }
    if (req.query.start_date) { filters.push('date>=?'); params.push(req.query.start_date); }
    if (req.query.end_date) { filters.push('date<=?'); params.push(req.query.end_date); }
    let sql = 'SELECT * FROM expenses';
    if (filters.length) sql += ' WHERE ' + filters.join(' AND ');
    sql += ' ORDER BY created_at DESC LIMIT 500';
    const [rows] = await pool.query(sql, params);
    res.json({ success: true, expenses: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

// Export expenses to Excel
export async function exportExpenses(req, res) {
  try {
    // Support filters: start_date, end_date, category, status
    const filters = [];
    const params = [];
    if (req.query.start_date) { filters.push('date >= ?'); params.push(req.query.start_date); }
    if (req.query.end_date) { filters.push('date <= ?'); params.push(req.query.end_date); }
    if (req.query.category) { filters.push('category = ?'); params.push(req.query.category); }
    if (req.query.status) { filters.push('status = ?'); params.push(req.query.status); }

    let sql = 'SELECT * FROM expenses';
    if (filters.length) sql += ' WHERE ' + filters.join(' AND ');
    sql += ' ORDER BY created_at DESC';
    const [rows] = await pool.query(sql, params);
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Expenses');
    if (rows.length > 0) {
      worksheet.columns = Object.keys(rows[0]).map(key => ({ header: key, key }));
      worksheet.addRows(rows);
    }
    const startLabel = req.query.start_date ? req.query.start_date.replace(/-/g,'') : '';
    const endLabel = req.query.end_date ? req.query.end_date.replace(/-/g,'') : '';
    const rangeLabel = startLabel || endLabel ? `_${startLabel || 'any'}-${endLabel || 'any'}` : '';
    const filePath = path.join(process.cwd(), 'tmp', `expenses_export${rangeLabel}_${Date.now()}.xlsx`);
    // Ensure tmp directory exists
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    await workbook.xlsx.writeFile(filePath);
    res.download(filePath, path.basename(filePath), () => {
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
