
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import pool from './db.js';
import { globalErrorHandler } from './utils/errorHandler.js';
import { initializeAllTables } from './utils/dbTableValidator.js';
import { protect } from './authMiddleware.js';
import { requireRole } from './middleware/security.js';
import {
    compressionMiddleware,
    apiLimiter,
    authLimiter,
    performanceMonitor,
    requestLogger,
    errorTracker,
    healthCheck
} from './optimization_package.js';

const app = express();

// Trust proxy - required for DigitalOcean/Heroku/AWS etc
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
import emergencyRoutes from './emergencyRoutes.js';
import systemSettingsRoutes from './routes/systemSettingsRoutes.js';

// --- MIDDLEWARE ---
// Production-ready CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);

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

    const normalizedOrigin = origin.replace(/\/$/, '');

    if (allowedOrigins.includes(normalizedOrigin)) return callback(null, true);

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
  allowedHeaders: ['Content-Type', 'Authorization', 'x-session-token', 'x-csrf-token', 'x-2fa-totp'],
  exposedHeaders: ['x-csrf-token']
};

app.use(cors(corsOptions));

// Optimization Middlewares
app.use(compressionMiddleware);
app.use(performanceMonitor);
app.use(requestLogger);

// Security headers
app.use((req, res, next) => {
  res.header('X-Frame-Options', 'DENY');
  res.header('X-Content-Type-Options', 'nosniff');
  res.header('X-XSS-Protection', '1; mode=block');
  res.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.header('Referrer-Policy', 'strict-origin-when-cross-origin');

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

// --- API ROUTER ---
const apiRouter = express.Router();

// Rate limiting
apiRouter.use(apiLimiter);
apiRouter.use('/auth/login', authLimiter);

// Health check
apiRouter.get('/health', healthCheck);

// Routes
apiRouter.use('/auth', authRoutes);
apiRouter.use('/admin', adminRoutes);

// Explicit route handlers
apiRouter.get('/children', protect, async (req, res) => {
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

apiRouter.get('/classrooms', protect, async (req, res) => {
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

apiRouter.use('/enquiries', enquiryRoutes);
apiRouter.use('/settings', settingsRoutes);
apiRouter.use('/admissions', admissionRoutes);
apiRouter.use('/invoices', invoiceRoutes);
apiRouter.use('/invoices/requests', invoiceRequestRoutes);
apiRouter.use('/centers', centerRoutes);
apiRouter.use('/analytics', analyticsRoutes);

apiRouter.get('/staff', protect, requireRole(['super_admin', 'owner', 'center_director', 'admin', 'academic_coordinator', 'teacher']), async (req, res) => {
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

apiRouter.get('/attendance', protect, async (req, res) => {
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

apiRouter.use('/attendance', attendanceRoutes);
apiRouter.use('/staff', staffRoutes);
apiRouter.use('/documents', documentRoutes);
apiRouter.use('/fee-structures', feeStructureRoutes);
apiRouter.use('/students', studentRoutes);
apiRouter.use('/exits', exitRoutes);
apiRouter.use('/owners', ownerRoutes);
apiRouter.use('/expenses', expenseRoutes);
apiRouter.use('/lesson-plans', lessonPlanRoutes);
apiRouter.use('/assignments', assignmentRoutes);
apiRouter.use('/messaging', messagingRoutes);
apiRouter.use('/parent', parentModuleRoutes);
apiRouter.use('/observation-logs', observationLogRoutes);
apiRouter.use('/digital-portfolio', digitalPortfolioRoutes);
apiRouter.use('/classroom-announcements', classroomAnnouncementRoutes);
apiRouter.use('/admin-class/promotion', adminClassPromotionRoutes);
apiRouter.use('/center-director', centerDirectorRoutes);
apiRouter.use('/financial-manager', financialManagerRoutes);
apiRouter.use('/health', healthRoutes); // Redundant but harmless, specific handler above takes precedence if mounted correctly, but healthRoutes might have more
apiRouter.use('/auth', passwordResetRoutes);
apiRouter.use('/auth', twoFactorRoutes);
apiRouter.use('/claude', claudeRoutes);
apiRouter.use('/debug', debugRoutes);
apiRouter.use('/daily-activities', dailyActivityRoutes);
apiRouter.use('/main-vendors', mainVendorRoutes);
apiRouter.use('/receipts', receiptRoutes);
apiRouter.use('/companies', companyRoutes);
apiRouter.use('/emergency', emergencyRoutes);
apiRouter.use('/settings/system', systemSettingsRoutes);

// Mount API router
app.use('/api', apiRouter);
// Also mount at root for backward compatibility with clients not sending /api
app.use('/', apiRouter);

// --- WEBSOCKET CONFIGURATION ---
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('join-center', (centerId) => {
    socket.join(`center-${centerId}`);
    console.log(`Client ${socket.id} joined center room: center-${centerId}`);
  });

  socket.on('subscribe-dashboard', (data) => {
    const { centerId, userId } = data;
    socket.join(`dashboard-${centerId}`);
    console.log(`Client ${socket.id} subscribed to dashboard updates for center ${centerId}`);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

global.io = io;

// --- ERROR HANDLING MIDDLEWARE ---
app.use(globalErrorHandler);
app.use(errorTracker);

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
    const connection = await pool.getConnection();
    console.log('✅ Database connected successfully!');
    connection.release();
    
    await initializeAllTables();
    
    server.listen(PORT, () => {
      console.log(`✅ Server is running on port ${PORT}`);
      console.log(`🔌 WebSocket server ready for real-time updates`);
      console.log(`🛡️  Global error handling enabled`);
      console.log(`📊 Database tables validated and ready`);
      console.log(`🚀 Optimization package active`);
    });
    
  } catch (error) {
    console.error('❌ Failed to initialize server:', error);
    process.exit(1);
  }
}

initializeServer();