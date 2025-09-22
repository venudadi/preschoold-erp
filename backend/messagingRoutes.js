import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import pool from './db.js';
import { requireRole } from './middleware/security.js';

const router = express.Router();

// Create or get a message thread (parent or teacher)
router.post('/threads', requireRole(['parent', 'teacher']), async (req, res) => {
  try {
    const { child_id, parent_id, teacher_id } = req.body;
    // Check if thread exists
    const [threads] = await pool.query(
      'SELECT * FROM message_threads WHERE child_id=? AND parent_id=? AND teacher_id=?',
      [child_id, parent_id, teacher_id]
    );
    if (threads.length) {
      return res.json({ success: true, thread: threads[0] });
    }
    const id = uuidv4();
    await pool.query(
      'INSERT INTO message_threads (id, child_id, parent_id, teacher_id) VALUES (?, ?, ?, ?)',
      [id, child_id, parent_id, teacher_id]
    );
    res.status(201).json({ success: true, thread: { id, child_id, parent_id, teacher_id } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get all threads for user (parent or teacher)
router.get('/threads', requireRole(['parent', 'teacher']), async (req, res) => {
  try {
    let sql = 'SELECT * FROM message_threads WHERE ';
    let params = [];
    if (req.user.role === 'parent') {
      sql += 'parent_id=?';
      params.push(req.user.id);
    } else if (req.user.role === 'teacher') {
      sql += 'teacher_id=?';
      params.push(req.user.id);
    }
    const [threads] = await pool.query(sql, params);
    res.json({ success: true, threads });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get messages in a thread
router.get('/threads/:threadId/messages', requireRole(['parent', 'teacher']), async (req, res) => {
  try {
    const { threadId } = req.params;
    const [messages] = await pool.query('SELECT * FROM messages WHERE thread_id=? ORDER BY sent_at ASC', [threadId]);
    res.json({ success: true, messages });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Send a message in a thread
router.post('/threads/:threadId/messages', requireRole(['parent', 'teacher']), async (req, res) => {
  try {
    const { threadId } = req.params;
    const { recipient_id, content } = req.body;
    const sender_id = req.user.id;
    const id = uuidv4();
    await pool.query(
      'INSERT INTO messages (id, thread_id, sender_id, recipient_id, content) VALUES (?, ?, ?, ?, ?)',
      [id, threadId, sender_id, recipient_id, content]
    );
    await pool.query('UPDATE message_threads SET last_message_at=NOW() WHERE id=?', [threadId]);
    res.status(201).json({ success: true, id });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Mark messages as read
router.post('/messages/:id/read', requireRole(['parent', 'teacher']), async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('UPDATE messages SET is_read=TRUE WHERE id=?', [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
