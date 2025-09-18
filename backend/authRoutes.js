// This file creates a ROUTER, not an 'app'

import express from 'express';
import bcrypt from 'bcrypt';
import pool from './db.js';
import { protect as authProtect } from './authMiddleware.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router(); // Use Router, not app

// Token verification endpoint
router.get('/verify', authProtect, (req, res) => {
    // If middleware passes, token is valid
    res.json({ 
        valid: true,
        user: {
            id: req.user.id,
            email: req.user.email,
            role: req.user.role,
            fullName: req.user.fullName
        }
    });
});

// --- USER REGISTRATION ENDPOINT ---
// URL: POST /register
router.post('/register', async (req, res) => {
    // ... (all your registration logic remains the same here)
    try {
        const { fullName, email, password, role } = req.body;

        if (!fullName || !email || !password || !role) {
            return res.status(400).json({ message: 'All fields are required.' });
        }
        
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);
        const userId = uuidv4();

        const sql = `
            INSERT INTO users (id, full_name, email, password_hash, role)
            VALUES (?, ?, ?, ?, ?)
        `;
        await pool.query(sql, [userId, fullName, email, passwordHash, role]);

        res.status(201).json({ message: 'User registered successfully!', userId });

    } catch (error) {
        console.error('Registration Error:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'Email already exists.' });
        }
        res.status(500).json({ message: 'Server error during registration.' });
    }
});

import jwt from 'jsonwebtoken';

// --- USER LOGIN ENDPOINT ---
// URL: POST /api/login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // 1. Basic Validation
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required.' });
        }

        // 2. Find the user in the database
        const findUserSql = `SELECT * FROM users WHERE email = ?`;
        const [users] = await pool.query(findUserSql, [email]);

        if (users.length === 0) {
            return res.status(401).json({ message: 'Invalid credentials.' }); // Use a generic message for security
        }

        const user = users[0];

        // 3. Compare the provided password with the stored hash
        const isPasswordCorrect = await bcrypt.compare(password, user.password_hash);

        if (!isPasswordCorrect) {
            return res.status(401).json({ message: 'Invalid credentials.' });
        }

        // 4. 🔑 Create a JWT Token
        // This token securely identifies the user without exposing their password.
        const token = jwt.sign(
            { userId: user.id, role: user.role }, // The data to store in the token (the "payload")
            process.env.JWT_SECRET, // A secret key to sign the token
            { expiresIn: '1h' } // Token will expire in 1 hour
        );

        // 5. Send the token to the user
        res.status(200).json({
            message: 'Login successful!',
            token,
            user: {
                id: user.id,
                fullName: user.full_name,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ message: 'Server error during login.' });
    }
});

import { protect } from './authMiddleware.js'; // Import the new middleware

// --- PROTECTED TEST ROUTE ---
// URL: GET /api/profile
// This route is now protected. Only users with a valid token can access it.
router.get('/profile', protect, (req, res) => {
    // Because of the 'protect' middleware, we now have access to req.user
    res.status(200).json({
        message: 'You have accessed the protected profile route!',
        user: req.user // This is the payload we stored in the token
    });
});

export default router;