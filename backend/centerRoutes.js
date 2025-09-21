import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import pool from './db.js';
import { protect } from './authMiddleware.js';

const router = express.Router();

// Middleware to ensure only superadmins can manage centers
const superadminOnly = (req, res, next) => {
    if (req.user.role !== 'super_admin') {
        return res.status(403).json({ message: 'Forbidden: Access restricted to superadmins.' });
    }
    next();
};

// Middleware to validate center access for regular users
const validateCenterAccess = async (req, res, next) => {
    const requestedCenterId = req.params.centerId || req.query.centerId || req.body.centerId;
    const { role, center_id: userCenterId } = req.user;

    if (role === 'super_admin') {
        // Superadmin has access to all centers
        next();
    } else if (role === 'admin' || role === 'owner') {
        // Regular users can only access their assigned center
        if (!requestedCenterId || requestedCenterId === userCenterId) {
            next();
        } else {
            return res.status(403).json({ message: 'Access denied to this center.' });
        }
    } else {
        return res.status(403).json({ message: 'Insufficient permissions.' });
    }
};

// Apply protection to all routes
router.use(protect);

// GET /api/centers - Get all centers (superadmin) or user's center
router.get('/', async (req, res) => {
    try {
        const { role, center_id } = req.user;
        
        let query = `
            SELECT 
                c.*,
                COUNT(DISTINCT ch.id) as total_students,
                COUNT(DISTINCT cl.id) as total_classrooms,
                COUNT(DISTINCT s.user_id) as total_staff
            FROM centers c
            LEFT JOIN children ch ON c.id = ch.center_id
            LEFT JOIN classrooms cl ON c.id = cl.center_id
            LEFT JOIN staff_assignments s ON c.id = s.center_id
        `;
        
        let queryParams = [];
        
        if (role !== 'super_admin') {
            query += ' WHERE c.id = ?';
            queryParams.push(center_id);
        }
        
        query += ' GROUP BY c.id ORDER BY c.name';
        
        const [centers] = await pool.query(query, queryParams);
        res.status(200).json(centers);
        
    } catch (error) {
        console.error('Error fetching centers:', error);
        res.status(500).json({ message: 'Server error while fetching centers.' });
    }
});

// POST /api/centers - Create new center (superadmin only)
router.post('/', superadminOnly, async (req, res) => {
    const { name, address, phone_number } = req.body;
    
    if (!name) {
        return res.status(400).json({ message: 'Center name is required.' });
    }
    
    try {
        const centerId = uuidv4();
        
        const [result] = await pool.query(`
            INSERT INTO centers (id, name, address, phone_number, created_at)
            VALUES (?, ?, ?, ?, NOW())
        `, [centerId, name, address, phone_number]);
        
        res.status(201).json({ 
            message: 'Center created successfully!',
            centerId,
            name
        });
        
    } catch (error) {
        console.error('Error creating center:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'Center with this name already exists.' });
        }
        res.status(500).json({ message: 'Server error while creating center.' });
    }
});

// PUT /api/centers/:id - Update center (superadmin only)
router.put('/:id', superadminOnly, async (req, res) => {
    const { id } = req.params;
    const { name, address, phone_number, is_active } = req.body;
    
    try {
        const [result] = await pool.query(`
            UPDATE centers 
            SET name = ?, address = ?, phone_number = ?, is_active = ?
            WHERE id = ?
        `, [name, address, phone_number, is_active, id]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Center not found.' });
        }
        
        res.status(200).json({ message: 'Center updated successfully!' });
        
    } catch (error) {
        console.error('Error updating center:', error);
        res.status(500).json({ message: 'Server error while updating center.' });
    }
});

// DELETE /api/centers/:id - Soft delete center (superadmin only)
router.delete('/:id', superadminOnly, async (req, res) => {
    const { id } = req.params;
    
    try {
        // Check if center has active data
        const [children] = await pool.query('SELECT COUNT(*) as count FROM children WHERE center_id = ?', [id]);
        const [invoices] = await pool.query('SELECT COUNT(*) as count FROM invoices WHERE center_id = ? AND status != "Cancelled"', [id]);
        
        if (children[0].count > 0 || invoices[0].count > 0) {
            return res.status(400).json({ 
                message: 'Cannot delete center with active students or pending invoices. Please transfer data first.' 
            });
        }
        
        const [result] = await pool.query(`
            UPDATE centers SET is_active = 0, updated_at = NOW() WHERE id = ?
        `, [id]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Center not found.' });
        }
        
        res.status(200).json({ message: 'Center deactivated successfully!' });
        
    } catch (error) {
        console.error('Error deleting center:', error);
        res.status(500).json({ message: 'Server error while deleting center.' });
    }
});

// POST /api/centers/:id/assign-user - Assign user to center (superadmin only)
router.post('/:id/assign-user', superadminOnly, async (req, res) => {
    const { id: centerId } = req.params;
    const { user_id } = req.body;
    
    if (!user_id) {
        return res.status(400).json({ message: 'User ID is required.' });
    }
    
    try {
        // Verify center exists
        const [centers] = await pool.query('SELECT id FROM centers WHERE id = ?', [centerId]);
        if (centers.length === 0) {
            return res.status(404).json({ message: 'Center not found.' });
        }
        
        // Verify user exists
        const [users] = await pool.query('SELECT id, full_name FROM users WHERE id = ?', [user_id]);
        if (users.length === 0) {
            return res.status(404).json({ message: 'User not found.' });
        }
        
        // Assign user to center
        await pool.query('UPDATE users SET center_id = ? WHERE id = ?', [centerId, user_id]);
        
        res.status(200).json({ 
            message: `User ${users[0].full_name} assigned to center successfully!`
        });
        
    } catch (error) {
        console.error('Error assigning user to center:', error);
        res.status(500).json({ message: 'Server error while assigning user.' });
    }
});

// GET /api/centers/:id/users - Get users assigned to center
router.get('/:id/users', validateCenterAccess, async (req, res) => {
    const { id: centerId } = req.params;
    
    try {
        const [users] = await pool.query(`
            SELECT u.id, u.full_name, u.email, u.role, u.center_id
            FROM users u
            WHERE u.center_id = ?
            ORDER BY u.role, u.full_name
        `, [centerId]);
        
        res.status(200).json(users);
        
    } catch (error) {
        console.error('Error fetching center users:', error);
        res.status(500).json({ message: 'Server error while fetching users.' });
    }
});

// GET /api/centers/user-accessible - Get centers user has access to
router.get('/user-accessible', async (req, res) => {
    try {
        const { role, center_id } = req.user;
        
        let query = 'SELECT id, name FROM centers WHERE is_active = 1';
        let queryParams = [];
        
        if (role !== 'superadmin') {
            query += ' AND id = ?';
            queryParams.push(center_id);
        }
        
        query += ' ORDER BY name';
        
        const [centers] = await pool.query(query, queryParams);
        res.status(200).json(centers);
        
    } catch (error) {
        console.error('Error fetching accessible centers:', error);
        res.status(500).json({ message: 'Server error while fetching centers.' });
    }
});

export default router;