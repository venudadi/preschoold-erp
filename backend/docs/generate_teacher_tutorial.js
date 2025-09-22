// This script generates a PDF tutorial for the Teacher role using pdfkit.
// Run with: node generate_teacher_tutorial.js

import PDFDocument from 'pdfkit';
import fs from 'fs';

const doc = new PDFDocument({ margin: 40 });
doc.pipe(fs.createWriteStream('backend/docs/Teacher_Tutorial.pdf'));

doc.fontSize(20).text('Preschool ERP Tutorial: Teacher Role', { align: 'center' });
doc.moveDown();

doc.fontSize(14).text('Role Overview', { underline: true });
doc.text('The Teacher manages classroom activities, views student lists, and tracks attendance. Teachers have access to their assigned classrooms and related features.');
doc.moveDown();

doc.end();
doc.fontSize(14).text('Login & Navigation', { underline: true });
doc.text('1. Open the app and enter your Teacher username and password.\n2. After login, you will see your Teacher Dashboard.\n3. Use the menu on the left to access all your features.\n\nTip: If you ever get lost, click the Dashboard link to return to your home page.');
doc.moveDown();

doc.fontSize(14).text('Classroom Management', { underline: true });
doc.text('• Tap on Classroom Management to see your assigned classrooms.\n• You can view classroom details and update notes or activities.\n• You cannot create or delete classrooms.\n\nTip: Tap a classroom to see its students and activities.');
doc.moveDown();

doc.fontSize(14).text('Student List', { underline: true });
doc.text('• Tap Student List to see all children in your classroom.\n• Tap a student to view their profile and contact details.');
doc.moveDown();

doc.fontSize(14).text('Attendance Tracking', { underline: true });
doc.text('• Go to Attendance to mark which students are present or absent each day.\n• You can view past attendance records and reports.');
doc.moveDown();

doc.fontSize(14).text('Lesson Plans & Assignments', { underline: true });
doc.text('• View your assigned lesson plans and mark completed parts.\n• Assign homework or activities to students.\n• Review parent submissions and give feedback.');
doc.moveDown();

doc.fontSize(14).text('Digital Portfolio (NEW)', { underline: true });
doc.text('• Tap Digital Portfolio to upload photos, artwork, or achievements for each child.\n• Use the Upload tab to select and send multiple photos at once.\n• Parents can view the gallery from their mobile app.\n\nTip: Add a short description to each upload for context.');
doc.moveDown();

doc.fontSize(14).text('Classroom Announcements (NEW)', { underline: true });
doc.text('• Post important messages or updates for your classroom.\n• Parents will receive push notifications for new announcements.\n• You can view all past announcements in the Announcements section.');
doc.moveDown();

doc.fontSize(14).text('Messaging & Communication', { underline: true });
doc.text('• Use Messaging to chat securely with parents.\n• All messages are private and only visible to you and the parent.');
doc.moveDown();

doc.fontSize(14).text('Notifications', { underline: true });
doc.text('• You will receive notifications for new messages, announcements, and system alerts.\n• Tap the bell icon to view unread notifications.');
doc.moveDown();

doc.fontSize(14).text('Tips for Teachers', { underline: true });
doc.text('• The app is designed for use on tablets. All buttons are large and easy to tap.\n• If you are unsure about a feature, look for tooltips or help icons.\n• You cannot access admin or financial features.\n• All your actions are logged for safety.');
doc.moveDown();

doc.fontSize(14).text('Support', { underline: true });
doc.text('If you need help, contact your system administrator or refer to the Help section in the app.');


console.log('Teacher PDF tutorial (updated) generated at backend/docs/Teacher_Tutorial.pdf');
