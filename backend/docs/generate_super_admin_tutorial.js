// This script generates a PDF tutorial for the Super Admin role using pdfkit.
// Run with: node generate_super_admin_tutorial.js

import PDFDocument from 'pdfkit';
import fs from 'fs';

const doc = new PDFDocument({ margin: 40 });
doc.pipe(fs.createWriteStream('backend/docs/Super_Admin_Tutorial.pdf'));

doc.fontSize(20).text('Preschool ERP Tutorial: Super Admin Role', { align: 'center' });
doc.moveDown();

doc.fontSize(14).text('Role Overview', { underline: true });
doc.text('The Super Admin has full system-wide access, including all centers, users, analytics, and settings. This role is responsible for managing the entire ERP system, onboarding new centers, and overseeing all operations.');
doc.moveDown();

doc.fontSize(14).text('Login & Navigation', { underline: true });
doc.text('1. Login using your Super Admin credentials on the login page.\n2. After login, you are directed to the Super Admin Dashboard.\n3. Use the sidebar to access System Management, Center Management, User Management, Analytics, Expenses, Invoices, and Settings.');
doc.moveDown();

doc.fontSize(14).text('System Management', { underline: true });
doc.text('• Add, update, or remove centers.\n• Manage system-wide settings and configurations.\n• Onboard new users and assign roles.');
doc.moveDown();

doc.fontSize(14).text('Center & User Management', { underline: true });
doc.text('• View and manage all centers and users.\n• Assign users to centers and roles.\n• Reset user passwords and manage access.');
doc.moveDown();

doc.fontSize(14).text('Expense & Invoice Management', { underline: true });
doc.text('• View, approve, or reject any expense across all centers.\n• Generate, view, and download invoices for any center.');
doc.moveDown();

doc.fontSize(14).text('Analytics & Dashboard', { underline: true });
doc.text('• Access system-wide analytics for admissions, billing, expenses, and staff.\n• Use advanced filters to analyze data across all centers.');
doc.moveDown();

doc.fontSize(14).text('Settings', { underline: true });
doc.text('• Configure system-wide settings, permissions, and integrations.\n• Manage security policies and audit logs.');
doc.moveDown();

doc.fontSize(14).text('Notifications', { underline: true });
doc.text('• Receive notifications for critical system events, approvals, and alerts.\n• Mark notifications as read.');
doc.moveDown();

doc.fontSize(14).text('Restrictions & Conditions', { underline: true });
doc.text('• Super Admins have unrestricted access to all features and data.\n• All actions are logged for audit and compliance.\n• Responsible for maintaining system integrity and security.');
doc.moveDown();

doc.fontSize(14).text('Support', { underline: true });
doc.text('For technical issues or access problems, contact the system vendor or lead administrator.');

doc.end();
console.log('Super Admin PDF tutorial generated at backend/docs/Super_Admin_Tutorial.pdf');
