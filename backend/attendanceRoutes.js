import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { protect } from './authMiddleware.js';
import pool from './db.js';

const router = express.Router();

// Get attendance settings for a center
router.get('/settings/:centerId', protect, async (req, res) => {
    try {
        const [settings] = await pool.query(
            'SELECT * FROM attendance_settings WHERE center_id = ?',
            [req.params.centerId]
        );
        res.json(settings[0] || {});
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Update attendance settings
router.put('/settings/:centerId', protect, async (req, res) => {
    try {
        const { late_threshold, half_day_threshold, notify_parents_on_absent, 
                notify_parents_on_late, auto_mark_absent_time } = req.body;
        
        await pool.query(
            `UPDATE attendance_settings 
             SET late_threshold = ?, 
                 half_day_threshold = ?,
                 notify_parents_on_absent = ?,
                 notify_parents_on_late = ?,
                 auto_mark_absent_time = ?
             WHERE center_id = ?`,
            [late_threshold, half_day_threshold, notify_parents_on_absent, 
             notify_parents_on_late, auto_mark_absent_time, req.params.centerId]
        );
        
        res.json({ message: 'Settings updated successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Mark attendance for a child
router.post('/mark', protect, async (req, res) => {
    try {
        const { child_id, center_id, classroom_id, status, reason } = req.body;
        const id = uuidv4();
        const date = new Date().toISOString().split('T')[0];

        await pool.query(
            `INSERT INTO attendance_records 
             (id, child_id, center_id, classroom_id, date, status, reason, marked_by)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE 
             status = VALUES(status),
             reason = VALUES(reason),
             marked_by = VALUES(marked_by),
             updated_at = CURRENT_TIMESTAMP`,
            [id, child_id, center_id, classroom_id, date, status, reason, req.user.id]
        );

        // If child is marked absent and notifications are enabled, notify parents
        if (status === 'absent') {
            const [settings] = await pool.query(
                'SELECT notify_parents_on_absent FROM attendance_settings WHERE center_id = ?',
                [center_id]
            );

            if (settings[0]?.notify_parents_on_absent) {
                const notificationId = uuidv4();
                const [result] = await pool.query(
                    'SELECT parent_id FROM children WHERE id = ?',
                    [child_id]
                );

                if (result[0]?.parent_id) {
                    await pool.query(
                        `INSERT INTO attendance_notifications 
                         (id, attendance_id, parent_id, type)
                         VALUES (?, ?, ?, ?)`,
                        [notificationId, id, result[0].parent_id, 'absent']
                    );
                }
            }
        }

        res.json({ message: 'Attendance marked successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get attendance for a classroom on a specific date
router.get('/classroom/:classroomId', protect, async (req, res) => {
    try {
        const date = req.query.date || new Date().toISOString().split('T')[0];
        
        const [records] = await pool.query(
            `SELECT ar.*, c.first_name, c.last_name 
             FROM attendance_records ar
             JOIN children c ON ar.child_id = c.id
             WHERE ar.classroom_id = ? AND ar.date = ?`,
            [req.params.classroomId, date]
        );
        
        res.json(records);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get attendance summary for a child
router.get('/summary/child/:childId', protect, async (req, res) => {
    try {
        const { month, year } = req.query;
        
        const [summary] = await pool.query(
            `SELECT * FROM attendance_summaries 
             WHERE child_id = ? AND month = ? AND year = ?`,
            [req.params.childId, month, year]
        );
        
        res.json(summary[0] || {});
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get attendance summary for a classroom
router.get('/summary/classroom/:classroomId', protect, async (req, res) => {
    try {
        const { month, year } = req.query;
        
        const [summary] = await pool.query(
            `SELECT 
                c.first_name,
                c.last_name,
                ats.* 
             FROM attendance_summaries ats
             JOIN children c ON ats.child_id = c.id
             WHERE ats.classroom_id = ? 
             AND ats.month = ? 
             AND ats.year = ?`,
            [req.params.classroomId, month, year]
        );
        
        res.json(summary);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Calculate monthly attendance summary (can be triggered manually or by cron job)
router.post('/calculate-summary', protect, async (req, res) => {
    try {
        const { month, year, classroom_id } = req.body;
        
        // Get all children in the classroom
        const [children] = await pool.query(
            'SELECT id, center_id FROM children WHERE classroom_id = ?',
            [classroom_id]
        );

        for (const child of children) {
            // Calculate attendance statistics
            const [stats] = await pool.query(
                `SELECT 
                    COUNT(*) as total_days,
                    SUM(status = 'present') as present_days,
                    SUM(status = 'absent') as absent_days,
                    SUM(status = 'late') as late_days,
                    SUM(status = 'excused') as excused_days
                 FROM attendance_records
                 WHERE child_id = ?
                 AND MONTH(date) = ?
                 AND YEAR(date) = ?`,
                [child.id, month, year]
            );

            // Update or insert summary
            const summaryId = uuidv4();
            await pool.query(
                `INSERT INTO attendance_summaries 
                 (id, child_id, classroom_id, center_id, month, year,
                  total_days, present_days, absent_days, late_days, excused_days,
                  last_calculated)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
                 ON DUPLICATE KEY UPDATE
                 total_days = VALUES(total_days),
                 present_days = VALUES(present_days),
                 absent_days = VALUES(absent_days),
                 late_days = VALUES(late_days),
                 excused_days = VALUES(excused_days),
                 last_calculated = CURRENT_TIMESTAMP`,
                [summaryId, child.id, classroom_id, child.center_id, month, year,
                 stats[0].total_days, stats[0].present_days, stats[0].absent_days,
                 stats[0].late_days, stats[0].excused_days]
            );
        }

        res.json({ message: 'Attendance summary calculated successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;