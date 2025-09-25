import React, { useState, useCallback, useRef } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  IconButton,
  Typography,
  Slider,
  FormControlLabel,
  Switch,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Chip,
  TextField,
  Stack
} from '@mui/material';
import {
  Crop,
  Rotate90DegreesCcw,
  Brightness6,
  Contrast,
  Save,
  Cancel,
  Undo,
  Redo,
  RestartAlt
} from '@mui/icons-material';
import ReactCrop, { centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

const ImageEditor = ({
  open,
  onClose,
  onSave,
  imageData,
  maxWidth = 1920,
  maxHeight = 1080
}) => {
  const [crop, setCrop] = useState();
  const [completedCrop, setCompletedCrop] = useState();
  const [rotation, setRotation] = useState(0);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [aspectRatio, setAspectRatio] = useState(null);
  const [showCrop, setShowCrop] = useState(false);
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [editedImage, setEditedImage] = useState(null);
  const [processing, setProcessing] = useState(false);

  const imgRef = useRef(null);
  const canvasRef = useRef(null);

  const centerAspectCrop = useCallback((mediaWidth, mediaHeight, aspect) => {
    return centerCrop(
      makeAspectCrop(
        {
          unit: '%',
          width: 90,
        },
        aspect,
        mediaWidth,
        mediaHeight
      ),
      mediaWidth,
      mediaHeight
    );
  }, []);

  const onImageLoad = useCallback((e) => {
    if (aspectRatio) {
      const { width, height } = e.currentTarget;
      setCrop(centerAspectCrop(width, height, aspectRatio));
    }
  }, [aspectRatio, centerAspectCrop]);

  const saveToHistory = useCallback(() => {
    const currentState = {
      rotation,
      brightness,
      contrast,
      saturation,
      crop: completedCrop,
      timestamp: Date.now()
    };

    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push(currentState);
      return newHistory.slice(-20); // Keep last 20 states
    });

    setHistoryIndex(prev => Math.min(prev + 1, 19));
  }, [rotation, brightness, contrast, saturation, completedCrop, historyIndex]);

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const previousState = history[historyIndex - 1];
      setRotation(previousState.rotation);
      setBrightness(previousState.brightness);
      setContrast(previousState.contrast);
      setSaturation(previousState.saturation);
      setCompletedCrop(previousState.crop);
      setHistoryIndex(prev => prev - 1);
    }
  }, [history, historyIndex]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const nextState = history[historyIndex + 1];
      setRotation(nextState.rotation);
      setBrightness(nextState.brightness);
      setContrast(nextState.contrast);
      setSaturation(nextState.saturation);
      setCompletedCrop(nextState.crop);
      setHistoryIndex(prev => prev + 1);
    }
  }, [history, historyIndex]);

  const resetAll = useCallback(() => {
    setRotation(0);
    setBrightness(100);
    setContrast(100);
    setSaturation(100);
    setCrop(undefined);
    setCompletedCrop(undefined);
    setShowCrop(false);
    setHistory([]);
    setHistoryIndex(-1);
  }, []);

  const applyRotation = useCallback(() => {
    setRotation(prev => (prev + 90) % 360);
    saveToHistory();
  }, [saveToHistory]);

  const applyFilters = useCallback(async () => {
    if (!imgRef.current || !canvasRef.current) return null;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const image = imgRef.current;

    // Set canvas size
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;

    // Apply transformations
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.translate(-canvas.width / 2, -canvas.height / 2);

    // Apply filters
    ctx.filter = `
      brightness(${brightness}%)
      contrast(${contrast}%)
      saturate(${saturation}%)
    `;

    ctx.drawImage(image, 0, 0);
    ctx.restore();

    return canvas.toDataURL('image/jpeg', 0.85);
  }, [rotation, brightness, contrast, saturation]);

  const getCroppedImg = useCallback(async (image, crop, fileName = 'cropped.jpg') => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    canvas.width = crop.width * scaleX;
    canvas.height = crop.height * scaleY;

    ctx.drawImage(
      image,
      crop.x * scaleX,
      crop.y * scaleY,
      crop.width * scaleX,
      crop.height * scaleY,
      0,
      0,
      crop.width * scaleX,
      crop.height * scaleY
    );

    return canvas.toDataURL('image/jpeg', 0.85);
  }, []);

  const handleSave = useCallback(async () => {
    if (!imgRef.current) return;

    setProcessing(true);
    try {
      let processedImage = imageData.src;

      // Apply filters if any changes made
      if (rotation !== 0 || brightness !== 100 || contrast !== 100 || saturation !== 100) {
        processedImage = await applyFilters();
      }

      // Apply crop if set
      if (completedCrop && completedCrop.width && completedCrop.height) {
        // Create a temporary image to crop from the processed image
        const tempImg = new Image();
        tempImg.onload = async () => {
          const croppedImage = await getCroppedImg(tempImg, completedCrop);

          // Convert to blob
          const response = await fetch(croppedImage);
          const blob = await response.blob();

          const editedImageData = {
            ...imageData,
            src: croppedImage,
            blob,
            edited: true,
            editHistory: {
              rotation,
              brightness,
              contrast,
              saturation,
              cropped: !!completedCrop,
              timestamp: new Date().toISOString()
            }
          };

          onSave(editedImageData);
          onClose();
        };
        tempImg.src = processedImage;
      } else {
        // No crop, just filters
        const response = await fetch(processedImage);
        const blob = await response.blob();

        const editedImageData = {
          ...imageData,
          src: processedImage,
          blob,
          edited: true,
          editHistory: {
            rotation,
            brightness,
            contrast,
            saturation,
            cropped: false,
            timestamp: new Date().toISOString()
          }
        };

        onSave(editedImageData);
        onClose();
      }
    } catch (error) {
      console.error('Error saving edited image:', error);
    } finally {
      setProcessing(false);
    }
  }, [imageData, rotation, brightness, contrast, saturation, completedCrop, applyFilters, getCroppedImg, onSave, onClose]);

  const handleClose = useCallback(() => {
    resetAll();
    onClose();
  }, [resetAll, onClose]);

  if (!imageData) return null;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Grid container alignItems="center" spacing={2}>
          <Grid item xs>
            <Typography variant="h6">Image Editor</Typography>
          </Grid>
          <Grid item>
            <Stack direction="row" spacing={1}>
              <IconButton
                onClick={undo}
                disabled={historyIndex <= 0}
                size="small"
                title="Undo"
              >
                <Undo />
              </IconButton>
              <IconButton
                onClick={redo}
                disabled={historyIndex >= history.length - 1}
                size="small"
                title="Redo"
              >
                <Redo />
              </IconButton>
              <IconButton
                onClick={resetAll}
                size="small"
                title="Reset All"
              >
                <RestartAlt />
              </IconButton>
            </Stack>
          </Grid>
        </Grid>
      </DialogTitle>

      <DialogContent>
        <Grid container spacing={2} sx={{ height: '70vh' }}>
          {/* Image Preview Area */}
          <Grid item xs={12} md={8}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flex: 1, p: 1 }}>
                <Box
                  sx={{
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    backgroundColor: 'grey.100'
                  }}
                >
                  {showCrop ? (
                    <ReactCrop
                      crop={crop}
                      onChange={(_, percentCrop) => setCrop(percentCrop)}
                      onComplete={(c) => setCompletedCrop(c)}
                      aspect={aspectRatio}
                      style={{ maxHeight: '100%', maxWidth: '100%' }}
                    >
                      <img
                        ref={imgRef}
                        alt="Edit"
                        src={imageData.src}
                        style={{
                          transform: `rotate(${rotation}deg)`,
                          filter: `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`,
                          maxHeight: '100%',
                          maxWidth: '100%',
                          objectFit: 'contain'
                        }}
                        onLoad={onImageLoad}
                      />
                    </ReactCrop>
                  ) : (
                    <img
                      ref={imgRef}
                      alt="Edit"
                      src={imageData.src}
                      style={{
                        transform: `rotate(${rotation}deg)`,
                        filter: `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`,
                        maxHeight: '100%',
                        maxWidth: '100%',
                        objectFit: 'contain'
                      }}
                      onLoad={onImageLoad}
                    />
                  )}
                </Box>
              </CardContent>
            </Card>
            <canvas ref={canvasRef} style={{ display: 'none' }} />
          </Grid>

          {/* Controls Panel */}
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Stack spacing={3}>
                  {/* Transform Controls */}
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      Transform
                    </Typography>
                    <Stack direction="row" spacing={1}>
                      <Button
                        variant={showCrop ? 'contained' : 'outlined'}
                        startIcon={<Crop />}
                        onClick={() => setShowCrop(!showCrop)}
                        size="small"
                      >
                        Crop
                      </Button>
                      <Button
                        variant="outlined"
                        startIcon={<Rotate90DegreesCcw />}
                        onClick={applyRotation}
                        size="small"
                      >
                        Rotate
                      </Button>
                    </Stack>
                  </Box>

                  {/* Crop Aspect Ratio */}
                  {showCrop && (
                    <Box>
                      <Typography variant="subtitle2" gutterBottom>
                        Aspect Ratio
                      </Typography>
                      <Stack direction="row" spacing={1} flexWrap="wrap">
                        <Chip
                          label="Free"
                          onClick={() => setAspectRatio(null)}
                          variant={aspectRatio === null ? 'filled' : 'outlined'}
                          size="small"
                        />
                        <Chip
                          label="1:1"
                          onClick={() => setAspectRatio(1)}
                          variant={aspectRatio === 1 ? 'filled' : 'outlined'}
                          size="small"
                        />
                        <Chip
                          label="4:3"
                          onClick={() => setAspectRatio(4/3)}
                          variant={aspectRatio === 4/3 ? 'filled' : 'outlined'}
                          size="small"
                        />
                        <Chip
                          label="16:9"
                          onClick={() => setAspectRatio(16/9)}
                          variant={aspectRatio === 16/9 ? 'filled' : 'outlined'}
                          size="small"
                        />
                      </Stack>
                    </Box>
                  )}

                  {/* Filter Controls */}
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      Adjustments
                    </Typography>

                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" gutterBottom>
                        <Brightness6 sx={{ verticalAlign: 'middle', mr: 1 }} />
                        Brightness: {brightness}%
                      </Typography>
                      <Slider
                        value={brightness}
                        onChange={(_, value) => setBrightness(value)}
                        onChangeCommitted={saveToHistory}
                        min={0}
                        max={200}
                        size="small"
                      />
                    </Box>

                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" gutterBottom>
                        <Contrast sx={{ verticalAlign: 'middle', mr: 1 }} />
                        Contrast: {contrast}%
                      </Typography>
                      <Slider
                        value={contrast}
                        onChange={(_, value) => setContrast(value)}
                        onChangeCommitted={saveToHistory}
                        min={0}
                        max={200}
                        size="small"
                      />
                    </Box>

                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" gutterBottom>
                        Saturation: {saturation}%
                      </Typography>
                      <Slider
                        value={saturation}
                        onChange={(_, value) => setSaturation(value)}
                        onChangeCommitted={saveToHistory}
                        min={0}
                        max={200}
                        size="small"
                      />
                    </Box>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={processing}>
          <Cancel sx={{ mr: 1 }} />
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={processing}
        >
          <Save sx={{ mr: 1 }} />
          {processing ? 'Processing...' : 'Save Changes'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ImageEditor;