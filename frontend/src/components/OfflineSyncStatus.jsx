import React, { useState, useEffect } from 'react';
import {
  Box,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  LinearProgress,
  Alert,
  Collapse,
  Stack
} from '@mui/material';
import {
  CloudOff,
  Cloud,
  CloudQueue,
  Sync,
  Warning,
  CheckCircle,
  Error,
  ExpandMore,
  ExpandLess,
  Delete,
  Refresh
} from '@mui/icons-material';
import offlineSync from '../utils/offlineSync';

const OfflineSyncStatus = ({ compact = false }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncStatus, setSyncStatus] = useState({
    syncing: false,
    pendingCount: 0,
    lastSync: null
  });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [syncDetails, setSyncDetails] = useState({
    total: 0,
    pending: 0,
    failed: 0,
    completed: 0,
    totalSize: 0
  });
  const [expandedItems, setExpandedItems] = useState({});
  const [syncProgress, setSyncProgress] = useState(null);

  useEffect(() => {
    // Set up sync callback
    const handleSyncEvent = (event, data) => {
      switch (event) {
        case 'sync_started':
          setSyncStatus(prev => ({ ...prev, syncing: true }));
          setSyncProgress({ current: 0, total: 0, status: 'Starting...' });
          break;

        case 'upload_success':
          setSyncProgress(prev => prev ? {
            ...prev,
            current: data.successCount,
            status: `Uploaded ${data.successCount} items`
          } : null);
          break;

        case 'upload_failed':
          setSyncProgress(prev => prev ? {
            ...prev,
            status: `Failed to upload item: ${data.error.message}`
          } : null);
          break;

        case 'sync_completed':
          setSyncStatus(prev => ({
            ...prev,
            syncing: false,
            lastSync: new Date()
          }));
          setSyncProgress(null);
          loadSyncDetails();
          break;

        case 'sync_failed':
          setSyncStatus(prev => ({ ...prev, syncing: false }));
          setSyncProgress(null);
          break;
      }
    };

    offlineSync.onSync(handleSyncEvent);

    // Set up online/offline listeners
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Load initial sync details
    loadSyncDetails();

    // Periodic updates
    const interval = setInterval(loadSyncDetails, 10000);

    return () => {
      offlineSync.offSync(handleSyncEvent);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  const loadSyncDetails = async () => {
    try {
      const stats = await offlineSync.getStorageStats();
      setSyncDetails(stats);
      setSyncStatus(prev => ({ ...prev, pendingCount: stats.pending }));
    } catch (error) {
      console.error('Failed to load sync details:', error);
    }
  };

  const handleForceSync = async () => {
    try {
      await offlineSync.forcSync();
    } catch (error) {
      console.error('Force sync failed:', error);
    }
  };

  const handleClearPending = async () => {
    try {
      await offlineSync.clearAllPending();
      loadSyncDetails();
    } catch (error) {
      console.error('Failed to clear pending uploads:', error);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusIcon = () => {
    if (syncStatus.syncing) {
      return <CloudQueue color="primary" />;
    }
    if (!isOnline) {
      return <CloudOff color="error" />;
    }
    if (syncDetails.failed > 0) {
      return <Warning color="warning" />;
    }
    if (syncDetails.pending > 0) {
      return <CloudQueue color="info" />;
    }
    return <Cloud color="success" />;
  };

  const getStatusText = () => {
    if (syncStatus.syncing) {
      return 'Syncing...';
    }
    if (!isOnline) {
      return 'Offline';
    }
    if (syncDetails.failed > 0) {
      return `${syncDetails.failed} failed`;
    }
    if (syncDetails.pending > 0) {
      return `${syncDetails.pending} pending`;
    }
    return 'All synced';
  };

  const getStatusColor = () => {
    if (syncStatus.syncing) return 'primary';
    if (!isOnline) return 'error';
    if (syncDetails.failed > 0) return 'warning';
    if (syncDetails.pending > 0) return 'info';
    return 'success';
  };

  if (compact) {
    return (
      <IconButton
        onClick={() => setDialogOpen(true)}
        size="small"
        title={getStatusText()}
      >
        {getStatusIcon()}
      </IconButton>
    );
  }

  return (
    <Box>
      <Chip
        icon={getStatusIcon()}
        label={getStatusText()}
        color={getStatusColor()}
        variant="outlined"
        onClick={() => setDialogOpen(true)}
        sx={{ cursor: 'pointer' }}
      />

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            {getStatusIcon()}
            <Typography variant="h6">Sync Status</Typography>
          </Box>
        </DialogTitle>

        <DialogContent>
          {/* Connection Status */}
          <Alert
            severity={isOnline ? 'success' : 'warning'}
            sx={{ mb: 2 }}
          >
            {isOnline ? 'Connected to internet' : 'No internet connection'}
          </Alert>

          {/* Sync Progress */}
          {syncProgress && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" gutterBottom>
                {syncProgress.status}
              </Typography>
              <LinearProgress
                variant={syncProgress.total > 0 ? 'determinate' : 'indeterminate'}
                value={syncProgress.total > 0 ? (syncProgress.current / syncProgress.total) * 100 : 0}
              />
            </Box>
          )}

          {/* Sync Statistics */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Storage Statistics
            </Typography>
            <Stack spacing={1}>
              <Box display="flex" justifyContent="space-between">
                <Typography variant="body2">Total Items:</Typography>
                <Typography variant="body2">{syncDetails.total}</Typography>
              </Box>
              <Box display="flex" justifyContent="space-between">
                <Typography variant="body2" color="info.main">Pending:</Typography>
                <Typography variant="body2">{syncDetails.pending}</Typography>
              </Box>
              <Box display="flex" justifyContent="space-between">
                <Typography variant="body2" color="warning.main">Failed:</Typography>
                <Typography variant="body2">{syncDetails.failed}</Typography>
              </Box>
              <Box display="flex" justifyContent="space-between">
                <Typography variant="body2" color="success.main">Completed:</Typography>
                <Typography variant="body2">{syncDetails.completed}</Typography>
              </Box>
              <Box display="flex" justifyContent="space-between">
                <Typography variant="body2">Storage Used:</Typography>
                <Typography variant="body2">{formatFileSize(syncDetails.totalSize)}</Typography>
              </Box>
            </Stack>
          </Box>

          {/* Last Sync */}
          {syncStatus.lastSync && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Last sync: {syncStatus.lastSync.toLocaleString()}
              </Typography>
            </Box>
          )}

          {/* Offline Mode Info */}
          {!isOnline && (
            <Alert severity="info" sx={{ mb: 2 }}>
              Your photos are being saved locally and will automatically upload when you're back online.
            </Alert>
          )}

          {/* Failed Uploads Warning */}
          {syncDetails.failed > 0 && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              Some uploads have failed and will be retried automatically. If problems persist, try clearing pending uploads.
            </Alert>
          )}
        </DialogContent>

        <DialogActions>
          <Stack direction="row" spacing={1} width="100%" justifyContent="space-between">
            <Box>
              {syncDetails.pending > 0 && (
                <Button
                  startIcon={<Delete />}
                  onClick={handleClearPending}
                  color="warning"
                  size="small"
                >
                  Clear Pending
                </Button>
              )}
            </Box>
            <Box display="flex" gap={1}>
              <Button
                startIcon={<Refresh />}
                onClick={loadSyncDetails}
                size="small"
              >
                Refresh
              </Button>
              {isOnline && (
                <Button
                  startIcon={<Sync />}
                  onClick={handleForceSync}
                  disabled={syncStatus.syncing}
                  variant="contained"
                  size="small"
                >
                  Sync Now
                </Button>
              )}
              <Button onClick={() => setDialogOpen(false)}>
                Close
              </Button>
            </Box>
          </Stack>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default OfflineSyncStatus;