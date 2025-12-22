import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import pool from './db.js';
import { protect } from './authMiddleware.js';
import { requireRole } from './middleware/security.js';

const router = express.Router();

// Apply protection to all routes
router.use(protect);

// --- Emergency Procedures ---

// Get all procedures (All authenticated staff)
router.get('/procedures', async (req, res) => {
    try {
        const centerId = req.user.center_id || req.query.centerId;
        const [procedures] = await pool.query(
            `SELECT * FROM emergency_procedures WHERE center_id = ? ORDER BY created_at DESC`,
            [centerId]
        );
        res.json(procedures);
    } catch (error) {
        console.error('Error fetching procedures:', error);
        res.status(500).json({ message: 'Error fetching procedures' });
    }
});

// Create procedure (Director, Admin, Academic Coordinator)
router.post('/procedures', requireRole(['center_director', 'admin', 'owner', 'super_admin']), async (req, res) => {
    try {
        const { title, description, steps, category } = req.body;
        const id = uuidv4();
        const centerId = req.user.center_id;

        await pool.query(
            `INSERT INTO emergency_procedures (id, center_id, title, description, steps, category, created_by)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [id, centerId, title, description, JSON.stringify(steps), category, req.user.id]
        );

        res.status(201).json({ message: 'Procedure created', id });
    } catch (error) {
        console.error('Error creating procedure:', error);
        res.status(500).json({ message: 'Error creating procedure' });
    }
});

// Update procedure
router.put('/procedures/:id', requireRole(['center_director', 'admin', 'owner', 'super_admin']), async (req, res) => {
    try {
        const { title, description, steps, category } = req.body;
        const { id } = req.params;

        await pool.query(
            `UPDATE emergency_procedures 
             SET title = ?, description = ?, steps = ?, category = ?, updated_at = CURRENT_TIMESTAMP
             WHERE id = ?`,
            [title, description, JSON.stringify(steps), category, id]
        );

        res.json({ message: 'Procedure updated' });
    } catch (error) {
        console.error('Error updating procedure:', error);
        res.status(500).json({ message: 'Error updating procedure' });
    }
});

// Delete procedure
router.delete('/procedures/:id', requireRole(['center_director', 'admin', 'owner', 'super_admin']), async (req, res) => {
    try {
        await pool.query('DELETE FROM emergency_procedures WHERE id = ?', [req.params.id]);
        res.json({ message: 'Procedure deleted' });
    } catch (error) {
        console.error('Error deleting procedure:', error);
        res.status(500).json({ message: 'Error deleting procedure' });
    }
});

// --- Emergency Drills ---

// Get drill logs
router.get('/drills', async (req, res) => {
    try {
        const centerId = req.user.center_id || req.query.centerId;
        const [logs] = await pool.query(
            `SELECT dl.*, u.full_name as conducted_by_name 
             FROM emergency_drill_logs dl
             LEFT JOIN users u ON dl.conducted_by = u.id
             WHERE dl.center_id = ? 
             ORDER BY dl.drill_date DESC`,
            [centerId]
        );
        res.json(logs);
    } catch (error) {
        console.error('Error fetching drill logs:', error);
        res.status(500).json({ message: 'Error fetching drill logs' });
    }
});

// Log a drill
router.post('/drills', requireRole(['center_director', 'admin', 'owner', 'super_admin']), async (req, res) => {
    try {
        const { drill_type, drill_date, duration_minutes, participants_count, notes, success_rating } = req.body;
        const id = uuidv4();
        const centerId = req.user.center_id;

        await pool.query(
            `INSERT INTO emergency_drill_logs (id, center_id, drill_type, drill_date, duration_minutes, participants_count, notes, success_rating, conducted_by)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [id, centerId, drill_type, drill_date, duration_minutes, participants_count, notes, success_rating, req.user.id]
        );

        res.status(201).json({ message: 'Drill logged successfully', id });
    } catch (error) {
        console.error('Error logging drill:', error);
        res.status(500).json({ message: 'Error logging drill' });
    }
});

export default router;
