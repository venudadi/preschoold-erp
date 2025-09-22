// This script generates a PDF tutorial for the Owner role using pdfkit.
// Run with: node generate_owner_tutorial.js

import PDFDocument from 'pdfkit';
import fs from 'fs';

const doc = new PDFDocument({ margin: 40 });
doc.pipe(fs.createWriteStream('backend/docs/Owner_Tutorial.pdf'));

doc.fontSize(20).text('Preschool ERP Tutorial: Owner Role', { align: 'center' });
doc.moveDown();

doc.fontSize(14).text('Role Overview', { underline: true });
doc.text('The Owner oversees all operations for their assigned center(s), including analytics, expense approvals, classroom and staff management, and billing. Owners have broad access but are limited to their own centers.');
doc.moveDown();

doc.fontSize(14).text('Login & Navigation', { underline: true });
doc.text('1. Login using your Owner credentials on the login page.\n2. After login, you are directed to the Owner Dashboard.\n3. Use the sidebar to access Center Management, Analytics, Expenses, Invoices, and Notifications.');
doc.moveDown();

doc.fontSize(14).text('Center Management', { underline: true });
doc.text('• View and manage details for your assigned center(s).\n• Add or update center information, view staff and classroom assignments.');
doc.moveDown();

doc.fontSize(14).text('Expense Management', { underline: true });
doc.text('• View all expenses for your center(s).\n• Approve or reject expense requests raised by Admins.\n• Analyze expense trends and export data.\n• Cannot log new expenses directly (Financial Manager only).');
doc.moveDown();

doc.fontSize(14).text('Classroom & Staff Management', { underline: true });
doc.text('• View classroom lists, assign staff, and monitor classroom occupancy.\n• Cannot create or delete classrooms (Admin only).');
doc.moveDown();

doc.fontSize(14).text('Invoice Management', { underline: true });
doc.text('• View, generate, and download invoices for your center(s).\n• Track payment status and send reminders.');
doc.moveDown();

doc.fontSize(14).text('Analytics & Dashboard', { underline: true });
doc.text('• Access analytics for admissions, billing, expenses, and staff.\n• Use filters to analyze data for specific periods or categories.');
doc.moveDown();

doc.fontSize(14).text('Notifications', { underline: true });
doc.text('• Receive notifications for expense approvals, system alerts, and important updates.\n• Mark notifications as read.');
doc.moveDown();

doc.fontSize(14).text('Restrictions & Conditions', { underline: true });
doc.text('• Owners can only access and manage their assigned center(s).\n• Cannot log new expenses or create/delete classrooms.\n• Cannot access system-wide settings (Super Admin only).\n• All actions are logged for audit purposes.');
doc.moveDown();

doc.fontSize(14).text('Support', { underline: true });
doc.text('For technical issues or access problems, contact your system administrator.');

doc.end();
console.log('Owner PDF tutorial generated at backend/docs/Owner_Tutorial.pdf');
