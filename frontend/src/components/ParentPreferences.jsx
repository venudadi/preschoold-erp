import React, { useEffect, useState } from 'react';
import { Box, Typography, Switch, FormControlLabel, Divider, CircularProgress, Alert } from '@mui/material';
import api from '../services/api';

// Parent Preferences UI
export default function ParentPreferences() {
  const [prefs, setPrefs] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/parent-module/preferences')
      .then(res => {
        const obj = {};
        (res.data.preferences || []).forEach(p => { obj[p.preference_key] = p.preference_value; });
        setPrefs(obj);
        setLoading(false);
      })
      .catch(() => { setError('Failed to load preferences'); setLoading(false); });
  }, []);

  const handleToggle = (key) => async (e) => {
    const value = e.target.checked ? '1' : '0';
    setPrefs(p => ({ ...p, [key]: value }));
    await api.post('/parent-module/preferences', { key, value });
  };

  if (loading) return <CircularProgress />;
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Box p={2}>
      <Typography variant="h6" mb={2}>Preferences</Typography>
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
