
import db from '../db.js';


// Preferences
export const getParentPreferences = async (req, res) => {
  const parentId = req.user.id;
  const [rows] = await db.query('SELECT preference_key, preference_value FROM parent_preferences WHERE parent_id = ?', [parentId]);
  res.json({ preferences: rows });
};
export const setParentPreference = async (req, res) => {
  const parentId = req.user.id;
  const { key, value } = req.body;
  await db.query(
    'INSERT INTO parent_preferences (id, parent_id, preference_key, preference_value) VALUES (UUID(),?,?,?) ON DUPLICATE KEY UPDATE preference_value = VALUES(preference_value), updated_at = CURRENT_TIMESTAMP',
    [parentId, key, value]
  );
  res.json({ success: true });
};


// Read/Seen Status
export const getParentReadStatus = async (req, res) => {
  const parentId = req.user.id;
  const [rows] = await db.query('SELECT item_type, item_id, seen_at FROM parent_read_status WHERE parent_id = ?', [parentId]);
  res.json({ readStatus: rows });
};
export const setParentReadStatus = async (req, res) => {
  const parentId = req.user.id;
  const { item_type, item_id } = req.body;
  await db.query(
    'INSERT INTO parent_read_status (id, parent_id, item_type, item_id, seen_at) VALUES (UUID(),?,?,?,CURRENT_TIMESTAMP) ON DUPLICATE KEY UPDATE seen_at = CURRENT_TIMESTAMP',
    [parentId, item_type, item_id]
  );
  res.json({ success: true });
};


// Feedback
export const getParentFeedback = async (req, res) => {
  const parentId = req.user.id;
  const [rows] = await db.query('SELECT feedback_type, target_id, rating, comment, submitted_at FROM parent_feedback WHERE parent_id = ?', [parentId]);
  res.json({ feedback: rows });
};
export const submitParentFeedback = async (req, res) => {
  const parentId = req.user.id;
  const { feedback_type, target_id, rating, comment } = req.body;
  await db.query(
    'INSERT INTO parent_feedback (id, parent_id, feedback_type, target_id, rating, comment, submitted_at) VALUES (UUID(),?,?,?,?,?,CURRENT_TIMESTAMP)',
    [parentId, feedback_type, target_id, rating, comment]
  );
  res.json({ success: true });
};


// Notification Log
export const getParentNotifications = async (req, res) => {
  const parentId = req.user.id;
  const [rows] = await db.query('SELECT notification_type, message, sent_at, read_at, status FROM parent_notification_log WHERE parent_id = ?', [parentId]);
  res.json({ notifications: rows });
};
export const logParentNotification = async (req, res) => {
  const parentId = req.user.id;
  const { notification_type, message, status } = req.body;
  await db.query(
    'INSERT INTO parent_notification_log (id, parent_id, notification_type, message, sent_at, status) VALUES (UUID(),?,?,?,CURRENT_TIMESTAMP,?)',
    [parentId, notification_type, message, status || 'sent']
  );
  res.json({ success: true });
};


// Action Audit Log
export const logParentAction = async (req, res) => {
  const parentId = req.user.id;
  const { action_type, action_details } = req.body;
  await db.query(
    'INSERT INTO parent_action_audit (id, parent_id, action_type, action_details, action_at) VALUES (UUID(),?,?,?,CURRENT_TIMESTAMP)',
    [parentId, action_type, action_details]
  );
  res.json({ success: true });
};
