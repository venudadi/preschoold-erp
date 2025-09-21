import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import pool from './db.js';
import { protect } from './authMiddleware.js';
import PDFDocument from 'pdfkit';
import path from 'path';
import fs from 'fs';
import pkg from 'number-to-words';
const { numberToWords } = pkg;

const router = express.Router();

// Middleware to check authorization for invoice routes
const checkInvoiceAccess = (req, res, next) => {
    const role = req.user.role;
    // super_admin has unrestricted access
    if (role === 'super_admin') {
        return next();
    }
    // admin and owner can only access their center's invoices
    if ((role === 'admin' || role === 'owner') && req.user.center_id) {
        // For list operations where centerId might be in query
        const centerId = req.params.centerId || req.query.centerId;
        if (req.user.center_id === centerId) {
            return next();
        }
    }
    // Allow access if no specific center filtering is needed (for general list view)
    if (!req.params.centerId && !req.query.centerId) {
        return next();
    }
    return res.status(403).json({ message: 'Forbidden: Access restricted to authorized administrators.' });
};

// Apply protection and access middleware to all routes
router.use(protect);
router.use(checkInvoiceAccess);

// Helper function to generate unique invoice number
const generateInvoiceNumber = async (connection, centerId) => {
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2);
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const prefix = `INV${year}${month}`;
    
    // Get the last invoice number for this month/year
    const [lastInvoices] = await connection.query(
        'SELECT invoice_number FROM invoices WHERE invoice_number LIKE ? ORDER BY invoice_number DESC LIMIT 1',
        [`${prefix}%`]
    );
    
    let newSerial = 1;
    if (lastInvoices.length > 0 && lastInvoices[0].invoice_number) {
        const lastSerial = parseInt(lastInvoices[0].invoice_number.slice(-4));
        newSerial = lastSerial + 1;
    }
    
    return `${prefix}${newSerial.toString().padStart(4, '0')}`;
};

// 1. POST /api/invoices/generate-monthly
// Generates monthly invoices for all eligible children
router.post('/generate-monthly', async (req, res) => {
    const { centerId } = req.user;
    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();
        
        // Get current date for invoice generation
        const now = new Date();
        const issueDate = now.toISOString().slice(0, 10);
        const dueDate = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000)).toISOString().slice(0, 10); // 30 days from now
        
        // Find all eligible children with their fee structures
        const [eligibleChildren] = await connection.query(`
            SELECT 
                c.id as child_id,
                c.first_name,
                c.last_name,
                c.student_id,
                cl.name as classroom_name,
                cl.id as classroom_id,
                fs.id as fee_structure_id,
                fs.monthly_fee,
                fs.program_name,
                p.first_name as parent_first_name,
                p.last_name as parent_last_name,
                p.phone_number,
                p.email
            FROM children c
            JOIN classrooms cl ON c.classroom_id = cl.id
            JOIN fee_structures fs ON cl.id = fs.classroom_id
            JOIN parent_child_links pcl ON c.id = pcl.child_id
            JOIN parents p ON pcl.parent_id = p.id
            WHERE c.center_id = ? 
            AND c.enrollment_date <= CURDATE()
            AND pcl.relation_to_child = 'Father'  -- Primary parent for billing
            AND fs.billing_frequency = 'Monthly'
            AND fs.is_active = 1
        `, [centerId]);
        
        if (eligibleChildren.length === 0) {
            await connection.rollback();
            return res.status(200).json({ 
                message: 'No eligible children found for monthly billing.',
                count: 0 
            });
        }
        
        let generatedCount = 0;
        
        // Generate invoice for each eligible child
        for (const child of eligibleChildren) {
            // Check if invoice already exists for this child for current month
            const [existingInvoice] = await connection.query(`
                SELECT id FROM invoices 
                WHERE child_id = ? 
                AND YEAR(issue_date) = YEAR(CURDATE()) 
                AND MONTH(issue_date) = MONTH(CURDATE())
            `, [child.child_id]);
            
            if (existingInvoice.length > 0) {
                continue; // Skip if invoice already exists for this month
            }
            
            // Generate unique invoice number
            const invoiceNumber = await generateInvoiceNumber(connection, centerId);
            const invoiceId = uuidv4();
            
            // Create invoice record
            await connection.query(`
                INSERT INTO invoices (
                    id, invoice_number, child_id, parent_name, parent_phone, 
                    parent_email, issue_date, due_date, total_amount, 
                    status, center_id, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending', ?, NOW())
            `, [
                invoiceId,
                invoiceNumber,
                child.child_id,
                `${child.parent_first_name} ${child.parent_last_name}`.trim(),
                child.phone_number,
                child.email,
                issueDate,
                dueDate,
                child.monthly_fee,
                centerId
            ]);
            
            // Create invoice line item
            const lineItemId = uuidv4();
            await connection.query(`
                INSERT INTO invoice_line_items (
                    id, invoice_id, description, quantity, unit_price, 
                    total_price, fee_structure_id
                ) VALUES (?, ?, ?, 1, ?, ?, ?)
            `, [
                lineItemId,
                invoiceId,
                `Monthly Fee - ${child.program_name} (${child.classroom_name})`,
                child.monthly_fee,
                child.monthly_fee,
                child.fee_structure_id
            ]);
            
            generatedCount++;
        }
        
        await connection.commit();
        
        res.status(201).json({
            message: `${generatedCount} monthly invoices have been generated successfully!`,
            count: generatedCount
        });
        
    } catch (error) {
        await connection.rollback();
        console.error('Error generating monthly invoices:', error);
        res.status(500).json({ message: 'Server error during invoice generation.' });
    } finally {
        connection.release();
    }
});

// 2. GET /api/invoices
// Fetches all invoices with filtering and pagination

// Get all invoices
router.get('/', protect, async (req, res) => {
    const { centerId } = req.user;
    const { status, child_name, page = 1, limit = 50 } = req.query;
    
    try {
        let whereConditions = ['i.center_id = ?'];
        let queryParams = [centerId];
        
        // Add filters
        if (status) {
            whereConditions.push('i.status = ?');
            queryParams.push(status);
        }
        
        if (child_name) {
            whereConditions.push('(c.first_name LIKE ? OR c.last_name LIKE ?)');
            queryParams.push(`%${child_name}%`, `%${child_name}%`);
        }
        
        const whereClause = whereConditions.join(' AND ');
        
        // Calculate offset for pagination
        const offset = (parseInt(page) - 1) * parseInt(limit);
        
        // Get invoices with child information
        const [invoices] = await pool.query(`
            SELECT 
                i.id,
                i.invoice_number,
                i.parent_name,
                i.parent_phone,
                i.parent_email,
                i.issue_date,
                i.due_date,
                i.total_amount,
                i.status,
                i.created_at,
                c.first_name as child_first_name,
                c.last_name as child_last_name,
                c.student_id,
                cl.name as classroom_name
            FROM invoices i
            JOIN children c ON i.child_id = c.id
            JOIN classrooms cl ON c.classroom_id = cl.id
            WHERE ${whereClause}
            ORDER BY i.created_at DESC
            LIMIT ? OFFSET ?
        `, [...queryParams, parseInt(limit), offset]);
        
        // Get total count for pagination
        const [countResult] = await pool.query(`
            SELECT COUNT(*) as total
            FROM invoices i
            JOIN children c ON i.child_id = c.id
            WHERE ${whereClause}
        `, queryParams);
        
        const total = countResult[0].total;
        const totalPages = Math.ceil(total / parseInt(limit));
        
        res.status(200).json({
            invoices,
            pagination: {
                current_page: parseInt(page),
                total_pages: totalPages,
                total_items: total,
                items_per_page: parseInt(limit)
            }
        });
        
    } catch (error) {
        console.error('Error fetching invoices:', error);
        res.status(500).json({ message: 'Server error while fetching invoices.' });
    }
});

// 3. GET /api/invoices/generate-pdf/:id
// Generates and downloads PDF for a specific invoice
router.get('/generate-pdf/:id', async (req, res) => {
    const { id } = req.params;
    const { centerId } = req.user;
    
    try {
        // Fetch invoice details with all related information
        const [invoiceData] = await pool.query(`
            SELECT 
                i.*,
                c.first_name as child_first_name,
                c.last_name as child_last_name,
                c.student_id,
                cl.name as classroom_name
            FROM invoices i
            JOIN children c ON i.child_id = c.id
            JOIN classrooms cl ON c.classroom_id = cl.id
            WHERE i.id = ? AND i.center_id = ?
        `, [id, centerId]);
        
        if (invoiceData.length === 0) {
            return res.status(404).json({ message: 'Invoice not found.' });
        }
        
        const invoice = invoiceData[0];
        
        // Fetch invoice line items
        const [lineItems] = await pool.query(`
            SELECT * FROM invoice_line_items WHERE invoice_id = ?
        `, [id]);
        
        // Create PDF
        const doc = new PDFDocument({ margin: 50 });
        
        // Set response headers for PDF download
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="Invoice_${invoice.invoice_number}.pdf"`);
        
        // Pipe PDF to response
        doc.pipe(res);
        
        // Add company logo (if exists)
        const logoPath = path.join(process.cwd(), 'assets', 'neldrac_logo.jpeg');
        if (fs.existsSync(logoPath)) {
            doc.image(logoPath, 50, 50, { width: 100 });
        }
        
        // Company header
        doc.fontSize(20).text('NELDRAC KIDS DAYCARE', 200, 60);
        doc.fontSize(12).text('Address: Your Company Address', 200, 85);
        doc.text('Phone: Your Phone Number', 200, 100);
        doc.text('Email: your-email@company.com', 200, 115);
        
        // Invoice title
        doc.fontSize(24).text('INVOICE', 50, 160);
        
        // Invoice details
        doc.fontSize(12);
        doc.text(`Invoice Number: ${invoice.invoice_number}`, 50, 200);
        doc.text(`Issue Date: ${new Date(invoice.issue_date).toLocaleDateString()}`, 50, 220);
        doc.text(`Due Date: ${new Date(invoice.due_date).toLocaleDateString()}`, 50, 240);
        
        // Bill to section
        doc.text('Bill To:', 350, 200);
        doc.text(`${invoice.parent_name}`, 350, 220);
        doc.text(`Phone: ${invoice.parent_phone}`, 350, 240);
        if (invoice.parent_email) {
            doc.text(`Email: ${invoice.parent_email}`, 350, 260);
        }
        
        // Student details
        doc.text('Student Details:', 50, 300);
        doc.text(`Name: ${invoice.child_first_name} ${invoice.child_last_name}`, 50, 320);
        doc.text(`Student ID: ${invoice.student_id}`, 50, 340);
        doc.text(`Classroom: ${invoice.classroom_name}`, 50, 360);
        
        // Line items table
        let yPosition = 420;
        
        // Table headers
        doc.text('Description', 50, yPosition);
        doc.text('Quantity', 300, yPosition);
        doc.text('Unit Price', 380, yPosition);
        doc.text('Total', 480, yPosition);
        
        // Draw line under headers
        doc.moveTo(50, yPosition + 20).lineTo(550, yPosition + 20).stroke();
        
        yPosition += 40;
        
        // Add line items
        lineItems.forEach(item => {
            doc.text(item.description, 50, yPosition);
            doc.text(item.quantity.toString(), 300, yPosition);
            doc.text(`₹${parseFloat(item.unit_price).toFixed(2)}`, 380, yPosition);
            doc.text(`₹${parseFloat(item.total_price).toFixed(2)}`, 480, yPosition);
            yPosition += 25;
        });
        
        // Draw line above total
        doc.moveTo(300, yPosition + 10).lineTo(550, yPosition + 10).stroke();
        
        // Total section
        yPosition += 30;
        doc.fontSize(14).text(`Total Amount: ₹${parseFloat(invoice.total_amount).toFixed(2)}`, 380, yPosition);
        
        // Amount in words
        yPosition += 30;
        const amountInWords = numberToWords.toWords(Math.floor(invoice.total_amount));
        doc.fontSize(12).text(`Amount in Words: ${amountInWords.charAt(0).toUpperCase() + amountInWords.slice(1)} Rupees Only`, 50, yPosition);
        
        // Payment terms
        yPosition += 50;
        doc.text('Payment Terms:', 50, yPosition);
        doc.fontSize(10).text('Please make payment within 30 days of invoice date.', 50, yPosition + 20);
        doc.text('Thank you for your business!', 50, yPosition + 40);
        
        // Status watermark
        if (invoice.status !== 'Paid') {
            doc.fontSize(48)
               .fillColor('red', 0.3)
               .text(invoice.status.toUpperCase(), 150, 400, { rotate: 45 });
        }
        
        // Finalize PDF
        doc.end();
        
    } catch (error) {
        console.error('Error generating PDF:', error);
        res.status(500).json({ message: 'Server error during PDF generation.' });
    }
});

// Additional utility endpoint to update invoice status
router.patch('/:id/status', async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const { centerId } = req.user;
    
    const allowedStatuses = ['Pending', 'Paid', 'Overdue', 'Cancelled'];
    if (!allowedStatuses.includes(status)) {
        return res.status(400).json({ message: 'Invalid status value.' });
    }
    
    try {
        const [result] = await pool.query(
            'UPDATE invoices SET status = ?, updated_at = NOW() WHERE id = ? AND center_id = ?',
            [status, id, centerId]
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Invoice not found.' });
        }
        
        res.status(200).json({ message: 'Invoice status updated successfully.' });
        
    } catch (error) {
        console.error('Error updating invoice status:', error);
        res.status(500).json({ message: 'Server error while updating invoice status.' });
    }
});

export default router;