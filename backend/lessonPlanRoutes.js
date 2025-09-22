import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import pool from './db.js';
import { requireRole } from './middleware/security.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = express.Router();

// Multer config for lesson plan attachments
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = path.join(process.cwd(), 'uploads', 'lesson_plans');
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});
const upload = multer({ storage });

// Create lesson plan (admin/academic_coordinator only)
router.post('/', requireRole(['admin', 'academic_coordinator']), upload.array('attachments'), async (req, res) => {
  try {
    const { teacher_id, classroom_id, date, topic, objectives, activities, resources } = req.body;
    if (!teacher_id) {
      return res.status(400).json({ success: false, error: 'teacher_id is required' });
    }
    const attachments = req.files ? req.files.map(f => f.path) : [];
    const id = uuidv4();
    await pool.query(
      `INSERT INTO lesson_plans (id, teacher_id, classroom_id, date, topic, objectives, activities, resources, attachments) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, teacher_id, classroom_id, date, topic, objectives, activities, resources, JSON.stringify(attachments)]
    );
    res.status(201).json({ success: true, id });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get lesson plans (teachers see their own, admin/coordinator can filter by teacher)
router.get('/', requireRole(['teacher', 'admin', 'academic_coordinator']), async (req, res) => {
  try {
    const { classroom_id, date, teacher_id } = req.query;
    let sql = 'SELECT * FROM lesson_plans WHERE 1=1';
    const params = [];
    if (req.user.role === 'teacher') {
      sql += ' AND teacher_id = ?';
      params.push(req.user.id);
    } else if (teacher_id) {
      sql += ' AND teacher_id = ?';
      params.push(teacher_id);
    }
    if (classroom_id) {
      sql += ' AND classroom_id = ?';
      params.push(classroom_id);
    }
    if (date) {
      sql += ' AND date = ?';
      params.push(date);
    }
    sql += ' ORDER BY date DESC';
    const [rows] = await pool.query(sql, params);
    res.json({ success: true, lesson_plans: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Update lesson plan (admin/academic_coordinator only)
router.put('/:id', requireRole(['admin', 'academic_coordinator']), upload.array('attachments'), async (req, res) => {
  try {
    const { id } = req.params;
    const { topic, objectives, activities, resources, date } = req.body;
    const attachments = req.files ? req.files.map(f => f.path) : undefined;
    let sql = 'UPDATE lesson_plans SET topic=?, objectives=?, activities=?, resources=?, date=?';
    const params = [topic, objectives, activities, resources, date];
    if (attachments) {
      sql += ', attachments=?';
      params.push(JSON.stringify(attachments));
    }
    sql += ' WHERE id=?';
    params.push(id);
    const [result] = await pool.query(sql, params);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: 'Lesson plan not found' });
    }
    // Log action
    const { logSecurityEvent } = await import('./utils/security.js');
    await logSecurityEvent(req.user.id, 'LESSON_PLAN_EDIT', req.ip, req.get('User-Agent'), { lesson_plan_id: id }, 'info');
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Delete lesson plan (admin/academic_coordinator only)
router.delete('/:id', requireRole(['admin', 'academic_coordinator']), async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await pool.query('DELETE FROM lesson_plans WHERE id=?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: 'Lesson plan not found' });
    }
    // Log action
    const { logSecurityEvent } = await import('./utils/security.js');
    await logSecurityEvent(req.user.id, 'LESSON_PLAN_DELETE', req.ip, req.get('User-Agent'), { lesson_plan_id: id }, 'info');
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH: Teacher checks off completed parts (objectives, activities, resources)
router.patch('/:id/checkoff', requireRole(['teacher']), async (req, res) => {
  try {
    const { id } = req.params;
    const { objectives_done, activities_done, resources_done } = req.body;
    // Only allow check-off for assigned teacher
    const [plans] = await pool.query('SELECT * FROM lesson_plans WHERE id=? AND teacher_id=?', [id, req.user.id]);
    if (!plans.length) {
      return res.status(403).json({ success: false, error: 'Not authorized to check off this lesson plan' });
    }
    // Store check-off status in a new column or a JSON field (for now, add a checkoff_status JSON column)
    const checkoff = { objectives_done, activities_done, resources_done, date: new Date() };
    await pool.query('UPDATE lesson_plans SET checkoff_status=? WHERE id=?', [JSON.stringify(checkoff), id]);
    // Log action
    const { logSecurityEvent } = await import('./utils/security.js');
    await logSecurityEvent(req.user.id, 'LESSON_PLAN_CHECKOFF', req.ip, req.get('User-Agent'), { lesson_plan_id: id, checkoff }, 'info');
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
