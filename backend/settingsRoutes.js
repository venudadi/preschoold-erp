import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import pool from './db.js';
import { protect } from './authMiddleware.js';

const router = express.Router();

// Middleware to ensure only admins can access these settings
const adminOnly = (req, res, next) => {
    if (req.user.role !== 'admin' && req.user.role !== 'owner') {
        return res.status(403).json({ message: 'Forbidden: Access restricted to administrators.' });
    }
    next();
};

// --- PROGRAM ROUTES ---
router.get('/programs', protect, async (req, res) => {
    try {
        const [programs] = await pool.query('SELECT * FROM programs ORDER BY major_program, specific_program');
        res.json(programs);
    } catch (error) {
        res.status(500).json({ message: 'Server error fetching programs.' });
    }
});

router.post('/programs', protect, adminOnly, async (req, res) => {
    try {
        const { majorProgram, specificProgram } = req.body;
        if (!majorProgram || !specificProgram) {
            return res.status(400).json({ message: 'Both major and specific program names are required.' });
        }
        const newId = uuidv4();
        await pool.query('INSERT INTO programs (id, major_program, specific_program) VALUES (?, ?, ?)', [newId, majorProgram, specificProgram]);
        res.status(201).json({ message: 'Program added successfully!', id: newId });
    } catch (error) {
         if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'This program combination already exists.' });
        }
        res.status(500).json({ message: 'Server error adding program.' });
    }
});

// --- COMPANY ROUTES ---
router.get('/companies', protect, async (req, res) => {
    try {
        const [companies] = await pool.query('SELECT * FROM companies ORDER BY company_name');
        res.json(companies);
    } catch (error) {
        res.status(500).json({ message: 'Server error fetching companies.' });
    }
});

router.post('/companies', protect, adminOnly, async (req, res) => {
    try {
        const { companyName } = req.body;
        if (!companyName) {
            return res.status(400).json({ message: 'Company name is required.' });
        }
        const newId = uuidv4();
        await pool.query('INSERT INTO companies (id, company_name) VALUES (?, ?)', [newId, companyName]);
        res.status(201).json({ message: 'Company added successfully!', id: newId });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'This company already exists.' });
        }
        res.status(500).json({ message: 'Server error adding company.' });
    }
});

export default router;