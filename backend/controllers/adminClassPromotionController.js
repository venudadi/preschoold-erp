// adminClassPromotionController.js
// Controller for admin class promotion and assignment

import db from '../db.js';
import { v4 as uuidv4 } from 'uuid';

// POST /api/admin-class/promotion/transfer
export const transferStudent = async (req, res) => {
  const { student_id, from_center_id, to_center_id, to_class_id } = req.body;
  if (!student_id || !from_center_id || !to_center_id || !to_class_id) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  const dbTx = await db.getConnection();
  try {
    await dbTx.beginTransaction();
    // 1. Create new assignment in new center/class
    await dbTx.query(
      'INSERT INTO student_class_assignments (id, student_id, class_id, center_id, assigned_at) VALUES (?, ?, ?, ?, NOW())',
      [uuidv4(), student_id, to_class_id, to_center_id]
    );
    // 2. Migrate all related records to new center (attendance, portfolio, logs, etc.)
    await dbTx.query('UPDATE attendance SET center_id = ? WHERE student_id = ?', [to_center_id, student_id]);
    await dbTx.query('UPDATE digital_portfolios SET center_id = ? WHERE child_id = ?', [to_center_id, student_id]);
    await dbTx.query('UPDATE observation_logs SET center_id = ? WHERE child_id = ?', [to_center_id, student_id]);
    // Add more tables as needed
    await dbTx.commit();
    res.json({ success: true });
  } catch (err) {
    await dbTx.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    dbTx.release();
  }
};
// POST /api/admin-class/promotion/promote
export const promoteStudent = async (req, res) => {
  try {
    const { student_id, from_class_id, to_class_id, center_id } = req.body;
    if (!student_id || !from_class_id || !to_class_id || !center_id) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    // Insert new assignment with promotion info
    await db.query(
      'INSERT INTO student_class_assignments (id, student_id, class_id, center_id, promoted_from_class_id, promoted_at) VALUES (?, ?, ?, ?, ?, NOW())',
      [uuidv4(), student_id, to_class_id, center_id, from_class_id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/admin-class/promotion/assign
export const assignStudentToClass = async (req, res) => {
  try {
    const { student_id, class_id, center_id } = req.body;
    if (!student_id || !class_id || !center_id) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
  await db.query(
      'INSERT INTO student_class_assignments (id, student_id, class_id, center_id) VALUES (?, ?, ?, ?)',
      [uuidv4(), student_id, class_id, center_id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
