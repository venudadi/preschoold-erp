// This script generates a PDF tutorial for the Admin role using pdfkit.
// Run with: node generate_admin_tutorial.js

import PDFDocument from 'pdfkit';
import fs from 'fs';

const doc = new PDFDocument({ margin: 40 });
doc.pipe(fs.createWriteStream('backend/docs/Admin_Tutorial.pdf'));

doc.fontSize(20).text('Preschool ERP Tutorial: Admin Role', { align: 'center' });
doc.moveDown();

doc.fontSize(14).text('Role Overview', { underline: true });
doc.text('The Admin manages classroom and child records, raises expense requests, and monitors center operations. Admins have access to classroom, child, and expense management for their assigned center.');
doc.moveDown();

doc.fontSize(14).text('Login & Navigation', { underline: true });
doc.text('1. Login using your Admin credentials on the login page.\n2. After login, you are directed to the Admin Dashboard.\n3. Use the sidebar to access Classroom Management, Child Management, Expense Requests, and Notifications.');
doc.moveDown();

doc.fontSize(14).text('Classroom Management', { underline: true });
doc.text('• View, create, and update classrooms for your center.\n• Assign teachers to classrooms.\n• Cannot delete classrooms (Owner only).');
doc.moveDown();

doc.fontSize(14).text('Child Management', { underline: true });
doc.text('• Add new children, update records, and manage classroom assignments.\n• View child lists and details.');
doc.moveDown();

doc.fontSize(14).text('Expense Requests', { underline: true });
doc.text('• Raise new expense requests for approval by the Owner.\n• Attach receipts and provide all required details.\n• Track status of submitted requests.\n• Cannot approve or reject expenses.');
doc.moveDown();

doc.fontSize(14).text('Analytics & Dashboard', { underline: true });
doc.text('• View analytics for classroom occupancy, admissions, and expenses.\n• Use filters to analyze data for specific periods or categories.');
doc.moveDown();

doc.fontSize(14).text('Notifications', { underline: true });
doc.text('• Receive notifications for expense approvals, classroom changes, and system alerts.\n• Mark notifications as read.');
doc.moveDown();

doc.fontSize(14).text('Restrictions & Conditions', { underline: true });
doc.text('• Admins can only manage their assigned center.\n• Cannot approve/reject expenses or delete classrooms.\n• Cannot access system-wide settings or analytics.\n• All actions are logged for audit purposes.');
doc.moveDown();

doc.fontSize(14).text('Support', { underline: true });
doc.text('For technical issues or access problems, contact your system administrator.');

doc.end();
console.log('Admin PDF tutorial generated at backend/docs/Admin_Tutorial.pdf');
