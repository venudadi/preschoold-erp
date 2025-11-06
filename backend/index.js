
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import compression from 'compression';
import { createServer } from 'http';
import { Server } from 'socket.io';
import pool from './db.js';
import { globalErrorHandler } from './utils/errorHandler.js';
import { initializeAllTables } from './utils/dbTableValidator.js';
import { protect } from './authMiddleware.js';
import { requireRole } from './middleware/security.js';

const app = express();

// Trust proxy - required for DigitalOcean/Heroku/AWS etc
// Trust only the first proxy (DigitalOcean's load balancer)
// This prevents IP spoofing while allowing rate limiting to work correctly
app.set('trust proxy', 1);

const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

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
import centerDirectorRoutes from './centerDirectorRoutes.js';
import financialManagerRoutes from './financialManagerRoutes.js';
import healthRoutes from './healthRoutes.js';
import passwordResetRoutes from './passwordResetRoutes.js';
import twoFactorRoutes from './twoFactorRoutes.js';
import claudeRoutes from './claudeRoutes.js';
import debugRoutes from './debugRoutes.js';
import dailyActivityRoutes from './dailyActivityRoutes.js';
import mainVendorRoutes from './mainVendorRoutes.js';
import receiptRoutes from './receiptRoutes.js';
import companyRoutes from './companyRoutes.js';

// --- MIDDLEWARE ---
// Production-ready CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, server-to-server)
    if (!origin) return callback(null, true);

    // Build allowed list (normalize values)
    const envOrigins = (process.env.ALLOWED_ORIGINS || process.env.FRONTEND_URL || '')
      .split(',')
      .map(o => o.trim())
      .filter(Boolean);

    const defaultDevOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:5175'
    ];

    const allowedOrigins = process.env.NODE_ENV === 'production'
      ? envOrigins
      : Array.from(new Set([...envOrigins, ...defaultDevOrigins]));

    // Normalize incoming origin (remove trailing slash)
    const normalizedOrigin = origin.replace(/\/$/, '');

    // Quick exact-match check
    if (allowedOrigins.includes(normalizedOrigin)) return callback(null, true);

    // Allow localhost on configured dev ports as a fallback (handles variations like http://127.0.0.1:5174)
    try {
      const url = new URL(normalizedOrigin);
      if ((url.hostname === 'localhost' || url.hostname === '127.0.0.1') && /^(3000|3001|517[3-5])$/.test(url.port)) {
        return callback(null, true);
      }
    } catch (e) {
      // fall through to rejection
    }

    console.warn(`CORS blocked request from origin: ${origin}`);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-session-token', 'x-csrf-token'],
  exposedHeaders: ['x-csrf-token']
};

app.use(cors(corsOptions));

// Compression middleware for better performance
app.use(compression({
  level: 6, // Compression level (0-9)
  threshold: 1024, // Only compress responses > 1KB
  filter: (req, res) => {
    // Don't compress if the request includes a Cache-Control: no-transform directive
    if (req.headers['cache-control'] && req.headers['cache-control'].includes('no-transform')) {
      return false;
    }
    // Compress everything else
    return compression.filter(req, res);
  }
}));

// Security headers
app.use((req, res, next) => {
  res.header('X-Frame-Options', 'DENY');
  res.header('X-Content-Type-Options', 'nosniff');
  res.header('X-XSS-Protection', '1; mode=block');
  res.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.header('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Performance-related headers
  if (process.env.NODE_ENV === 'production') {
    res.header('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.header('Pragma', 'no-cache');
    res.header('Expires', '0');
  }

  next();
});

// Body parsing with size limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// --- ROUTES (Each one should only be listed once) ---
// Note: /api prefix handled by DigitalOcean routing, not needed in route definitions
app.use('/auth', authRoutes);
app.use('/admin', adminRoutes);

// Create specific route handlers for children and classrooms endpoints
app.get('/children', protect, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT * FROM children WHERE center_id = ? ORDER BY first_name, last_name`,
      [req.user.center_id || req.query.centerId]
    );
    res.json({ children: rows });
  } catch (error) {
    console.error('Error fetching children:', error);
    res.status(500).json({ message: 'Error fetching children' });
  }
});

app.get('/classrooms', protect, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT * FROM classrooms WHERE center_id = ? ORDER BY name`,
      [req.user.center_id || req.query.centerId]
    );
    res.json({ classrooms: rows });
  } catch (error) {
    console.error('Error fetching classrooms:', error);
    res.status(500).json({ message: 'Error fetching classrooms' });
  }
});

app.use('/enquiries', enquiryRoutes);
app.use('/settings', settingsRoutes);
app.use('/admissions', admissionRoutes);
app.use('/invoices', invoiceRoutes);
app.use('/invoices/requests', invoiceRequestRoutes);
app.use('/centers', centerRoutes);
app.use('/analytics', analyticsRoutes);

// Create explicit route handler for staff endpoint
app.get('/staff', protect, requireRole(['super_admin', 'owner', 'center_director', 'admin', 'academic_coordinator', 'teacher']), async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT u.id, u.email, u.full_name, u.role, u.is_active
       FROM users u
       WHERE u.center_id = ? AND u.role IN ('admin', 'teacher', 'owner', 'academic_coordinator', 'center_director')
       ORDER BY u.full_name`,
      [req.user.center_id || req.query.centerId]
    );
    res.json(rows);
  } catch (error) {
    console.error('Error fetching staff:', error);
    res.status(500).json({ message: 'Error fetching staff' });
  }
});

// Create explicit route handler for attendance endpoint
app.get('/attendance', protect, async (req, res) => {
  try {
    const date = req.query.date || new Date().toISOString().split('T')[0];
    const [rows] = await pool.query(
      `SELECT a.*, c.first_name, c.last_name
       FROM attendance a
       LEFT JOIN children c ON a.child_id = c.id
       WHERE a.center_id = ? AND a.date = ?
       ORDER BY a.check_in_time`,
      [req.user.center_id || req.query.centerId, date]
    );
    res.json({ attendance: rows });
  } catch (error) {
    console.error('Error fetching attendance:', error);
    res.status(500).json({ message: 'Error fetching attendance' });
  }
});

// Original routes kept for more complex operations
app.use('/attendance', attendanceRoutes);
app.use('/staff', staffRoutes);
app.use('/documents', documentRoutes);
app.use('/fee-structures', feeStructureRoutes);
app.use('/students', studentRoutes);
app.use('/exits', exitRoutes);
app.use('/owners', ownerRoutes);
app.use('/expenses', expenseRoutes);
app.use('/lesson-plans', lessonPlanRoutes);
app.use('/assignments', assignmentRoutes);
app.use('/messaging', messagingRoutes);
app.use('/parent', parentModuleRoutes);
app.use('/observation-logs', observationLogRoutes);
app.use('/digital-portfolio', digitalPortfolioRoutes);
app.use('/classroom-announcements', classroomAnnouncementRoutes);
app.use('/admin-class/promotion', adminClassPromotionRoutes);
app.use('/center-director', centerDirectorRoutes);
app.use('/financial-manager', financialManagerRoutes);
app.use('/health', healthRoutes);
// Also expose health check at /api/health for DigitalOcean health checks (direct container access)
app.use('/api/health', healthRoutes);
app.use('/auth', passwordResetRoutes);
app.use('/auth', twoFactorRoutes);
app.use('/claude', claudeRoutes);
app.use('/debug', debugRoutes);
app.use('/daily-activities', dailyActivityRoutes);
app.use('/main-vendors', mainVendorRoutes);
app.use('/receipts', receiptRoutes);
app.use('/companies', companyRoutes);
// --- WEBSOCKET CONFIGURATION ---
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Join center-specific rooms for targeted updates
  socket.on('join-center', (centerId) => {
    socket.join(`center-${centerId}`);
    console.log(`Client ${socket.id} joined center room: center-${centerId}`);
  });

  // Handle real-time dashboard subscriptions
  socket.on('subscribe-dashboard', (data) => {
    const { centerId, userId } = data;
    socket.join(`dashboard-${centerId}`);
    console.log(`Client ${socket.id} subscribed to dashboard updates for center ${centerId}`);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Make io available globally for use in routes
global.io = io;

// --- ERROR HANDLING MIDDLEWARE ---
// This must be AFTER all routes
app.use(globalErrorHandler);

// --- 404 HANDLER ---
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      message: `Route ${req.originalUrl} not found`,
      code: 'ROUTE_NOT_FOUND',
      timestamp: new Date().toISOString()
    }
  });
});

// --- DATABASE INITIALIZATION ---
async function initializeServer() {
  try {
    // Test database connection
    const connection = await pool.getConnection();
    console.log('✅ Database connected successfully!');
    connection.release();
    
    // Initialize all required tables
    await initializeAllTables();
    
    // Start the server
    server.listen(PORT, () => {
      console.log(`✅ Server is running on port ${PORT}`);
      console.log(`🔌 WebSocket server ready for real-time updates`);
      console.log(`🛡️  Global error handling enabled`);
      console.log(`📊 Database tables validated and ready`);
    });
    
  } catch (error) {
    console.error('❌ Failed to initialize server:', error);
    process.exit(1);
  }
}

// Initialize server
initializeServer();