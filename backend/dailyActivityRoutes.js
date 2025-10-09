import express from 'express';
import pool from './db.js';
import { protect } from './authMiddleware.js';
import { requireRole } from './middleware/security.js';

const router = express.Router();

// Helper function to query database
const query = async (sql, params) => {
  const [rows] = await pool.execute(sql, params);
  return rows;
};

/**
 * Daily Activity Tracking Routes
 * Food, Sleep, and Potty tracking for children
 */

// Get all daily activities for a child on a specific date
router.get('/:childId', protect, async (req, res) => {
  try {
    const { childId } = req.params;
    const { date } = req.query; // Format: YYYY-MM-DD

    const activityDate = date || new Date().toISOString().split('T')[0];

    // Fetch food entries
    const foodQuery = `
      SELECT * FROM daily_food_tracking
      WHERE child_id = ? AND date = ?
      ORDER BY created_at DESC
    `;
    const foodEntries = await query(foodQuery, [childId, activityDate]);

    // Fetch sleep entries
    const sleepQuery = `
      SELECT * FROM daily_sleep_tracking
      WHERE child_id = ? AND date = ?
      ORDER BY start_time ASC
    `;
    const sleepEntries = await query(sleepQuery, [childId, activityDate]);

    // Fetch potty entries
    const pottyQuery = `
      SELECT * FROM daily_potty_tracking
      WHERE child_id = ? AND date = ?
      ORDER BY created_at DESC
    `;
    const pottyEntries = await query(pottyQuery, [childId, activityDate]);

    res.json({
      date: activityDate,
      food: foodEntries,
      sleep: sleepEntries,
      potty: pottyEntries
    });
  } catch (error) {
    console.error('Error fetching daily activities:', error);
    res.status(500).json({ error: { message: 'Failed to fetch daily activities', code: 'FETCH_ERROR' } });
  }
});

// === FOOD TRACKING ===

// Add food entry
router.post('/food', protect, requireRole(['teacher', 'admin', 'super_admin']), async (req, res) => {
  try {
    const { child_id, date, meal_type, food_consumed, notes } = req.body;
    const teacher_id = req.user.id;

    // Validation
    if (!child_id || !date || !meal_type || food_consumed === undefined) {
      return res.status(400).json({
        error: { message: 'Missing required fields: child_id, date, meal_type, food_consumed', code: 'VALIDATION_ERROR' }
      });
    }

    if (!['breakfast', 'lunch', 'snack'].includes(meal_type)) {
      return res.status(400).json({
        error: { message: 'Invalid meal_type. Must be breakfast, lunch, or snack', code: 'VALIDATION_ERROR' }
      });
    }

    if (food_consumed < 0 || food_consumed > 100) {
      return res.status(400).json({
        error: { message: 'food_consumed must be between 0 and 100', code: 'VALIDATION_ERROR' }
      });
    }

    const queryStr = `
      INSERT INTO daily_food_tracking (child_id, date, meal_type, food_consumed, notes, recorded_by)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    const result = await query(queryStr, [
      child_id,
      date,
      meal_type,
      food_consumed,
      notes || null,
      teacher_id
    ]);

    const newEntry = await query(
      'SELECT * FROM daily_food_tracking WHERE id = ?',
      [result[0].insertId]
    );

    res.status(201).json(newEntry[0]);
  } catch (error) {
    console.error('Error adding food entry:', error);
    res.status(500).json({ error: { message: 'Failed to add food entry', code: 'DATABASE_ERROR' } });
  }
});

// Delete food entry
router.delete('/food/:id', protect, requireRole(['teacher', 'admin', 'super_admin']), async (req, res) => {
  try {
    const { id } = req.params;

    await query('DELETE FROM daily_food_tracking WHERE id = ?', [id]);

    res.json({ success: true, message: 'Food entry deleted successfully' });
  } catch (error) {
    console.error('Error deleting food entry:', error);
    res.status(500).json({ error: { message: 'Failed to delete food entry', code: 'DATABASE_ERROR' } });
  }
});

// === SLEEP TRACKING ===

// Add sleep entry
router.post('/sleep', protect, requireRole(['teacher', 'admin', 'super_admin']), async (req, res) => {
  try {
    const { child_id, date, start_time, end_time, duration_hours, notes } = req.body;
    const teacher_id = req.user.id;

    // Validation
    if (!child_id || !date || !start_time || !end_time) {
      return res.status(400).json({
        error: { message: 'Missing required fields: child_id, date, start_time, end_time', code: 'VALIDATION_ERROR' }
      });
    }

    const queryStr = `
      INSERT INTO daily_sleep_tracking (child_id, date, start_time, end_time, duration_hours, notes, recorded_by)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    const result = await query(queryStr, [
      child_id,
      date,
      start_time,
      end_time,
      duration_hours || null,
      notes || null,
      teacher_id
    ]);

    const newEntry = await query(
      'SELECT * FROM daily_sleep_tracking WHERE id = ?',
      [result[0].insertId]
    );

    res.status(201).json(newEntry[0]);
  } catch (error) {
    console.error('Error adding sleep entry:', error);
    res.status(500).json({ error: { message: 'Failed to add sleep entry', code: 'DATABASE_ERROR' } });
  }
});

// Delete sleep entry
router.delete('/sleep/:id', protect, requireRole(['teacher', 'admin', 'super_admin']), async (req, res) => {
  try {
    const { id } = req.params;

    await query('DELETE FROM daily_sleep_tracking WHERE id = ?', [id]);

    res.json({ success: true, message: 'Sleep entry deleted successfully' });
  } catch (error) {
    console.error('Error deleting sleep entry:', error);
    res.status(500).json({ error: { message: 'Failed to delete sleep entry', code: 'DATABASE_ERROR' } });
  }
});

// === POTTY TRACKING ===

// Add potty entry
router.post('/potty', protect, requireRole(['teacher', 'admin', 'super_admin']), async (req, res) => {
  try {
    const { child_id, date, type, diaper_status, notes } = req.body;
    const teacher_id = req.user.id;

    // Validation
    if (!child_id || !date || !type) {
      return res.status(400).json({
        error: { message: 'Missing required fields: child_id, date, type', code: 'VALIDATION_ERROR' }
      });
    }

    if (!['bathroom', 'diaper_change'].includes(type)) {
      return res.status(400).json({
        error: { message: 'Invalid type. Must be bathroom or diaper_change', code: 'VALIDATION_ERROR' }
      });
    }

    const queryStr = `
      INSERT INTO daily_potty_tracking (child_id, date, type, diaper_status, notes, recorded_by)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    const result = await query(queryStr, [
      child_id,
      date,
      type,
      diaper_status || null,
      notes || null,
      teacher_id
    ]);

    const newEntry = await query(
      'SELECT * FROM daily_potty_tracking WHERE id = ?',
      [result[0].insertId]
    );

    res.status(201).json(newEntry[0]);
  } catch (error) {
    console.error('Error adding potty entry:', error);
    res.status(500).json({ error: { message: 'Failed to add potty entry', code: 'DATABASE_ERROR' } });
  }
});

// Delete potty entry
router.delete('/potty/:id', protect, requireRole(['teacher', 'admin', 'super_admin']), async (req, res) => {
  try {
    const { id } = req.params;

    await query('DELETE FROM daily_potty_tracking WHERE id = ?', [id]);

    res.json({ success: true, message: 'Potty entry deleted successfully' });
  } catch (error) {
    console.error('Error deleting potty entry:', error);
    res.status(500).json({ error: { message: 'Failed to delete potty entry', code: 'DATABASE_ERROR' } });
  }
});

// Get summary for a child (for parent dashboard overview)
router.get('/:childId/summary', protect, async (req, res) => {
  try {
    const { childId } = req.params;
    const { date } = req.query;

    const activityDate = date || new Date().toISOString().split('T')[0];

    // Count meals
    const mealCount = await query(
      'SELECT COUNT(*) as count FROM daily_food_tracking WHERE child_id = ? AND date = ?',
      [childId, activityDate]
    );

    // Total sleep hours
    const sleepTotal = await query(
      'SELECT SUM(duration_hours) as total FROM daily_sleep_tracking WHERE child_id = ? AND date = ?',
      [childId, activityDate]
    );

    // Potty counts
    const bathroomCount = await query(
      'SELECT COUNT(*) as count FROM daily_potty_tracking WHERE child_id = ? AND date = ? AND type = "bathroom"',
      [childId, activityDate]
    );

    const diaperCount = await query(
      'SELECT COUNT(*) as count FROM daily_potty_tracking WHERE child_id = ? AND date = ? AND type = "diaper_change"',
      [childId, activityDate]
    );

    res.json({
      date: activityDate,
      meals_count: mealCount[0].count,
      sleep_hours: parseFloat(sleepTotal[0].total || 0).toFixed(1),
      bathroom_count: bathroomCount[0].count,
      diaper_changes: diaperCount[0].count
    });
  } catch (error) {
    console.error('Error fetching activity summary:', error);
    res.status(500).json({ error: { message: 'Failed to fetch summary', code: 'DATABASE_ERROR' } });
  }
});

export default router;
