// This script generates a PDF tutorial for the Financial Manager role using pdfkit.
// Run with: node generate_financial_manager_tutorial.js

import PDFDocument from 'pdfkit';
import fs from 'fs';

const doc = new PDFDocument({ margin: 40 });
doc.pipe(fs.createWriteStream('backend/docs/Financial_Manager_Tutorial.pdf'));

doc.fontSize(20).text('Preschool ERP Tutorial: Financial Manager Role', { align: 'center' });
doc.moveDown();

doc.fontSize(14).text('Role Overview', { underline: true });
doc.text('The Financial Manager is responsible for logging, managing, and analyzing all expenses for the preschool. This role can upload receipts, manage recurring expenses, and export expense data. Access is restricted to expense-related features.');
doc.moveDown();

doc.fontSize(14).text('Login & Navigation', { underline: true });
doc.text('1. Login using your Financial Manager credentials on the login page.\n2. Upon login, you are directed to the Financial Dashboard.\n3. Use the sidebar to access Expense Management, Analytics, and Notifications.');
doc.moveDown();

doc.fontSize(14).text('Expense Management', { underline: true });
doc.text('• Log a New Expense:\n  - Go to Expense Management > Log Expense.\n  - Fill in date, amount, description, category, subcategory, payment mode, vendor, GST, and upload a receipt if available.\n  - Click "Submit". The expense is auto-approved and logged.');
doc.text('• Upload Receipt:\n  - On the Log Expense form, use the upload button to attach a receipt image.\n  - Only image files are accepted.');
doc.text('• Manage Recurring Expenses:\n  - When logging an expense, set "Recurring" to Yes and specify the recurring type and next due date.\n  - To remove a recurring expense, use the "Remove Recurring" action in the expense list.');
doc.text('• Export Expenses:\n  - Use the "Export" button in Expense Management to download all expenses as an Excel file.');
doc.moveDown();

doc.fontSize(14).text('Analytics & Dashboard', { underline: true });
doc.text('• View expense analytics on the dashboard: totals, by category, by status, recurring, and cost of acquisition.\n• Use filters to analyze expenses for specific periods or categories.');
doc.moveDown();

doc.fontSize(14).text('Notifications', { underline: true });
doc.text('• View notifications for expense approvals, rejections, or system alerts in the Notifications panel.\n• Mark notifications as read to keep your dashboard organized.');
doc.moveDown();

doc.fontSize(14).text('Restrictions & Conditions', { underline: true });
doc.text('• Financial Managers can only access expense-related features.\n• Cannot approve or reject expenses raised by others (auto-approved on log).\n• Cannot access classroom, child, or invoice management.\n• All actions are logged for audit purposes.');
doc.moveDown();

doc.fontSize(14).text('Support', { underline: true });
doc.text('For technical issues or access problems, contact your system administrator.');

doc.end();
console.log('Financial Manager PDF tutorial generated at backend/docs/Financial_Manager_Tutorial.pdf');
