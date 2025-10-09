import React, { useEffect, useState } from 'react';
import { Box, Typography, Switch, FormControlLabel, Divider, CircularProgress, Alert } from '@mui/material';
import api from '../services/api';

// Parent Preferences UI
export default function ParentPreferences() {
  const [prefs, setPrefs] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updateError, setUpdateError] = useState('');
  const [updateSuccess, setUpdateSuccess] = useState('');

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/parent-module/preferences');
      const obj = {};
      (res.data.preferences || []).forEach(p => { obj[p.preference_key] = p.preference_value; });
      setPrefs(obj);
    } catch (err) {
      console.error('Error loading preferences:', err);

      if (err.response) {
        if (err.response.status === 401) {
          setError('Please log in again to view preferences');
        } else if (err.response.status === 403) {
          setError('You do not have permission to view preferences');
        } else if (err.response.status === 500) {
          setError('Server error. Please try again later');
        } else {
          setError(err.response.data?.message || 'Failed to load preferences');
        }
      } else if (err.request) {
        setError('Network error. Please check your connection and try again');
      } else {
        setError('An unexpected error occurred. Please try again');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (key) => async (e) => {
    const value = e.target.checked ? '1' : '0';
    const previousValue = prefs[key];

    // Optimistically update UI
    setPrefs(p => ({ ...p, [key]: value }));
    setUpdateError('');
    setUpdateSuccess('');

    try {
      await api.post('/parent-module/preferences', { key, value });
      setUpdateSuccess('Preference updated successfully');

      // Clear success message after 3 seconds
      setTimeout(() => {
        setUpdateSuccess('');
      }, 3000);
    } catch (err) {
      console.error('Error updating preference:', err);

      // Revert to previous value on error
      setPrefs(p => ({ ...p, [key]: previousValue }));

      if (err.response) {
        if (err.response.status === 401) {
          setUpdateError('Please log in again to update preferences');
        } else if (err.response.status === 403) {
          setUpdateError('You do not have permission to update preferences');
        } else if (err.response.status === 500) {
          setUpdateError('Server error. Please try again');
        } else {
          setUpdateError(err.response.data?.message || 'Failed to update preference');
        }
      } else if (err.request) {
        setUpdateError('Network error. Please check your connection and try again');
      } else {
        setUpdateError('An unexpected error occurred. Please try again');
      }
    }
  };

  if (loading) {
    return (
      <Box p={2} display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={2}>
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
      </Box>
    );
  }

  return (
    <Box p={2}>
      <Typography variant="h6" mb={2}>Preferences</Typography>

      {updateSuccess && <Alert severity="success" sx={{ mb: 2 }}>{updateSuccess}</Alert>}
      {updateError && <Alert severity="error" sx={{ mb: 2 }}>{updateError}</Alert>}

      <FormControlLabel
        control={<Switch checked={prefs.notifications !== '0'} onChange={handleToggle('notifications')} />}
        label="Enable Notifications"
      />
      <Divider sx={{ my: 2 }} />
      <FormControlLabel
        control={<Switch checked={prefs.marketing_emails !== '0'} onChange={handleToggle('marketing_emails')} />}
        label="Receive Marketing Emails"
      />
    </Box>
  );
}
