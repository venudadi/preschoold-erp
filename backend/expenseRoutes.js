// expenseRoutes.js
import express from 'express';
import { protect } from './authMiddleware.js';
import { 
  logExpense,
  uploadReceipt,
  raiseExpenseRequest,
  approveExpenseRequest,
  rejectExpenseRequest,
  removeRecurringExpense,
  getExpenses,
  exportExpenses,
  getExpenseNotifications,
  markNotificationRead
} from './controllers/expenseController.js';
import multer from 'multer';
import path from 'path';

// Configure multer for receipt uploads - use memory storage for cloud upload
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit for receipts
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, and PDF are allowed.'), false);
    }
  }
});
import { requireRole } from './middleware/security.js';

const router = express.Router();

// Apply authentication to all routes
router.use(protect);

// Log a new expense (financial manager)
router.post('/log', requireRole(['financial_manager']), logExpense);

// Upload receipt image (financial manager)
router.post('/upload-receipt', requireRole(['financial_manager']), upload.single('receipt'), uploadReceipt);

// Raise expense request (admin, owner)
router.post('/request', requireRole(['admin', 'owner']), raiseExpenseRequest);

// Approve expense request (financial manager)
router.post('/approve/:expenseId', requireRole(['financial_manager']), approveExpenseRequest);

// Reject expense request (financial manager)
router.post('/reject/:expenseId', requireRole(['financial_manager']), rejectExpenseRequest);

// Remove recurring expense (financial manager)
router.post('/remove-recurring/:expenseId', requireRole(['financial_manager']), removeRecurringExpense);


// Get expenses (with filters, all roles)
router.get('/', requireRole(['financial_manager', 'admin', 'owner', 'super_admin']), getExpenses);

// Expense analytics (all roles)
import { getExpenseAnalytics } from './controllers/expenseController.js';
router.get('/analytics', requireRole(['financial_manager', 'admin', 'owner', 'super_admin']), getExpenseAnalytics);

// Export expenses to Excel (financial manager, super_admin, owner)
router.get('/export', requireRole(['financial_manager', 'super_admin', 'owner']), exportExpenses);

// Get notifications (all roles)
router.get('/notifications', requireRole(['financial_manager', 'admin', 'owner']), getExpenseNotifications);

// Mark notification as read
router.post('/notifications/:notificationId/read', requireRole(['financial_manager', 'admin', 'owner']), markNotificationRead);

export default router;
