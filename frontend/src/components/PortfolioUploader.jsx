import React, { useState, useRef } from 'react';
import {
  Box,
  Button,
  Typography,
  Grid,
  Card,
  CardMedia,
  CardContent,
  CircularProgress,
  Tab,
  Tabs,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Chip,
  Stack,
  Alert,
  LinearProgress
} from '@mui/material';
import {
  AddPhotoAlternate,
  CameraAlt,
  CloudUpload,
  Close,
  Edit,
  Delete
} from '@mui/icons-material';
import CameraCapture from './camera/CameraCapture';
import ImageEditor from './camera/ImageEditor';

// Enhanced Teacher: Multi-modal upload UI with camera integration
export default function PortfolioUploader({ childId, onUpload, open = false, onClose }) {
  const [currentTab, setCurrentTab] = useState(0);
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingImage, setEditingImage] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const fileInputRef = useRef();

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    const processedFiles = selectedFiles.map((file, index) => ({
      id: Date.now() + index,
      file,
      src: URL.createObjectURL(file),
      name: file.name,
      size: file.size,
      type: file.type,
      edited: false
    }));
    setFiles(prev => [...prev, ...processedFiles]);
  };

  const handleCameraCapture = async (capturedImages) => {
    const processedImages = capturedImages.map(img => ({
      id: img.id,
      file: new File([img.blob], `camera_${img.id}.jpg`, { type: 'image/jpeg' }),
      src: img.src,
      name: `camera_${img.id}.jpg`,
      size: img.blob.size,
      type: 'image/jpeg',
      edited: false,
      metadata: img.metadata
    }));
    setFiles(prev => [...prev, ...processedImages]);
    setCameraOpen(false);
  };

  const handleEditImage = (imageData) => {
    setEditingImage(imageData);
    setEditorOpen(true);
  };

  const handleImageEdited = (editedImageData) => {
    setFiles(prev => prev.map(file =>
      file.id === editedImageData.id ? editedImageData : file
    ));
    setEditorOpen(false);
    setEditingImage(null);
  };

  const removeFile = (fileId) => {
    setFiles(prev => prev.filter(file => file.id !== fileId));
  };

  const clearAllFiles = () => {
    setFiles([]);
  };

  const handleUpload = async () => {
    if (files.length === 0) return;

    setUploading(true);
    setError('');
    setUploadProgress(0);

    try {
      if (files.length === 1) {
        // Single file upload
        const fileData = files[0];
        const formData = new FormData();
        formData.append('file', fileData.file);
        formData.append('childId', childId);

        if (fileData.metadata) {
          formData.append('captureMetadata', JSON.stringify(fileData.metadata));
          formData.append('captureMethod', 'camera');
        }

        const response = await fetch('/api/digital-portfolio/upload', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`Upload failed: ${response.statusText}`);
        }

        setUploadProgress(100);
      } else {
        // Batch upload for multiple files
        const formData = new FormData();
        formData.append('childId', childId);

        files.forEach((fileData, index) => {
          formData.append('files', fileData.file);
          if (fileData.metadata) {
            formData.append(`captureMetadata[${index}]`, JSON.stringify(fileData.metadata));
          }
        });

        const response = await fetch('/api/digital-portfolio/batch-upload', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`Batch upload failed: ${response.statusText}`);
        }

        const result = await response.json();
        if (result.errors && result.errors.length > 0) {
          console.warn('Some files failed to upload:', result.errors);
        }

        setUploadProgress(100);
      }

      // Clean up
      setTimeout(() => {
        setFiles([]);
        setUploadProgress(0);
        if (onUpload) onUpload();
        if (onClose) onClose();
      }, 1000);

    } catch (err) {
      console.error('Upload error:', err);
      setError(err.message || 'Upload failed. Please try again.');
      setUploadProgress(0);
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    if (!uploading) {
      setFiles([]);
      setError('');
      setUploadProgress(0);
      onClose?.();
    }
  };

  if (open) {
    return (
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Upload to Digital Portfolio</Typography>
            <IconButton onClick={handleClose} disabled={uploading}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ minHeight: '500px' }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
            <Tabs value={currentTab} onChange={(_, newValue) => setCurrentTab(newValue)}>
              <Tab icon={<CameraAlt />} label="Camera" />
              <Tab icon={<AddPhotoAlternate />} label="Gallery" />
            </Tabs>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
              {error}
            </Alert>
          )}

          {currentTab === 0 && (
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Capture photos directly from your device camera
              </Typography>
              <Button
                variant="contained"
                startIcon={<CameraAlt />}
                onClick={() => setCameraOpen(true)}
                size="large"
                disabled={uploading}
              >
                Open Camera
              </Button>
            </Box>
          )}

          {currentTab === 1 && (
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Select multiple images from your device gallery
              </Typography>

              <input
                type="file"
                accept="image/*"
                multiple
                style={{ display: 'none' }}
                ref={fileInputRef}
                onChange={handleFileChange}
              />

              <Button
                variant="contained"
                startIcon={<AddPhotoAlternate />}
                onClick={() => fileInputRef.current.click()}
                disabled={uploading}
                size="large"
              >
                Select Photos
              </Button>
            </Box>
          )}

          {/* File Preview Grid */}
          {files.length > 0 && (
            <Box sx={{ mt: 3 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                <Typography variant="subtitle1">
                  Selected Files ({files.length})
                </Typography>
                <Button
                  size="small"
                  onClick={clearAllFiles}
                  disabled={uploading}
                >
                  Clear All
                </Button>
              </Box>

              <Grid container spacing={2}>
                {files.map((file) => (
                  <Grid item xs={6} sm={4} md={3} key={file.id}>
                    <Card sx={{ position: 'relative' }}>
                      <CardMedia
                        component="img"
                        height="120"
                        image={file.src}
                        alt={file.name}
                        sx={{ objectFit: 'cover' }}
                      />
                      <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
                        <Typography variant="caption" noWrap>
                          {file.name}
                        </Typography>
                        <Stack direction="row" spacing={0.5} sx={{ mt: 0.5 }}>
                          {file.edited && (
                            <Chip label="Edited" size="small" color="primary" />
                          )}
                          {file.metadata && (
                            <Chip label="Camera" size="small" color="secondary" />
                          )}
                        </Stack>
                      </CardContent>

                      {/* Action Buttons */}
                      <Box
                        sx={{
                          position: 'absolute',
                          top: 4,
                          right: 4,
                          display: 'flex',
                          gap: 0.5
                        }}
                      >
                        <IconButton
                          size="small"
                          onClick={() => handleEditImage(file)}
                          sx={{ backgroundColor: 'rgba(255,255,255,0.8)' }}
                          disabled={uploading}
                        >
                          <Edit fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => removeFile(file.id)}
                          sx={{ backgroundColor: 'rgba(255,255,255,0.8)' }}
                          disabled={uploading}
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </Box>
                    </Card>
                  </Grid>
                ))}
              </Grid>

              {/* Upload Progress */}
              {uploading && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    Uploading... {Math.round(uploadProgress)}%
                  </Typography>
                  <LinearProgress variant="determinate" value={uploadProgress} />
                </Box>
              )}

              {/* Upload Button */}
              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  variant="contained"
                  startIcon={<CloudUpload />}
                  onClick={handleUpload}
                  disabled={uploading || files.length === 0}
                  size="large"
                >
                  {uploading ? 'Uploading...' : `Upload ${files.length} Photo${files.length !== 1 ? 's' : ''}`}
                </Button>
              </Box>
            </Box>
          )}
        </DialogContent>
      </Dialog>
    );
  }

  // Inline component for existing usage
  return (
    <Box p={2}>
      <Typography variant="h6">Upload to Digital Portfolio</Typography>

      <Stack direction="row" spacing={2} sx={{ mt: 2, mb: 2 }}>
        <Button
          variant="contained"
          startIcon={<CameraAlt />}
          onClick={() => setCameraOpen(true)}
          disabled={uploading}
        >
          Camera
        </Button>

        <Button
          variant="outlined"
          startIcon={<AddPhotoAlternate />}
          onClick={() => fileInputRef.current.click()}
          disabled={uploading}
        >
          Gallery
        </Button>
      </Stack>

      <input
        type="file"
        accept="image/*"
        multiple
        style={{ display: 'none' }}
        ref={fileInputRef}
        onChange={handleFileChange}
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {files.length > 0 && (
        <Box>
          <Typography>{files.length} file(s) selected</Typography>
          <Button
            variant="contained"
            startIcon={<CloudUpload />}
            onClick={handleUpload}
            disabled={uploading}
            sx={{ mt: 1 }}
          >
            {uploading ? 'Uploading...' : 'Upload'}
          </Button>
        </Box>
      )}

      {/* Camera Modal */}
      <Dialog open={cameraOpen} onClose={() => setCameraOpen(false)} maxWidth="md" fullWidth>
        <CameraCapture
          onCapture={handleCameraCapture}
          onClose={() => setCameraOpen(false)}
          childId={childId}
          maxPhotos={10}
        />
      </Dialog>

      {/* Image Editor Modal */}
      <ImageEditor
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        onSave={handleImageEdited}
        imageData={editingImage}
      />
    </Box>
  );
};
