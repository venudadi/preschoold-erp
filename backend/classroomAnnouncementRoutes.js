// classroomAnnouncementRoutes.js
// API routes for classroom announcements (with push notification hook)

import express from 'express';
import { protect, checkRole } from './authMiddleware.js';
import {
  createAnnouncement,
  getAnnouncements,
  deleteAnnouncement
} from './controllers/classroomAnnouncementController.js';

const router = express.Router();

// Teacher posts an announcement
router.post('/', protect, checkRole(['teacher']), createAnnouncement);

// Get announcements for a classroom (parent/teacher)
router.get('/:classroomId', protect, checkRole(['teacher', 'parent']), getAnnouncements);

// Delete announcement (teacher only)
router.delete('/:id', protect, checkRole(['teacher']), deleteAnnouncement);

export default router;
