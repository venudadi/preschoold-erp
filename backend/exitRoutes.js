import express from 'express';
import pool from './db.js';
import { protect as authenticateToken } from './authMiddleware.js';

const router = express.Router();

// Get exit records with optional filters
router.get('/', authenticateToken, async (req, res) => {
    try {
        const { type, startDate, endDate, centerId } = req.query;
        
        let query = `
            SELECT 
                er.id,
                er.person_id,
                er.person_type,
                er.exit_date,
                er.exit_reason,
                er.recorded_at,
                CASE 
                    WHEN er.person_type = 'student' THEN s.name 
                    WHEN er.person_type = 'staff' THEN st.full_name
                END as person_name,
                CASE
                    WHEN er.person_type = 'staff' THEN st.job_title
                    ELSE NULL
                END as job_title,
                c.name as center_name,
                u.name as recorded_by_name
            FROM exit_records er
            LEFT JOIN students s ON er.person_type = 'student' AND er.person_id = s.id
            LEFT JOIN staff st ON er.person_type = 'staff' AND er.person_id = st.id
            LEFT JOIN centers c ON er.center_id = c.id
            LEFT JOIN users u ON er.recorded_by = u.id
            WHERE 1=1
        `;

        const params = [];

        if (type) {
            if (type === 'teacher_staff') {
                query += ` AND er.person_type = 'staff' AND LOWER(st.job_title) LIKE '%teacher%'`;
            } else if (type === 'other_staff') {
                query += ` AND er.person_type = 'staff' AND LOWER(st.job_title) NOT LIKE '%teacher%'`;
            } else if (type === 'student') {
                query += ` AND er.person_type = 'student'`;
            }
        }

        if (startDate) {
            query += ` AND er.exit_date >= ?`;
            params.push(startDate);
        }

        if (endDate) {
            query += ` AND er.exit_date <= ?`;
            params.push(endDate);
        }

        if (centerId && !req.user.is_super_admin) {
            query += ` AND er.center_id = ?`;
            params.push(centerId);
        }

        // For non-super admins, only show records from their centers
        if (!req.user.is_super_admin) {
            query += ` AND er.center_id IN (
                SELECT center_id FROM user_centers WHERE user_id = ?
            )`;
            params.push(req.user.id);
        }

        query += ` ORDER BY er.exit_date DESC, er.recorded_at DESC`;

        const [records] = await pool.query(query, params);
        res.json(records);
    } catch (error) {
        console.error('Error fetching exit records:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Record an exit
router.post('/', authenticateToken, async (req, res) => {
    const { personId, personType, exitDate, exitReason, centerId } = req.body;

    // Validate required fields
    if (!personId || !personType || !exitDate || !exitReason || !centerId) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    // Verify person exists and belongs to center
    const tableName = personType === 'student' ? 'students' : 'staff';
    const [person] = await pool.query(
        `SELECT id FROM ${tableName} WHERE id = ? AND center_id = ?`, 
        [personId, centerId]
    );

    if (person.length === 0) {
        return res.status(404).json({ error: 'Person not found or not in specified center' });
    }

    // Check if user has permission for this center
    if (!req.user.is_super_admin) {
        const [userCenter] = await pool.query(
            'SELECT id FROM user_centers WHERE user_id = ? AND center_id = ?',
            [req.user.id, centerId]
        );

        if (userCenter.length === 0) {
            return res.status(403).json({ error: 'No permission for this center' });
        }
    }

    try {
        // Start transaction
        await pool.query('START TRANSACTION');

        // Record exit
        const [result] = await pool.query(
            `INSERT INTO exit_records 
                (person_id, person_type, exit_date, exit_reason, center_id, recorded_by) 
            VALUES (?, ?, ?, ?, ?, ?)`,
            [personId, personType, exitDate, exitReason, centerId, req.user.id]
        );

        // Update status in respective table
        await pool.query(
            `UPDATE ${tableName} SET status = 'left' WHERE id = ?`,
            [personId]
        );

        // Commit transaction
        await pool.query('COMMIT');

        res.json({
            id: result.insertId,
            message: 'Exit recorded successfully'
        });
    } catch (error) {
        // Rollback in case of error
        await pool.query('ROLLBACK');
        console.error('Error recording exit:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;