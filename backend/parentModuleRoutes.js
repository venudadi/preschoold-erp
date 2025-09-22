
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

const router = express.Router();

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
