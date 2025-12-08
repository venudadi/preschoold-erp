import speakeasy from 'speakeasy';

// 2FA middleware for sensitive downloads
const require2FAForSensitiveDownload = async (req, res, next) => {
    const user = req.user;
    // Only enforce for parents and teachers
    if (user.role !== 'parent' && user.role !== 'teacher') {
        return next();
    }
    // Fetch 2FA settings from users table
    const [users] = await pool.query('SELECT two_fa_enabled, two_fa_secret FROM users WHERE id = ?', [user.id]);
    if (!users.length || !users[0].two_fa_enabled) {
        // 2FA not enabled, allow
        return next();
    }
    // 2FA enabled, require TOTP code in header
    const totp = req.headers['x-2fa-totp'];
    if (!totp) {
        return res.status(401).json({ message: '2FA code required for sensitive download', code: '2FA_REQUIRED' });
    }
    const verified = speakeasy.totp.verify({
        secret: users[0].two_fa_secret,
        encoding: 'base32',
        token: totp,
        window: 1
    });
    if (!verified) {
        return res.status(401).json({ message: 'Invalid 2FA code', code: '2FA_INVALID' });
    }
    next();
};
import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import pool from './db.js';
import { protect } from './authMiddleware.js';
import { rateLimiters, sanitizeInput } from './middleware/security.js';
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


// Apply protection, rate limiting, and access middleware to all routes
router.use(protect);
router.use(rateLimiters.api);
router.use(checkInvoiceAccess);
router.use(sanitizeInput);

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

// Helper function to calculate GST breakdown
const calculateGST = (baseAmount, gstRate = 18.00, isInterstate = false) => {
    const amount = parseFloat(baseAmount);
    const rate = parseFloat(gstRate);

    if (isInterstate) {
        // Interstate: IGST only
        const igstAmount = (amount * rate) / 100;
        return {
            cgstRate: 0,
            cgstAmount: 0,
            sgstRate: 0,
            sgstAmount: 0,
            igstRate: rate,
            igstAmount: parseFloat(igstAmount.toFixed(2)),
            totalTax: parseFloat(igstAmount.toFixed(2)),
            totalAmount: parseFloat((amount + igstAmount).toFixed(2))
        };
    } else {
        // Intrastate: CGST + SGST (split equally)
        const halfRate = rate / 2;
        const cgstAmount = (amount * halfRate) / 100;
        const sgstAmount = (amount * halfRate) / 100;
        const totalTax = cgstAmount + sgstAmount;
        return {
            cgstRate: halfRate,
            cgstAmount: parseFloat(cgstAmount.toFixed(2)),
            sgstRate: halfRate,
            sgstAmount: parseFloat(sgstAmount.toFixed(2)),
            igstRate: 0,
            igstAmount: 0,
            totalTax: parseFloat(totalTax.toFixed(2)),
            totalAmount: parseFloat((amount + totalTax).toFixed(2))
        };
    }
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
        
        // Find all eligible children with their fee structures and HSN codes
        const [eligibleChildren] = await connection.query(`
            SELECT
                c.id as child_id,
                c.first_name,
                c.last_name,
                c.student_id,
                cl.name as classroom_name,
                cl.id as classroom_id,
                cl.hsn_code,
                cl.service_type,
                fs.id as fee_structure_id,
                fs.monthly_fee,
                fs.program_name,
                par.first_name as parent_first_name,
                par.last_name as parent_last_name,
                par.phone_number,
                par.email
            FROM children c
            JOIN classrooms cl ON c.classroom_id = cl.id
            JOIN fee_structures fs ON cl.id = fs.classroom_id
            JOIN parents p ON c.id = p.child_id
            JOIN parents par ON p.user_id = par.id
            WHERE c.center_id = ?
            AND c.created_at <= CURDATE()
            AND p.relation_to_child = 'Father'  -- Primary parent for billing
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
            // Business logic: monthly_fee must be positive
            if (child.monthly_fee == null || isNaN(child.monthly_fee) || child.monthly_fee <= 0) {
                await connection.rollback();
                return res.status(400).json({ message: `Invalid monthly fee for child ${child.child_id}` });
            }
            // Check if invoice already exists for this child for current month
            const [existingInvoice] = await connection.query(`
                SELECT id FROM invoices
                WHERE child_id = ?
                AND YEAR(created_at) = YEAR(CURDATE())
                AND MONTH(created_at) = MONTH(CURDATE())
            `, [child.child_id]);
            
            if (existingInvoice.length > 0) {
                continue; // Skip if invoice already exists for this month
            }
            
            // Generate unique invoice number
            const invoiceNumber = await generateInvoiceNumber(connection, centerId);
            const invoiceId = uuidv4();

            // Get HSN code for the classroom (default to Pre-School if not set)
            const hsnCode = child.hsn_code || '999210';
            const serviceType = child.service_type || 'Pre-School';

            // Calculate GST breakdown (assuming intrastate for now)
            const baseAmount = parseFloat(child.monthly_fee);
            const gstBreakdown = calculateGST(baseAmount, 18.00, false);

            // Create invoice record with GST breakdown
            await connection.query(`
                INSERT INTO invoices (
                    id, invoice_number, child_id, total_amount,
                    hsn_code, subtotal_before_tax,
                    cgst_rate, cgst_amount, sgst_rate, sgst_amount,
                    igst_rate, igst_amount, is_interstate,
                    status, center_id, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending', ?, NOW())
            `, [
                invoiceId,
                invoiceNumber,
                child.child_id,
                gstBreakdown.totalAmount,
                hsnCode,
                baseAmount,
                gstBreakdown.cgstRate,
                gstBreakdown.cgstAmount,
                gstBreakdown.sgstRate,
                gstBreakdown.sgstAmount,
                gstBreakdown.igstRate,
                gstBreakdown.igstAmount,
                false,
                centerId
            ]);

            // Create invoice line item with GST details
            const lineItemId = uuidv4();
            await connection.query(`
                INSERT INTO invoice_line_items (
                    id, invoice_id, description, quantity, unit_price,
                    hsn_code, base_amount,
                    cgst_rate, cgst_amount, sgst_rate, sgst_amount,
                    igst_rate, igst_amount, total_price, fee_structure_id
                ) VALUES (?, ?, ?, 1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                lineItemId,
                invoiceId,
                `Monthly Fee - ${child.program_name} (${child.classroom_name})`,
                baseAmount,
                hsnCode,
                baseAmount,
                gstBreakdown.cgstRate,
                gstBreakdown.cgstAmount,
                gstBreakdown.sgstRate,
                gstBreakdown.sgstAmount,
                gstBreakdown.igstRate,
                gstBreakdown.igstAmount,
                gstBreakdown.totalAmount,
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
      if (error.code === 'PROTOCOL_CONNECTION_LOST' || error.code === 'ECONNREFUSED' || error.code === 'ER_CON_COUNT_ERROR') {
        return res.status(503).json({ message: 'Database connection error. Please try again later.' });
      }
      if (error.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ message: 'Duplicate entry. This record already exists.' });
      }
      if (error.code === 'ER_NO_REFERENCED_ROW_2' || error.code === 'ER_ROW_IS_REFERENCED_2') {
        return res.status(409).json({ message: 'Foreign key constraint error.' });
      }
      if (error.code === 'ER_LOCK_DEADLOCK') {
        return res.status(500).json({ message: 'Database deadlock. Please retry the operation.' });
      }
      if (error.fatal) {
        return res.status(500).json({ message: 'Fatal database error. Please contact support.' });
      }
      await connection.rollback();
      console.error('Error generating monthly invoices:', error);
      res.status(500).json({ message: 'Server error during invoice generation.' });
    } finally {
        connection.release();
    }
});

// POST /api/invoices/generate-company-invoices
// Generates invoices for tie-up companies with consolidation options
router.post('/generate-company-invoices', async (req, res) => {
    const { centerId } = req.user;
    const { month, year, consolidationType } = req.body;

    // Validate required fields
    if (!month || !year || !consolidationType) {
        return res.status(400).json({ message: 'Month, year, and consolidationType are required.' });
    }

    if (!['per_child', 'per_company', 'per_main_vendor'].includes(consolidationType)) {
        return res.status(400).json({ message: 'Invalid consolidationType. Must be: per_child, per_company, or per_main_vendor.' });
    }

    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        const now = new Date();
        const issueDate = now.toISOString().slice(0, 10);
        const dueDate = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000)).toISOString().slice(0, 10);

        // Fetch all tie-up children with their company and fee details
        const [tieUpChildren] = await connection.query(`
            SELECT
                c.id as child_id,
                c.first_name as child_first_name,
                c.last_name as child_last_name,
                c.student_id,
                c.company_id,
                c.locked_monthly_fee,
                c.payment_mode,
                comp.company_name,
                comp.main_vendor_id,
                mv.vendor_name as main_vendor_name,
                mv.gst_number as main_vendor_gst,
                mv.billing_address as main_vendor_address,
                afd.company_amount_before_gst,
                afd.company_gst_amount,
                afd.company_total_with_gst,
                afd.parent_contribution_percent,
                afd.company_contribution_percent
            FROM children c
            JOIN companies comp ON c.company_id = comp.id
            JOIN main_vendors mv ON comp.main_vendor_id = mv.id
            LEFT JOIN admission_fee_details afd ON c.id = afd.child_id
            WHERE c.center_id = ?
            AND c.has_tie_up = true
            AND c.is_active = true
            AND comp.is_active = true
            AND mv.is_active = true
        `, [centerId]);

        if (tieUpChildren.length === 0) {
            await connection.rollback();
            return res.status(200).json({
                message: 'No tie-up children found for invoice generation.',
                count: 0
            });
        }

        let generatedCount = 0;
        const invoiceIds = [];

        // Group children based on consolidation type
        let groups = [];

        if (consolidationType === 'per_child') {
            // Each child gets their own invoice
            groups = tieUpChildren.map(child => ({
                key: child.child_id,
                mainVendorId: child.main_vendor_id,
                mainVendorName: child.main_vendor_name,
                mainVendorGst: child.main_vendor_gst,
                mainVendorAddress: child.main_vendor_address,
                companyName: child.company_name,
                children: [child]
            }));
        } else if (consolidationType === 'per_company') {
            // Group by company
            const companyMap = new Map();
            tieUpChildren.forEach(child => {
                if (!companyMap.has(child.company_id)) {
                    companyMap.set(child.company_id, {
                        key: child.company_id,
                        mainVendorId: child.main_vendor_id,
                        mainVendorName: child.main_vendor_name,
                        mainVendorGst: child.main_vendor_gst,
                        mainVendorAddress: child.main_vendor_address,
                        companyName: child.company_name,
                        children: []
                    });
                }
                companyMap.get(child.company_id).children.push(child);
            });
            groups = Array.from(companyMap.values());
        } else if (consolidationType === 'per_main_vendor') {
            // Group by main vendor
            const vendorMap = new Map();
            tieUpChildren.forEach(child => {
                if (!vendorMap.has(child.main_vendor_id)) {
                    vendorMap.set(child.main_vendor_id, {
                        key: child.main_vendor_id,
                        mainVendorId: child.main_vendor_id,
                        mainVendorName: child.main_vendor_name,
                        mainVendorGst: child.main_vendor_gst,
                        mainVendorAddress: child.main_vendor_address,
                        companyName: 'Multiple Companies',
                        children: []
                    });
                }
                vendorMap.get(child.main_vendor_id).children.push(child);
            });
            groups = Array.from(vendorMap.values());
        }

        // Generate invoices for each group
        for (const group of groups) {
            // Check for existing invoice
            const checkQuery = consolidationType === 'per_child'
                ? `SELECT id FROM invoices WHERE child_id = ? AND invoice_type = 'Company'
                   AND YEAR(created_at) = ? AND MONTH(created_at) = ?`
                : consolidationType === 'per_company'
                ? `SELECT id FROM invoices WHERE company_id = ? AND invoice_type = 'Company'
                   AND YEAR(created_at) = ? AND MONTH(created_at) = ?`
                : `SELECT id FROM invoices WHERE main_vendor_id = ? AND invoice_type = 'Company'
                   AND YEAR(created_at) = ? AND MONTH(created_at) = ?`;

            const [existing] = await connection.query(checkQuery, [group.key, year, month]);

            if (existing.length > 0) {
                continue; // Skip if invoice already exists
            }

            // Calculate total amount for this group
            let totalAmount = 0;
            let lineItems = [];

            for (const child of group.children) {
                const companyAmount = child.company_total_with_gst || child.company_amount_before_gst || 0;
                totalAmount += parseFloat(companyAmount);

                lineItems.push({
                    childId: child.child_id,
                    studentId: child.student_id,
                    childName: `${child.child_first_name} ${child.child_last_name}`,
                    companyName: child.company_name,
                    description: `Monthly Fee - ${child.child_first_name} ${child.child_last_name} (${child.student_id})`,
                    baseAmount: parseFloat(child.company_amount_before_gst || 0),
                    gstAmount: parseFloat(child.company_gst_amount || 0),
                    totalAmount: parseFloat(companyAmount)
                });
            }

            // Generate invoice number
            const invoiceNumber = await generateInvoiceNumber(connection, centerId);
            const invoiceId = uuidv4();

            // Create invoice record
            await connection.query(`
                INSERT INTO invoices (
                    id, invoice_number, child_id, company_id, main_vendor_id,
                    total_amount, status, center_id, invoice_type, consolidation_type,
                    issue_date, due_date, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, 'Pending', ?, 'Company', ?, ?, ?, NOW())
            `, [
                invoiceId,
                invoiceNumber,
                consolidationType === 'per_child' ? group.children[0].child_id : null,
                consolidationType === 'per_company' ? group.key : null,
                group.mainVendorId,
                totalAmount,
                centerId,
                consolidationType,
                issueDate,
                dueDate
            ]);

            // Create line items
            for (const item of lineItems) {
                const lineItemId = uuidv4();
                await connection.query(`
                    INSERT INTO invoice_line_items (
                        id, invoice_id, description, quantity, unit_price, total_price
                    ) VALUES (?, ?, ?, 1, ?, ?)
                `, [
                    lineItemId,
                    invoiceId,
                    item.description,
                    item.totalAmount,
                    item.totalAmount
                ]);
            }

            invoiceIds.push(invoiceId);
            generatedCount++;
        }

        await connection.commit();

        res.status(201).json({
            message: `${generatedCount} company invoices generated successfully with ${consolidationType} consolidation.`,
            count: generatedCount,
            invoiceIds,
            consolidationType
        });

    } catch (error) {
        await connection.rollback();
        console.error('Error generating company invoices:', error);
        res.status(500).json({ message: 'Server error during company invoice generation.', error: error.message });
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
        
        // Get invoices with child and parent information
        const [invoices] = await pool.query(`
            SELECT
                i.id,
                i.invoice_number,
                CONCAT(par.first_name, ' ', par.last_name) as parent_name,
                par.phone_number as parent_phone,
                par.email as parent_email,
                i.created_at as issue_date,
                DATE_ADD(i.created_at, INTERVAL 30 DAY) as due_date,
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
            LEFT JOIN parents p ON c.id = p.child_id
            LEFT JOIN parents par ON p.user_id = par.id
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
router.get('/generate-pdf/:id', require2FAForSensitiveDownload, async (req, res) => {
    const { id } = req.params;
    const { centerId } = req.user;
    
    try {
        // Fetch invoice details with all related information including center GST details
        const [invoiceData] = await pool.query(`
            SELECT
                i.*,
                c.first_name as child_first_name,
                c.last_name as child_last_name,
                c.student_id,
                cl.name as classroom_name,
                cl.service_type,
                ctr.name as center_name,
                ctr.gstin as center_gstin,
                ctr.address as center_address,
                ctr.phone as center_phone,
                ctr.email as center_email,
                ctr.place_of_supply
            FROM invoices i
            JOIN children c ON i.child_id = c.id
            JOIN classrooms cl ON c.classroom_id = cl.id
            JOIN centers ctr ON i.center_id = ctr.id
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

        // Company header with GST details
        doc.fontSize(20).text(invoice.center_name || 'NELDRAC KIDS DAYCARE', 200, 50);
        doc.fontSize(10).text(invoice.center_address || 'Address: Your Company Address', 200, 75);
        doc.text(`Phone: ${invoice.center_phone || 'Your Phone Number'}`, 200, 90);
        doc.text(`Email: ${invoice.center_email || 'your-email@company.com'}`, 200, 105);
        if (invoice.center_gstin) {
            doc.fontSize(11).font('Helvetica-Bold').text(`GSTIN: ${invoice.center_gstin}`, 200, 120);
            doc.font('Helvetica');
        }

        // Draw line separator
        doc.moveTo(50, 145).lineTo(550, 145).stroke();

        // Invoice title and tax invoice label
        doc.fontSize(24).font('Helvetica-Bold').text('TAX INVOICE', 50, 160);
        doc.font('Helvetica');

        // Invoice details
        doc.fontSize(11);
        doc.text(`Invoice Number: ${invoice.invoice_number}`, 50, 200);
        doc.text(`Invoice Date: ${new Date(invoice.created_at || invoice.issue_date).toLocaleDateString('en-IN')}`, 50, 218);
        doc.text(`Due Date: ${new Date(invoice.due_date || new Date(Date.now() + 30*24*60*60*1000)).toLocaleDateString('en-IN')}`, 50, 236);
        if (invoice.place_of_supply) {
            doc.text(`Place of Supply: ${invoice.place_of_supply}`, 50, 254);
        }
        
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
        
        // Line items table with HSN code and GST breakdown
        let yPosition = 380;

        // Table headers
        doc.fontSize(10).font('Helvetica-Bold');
        doc.text('Description', 50, yPosition);
        doc.text('HSN', 250, yPosition);
        doc.text('Qty', 300, yPosition);
        doc.text('Rate', 340, yPosition);
        doc.text('Amount', 420, yPosition);
        doc.font('Helvetica');

        // Draw line under headers
        doc.moveTo(50, yPosition + 18).lineTo(550, yPosition + 18).stroke();

        yPosition += 30;

        // Add line items
        let subtotal = 0;
        lineItems.forEach(item => {
            const baseAmount = parseFloat(item.base_amount || item.unit_price || 0);
            subtotal += baseAmount;

            doc.fontSize(9);
            doc.text(item.description, 50, yPosition, { width: 190 });
            doc.text(item.hsn_code || invoice.hsn_code || '999210', 250, yPosition);
            doc.text(item.quantity.toString(), 300, yPosition);
            doc.text(`₹${baseAmount.toFixed(2)}`, 340, yPosition);
            doc.text(`₹${baseAmount.toFixed(2)}`, 420, yPosition, { align: 'right', width: 100 });
            yPosition += 25;
        });

        // Draw line before tax calculation
        doc.moveTo(50, yPosition + 5).lineTo(550, yPosition + 5).stroke();
        yPosition += 20;

        // Tax breakdown section
        doc.fontSize(10);

        // Subtotal
        doc.text('Subtotal (Before Tax):', 340, yPosition);
        doc.text(`₹${(invoice.subtotal_before_tax || subtotal).toFixed(2)}`, 420, yPosition, { align: 'right', width: 100 });
        yPosition += 20;

        // GST breakdown based on interstate flag
        if (invoice.is_interstate) {
            // IGST (Interstate)
            const igstRate = parseFloat(invoice.igst_rate || 0);
            const igstAmount = parseFloat(invoice.igst_amount || 0);
            doc.text(`IGST @ ${igstRate.toFixed(2)}%:`, 340, yPosition);
            doc.text(`₹${igstAmount.toFixed(2)}`, 420, yPosition, { align: 'right', width: 100 });
            yPosition += 20;
        } else {
            // CGST + SGST (Intrastate)
            const cgstRate = parseFloat(invoice.cgst_rate || 0);
            const cgstAmount = parseFloat(invoice.cgst_amount || 0);
            const sgstRate = parseFloat(invoice.sgst_rate || 0);
            const sgstAmount = parseFloat(invoice.sgst_amount || 0);

            doc.text(`CGST @ ${cgstRate.toFixed(2)}%:`, 340, yPosition);
            doc.text(`₹${cgstAmount.toFixed(2)}`, 420, yPosition, { align: 'right', width: 100 });
            yPosition += 20;

            doc.text(`SGST @ ${sgstRate.toFixed(2)}%:`, 340, yPosition);
            doc.text(`₹${sgstAmount.toFixed(2)}`, 420, yPosition, { align: 'right', width: 100 });
            yPosition += 20;
        }

        // Draw line above total
        doc.moveTo(300, yPosition + 5).lineTo(550, yPosition + 5).stroke();
        yPosition += 20;

        // Total section
        doc.fontSize(12).font('Helvetica-Bold');
        doc.text('Total Amount:', 340, yPosition);
        doc.text(`₹${parseFloat(invoice.total_amount).toFixed(2)}`, 420, yPosition, { align: 'right', width: 100 });
        doc.font('Helvetica');
        
        // Amount in words
        yPosition += 30;
        const amountInWords = numberToWords.toWords(Math.floor(invoice.total_amount));
        doc.fontSize(10).font('Helvetica-Bold').text('Amount in Words:', 50, yPosition);
        doc.font('Helvetica').text(`${amountInWords.charAt(0).toUpperCase() + amountInWords.slice(1)} Rupees Only`, 50, yPosition + 15);

        // GST Declaration
        yPosition += 45;
        doc.fontSize(9).font('Helvetica-Bold');
        doc.text('Declaration:', 50, yPosition);
        doc.font('Helvetica').fontSize(8);
        doc.text('This is a computer-generated invoice. GST is payable on reverse charge basis if applicable.', 50, yPosition + 15, { width: 500 });

        // Payment terms
        yPosition += 40;
        doc.fontSize(9).font('Helvetica-Bold').text('Payment Terms:', 50, yPosition);
        doc.font('Helvetica').fontSize(8);
        doc.text('Please make payment within 30 days of invoice date.', 50, yPosition + 15);
        doc.text('Thank you for your business!', 50, yPosition + 30);
        
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