// This file creates a ROUTER, not an 'app'


import express from 'express';
import bcrypt from 'bcrypt';
import pool from './db.js';
import { protect } from './authMiddleware.js';
import { v4 as uuidv4 } from 'uuid';
import { rateLimiters, sanitizeInput, validateInput, validationRules } from './middleware/security.js';
import { body } from 'express-validator';
import jwt from 'jsonwebtoken';


const allowedRoles = ['parent', 'admin', 'owner', 'super_admin', 'teacher', 'financial_manager'];
const router = express.Router();
// Apply rate limiting and sanitization to all auth routes
router.use(rateLimiters.auth);
router.use(sanitizeInput);

// --- USER REGISTRATION ENDPOINT ---
router.post(
  '/register',
  validateInput([
    body('fullName')
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('Full name must be 2-50 characters')
      .matches(/^[a-zA-Z\s.'-]+$/)
      .withMessage('Full name contains invalid characters'),
    validationRules.email,
    validationRules.password,
    body('role')
      .isString()
      .custom((value) => allowedRoles.includes(value))
      .withMessage('Invalid role')
  ]),
  async (req, res) => {
    try {
      const { fullName, email, password, role } = req.body;
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
      if (error.code === 'PROTOCOL_CONNECTION_LOST' || error.code === 'ECONNREFUSED' || error.code === 'ER_CON_COUNT_ERROR') {
        return res.status(503).json({ message: 'Database connection error. Please try again later.' });
      }
      if (error.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ message: 'Email already exists.' });
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
      console.error('Registration Error:', error);
      res.status(500).json({ message: 'Server error during registration.' });
    }
  }
);

// --- USER LOGIN ENDPOINT ---
router.post(
  '/login',
  validateInput([
    validationRules.email,
    body('password').exists().withMessage('Password is required')
  ]),
  async (req, res) => {
    try {
      const { email, password } = req.body;
      const findUserSql = `SELECT * FROM users WHERE email = ?`;
      const [users] = await pool.query(findUserSql, [email]);
      if (users.length === 0) {
        return res.status(401).json({ message: 'Invalid credentials.' });
      }
      const user = users[0];
      const isPasswordCorrect = await bcrypt.compare(password, user.password_hash);
      if (!isPasswordCorrect) {
        return res.status(401).json({ message: 'Invalid credentials.' });
      }
      // Check if user must reset password
      if (user.must_reset_password) {
        return res.status(403).json({
          message: 'Password reset required. Please change your password before continuing.',
          code: 'MUST_RESET_PASSWORD',
          user: {
            id: user.id,
            fullName: user.full_name,
            email: user.email,
            role: user.role
          }
        });
      }

      const token = jwt.sign(
        { userId: user.id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );
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
  }
);

// --- PROTECTED PROFILE ROUTE ---
router.get('/profile', protect, (req, res) => {
  res.status(200).json({
    message: 'You have accessed the protected profile route!',
    user: req.user
  });
});

// --- TEST CLEANUP ENDPOINT (for automated tests only) ---
router.delete('/test/cleanup-user', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || typeof email !== 'string') {
      return res.status(400).json({ message: 'Valid email is required.' });
    }
    const sql = 'DELETE FROM users WHERE email = ?';
    const [result] = await pool.query(sql, [email]);
    if (result.affectedRows > 0) {
      return res.status(200).json({ message: 'Test user deleted.' });
    } else {
      return res.status(204).send(); // No Content if user not found
    }
  } catch (error) {
    console.error('Cleanup Error:', error);
    res.status(500).json({ message: 'Server error during cleanup.' });
  }
});

export default router;