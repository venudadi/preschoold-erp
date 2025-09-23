import React, { useState, useRef } from 'react';
import { Box, Button, Typography, Grid, Card, CardMedia, CardContent, CircularProgress } from '@mui/material';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';

// Teacher: Tablet upload UI for digital portfolio
export default function PortfolioUploader({ childId, onUpload }) {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef();

  const handleFileChange = (e) => {
    setFiles(Array.from(e.target.files));
  };

  const handleUpload = async () => {
    setUploading(true);
    for (const file of files) {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('childId', childId);
      // Optionally add description
      await fetch('/api/digital-portfolio/upload', {
        method: 'POST',
        body: formData,
      });
    }
    setUploading(false);
    setFiles([]);
    if (onUpload) onUpload();
  };

  return (
    <Box p={2}>
      <Typography variant="h6">Upload to Digital Portfolio</Typography>
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
        startIcon={<AddPhotoAlternateIcon />}
        onClick={() => fileInputRef.current.click()}
        sx={{ mt: 2, mb: 2 }}
        disabled={uploading}
      >
        Select Photos
      </Button>
      {files.length > 0 && (
        <Box>
          <Typography>{files.length} file(s) selected</Typography>
          <Button variant="outlined" onClick={handleUpload} disabled={uploading}>
            {uploading ? <CircularProgress size={20} /> : 'Upload'}
          </Button>
        </Box>
      )}
    </Box>
  );
}
