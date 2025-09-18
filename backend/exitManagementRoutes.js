import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import pool from './db.js';
import { protect } from './authMiddleware.js';

const router = express.Router();

// Middleware to check admin access
const checkAdminAccess = (req, res, next) => {
    const role = req.user.role;
    if (role === 'super_admin' || role === 'admin' || role === 'owner') {
        return next();
    }
    return res.status(403).json({ message: 'Forbidden: Access restricted to administrators.' });
};

// Apply protection and admin access check to all routes
router.use(protect);
router.use(checkAdminAccess);

// Mark a student as left
router.post('/student/:studentId/mark-left', async (req, res) => {
    try {
        const { studentId } = req.params;
        const { exitReason, exitDate, exitNotes } = req.body;

        if (!exitReason || !exitDate) {
            return res.status(400).json({ message: 'Exit reason and date are required.' });
        }

        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            // Update student status
            await connection.query(
                `UPDATE students 
                SET status = 'left',
                    exit_date = ?,
                    exit_reason = ?,
                    exit_notes = ?
                WHERE id = ?`,
                [exitDate, exitReason, exitNotes, studentId]
            );

            // Create exit record
            const exitRecordId = uuidv4();
            await connection.query(
                `INSERT INTO exit_records (
                    id, person_id, person_type, exit_date, 
                    exit_reason, exit_notes, center_id, recorded_by
                ) VALUES (?, ?, 'student', ?, ?, ?, ?, ?)`,
                [exitRecordId, studentId, exitDate, exitReason, exitNotes, req.user.centerId, req.user.id]
            );

            await connection.commit();
            res.json({ message: 'Student marked as left successfully' });
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Error marking student as left:', error);
        res.status(500).json({ message: 'Server error while processing request.' });
    }
});

// Mark a staff member as left
router.post('/staff/:staffId/mark-left', async (req, res) => {
    try {
        const { staffId } = req.params;
        const { exitReason, exitDate, exitNotes } = req.body;

        if (!exitReason || !exitDate) {
            return res.status(400).json({ message: 'Exit reason and date are required.' });
        }

        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            // Update staff status
            await connection.query(
                `UPDATE users 
                SET status = 'left',
                    exit_date = ?,
                    exit_reason = ?,
                    exit_notes = ?
                WHERE id = ?`,
                [exitDate, exitReason, exitNotes, staffId]
            );

            // Create exit record
            const exitRecordId = uuidv4();
            await connection.query(
                `INSERT INTO exit_records (
                    id, person_id, person_type, exit_date, 
                    exit_reason, exit_notes, center_id, recorded_by
                ) VALUES (?, ?, 'staff', ?, ?, ?, ?, ?)`,
                [exitRecordId, staffId, exitDate, exitReason, exitNotes, req.user.centerId, req.user.id]
            );

            await connection.commit();
            res.json({ message: 'Staff member marked as left successfully' });
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Error marking staff as left:', error);
        res.status(500).json({ message: 'Server error while processing request.' });
    }
});

// Get all exit records for a center
router.get('/exits', async (req, res) => {
    try {
        const { type, startDate, endDate } = req.query;
        let query = `
            SELECT 
                er.*,
                CASE 
                    WHEN er.person_type = 'student' THEN s.full_name
                    ELSE u.full_name
                END as person_name,
                ru.full_name as recorded_by_name,
                c.name as center_name
            FROM exit_records er
            LEFT JOIN students s ON er.person_id = s.id AND er.person_type = 'student'
            LEFT JOIN users u ON er.person_id = u.id AND er.person_type = 'staff'
            LEFT JOIN users ru ON er.recorded_by = ru.id
            LEFT JOIN centers c ON er.center_id = c.id
            WHERE 1=1
        `;

        const params = [];

        if (req.user.role !== 'super_admin') {
            query += ' AND er.center_id = ?';
            params.push(req.user.centerId);
        }

        if (type) {
            query += ' AND er.person_type = ?';
            params.push(type);
        }

        if (startDate) {
            query += ' AND er.exit_date >= ?';
            params.push(startDate);
        }

        if (endDate) {
            query += ' AND er.exit_date <= ?';
            params.push(endDate);
        }

        query += ' ORDER BY er.exit_date DESC';

        const [records] = await pool.query(query, params);
        res.json(records);
    } catch (error) {
        console.error('Error fetching exit records:', error);
        res.status(500).json({ message: 'Server error while fetching exit records.' });
    }
});

export default router;