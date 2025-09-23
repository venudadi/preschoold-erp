import express from 'express';
import pool from './db.js';
import { protect } from './authMiddleware.js';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcrypt';
import { body } from 'express-validator';
import { validateInput, sanitizeInput } from './middleware/security.js';

const router = express.Router();

// Super admin guard
const superAdminOnly = (req, res, next) => {
    if (req.user?.role !== 'super_admin') {
        return res.status(403).json({ message: 'Not authorized as super_admin' });
    }
    next();
};

router.use(protect);
router.use(superAdminOnly);
router.use(sanitizeInput);

// Available roles (excluding super_admin to prevent creation of multiple super admins)
const AVAILABLE_ROLES = ['owner', 'admin', 'academic_coordinator', 'teacher', 'parent'];

// GET /api/owners/roles - get available roles for user creation
router.get('/roles', protect, async (req, res) => {
    try {
        res.json({
            roles: AVAILABLE_ROLES.map(role => ({
                value: role,
                label: role.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
            }))
        });
    } catch (e) {
        console.error('Error fetching roles', e);
        res.status(500).json({ message: 'Failed to fetch roles' });
    }
});

// GET /api/owners - list all users (owners, admins, staff, etc.)
router.get('/', protect, async (req, res) => {
    try {
        const { role, center_id } = req.query;
        
        let query = `
            SELECT 
                u.id, 
                u.full_name, 
                u.email, 
                u.role, 
                u.is_active,
                u.account_locked,
                u.created_at,
                u.center_id,
                c.name as center_name,
                GROUP_CONCAT(DISTINCT uc.center_id) as assigned_center_ids,
                GROUP_CONCAT(DISTINCT uc_centers.name ORDER BY uc_centers.name SEPARATOR ', ') AS assigned_centers
            FROM users u
            LEFT JOIN centers c ON c.id = u.center_id
            LEFT JOIN user_centers uc ON uc.user_id = u.id
            LEFT JOIN centers uc_centers ON uc_centers.id = uc.center_id
            WHERE u.role != 'super_admin'
        `;
        
        const params = [];
        
        if (role) {
            query += ' AND u.role = ?';
            params.push(role);
        }
        
        if (center_id) {
            query += ' AND (u.center_id = ? OR uc.center_id = ?)';
            params.push(center_id, center_id);
        }
        
        query += `
            GROUP BY u.id, u.full_name, u.email, u.role, u.is_active, u.account_locked, u.created_at, u.center_id, c.name
            ORDER BY u.role, u.full_name
        `;
        
        const [users] = await pool.query(query, params);
        res.json(users);
    } catch (e) {
        console.error('Error listing users', e);
        res.status(500).json({ message: 'Failed to fetch users' });
    }
});

// GET /api/owners/centers - list all centers (for assignment UI)
router.get('/centers', protect, async (req, res) => {
    try {
        const [centers] = await pool.query(`SELECT id, name, is_active FROM centers ORDER BY name`);
        res.json(centers);
    } catch (e) {
        console.error('Error listing centers', e);
        res.status(500).json({ message: 'Failed to fetch centers' });
    }
});

// POST /api/owners - create a user with any role
router.post('/', 
    protect,
    validateInput([
        body('fullName')
            .trim()
            .isLength({ min: 2, max: 50 })
            .withMessage('Full name must be 2-50 characters')
            .matches(/^[a-zA-Z\s.'-]+$/)
            .withMessage('Full name contains invalid characters'),
        body('email')
            .isEmail()
            .normalizeEmail()
            .withMessage('Valid email is required'),
        body('password')
            .isLength({ min: 8 })
            .withMessage('Password must be at least 8 characters'),
        body('role')
            .isIn(AVAILABLE_ROLES)
            .withMessage('Invalid role selected'),
        body('centerId')
            .optional()
            .isUUID()
            .withMessage('Invalid center ID')
    ]),
    async (req, res) => {
        try {
            const { fullName, email, password, role, centerId, phoneNumber, jobTitle } = req.body;
            
            // Check if email already exists
            const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
            if (existing.length) {
                return res.status(409).json({ message: 'Email already exists' });
            }
            
            // Validate center exists if provided
            if (centerId) {
                const [center] = await pool.query('SELECT id FROM centers WHERE id = ?', [centerId]);
                if (!center.length) {
                    return res.status(400).json({ message: 'Invalid center ID' });
                }
            }
            
            const id = uuidv4();
            const salt = await bcrypt.genSalt(10);
            const hash = await bcrypt.hash(password, salt);
            
            await pool.query(
                `INSERT INTO users (id, full_name, email, password_hash, role, center_id, phone_number, job_title, created_at, must_reset_password)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), 1)`,
                [id, fullName, email, hash, role, centerId || null, phoneNumber || null, jobTitle || null]
            );
            
            res.status(201).json({ 
                id, 
                fullName, 
                email, 
                role,
                centerId: centerId || null,
                message: 'User created successfully. They must reset their password on first login.'
            });
        } catch (e) {
            console.error('Error creating user', e);
            res.status(500).json({ message: 'Failed to create user' });
        }
    }
);

// GET /api/owners/:userId - get user details
router.get('/:userId', protect, async (req, res) => {
    try {
        const { userId } = req.params;
        const [users] = await pool.query(`
            SELECT 
                u.id, 
                u.full_name, 
                u.email, 
                u.role, 
                u.center_id,
                u.phone_number,
                u.job_title,
                u.is_active,
                u.account_locked,
                u.created_at,
                c.name as center_name
            FROM users u
            LEFT JOIN centers c ON c.id = u.center_id
            WHERE u.id = ? AND u.role != 'super_admin'
        `, [userId]);
        
        if (!users.length) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        res.json(users[0]);
    } catch (e) {
        console.error('Error fetching user', e);
        res.status(500).json({ message: 'Failed to fetch user' });
    }
});

// PUT /api/owners/:userId - update user details
router.put('/:userId',
    validateInput([
        body('fullName')
            .optional()
            .trim()
            .isLength({ min: 2, max: 50 })
            .withMessage('Full name must be 2-50 characters'),
        body('email')
            .optional()
            .isEmail()
            .normalizeEmail()
            .withMessage('Valid email is required'),
        body('role')
            .optional()
            .isIn(AVAILABLE_ROLES)
            .withMessage('Invalid role selected'),
        body('centerId')
            .optional()
            .custom(value => value === null || value === '' || (typeof value === 'string' && value.length > 0))
            .withMessage('Invalid center ID')
    ]),
    async (req, res) => {
        try {
            const { userId } = req.params;
            const { fullName, email, role, centerId, phoneNumber, jobTitle, isActive } = req.body;
            
            // Check if user exists and is not super_admin
            const [existingUser] = await pool.query('SELECT id, email FROM users WHERE id = ? AND role != ?', [userId, 'super_admin']);
            if (!existingUser.length) {
                return res.status(404).json({ message: 'User not found' });
            }
            
            // Check if email is being changed and if new email already exists
            if (email && email !== existingUser[0].email) {
                const [emailExists] = await pool.query('SELECT id FROM users WHERE email = ? AND id != ?', [email, userId]);
                if (emailExists.length) {
                    return res.status(409).json({ message: 'Email already exists' });
                }
            }
            
            // Validate center exists if provided
            if (centerId) {
                const [center] = await pool.query('SELECT id FROM centers WHERE id = ?', [centerId]);
                if (!center.length) {
                    return res.status(400).json({ message: 'Invalid center ID' });
                }
            }
            
            const updates = [];
            const values = [];
            
            if (fullName !== undefined) {
                updates.push('full_name = ?');
                values.push(fullName);
            }
            if (email !== undefined) {
                updates.push('email = ?');
                values.push(email);
            }
            if (role !== undefined) {
                updates.push('role = ?');
                values.push(role);
            }
            if (centerId !== undefined) {
                updates.push('center_id = ?');
                values.push(centerId || null);
            }
            if (phoneNumber !== undefined) {
                updates.push('phone_number = ?');
                values.push(phoneNumber);
            }
            if (jobTitle !== undefined) {
                updates.push('job_title = ?');
                values.push(jobTitle);
            }
            if (isActive !== undefined) {
                updates.push('is_active = ?');
                values.push(isActive);
            }
            
            if (updates.length === 0) {
                return res.status(400).json({ message: 'No fields to update' });
            }
            
            updates.push('updated_at = NOW()');
            values.push(userId);
            
            await pool.query(
                `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
                values
            );
            
            res.json({ message: 'User updated successfully' });
        } catch (e) {
            console.error('Error updating user', e);
            res.status(500).json({ message: 'Failed to update user' });
        }
    }
);

// GET /api/owners/:ownerId/centers - get assigned center IDs for owner
router.get('/:ownerId/centers', protect, async (req, res) => {
    try {
        const { ownerId } = req.params;
        const [rows] = await pool.query('SELECT center_id FROM user_centers WHERE user_id = ?', [ownerId]);
        res.json(rows.map(r => r.center_id));
    } catch (e) {
        console.error('Error fetching owner centers', e);
        res.status(500).json({ message: 'Failed to fetch owner centers' });
    }
});

// PUT /api/owners/:ownerId/centers - assign centers to owner (replace set)
router.put('/:ownerId/centers', protect, async (req, res) => {
    const conn = await pool.getConnection();
    try {
        const { ownerId } = req.params;
        const { centerIds } = req.body; // array of center IDs
        if (!Array.isArray(centerIds)) {
            return res.status(400).json({ message: 'centerIds must be an array' });
        }
        // validate user exists
        const [users] = await conn.query('SELECT id FROM users WHERE id = ?', [ownerId]);
        if (!users.length) {
            return res.status(404).json({ message: 'User not found' });
        }
        await conn.beginTransaction();
        await conn.query('DELETE FROM user_centers WHERE user_id = ?', [ownerId]);
        if (centerIds.length) {
            const values = centerIds.map(cid => [uuidv4(), ownerId, cid]);
            await conn.query('INSERT INTO user_centers (id, user_id, center_id) VALUES ?', [values]);
        }
        await conn.commit();
        res.json({ message: 'Owner center assignments updated' });
    } catch (e) {
        await conn.rollback();
        console.error('Error assigning centers to owner', e);
        res.status(500).json({ message: 'Failed to update owner centers' });
    } finally {
        conn.release();
    }
});

// GET /api/owners/:userId/roles - get assigned roles for a user
router.get('/:userId/roles', protect, async (req, res) => {
    try {
        const { userId } = req.params;
        const [rows] = await pool.query('SELECT role FROM user_roles WHERE user_id = ?', [userId]);
        res.json(rows.map(r => r.role));
    } catch (e) {
        console.error('Error fetching user roles', e);
        res.status(500).json({ message: 'Failed to fetch user roles' });
    }
});

// PUT /api/owners/:userId/roles - replace roles for a user
router.put('/:userId/roles', protect, async (req, res) => {
    const conn = await pool.getConnection();
    try {
        const { userId } = req.params;
        const { roles } = req.body; // array of role names
        if (!Array.isArray(roles)) {
            return res.status(400).json({ message: 'roles must be an array' });
        }
        // validate roles exist
        if (roles.length) {
            const [valid] = await conn.query('SELECT name FROM roles WHERE name IN (?)', [roles]);
            const validSet = new Set(valid.map(r => r.name));
            const invalid = roles.filter(r => !validSet.has(r));
            if (invalid.length) {
                return res.status(400).json({ message: `Invalid roles: ${invalid.join(', ')}` });
            }
        }
        await conn.beginTransaction();
        await conn.query('DELETE FROM user_roles WHERE user_id = ?', [userId]);
        if (roles.length) {
            const values = roles.map(role => [uuidv4(), userId, role]);
            await conn.query('INSERT INTO user_roles (id, user_id, role) VALUES ?', [values]);
        }
        // keep users.role as primary role (first in list if provided)
        if (roles.length) {
            await conn.query('UPDATE users SET role = ? WHERE id = ?', [roles[0], userId]);
        }
        await conn.commit();
        res.json({ message: 'User roles updated' });
    } catch (e) {
        await conn.rollback();
        console.error('Error updating user roles', e);
        res.status(500).json({ message: 'Failed to update user roles' });
    } finally {
        conn.release();
    }
});

// PUT /api/owners/:userId/reset-password - force password reset
router.put('/:userId/reset-password', protect, async (req, res) => {
    try {
        const { userId } = req.params;
        
        // Check if user exists and is not super_admin
        const [existingUser] = await pool.query('SELECT id FROM users WHERE id = ? AND role != ?', [userId, 'super_admin']);
        if (!existingUser.length) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        await pool.query(
            'UPDATE users SET must_reset_password = 1, updated_at = NOW() WHERE id = ?',
            [userId]
        );
        
        res.json({ message: 'Password reset flag set. User will be required to reset password on next login.' });
    } catch (e) {
        console.error('Error forcing password reset', e);
        res.status(500).json({ message: 'Failed to set password reset flag' });
    }
});

// PUT /api/owners/:userId/toggle-status - activate/deactivate user
router.put('/:userId/toggle-status', protect, async (req, res) => {
    try {
        const { userId } = req.params;
        
        // Check if user exists and is not super_admin
        const [existingUser] = await pool.query('SELECT id, is_active FROM users WHERE id = ? AND role != ?', [userId, 'super_admin']);
        if (!existingUser.length) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        const newStatus = !existingUser[0].is_active;
        
        await pool.query(
            'UPDATE users SET is_active = ?, updated_at = NOW() WHERE id = ?',
            [newStatus, userId]
        );
        
        res.json({ 
            message: `User ${newStatus ? 'activated' : 'deactivated'} successfully`,
            isActive: newStatus
        });
    } catch (e) {
        console.error('Error toggling user status', e);
        res.status(500).json({ message: 'Failed to toggle user status' });
    }
});

// DELETE /api/owners/:userId - soft delete user (mark as inactive)
router.delete('/:userId', protect, async (req, res) => {
    try {
        const { userId } = req.params;
        
        // Check if user exists and is not super_admin
        const [existingUser] = await pool.query('SELECT id FROM users WHERE id = ? AND role != ?', [userId, 'super_admin']);
        if (!existingUser.length) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        // For safety, we'll just deactivate instead of hard delete
        await pool.query(
            'UPDATE users SET is_active = 0, updated_at = NOW() WHERE id = ?',
            [userId]
        );
        
        res.json({ message: 'User deactivated successfully' });
    } catch (e) {
        console.error('Error deactivating user', e);
        res.status(500).json({ message: 'Failed to deactivate user' });
    }
});

export default router;
