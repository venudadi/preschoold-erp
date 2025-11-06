import express from 'express';
import pool from './db.js';
import { protect } from './authMiddleware.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Middleware to check if user is super_admin or financial_manager
const checkVendorManagementAccess = (req, res, next) => {
    if (req.user.role !== 'super_admin' && req.user.role !== 'financial_manager') {
        return res.status(403).json({
            message: 'Forbidden: Only Super Admin and Financial Manager can manage main vendors.'
        });
    }
    next();
};

// --- CREATE MAIN VENDOR ---
router.post('/', protect, checkVendorManagementAccess, async (req, res) => {
    const { vendorName, gstNumber, billingAddress, contactPerson, contactEmail, contactPhone } = req.body;

    if (!vendorName) {
        return res.status(400).json({ message: 'Vendor name is required.' });
    }

    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        // Check if vendor name already exists
        const [existing] = await connection.query(
            'SELECT id FROM main_vendors WHERE vendor_name = ?',
            [vendorName]
        );

        if (existing.length > 0) {
            await connection.rollback();
            return res.status(400).json({ message: 'A vendor with this name already exists.' });
        }

        const vendorId = uuidv4();
        const insertSql = `
            INSERT INTO main_vendors (
                id, vendor_name, gst_number, billing_address,
                contact_person, contact_email, contact_phone
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `;

        await connection.query(insertSql, [
            vendorId,
            vendorName,
            gstNumber || null,
            billingAddress || null,
            contactPerson || null,
            contactEmail || null,
            contactPhone || null
        ]);

        await connection.commit();
        res.status(201).json({
            message: 'Main vendor created successfully!',
            vendorId
        });

    } catch (error) {
        await connection.rollback();
        console.error('Error creating main vendor:', error);
        res.status(500).json({ message: 'Server error creating main vendor.' });
    } finally {
        connection.release();
    }
});

// --- GET ALL MAIN VENDORS ---
router.get('/', protect, async (req, res) => {
    const { includeInactive } = req.query;

    try {
        let query = `
            SELECT
                mv.id,
                mv.vendor_name,
                mv.gst_number,
                mv.billing_address,
                mv.contact_person,
                mv.contact_email,
                mv.contact_phone,
                mv.is_active,
                mv.created_at,
                mv.updated_at,
                COUNT(DISTINCT c.id) as company_count,
                COUNT(DISTINCT ch.id) as children_count
            FROM main_vendors mv
            LEFT JOIN companies c ON c.main_vendor_id = mv.id
            LEFT JOIN children ch ON ch.company_id = c.id AND ch.has_tie_up = TRUE
        `;

        if (includeInactive !== 'true') {
            query += ' WHERE mv.is_active = TRUE';
        }

        query += ' GROUP BY mv.id ORDER BY mv.vendor_name ASC';

        const [vendors] = await pool.query(query);
        res.status(200).json({ vendors });

    } catch (error) {
        console.error('Error fetching main vendors:', error);
        res.status(500).json({ message: 'Server error fetching main vendors.' });
    }
});

// --- GET SINGLE MAIN VENDOR ---
router.get('/:id', protect, async (req, res) => {
    const { id } = req.params;

    try {
        const query = `
            SELECT
                mv.*,
                COUNT(DISTINCT c.id) as company_count,
                COUNT(DISTINCT ch.id) as children_count
            FROM main_vendors mv
            LEFT JOIN companies c ON c.main_vendor_id = mv.id
            LEFT JOIN children ch ON ch.company_id = c.id AND ch.has_tie_up = TRUE
            WHERE mv.id = ?
            GROUP BY mv.id
        `;

        const [vendors] = await pool.query(query, [id]);

        if (vendors.length === 0) {
            return res.status(404).json({ message: 'Main vendor not found.' });
        }

        // Get associated companies
        const [companies] = await pool.query(
            `SELECT
                id, company_name, parent_contribution_percent,
                company_contribution_percent, gst_number
             FROM companies
             WHERE main_vendor_id = ? AND is_active = TRUE`,
            [id]
        );

        res.status(200).json({
            vendor: vendors[0],
            companies
        });

    } catch (error) {
        console.error('Error fetching main vendor:', error);
        res.status(500).json({ message: 'Server error fetching main vendor.' });
    }
});

// --- UPDATE MAIN VENDOR ---
router.put('/:id', protect, checkVendorManagementAccess, async (req, res) => {
    const { id } = req.params;
    const { vendorName, gstNumber, billingAddress, contactPerson, contactEmail, contactPhone } = req.body;

    if (!vendorName) {
        return res.status(400).json({ message: 'Vendor name is required.' });
    }

    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        // Check if vendor exists
        const [existing] = await connection.query('SELECT id FROM main_vendors WHERE id = ?', [id]);
        if (existing.length === 0) {
            await connection.rollback();
            return res.status(404).json({ message: 'Main vendor not found.' });
        }

        // Check if new name conflicts with another vendor
        const [nameConflict] = await connection.query(
            'SELECT id FROM main_vendors WHERE vendor_name = ? AND id != ?',
            [vendorName, id]
        );

        if (nameConflict.length > 0) {
            await connection.rollback();
            return res.status(400).json({ message: 'Another vendor with this name already exists.' });
        }

        const updateSql = `
            UPDATE main_vendors SET
                vendor_name = ?,
                gst_number = ?,
                billing_address = ?,
                contact_person = ?,
                contact_email = ?,
                contact_phone = ?,
                updated_at = NOW()
            WHERE id = ?
        `;

        await connection.query(updateSql, [
            vendorName,
            gstNumber || null,
            billingAddress || null,
            contactPerson || null,
            contactEmail || null,
            contactPhone || null,
            id
        ]);

        await connection.commit();
        res.status(200).json({ message: 'Main vendor updated successfully!' });

    } catch (error) {
        await connection.rollback();
        console.error('Error updating main vendor:', error);
        res.status(500).json({ message: 'Server error updating main vendor.' });
    } finally {
        connection.release();
    }
});

// --- SOFT DELETE MAIN VENDOR ---
router.delete('/:id', protect, checkVendorManagementAccess, async (req, res) => {
    const { id } = req.params;

    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        // Check if vendor has active companies
        const [companies] = await connection.query(
            'SELECT COUNT(*) as count FROM companies WHERE main_vendor_id = ? AND is_active = TRUE',
            [id]
        );

        if (companies[0].count > 0) {
            await connection.rollback();
            return res.status(400).json({
                message: 'Cannot delete vendor with active companies. Please deactivate companies first.'
            });
        }

        await connection.query(
            'UPDATE main_vendors SET is_active = FALSE, updated_at = NOW() WHERE id = ?',
            [id]
        );

        await connection.commit();
        res.status(200).json({ message: 'Main vendor deactivated successfully!' });

    } catch (error) {
        await connection.rollback();
        console.error('Error deleting main vendor:', error);
        res.status(500).json({ message: 'Server error deleting main vendor.' });
    } finally {
        connection.release();
    }
});

// --- GET REVENUE REPORT BY VENDOR ---
router.get('/:id/revenue-report', protect, checkVendorManagementAccess, async (req, res) => {
    const { id } = req.params;
    const { startDate, endDate } = req.query;

    try {
        // Get vendor info
        const [vendors] = await pool.query('SELECT vendor_name FROM main_vendors WHERE id = ?', [id]);
        if (vendors.length === 0) {
            return res.status(404).json({ message: 'Main vendor not found.' });
        }

        // Calculate revenue from company invoices
        let invoiceQuery = `
            SELECT
                COUNT(DISTINCT i.id) as invoice_count,
                SUM(i.total_amount) as total_revenue,
                SUM(i.amount_paid) as total_paid,
                SUM(i.balance) as total_outstanding
            FROM invoices i
            WHERE i.main_vendor_id = ?
        `;

        const params = [id];

        if (startDate && endDate) {
            invoiceQuery += ' AND i.created_at BETWEEN ? AND ?';
            params.push(startDate, endDate);
        }

        const [revenue] = await pool.query(invoiceQuery, params);

        // Get company-wise breakdown
        const companyQuery = `
            SELECT
                c.company_name,
                COUNT(DISTINCT ch.id) as enrolled_children,
                c.company_contribution_percent
            FROM companies c
            LEFT JOIN children ch ON ch.company_id = c.id AND ch.has_tie_up = TRUE
            WHERE c.main_vendor_id = ?
            GROUP BY c.id
        `;

        const [companyBreakdown] = await pool.query(companyQuery, [id]);

        res.status(200).json({
            vendorName: vendors[0].vendor_name,
            revenue: revenue[0],
            companyBreakdown
        });

    } catch (error) {
        console.error('Error generating revenue report:', error);
        res.status(500).json({ message: 'Server error generating revenue report.' });
    }
});

export default router;
