
import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import pool from './db.js';
import { protect } from './authMiddleware.js';
import { validateInput, validationRules, sanitizeInput, rateLimiters } from './middleware/security.js';
import { body } from 'express-validator';

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


// Apply protection, rate limiting, and admin access check to all routes
router.use(protect);
router.use(rateLimiters.api);
router.use(checkAdminAccess);
router.use(sanitizeInput);

// --- CHILD MANAGEMENT ---

// URL: POST /api/admin/children
// Adds a new child to the database.
router.post(
  '/children',
  validateInput([
    body('fullName')
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('Full name must be 2-50 characters')
      .matches(/^[a-zA-Z\s.'-]+$/)
      .withMessage('Full name contains invalid characters'),
    body('dateOfBirth')
      .isISO8601()
      .withMessage('Date of birth must be a valid date (YYYY-MM-DD)')
      .custom((value) => {
        const dob = new Date(value);
        const now = new Date();
        if (dob > now) throw new Error('Date of birth cannot be in the future');
        const age = (now - dob) / (365.25 * 24 * 60 * 60 * 1000);
        if (age < 0.5 || age > 8) throw new Error('Child age must be between 6 months and 8 years');
        return true;
      }),
    body('gender')
      .isIn(['male', 'female', 'other'])
      .withMessage('Gender must be male, female, or other'),
    body('enrollmentDate')
      .isISO8601()
      .withMessage('Enrollment date must be a valid date (YYYY-MM-DD)')
      .custom((value) => {
        const enroll = new Date(value);
        const now = new Date();
        if (enroll > now) throw new Error('Enrollment date cannot be in the future');
        return true;
      }),
    body('classroomId')
      .optional({ nullable: true })
      .isUUID()
      .withMessage('Classroom ID must be a valid UUID')
  ]),
  async (req, res) => {
    try {
        const { fullName, dateOfBirth, gender, enrollmentDate, classroomId } = req.body;
        const childId = uuidv4();

        // Split fullName into first and last name
        const nameParts = fullName.trim().split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';

        const sql = `
            INSERT INTO children (id, first_name, last_name, date_of_birth, gender, classroom_id)
            VALUES (?, ?, ?, ?, ?, ?)
        `;
        await pool.query(sql, [childId, firstName, lastName, dateOfBirth, gender, classroomId]);

        res.status(201).json({ message: 'Child enrolled successfully!', childId });

    } catch (error) {
      if (error.code === 'PROTOCOL_CONNECTION_LOST' || error.code === 'ECONNREFUSED' || error.code === 'ER_CON_COUNT_ERROR') {
        return res.status(503).json({ message: 'Database connection error. Please try again later.' });
      }
      if (error.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ message: 'Duplicate entry. This record already exists.' });
      }
      if (error.code === 'ER_NO_REFERENCED_ROW_2' || error.code === 'ER_ROW_IS_REFERENCED_2') {
        return res.status(409).json({ message: 'Foreign key constraint error.' });
      }
      if (error.code === 'ER_LOCK_DEADLOCK') {
        return res.status(500).json({ message: 'Database deadlock. Please retry the operation.' });
      }
      if (error.fatal) {
        return res.status(500).json({ message: 'Fatal database error. Please contact support.' });
      }
      console.error('Error enrolling child:', error);
      res.status(500).json({ message: 'Server error while enrolling child.' });
    }
});

// URL: GET /api/admin/children
// Retrieves a list of all enrolled children.
router.get('/children', protect, async (req, res) => {
    if (req.user.role !== 'admin' && req.user.role !== 'owner' && req.user.role !== 'super_admin') {
        return res.status(403).json({ message: 'Forbidden: Access is restricted to administrators.' });
    }

    try {
        const sql = `
            SELECT
                c.id, c.first_name, c.last_name, c.date_of_birth, c.created_at as enrollment_date,
                c.status, c.pause_start_date, c.pause_end_date, c.pause_reason,
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

// URL: GET /api/admin/children/:id
// Retrieves comprehensive profile for a single child including parents and billing
router.get('/children/:id', protect, async (req, res) => {
    // Role-based access control
    const allowedRoles = ['admin', 'super_admin', 'center_director', 'owner'];
    if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({ message: 'Forbidden: Access is restricted to administrators and center directors.' });
    }

    try {
        const { id } = req.params;

        // Get child basic information
        const childSql = `
            SELECT
                c.id,
                c.first_name,
                c.last_name,
                c.date_of_birth,
                c.gender,
                c.student_id,
                c.status,
                c.center_id,
                c.classroom_id,
                c.company_id,
                c.has_tie_up,
                c.allergies,
                c.emergency_contact_name,
                c.emergency_contact_phone,
                c.medical_info,
                c.service_hours,
                c.program_start_time,
                c.program_end_time,
                c.pause_start_date,
                c.pause_end_date,
                c.pause_reason,
                c.created_at as enrollment_date,
                cl.name as classroom_name,
                ce.name as center_name,
                co.company_name,
                co.discount_percentage as company_discount
            FROM children c
            LEFT JOIN classrooms cl ON c.classroom_id = cl.id
            LEFT JOIN centers ce ON c.center_id = ce.id
            LEFT JOIN companies co ON c.company_id = co.id
            WHERE c.id = ?
        `;

        const [childRows] = await pool.query(childSql, [id]);

        if (childRows.length === 0) {
            return res.status(404).json({ message: 'Child not found' });
        }

        const child = childRows[0];

        // Filter by center if not super_admin
        if (req.user.role !== 'super_admin') {
            if (!child.center_id || child.center_id !== req.user.center_id) {
                return res.status(403).json({ message: 'Forbidden: You can only access children in your center.' });
            }
        }

        // Get all parents/guardians
        const parentsSql = `
            SELECT
                p.id,
                p.first_name,
                p.last_name,
                p.email,
                p.phone_number,
                p.relationship_to_child,
                pc.relationship_type,
                pc.is_primary,
                p.user_id
            FROM parent_children pc
            JOIN parents p ON pc.parent_id = p.id
            WHERE pc.child_id = ?
            ORDER BY pc.is_primary DESC, p.created_at ASC
        `;

        const [parents] = await pool.query(parentsSql, [id]);

        // Get billing summary
        const billingSql = `
            SELECT
                SUM(CASE WHEN status IN ('Sent', 'Partial', 'Overdue') THEN balance ELSE 0 END) as outstanding_balance,
                SUM(amount_paid) as total_paid,
                MAX(payment_date) as last_payment_date,
                COUNT(CASE WHEN status = 'Overdue' THEN 1 END) as overdue_count,
                COUNT(*) as total_invoices
            FROM invoices
            WHERE child_id = ?
        `;

        const [billingRows] = await pool.query(billingSql, [id]);
        const billing = billingRows[0] || {
            outstanding_balance: 0,
            total_paid: 0,
            last_payment_date: null,
            overdue_count: 0,
            total_invoices: 0
        };

        // Calculate age from date of birth
        const calculateAge = (dob) => {
            if (!dob) return null;
            const today = new Date();
            const birthDate = new Date(dob);
            let years = today.getFullYear() - birthDate.getFullYear();
            let months = today.getMonth() - birthDate.getMonth();

            if (months < 0 || (months === 0 && today.getDate() < birthDate.getDate())) {
                years--;
                months += 12;
            }

            if (today.getDate() < birthDate.getDate()) {
                months--;
            }

            return { years, months };
        };

        const age = calculateAge(child.date_of_birth);

        // Construct comprehensive profile
        const profile = {
            child: {
                id: child.id,
                first_name: child.first_name,
                last_name: child.last_name,
                full_name: `${child.first_name} ${child.last_name}`,
                date_of_birth: child.date_of_birth,
                age: age,
                gender: child.gender,
                student_id: child.student_id,
                status: child.status,
                enrollment_date: child.enrollment_date,
                allergies: child.allergies,
                medical_info: child.medical_info,
                service_hours: child.service_hours,
                program_start_time: child.program_start_time,
                program_end_time: child.program_end_time,
                pause_info: child.status === 'paused' ? {
                    start_date: child.pause_start_date,
                    end_date: child.pause_end_date,
                    reason: child.pause_reason
                } : null
            },
            parents: parents.map(p => ({
                id: p.id,
                first_name: p.first_name,
                last_name: p.last_name,
                full_name: `${p.first_name} ${p.last_name}`,
                email: p.email,
                phone: p.phone_number,
                relationship: p.relationship_type || p.relationship_to_child,
                is_primary: p.is_primary,
                has_user_account: !!p.user_id
            })),
            classroom: {
                id: child.classroom_id,
                name: child.classroom_name
            },
            center: {
                id: child.center_id,
                name: child.center_name
            },
            company: child.has_tie_up ? {
                id: child.company_id,
                name: child.company_name,
                discount_percentage: child.company_discount
            } : null,
            emergency: {
                contact_name: child.emergency_contact_name,
                contact_phone: child.emergency_contact_phone
            },
            billing: {
                outstanding_balance: parseFloat(billing.outstanding_balance) || 0,
                total_paid: parseFloat(billing.total_paid) || 0,
                last_payment_date: billing.last_payment_date,
                overdue_count: billing.overdue_count,
                total_invoices: billing.total_invoices,
                payment_status: billing.outstanding_balance > 0 ? (billing.overdue_count > 0 ? 'Overdue' : 'Pending') : 'Paid'
            }
        };

        res.status(200).json(profile);

    } catch (error) {
        console.error('Error fetching child profile:', error);
        res.status(500).json({ message: 'Server error while fetching child profile.' });
    }
});


// --- CLASSROOM MANAGEMENT ---

// URL: POST /api/admin/classrooms
// Creates a new classroom.
router.post('/classrooms', protect, async (req, res) => {
    if (req.user.role !== 'admin' && req.user.role !== 'owner' && req.user.role !== 'super_admin') {
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
    if (req.user.role !== 'admin' && req.user.role !== 'owner' && req.user.role !== 'super_admin') {
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
    if (req.user.role !== 'admin' && req.user.role !== 'owner' && req.user.role !== 'super_admin') {
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
    if (req.user.role !== 'admin' && req.user.role !== 'owner' && req.user.role !== 'super_admin') {
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

