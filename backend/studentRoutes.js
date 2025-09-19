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
                comp.company_name,
                TIMESTAMPDIFF(MINUTE, s.program_start_time, s.program_end_time) / 60.0 as service_hours
            FROM students s
            LEFT JOIN centers c ON s.center_id = c.id
            LEFT JOIN classrooms cl ON s.classroom_id = cl.id
            LEFT JOIN companies comp ON s.company_id = comp.id
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

// Helper function to get N/A company ID
async function getNACompanyId() {
    const [naCompany] = await pool.query("SELECT id FROM companies WHERE company_name = 'N/A' LIMIT 1");
    return naCompany.length > 0 ? naCompany[0].id : null;
}

export default router;