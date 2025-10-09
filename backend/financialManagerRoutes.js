import express from 'express';
import { protect, financialManagerOrAbove } from './authMiddleware.js';
import pool from './db.js';
import { ensureTableExists, tableExists, safeDbOperation } from './utils/dbTableValidator.js';

const router = express.Router();

// Apply authentication to all routes
router.use(protect);

// Dashboard overview data
router.get('/dashboard', financialManagerOrAbove, async (req, res) => {
    try {
        // Ensure critical tables exist (attempt creation if missing)
        await ensureTableExists('centers');
        await ensureTableExists('budget_approval_limits');
        await ensureTableExists('budget_approvals');
        await ensureTableExists('financial_oversight');
        await ensureTableExists('budget_categories');

        // Get overview statistics
        const [overviewStats] = await pool.query(`
            SELECT
                COUNT(DISTINCT c.id) as centersManaged,
                SUM(CASE WHEN ba.status = 'pending' AND ba.fm_review_required = TRUE THEN 1 ELSE 0 END) as pendingApprovals,
                COUNT(CASE WHEN fo.status = 'open' THEN 1 END) as oversightItems,
                SUM(COALESCE(bal.approval_limit, 0)) as totalBudget
            FROM centers c
            LEFT JOIN budget_approvals ba ON ba.center_id COLLATE utf8mb4_0900_ai_ci = c.id
            LEFT JOIN financial_oversight fo ON fo.center_id COLLATE utf8mb4_0900_ai_ci = c.id
            LEFT JOIN budget_approval_limits bal ON bal.center_id COLLATE utf8mb4_0900_ai_ci = c.id AND bal.is_active = TRUE
        `);

        // Get budget limits
        const budgetLimits = await safeDbOperation(async () => {
            const [rows] = await pool.query(`
                SELECT
                    bal.*,
                    c.name as center_name
                FROM budget_approval_limits bal
                JOIN centers c ON c.id = bal.center_id COLLATE utf8mb4_unicode_ci
                WHERE bal.is_active = TRUE
                ORDER BY c.name, bal.role
            `);
            return rows;
        }, 'budget_approval_limits');

        // Get pending approvals that need FM review
        const pendingApprovals = await safeDbOperation(async () => {
            const [rows] = await pool.query(`
                SELECT
                    ba.*,
                    u.full_name as requester_name,
                    c.name as center_name
                FROM budget_approvals ba
                JOIN users u ON u.id = ba.requested_by COLLATE utf8mb4_unicode_ci
                JOIN centers c ON c.id = ba.center_id COLLATE utf8mb4_unicode_ci
                WHERE ba.fm_review_required = TRUE
                AND ba.status = 'pending'
                ORDER BY ba.created_at DESC
                LIMIT 10
            `);
            return rows;
        }, 'budget_approvals');

        // Get oversight items
        const oversightItems = await safeDbOperation(async () => {
            const [rows] = await pool.query(`
                SELECT
                    fo.*,
                    c.name as center_name
                FROM financial_oversight fo
                JOIN centers c ON c.id = fo.center_id COLLATE utf8mb4_unicode_ci
                WHERE fo.status IN ('open', 'reviewing')
                ORDER BY fo.created_at DESC
                LIMIT 10
            `);
            return rows;
        }, 'financial_oversight');

        // Get all centers for dropdowns
        const centers = await safeDbOperation(async () => {
            const [rows] = await pool.query(`
                SELECT id, name
                FROM centers
                ORDER BY name
            `);
            return rows;
        }, 'centers');

        // Get analytics data
        const approvalActivity = await safeDbOperation(async () => {
            const [rows] = await pool.query(`
                SELECT
                    DATE_FORMAT(ba.created_at, '%Y-%m') as month,
                    COUNT(*) as approvals
                FROM budget_approvals ba
                WHERE ba.created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
                GROUP BY DATE_FORMAT(ba.created_at, '%Y-%m')
                ORDER BY month
            `);
            return rows;
        }, 'budget_approvals');

        const budgetDistribution = await safeDbOperation(async () => {
            const [rows] = await pool.query(`
                SELECT
                    bc.name,
                    COUNT(ba.id) as value
                FROM budget_categories bc
                LEFT JOIN budget_approvals ba ON ba.category = bc.name
                WHERE bc.is_active = TRUE
                GROUP BY bc.name
                HAVING value > 0
                ORDER BY value DESC
            `);
            return rows;
        }, 'budget_categories');

        res.json({
            overview: overviewStats[0] || {},
            budgetLimits: budgetLimits || [],
            pendingApprovals: pendingApprovals || [],
            oversightItems: oversightItems || [],
            centers: centers || [],
            analytics: {
                approvalActivity: approvalActivity || [],
                budgetDistribution: budgetDistribution || []
            }
        });

    } catch (error) {
        console.error('Error fetching financial manager dashboard:', error);
        res.status(500).json({ message: 'Failed to load dashboard data' });
    }
});

// Get budget limits
router.get('/budget-limits', financialManagerOrAbove, async (req, res) => {
    try {
        const [limits] = await pool.query(`
            SELECT
                bal.*,
                c.name as center_name
            FROM budget_approval_limits bal
            JOIN centers c ON c.id = bal.center_id COLLATE utf8mb4_unicode_ci
            ORDER BY c.name, bal.role, bal.fiscal_year DESC
        `);

        res.json(limits);
    } catch (error) {
        console.error('Error fetching budget limits:', error);
        res.status(500).json({ message: 'Failed to fetch budget limits' });
    }
});

// Create budget limit
router.post('/budget-limits', financialManagerOrAbove, async (req, res) => {
    try {
        const {
            center_id,
            role,
            user_id = null,
            approval_limit,
            category_limits = null,
            fiscal_year = new Date().getFullYear(),
            effective_date = new Date(),
            expiry_date = null,
            notes = null
        } = req.body;

        const [result] = await pool.query(`
            INSERT INTO budget_approval_limits (
                id, center_id, role, user_id, approval_limit, category_limits,
                fiscal_year, effective_date, expiry_date, created_by, notes
            ) VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            center_id, role, user_id, approval_limit,
            category_limits ? JSON.stringify(category_limits) : null,
            fiscal_year, effective_date, expiry_date, req.user.id, notes
        ]);

        res.json({
            message: 'Budget limit created successfully',
            id: result.insertId
        });

    } catch (error) {
        console.error('Error creating budget limit:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            res.status(400).json({ message: 'Budget limit already exists for this role/center/year combination' });
        } else {
            res.status(500).json({ message: 'Failed to create budget limit' });
        }
    }
});

// Update budget limit
router.put('/budget-limits/:id', financialManagerOrAbove, async (req, res) => {
    try {
        const { id } = req.params;
        const {
            approval_limit,
            category_limits,
            effective_date,
            expiry_date,
            notes,
            is_active = true
        } = req.body;

        await pool.query(`
            UPDATE budget_approval_limits
            SET approval_limit = ?,
                category_limits = ?,
                effective_date = ?,
                expiry_date = ?,
                notes = ?,
                is_active = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `, [
            approval_limit,
            category_limits ? JSON.stringify(category_limits) : null,
            effective_date,
            expiry_date,
            notes,
            is_active,
            id
        ]);

        res.json({ message: 'Budget limit updated successfully' });

    } catch (error) {
        console.error('Error updating budget limit:', error);
        res.status(500).json({ message: 'Failed to update budget limit' });
    }
});

// Process approval (approve/reject)
router.put('/approvals/:id', financialManagerOrAbove, async (req, res) => {
    try {
        const { id } = req.params;
        const { action, notes = '' } = req.body;

        if (!['approve', 'reject'].includes(action)) {
            return res.status(400).json({ message: 'Invalid action' });
        }

        // Update the budget approval
        await pool.query(`
            UPDATE budget_approvals
            SET fm_reviewed_by = ?,
                fm_review_date = CURRENT_TIMESTAMP,
                fm_review_notes = ?,
                status = ?
            WHERE id = ?
        `, [req.user.id, notes, action === 'approve' ? 'approved' : 'rejected', id]);

        // Update any related oversight items
        await pool.query(`
            UPDATE financial_oversight
            SET status = 'resolved',
                handled_by = ?,
                handled_at = CURRENT_TIMESTAMP,
                action_taken = ?
            WHERE related_request_id = ?
        `, [req.user.id, `FM ${action}ed with notes: ${notes}`, id]);

        res.json({ message: `Approval ${action}ed successfully` });

    } catch (error) {
        console.error('Error processing approval:', error);
        res.status(500).json({ message: 'Failed to process approval' });
    }
});

// Get financial oversight items
router.get('/oversight', financialManagerOrAbove, async (req, res) => {
    try {
        const [items] = await pool.query(`
            SELECT
                fo.*,
                c.name as center_name,
                u.fullName as related_user_name
            FROM financial_oversight fo
            JOIN centers c ON c.id = fo.center_id
            LEFT JOIN users u ON u.id = fo.related_user_id
            ORDER BY fo.created_at DESC
        `);

        res.json(items);
    } catch (error) {
        console.error('Error fetching oversight items:', error);
        res.status(500).json({ message: 'Failed to fetch oversight items' });
    }
});

// Handle oversight item
router.put('/oversight/:id', financialManagerOrAbove, async (req, res) => {
    try {
        const { id } = req.params;
        const { status, action_taken } = req.body;

        await pool.query(`
            UPDATE financial_oversight
            SET status = ?,
                action_taken = ?,
                handled_by = ?,
                handled_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `, [status, action_taken, req.user.id, id]);

        res.json({ message: 'Oversight item updated successfully' });

    } catch (error) {
        console.error('Error updating oversight item:', error);
        res.status(500).json({ message: 'Failed to update oversight item' });
    }
});

// Get budget categories
router.get('/budget-categories', financialManagerOrAbove, async (req, res) => {
    try {
        const [categories] = await pool.query(`
            SELECT * FROM budget_categories
            WHERE is_active = TRUE
            ORDER BY display_order, name
        `);

        res.json(categories);
    } catch (error) {
        console.error('Error fetching budget categories:', error);
        res.status(500).json({ message: 'Failed to fetch budget categories' });
    }
});

// Create/update budget category
router.post('/budget-categories', financialManagerOrAbove, async (req, res) => {
    try {
        const {
            name,
            description,
            default_limit = 0,
            requires_justification = false,
            requires_fm_approval = false
        } = req.body;

        const [result] = await pool.query(`
            INSERT INTO budget_categories (
                id, name, description, default_limit,
                requires_justification, requires_fm_approval
            ) VALUES (UUID(), ?, ?, ?, ?, ?)
        `, [name, description, default_limit, requires_justification, requires_fm_approval]);

        res.json({
            message: 'Budget category created successfully',
            id: result.insertId
        });

    } catch (error) {
        console.error('Error creating budget category:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            res.status(400).json({ message: 'Budget category with this name already exists' });
        } else {
            res.status(500).json({ message: 'Failed to create budget category' });
        }
    }
});

export default router;