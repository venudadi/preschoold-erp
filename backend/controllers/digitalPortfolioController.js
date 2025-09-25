// digitalPortfolioController.js
// Enhanced controller with camera support and image processing

import db from '../db.js';
import { uploadFileToCloud, deleteFileFromCloud } from '../utils/cloudStorage.js';
import { processImage, validateImageFile, extractSafeMetadata, batchProcessImages } from '../utils/imageProcessing.js';
import { v4 as uuidv4 } from 'uuid';

// POST /upload - Enhanced with image processing
export const uploadToCloud = async (req, res) => {
  try {
    const { childId, description, title, captureMetadata, tags } = req.body;
    const file = req.file;

    if (!file || !childId) {
      return res.status(400).json({ error: 'File and childId required' });
    }

    // Validate the image file
    const validation = await validateImageFile(file);
    if (!validation.isValid) {
      return res.status(400).json({
        error: 'Invalid file',
        details: validation.errors
      });
    }

    // Process the image (compression, thumbnail, etc.)
    const processedData = await processImage(file.buffer, {
      maxWidth: 1920,
      maxHeight: 1080,
      quality: 85,
      generateThumbnail: true,
      stripExif: true
    });

    const portfolioId = uuidv4();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

    // Upload main image
    const mainImageKey = `portfolio/${childId}/${portfolioId}_${timestamp}_${file.originalname}`;
    const mainImageResult = await uploadFileToCloud({
      buffer: processedData.processedImage.buffer,
      mimetype: processedData.processedImage.mimeType,
      originalname: file.originalname
    }, mainImageKey);

    if (!mainImageResult || !mainImageResult.url) {
      throw new Error('Main image upload failed');
    }

    // Upload thumbnail if generated
    let thumbnailUrl = null;
    if (processedData.thumbnail) {
      const thumbnailKey = `portfolio/${childId}/thumbnails/${portfolioId}_thumb_${timestamp}.jpg`;
      const thumbnailResult = await uploadFileToCloud({
        buffer: processedData.thumbnail.buffer,
        mimetype: 'image/jpeg',
        originalname: `thumb_${file.originalname}`
      }, thumbnailKey);
      thumbnailUrl = thumbnailResult?.url;
    }

    // Extract safe metadata
    const safeMetadata = extractSafeMetadata(captureMetadata ? JSON.parse(captureMetadata) : {});

    // Parse tags if provided
    let parsedTags = null;
    if (tags) {
      try {
        parsedTags = typeof tags === 'string' ? JSON.parse(tags) : tags;
      } catch (e) {
        parsedTags = tags.split(',').map(tag => tag.trim());
      }
    }

    // Get user's center_id
    const [userInfo] = await db.query(
      'SELECT center_id FROM users WHERE id = ?',
      [req.user.id]
    );

    if (!userInfo.length) {
      throw new Error('User not found');
    }

    // Store metadata in database with enhanced schema
    const insertQuery = `
      INSERT INTO digital_portfolios (
        id, child_id, center_id, uploaded_by, title, description,
        file_url, file_name, file_type, file_size, mime_type,
        thumbnail_url, original_dimensions, compressed_size,
        capture_method, capture_metadata, processing_status,
        is_favorite, tags, upload_date
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `;

    const values = [
      portfolioId,
      childId,
      userInfo[0].center_id,
      req.user.id,
      title || null,
      description || null,
      mainImageResult.url,
      file.originalname,
      'image',
      processedData.processedImage.size,
      processedData.processedImage.mimeType,
      thumbnailUrl,
      processedData.metadata.originalDimensions,
      processedData.processedImage.size,
      req.body.captureMethod || 'upload',
      JSON.stringify(safeMetadata),
      'completed',
      false,
      parsedTags ? JSON.stringify(parsedTags) : null
    ];

    await db.query(insertQuery, values);

    res.json({
      success: true,
      id: portfolioId,
      url: mainImageResult.url,
      thumbnailUrl,
      metadata: processedData.metadata,
      originalSize: file.size,
      compressedSize: processedData.processedImage.size,
      compressionRatio: Math.round((1 - processedData.processedImage.size / file.size) * 100)
    });

  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: err.message });
  }
};

// POST /batch-upload - Upload multiple images
export const batchUploadToCloud = async (req, res) => {
  try {
    const { childId, descriptions, titles, captureMetadata, tags } = req.body;
    const files = req.files;

    if (!files || files.length === 0 || !childId) {
      return res.status(400).json({ error: 'Files and childId required' });
    }

    // Process all images
    const batchResults = await batchProcessImages(files);

    if (batchResults.errors.length > 0) {
      return res.status(400).json({
        error: 'Some files could not be processed',
        details: batchResults.errors,
        summary: batchResults.summary
      });
    }

    const uploadResults = [];
    const uploadErrors = [];

    // Get user's center_id
    const [userInfo] = await db.query(
      'SELECT center_id FROM users WHERE id = ?',
      [req.user.id]
    );

    if (!userInfo.length) {
      throw new Error('User not found');
    }

    // Upload each processed image
    for (let i = 0; i < batchResults.processed.length; i++) {
      try {
        const processedData = batchResults.processed[i];
        const file = files[processedData.index];

        const portfolioId = uuidv4();
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

        // Upload main image
        const mainImageKey = `portfolio/${childId}/${portfolioId}_${timestamp}_${file.originalname}`;
        const mainImageResult = await uploadFileToCloud({
          buffer: processedData.processedImage.buffer,
          mimetype: processedData.processedImage.mimeType,
          originalname: file.originalname
        }, mainImageKey);

        // Upload thumbnail
        let thumbnailUrl = null;
        if (processedData.thumbnail) {
          const thumbnailKey = `portfolio/${childId}/thumbnails/${portfolioId}_thumb_${timestamp}.jpg`;
          const thumbnailResult = await uploadFileToCloud({
            buffer: processedData.thumbnail.buffer,
            mimetype: 'image/jpeg',
            originalname: `thumb_${file.originalname}`
          }, thumbnailKey);
          thumbnailUrl = thumbnailResult?.url;
        }

        // Parse metadata and tags for this specific file
        const safeMetadata = extractSafeMetadata(captureMetadata?.[i] ? JSON.parse(captureMetadata[i]) : {});
        let parsedTags = null;
        if (tags?.[i]) {
          parsedTags = typeof tags[i] === 'string' ? JSON.parse(tags[i]) : tags[i];
        }

        // Insert into database
        const insertQuery = `
          INSERT INTO digital_portfolios (
            id, child_id, center_id, uploaded_by, title, description,
            file_url, file_name, file_type, file_size, mime_type,
            thumbnail_url, original_dimensions, compressed_size,
            capture_method, capture_metadata, processing_status,
            is_favorite, tags, upload_date
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
        `;

        const values = [
          portfolioId,
          childId,
          userInfo[0].center_id,
          req.user.id,
          titles?.[i] || null,
          descriptions?.[i] || null,
          mainImageResult.url,
          file.originalname,
          'image',
          processedData.processedImage.size,
          processedData.processedImage.mimeType,
          thumbnailUrl,
          processedData.metadata.originalDimensions,
          processedData.processedImage.size,
          'camera', // Assume batch uploads are from camera
          JSON.stringify(safeMetadata),
          'completed',
          false,
          parsedTags ? JSON.stringify(parsedTags) : null
        ];

        await db.query(insertQuery, values);

        uploadResults.push({
          index: i,
          id: portfolioId,
          filename: file.originalname,
          url: mainImageResult.url,
          thumbnailUrl,
          originalSize: file.size,
          compressedSize: processedData.processedImage.size
        });

      } catch (error) {
        uploadErrors.push({
          index: i,
          filename: files[i]?.originalname || 'unknown',
          error: error.message
        });
      }
    }

    res.json({
      success: uploadErrors.length === 0,
      uploaded: uploadResults,
      errors: uploadErrors,
      summary: {
        total: files.length,
        successful: uploadResults.length,
        failed: uploadErrors.length
      }
    });

  } catch (err) {
    console.error('Batch upload error:', err);
    res.status(500).json({ error: err.message });
  }
};

// GET /child/:childId - Enhanced with pagination and filtering
export const getPortfolioItems = async (req, res) => {
  try {
    const { childId } = req.params;
    const {
      page = 1,
      limit = 20,
      type = 'all',
      favorite = null,
      sortBy = 'upload_date',
      sortOrder = 'DESC'
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    let whereClause = 'WHERE dp.child_id = ?';
    let queryParams = [childId];

    // Add type filter
    if (type && type !== 'all') {
      whereClause += ' AND dp.file_type = ?';
      queryParams.push(type);
    }

    // Add favorite filter
    if (favorite !== null) {
      whereClause += ' AND dp.is_favorite = ?';
      queryParams.push(favorite === 'true' ? 1 : 0);
    }

    // Validate sort parameters
    const allowedSortFields = ['upload_date', 'created_at', 'file_name', 'file_size'];
    const allowedSortOrders = ['ASC', 'DESC'];
    const validSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'upload_date';
    const validSortOrder = allowedSortOrders.includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'DESC';

    const query = `
      SELECT
        dp.id, dp.child_id, dp.title, dp.description,
        dp.file_url, dp.file_name, dp.file_type, dp.file_size,
        dp.thumbnail_url, dp.original_dimensions,
        dp.capture_method, dp.is_favorite, dp.tags,
        dp.upload_date, dp.created_at,
        u.full_name as uploaded_by_name,
        c.first_name as child_first_name,
        c.last_name as child_last_name
      FROM digital_portfolios dp
      LEFT JOIN users u ON dp.uploaded_by = u.id
      LEFT JOIN children c ON dp.child_id = c.id
      ${whereClause}
      ORDER BY dp.${validSortBy} ${validSortOrder}
      LIMIT ? OFFSET ?
    `;

    queryParams.push(parseInt(limit), offset);

    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(*) as total
      FROM digital_portfolios dp
      ${whereClause}
    `;

    const [items] = await db.query(query, queryParams);
    const [countResult] = await db.query(countQuery, queryParams.slice(0, -2)); // Remove limit and offset

    // Parse JSON fields
    const processedItems = items.map(item => ({
      ...item,
      tags: item.tags ? JSON.parse(item.tags) : null,
      is_favorite: Boolean(item.is_favorite)
    }));

    const totalItems = countResult[0].total;
    const totalPages = Math.ceil(totalItems / parseInt(limit));

    res.json({
      items: processedItems,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalItems,
        itemsPerPage: parseInt(limit),
        hasNextPage: parseInt(page) < totalPages,
        hasPrevPage: parseInt(page) > 1
      }
    });

  } catch (err) {
    console.error('Get portfolio items error:', err);
    res.status(500).json({ error: err.message });
  }
};

// PATCH /:id/favorite - Toggle favorite status
export const toggleFavorite = async (req, res) => {
  try {
    const { id } = req.params;
    const { is_favorite } = req.body;

    // Verify ownership (teacher can only modify their uploads)
    const [item] = await db.query(
      'SELECT uploaded_by FROM digital_portfolios WHERE id = ?',
      [id]
    );

    if (!item.length) {
      return res.status(404).json({ error: 'Portfolio item not found' });
    }

    if (item[0].uploaded_by !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await db.query(
      'UPDATE digital_portfolios SET is_favorite = ?, updated_at = NOW() WHERE id = ?',
      [is_favorite ? 1 : 0, id]
    );

    res.json({ success: true, is_favorite: Boolean(is_favorite) });
  } catch (err) {
    console.error('Toggle favorite error:', err);
    res.status(500).json({ error: err.message });
  }
};

// PUT /:id - Update portfolio item
export const updatePortfolioItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, tags } = req.body;

    // Verify ownership
    const [item] = await db.query(
      'SELECT uploaded_by FROM digital_portfolios WHERE id = ?',
      [id]
    );

    if (!item.length) {
      return res.status(404).json({ error: 'Portfolio item not found' });
    }

    if (item[0].uploaded_by !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Parse tags
    let parsedTags = null;
    if (tags) {
      parsedTags = typeof tags === 'string' ? JSON.parse(tags) : tags;
    }

    await db.query(
      `UPDATE digital_portfolios
       SET title = ?, description = ?, tags = ?, updated_at = NOW()
       WHERE id = ?`,
      [title || null, description || null, parsedTags ? JSON.stringify(parsedTags) : null, id]
    );

    res.json({ success: true });
  } catch (err) {
    console.error('Update portfolio item error:', err);
    res.status(500).json({ error: err.message });
  }
};

// DELETE /:id - Enhanced with thumbnail cleanup
export const deletePortfolioItem = async (req, res) => {
  try {
    const { id } = req.params;

    // Get file URLs for deletion
    const [item] = await db.query(
      'SELECT file_url, thumbnail_url, uploaded_by FROM digital_portfolios WHERE id = ?',
      [id]
    );

    if (!item.length) {
      return res.status(404).json({ error: 'Portfolio item not found' });
    }

    // Verify ownership
    if (item[0].uploaded_by !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Delete from cloud storage
    if (item[0].file_url) {
      await deleteFileFromCloud(item[0].file_url);
    }
    if (item[0].thumbnail_url) {
      await deleteFileFromCloud(item[0].thumbnail_url);
    }

    // Delete from database
    await db.query('DELETE FROM digital_portfolios WHERE id = ?', [id]);

    res.json({ success: true });
  } catch (err) {
    console.error('Delete portfolio item error:', err);
    res.status(500).json({ error: err.message });
  }
};

// GET /stats/:childId - Get portfolio statistics
export const getPortfolioStats = async (req, res) => {
  try {
    const { childId } = req.params;

    const [stats] = await db.query(`
      SELECT
        COUNT(*) as total_items,
        COUNT(CASE WHEN file_type = 'image' THEN 1 END) as images,
        COUNT(CASE WHEN file_type = 'video' THEN 1 END) as videos,
        COUNT(CASE WHEN is_favorite = 1 THEN 1 END) as favorites,
        SUM(file_size) as total_size,
        MIN(upload_date) as first_upload,
        MAX(upload_date) as latest_upload
      FROM digital_portfolios
      WHERE child_id = ?
    `, [childId]);

    res.json(stats[0] || {});
  } catch (err) {
    console.error('Get portfolio stats error:', err);
    res.status(500).json({ error: err.message });
  }
};

// Legacy compatibility - maintain existing API
export { uploadToCloud as uploadToCloudLegacy };