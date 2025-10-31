
import express from 'express';
import pool from './db.js';
import { protect } from './authMiddleware.js';
import { validateInput, validationRules, sanitizeInput, rateLimiters } from './middleware/security.js';
import { body } from 'express-validator';

const router = express.Router();


// Apply rate limiting and sanitization to all enquiry routes
router.use(rateLimiters.api);
router.use(sanitizeInput);

// --- ADD A NEW ENQUIRY (PROTECTED) ---
// This endpoint is now fully aligned with your final schema
router.post(
  '/',
  protect,
  validateInput([
    body('source').isString().notEmpty().withMessage('Source is required'),
    body('childName')
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('Child name must be 2-50 characters')
      .matches(/^[a-zA-Z\s.'-]+$/)
      .withMessage('Child name contains invalid characters'),
    body('childDob')
      .optional({ nullable: true })
      .isISO8601()
      .withMessage('Child DOB must be a valid date (YYYY-MM-DD)'),
    body('parentName')
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('Parent name must be 2-50 characters')
      .matches(/^[a-zA-Z\s.'-]+$/)
      .withMessage('Parent name contains invalid characters'),
    body('mobileNumber')
      .isMobilePhone('en-IN')
      .withMessage('Please provide a valid Indian mobile number'),
    body('email')
      .optional({ nullable: true })
      .isEmail()
      .withMessage('Please provide a valid email address'),
    body('enquiryDate')
      .optional({ nullable: true })
      .isISO8601()
      .withMessage('Enquiry date must be a valid date (YYYY-MM-DD)'),
    body('followUpDate')
      .optional({ nullable: true })
      .isISO8601()
      .withMessage('Follow up date must be a valid date (YYYY-MM-DD)')
  ]),
  async (req, res) => {
    if (req.user.role !== 'admin' && req.user.role !== 'owner' && req.user.role !== 'super_admin') {
        return res.status(403).json({ message: 'Forbidden: You do not have permission to add enquiries.' });
    }
    try {
        // UPDATED: Destructuring all fields from your final schema
        const {
            source, childName, childDob, parentName, mobileNumber, company, hasTieUp, email,
            parentLocation, majorProgram, specificProgram, serviceHours, status,
            reasonForClosure, followUpFlag, assignedTo, remarks, followUpDate, visited
        } = req.body;

        // Basic Validation
        if (!source || !childName || !parentName || !mobileNumber) {
            return res.status(400).json({ message: 'Please fill all the required fields.' });
        }
        
        const enquiryDate = new Date().toISOString().slice(0, 10);

        // UPDATED: SQL query now includes all new fields and removes the 'id'
        const sql = `
            INSERT INTO enquiries (
                source, enquiry_date, child_name, child_dob, parent_name, mobile_number, company, has_tie_up, email,
                parent_location, major_program, specific_program, service_hours, status,
                reason_for_closure, follow_up_flag, assigned_to, remarks, follow_up_date, visited
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        // UPDATED: Values array matches the new query
        const [result] = await pool.query(sql, [
            source, enquiryDate, childName, childDob || null, parentName, mobileNumber, company, hasTieUp || false, email,
            parentLocation, majorProgram, specificProgram, serviceHours || null, status || 'Open',
            reasonForClosure, followUpFlag || false, assignedTo, remarks, followUpDate || null, visited || false
        ]);

        res.status(201).json({ message: 'Enquiry submitted successfully!', enquiryId: result.insertId });

    } catch (error) {
        console.error('Error submitting enquiry:', error);
        res.status(500).json({ message: 'Server error while submitting enquiry.' });
    }
});


// --- GET ALL ENQUIRIES (PROTECTED) ---
// --- GET ALL ENQUIRIES (NOW WITH SEARCH & FILTER) ---
// URL: GET /api/enquiries?search=...&status=...
router.get('/', protect, (req, res, next) => {
  sanitizeInput(req, res, () => next());
}, async (req, res) => {
     if (req.user.role !== 'admin' && req.user.role !== 'owner' && req.user.role !== 'super_admin') {
        return res.status(403).json({ message: 'Forbidden.' });
    }
    
    try {
        const { search, status } = req.query; // Get filter params from URL

        let query = 'SELECT * FROM enquiries';
        const params = [];
        const whereClauses = [];

        if (search) {
            whereClauses.push('child_name LIKE ?');
            params.push(`%${search}%`); // Add wildcards for partial matching
        }
        if (status) {
            whereClauses.push('status = ?');
            params.push(status);
        }

        if (whereClauses.length > 0) {
            query += ' WHERE ' + whereClauses.join(' AND ');
        }

        query += ' ORDER BY created_at DESC';

        const [enquiries] = await pool.query(query, params);
        res.status(200).json(enquiries);

    } catch (error) {
        console.error('Error fetching enquiries:', error);
        res.status(500).json({ message: 'Server error while fetching enquiries.' });
    }
});


// --- UPDATE AN EXISTING ENQUIRY (PROTECTED) ---
router.put('/:id', protect, async (req, res) => {
    if (req.user.role !== 'admin' && req.user.role !== 'owner' && req.user.role !== 'super_admin') {
        return res.status(403).json({ message: 'Forbidden.' });
    }
    try {
        const { id } = req.params;
        // UPDATED: Now allows updating the new fields
        const { status, remarks, assignedTo, followUpFlag, followUpDate, visited } = req.body;

        const sql = `
            UPDATE enquiries 
            SET status = ?, remarks = ?, assigned_to = ?, follow_up_flag = ?, follow_up_date = ?, visited = ?
            WHERE id = ?
        `;

        const [result] = await pool.query(sql, [status, remarks, assignedTo, followUpFlag, followUpDate || null, visited, id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Enquiry not found.' });
        }
        res.status(200).json({ message: 'Enquiry updated successfully!' });
    } catch (error) {
        console.error('Error updating enquiry:', error);
        res.status(500).json({ message: 'Server error while updating enquiry.' });
    }
});
// --- CHECK FOR COMPANY TIE-UP ---
// URL: GET /api/enquiries/check-company?name=somecompany
router.get('/check-company', protect, async (req, res) => {
    try {
        const { name } = req.query;
        if (!name) {
            return res.status(400).json({ hasTieUp: false });
        }
        // We perform a case-insensitive search
        const sql = 'SELECT id FROM companies WHERE LOWER(company_name) = LOWER(?)';
        const [companies] = await pool.query(sql, [name.trim()]);
        
        res.json({ hasTieUp: companies.length > 0 });

    } catch (error) {
        console.error('Error checking company tie-up:', error);
        res.status(500).json({ message: 'Server error while checking for company tie-up.' });
    }
});


export default router;