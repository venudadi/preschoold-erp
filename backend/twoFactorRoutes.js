/**
 * Two-Factor Authentication Routes
 */

import express from 'express';
import twoFactorController from './controllers/twoFactorController.js';
import { protect } from './authMiddleware.js';

const router = express.Router();

// Setup 2FA (generate QR code and secret)
router.get('/2fa/setup', protect, twoFactorController.setupTwoFactor);

// Verify and enable 2FA
router.post('/2fa/verify-setup', protect, twoFactorController.verifyAndEnableTwoFactor);

// Verify 2FA token during login (no auth required)
router.post('/2fa/verify', twoFactorController.verifyTwoFactorLogin);

// Get 2FA status
router.get('/2fa/status', protect, twoFactorController.getTwoFactorStatus);

// Disable 2FA
router.post('/2fa/disable', protect, twoFactorController.disableTwoFactor);

// Regenerate backup codes
router.post('/2fa/regenerate-backup-codes', protect, twoFactorController.regenerateBackupCodes);

export default router;
