
import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    TextField,
    Button,
    Grid,
    Alert,
    CircularProgress,
    Divider,
    Switch,
    FormControlLabel
} from '@mui/material';
import { Save as SaveIcon, Send as SendIcon } from '@mui/icons-material';
import api from '../services/api';

const EmailSettingsManager = () => {
    const [settings, setSettings] = useState({
        smtp_host: '',
        smtp_port: '',
        smtp_user: '',
        smtp_pass: '',
        smtp_secure: 'true',
        from_email: '',
        from_name: ''
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [testing, setTesting] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [testEmail, setTestEmail] = useState('');

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        setLoading(true);
        try {
            const response = await api.get('/settings/system/email');
            const settingsObj = {};
            response.data.settings.forEach(s => {
                settingsObj[rowToStateKey(s.setting_key)] = s.setting_value;
            });
            setSettings(prev => ({ ...prev, ...settingsObj }));
        } catch (err) {
            setError('Failed to fetch email settings');
        } finally {
            setLoading(false);
        }
    };

    const rowToStateKey = (key) => key; // Keys match exactly in this case

    const handleChange = (e) => {
        const { name, value } = e.target;
        setSettings(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
        setSaving(true);
        setError(null);
        setSuccess(null);
        try {
            const settingsArray = Object.keys(settings).map(key => ({
                key: key,
                value: settings[key]
            }));
            await api.put('/settings/system/email', { settings: settingsArray });
            setSuccess('Settings saved successfully');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    const handleTest = async () => {
        if (!testEmail) {
            setError('Please enter an email address to send the test to');
            return;
        }
        setTesting(true);
        setError(null);
        setSuccess(null);
        try {
            await api.post('/settings/system/email/test', { email: testEmail });
            setSuccess('Test email sent! Please check your inbox.');
        } catch (err) {
            setError(err.response?.data?.error || 'Test failed. Please check your SMTP settings.');
        } finally {
            setTesting(false);
        }
    };

    if (loading) return <CircularProgress />;

    return (
        <Box sx={{ maxWidth: 800 }}>
            <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>SMTP Configuration</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Configure the SMTP server used for sending system emails (password resets, notifications, etc.).
                </Typography>

                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

                <Grid container spacing={3}>
                    <Grid item xs={12} md={8}>
                        <TextField
                            fullWidth
                            label="SMTP Host"
                            name="smtp_host"
                            value={settings.smtp_host}
                            onChange={handleChange}
                            placeholder="e.g. smtp.hostinger.com"
                        />
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <TextField
                            fullWidth
                            label="SMTP Port"
                            name="smtp_port"
                            value={settings.smtp_port}
                            onChange={handleChange}
                            placeholder="e.g. 465"
                        />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            label="SMTP Username"
                            name="smtp_user"
                            value={settings.smtp_user}
                            onChange={handleChange}
                        />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            label="SMTP Password"
                            name="smtp_pass"
                            type="password"
                            value={settings.smtp_pass}
                            onChange={handleChange}
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={settings.smtp_secure === 'true'}
                                    onChange={(e) => setSettings(prev => ({ ...prev, smtp_secure: e.target.checked ? 'true' : 'false' }))}
                                />
                            }
                            label="Use SSL/TLS (Secure Connection)"
                        />
                    </Grid>
                </Grid>

                <Divider sx={{ my: 4 }} />

                <Typography variant="h6" gutterBottom>Sender Information</Typography>
                <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            label="From Email Address"
                            name="from_email"
                            value={settings.from_email}
                            onChange={handleChange}
                        />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            label="From Name"
                            name="from_name"
                            value={settings.from_name}
                            onChange={handleChange}
                        />
                    </Grid>
                </Grid>

                <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
                    <Button
                        variant="contained"
                        startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                        onClick={handleSave}
                        disabled={saving}
                    >
                        Save Email Settings
                    </Button>
                </Box>
            </Paper>

            <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>Test Integration</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Verify your SMTP settings by sending a test email.
                </Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <TextField
                        sx={{ flexGrow: 1 }}
                        label="Recipient Email Address"
                        value={testEmail}
                        onChange={(e) => setTestEmail(e.target.value)}
                        size="small"
                    />
                    <Button
                        variant="outlined"
                        startIcon={testing ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
                        onClick={handleTest}
                        disabled={testing}
                    >
                        Send Test
                    </Button>
                </Box>
            </Paper>
        </Box>
    );
};

export default EmailSettingsManager;
