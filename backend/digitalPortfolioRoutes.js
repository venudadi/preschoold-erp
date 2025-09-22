// digitalPortfolioRoutes.js
// Backend API for digital portfolio: cloud storage integration, metadata only

import express from 'express';
import multer from 'multer';
import { uploadToCloud, getPortfolioItems, deletePortfolioItem } from './controllers/digitalPortfolioController.js';
import { protect, checkRole } from './authMiddleware.js';

const router = express.Router();

// Multer config: store file in memory for cloud upload
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Upload a portfolio item (teacher only)
router.post('/upload', protect, checkRole(['teacher']), upload.single('file'), uploadToCloud);

// Get portfolio items for a child (teacher/parent)
router.get('/child/:childId', protect, checkRole(['teacher', 'parent']), getPortfolioItems);

// Delete a portfolio item (teacher only)
router.delete('/:id', protect, checkRole(['teacher']), deletePortfolioItem);

export default router;
