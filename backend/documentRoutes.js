import express from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs/promises';
import { protect } from './authMiddleware.js';
import pool from './db.js';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: async (req, file, cb) => {
        const uploadDir = path.join(process.cwd(), 'uploads', 'documents');
        try {
            await fs.mkdir(uploadDir, { recursive: true });
            cb(null, uploadDir);
        } catch (error) {
            cb(error, null);
        }
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'image/jpeg',
            'image/png'
        ];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type'), false);
        }
    }
});

// Get document categories
router.get('/categories', protect, async (req, res) => {
    try {
        const [categories] = await pool.query(
            'SELECT * FROM document_categories WHERE center_id = ?',
            [req.query.centerId]
        );
        res.json(categories);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Create document category
router.post('/categories', protect, async (req, res) => {
    try {
        const { name, description, parent_id, center_id } = req.body;
        await pool.query(
            `INSERT INTO document_categories 
             (id, name, description, parent_id, center_id)
             VALUES (?, ?, ?, ?, ?)`,
            [uuidv4(), name, description, parent_id, center_id]
        );
        res.status(201).json({ message: 'Category created successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Upload document
router.post('/upload', protect, upload.single('file'), async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const {
            title,
            description,
            category_id,
            center_id,
            tags,
            metadata
        } = req.body;

        const documentId = uuidv4();
        await connection.query(
            `INSERT INTO documents 
             (id, category_id, title, description, file_path, file_type, 
              file_size, center_id, uploaded_by, tags, metadata)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [documentId, category_id, title, description, req.file.path,
             req.file.mimetype, req.file.size, center_id, req.user.id,
             tags ? JSON.stringify(tags) : null,
             metadata ? JSON.stringify(metadata) : null]
        );

        // Create initial version
        await connection.query(
            `INSERT INTO document_versions 
             (id, document_id, version_number, file_path, file_size, modified_by)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [uuidv4(), documentId, 1, req.file.path, req.file.size, req.user.id]
        );

        // Log access
        await connection.query(
            `INSERT INTO document_access_logs 
             (id, document_id, user_id, action, ip_address, user_agent)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [uuidv4(), documentId, req.user.id, 'edit',
             req.ip, req.headers['user-agent']]
        );

        await connection.commit();
        res.status(201).json({ 
            message: 'Document uploaded successfully',
            documentId
        });
    } catch (error) {
        await connection.rollback();
        res.status(500).json({ message: error.message });
    } finally {
        connection.release();
    }
});

// Get documents
router.get('/', protect, async (req, res) => {
    try {
        const { category_id, center_id, status } = req.query;
        let query = `
            SELECT d.*, dc.name as category_name, 
                   u.first_name, u.last_name,
                   COUNT(DISTINCT dv.id) as version_count,
                   COUNT(DISTINCT dc2.id) as comment_count
            FROM documents d
            LEFT JOIN document_categories dc ON d.category_id = dc.id
            LEFT JOIN users u ON d.uploaded_by = u.id
            LEFT JOIN document_versions dv ON d.id = dv.document_id
            LEFT JOIN document_comments dc2 ON d.id = dc2.document_id
            WHERE d.center_id = ?
        `;
        const params = [center_id];

        if (category_id) {
            query += ' AND d.category_id = ?';
            params.push(category_id);
        }

        if (status) {
            query += ' AND d.status = ?';
            params.push(status);
        }

        query += ' GROUP BY d.id ORDER BY d.created_at DESC';

        const [documents] = await pool.query(query, params);
        res.json(documents);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get document details
router.get('/:id', protect, async (req, res) => {
    try {
        const [document] = await pool.query(
            `SELECT d.*, dc.name as category_name,
                    u.first_name, u.last_name
             FROM documents d
             LEFT JOIN document_categories dc ON d.category_id = dc.id
             LEFT JOIN users u ON d.uploaded_by = u.id
             WHERE d.id = ?`,
            [req.params.id]
        );

        if (document.length === 0) {
            return res.status(404).json({ message: 'Document not found' });
        }

        // Log access
        await pool.query(
            `INSERT INTO document_access_logs 
             (id, document_id, user_id, action, ip_address, user_agent)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [uuidv4(), req.params.id, req.user.id, 'view',
             req.ip, req.headers['user-agent']]
        );

        res.json(document[0]);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Update document
router.put('/:id', protect, upload.single('file'), async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const {
            title,
            description,
            category_id,
            tags,
            metadata
        } = req.body;

        // Update document details
        await connection.query(
            `UPDATE documents 
             SET title = ?,
                 description = ?,
                 category_id = ?,
                 tags = ?,
                 metadata = ?
             WHERE id = ?`,
            [title, description, category_id,
             tags ? JSON.stringify(tags) : null,
             metadata ? JSON.stringify(metadata) : null,
             req.params.id]
        );

        // If new file is uploaded, create new version
        if (req.file) {
            const [currentDoc] = await connection.query(
                'SELECT version FROM documents WHERE id = ?',
                [req.params.id]
            );

            const newVersion = currentDoc[0].version + 1;

            await connection.query(
                `INSERT INTO document_versions 
                 (id, document_id, version_number, file_path, file_size, modified_by)
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [uuidv4(), req.params.id, newVersion, req.file.path,
                 req.file.size, req.user.id]
            );

            await connection.query(
                `UPDATE documents 
                 SET file_path = ?,
                     file_type = ?,
                     file_size = ?,
                     version = ?
                 WHERE id = ?`,
                [req.file.path, req.file.mimetype, req.file.size,
                 newVersion, req.params.id]
            );
        }

        // Log access
        await connection.query(
            `INSERT INTO document_access_logs 
             (id, document_id, user_id, action, ip_address, user_agent)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [uuidv4(), req.params.id, req.user.id, 'edit',
             req.ip, req.headers['user-agent']]
        );

        await connection.commit();
        res.json({ message: 'Document updated successfully' });
    } catch (error) {
        await connection.rollback();
        res.status(500).json({ message: error.message });
    } finally {
        connection.release();
    }
});

// Share document
router.post('/:id/share', protect, async (req, res) => {
    try {
        const { shared_with, permission_level, expires_at } = req.body;

        await pool.query(
            `INSERT INTO document_shares 
             (id, document_id, shared_with, permission_level, 
              expires_at, shared_by)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [uuidv4(), req.params.id, shared_with, permission_level,
             expires_at, req.user.id]
        );

        res.json({ message: 'Document shared successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Add comment
router.post('/:id/comments', protect, async (req, res) => {
    try {
        const { comment, parent_comment_id } = req.body;

        await pool.query(
            `INSERT INTO document_comments 
             (id, document_id, user_id, comment, parent_comment_id)
             VALUES (?, ?, ?, ?, ?)`,
            [uuidv4(), req.params.id, req.user.id, comment, parent_comment_id]
        );

        res.status(201).json({ message: 'Comment added successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get document comments
router.get('/:id/comments', protect, async (req, res) => {
    try {
        const [comments] = await pool.query(
            `SELECT c.*, u.first_name, u.last_name 
             FROM document_comments c
             JOIN users u ON c.user_id = u.id
             WHERE c.document_id = ?
             ORDER BY c.created_at DESC`,
            [req.params.id]
        );

        res.json(comments);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;