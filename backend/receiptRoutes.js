import express from 'express';
import pool from './db.js';
import { protect } from './authMiddleware.js';
import { v4 as uuidv4 } from 'uuid';
import PDFDocument from 'pdfkit';

const router = express.Router();

// --- CREATE RECEIPT (Cash Payment) ---
router.post('/', protect, async (req, res) => {
    if (!['admin', 'owner', 'center_director'].includes(req.user.role)) {
        return res.status(403).json({ message: 'Forbidden: Access restricted to administrators.' });
    }

    const {
        childId,
        parentId,
        billingPeriodStart,
        billingPeriodEnd,
        dueDate,
        baseAmount,
        otherFees,
        paymentDate,
        paymentMethod,
        notes,
        status
    } = req.body;

    if (!childId || !parentId || !baseAmount || !billingPeriodStart || !billingPeriodEnd) {
        return res.status(400).json({ message: 'Child, parent, amount, and billing period are required.' });
    }

    const { centerId, userId } = req.user;
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        // Verify child belongs to this center and has cash payment mode
        const [children] = await connection.query(
            'SELECT payment_mode FROM children WHERE id = ? AND center_id = ?',
            [childId, centerId]
        );

        if (children.length === 0) {
            await connection.rollback();
            return res.status(404).json({ message: 'Child not found in your center.' });
        }

        if (children[0].payment_mode !== 'Cash') {
            await connection.rollback();
            return res.status(400).json({
                message: 'This child is not configured for cash payments. Please use invoice generation instead.'
            });
        }

        // Generate receipt number: RCP{YY}{MM}{XXXX}
        const now = new Date();
        const year = now.getFullYear().toString().slice(-2);
        const month = (now.getMonth() + 1).toString().padStart(2, '0');
        const receiptPrefix = `RCP${year}${month}`;

        const [lastReceipts] = await connection.query(
            'SELECT receipt_number FROM payment_receipts WHERE receipt_number LIKE ? ORDER BY receipt_number DESC LIMIT 1',
            [`${receiptPrefix}%`]
        );

        let newSerial = 1;
        if (lastReceipts.length > 0) {
            const lastSerial = parseInt(lastReceipts[0].receipt_number.slice(-4));
            newSerial = lastSerial + 1;
        }

        const receiptNumber = `${receiptPrefix}${newSerial.toString().padStart(4, '0')}`;

        // Calculate total
        const totalAmount = parseFloat(baseAmount) + (parseFloat(otherFees) || 0);
        const amountCollected = status === 'Collected' ? totalAmount : 0;

        const receiptId = uuidv4();
        const insertSql = `
            INSERT INTO payment_receipts (
                id, receipt_number, child_id, parent_id, center_id,
                billing_period_start, billing_period_end, due_date,
                base_amount, other_fees, total_amount, amount_collected,
                payment_date, payment_method, collected_by, notes, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        await connection.query(insertSql, [
            receiptId,
            receiptNumber,
            childId,
            parentId,
            centerId,
            billingPeriodStart,
            billingPeriodEnd,
            dueDate || billingPeriodEnd,
            baseAmount,
            otherFees || 0,
            totalAmount,
            amountCollected,
            paymentDate || null,
            paymentMethod || 'Cash',
            status === 'Collected' ? userId : null,
            notes || null,
            status || 'Pending'
        ]);

        await connection.commit();
        res.status(201).json({
            message: 'Receipt created successfully!',
            receiptId,
            receiptNumber
        });

    } catch (error) {
        await connection.rollback();
        console.error('Error creating receipt:', error);
        res.status(500).json({ message: 'Server error creating receipt.' });
    } finally {
        connection.release();
    }
});

// --- GET ALL RECEIPTS ---
router.get('/', protect, async (req, res) => {
    const { status, childName, startDate, endDate, page = 1, limit = 50 } = req.query;
    const { centerId } = req.user;

    try {
        let query = `
            SELECT
                pr.id,
                pr.receipt_number,
                pr.billing_period_start,
                pr.billing_period_end,
                pr.due_date,
                pr.total_amount,
                pr.amount_collected,
                pr.payment_date,
                pr.payment_method,
                pr.status,
                pr.created_at,
                CONCAT(c.first_name, ' ', c.last_name) as child_name,
                c.student_id,
                CONCAT(p.first_name, ' ', p.last_name) as parent_name,
                p.phone_number as parent_phone,
                u.username as collected_by_name
            FROM payment_receipts pr
            INNER JOIN children c ON pr.child_id = c.id
            INNER JOIN parents p ON pr.parent_id = p.id
            LEFT JOIN users u ON pr.collected_by = u.id
            WHERE pr.center_id = ?
        `;

        const params = [centerId];

        if (status) {
            query += ' AND pr.status = ?';
            params.push(status);
        }

        if (childName) {
            query += ' AND (c.first_name LIKE ? OR c.last_name LIKE ? OR c.student_id LIKE ?)';
            const searchTerm = `%${childName}%`;
            params.push(searchTerm, searchTerm, searchTerm);
        }

        if (startDate && endDate) {
            query += ' AND pr.billing_period_start BETWEEN ? AND ?';
            params.push(startDate, endDate);
        }

        query += ' ORDER BY pr.created_at DESC';

        // Add pagination
        const offset = (parseInt(page) - 1) * parseInt(limit);
        query += ' LIMIT ? OFFSET ?';
        params.push(parseInt(limit), offset);

        const [receipts] = await pool.query(query, params);

        // Get total count
        let countQuery = `
            SELECT COUNT(*) as total
            FROM payment_receipts pr
            INNER JOIN children c ON pr.child_id = c.id
            WHERE pr.center_id = ?
        `;
        const countParams = [centerId];

        if (status) {
            countQuery += ' AND pr.status = ?';
            countParams.push(status);
        }

        if (childName) {
            countQuery += ' AND (c.first_name LIKE ? OR c.last_name LIKE ? OR c.student_id LIKE ?)';
            const searchTerm = `%${childName}%`;
            countParams.push(searchTerm, searchTerm, searchTerm);
        }

        const [countResult] = await pool.query(countQuery, countParams);
        const total = countResult[0].total;

        res.status(200).json({
            receipts,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / parseInt(limit))
            }
        });

    } catch (error) {
        console.error('Error fetching receipts:', error);
        res.status(500).json({ message: 'Server error fetching receipts.' });
    }
});

// --- GET SINGLE RECEIPT ---
router.get('/:id', protect, async (req, res) => {
    const { id } = req.params;
    const { centerId } = req.user;

    try {
        const query = `
            SELECT
                pr.*,
                CONCAT(c.first_name, ' ', c.last_name) as child_name,
                c.student_id,
                c.date_of_birth,
                CONCAT(p.first_name, ' ', p.last_name) as parent_name,
                p.phone_number as parent_phone,
                p.email as parent_email,
                p.address as parent_address,
                ce.name as center_name,
                ce.address as center_address,
                ce.phone as center_phone,
                u.username as collected_by_name
            FROM payment_receipts pr
            INNER JOIN children c ON pr.child_id = c.id
            INNER JOIN parents p ON pr.parent_id = p.id
            INNER JOIN centers ce ON pr.center_id = ce.id
            LEFT JOIN users u ON pr.collected_by = u.id
            WHERE pr.id = ? AND pr.center_id = ?
        `;

        const [receipts] = await pool.query(query, [id, centerId]);

        if (receipts.length === 0) {
            return res.status(404).json({ message: 'Receipt not found.' });
        }

        res.status(200).json({ receipt: receipts[0] });

    } catch (error) {
        console.error('Error fetching receipt:', error);
        res.status(500).json({ message: 'Server error fetching receipt.' });
    }
});

// --- UPDATE RECEIPT (Mark as Collected/Cancelled) ---
router.put('/:id', protect, async (req, res) => {
    if (!['admin', 'owner', 'center_director'].includes(req.user.role)) {
        return res.status(403).json({ message: 'Forbidden: Access restricted to administrators.' });
    }

    const { id } = req.params;
    const { status, paymentDate, paymentMethod, notes, amountCollected } = req.body;
    const { userId, centerId } = req.user;

    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        // Verify receipt exists and belongs to this center
        const [receipts] = await connection.query(
            'SELECT * FROM payment_receipts WHERE id = ? AND center_id = ?',
            [id, centerId]
        );

        if (receipts.length === 0) {
            await connection.rollback();
            return res.status(404).json({ message: 'Receipt not found.' });
        }

        const receipt = receipts[0];

        // Build update query dynamically
        let updateFields = [];
        let params = [];

        if (status) {
            updateFields.push('status = ?');
            params.push(status);

            if (status === 'Collected' && !receipt.collected_by) {
                updateFields.push('collected_by = ?');
                params.push(userId);
            }
        }

        if (paymentDate) {
            updateFields.push('payment_date = ?');
            params.push(paymentDate);
        }

        if (paymentMethod) {
            updateFields.push('payment_method = ?');
            params.push(paymentMethod);
        }

        if (notes !== undefined) {
            updateFields.push('notes = ?');
            params.push(notes);
        }

        if (amountCollected !== undefined) {
            updateFields.push('amount_collected = ?');
            params.push(amountCollected);
        }

        if (updateFields.length === 0) {
            await connection.rollback();
            return res.status(400).json({ message: 'No fields to update.' });
        }

        updateFields.push('updated_at = NOW()');
        params.push(id);

        const updateSql = `UPDATE payment_receipts SET ${updateFields.join(', ')} WHERE id = ?`;
        await connection.query(updateSql, params);

        await connection.commit();
        res.status(200).json({ message: 'Receipt updated successfully!' });

    } catch (error) {
        await connection.rollback();
        console.error('Error updating receipt:', error);
        res.status(500).json({ message: 'Server error updating receipt.' });
    } finally {
        connection.release();
    }
});

// --- GET PENDING CASH PAYMENTS (Before Due Date) ---
router.get('/pending/overdue', protect, async (req, res) => {
    const { centerId } = req.user;

    try {
        const query = `
            SELECT
                pr.id,
                pr.receipt_number,
                pr.due_date,
                pr.total_amount,
                pr.billing_period_start,
                pr.billing_period_end,
                CONCAT(c.first_name, ' ', c.last_name) as child_name,
                c.student_id,
                CONCAT(p.first_name, ' ', p.last_name) as parent_name,
                p.phone_number as parent_phone,
                DATEDIFF(CURDATE(), pr.due_date) as days_overdue
            FROM payment_receipts pr
            INNER JOIN children c ON pr.child_id = c.id
            INNER JOIN parents p ON pr.parent_id = p.id
            WHERE pr.center_id = ?
            AND pr.status IN ('Pending', 'Partial')
            AND pr.due_date < CURDATE()
            ORDER BY pr.due_date ASC
        `;

        const [overdueReceipts] = await pool.query(query, [centerId]);

        res.status(200).json({ overdueReceipts });

    } catch (error) {
        console.error('Error fetching overdue receipts:', error);
        res.status(500).json({ message: 'Server error fetching overdue receipts.' });
    }
});

// --- GENERATE RECEIPT PDF ---
router.get('/:id/pdf', protect, async (req, res) => {
    const { id } = req.params;
    const { centerId } = req.user;

    try {
        // Fetch receipt with full details
        const query = `
            SELECT
                pr.*,
                CONCAT(c.first_name, ' ', c.last_name) as child_name,
                c.student_id,
                CONCAT(p.first_name, ' ', p.last_name) as parent_name,
                p.phone_number as parent_phone,
                p.email as parent_email,
                p.address as parent_address,
                ce.name as center_name,
                ce.address as center_address,
                ce.phone as center_phone,
                ce.email as center_email,
                u.username as collected_by_name
            FROM payment_receipts pr
            INNER JOIN children c ON pr.child_id = c.id
            INNER JOIN parents p ON pr.parent_id = p.id
            INNER JOIN centers ce ON pr.center_id = ce.id
            LEFT JOIN users u ON pr.collected_by = u.id
            WHERE pr.id = ? AND pr.center_id = ?
        `;

        const [receipts] = await pool.query(query, [id, centerId]);

        if (receipts.length === 0) {
            return res.status(404).json({ message: 'Receipt not found.' });
        }

        const receipt = receipts[0];

        // Create PDF
        const doc = new PDFDocument({ size: 'A4', margin: 50 });

        // Set response headers
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=receipt-${receipt.receipt_number}.pdf`);

        doc.pipe(res);

        // Header
        doc.fontSize(20).text('PAYMENT RECEIPT', { align: 'center' });
        doc.moveDown();
        doc.fontSize(12).text(`Receipt #: ${receipt.receipt_number}`, { align: 'right' });
        doc.text(`Date: ${new Date(receipt.created_at).toLocaleDateString()}`, { align: 'right' });
        doc.moveDown();

        // Center Info
        doc.fontSize(14).text(receipt.center_name, { underline: true });
        doc.fontSize(10).text(receipt.center_address);
        doc.text(`Phone: ${receipt.center_phone}`);
        doc.moveDown();

        // Parent Info
        doc.fontSize(12).text('Received From:', { underline: true });
        doc.fontSize(10).text(`Name: ${receipt.parent_name}`);
        doc.text(`Phone: ${receipt.parent_phone}`);
        if (receipt.parent_address) {
            doc.text(`Address: ${receipt.parent_address}`);
        }
        doc.moveDown();

        // Child Info
        doc.fontSize(12).text('For Student:', { underline: true });
        doc.fontSize(10).text(`Name: ${receipt.child_name}`);
        doc.text(`Student ID: ${receipt.student_id}`);
        doc.moveDown();

        // Billing Period
        doc.fontSize(12).text('Billing Period:', { underline: true });
        doc.fontSize(10).text(
            `From: ${new Date(receipt.billing_period_start).toLocaleDateString()} To: ${new Date(receipt.billing_period_end).toLocaleDateString()}`
        );
        doc.moveDown();

        // Amount Details
        doc.fontSize(12).text('Amount Details:', { underline: true });
        doc.fontSize(10).text(`Base Fee: ₹${parseFloat(receipt.base_amount).toFixed(2)}`);
        if (receipt.other_fees > 0) {
            doc.text(`Other Fees: ₹${parseFloat(receipt.other_fees).toFixed(2)}`);
        }
        doc.fontSize(14).text(`Total Amount: ₹${parseFloat(receipt.total_amount).toFixed(2)}`, { bold: true });
        doc.moveDown();

        // Payment Details
        if (receipt.status === 'Collected') {
            doc.fontSize(12).text('Payment Details:', { underline: true });
            doc.fontSize(10).text(`Amount Collected: ₹${parseFloat(receipt.amount_collected).toFixed(2)}`);
            doc.text(`Payment Method: ${receipt.payment_method}`);
            if (receipt.payment_date) {
                doc.text(`Payment Date: ${new Date(receipt.payment_date).toLocaleDateString()}`);
            }
            if (receipt.collected_by_name) {
                doc.text(`Collected By: ${receipt.collected_by_name}`);
            }
        } else {
            doc.fontSize(12).text(`Status: ${receipt.status}`, { bold: true });
            doc.text(`Due Date: ${new Date(receipt.due_date).toLocaleDateString()}`);
        }

        if (receipt.notes) {
            doc.moveDown();
            doc.fontSize(10).text(`Notes: ${receipt.notes}`);
        }

        // Footer
        doc.moveDown(2);
        doc.fontSize(8).text('This is a computer-generated receipt.', { align: 'center', italics: true });
        doc.text('Thank you for your payment!', { align: 'center' });

        doc.end();

    } catch (error) {
        console.error('Error generating receipt PDF:', error);
        if (!res.headersSent) {
            res.status(500).json({ message: 'Server error generating receipt PDF.' });
        }
    }
});

export default router;
