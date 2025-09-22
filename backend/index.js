
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import pool from './db.js';
const app = express();
const PORT = process.env.PORT || 5001;
import parentModuleRoutes from './parentModuleRoutes.js';
import observationLogRoutes from './observationLogRoutes.js';

// Add error handling for unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// --- IMPORT ROUTES (Each one should only be listed once) ---
import authRoutes from './authRoutes.js';
import adminRoutes from './adminRoutes.js';
import enquiryRoutes from './enquiryRoutes.js';
import settingsRoutes from './settingsRoutes.js';
import admissionRoutes from './admissionRoutes.js';
import invoiceRoutes from './invoiceRoutes.js';
import invoiceRequestRoutes from './invoiceRequestRoutes.js';
import centerRoutes from './centerRoutes.js';
import analyticsRoutes from './analyticsRoutes.js';
import attendanceRoutes from './attendanceRoutes.js';
import staffRoutes from './staffRoutes.js';
import documentRoutes from './documentRoutes.js';
import feeStructureRoutes from './feeStructureRoutes.js';
import studentRoutes from './studentRoutes.js';
import exitRoutes from './exitRoutes.js';
import ownerRoutes from './ownerRoutes.js';
import expenseRoutes from './expenseRoutes.js';
import lessonPlanRoutes from './lessonPlanRoutes.js';
import assignmentRoutes from './assignmentRoutes.js';
import messagingRoutes from './messagingRoutes.js';
import digitalPortfolioRoutes from './digitalPortfolioRoutes.js';
import classroomAnnouncementRoutes from './classroomAnnouncementRoutes.js';
import adminClassPromotionRoutes from './adminClassPromotionRoutes.js';

app.use('/api/messaging', messagingRoutes);

// --- MIDDLEWARE ---
app.use(cors());
app.use(express.json());

// --- ROUTES (Each one should only be listed once) ---
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/enquiries', enquiryRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/admissions', admissionRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/invoices/requests', invoiceRequestRoutes);
app.use('/api/centers', centerRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/fee-structures', feeStructureRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/exits', exitRoutes);
app.use('/api/owners', ownerRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/lesson-plans', lessonPlanRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/digital-portfolio', digitalPortfolioRoutes);
app.use('/api/classroom-announcements', classroomAnnouncementRoutes);
app.use('/api/admin-class/promotion', adminClassPromotionRoutes);
// --- SERVER LISTENER ---
app.listen(PORT, () => {
  console.log(`✅ Server is running on port ${PORT}`);
});