// imageProcessing.js
// Image processing utilities for camera integration

import sharp from 'sharp';
import ExifParser from 'exif-parser';
import Jimp from 'jimp';
import { fileTypeFromBuffer } from 'file-type';

/**
 * Process uploaded image: compression, thumbnail generation, metadata extraction
 */
export const processImage = async (buffer, options = {}) => {
    try {
        const {
            maxWidth = 1920,
            maxHeight = 1080,
            quality = 85,
            generateThumbnail = true,
            thumbnailSize = 300,
            stripExif = true,
            preserveGPS = false
        } = options;

        // Detect file type
        const fileType = await fileTypeFromBuffer(buffer);
        if (!fileType || !fileType.mime.startsWith('image/')) {
            throw new Error('Invalid image file');
        }

        let processedBuffer = buffer;
        let thumbnailBuffer = null;
        let metadata = {};
        let originalDimensions = '';

        // Extract EXIF data before processing
        try {
            const exifData = ExifParser.create(buffer).parse();

            // Get original dimensions
            if (exifData.imageSize) {
                originalDimensions = `${exifData.imageSize.width}x${exifData.imageSize.height}`;
            }

            // Extract safe metadata
            metadata = {
                make: exifData.tags?.Make,
                model: exifData.tags?.Model,
                dateTime: exifData.tags?.DateTime,
                orientation: exifData.tags?.Orientation,
                ...(preserveGPS && exifData.tags?.GPSLatitude && {
                    gps: {
                        latitude: exifData.tags.GPSLatitude,
                        longitude: exifData.tags.GPSLongitude,
                        timestamp: exifData.tags.GPSTimeStamp
                    }
                })
            };
        } catch (exifError) {
            console.warn('Could not extract EXIF data:', exifError.message);
        }

        // Process main image with Sharp
        const sharpInstance = sharp(buffer);
        const imageInfo = await sharpInstance.metadata();

        // Get original dimensions if not from EXIF
        if (!originalDimensions) {
            originalDimensions = `${imageInfo.width}x${imageInfo.height}`;
        }

        // Resize if needed while maintaining aspect ratio
        if (imageInfo.width > maxWidth || imageInfo.height > maxHeight) {
            sharpInstance.resize(maxWidth, maxHeight, {
                fit: 'inside',
                withoutEnlargement: true
            });
        }

        // Auto-rotate based on EXIF orientation
        sharpInstance.rotate();

        // Strip EXIF data if requested (default for privacy)
        if (stripExif) {
            sharpInstance.withMetadata(false);
        }

        // Convert to optimized format
        if (fileType.mime === 'image/jpeg' || fileType.mime === 'image/jpg') {
            sharpInstance.jpeg({ quality, progressive: true });
        } else if (fileType.mime === 'image/png') {
            sharpInstance.png({ quality, progressive: true });
        } else if (fileType.mime === 'image/webp') {
            sharpInstance.webp({ quality });
        } else {
            // Convert other formats to JPEG
            sharpInstance.jpeg({ quality, progressive: true });
        }

        processedBuffer = await sharpInstance.toBuffer();

        // Generate thumbnail if requested
        if (generateThumbnail) {
            thumbnailBuffer = await sharp(buffer)
                .resize(thumbnailSize, thumbnailSize, {
                    fit: 'cover',
                    position: 'center'
                })
                .rotate() // Auto-rotate
                .jpeg({ quality: 80, progressive: true })
                .withMetadata(false) // Always strip metadata from thumbnails
                .toBuffer();
        }

        return {
            processedImage: {
                buffer: processedBuffer,
                size: processedBuffer.length,
                mimeType: fileType.mime === 'image/png' ? 'image/png' : 'image/jpeg'
            },
            thumbnail: thumbnailBuffer ? {
                buffer: thumbnailBuffer,
                size: thumbnailBuffer.length,
                mimeType: 'image/jpeg'
            } : null,
            metadata: {
                originalDimensions,
                processedSize: processedBuffer.length,
                thumbnailSize: thumbnailBuffer?.length || 0,
                captureMetadata: metadata
            }
        };

    } catch (error) {
        console.error('Image processing error:', error);
        throw new Error(`Image processing failed: ${error.message}`);
    }
};

/**
 * Create thumbnail from existing image URL
 */
export const createThumbnailFromUrl = async (imageUrl, size = 300) => {
    try {
        // This would typically fetch the image from cloud storage
        // For now, return placeholder logic
        return {
            success: true,
            thumbnailUrl: `${imageUrl}_thumb_${size}x${size}.jpg`
        };
    } catch (error) {
        console.error('Thumbnail creation error:', error);
        throw error;
    }
};

/**
 * Validate image file
 */
export const validateImageFile = async (file) => {
    const errors = [];

    // Check file size (10MB limit)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
        errors.push('File size too large (max 10MB)');
    }

    // Check file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.mimetype)) {
        errors.push('Invalid file type. Only JPEG, PNG, and WebP are allowed');
    }

    // Basic buffer validation
    if (!file.buffer || file.buffer.length === 0) {
        errors.push('Empty file buffer');
    }

    // Try to detect actual file type from buffer
    try {
        const detectedType = await fileTypeFromBuffer(file.buffer);
        if (!detectedType || !detectedType.mime.startsWith('image/')) {
            errors.push('File is not a valid image');
        }
    } catch (error) {
        errors.push('Could not validate file type');
    }

    return {
        isValid: errors.length === 0,
        errors
    };
};

/**
 * Extract safe metadata for database storage
 */
export const extractSafeMetadata = (captureData = {}) => {
    const {
        deviceInfo,
        cameraSettings,
        timestamp,
        location, // Only if explicitly allowed
        teacherNotes
    } = captureData;

    return {
        timestamp: timestamp || new Date().toISOString(),
        device: deviceInfo ? {
            platform: deviceInfo.platform,
            userAgent: deviceInfo.userAgent?.substring(0, 100) // Truncate for privacy
        } : null,
        camera: cameraSettings ? {
            facing: cameraSettings.facingMode,
            resolution: cameraSettings.resolution,
            flash: cameraSettings.flash
        } : null,
        location: location && location.allowed ? {
            accuracy: location.accuracy,
            timestamp: location.timestamp
        } : null,
        notes: teacherNotes?.substring(0, 500) // Limit notes length
    };
};

/**
 * Batch process multiple images
 */
export const batchProcessImages = async (files, options = {}) => {
    const results = [];
    const errors = [];

    for (let i = 0; i < files.length; i++) {
        try {
            const file = files[i];
            const validation = await validateImageFile(file);

            if (!validation.isValid) {
                errors.push({
                    index: i,
                    filename: file.originalname,
                    errors: validation.errors
                });
                continue;
            }

            const processed = await processImage(file.buffer, options);
            results.push({
                index: i,
                filename: file.originalname,
                originalSize: file.size,
                ...processed
            });

        } catch (error) {
            errors.push({
                index: i,
                filename: files[i]?.originalname || 'unknown',
                errors: [error.message]
            });
        }
    }

    return {
        processed: results,
        errors,
        summary: {
            total: files.length,
            successful: results.length,
            failed: errors.length
        }
    };
};

export default {
    processImage,
    createThumbnailFromUrl,
    validateImageFile,
    extractSafeMetadata,
    batchProcessImages
};