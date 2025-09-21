import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import pool from './db.js';
import { protect } from './authMiddleware.js';

const router = express.Router();

// Middleware to check admin access
const checkAdminAccess = (req, res, next) => {
    const role = req.user.role;
    // super_admin has unrestricted access to all centers
    if (role === 'super_admin') {
        return next();
    }
    // admin and owner can only access their assigned center
    if ((role === 'admin' || role === 'owner') && req.user.center_id) {
        const centerId = req.params.centerId || req.query.centerId || req.body.centerId;
        if (req.user.center_id === centerId || !centerId) {
            return next();
        }
    }
    // For general operations without specific center ID requirement
    if (!req.params.centerId && !req.query.centerId && !req.body.centerId) {
        if (role === 'admin' || role === 'owner') {
            return next();
        }
    }
    return res.status(403).json({ message: 'Forbidden: Access is restricted to administrators.' });
};

// Apply protection and admin access check to all routes
router.use(protect);
router.use(checkAdminAccess);

// --- CHILD MANAGEMENT ---

// URL: POST /api/admin/children
// Adds a new child to the database.
router.post('/children', async (req, res) => {
    try {
        const { fullName, dateOfBirth, gender, enrollmentDate, classroomId } = req.body;

        if (!fullName || !dateOfBirth || !gender || !enrollmentDate) {
            return res.status(400).json({ message: 'Missing required fields for child enrollment.' });
        }

        const childId = uuidv4();
        const sql = `
            INSERT INTO children (id, full_name, date_of_birth, gender, enrollment_date, classroom_id)
            VALUES (?, ?, ?, ?, ?, ?)
        `;
        await pool.query(sql, [childId, fullName, dateOfBirth, gender, enrollmentDate, classroomId]);

        res.status(201).json({ message: 'Child enrolled successfully!', childId });

    } catch (error) {
        console.error('Error enrolling child:', error);
        res.status(500).json({ message: 'Server error while enrolling child.' });
    }
});

// URL: GET /api/admin/children
// Retrieves a list of all enrolled children.
router.get('/children', async (req, res) => {
    if (req.user.role !== 'admin' && req.user.role !== 'owner') {
        return res.status(403).json({ message: 'Forbidden: Access is restricted to administrators.' });
    }

    try {
        const sql = `
            SELECT 
                c.id, c.first_name, c.last_name, c.date_of_birth, c.enrollment_date, 
                cl.name as classroom_name 
            FROM children c
            LEFT JOIN classrooms cl ON c.classroom_id = cl.id
            ORDER BY c.created_at DESC
        `;
        const [children] = await pool.query(sql);
        res.status(200).json(children);
    } catch (error) {
        console.error('Error fetching children:', error);
        res.status(500).json({ message: 'Server error while fetching children.' });
    }
});


// --- CLASSROOM MANAGEMENT ---

// URL: POST /api/admin/classrooms
// Creates a new classroom.
router.post('/classrooms', protect, async (req, res) => {
    if (req.user.role !== 'admin' && req.user.role !== 'owner') {
        return res.status(403).json({ message: 'Forbidden: Access is restricted to administrators.' });
    }

    try {
        const { name, description } = req.body;
        if (!name) {
            return res.status(400).json({ message: 'Classroom name is required.' });
        }

        const classroomId = uuidv4();
        const sql = `INSERT INTO classrooms (id, name, description) VALUES (?, ?, ?)`;
        await pool.query(sql, [classroomId, name, description]);

        res.status(201).json({ message: 'Classroom created successfully!', classroomId });

    } catch (error) {
        console.error('Error creating classroom:', error);
        res.status(500).json({ message: 'Server error while creating classroom.' });
    }
});

// URL: GET /api/admin/classrooms
// Retrieves a list of all classrooms.
router.get('/classrooms', protect, async (req, res) => {
    if (req.user.role !== 'admin' && req.user.role !== 'owner') {
        return res.status(403).json({ message: 'Forbidden: Access is restricted to administrators.' });
    }

    try {
        const sql = `SELECT * FROM classrooms ORDER BY created_at DESC`;
        const [classrooms] = await pool.query(sql);
        res.status(200).json(classrooms);
    } catch (error) {
        console.error('Error fetching classrooms:', error);
        res.status(500).json({ message: 'Server error while fetching classrooms.' });
    }
});


// --- STAFF MANAGEMENT ---

// URL: GET /api/admin/staff
// Retrieves a list of all staff members (users who are not parents).
router.get('/staff', protect, async (req, res) => {
    if (req.user.role !== 'admin' && req.user.role !== 'owner') {
        return res.status(403).json({ message: 'Forbidden: Access is restricted to administrators.' });
    }

    try {
        const sql = `SELECT id, full_name, email, role FROM users WHERE role != 'parent'`;
        const [staff] = await pool.query(sql);
        res.status(200).json(staff);
    } catch (error) {
        console.error('Error fetching staff:', error);
        res.status(500).json({ message: 'Server error while fetching staff.' });
    }
});

// URL: POST /api/admin/assign-teacher
// Assigns a teacher to a specific classroom.
router.post('/assign-teacher', protect, async (req, res) => {
    if (req.user.role !== 'admin' && req.user.role !== 'owner') {
        return res.status(403).json({ message: 'Forbidden: Access is restricted to administrators.' });
    }

    try {
        const { userId, classroomId } = req.body;
        if (!userId || !classroomId) {
            return res.status(400).json({ message: 'User ID and Classroom ID are required.' });
        }

        const sql = `INSERT INTO staff_assignments (user_id, classroom_id) VALUES (?, ?)`;
        await pool.query(sql, [userId, classroomId]);

        res.status(200).json({ message: 'Teacher assigned to classroom successfully!' });

    } catch (error) {
        console.error('Error assigning teacher:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'This teacher is already assigned to this classroom.' });
        }
        res.status(500).json({ message: 'Server error while assigning teacher.' });
    }
});

export default router;

