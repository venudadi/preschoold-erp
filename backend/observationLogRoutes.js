import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import pool from './db.js';
import { requireRole } from './middleware/security.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = express.Router();

// Multer config for observation log attachments
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = path.join(process.cwd(), 'uploads', 'observation_logs');
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});
const upload = multer({ storage });

// Create observation log (teacher)
router.post('/', requireRole(['teacher']), upload.array('attachments'), async (req, res) => {
  try {
    const { child_id, date, milestone, notes } = req.body;
    const teacher_id = req.user.id;
    const attachments = req.files ? req.files.map(f => f.path) : [];
    const id = uuidv4();
    await pool.query(
      `INSERT INTO observation_logs (id, child_id, teacher_id, date, milestone, notes, attachments) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, child_id, teacher_id, date, milestone, notes, JSON.stringify(attachments)]
    );
    res.status(201).json({ success: true, id });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get observation logs (by child, teacher, or date)
router.get('/', requireRole(['teacher', 'parent']), async (req, res) => {
  try {
    const { child_id, date } = req.query;
    let sql = 'SELECT * FROM observation_logs WHERE 1=1';
    const params = [];
    if (req.user.role === 'teacher') {
      sql += ' AND teacher_id = ?';
      params.push(req.user.id);
    } else if (req.user.role === 'parent' && child_id) {
      sql += ' AND child_id = ?';
      params.push(child_id);
    }
    if (date) {
      sql += ' AND date = ?';
      params.push(date);
    }
    sql += ' ORDER BY date DESC';
    const [rows] = await pool.query(sql, params);
    res.json({ success: true, logs: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Update observation log (teacher)
router.put('/:id', requireRole(['teacher']), upload.array('attachments'), async (req, res) => {
  try {
    const { id } = req.params;
    const { milestone, notes, date } = req.body;
    const attachments = req.files ? req.files.map(f => f.path) : undefined;
    let sql = 'UPDATE observation_logs SET milestone=?, notes=?, date=?';
    const params = [milestone, notes, date];
    if (attachments) {
      sql += ', attachments=?';
      params.push(JSON.stringify(attachments));
    }
    sql += ' WHERE id=? AND teacher_id=?';
    params.push(id, req.user.id);
    const [result] = await pool.query(sql, params);
    if (result.affectedRows === 0) {
      return res.status(403).json({ success: false, error: 'Not authorized to update this log' });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Delete observation log (teacher)
router.delete('/:id', requireRole(['teacher']), async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await pool.query('DELETE FROM observation_logs WHERE id=? AND teacher_id=?', [id, req.user.id]);
    if (result.affectedRows === 0) {
      return res.status(403).json({ success: false, error: 'Not authorized to delete this log' });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
