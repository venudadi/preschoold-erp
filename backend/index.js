import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import pool from './db.js';

// --- IMPORT ROUTES (Each one should only be listed once) ---
import authRoutes from './authRoutes.js';
import adminRoutes from './adminRoutes.js';
import enquiryRoutes from './enquiryRoutes.js';
import settingsRoutes from './settingsRoutes.js';
import admissionRoutes from './admissionRoutes.js';
import invoiceRoutes from './invoiceRoutes.js';
import centerRoutes from './centerRoutes.js';
import analyticsRoutes from './analyticsRoutes.js';
import attendanceRoutes from './attendanceRoutes.js';
import staffRoutes from './staffRoutes.js';
import documentRoutes from './documentRoutes.js';
const app = express();
const PORT = process.env.PORT || 5001;

// --- MIDDLEWARE ---
app.use(cors());
app.use(express.json());

// --- ROUTES (Each one should only be listed once) ---
app.use('/api', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/enquiries', enquiryRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/admissions', admissionRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/centers', centerRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/documents', documentRoutes);
// --- SERVER LISTENER ---
app.listen(PORT, () => {
  console.log(`✅ Server is running on port ${PORT}`);
});