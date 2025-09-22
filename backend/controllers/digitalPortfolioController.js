// digitalPortfolioController.js
// Handles cloud upload and metadata DB ops for digital portfolio

import db from '../db.js';
import { uploadFileToCloud, deleteFileFromCloud } from '../utils/cloudStorage.js';
import { v4 as uuidv4 } from 'uuid';

// POST /upload
export const uploadToCloud = async (req, res) => {
  try {
    const { childId, description } = req.body;
    const file = req.file;
    if (!file || !childId) return res.status(400).json({ error: 'File and childId required' });

    // Upload to cloud (returns URL)
    const cloudResult = await uploadFileToCloud(file, `portfolio/${childId}/${uuidv4()}_${file.originalname}`);
    if (!cloudResult || !cloudResult.url) throw new Error('Cloud upload failed');

    // Store metadata in DB
    await db.query(
      'INSERT INTO digital_portfolios (id, child_id, file_url, file_name, uploaded_by, description, uploaded_at) VALUES (?, ?, ?, ?, ?, ?, NOW())',
      [uuidv4(), childId, cloudResult.url, file.originalname, req.user.id, description || null]
    );
    res.json({ success: true, url: cloudResult.url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /child/:childId
export const getPortfolioItems = async (req, res) => {
  try {
    const { childId } = req.params;
    const rows = await db.query('SELECT id, file_url, file_name, description, uploaded_at, uploaded_by FROM digital_portfolios WHERE child_id = ? ORDER BY uploaded_at DESC', [childId]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// DELETE /:id
export const deletePortfolioItem = async (req, res) => {
  try {
    const { id } = req.params;
    // Get file_url for deletion
    const [item] = await db.query('SELECT file_url FROM digital_portfolios WHERE id = ?', [id]);
    if (!item) return res.status(404).json({ error: 'Not found' });
    await deleteFileFromCloud(item.file_url);
    await db.query('DELETE FROM digital_portfolios WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
