import express from 'express';
import pool from './db.js';
import { protect as authenticateToken } from './authMiddleware.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Get all students
router.get('/', authenticateToken, async (req, res) => {
    try {
        const { center_id } = req.query;
        
        let query = `
            SELECT 
                s.*,
                c.name as center_name,
                cl.name as classroom_name,
                TIMESTAMPDIFF(MINUTE, s.program_start_time, s.program_end_time) / 60.0 as service_hours
            FROM students s
            LEFT JOIN centers c ON s.center_id = c.id
            LEFT JOIN classrooms cl ON s.classroom_id = cl.id
            WHERE 1=1
        `;
        
        const params = [];

        if (center_id) {
            query += ` AND s.center_id = ?`;
            params.push(center_id);
        }

        // For non-super admins, only show students from their centers
        if (!req.user.is_super_admin) {
            query += ` AND s.center_id IN (
                SELECT center_id FROM user_centers WHERE user_id = ?
            )`;
            params.push(req.user.id);
        }

        query += ` ORDER BY s.created_at DESC`;

        const [students] = await pool.query(query, params);
        res.json(students);
    } catch (error) {
        console.error('Error fetching students:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get student details
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const [student] = await pool.query(
            `SELECT 
                s.*,
                c.name as center_name,
                cl.name as classroom_name,
                TIMESTAMPDIFF(MINUTE, s.program_start_time, s.program_end_time) / 60.0 as service_hours
            FROM students s
            LEFT JOIN centers c ON s.center_id = c.id
            LEFT JOIN classrooms cl ON s.classroom_id = cl.id
            WHERE s.id = ?`,
            [req.params.id]
        );

        if (!student.length) {
            return res.status(404).json({ error: 'Student not found' });
        }

        res.json(student[0]);
    } catch (error) {
        console.error('Error fetching student:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update student program timing
router.patch('/:id/timing', authenticateToken, async (req, res) => {
    const { program_start_time, program_end_time } = req.body;
    const { id } = req.params;

    if (!program_start_time || !program_end_time) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        await pool.query(
            `UPDATE students 
            SET program_start_time = ?, 
                program_end_time = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?`,
            [program_start_time, program_end_time, id]
        );

        // Fetch updated student details
        const [student] = await pool.query(
            `SELECT 
                *,
                TIMESTAMPDIFF(MINUTE, program_start_time, program_end_time) / 60.0 as service_hours
            FROM students 
            WHERE id = ?`,
            [id]
        );

        res.json({
            message: 'Program timing updated successfully',
            student: student[0]
        });
    } catch (error) {
        console.error('Error updating program timing:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Create new student
router.post('/', authenticateToken, async (req, res) => {
    const {
        name,
        center_id,
        classroom_id,
        date_of_birth,
        gender,
        address,
        program_start_time,
        program_end_time
    } = req.body;

    if (!name || !center_id || !classroom_id) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        const studentId = uuidv4();
        await pool.query(
            `INSERT INTO students (
                id, name, center_id, classroom_id, date_of_birth,
                gender, address, program_start_time, program_end_time
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                studentId, name, center_id, classroom_id,
                date_of_birth || null, gender || null,
                address || null, program_start_time || null,
                program_end_time || null
            ]
        );

        res.status(201).json({
            id: studentId,
            message: 'Student created successfully'
        });
    } catch (error) {
        console.error('Error creating student:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update student
router.put('/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const {
        name,
        center_id,
        classroom_id,
        date_of_birth,
        gender,
        address,
        program_start_time,
        program_end_time
    } = req.body;

    if (!name || !center_id || !classroom_id) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        await pool.query(
            `UPDATE students SET
                name = ?,
                center_id = ?,
                classroom_id = ?,
                date_of_birth = ?,
                gender = ?,
                address = ?,
                program_start_time = ?,
                program_end_time = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?`,
            [
                name, center_id, classroom_id,
                date_of_birth || null, gender || null,
                address || null, program_start_time || null,
                program_end_time || null, id
            ]
        );

        res.json({ message: 'Student updated successfully' });
    } catch (error) {
        console.error('Error updating student:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;