import express from 'express';
import pool from './db.js';
import { protect } from './authMiddleware.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Middleware to check contribution configuration access
const checkContributionAccess = (req, res, next) => {
    if (req.user.role !== 'super_admin' && req.user.role !== 'financial_manager') {
        return res.status(403).json({
            message: 'Forbidden: Only Super Admin and Financial Manager can manage company contributions.'
        });
    }
    next();
};

// --- CREATE COMPANY ---
router.post('/', protect, checkContributionAccess, async (req, res) => {
    const {
        companyName,
        mainVendorId,
        parentContributionPercent,
        companyContributionPercent,
        contactPerson,
        email,
        phoneNumber,
        address,
        gstNumber
    } = req.body;

    if (!companyName) {
        return res.status(400).json({ message: 'Company name is required.' });
    }

    // Validate contribution percentages
    const parentPercent = parseFloat(parentContributionPercent) || 0;
    const companyPercent = parseFloat(companyContributionPercent) || 0;

    if (parentPercent + companyPercent !== 100) {
        return res.status(400).json({
            message: 'Parent and company contribution percentages must sum to 100.'
        });
    }

    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        // Check if company name already exists
        const [existing] = await connection.query(
            'SELECT id FROM companies WHERE company_name = ?',
            [companyName]
        );

        if (existing.length > 0) {
            await connection.rollback();
            return res.status(400).json({ message: 'A company with this name already exists.' });
        }

        const companyId = uuidv4();
        const insertSql = `
            INSERT INTO companies (
                id, company_name, main_vendor_id,
                parent_contribution_percent, company_contribution_percent,
                contact_person, email, phone_number, address, gst_number
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        await connection.query(insertSql, [
            companyId,
            companyName,
            mainVendorId || null,
            parentPercent,
            companyPercent,
            contactPerson || null,
            email || null,
            phoneNumber || null,
            address || null,
            gstNumber || null
        ]);

        await connection.commit();
        res.status(201).json({
            message: 'Company created successfully!',
            companyId
        });

    } catch (error) {
        await connection.rollback();
        console.error('Error creating company:', error);
        res.status(500).json({ message: 'Server error creating company.' });
    } finally {
        connection.release();
    }
});

// --- GET ALL COMPANIES ---
router.get('/', protect, async (req, res) => {
    const { includeInactive, mainVendorId } = req.query;

    try {
        let query = `
            SELECT
                c.id,
                c.company_name,
                c.main_vendor_id,
                mv.vendor_name as main_vendor_name,
                c.parent_contribution_percent,
                c.company_contribution_percent,
                c.contact_person,
                c.email,
                c.phone_number,
                c.address,
                c.gst_number,
                c.discount_percentage,
                c.is_active,
                c.created_at,
                c.updated_at,
                COUNT(DISTINCT ch.id) as enrolled_children_count
            FROM companies c
            LEFT JOIN main_vendors mv ON c.main_vendor_id = mv.id
            LEFT JOIN children ch ON ch.company_id = c.id AND ch.has_tie_up = TRUE
        `;

        const conditions = [];
        const params = [];

        if (includeInactive !== 'true') {
            conditions.push('c.is_active = TRUE');
        }

        if (mainVendorId) {
            conditions.push('c.main_vendor_id = ?');
            params.push(mainVendorId);
        }

        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }

        query += ' GROUP BY c.id ORDER BY c.company_name ASC';

        const [companies] = await pool.query(query, params);
        res.status(200).json({ companies });

    } catch (error) {
        console.error('Error fetching companies:', error);
        res.status(500).json({ message: 'Server error fetching companies.' });
    }
});

// --- GET SINGLE COMPANY ---
router.get('/:id', protect, async (req, res) => {
    const { id } = req.params;

    try {
        const query = `
            SELECT
                c.*,
                mv.vendor_name as main_vendor_name,
                mv.gst_number as main_vendor_gst,
                mv.billing_address as main_vendor_billing_address,
                COUNT(DISTINCT ch.id) as enrolled_children_count
            FROM companies c
            LEFT JOIN main_vendors mv ON c.main_vendor_id = mv.id
            LEFT JOIN children ch ON ch.company_id = c.id AND ch.has_tie_up = TRUE
            WHERE c.id = ?
            GROUP BY c.id
        `;

        const [companies] = await pool.query(query, [id]);

        if (companies.length === 0) {
            return res.status(404).json({ message: 'Company not found.' });
        }

        // Get enrolled children
        const [children] = await pool.query(
            `SELECT
                ch.id,
                CONCAT(ch.first_name, ' ', ch.last_name) as child_name,
                ch.student_id,
                ch.payment_mode,
                ch.billing_frequency,
                ch.locked_monthly_fee
             FROM children ch
             WHERE ch.company_id = ? AND ch.has_tie_up = TRUE`,
            [id]
        );

        res.status(200).json({
            company: companies[0],
            enrolledChildren: children
        });

    } catch (error) {
        console.error('Error fetching company:', error);
        res.status(500).json({ message: 'Server error fetching company.' });
    }
});

// --- UPDATE COMPANY ---
router.put('/:id', protect, checkContributionAccess, async (req, res) => {
    const { id } = req.params;
    const {
        companyName,
        mainVendorId,
        parentContributionPercent,
        companyContributionPercent,
        contactPerson,
        email,
        phoneNumber,
        address,
        gstNumber,
        discountPercentage
    } = req.body;

    if (!companyName) {
        return res.status(400).json({ message: 'Company name is required.' });
    }

    // Validate contribution percentages if provided
    if (parentContributionPercent !== undefined && companyContributionPercent !== undefined) {
        const parentPercent = parseFloat(parentContributionPercent);
        const companyPercent = parseFloat(companyContributionPercent);

        if (parentPercent + companyPercent !== 100) {
            return res.status(400).json({
                message: 'Parent and company contribution percentages must sum to 100.'
            });
        }
    }

    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        // Check if company exists
        const [existing] = await connection.query('SELECT id FROM companies WHERE id = ?', [id]);
        if (existing.length === 0) {
            await connection.rollback();
            return res.status(404).json({ message: 'Company not found.' });
        }

        // Check if new name conflicts with another company
        const [nameConflict] = await connection.query(
            'SELECT id FROM companies WHERE company_name = ? AND id != ?',
            [companyName, id]
        );

        if (nameConflict.length > 0) {
            await connection.rollback();
            return res.status(400).json({ message: 'Another company with this name already exists.' });
        }

        const updateSql = `
            UPDATE companies SET
                company_name = ?,
                main_vendor_id = ?,
                parent_contribution_percent = ?,
                company_contribution_percent = ?,
                contact_person = ?,
                email = ?,
                phone_number = ?,
                address = ?,
                gst_number = ?,
                discount_percentage = ?,
                updated_at = NOW()
            WHERE id = ?
        `;

        await connection.query(updateSql, [
            companyName,
            mainVendorId || null,
            parentContributionPercent !== undefined ? parentContributionPercent : 0,
            companyContributionPercent !== undefined ? companyContributionPercent : 0,
            contactPerson || null,
            email || null,
            phoneNumber || null,
            address || null,
            gstNumber || null,
            discountPercentage || 0,
            id
        ]);

        await connection.commit();
        res.status(200).json({ message: 'Company updated successfully!' });

    } catch (error) {
        await connection.rollback();
        console.error('Error updating company:', error);
        res.status(500).json({ message: 'Server error updating company.' });
    } finally {
        connection.release();
    }
});

// --- SOFT DELETE COMPANY ---
router.delete('/:id', protect, checkContributionAccess, async (req, res) => {
    const { id } = req.params;

    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        // Check if company has enrolled children
        const [children] = await connection.query(
            'SELECT COUNT(*) as count FROM children WHERE company_id = ? AND has_tie_up = TRUE AND status = "active"',
            [id]
        );

        if (children[0].count > 0) {
            await connection.rollback();
            return res.status(400).json({
                message: 'Cannot delete company with active enrolled children. Please transfer or mark children as inactive first.'
            });
        }

        await connection.query(
            'UPDATE companies SET is_active = FALSE, updated_at = NOW() WHERE id = ?',
            [id]
        );

        await connection.commit();
        res.status(200).json({ message: 'Company deactivated successfully!' });

    } catch (error) {
        await connection.rollback();
        console.error('Error deleting company:', error);
        res.status(500).json({ message: 'Server error deleting company.' });
    } finally {
        connection.release();
    }
});

// --- GET CONTRIBUTION CONFIGURATION ---
router.get('/:id/contribution-config', protect, async (req, res) => {
    const { id } = req.params;

    try {
        const query = `
            SELECT
                id,
                company_name,
                parent_contribution_percent,
                company_contribution_percent,
                main_vendor_id,
                mv.vendor_name as main_vendor_name
            FROM companies c
            LEFT JOIN main_vendors mv ON c.main_vendor_id = mv.id
            WHERE c.id = ?
        `;

        const [companies] = await pool.query(query, [id]);

        if (companies.length === 0) {
            return res.status(404).json({ message: 'Company not found.' });
        }

        res.status(200).json({ config: companies[0] });

    } catch (error) {
        console.error('Error fetching contribution config:', error);
        res.status(500).json({ message: 'Server error fetching contribution config.' });
    }
});

// --- CHECK COMPANY TIE-UP (For Enquiry Form) ---
router.get('/check-tieup/:companyName', protect, async (req, res) => {
    const { companyName } = req.params;

    try {
        const query = `
            SELECT
                c.id,
                c.company_name,
                c.parent_contribution_percent,
                c.company_contribution_percent,
                c.main_vendor_id,
                mv.vendor_name as main_vendor_name
            FROM companies c
            LEFT JOIN main_vendors mv ON c.main_vendor_id = mv.id
            WHERE LOWER(c.company_name) = LOWER(?) AND c.is_active = TRUE
        `;

        const [companies] = await pool.query(query, [companyName]);

        if (companies.length > 0) {
            res.status(200).json({
                hasTieUp: true,
                company: companies[0]
            });
        } else {
            res.status(200).json({ hasTieUp: false });
        }

    } catch (error) {
        console.error('Error checking tie-up:', error);
        res.status(500).json({ message: 'Server error checking tie-up.' });
    }
});

export default router;
