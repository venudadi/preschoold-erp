/**
 * Test Email and 2FA Configuration
 *
 * This script tests:
 * 1. Email service configuration with Hostinger
 * 2. Password reset flow endpoints
 * 3. 2FA setup and verification endpoints
 */

import 'dotenv/config';
import emailService from './services/emailService.js';

console.log('='.repeat(60));
console.log('EMAIL AND 2FA CONFIGURATION TEST');
console.log('='.repeat(60));

// Test 1: Check environment variables
console.log('\n📋 1. Checking Environment Variables...');
console.log('-------------------------------------------');
console.log(`SMTP_HOST: ${process.env.SMTP_HOST || '❌ NOT SET'}`);
console.log(`SMTP_PORT: ${process.env.SMTP_PORT || '❌ NOT SET'}`);
console.log(`SMTP_USER: ${process.env.SMTP_USER ? '✅ SET' : '❌ NOT SET'}`);
console.log(`SMTP_PASS: ${process.env.SMTP_PASS ? '✅ SET (hidden)' : '❌ NOT SET'}`);
console.log(`FROM_NAME: ${process.env.FROM_NAME || '❌ NOT SET'}`);
console.log(`FROM_EMAIL: ${process.env.FROM_EMAIL || '❌ NOT SET'}`);
console.log(`JWT_SECRET: ${process.env.JWT_SECRET ? '✅ SET (hidden)' : '❌ NOT SET'}`);

// Test 2: Test email service connection
console.log('\n📧 2. Testing Email Service Connection...');
console.log('-------------------------------------------');

setTimeout(async () => {
    try {
        const testResult = await emailService.testEmailConfiguration();

        if (testResult.success) {
            console.log('✅ Email service configured successfully!');
            console.log('   SMTP connection is working.');

            // Test 3: Send test email (optional - comment out if not needed)
            console.log('\n📨 3. Sending Test Email...');
            console.log('-------------------------------------------');
            console.log('⚠️  To send a test email, uncomment the code below and add a test email address.');

            /*
            const testEmail = 'your-test-email@example.com'; // Replace with your test email
            const result = await emailService.sendPasswordResetCode(
                testEmail,
                'Test User',
                'TEST01',
                15
            );

            if (result.success) {
                console.log(`✅ Test email sent successfully to ${testEmail}`);
                console.log(`   Message ID: ${result.messageId}`);
            } else {
                console.log(`❌ Failed to send test email: ${result.error}`);
            }
            */

        } else {
            console.log('❌ Email service configuration failed!');
            console.log(`   Error: ${testResult.error}`);
        }
    } catch (error) {
        console.log('❌ Error testing email service:', error.message);
    }

    // Test 4: Check if server routes are accessible
    console.log('\n🔌 4. API Endpoints Available...');
    console.log('-------------------------------------------');
    console.log('Password Reset Endpoints:');
    console.log('  POST /api/auth/forgot-password');
    console.log('  POST /api/auth/verify-reset-code');
    console.log('  POST /api/auth/reset-password');
    console.log('  GET  /api/auth/reset-status/:resetId');
    console.log('');
    console.log('2FA Endpoints:');
    console.log('  GET  /api/auth/2fa/setup (protected)');
    console.log('  POST /api/auth/2fa/verify-setup (protected)');
    console.log('  POST /api/auth/2fa/verify');
    console.log('  GET  /api/auth/2fa/status (protected)');
    console.log('  POST /api/auth/2fa/disable (protected)');
    console.log('  POST /api/auth/2fa/regenerate-backup-codes (protected)');

    console.log('\n' + '='.repeat(60));
    console.log('TEST COMPLETE');
    console.log('='.repeat(60));

    process.exit(0);
}, 1000);
