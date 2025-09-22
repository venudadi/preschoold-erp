// classroomAnnouncementController.js
// Controller for classroom announcements, with push notification hook

import db from '../db.js';
import { v4 as uuidv4 } from 'uuid';
// const { sendPushNotification } = require('../utils/pushNotifications'); // Placeholder for push

// POST /api/classroom-announcements
export const createAnnouncement = async (req, res) => {
  try {
    const { classroom_id, title, message, expires_at, is_important } = req.body;
    if (!classroom_id || !title || !message) return res.status(400).json({ error: 'Missing required fields' });
    const id = uuidv4();
    await db.query(
      'INSERT INTO classroom_announcements (id, classroom_id, title, message, posted_by, expires_at, is_important) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, classroom_id, title, message, req.user.id, expires_at || null, !!is_important]
    );
    // sendPushNotification(classroom_id, title, message); // Integrate with FCM or similar
    res.json({ success: true, id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/classroom-announcements/:classroomId
export const getAnnouncements = async (req, res) => {
  try {
    const { classroomId } = req.params;
    const rows = await db.query(
      'SELECT * FROM classroom_announcements WHERE classroom_id = ? ORDER BY posted_at DESC',
      [classroomId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// DELETE /api/classroom-announcements/:id
export const deleteAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM classroom_announcements WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
