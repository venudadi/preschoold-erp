import express from 'express';
import pool from './db.js';
import { protect } from './authMiddleware.js';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcrypt';

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

// GET /api/owners - list owners with their centers
router.get('/', async (req, res) => {
    try {
        const [owners] = await pool.query(`
            SELECT u.id, u.full_name, u.email, u.role, GROUP_CONCAT(c.name ORDER BY c.name SEPARATOR ', ') AS centers
            FROM users u
            LEFT JOIN user_centers uc ON uc.user_id = u.id
            LEFT JOIN centers c ON c.id = uc.center_id
            WHERE u.role IN ('owner','admin')
            GROUP BY u.id, u.full_name, u.email, u.role
            ORDER BY u.full_name
        `);
        res.json(owners);
    } catch (e) {
        console.error('Error listing owners', e);
        res.status(500).json({ message: 'Failed to fetch owners' });
    }
});

// GET /api/owners/centers - list all centers (for assignment UI)
router.get('/centers', async (req, res) => {
    try {
        const [centers] = await pool.query(`SELECT id, name FROM centers WHERE is_active = 1 ORDER BY name`);
        res.json(centers);
    } catch (e) {
        console.error('Error listing centers', e);
        res.status(500).json({ message: 'Failed to fetch centers' });
    }
});

// POST /api/owners - create an owner
router.post('/', async (req, res) => {
    try {
        const { fullName, email, password } = req.body;
        if (!fullName || !email || !password) {
            return res.status(400).json({ message: 'fullName, email, and password are required' });
        }
        const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
        if (existing.length) {
            return res.status(409).json({ message: 'Email already exists' });
        }
        const id = uuidv4();
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);
        await pool.query(
            `INSERT INTO users (id, full_name, email, password_hash, role, created_at)
             VALUES (?, ?, ?, ?, 'owner', NOW())`,
            [id, fullName, email, hash]
        );
        res.status(201).json({ id, fullName, email, role: 'owner' });
    } catch (e) {
        console.error('Error creating owner', e);
        res.status(500).json({ message: 'Failed to create owner' });
    }
});

// GET /api/owners/:ownerId/centers - get assigned center IDs for owner
router.get('/:ownerId/centers', async (req, res) => {
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
router.put('/:ownerId/centers', async (req, res) => {
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
router.get('/:userId/roles', async (req, res) => {
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
router.put('/:userId/roles', async (req, res) => {
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

export default router;
