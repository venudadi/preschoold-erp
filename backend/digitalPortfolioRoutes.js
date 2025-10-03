// digitalPortfolioRoutes.js
// Enhanced API for digital portfolio with camera support and image processing

import express from 'express';
import multer from 'multer';
import {
  uploadToCloud,
  batchUploadToCloud,
  getPortfolioItems,
  deletePortfolioItem,
  toggleFavorite,
  updatePortfolioItem,
  getPortfolioStats,
  getAllPortfolioItems,
  getCenterPortfolioStats
} from './controllers/digitalPortfolioController.js';
import { protect, checkRole } from './authMiddleware.js';

const router = express.Router();

// Enhanced multer config with file size limits and type validation
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit per file
    files: 10 // Maximum 10 files per request
  },
  fileFilter: (req, file, cb) => {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Upload a single portfolio item (teacher only)
router.post('/upload', protect, checkRole(['teacher']), upload.single('file'), uploadToCloud);

// Batch upload multiple portfolio items (teacher only) - for camera burst mode
router.post('/batch-upload', protect, checkRole(['teacher']), upload.array('files', 10), batchUploadToCloud);

// Get portfolio items for a child with enhanced filtering and pagination (teacher/parent/admin)
router.get('/child/:childId', protect, checkRole(['teacher', 'parent', 'admin', 'owner', 'super_admin']), getPortfolioItems);

// Get portfolio statistics for a child (teacher/parent/admin)
router.get('/stats/:childId', protect, checkRole(['teacher', 'parent', 'admin', 'owner', 'super_admin']), getPortfolioStats);

// Get all portfolio items across center (admin only) - for admin dashboard
router.get('/center/all', protect, checkRole(['admin', 'owner', 'super_admin']), getAllPortfolioItems);

// Get center-wide portfolio statistics (admin only)
router.get('/center/stats', protect, checkRole(['admin', 'owner', 'super_admin']), getCenterPortfolioStats);

// Update portfolio item metadata (teacher only)
router.put('/:id', protect, checkRole(['teacher']), updatePortfolioItem);

// Toggle favorite status (teacher only)
router.patch('/:id/favorite', protect, checkRole(['teacher']), toggleFavorite);

// Delete a portfolio item (teacher only)
router.delete('/:id', protect, checkRole(['teacher']), deletePortfolioItem);

// Error handling middleware for multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: 'File too large',
        message: 'Maximum file size is 10MB'
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        error: 'Too many files',
        message: 'Maximum 10 files per upload'
      });
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        error: 'Unexpected file field',
        message: 'Please use the correct file field name'
      });
    }
  }

  if (error.message === 'Only image files are allowed') {
    return res.status(400).json({
      error: 'Invalid file type',
      message: 'Only image files (JPEG, PNG, WebP) are allowed'
    });
  }

  next(error);
});

export default router;
