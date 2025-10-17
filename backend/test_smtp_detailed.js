/**
 * Detailed SMTP Connection Test for Hostinger
 * Tests various SMTP configurations to identify the issue
 */

import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

console.log('='.repeat(70));
console.log('DETAILED SMTP CONNECTION TEST');
console.log('='.repeat(70));

console.log('\n📋 Current Configuration:');
console.log('-------------------------------------------');
console.log('SMTP_HOST:', process.env.SMTP_HOST);
console.log('SMTP_PORT:', process.env.SMTP_PORT);
console.log('SMTP_USER:', process.env.SMTP_USER);
console.log('SMTP_PASS:', process.env.SMTP_PASS ? '***' + process.env.SMTP_PASS.slice(-4) : 'NOT SET');

const configurations = [
    {
        name: 'Config 1: Port 465 with SSL (current)',
        config: {
            host: 'smtp.hostinger.com',
            port: 465,
            secure: true,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            },
            tls: {
                rejectUnauthorized: false
            }
        }
    },
    {
        name: 'Config 2: Port 587 with STARTTLS',
        config: {
            host: 'smtp.hostinger.com',
            port: 587,
            secure: false,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            },
            tls: {
                rejectUnauthorized: false
            }
        }
    },
    {
        name: 'Config 3: Port 465 with SSL and cipher suite',
        config: {
            host: 'smtp.hostinger.com',
            port: 465,
            secure: true,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            },
            tls: {
                rejectUnauthorized: false,
                ciphers: 'SSLv3'
            }
        }
    },
    {
        name: 'Config 4: Port 587 with explicit TLS',
        config: {
            host: 'smtp.hostinger.com',
            port: 587,
            secure: false,
            requireTLS: true,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            },
            tls: {
                rejectUnauthorized: false
            }
        }
    }
];

async function testConfiguration(name, config) {
    console.log(`\n🔍 Testing: ${name}`);
    console.log('-------------------------------------------');

    try {
        const transporter = nodemailer.createTransport(config);

        // Test connection
        await transporter.verify();

        console.log('✅ SUCCESS! Connection verified.');
        console.log('   This configuration works!');

        // Try sending a test email
        console.log('\n📧 Attempting to send test email...');

        const info = await transporter.sendMail({
            from: `"${process.env.FROM_NAME}" <${process.env.FROM_EMAIL}>`,
            to: process.env.SMTP_USER, // Send to self as test
            subject: 'Test Email - Preschool ERP System',
            text: 'This is a test email to verify SMTP configuration.',
            html: '<p>This is a test email to verify SMTP configuration.</p><p><strong>If you receive this, email sending is working!</strong></p>'
        });

        console.log('✅ Test email sent successfully!');
        console.log('   Message ID:', info.messageId);
        console.log('   Accepted:', info.accepted);

        return true;

    } catch (error) {
        console.log('❌ FAILED');
        console.log('   Error:', error.message);
        if (error.code) {
            console.log('   Error Code:', error.code);
        }
        if (error.response) {
            console.log('   Server Response:', error.response);
        }
        return false;
    }
}

async function runTests() {
    let successCount = 0;

    for (const { name, config } of configurations) {
        const success = await testConfiguration(name, config);
        if (success) {
            successCount++;
            console.log('\n✅ WORKING CONFIGURATION FOUND!');
            console.log('Use this configuration in your emailService.js');
            break; // Stop after first successful config
        }
    }

    if (successCount === 0) {
        console.log('\n' + '='.repeat(70));
        console.log('❌ ALL CONFIGURATIONS FAILED');
        console.log('='.repeat(70));
        console.log('\n📝 Troubleshooting Steps:');
        console.log('1. Verify the email password is correct');
        console.log('2. Check if SMTP is enabled in Hostinger control panel');
        console.log('3. Try regenerating the email password in Hostinger');
        console.log('4. Verify the email account is active and not suspended');
        console.log('5. Check for any IP restrictions or security settings');
        console.log('6. Contact Hostinger support to verify SMTP access');
        console.log('\n💡 Alternative: Consider using a dedicated email service:');
        console.log('   - Gmail (with app-specific password)');
        console.log('   - SendGrid (free tier available)');
        console.log('   - AWS SES (pay-as-you-go)');
    }

    console.log('\n' + '='.repeat(70));
    console.log('TEST COMPLETE');
    console.log('='.repeat(70));

    process.exit(successCount > 0 ? 0 : 1);
}

// Add timeout to prevent hanging
setTimeout(() => {
    console.log('\n⏱️  Test timeout - Taking too long. Exiting...');
    process.exit(1);
}, 60000); // 60 second timeout

runTests().catch(error => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
});
