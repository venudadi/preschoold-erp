// adminClassPromotionRoutes.js
// API routes for admin to promote and assign students to classes

import express from 'express';
import { protect, checkRole } from './authMiddleware.js';
import {
  promoteStudent,
  assignStudentToClass,
  transferStudent
} from './controllers/adminClassPromotionController.js';

const router = express.Router();

// Promote a student to the next class
router.post('/promote', protect, checkRole(['admin']), promoteStudent);

// Assign a student to a class within a center
router.post('/assign', protect, checkRole(['admin']), assignStudentToClass);

// Transfer a student to another center and migrate data
router.post('/transfer', protect, checkRole(['admin']), transferStudent);

export default router;
