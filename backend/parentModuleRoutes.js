
import express from 'express';
import {
  getParentPreferences,
  setParentPreference,
  getParentReadStatus,
  setParentReadStatus,
  submitParentFeedback,
  getParentFeedback,
  logParentNotification,
  getParentNotifications,
  logParentAction
} from './controllers/parentModuleController.js';
import { protect } from './authMiddleware.js';
import pool from './db.js';

const router = express.Router();

// Get parent's children with full details including center name
router.get('/my-children', protect, async (req, res) => {
  try {
    const parentId = req.user.id;

    // Query to get all children linked to this parent with center and classroom details
    const query = `
      SELECT
        c.id,
        c.first_name,
        c.last_name,
        c.student_id,
        c.date_of_birth,
        c.gender,
        c.enrollment_date,
        c.classroom_id,
        c.center_id,
        c.status,
        c.allergies,
        c.emergency_contact_name,
        c.emergency_contact_phone,
        cls.name AS classroom_name,
        ctr.name AS center_name,
        ctr.address AS center_address,
        ctr.phone AS center_phone
      FROM children c
      LEFT JOIN parent_child_links pcl ON c.id = pcl.child_id
      LEFT JOIN classrooms cls ON c.classroom_id = cls.id
      LEFT JOIN centers ctr ON c.center_id = ctr.id
      WHERE pcl.parent_id = ? AND c.status IN ('active', 'paused')
      ORDER BY c.first_name, c.last_name
    `;

    const [children] = await pool.execute(query, [parentId]);

    // Also try to get children through the parents table (legacy support)
    if (children.length === 0) {
      const legacyQuery = `
        SELECT
          c.id,
          c.first_name,
          c.last_name,
          c.student_id,
          c.date_of_birth,
          c.gender,
          c.enrollment_date,
          c.classroom_id,
          c.center_id,
          c.status,
          c.allergies,
          c.emergency_contact_name,
          c.emergency_contact_phone,
          cls.name AS classroom_name,
          ctr.name AS center_name,
          ctr.address AS center_address,
          ctr.phone AS center_phone
        FROM children c
        LEFT JOIN classrooms cls ON c.classroom_id = cls.id
        LEFT JOIN centers ctr ON c.center_id = ctr.id
        WHERE c.id IN (
          SELECT child_id FROM parents WHERE user_id = ?
        ) AND c.status IN ('active', 'paused')
        ORDER BY c.first_name, c.last_name
      `;

      const [legacyChildren] = await pool.execute(legacyQuery, [parentId]);

      return res.json({
        success: true,
        children: legacyChildren,
        count: legacyChildren.length
      });
    }

    res.json({
      success: true,
      children,
      count: children.length
    });
  } catch (error) {
    console.error('Error fetching parent children:', error);
    res.status(500).json({
      error: {
        message: 'Failed to fetch children information',
        code: 'DATABASE_ERROR'
      }
    });
  }
});

// Preferences

router.get('/preferences', protect, getParentPreferences);
router.post('/preferences', protect, setParentPreference);

// Read/Seen Status

router.get('/read-status', protect, getParentReadStatus);
router.post('/read-status', protect, setParentReadStatus);

// Feedback

router.get('/feedback', protect, getParentFeedback);
router.post('/feedback', protect, submitParentFeedback);

// Notification Log

router.get('/notifications', protect, getParentNotifications);
router.post('/notifications', protect, logParentNotification);

// Action Audit Log

router.post('/action-log', protect, logParentAction);

export default router;
