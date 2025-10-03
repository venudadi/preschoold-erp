import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import pool from './db.js';
import { protect, checkRole } from './authMiddleware.js';
import { logSecurityEvent } from './utils/security.js';
import { 
  asyncHandler, 
  ValidationError, 
  NotFoundError, 
  ConflictError,
  validateRequired,
  handleDbOperation,
  successResponse 
} from './utils/errorHandler.js';
import { safeDbOperation, ensureTableExists } from './utils/dbTableValidator.js';

const router = express.Router();

// Create invoice request (admin only)
router.post('/', protect, checkRole(['admin', 'owner']), asyncHandler(async (req, res) => {
    const { child_id, amount, dueDate, description } = req.body;
    
    // Validate required fields
    validateRequired(req.body, ['child_id', 'amount', 'dueDate']);
    
    // Validate data types and ranges
    if (isNaN(amount) || amount <= 0) {
        throw new ValidationError('Amount must be a positive number');
    }
    
    const result = await safeDbOperation(async () => {
        const id = uuidv4();
        await pool.query(
            `INSERT INTO invoice_requests (id, child_id, amount, due_date, description, status, requested_by)
             VALUES (?, ?, ?, ?, ?, 'Pending', ?)`,
            [id, child_id, amount, dueDate, description || '', req.user.id]
        );
        return { id, message: 'Invoice request submitted for approval.' };
    }, 'invoice_requests');
    
    await logSecurityEvent(req.user.id, 'INVOICE_REQUEST_CREATED', req.ip, req.get('User-Agent'), { child_id, amount, dueDate, description });
    res.status(201).json(successResponse(result, 'Invoice request created successfully'));
}));

// Get all invoice requests (financial_manager and super_admin only)
router.get('/', protect, checkRole(['financial_manager', 'super_admin']), asyncHandler(async (req, res) => {
    const requests = await safeDbOperation(async () => {
        const [results] = await pool.query(
            `SELECT ir.*, c.first_name as child_name, 
                    CONCAT(u.first_name, ' ', u.last_name) as requested_by_name,
                    CONCAT(reviewer.first_name, ' ', reviewer.last_name) as reviewed_by_name
             FROM invoice_requests ir
             LEFT JOIN children c ON ir.child_id = c.id
             LEFT JOIN users u ON ir.requested_by = u.id
             LEFT JOIN users reviewer ON ir.reviewed_by = reviewer.id
             ORDER BY ir.created_at DESC`
        );
        return results;
    }, 'invoice_requests');
    
    res.json(successResponse(requests, 'Invoice requests retrieved successfully', { count: requests.length }));
}));

// Approve invoice request (financial_manager and super_admin only)
router.post('/:id/approve', protect, checkRole(['financial_manager', 'super_admin']), asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    if (!id) {
        throw new ValidationError('Request ID is required');
    }
    
    const result = await safeDbOperation(async () => {
        // Get request details
        const [[request]] = await pool.query('SELECT * FROM invoice_requests WHERE id = ?', [id]);
        if (!request) {
            throw new NotFoundError('Invoice request not found');
        }
        if (request.status !== 'Pending') {
            throw new ConflictError('Request has already been processed');
        }

        // Get child info
        const [[child]] = await pool.query('SELECT * FROM children WHERE id = ?', [request.child_id]);
        if (!child) {
            throw new NotFoundError('Associated child not found');
        }

        // Create invoice
        const invoiceId = uuidv4();
        const now = new Date();
        const issueDate = now.toISOString().slice(0, 10);
        const dueDate = request.due_date;
        const invoiceNumber = 'REQ-' + now.getTime();
        
        await pool.query(
            `INSERT INTO invoices (id, invoice_number, child_id, parent_name, parent_phone, parent_email, issue_date, due_date, total_amount, status, center_id, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending', ?, NOW())`,
            [invoiceId, invoiceNumber, child.id, child.parent_first_name + ' ' + child.parent_last_name, child.phone_number, child.email, issueDate, dueDate, request.amount, child.center_id]
        );
        
        // Update request status
        await pool.query(
            `UPDATE invoice_requests SET status = 'Approved', reviewed_by = ?, reviewed_at = NOW() WHERE id = ?`,
            [req.user.id, id]
        );
        
        return { 
            request_id: id, 
            invoice_id: invoiceId, 
            invoice_number: invoiceNumber,
            message: 'Invoice request approved and invoice generated'
        };
    }, 'invoice_requests');
    
    await logSecurityEvent(req.user.id, 'INVOICE_REQUEST_APPROVED', req.ip, req.get('User-Agent'), { request_id: id, invoice_id: result.invoice_id });
    res.json(successResponse(result, 'Invoice request approved successfully'));
}));

// Reject invoice request (financial_manager and super_admin only)
router.post('/:id/reject', protect, checkRole(['financial_manager', 'super_admin']), asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { reason } = req.body;
    
    if (!id) {
        throw new ValidationError('Request ID is required');
    }
    
    validateRequired(req.body, ['reason']);
    
    const result = await safeDbOperation(async () => {
        const [[request]] = await pool.query('SELECT * FROM invoice_requests WHERE id = ?', [id]);
        if (!request) {
            throw new NotFoundError('Invoice request not found');
        }
        if (request.status !== 'Pending') {
            throw new ConflictError('Request has already been processed');
        }
        
        await pool.query(
            `UPDATE invoice_requests SET status = 'Rejected', reviewed_by = ?, reviewed_at = NOW(), rejection_reason = ? WHERE id = ?`,
            [req.user.id, reason, id]
        );
        
        return { 
            request_id: id, 
            reason: reason,
            message: 'Invoice request rejected successfully' 
        };
    }, 'invoice_requests');
    
    await logSecurityEvent(req.user.id, 'INVOICE_REQUEST_REJECTED', req.ip, req.get('User-Agent'), { request_id: id, reason });
    res.json(successResponse(result, 'Invoice request rejected'));
}));

export default router;
