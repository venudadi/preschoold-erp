/**
 * Password Reset Routes
 * Handles all forgot password related API endpoints
 */

import express from 'express';
import { body } from 'express-validator';
import passwordResetController, {
    passwordResetRateLimit,
    challengeCodeRateLimit
} from './controllers/passwordResetController.js';
import { sanitizeInput } from './middleware/security.js';

const router = express.Router();

// Apply sanitization to all routes
router.use(sanitizeInput);

// Validation rules
const emailValidation = body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address')
    .isLength({ max: 255 })
    .withMessage('Email address too long');

const challengeCodeValidation = body('challengeCode')
    .isString()
    .trim()
    .isLength({ min: 6, max: 6 })
    .withMessage('Challenge code must be 6 characters')
    .matches(/^[A-Z0-9]{6}$/)
    .withMessage('Challenge code must contain only letters and numbers');

const passwordValidation = body('newPassword')
    .isLength({ min: 8, max: 128 })
    .withMessage('Password must be 8-128 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number');

const resetIdValidation = body('resetId')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Reset ID is required');

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Request password reset - sends challenge code to email
 * @access  Public
 * @body    { email: string }
 */
router.post('/forgot-password',
    passwordResetRateLimit,
    [emailValidation],
    passwordResetController.requestPasswordReset
);

/**
 * @route   POST /api/auth/verify-reset-code
 * @desc    Verify challenge code from email
 * @access  Public
 * @body    { email: string, challengeCode: string, resetId: string }
 */
router.post('/verify-reset-code',
    challengeCodeRateLimit,
    [
        emailValidation,
        challengeCodeValidation,
        resetIdValidation
    ],
    passwordResetController.verifyResetCode
);

/**
 * @route   POST /api/auth/reset-password
 * @desc    Reset password with verified token
 * @access  Public
 * @body    { email: string, newPassword: string, resetToken: string, resetId: string }
 */
router.post('/reset-password',
    [
        emailValidation,
        passwordValidation,
        body('resetToken')
            .isString()
            .isLength({ min: 64, max: 64 })
            .withMessage('Invalid reset token'),
        resetIdValidation
    ],
    passwordResetController.resetPassword
);

/**
 * @route   GET /api/auth/reset-status/:resetId
 * @desc    Get reset session status (for debugging/admin)
 * @access  Public (limited info returned)
 * @params  resetId: string
 */
router.get('/reset-status/:resetId',
    passwordResetController.getResetStatus
);

/**
 * @route   POST /api/auth/test-email
 * @desc    Test email configuration (development only)
 * @access  Public (should be disabled in production)
 */
if (process.env.NODE_ENV === 'development') {
    router.post('/test-email', async (req, res) => {
        try {
            const emailService = (await import('./services/emailService.js')).default;
            const { email } = req.body;

            if (!email) {
                return res.status(400).json({
                    error: 'Email address required for test'
                });
            }

            const result = await emailService.sendPasswordResetCode(
                email,
                'Test User',
                'TEST01',
                15
            );

            res.json({
                success: result.success,
                message: result.success ? 'Test email sent successfully' : 'Failed to send test email',
                details: result
            });

        } catch (error) {
            res.status(500).json({
                error: 'Test email failed',
                details: error.message
            });
        }
    });
}

// Error handling middleware for this router
router.use((error, req, res, next) => {
    console.error('❌ Password reset route error:', error);

    // Don't expose internal error details in production
    const message = process.env.NODE_ENV === 'production'
        ? 'An error occurred processing your request'
        : error.message;

    res.status(500).json({
        error: message,
        code: 'INTERNAL_ERROR'
    });
});

export default router;