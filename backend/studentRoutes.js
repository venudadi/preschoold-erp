import express from 'express';
import pool from './db.js';
import { protect as authenticateToken } from './authMiddleware.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Get all students
router.get('/', authenticateToken, async (req, res) => {
    try {
        const { center_id, status } = req.query;

        let query = `
            SELECT
                s.*,
                c.name as center_name,
                cl.name as classroom_name,
                comp.company_name,
                pu.full_name as paused_by_name,
                TIMESTAMPDIFF(MINUTE, s.program_start_time, s.program_end_time) / 60.0 as service_hours
            FROM students s
            LEFT JOIN centers c ON s.center_id = c.id
            LEFT JOIN classrooms cl ON s.classroom_id = cl.id
            LEFT JOIN companies comp ON s.company_id = comp.id
            LEFT JOIN users pu ON s.paused_by = pu.id
            WHERE 1=1
        `;

        const params = [];

        if (center_id) {
            query += ` AND s.center_id = ?`;
            params.push(center_id);
        }

        if (status) {
            query += ` AND s.status = ?`;
            params.push(status);
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
                comp.company_name,
                TIMESTAMPDIFF(MINUTE, s.program_start_time, s.program_end_time) / 60.0 as service_hours
            FROM students s
            LEFT JOIN centers c ON s.center_id = c.id
            LEFT JOIN classrooms cl ON s.classroom_id = cl.id
            LEFT JOIN companies comp ON s.company_id = comp.id
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
        program_end_time,
        company_id,
        has_tie_up
    } = req.body;

    if (!name || !center_id || !classroom_id) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        const studentId = uuidv4();
        
        // Handle tie-up logic
        let finalCompanyId = company_id;
        let finalHasTieUp = has_tie_up;
        
        if (!has_tie_up || has_tie_up === false) {
            // Student doesn't have tie-up, set to N/A company
            finalHasTieUp = false;
            finalCompanyId = await getNACompanyId();
        } else {
            // Student has tie-up, validate company_id
            finalHasTieUp = true;
            if (!company_id) {
                return res.status(400).json({ error: 'Company ID is required when student has tie-up' });
            }
            
            // Verify company exists and is not N/A
            const [companyExists] = await pool.query(
                "SELECT id FROM companies WHERE id = ? AND company_name != 'N/A'", 
                [company_id]
            );
            if (companyExists.length === 0) {
                return res.status(400).json({ error: 'Invalid company ID' });
            }
        }
        
        await pool.query(
            `INSERT INTO students (
                id, name, center_id, classroom_id, date_of_birth,
                gender, address, program_start_time, program_end_time,
                company_id, has_tie_up
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                studentId, name, center_id, classroom_id,
                date_of_birth || null, gender || null,
                address || null, program_start_time || null,
                program_end_time || null, finalCompanyId,
                finalHasTieUp
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
        program_end_time,
        company_id,
        has_tie_up
    } = req.body;

    if (!name || !center_id || !classroom_id) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        // Handle tie-up logic
        let finalCompanyId = company_id;
        let finalHasTieUp = has_tie_up;
        
        if (!has_tie_up || has_tie_up === false) {
            // Student doesn't have tie-up, set to N/A company
            finalHasTieUp = false;
            finalCompanyId = await getNACompanyId();
        } else {
            // Student has tie-up, validate company_id
            finalHasTieUp = true;
            if (!company_id) {
                return res.status(400).json({ error: 'Company ID is required when student has tie-up' });
            }
            
            // Verify company exists and is not N/A
            const [companyExists] = await pool.query(
                "SELECT id FROM companies WHERE id = ? AND company_name != 'N/A'", 
                [company_id]
            );
            if (companyExists.length === 0) {
                return res.status(400).json({ error: 'Invalid company ID' });
            }
        }
        
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
                company_id = ?,
                has_tie_up = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?`,
            [
                name, center_id, classroom_id,
                date_of_birth || null, gender || null,
                address || null, program_start_time || null,
                program_end_time || null, finalCompanyId,
                finalHasTieUp, id
            ]
        );

        res.json({ message: 'Student updated successfully' });
    } catch (error) {
        console.error('Error updating student:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get all companies (for dropdown)
router.get('/companies', authenticateToken, async (req, res) => {
    try {
        const [companies] = await pool.query(
            `SELECT id, company_name FROM companies 
             WHERE is_active = true AND company_name != 'N/A'
             ORDER BY company_name`
        );
        res.json(companies);
    } catch (error) {
        console.error('Error fetching companies:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get paused students
router.get('/paused', authenticateToken, async (req, res) => {
    try {
        const { center_id } = req.query;

        let query = `
            SELECT
                s.*,
                c.name as center_name,
                cl.name as classroom_name,
                pu.full_name as paused_by_name
            FROM paused_students s
            LEFT JOIN centers c ON s.center_id = c.id
            LEFT JOIN classrooms cl ON s.classroom_id = cl.id
            LEFT JOIN users pu ON s.paused_by = pu.id
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

        query += ` ORDER BY s.pause_start_date DESC`;

        const [students] = await pool.query(query, params);
        res.json(students);
    } catch (error) {
        console.error('Error fetching paused students:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Pause a student
router.patch('/:id/pause', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { pause_start_date, pause_end_date, reason, notes } = req.body;

    // Check admin permissions
    if (!['admin', 'owner', 'super_admin'].includes(req.user.role)) {
        return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
    }

    if (!pause_start_date || !pause_end_date || !reason) {
        return res.status(400).json({ error: 'Missing required fields: pause_start_date, pause_end_date, reason' });
    }

    // Validate dates
    const startDate = new Date(pause_start_date);
    const endDate = new Date(pause_end_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (startDate >= endDate) {
        return res.status(400).json({ error: 'Pause end date must be after start date' });
    }

    if (startDate < today) {
        return res.status(400).json({ error: 'Pause start date cannot be in the past' });
    }

    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        // Check if student exists and is not already paused
        const [student] = await connection.query(
            'SELECT id, status, center_id, first_name, last_name FROM children WHERE id = ?',
            [id]
        );

        if (!student.length) {
            await connection.rollback();
            return res.status(404).json({ error: 'Student not found' });
        }

        if (student[0].status === 'paused') {
            await connection.rollback();
            return res.status(400).json({ error: 'Student is already paused' });
        }

        if (student[0].status === 'left') {
            await connection.rollback();
            return res.status(400).json({ error: 'Cannot pause a student who has left' });
        }

        // Check center access for non-super admins
        if (!req.user.is_super_admin) {
            const [userCenters] = await connection.query(
                'SELECT center_id FROM user_centers WHERE user_id = ? AND center_id = ?',
                [req.user.id, student[0].center_id]
            );

            if (!userCenters.length) {
                await connection.rollback();
                return res.status(403).json({ error: 'Access denied. Student not in your center.' });
            }
        }

        // Update student status to paused
        await connection.query(
            `UPDATE children
             SET status = 'paused',
                 pause_start_date = ?,
                 pause_end_date = ?,
                 pause_reason = ?,
                 pause_notes = ?,
                 paused_by = ?,
                 paused_at = NOW()
             WHERE id = ?`,
            [pause_start_date, pause_end_date, reason, notes, req.user.id, id]
        );

        // Create pause history record
        const historyId = uuidv4();
        await connection.query(
            `INSERT INTO student_pause_history
             (id, student_id, pause_start_date, pause_end_date, reason, notes,
              paused_by, center_id, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active')`,
            [historyId, id, pause_start_date, pause_end_date, reason, notes,
             req.user.id, student[0].center_id]
        );

        await connection.commit();

        res.json({
            message: 'Student paused successfully',
            student: {
                id: student[0].id,
                name: `${student[0].first_name} ${student[0].last_name || ''}`.trim(),
                status: 'paused',
                pause_start_date,
                pause_end_date,
                reason,
                notes
            }
        });

    } catch (error) {
        await connection.rollback();
        console.error('Error pausing student:', error);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        connection.release();
    }
});

// Resume a student
router.patch('/:id/resume', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { notes } = req.body;

    // Check admin permissions
    if (!['admin', 'owner', 'super_admin'].includes(req.user.role)) {
        return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
    }

    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        // Check if student exists and is paused
        const [student] = await connection.query(
            'SELECT id, status, center_id, first_name, last_name FROM children WHERE id = ?',
            [id]
        );

        if (!student.length) {
            await connection.rollback();
            return res.status(404).json({ error: 'Student not found' });
        }

        if (student[0].status !== 'paused') {
            await connection.rollback();
            return res.status(400).json({ error: 'Student is not currently paused' });
        }

        // Check center access for non-super admins
        if (!req.user.is_super_admin) {
            const [userCenters] = await connection.query(
                'SELECT center_id FROM user_centers WHERE user_id = ? AND center_id = ?',
                [req.user.id, student[0].center_id]
            );

            if (!userCenters.length) {
                await connection.rollback();
                return res.status(403).json({ error: 'Access denied. Student not in your center.' });
            }
        }

        // Update student status to active
        await connection.query(
            `UPDATE children
             SET status = 'active',
                 pause_start_date = NULL,
                 pause_end_date = NULL,
                 pause_reason = NULL,
                 pause_notes = NULL,
                 paused_by = NULL,
                 paused_at = NULL
             WHERE id = ?`,
            [id]
        );

        // Update pause history record
        await connection.query(
            `UPDATE student_pause_history
             SET status = 'completed',
                 resumed_by = ?,
                 resumed_at = NOW(),
                 notes = CONCAT(COALESCE(notes, ''), '\nResumed: ', COALESCE(?, 'No additional notes'))
             WHERE student_id = ? AND status = 'active'`,
            [req.user.id, notes, id]
        );

        await connection.commit();

        res.json({
            message: 'Student resumed successfully',
            student: {
                id: student[0].id,
                name: `${student[0].first_name} ${student[0].last_name || ''}`.trim(),
                status: 'active'
            }
        });

    } catch (error) {
        await connection.rollback();
        console.error('Error resuming student:', error);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        connection.release();
    }
});

// Get pause history for a student
router.get('/:id/pause-history', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        // Check if student exists and user has access
        const [student] = await pool.query(
            'SELECT id, center_id FROM children WHERE id = ?',
            [id]
        );

        if (!student.length) {
            return res.status(404).json({ error: 'Student not found' });
        }

        // Check center access for non-super admins
        if (!req.user.is_super_admin) {
            const [userCenters] = await pool.query(
                'SELECT center_id FROM user_centers WHERE user_id = ? AND center_id = ?',
                [req.user.id, student[0].center_id]
            );

            if (!userCenters.length) {
                return res.status(403).json({ error: 'Access denied. Student not in your center.' });
            }
        }

        const [history] = await pool.query(
            `SELECT
                h.*,
                pu.full_name as paused_by_name,
                ru.full_name as resumed_by_name
             FROM student_pause_history h
             LEFT JOIN users pu ON h.paused_by = pu.id
             LEFT JOIN users ru ON h.resumed_by = ru.id
             WHERE h.student_id = ?
             ORDER BY h.created_at DESC`,
            [id]
        );

        res.json(history);
    } catch (error) {
        console.error('Error fetching pause history:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Helper function to get N/A company ID
async function getNACompanyId() {
    const [naCompany] = await pool.query("SELECT id FROM companies WHERE company_name = 'N/A' LIMIT 1");
    return naCompany.length > 0 ? naCompany[0].id : null;
}

export default router;