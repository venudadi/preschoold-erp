/**
 * Claude API Routes with Context Caching
 */

import express from 'express';
import claudeController from './controllers/claudeController.js';
import { protect, superAdminOnly } from './authMiddleware.js';

const router = express.Router();

// Query Claude with cached context (protected)
router.post('/query', protect, claudeController.query);

// Rebuild context manually (super admin only)
router.post('/rebuild-context', protect, superAdminOnly, claudeController.rebuildContext);

// Check and rebuild if needed (super admin only)
router.post('/check-and-rebuild', protect, superAdminOnly, claudeController.checkAndRebuild);

// Get cache performance stats (protected)
router.get('/stats', protect, claudeController.getStats);

// Get context usage (protected)
router.get('/context-usage', protect, claudeController.getContextUsage);

// Get active contexts metadata (protected)
router.get('/contexts', protect, claudeController.getActiveContexts);

export default router;
