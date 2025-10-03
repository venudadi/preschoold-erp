import express from 'express';
import { tableExists, initializeAllTables } from './utils/dbTableValidator.js';

const router = express.Router();

// Health check for important tables used by financial manager dashboard
router.get('/tables', async (req, res) => {
  try {
    const tables = [
      'centers',
      'budget_approvals',
      'financial_oversight',
      'budget_approval_limits',
      'users',
      'budget_categories'
    ];

    const status = {};
    for (const t of tables) {
      status[t] = await tableExists(t);
    }

    res.json({ success: true, tables: status });
  } catch (err) {
    console.error('Error checking tables:', err);
    res.status(500).json({ success: false, message: 'Failed to check tables' });
  }
});

// Trigger full initialization (admin use only in dev)
router.post('/initialize-tables', async (req, res) => {
  try {
    const results = await initializeAllTables();
    res.json({ success: true, results });
  } catch (err) {
    console.error('Error initializing tables:', err);
    res.status(500).json({ success: false, message: 'Failed to initialize tables' });
  }
});

export default router;
