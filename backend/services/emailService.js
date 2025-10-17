/**
 * Email Service for Password Reset and General Notifications
 * Handles SMTP configuration and email template management
 */

import nodemailer from 'nodemailer';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class EmailService {
    constructor() {
        this.transporter = null;
        this.isConfigured = false;
        this.init();
    }

    async init() {
        try {
            const smtpPort = parseInt(process.env.SMTP_PORT) || 587;

            // Configure SMTP transporter
            this.transporter = nodemailer.createTransport({
                host: process.env.SMTP_HOST || 'smtp.gmail.com',
                port: smtpPort,
                secure: smtpPort === 465, // true for 465 (SSL), false for 587 (TLS)
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS
                },
                tls: {
                    rejectUnauthorized: false
                }
            });

            // Test connection
            if (process.env.SMTP_USER && process.env.SMTP_PASS) {
                await this.transporter.verify();
                this.isConfigured = true;
                console.log('✅ Email service configured successfully');
            } else {
                console.warn('⚠️ Email service not configured - missing SMTP credentials');
            }

        } catch (error) {
            console.error('❌ Email service configuration failed:', error.message);
            this.isConfigured = false;
        }
    }

    async sendPasswordResetCode(email, firstName, challengeCode, expirationMinutes = 15) {
        if (!this.isConfigured) {
            console.error('Email service not configured');
            return { success: false, error: 'Email service not available' };
        }

        try {
            const template = await this.loadEmailTemplate('passwordReset');
            const html = template
                .replace(/{{firstName}}/g, firstName || 'User')
                .replace(/{{challengeCode}}/g, challengeCode)
                .replace(/{{expirationMinutes}}/g, expirationMinutes)
                .replace(/{{currentYear}}/g, new Date().getFullYear());

            const mailOptions = {
                from: {
                    name: process.env.FROM_NAME || 'Preschool ERP System',
                    address: process.env.FROM_EMAIL || process.env.SMTP_USER
                },
                to: email,
                subject: 'Password Reset Request - Preschool ERP',
                html: html,
                text: this.htmlToText(html)
            };

            const result = await this.transporter.sendMail(mailOptions);
            console.log(`✅ Password reset email sent to ${email}, messageId: ${result.messageId}`);

            return {
                success: true,
                messageId: result.messageId,
                accepted: result.accepted,
                rejected: result.rejected
            };

        } catch (error) {
            console.error('❌ Failed to send password reset email:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async sendPasswordResetConfirmation(email, firstName) {
        if (!this.isConfigured) {
            console.error('Email service not configured');
            return { success: false, error: 'Email service not available' };
        }

        try {
            const template = await this.loadEmailTemplate('passwordResetConfirmation');
            const html = template
                .replace(/{{firstName}}/g, firstName || 'User')
                .replace(/{{currentYear}}/g, new Date().getFullYear())
                .replace(/{{resetTime}}/g, new Date().toLocaleString());

            const mailOptions = {
                from: {
                    name: process.env.FROM_NAME || 'Preschool ERP System',
                    address: process.env.FROM_EMAIL || process.env.SMTP_USER
                },
                to: email,
                subject: 'Password Reset Successful - Preschool ERP',
                html: html,
                text: this.htmlToText(html)
            };

            const result = await this.transporter.sendMail(mailOptions);
            console.log(`✅ Password reset confirmation sent to ${email}, messageId: ${result.messageId}`);

            return {
                success: true,
                messageId: result.messageId
            };

        } catch (error) {
            console.error('❌ Failed to send password reset confirmation:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async loadEmailTemplate(templateName) {
        try {
            const templatesDir = path.join(__dirname, '../templates/emails');
            const templatePath = path.join(templatesDir, `${templateName}.html`);

            // Check if template exists
            try {
                await fs.access(templatePath);
                return await fs.readFile(templatePath, 'utf8');
            } catch (error) {
                // Template doesn't exist, return default template
                console.warn(`⚠️ Email template ${templateName}.html not found, using default`);
                return this.getDefaultTemplate(templateName);
            }

        } catch (error) {
            console.error('❌ Failed to load email template:', error);
            return this.getDefaultTemplate(templateName);
        }
    }

    getDefaultTemplate(templateName) {
        const templates = {
            passwordReset: `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Password Reset Request</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #4CAF50; color: white; padding: 20px; text-align: center; }
        .content { padding: 30px; background: #f9f9f9; }
        .code-box { background: #e8f5e8; border: 2px dashed #4CAF50; padding: 20px; text-align: center; margin: 20px 0; }
        .challenge-code { font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #2E7D32; }
        .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
        .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; margin: 20px 0; border-radius: 4px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔐 Password Reset Request</h1>
        </div>

        <div class="content">
            <p>Dear {{firstName}},</p>

            <p>We received a request to reset your password for the Preschool ERP system.</p>

            <div class="code-box">
                <p><strong>Your verification code is:</strong></p>
                <div class="challenge-code">{{challengeCode}}</div>
            </div>

            <p><strong>⏰ This code will expire in {{expirationMinutes}} minutes</strong> for security reasons.</p>

            <div class="warning">
                <strong>⚠️ Security Notice:</strong> If you did not request this password reset, please contact your center administrator immediately at <strong>admin@preschool-erp.com</strong>
            </div>

            <p>Thank you for using the Preschool ERP system.</p>

            <p>Best regards,<br>
            <strong>Preschool ERP Team</strong></p>
        </div>

        <div class="footer">
            <p>&copy; {{currentYear}} Preschool ERP System. All rights reserved.</p>
            <p>This is an automated message, please do not reply to this email.</p>
        </div>
    </div>
</body>
</html>`,

            passwordResetConfirmation: `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Password Reset Successful</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #4CAF50; color: white; padding: 20px; text-align: center; }
        .content { padding: 30px; background: #f9f9f9; }
        .success-box { background: #d4edda; border: 1px solid #c3e6cb; padding: 15px; margin: 20px 0; border-radius: 4px; }
        .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>✅ Password Reset Successful</h1>
        </div>

        <div class="content">
            <p>Dear {{firstName}},</p>

            <div class="success-box">
                <strong>✅ Your password has been successfully reset!</strong>
            </div>

            <p>Your password for the Preschool ERP system was successfully changed on <strong>{{resetTime}}</strong>.</p>

            <p>You can now log in to your account using your new password.</p>

            <p>If you did not make this change, please contact your center administrator immediately.</p>

            <p>Best regards,<br>
            <strong>Preschool ERP Team</strong></p>
        </div>

        <div class="footer">
            <p>&copy; {{currentYear}} Preschool ERP System. All rights reserved.</p>
            <p>This is an automated message, please do not reply to this email.</p>
        </div>
    </div>
</body>
</html>`
        };

        return templates[templateName] || '<p>Email template not available</p>';
    }

    htmlToText(html) {
        // Simple HTML to text conversion for fallback
        return html
            .replace(/<[^>]*>/g, '')
            .replace(/\s+/g, ' ')
            .trim();
    }

    // Test method for development
    async testEmailConfiguration() {
        if (!this.isConfigured) {
            return { success: false, error: 'Email service not configured' };
        }

        try {
            const testResult = await this.transporter.verify();
            return { success: true, message: 'Email configuration is valid' };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
}

// Export singleton instance
const emailService = new EmailService();
export default emailService;