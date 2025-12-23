
import express from 'express';
import { protect } from '../authMiddleware.js';
import { requireRole } from '../middleware/security.js';
import pool from '../db.js';
import { updateSystemSetting, getSystemSettings } from '../utils/settingsService.js';
import emailService from '../services/emailService.js';

const router = express.Router();

/**
 * GET /api/settings/system/email
 * Fetch current email settings (Super Admin/Owner only)
 */
router.get('/email', protect, requireRole(['super_admin', 'owner']), async (req, res) => {
    try {
        const [rows] = await pool.query(
            'SELECT setting_key, setting_value, is_encrypted, description, updated_at FROM system_settings WHERE setting_key LIKE "smtp_%" OR setting_key LIKE "from_%"'
        );
        
        // Don't send encrypted passwords back to frontend, just a placeholder
        const sanitizedRows = rows.map(row => ({
            ...row,
            setting_value: row.is_encrypted ? '********' : row.setting_value
        }));

        res.json({ settings: sanitizedRows });
    } catch (error) {
        console.error('Fetch email settings error:', error);
        res.status(500).json({ message: 'Error fetching email settings' });
    }
});

/**
 * PUT /api/settings/system/email
 * Update email settings
 */
router.put('/email', protect, requireRole(['super_admin', 'owner']), async (req, res) => {
    try {
        const { settings } = req.body; // Array of { key, value }

        if (!Array.isArray(settings)) {
            return res.status(400).json({ message: 'Settings must be an array' });
        }

        for (const item of settings) {
            const isEncrypted = item.key === 'smtp_pass';
            // If user didn't change the password (sent back placeholders), don't update it
            if (isEncrypted && item.value === '********') continue;
            
            await updateSystemSetting(item.key, item.value, isEncrypted, req.user.id);
        }

        // Re-initialize email service with new settings
        await emailService.init();

        res.json({ message: 'Email settings updated successfully' });
    } catch (error) {
        console.error('Update email settings error:', error);
        res.status(500).json({ message: 'Error updating email settings' });
    }
});

/**
 * POST /api/settings/system/email/test
 * Test email settings by sending a test email
 */
router.post('/email/test', protect, requireRole(['super_admin', 'owner']), async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ message: 'Recipient email is required' });

        const result = await emailService.sendPasswordResetCode(
            email, 
            'Admin Test', 
            'TEST99', 
            5
        );

        if (result.success) {
            res.json({ message: 'Test email sent successfully!' });
        } else {
            res.status(500).json({ message: 'Failed to send test email', error: result.error });
        }
    } catch (error) {
        console.error('Test email error:', error);
        res.status(500).json({ message: 'Error testing email settings' });
    }
});

export default router;
