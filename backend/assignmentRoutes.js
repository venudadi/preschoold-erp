import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import pool from './db.js';
import { requireRole } from './middleware/security.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = express.Router();

// Multer config for assignment attachments
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = path.join(process.cwd(), 'uploads', 'assignments');
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});
const upload = multer({ storage });

// Create assignment (teacher)
router.post('/', requireRole(['teacher']), upload.array('attachments'), async (req, res) => {
  try {
    const { classroom_id, title, description, due_date } = req.body;
    const teacher_id = req.user.id;
    const attachments = req.files ? req.files.map(f => f.path) : [];
    const id = uuidv4();
    await pool.query(
      `INSERT INTO assignments (id, teacher_id, classroom_id, title, description, due_date, attachments) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, teacher_id, classroom_id, title, description, due_date, JSON.stringify(attachments)]
    );
    res.status(201).json({ success: true, id });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get assignments (teacher/parent)
router.get('/', requireRole(['teacher', 'parent']), async (req, res) => {
  try {
    const { classroom_id } = req.query;
    let sql = 'SELECT * FROM assignments WHERE 1=1';
    const params = [];
    if (req.user.role === 'teacher') {
      sql += ' AND teacher_id = ?';
      params.push(req.user.id);
    }
    if (classroom_id) {
      sql += ' AND classroom_id = ?';
      params.push(classroom_id);
    }
    sql += ' ORDER BY due_date DESC';
    const [rows] = await pool.query(sql, params);
    res.json({ success: true, assignments: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Submit assignment (parent)
router.post('/:id/submit', requireRole(['parent']), upload.array('submission_files'), async (req, res) => {
  try {
    const { id: assignment_id } = req.params;
    const { child_id, submission_text } = req.body;
    const parent_id = req.user.id;
    const submission_files = req.files ? req.files.map(f => f.path) : [];
    const submissionId = uuidv4();
    await pool.query(
      `INSERT INTO assignment_submissions (id, assignment_id, child_id, parent_id, submission_text, submission_files) VALUES (?, ?, ?, ?, ?, ?)`,
      [submissionId, assignment_id, child_id, parent_id, submission_text, JSON.stringify(submission_files)]
    );
    res.status(201).json({ success: true, id: submissionId });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get submissions for an assignment (teacher)
router.get('/:id/submissions', requireRole(['teacher']), async (req, res) => {
  try {
    const { id: assignment_id } = req.params;
    const [rows] = await pool.query('SELECT * FROM assignment_submissions WHERE assignment_id = ?', [assignment_id]);
    res.json({ success: true, submissions: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Give feedback on a submission (teacher)
router.post('/submissions/:submissionId/feedback', requireRole(['teacher']), upload.array('feedback_files'), async (req, res) => {
  try {
    const { submissionId } = req.params;
    const { feedback } = req.body;
    const feedback_files = req.files ? req.files.map(f => f.path) : [];
    await pool.query(
      'UPDATE assignment_submissions SET feedback=?, feedback_files=?, feedback_at=NOW() WHERE id=?',
      [feedback, JSON.stringify(feedback_files), submissionId]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
