import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import pool from './db.js';
import { protect, checkRole } from './authMiddleware.js';
import { logSecurityEvent } from './utils/security.js';

const router = express.Router();

// Create invoice request (admin only)
router.post('/', protect, checkRole(['admin', 'owner']), async (req, res) => {
    const { child_id, amount, dueDate, description } = req.body;
    if (!child_id || !amount || !dueDate) {
        return res.status(400).json({ message: 'Missing required fields.' });
    }
    try {
        const id = uuidv4();
        await pool.query(
            `INSERT INTO invoice_requests (id, child_id, amount, due_date, description, status, requested_by)
             VALUES (?, ?, ?, ?, ?, 'Pending', ?)`,
            [id, child_id, amount, dueDate, description || '', req.user.id]
        );
        await logSecurityEvent(req.user.id, 'INVOICE_REQUEST_CREATED', req.ip, req.get('User-Agent'), { child_id, amount, dueDate, description });
        res.status(201).json({ message: 'Invoice request submitted for approval.' });
    } catch (error) {
        console.error('Error creating invoice request:', error);
        res.status(500).json({ message: 'Server error while creating invoice request.' });
    }
});

// Get all invoice requests (financial_manager and super_admin only)
router.get('/', protect, checkRole(['financial_manager', 'super_admin']), async (req, res) => {
    try {
        const [requests] = await pool.query(
            `SELECT ir.*, c.first_name as child_name
             FROM invoice_requests ir
             JOIN children c ON ir.child_id = c.id
             ORDER BY ir.created_at DESC`
        );
        res.json({ requests });
    } catch (error) {
        console.error('Error fetching invoice requests:', error);
        res.status(500).json({ message: 'Server error while fetching invoice requests.' });
    }
});

// Approve invoice request (financial_manager and super_admin only)
router.post('/:id/approve', protect, checkRole(['financial_manager', 'super_admin']), async (req, res) => {
    const { id } = req.params;
    try {
        // Get request details
        const [[request]] = await pool.query('SELECT * FROM invoice_requests WHERE id = ?', [id]);
        if (!request) return res.status(404).json({ message: 'Request not found.' });
        if (request.status !== 'Pending') return res.status(400).json({ message: 'Request already processed.' });

        // Create invoice (reuse logic from invoiceRoutes if needed)
        const invoiceId = uuidv4();
        const now = new Date();
        const issueDate = now.toISOString().slice(0, 10);
        const dueDate = request.due_date;
        // Generate invoice number (reuse existing logic)
        // For simplicity, use a placeholder here; in real code, call generateInvoiceNumber
        const invoiceNumber = 'REQ-' + now.getTime();
        // Get child info
        const [[child]] = await pool.query('SELECT * FROM children WHERE id = ?', [request.child_id]);
        if (!child) return res.status(400).json({ message: 'Child not found.' });
        await pool.query(
            `INSERT INTO invoices (id, invoice_number, child_id, parent_name, parent_phone, parent_email, issue_date, due_date, total_amount, status, center_id, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending', ?, NOW())`,
            [invoiceId, invoiceNumber, child.id, child.parent_first_name + ' ' + child.parent_last_name, child.phone_number, child.email, issueDate, dueDate, request.amount, child.center_id]
        );
        // Optionally, add line item
        // ...
        // Update request status
        await pool.query(
            `UPDATE invoice_requests SET status = 'Approved', reviewed_by = ?, reviewed_at = NOW() WHERE id = ?`,
            [req.user.id, id]
        );
    await logSecurityEvent(req.user.id, 'INVOICE_REQUEST_APPROVED', req.ip, req.get('User-Agent'), { request_id: id, invoice_id: invoiceId });
    res.json({ message: 'Invoice request approved and invoice generated.' });
    } catch (error) {
        console.error('Error approving invoice request:', error);
        res.status(500).json({ message: 'Server error while approving invoice request.' });
    }
});

// Reject invoice request (financial_manager and super_admin only)
router.post('/:id/reject', protect, checkRole(['financial_manager', 'super_admin']), async (req, res) => {
    const { id } = req.params;
    const { reason } = req.body;
    if (!reason) return res.status(400).json({ message: 'Rejection reason required.' });
    try {
        const [[request]] = await pool.query('SELECT * FROM invoice_requests WHERE id = ?', [id]);
        if (!request) return res.status(404).json({ message: 'Request not found.' });
        if (request.status !== 'Pending') return res.status(400).json({ message: 'Request already processed.' });
        await pool.query(
            `UPDATE invoice_requests SET status = 'Rejected', reviewed_by = ?, reviewed_at = NOW(), rejection_reason = ? WHERE id = ?`,
            [req.user.id, reason, id]
        );
    await logSecurityEvent(req.user.id, 'INVOICE_REQUEST_REJECTED', req.ip, req.get('User-Agent'), { request_id: id, reason });
    res.json({ message: 'Invoice request rejected.' });
    } catch (error) {
        console.error('Error rejecting invoice request:', error);
        res.status(500).json({ message: 'Server error while rejecting invoice request.' });
    }
});

export default router;
