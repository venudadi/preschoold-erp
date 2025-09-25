import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  IconButton,
  Typography,
  Switch,
  FormControlLabel,
  Alert,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Chip
} from '@mui/material';
import {
  PhotoCamera,
  CameraAlt,
  FlipCameraAndroid,
  FlashOn,
  Close,
  Check,
  Delete,
  Download
} from '@mui/icons-material';
import Webcam from 'react-webcam';

const CameraCapture = ({
  onCapture,
  onClose,
  childId,
  maxPhotos = 10,
  showPreview = true
}) => {
  const webcamRef = useRef(null);
  const [isActive, setIsActive] = useState(false);
  const [capturedImages, setCapturedImages] = useState([]);
  const [facingMode, setFacingMode] = useState('environment');
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [error, setError] = useState('');
  const [deviceSupport, setDeviceSupport] = useState({
    hasCamera: false,
    hasMultipleCameras: false,
    permissions: 'unknown'
  });
  const [previewImage, setPreviewImage] = useState(null);
  const [capturing, setCapturing] = useState(false);

  // Check device capabilities on mount
  useEffect(() => {
    checkDeviceSupport();
  }, []);

  const checkDeviceSupport = async () => {
    try {
      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setError('Camera not supported on this device');
        return;
      }

      // Get available devices
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');

      setDeviceSupport({
        hasCamera: videoDevices.length > 0,
        hasMultipleCameras: videoDevices.length > 1,
        permissions: 'granted'
      });

      if (videoDevices.length === 0) {
        setError('No camera found on this device');
      }
    } catch (err) {
      console.error('Error checking device support:', err);
      setError('Failed to access camera. Please check permissions.');
      setDeviceSupport(prev => ({ ...prev, permissions: 'denied' }));
    }
  };

  const startCamera = useCallback(async () => {
    try {
      setError('');
      setIsActive(true);
    } catch (err) {
      console.error('Error starting camera:', err);
      setError('Failed to start camera. Please check permissions and try again.');
      setIsActive(false);
    }
  }, []);

  const stopCamera = useCallback(() => {
    setIsActive(false);
    setPreviewImage(null);
  }, []);

  const capturePhoto = useCallback(async () => {
    if (!webcamRef.current || capturedImages.length >= maxPhotos) return;

    try {
      setCapturing(true);
      const imageSrc = webcamRef.current.getScreenshot();

      if (!imageSrc) {
        throw new Error('Failed to capture image');
      }

      // Convert base64 to blob for upload
      const response = await fetch(imageSrc);
      const blob = await response.blob();

      const newImage = {
        id: Date.now(),
        src: imageSrc,
        blob,
        timestamp: new Date().toISOString(),
        metadata: {
          facingMode,
          flashEnabled,
          deviceInfo: {
            userAgent: navigator.userAgent,
            platform: navigator.platform
          },
          cameraSettings: {
            facingMode,
            flash: flashEnabled
          }
        }
      };

      setCapturedImages(prev => [...prev, newImage]);
      setPreviewImage(imageSrc);

      // Auto-close preview after 2 seconds if not in review mode
      if (!showPreview) {
        setTimeout(() => setPreviewImage(null), 2000);
      }
    } catch (err) {
      console.error('Error capturing photo:', err);
      setError('Failed to capture photo. Please try again.');
    } finally {
      setCapturing(false);
    }
  }, [capturedImages.length, maxPhotos, facingMode, flashEnabled, showPreview]);

  const deleteImage = useCallback((imageId) => {
    setCapturedImages(prev => prev.filter(img => img.id !== imageId));
    setPreviewImage(null);
  }, []);

  const switchCamera = useCallback(() => {
    if (!deviceSupport.hasMultipleCameras) return;
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  }, [deviceSupport.hasMultipleCameras]);

  const handleUpload = useCallback(async () => {
    if (capturedImages.length === 0) return;

    try {
      await onCapture(capturedImages);
      setCapturedImages([]);
      setPreviewImage(null);
      onClose?.();
    } catch (err) {
      console.error('Error uploading images:', err);
      setError('Failed to upload images. Please try again.');
    }
  }, [capturedImages, onCapture, onClose]);

  const videoConstraints = {
    width: { ideal: 1920 },
    height: { ideal: 1080 },
    facingMode,
    ...(flashEnabled && { torch: true })
  };

  if (!deviceSupport.hasCamera && deviceSupport.permissions !== 'unknown') {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          No camera available on this device
        </Alert>
        <Button onClick={onClose}>Close</Button>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {error && (
        <Alert
          severity="error"
          onClose={() => setError('')}
          sx={{ mb: 2 }}
        >
          {error}
        </Alert>
      )}

      {/* Camera Controls Header */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Grid container alignItems="center" spacing={1}>
          <Grid item xs>
            <Typography variant="h6">
              Camera Capture ({capturedImages.length}/{maxPhotos})
            </Typography>
          </Grid>

          {deviceSupport.hasMultipleCameras && (
            <Grid item>
              <IconButton
                onClick={switchCamera}
                disabled={!isActive}
                title="Switch Camera"
              >
                <FlipCameraAndroid />
              </IconButton>
            </Grid>
          )}

          <Grid item>
            <FormControlLabel
              control={
                <Switch
                  checked={flashEnabled}
                  onChange={(e) => setFlashEnabled(e.target.checked)}
                  disabled={!isActive}
                />
              }
              label={<FlashOn />}
              labelPlacement="start"
            />
          </Grid>

          <Grid item>
            <IconButton onClick={onClose} title="Close">
              <Close />
            </IconButton>
          </Grid>
        </Grid>
      </Box>

      {/* Camera View */}
      <Box sx={{ flex: 1, position: 'relative', backgroundColor: 'black' }}>
        {isActive ? (
          <Webcam
            ref={webcamRef}
            audio={false}
            videoConstraints={videoConstraints}
            screenshotFormat="image/jpeg"
            screenshotQuality={0.85}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
            onUserMediaError={(err) => {
              console.error('Webcam error:', err);
              setError('Camera access denied or not available');
              setIsActive(false);
            }}
          />
        ) : (
          <Box
            sx={{
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              color: 'white',
              gap: 2
            }}
          >
            <CameraAlt sx={{ fontSize: 64, opacity: 0.5 }} />
            <Button
              variant="contained"
              startIcon={<PhotoCamera />}
              onClick={startCamera}
              size="large"
            >
              Start Camera
            </Button>
          </Box>
        )}

        {/* Capture Button Overlay */}
        {isActive && (
          <Box
            sx={{
              position: 'absolute',
              bottom: 20,
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              alignItems: 'center',
              gap: 2
            }}
          >
            <Fab
              color="primary"
              onClick={capturePhoto}
              disabled={capturing || capturedImages.length >= maxPhotos}
              sx={{
                width: 70,
                height: 70,
                backgroundColor: capturing ? 'grey.500' : 'primary.main'
              }}
            >
              <PhotoCamera sx={{ fontSize: 30 }} />
            </Fab>
          </Box>
        )}
      </Box>

      {/* Captured Images Thumbnail Strip */}
      {capturedImages.length > 0 && (
        <Box sx={{ p: 1, borderTop: 1, borderColor: 'divider', maxHeight: 120, overflowY: 'auto' }}>
          <Grid container spacing={1} alignItems="center">
            {capturedImages.map((image) => (
              <Grid item key={image.id}>
                <Card sx={{ width: 80, height: 80, position: 'relative' }}>
                  <img
                    src={image.src}
                    alt={`Captured ${image.id}`}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      cursor: 'pointer'
                    }}
                    onClick={() => setPreviewImage(image.src)}
                  />
                  <IconButton
                    size="small"
                    onClick={() => deleteImage(image.id)}
                    sx={{
                      position: 'absolute',
                      top: 0,
                      right: 0,
                      backgroundColor: 'rgba(255,255,255,0.8)',
                      '&:hover': { backgroundColor: 'rgba(255,255,255,0.9)' }
                    }}
                  >
                    <Delete fontSize="small" />
                  </IconButton>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* Action Buttons */}
      <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <Button
              fullWidth
              variant="outlined"
              onClick={stopCamera}
              disabled={!isActive}
            >
              Stop Camera
            </Button>
          </Grid>
          <Grid item xs={6}>
            <Button
              fullWidth
              variant="contained"
              onClick={handleUpload}
              disabled={capturedImages.length === 0}
              startIcon={<Check />}
            >
              Upload ({capturedImages.length})
            </Button>
          </Grid>
        </Grid>
      </Box>

      {/* Image Preview Dialog */}
      <Dialog
        open={!!previewImage}
        onClose={() => setPreviewImage(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Image Preview
          <IconButton
            onClick={() => setPreviewImage(null)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {previewImage && (
            <img
              src={previewImage}
              alt="Preview"
              style={{ width: '100%', height: 'auto' }}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewImage(null)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CameraCapture;