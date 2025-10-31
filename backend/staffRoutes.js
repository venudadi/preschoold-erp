import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { protect } from './authMiddleware.js';
import pool from './db.js';

const router = express.Router();

// Get all staff members for a center
router.get('/center/:centerId', protect, async (req, res) => {
    try {
        const [staff] = await pool.query(
            `SELECT sp.*, u.email, u.full_name
             FROM staff_profiles sp
             JOIN users u ON sp.user_id = u.id
             WHERE sp.center_id = ?`,
            [req.params.centerId]
        );
        res.json(staff);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get staff member details
router.get('/:staffId', protect, async (req, res) => {
    try {
        const [staff] = await pool.query(
            `SELECT sp.*, u.email, u.full_name
             FROM staff_profiles sp
             JOIN users u ON sp.user_id = u.id
             WHERE sp.id = ?`,
            [req.params.staffId]
        );

        if (staff.length === 0) {
            return res.status(404).json({ message: 'Staff member not found' });
        }

        res.json(staff[0]);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Create new staff member
router.post('/', protect, async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        
        const {
            email, password, first_name, last_name, role,
            center_id, employee_id, date_of_birth, joining_date,
            designation, department, education_qualification,
            experience_years, specialization, contact_number,
            emergency_contact, address, contract_type
        } = req.body;

        // Create user account
        const userId = uuidv4();
        await connection.query(
            `INSERT INTO users (id, email, password, full_name, role, center_id)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [userId, email, password, `${first_name} ${last_name}`, role, center_id]
        );

        // Create staff profile
        const staffId = uuidv4();
        await connection.query(
            `INSERT INTO staff_profiles 
             (id, user_id, center_id, employee_id, date_of_birth, joining_date,
              designation, department, education_qualification, experience_years,
              specialization, contact_number, emergency_contact, address, contract_type)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [staffId, userId, center_id, employee_id, date_of_birth, joining_date,
             designation, department, education_qualification, experience_years,
             specialization, contact_number, emergency_contact, address, contract_type]
        );

        await connection.commit();
        res.status(201).json({ message: 'Staff member created successfully', staffId });
    } catch (error) {
        await connection.rollback();
        res.status(500).json({ message: error.message });
    } finally {
        connection.release();
    }
});

// Update staff member
router.put('/:staffId', protect, async (req, res) => {
    try {
        const {
            designation, department, education_qualification,
            experience_years, specialization, contact_number,
            emergency_contact, address, contract_type, active_status
        } = req.body;

        await pool.query(
            `UPDATE staff_profiles 
             SET designation = ?,
                 department = ?,
                 education_qualification = ?,
                 experience_years = ?,
                 specialization = ?,
                 contact_number = ?,
                 emergency_contact = ?,
                 address = ?,
                 contract_type = ?,
                 active_status = ?
             WHERE id = ?`,
            [designation, department, education_qualification,
             experience_years, specialization, contact_number,
             emergency_contact, address, contract_type, active_status,
             req.params.staffId]
        );

        res.json({ message: 'Staff member updated successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get staff schedule
router.get('/:staffId/schedule', protect, async (req, res) => {
    try {
        const [schedule] = await pool.query(
            'SELECT * FROM staff_schedules WHERE staff_id = ?',
            [req.params.staffId]
        );
        res.json(schedule);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Update staff schedule
router.put('/:staffId/schedule', protect, async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        
        // Delete existing schedule
        await connection.query(
            'DELETE FROM staff_schedules WHERE staff_id = ?',
            [req.params.staffId]
        );

        // Insert new schedule
        const { schedules } = req.body;
        for (const schedule of schedules) {
            await connection.query(
                `INSERT INTO staff_schedules 
                 (id, staff_id, center_id, day_of_week, start_time, 
                  end_time, break_start, break_end, is_default)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [uuidv4(), req.params.staffId, schedule.center_id,
                 schedule.day_of_week, schedule.start_time, schedule.end_time,
                 schedule.break_start, schedule.break_end, schedule.is_default]
            );
        }

        await connection.commit();
        res.json({ message: 'Schedule updated successfully' });
    } catch (error) {
        await connection.rollback();
        res.status(500).json({ message: error.message });
    } finally {
        connection.release();
    }
});

// Get staff attendance
router.get('/:staffId/attendance', protect, async (req, res) => {
    try {
        const { start_date, end_date } = req.query;
        
        const [attendance] = await pool.query(
            `SELECT * FROM staff_attendance 
             WHERE staff_id = ? 
             AND date BETWEEN ? AND ?`,
            [req.params.staffId, start_date, end_date]
        );
        
        res.json(attendance);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Mark staff attendance
router.post('/:staffId/attendance', protect, async (req, res) => {
    try {
        const { date, status, check_in, check_out, remarks, center_id } = req.body;
        
        await pool.query(
            `INSERT INTO staff_attendance 
             (id, staff_id, center_id, date, status, check_in, check_out, remarks)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE
             status = VALUES(status),
             check_in = VALUES(check_in),
             check_out = VALUES(check_out),
             remarks = VALUES(remarks)`,
            [uuidv4(), req.params.staffId, center_id, date, status, 
             check_in, check_out, remarks]
        );
        
        res.json({ message: 'Attendance marked successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Apply for leave
router.post('/:staffId/leave', protect, async (req, res) => {
    try {
        const {
            leave_type, start_date, end_date, reason, center_id
        } = req.body;
        
        const leaveId = uuidv4();
        await pool.query(
            `INSERT INTO staff_leaves 
             (id, staff_id, center_id, leave_type, start_date, end_date, reason)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [leaveId, req.params.staffId, center_id, leave_type, 
             start_date, end_date, reason]
        );
        
        res.status(201).json({ message: 'Leave application submitted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get leave applications
router.get('/:staffId/leave', protect, async (req, res) => {
    try {
        const [leaves] = await pool.query(
            `SELECT * FROM staff_leaves 
             WHERE staff_id = ?
             ORDER BY created_at DESC`,
            [req.params.staffId]
        );
        
        res.json(leaves);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Approve/Reject leave
router.put('/:staffId/leave/:leaveId', protect, async (req, res) => {
    try {
        const { status } = req.body;
        
        await pool.query(
            `UPDATE staff_leaves 
             SET status = ?,
                 approved_by = ?,
                 approval_date = CURRENT_TIMESTAMP
             WHERE id = ? AND staff_id = ?`,
            [status, req.user.id, req.params.leaveId, req.params.staffId]
        );
        
        res.json({ message: 'Leave application updated successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Add staff document
router.post('/:staffId/documents', protect, async (req, res) => {
    try {
        const {
            document_type, document_number, file_path, expiry_date, center_id
        } = req.body;
        
        await pool.query(
            `INSERT INTO staff_documents 
             (id, staff_id, center_id, document_type, document_number, 
              file_path, expiry_date)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [uuidv4(), req.params.staffId, center_id, document_type,
             document_number, file_path, expiry_date]
        );
        
        res.status(201).json({ message: 'Document added successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get staff documents
router.get('/:staffId/documents', protect, async (req, res) => {
    try {
        const [documents] = await pool.query(
            'SELECT * FROM staff_documents WHERE staff_id = ?',
            [req.params.staffId]
        );
        
        res.json(documents);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Add performance review
router.post('/:staffId/reviews', protect, async (req, res) => {
    try {
        const {
            review_period_start, review_period_end, performance_metrics,
            overall_rating, comments, center_id
        } = req.body;
        
        await pool.query(
            `INSERT INTO staff_performance_reviews 
             (id, staff_id, center_id, review_period_start, review_period_end,
              reviewer_id, performance_metrics, overall_rating, comments)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [uuidv4(), req.params.staffId, center_id, review_period_start,
             review_period_end, req.user.id, JSON.stringify(performance_metrics),
             overall_rating, comments]
        );
        
        res.status(201).json({ message: 'Performance review added successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get performance reviews
router.get('/:staffId/reviews', protect, async (req, res) => {
    try {
        const [reviews] = await pool.query(
            `SELECT r.*, u.full_name
             FROM staff_performance_reviews r
             JOIN users u ON r.reviewer_id = u.id
             WHERE r.staff_id = ?
             ORDER BY r.review_period_end DESC`,
            [req.params.staffId]
        );

        res.json(reviews);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;