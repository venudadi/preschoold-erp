import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardMedia,
  IconButton,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  DialogActions,
  Grid,
  Chip,
  LinearProgress,
  Avatar,
  Badge,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  Alert,
  Fab,
  Tooltip,
  Paper,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Collapse
} from '@mui/material';
import {
  PhotoCamera,
  VideoCall,
  CloudUpload,
  Close,
  Check,
  Schedule,
  Warning,
  Info,
  Delete,
  Edit,
  Share,
  Visibility,
  ThumbUp,
  Comment,
  Send,
  Cancel,
  AttachFile,
  CameraAlt,
  Folder,
  Star,
  StarBorder,
  FilterList,
  Sort,
  ExpandMore,
  ExpandLess,
  Approval,
  Person,
  Group
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

// Theme colors
const colors = {
  pending: '#FF9800',
  approved: '#4CAF50',
  rejected: '#F44336',
  upload: '#2196F3',
  review: '#9C27B0'
};

// Workflow steps
const workflowSteps = [
  {
    id: 'upload',
    label: 'Upload Content',
    description: 'Select and upload your photos/videos',
    icon: CloudUpload
  },
  {
    id: 'details',
    label: 'Add Details',
    description: 'Add descriptions and tags',
    icon: Edit
  },
  {
    id: 'permissions',
    label: 'Set Permissions',
    description: 'Choose who can view your content',
    icon: Group
  },
  {
    id: 'submit',
    label: 'Submit for Approval',
    description: 'Send to teacher for review',
    icon: Send
  }
];

// File upload component with drag and drop
const FileUploadZone = ({ onFilesSelected, acceptedTypes = ['image/*', 'video/*'], maxSize = 10 }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    onFilesSelected(files);
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    onFilesSelected(files);
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <Card
        sx={{
          border: `2px dashed ${isDragOver ? colors.upload : 'rgba(0,0,0,0.2)'}`,
          borderRadius: '20px',
          background: isDragOver ? 'rgba(33, 150, 243, 0.1)' : 'rgba(0,0,0,0.02)',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          '&:hover': {
            borderColor: colors.upload,
            background: 'rgba(33, 150, 243, 0.05)'
          }
        }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <CardContent sx={{ p: 4, textAlign: 'center' }}>
          <motion.div
            animate={{
              y: isDragOver ? [-5, 5, -5] : 0,
              scale: isDragOver ? [1, 1.1, 1] : 1
            }}
            transition={{ duration: 0.5, repeat: isDragOver ? Infinity : 0 }}
          >
            <Box sx={{ fontSize: '64px', mb: 2 }}>
              📸
            </Box>
          </motion.div>

          <Typography variant="h6" sx={{ mb: 1, color: colors.upload }}>
            {isDragOver ? 'Drop your files here!' : 'Upload Photos & Videos'}
          </Typography>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Drag and drop files here, or click to select
          </Typography>

          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mb: 2 }}>
            <Chip
              icon={<PhotoCamera />}
              label="Photos"
              variant="outlined"
              size="small"
              sx={{ borderRadius: '12px' }}
            />
            <Chip
              icon={<VideoCall />}
              label="Videos"
              variant="outlined"
              size="small"
              sx={{ borderRadius: '12px' }}
            />
          </Box>

          <Typography variant="caption" color="text.secondary">
            Maximum file size: {maxSize}MB per file
          </Typography>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={acceptedTypes.join(',')}
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
        </CardContent>
      </Card>
    </motion.div>
  );
};

// Media preview component
const MediaPreview = ({ file, onRemove, onEdit }) => {
  const [expanded, setExpanded] = useState(false);
  const [preview, setPreview] = useState('');

  useEffect(() => {
    if (file && (file.type?.startsWith('image/') || file.type?.startsWith('video/'))) {
      const url = URL.createObjectURL(file);
      setPreview(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [file]);

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.3 }}
    >
      <Card sx={{
        borderRadius: '16px',
        overflow: 'hidden',
        position: 'relative',
        '&:hover .media-overlay': {
          opacity: 1
        }
      }}>
        {preview && file.type?.startsWith('image/') && (
          <CardMedia
            component="img"
            height="200"
            image={preview}
            alt={file.name}
            sx={{ objectFit: 'cover' }}
          />
        )}

        {preview && file.type?.startsWith('video/') && (
          <CardMedia
            component="video"
            height="200"
            src={preview}
            controls
            sx={{ objectFit: 'cover' }}
          />
        )}

        {/* Overlay controls */}
        <Box
          className="media-overlay"
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: 0,
            transition: 'opacity 0.3s ease'
          }}
        >
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Edit details">
              <IconButton
                onClick={() => onEdit(file)}
                sx={{
                  bgcolor: 'rgba(255,255,255,0.9)',
                  '&:hover': { bgcolor: 'white' }
                }}
              >
                <Edit />
              </IconButton>
            </Tooltip>
            <Tooltip title="Remove">
              <IconButton
                onClick={() => onRemove(file)}
                sx={{
                  bgcolor: 'rgba(255,255,255,0.9)',
                  color: colors.rejected,
                  '&:hover': { bgcolor: 'white' }
                }}
              >
                <Delete />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        <CardContent sx={{ p: 2 }}>
          <Typography variant="subtitle2" noWrap>
            {file.name}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {formatFileSize(file.size)}
          </Typography>

          {file.metadata && (
            <Box sx={{ mt: 1 }}>
              <IconButton
                size="small"
                onClick={() => setExpanded(!expanded)}
                sx={{ p: 0.5 }}
              >
                {expanded ? <ExpandLess /> : <ExpandMore />}
              </IconButton>
            </Box>
          )}

          <Collapse in={expanded}>
            {file.metadata && (
              <Box sx={{ mt: 1, pt: 1, borderTop: '1px solid rgba(0,0,0,0.1)' }}>
                <Typography variant="caption" display="block">
                  <strong>Description:</strong> {file.metadata.description || 'None'}
                </Typography>
                {file.metadata.tags && file.metadata.tags.length > 0 && (
                  <Box sx={{ mt: 0.5, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {file.metadata.tags.map((tag, i) => (
                      <Chip key={i} label={tag} size="small" variant="outlined" />
                    ))}
                  </Box>
                )}
              </Box>
            )}
          </Collapse>
        </CardContent>
      </Card>
    </motion.div>
  );
};

// Approval status component
const ApprovalStatus = ({ submission }) => {
  const getStatusColor = () => {
    switch (submission.status) {
      case 'pending': return colors.pending;
      case 'approved': return colors.approved;
      case 'rejected': return colors.rejected;
      case 'review': return colors.review;
      default: return 'text.secondary';
    }
  };

  const getStatusIcon = () => {
    switch (submission.status) {
      case 'pending': return <Schedule />;
      case 'approved': return <Check />;
      case 'rejected': return <Close />;
      case 'review': return <Visibility />;
      default: return <Info />;
    }
  };

  return (
    <Card sx={{
      borderRadius: '16px',
      border: `2px solid ${getStatusColor()}`,
      background: `${getStatusColor()}10`
    }}>
      <CardContent sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Avatar sx={{ bgcolor: getStatusColor(), width: 40, height: 40 }}>
            {getStatusIcon()}
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" sx={{ color: getStatusColor(), textTransform: 'capitalize' }}>
              {submission.status}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Submitted: {submission.submittedAt}
            </Typography>
          </Box>
        </Box>

        {submission.reviewComment && (
          <Box sx={{
            p: 2,
            bgcolor: 'rgba(0,0,0,0.05)',
            borderRadius: '12px',
            mb: 2
          }}>
            <Typography variant="subtitle2" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Person sx={{ fontSize: 16 }} />
              Teacher's Feedback
            </Typography>
            <Typography variant="body2">
              {submission.reviewComment}
            </Typography>
          </Box>
        )}

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Chip
            label={`${submission.files.length} file${submission.files.length !== 1 ? 's' : ''}`}
            size="small"
            variant="outlined"
          />
          {submission.reviewedBy && (
            <Typography variant="caption" color="text.secondary">
              Reviewed by {submission.reviewedBy}
            </Typography>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

const MediaUploader = ({ child }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [editingFile, setEditingFile] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [permissions, setPermissions] = useState({
    teachers: true,
    family: false,
    portfolio: true
  });

  // Sample submissions
  useEffect(() => {
    setSubmissions([
      {
        id: 1,
        status: 'approved',
        submittedAt: '2 days ago',
        reviewedBy: 'Ms. Sarah',
        reviewComment: 'Beautiful photos of Emma\'s artwork! I love how creative she was with the colors.',
        files: [
          { name: 'emma_artwork_1.jpg', type: 'image/jpeg' },
          { name: 'emma_artwork_2.jpg', type: 'image/jpeg' }
        ]
      },
      {
        id: 2,
        status: 'pending',
        submittedAt: '1 hour ago',
        files: [
          { name: 'playground_fun.mp4', type: 'video/mp4' }
        ]
      },
      {
        id: 3,
        status: 'rejected',
        submittedAt: '3 days ago',
        reviewedBy: 'Ms. Jenny',
        reviewComment: 'Please resubmit with better lighting and focus on Emma rather than other children.',
        files: [
          { name: 'lunch_time.jpg', type: 'image/jpeg' }
        ]
      }
    ]);
  }, []);

  const handleFilesSelected = (files) => {
    const validFiles = files.filter(file => {
      const isValidType = file.type.startsWith('image/') || file.type.startsWith('video/');
      const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB
      return isValidType && isValidSize;
    });

    const filesWithMetadata = validFiles.map(file => ({
      ...file,
      id: Date.now() + Math.random(),
      metadata: {
        description: '',
        tags: [],
        privacy: 'teachers_only'
      }
    }));

    setSelectedFiles(prev => [...prev, ...filesWithMetadata]);
    if (validFiles.length > 0) {
      setActiveStep(1);
    }
  };

  const handleRemoveFile = (fileToRemove) => {
    setSelectedFiles(prev => prev.filter(file => file.id !== fileToRemove.id));
  };

  const handleEditFile = (file) => {
    setEditingFile(file);
  };

  const handleSubmit = async () => {
    setUploading(true);
    setUploadProgress(0);

    // Simulate upload progress
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          setUploading(false);
          setActiveStep(0);
          setSelectedFiles([]);

          // Add new submission
          const newSubmission = {
            id: submissions.length + 1,
            status: 'pending',
            submittedAt: 'Just now',
            files: selectedFiles.map(f => ({ name: f.name, type: f.type }))
          };
          setSubmissions(prev => [newSubmission, ...prev]);

          return 0;
        }
        return prev + 10;
      });
    }, 200);
  };

  const handleNext = () => {
    setActiveStep(prev => Math.min(prev + 1, workflowSteps.length - 1));
  };

  const handleBack = () => {
    setActiveStep(prev => Math.max(prev - 1, 0));
  };

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Box>
            <FileUploadZone onFilesSelected={handleFilesSelected} />
            {selectedFiles.length > 0 && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Selected Files ({selectedFiles.length})
                </Typography>
                <Grid container spacing={2}>
                  {selectedFiles.map((file) => (
                    <Grid item xs={6} sm={4} md={3} key={file.id}>
                      <MediaPreview
                        file={file}
                        onRemove={handleRemoveFile}
                        onEdit={handleEditFile}
                      />
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}
          </Box>
        );

      case 1:
        return (
          <Box>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Add Details to Your Media
            </Typography>
            <Grid container spacing={2}>
              {selectedFiles.map((file) => (
                <Grid item xs={12} key={file.id}>
                  <Card sx={{ borderRadius: '12px' }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                        <Avatar sx={{ bgcolor: colors.upload }}>
                          {file.type.startsWith('image/') ? <PhotoCamera /> : <VideoCall />}
                        </Avatar>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="subtitle1">{file.name}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {(file.size / 1024 / 1024).toFixed(1)} MB
                          </Typography>
                        </Box>
                      </Box>

                      <TextField
                        fullWidth
                        multiline
                        rows={2}
                        label="Description"
                        placeholder="Tell us about this photo/video..."
                        value={file.metadata.description}
                        onChange={(e) => {
                          const updatedFiles = selectedFiles.map(f =>
                            f.id === file.id
                              ? { ...f, metadata: { ...f.metadata, description: e.target.value } }
                              : f
                          );
                          setSelectedFiles(updatedFiles);
                        }}
                        sx={{ mb: 2 }}
                      />

                      <TextField
                        fullWidth
                        label="Tags"
                        placeholder="Add tags separated by commas..."
                        helperText="e.g., art, outdoor, creative, learning"
                        onChange={(e) => {
                          const tags = e.target.value.split(',').map(tag => tag.trim()).filter(Boolean);
                          const updatedFiles = selectedFiles.map(f =>
                            f.id === file.id
                              ? { ...f, metadata: { ...f.metadata, tags } }
                              : f
                          );
                          setSelectedFiles(updatedFiles);
                        }}
                      />
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        );

      case 2:
        return (
          <Box>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Choose Sharing Permissions
            </Typography>
            <Alert severity="info" sx={{ mb: 3, borderRadius: '12px' }}>
              All content must be approved by teachers before being visible to others.
            </Alert>

            <Card sx={{ borderRadius: '16px' }}>
              <CardContent>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={permissions.teachers}
                      onChange={(e) => setPermissions(prev => ({ ...prev, teachers: e.target.checked }))}
                      disabled
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="subtitle1">Teachers & Staff</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Required - Teachers can view and provide feedback
                      </Typography>
                    </Box>
                  }
                />
                <Divider sx={{ my: 2 }} />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={permissions.portfolio}
                      onChange={(e) => setPermissions(prev => ({ ...prev, portfolio: e.target.checked }))}
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="subtitle1">Digital Portfolio</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Include in {child?.name}'s digital portfolio
                      </Typography>
                    </Box>
                  }
                />
                <Divider sx={{ my: 2 }} />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={permissions.family}
                      onChange={(e) => setPermissions(prev => ({ ...prev, family: e.target.checked }))}
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="subtitle1">Extended Family</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Allow grandparents and other family members to view
                      </Typography>
                    </Box>
                  }
                />
              </CardContent>
            </Card>
          </Box>
        );

      case 3:
        return (
          <Box>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Review & Submit
            </Typography>

            <Card sx={{ borderRadius: '16px', mb: 3 }}>
              <CardContent>
                <Typography variant="subtitle1" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CloudUpload sx={{ color: colors.upload }} />
                  Ready to Submit ({selectedFiles.length} files)
                </Typography>

                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                  {selectedFiles.map((file, index) => (
                    <Chip
                      key={file.id}
                      label={`${index + 1}. ${file.name}`}
                      variant="outlined"
                      size="small"
                    />
                  ))}
                </Box>

                <Divider sx={{ my: 2 }} />

                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Sharing Permissions:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {permissions.teachers && <Chip label="Teachers" size="small" color="primary" />}
                  {permissions.portfolio && <Chip label="Portfolio" size="small" color="secondary" />}
                  {permissions.family && <Chip label="Family" size="small" color="success" />}
                </Box>
              </CardContent>
            </Card>

            {uploading && (
              <Card sx={{ borderRadius: '16px', mb: 2 }}>
                <CardContent>
                  <Typography variant="subtitle1" sx={{ mb: 2 }}>
                    Uploading... {uploadProgress}%
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={uploadProgress}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      bgcolor: 'rgba(33, 150, 243, 0.2)',
                      '& .MuiLinearProgress-bar': {
                        bgcolor: colors.upload,
                        borderRadius: 4
                      }
                    }}
                  />
                </CardContent>
              </Card>
            )}
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Box sx={{ p: 2, maxHeight: '70vh', overflow: 'auto' }}>
      {/* Header */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <span style={{ fontSize: '24px' }}>📸</span>
            Share Photos & Videos
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Upload and share special moments with {child?.name}'s teachers
          </Typography>
        </Box>
      </motion.div>

      {/* Previous submissions */}
      {submissions.length > 0 && activeStep === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <Typography variant="h6" sx={{ mb: 2 }}>
            Recent Submissions
          </Typography>
          <Grid container spacing={2} sx={{ mb: 4 }}>
            {submissions.slice(0, 3).map((submission) => (
              <Grid item xs={12} key={submission.id}>
                <ApprovalStatus submission={submission} />
              </Grid>
            ))}
          </Grid>
          <Divider sx={{ mb: 3 }} />
        </motion.div>
      )}

      {/* Upload workflow */}
      <Card sx={{
        borderRadius: '20px',
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(0,0,0,0.1)'
      }}>
        <CardContent>
          {/* Stepper */}
          <Stepper activeStep={activeStep} orientation="horizontal" sx={{ mb: 3 }}>
            {workflowSteps.map((step, index) => (
              <Step key={step.id}>
                <StepLabel
                  icon={
                    <Avatar sx={{
                      bgcolor: index <= activeStep ? colors.upload : 'rgba(0,0,0,0.1)',
                      color: 'white',
                      width: 32,
                      height: 32
                    }}>
                      <step.icon sx={{ fontSize: 16 }} />
                    </Avatar>
                  }
                >
                  <Typography variant="subtitle2">{step.label}</Typography>
                </StepLabel>
              </Step>
            ))}
          </Stepper>

          {/* Step content */}
          <Box sx={{ minHeight: 300 }}>
            {renderStepContent(activeStep)}
          </Box>

          {/* Navigation buttons */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
            <Button
              onClick={handleBack}
              disabled={activeStep === 0 || uploading}
              startIcon={<Cancel />}
            >
              Back
            </Button>

            <Box sx={{ display: 'flex', gap: 1 }}>
              {activeStep === workflowSteps.length - 1 ? (
                <Button
                  variant="contained"
                  onClick={handleSubmit}
                  disabled={selectedFiles.length === 0 || uploading}
                  startIcon={<Send />}
                  sx={{
                    background: colors.approved,
                    borderRadius: '20px',
                    '&:hover': { background: '#388E3C' }
                  }}
                >
                  {uploading ? 'Submitting...' : 'Submit for Approval'}
                </Button>
              ) : (
                <Button
                  variant="contained"
                  onClick={handleNext}
                  disabled={selectedFiles.length === 0}
                  endIcon={<Send />}
                  sx={{
                    background: colors.upload,
                    borderRadius: '20px',
                    '&:hover': { background: '#1976D2' }
                  }}
                >
                  Next
                </Button>
              )}
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Quick upload FAB */}
      {activeStep === 0 && (
        <motion.div
          style={{
            position: 'fixed',
            bottom: 80,
            right: 24,
            zIndex: 1000
          }}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.5 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <input
            type="file"
            multiple
            accept="image/*,video/*"
            onChange={(e) => handleFilesSelected(Array.from(e.target.files))}
            style={{ display: 'none' }}
            id="quick-upload"
          />
          <label htmlFor="quick-upload">
            <Fab
              component="span"
              sx={{
                background: colors.upload,
                color: 'white',
                '&:hover': { background: '#1976D2' }
              }}
            >
              <PhotoCamera />
            </Fab>
          </label>
        </motion.div>
      )}
    </Box>
  );
};

export default MediaUploader;