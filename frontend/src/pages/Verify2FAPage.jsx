/**
 * Two-Factor Authentication Verification Page
 * Displayed after successful password login when 2FA is enabled
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    Container,
    Paper,
    Box,
    Typography,
    TextField,
    Button,
    Alert,
    CircularProgress,
    Link,
    Divider,
    InputAdornment
} from '@mui/material';
import {
    Security as SecurityIcon,
    Key as KeyIcon,
    ArrowBack as BackIcon,
    Smartphone as SmartphoneIcon
} from '@mui/icons-material';
import twoFactorAPI from '../services/twoFactorApi';

const Verify2FAPage = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [useBackupCode, setUseBackupCode] = useState(false);

    const [sessionToken, setSessionToken] = useState('');
    const [expiresIn, setExpiresIn] = useState(600); // 10 minutes in seconds

    // Load session data from navigation state
    useEffect(() => {
        if (!location.state?.sessionToken) {
            navigate('/login', { replace: true });
            return;
        }

        setSessionToken(location.state.sessionToken);
        setExpiresIn(location.state.expiresIn || 600);
    }, [location, navigate]);

    // Countdown timer
    useEffect(() => {
        if (expiresIn <= 0) {
            setError('Session expired. Please log in again.');
            setTimeout(() => navigate('/login'), 3000);
            return;
        }

        const timer = setInterval(() => {
            setExpiresIn((prev) => Math.max(0, prev - 1));
        }, 1000);

        return () => clearInterval(timer);
    }, [expiresIn, navigate]);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Validate input
        const codeType = twoFactorAPI.detectInputType(code);

        if (codeType === 'invalid') {
            setError(useBackupCode
                ? 'Invalid backup code format. Should be 8 characters.'
                : 'Invalid verification code. Should be 6 digits.');
            return;
        }

        if (codeType === 'backup' && !useBackupCode) {
            setError('This looks like a backup code. Click "Use Backup Code" below.');
            return;
        }

        if (codeType === 'totp' && useBackupCode) {
            setError('This looks like a verification code from your app. Click "Use Authenticator App" below.');
            return;
        }

        setLoading(true);

        try {
            const result = await twoFactorAPI.verify2FALogin(code, sessionToken);

            if (result.success) {
                // Store tokens
                const { token, user } = result.data;
                localStorage.setItem('token', token);
                localStorage.setItem('user', JSON.stringify(user));

                // Navigate to dashboard
                navigate('/dashboard', { replace: true });
            } else {
                setError(result.error);
                setCode('');
            }
        } catch (err) {
            console.error('2FA verification error:', err);
            setError('Verification failed. Please try again.');
            setCode('');
        } finally {
            setLoading(false);
        }
    };

    const handleCodeChange = (e) => {
        let input = e.target.value.replace(/\s+/g, '').toUpperCase();

        if (useBackupCode) {
            input = input.slice(0, 8);
        } else {
            input = input.replace(/\D/g, '').slice(0, 6);
        }

        setCode(input);
        setError('');
    };

    const toggleInputMode = () => {
        setUseBackupCode(!useBackupCode);
        setCode('');
        setError('');
    };

    const handleBackToLogin = () => {
        navigate('/login');
    };

    return (
        <Container component="main" maxWidth="sm">
            <Box
                sx={{
                    marginTop: 8,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    minHeight: '80vh'
                }}
            >
                <Paper elevation={3} sx={{ padding: 4, width: '100%', maxWidth: 500 }}>
                    {/* Header */}
                    <Box sx={{ mb: 4, textAlign: 'center' }}>
                        {useBackupCode ? (
                            <KeyIcon sx={{ fontSize: 60, color: 'warning.main', mb: 2 }} />
                        ) : (
                            <SecurityIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
                        )}
                        <Typography component="h1" variant="h4" gutterBottom>
                            {useBackupCode ? 'Enter Backup Code' : 'Two-Factor Authentication'}
                        </Typography>
                        <Typography variant="body1" color="text.secondary">
                            {useBackupCode
                                ? 'Enter one of your 8-character backup codes'
                                : 'Enter the 6-digit code from your authenticator app'}
                        </Typography>
                    </Box>

                    {/* Session Timer */}
                    <Box sx={{ mb: 3, textAlign: 'center' }}>
                        <Typography variant="caption" color={expiresIn < 120 ? 'error' : 'text.secondary'}>
                            Session expires in: {formatTime(expiresIn)}
                        </Typography>
                    </Box>

                    {/* Error Message */}
                    {error && (
                        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
                            {error}
                        </Alert>
                    )}

                    {/* Form */}
                    <Box component="form" onSubmit={handleSubmit}>
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            id="code"
                            label={useBackupCode ? 'Backup Code' : 'Verification Code'}
                            name="code"
                            autoComplete="off"
                            autoFocus
                            value={code}
                            onChange={handleCodeChange}
                            disabled={loading}
                            placeholder={useBackupCode ? 'ABC12345' : '123456'}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        {useBackupCode ? <KeyIcon /> : <SmartphoneIcon />}
                                    </InputAdornment>
                                ),
                                sx: {
                                    fontSize: useBackupCode ? '1.5rem' : '2rem',
                                    textAlign: 'center',
                                    letterSpacing: '0.3rem',
                                    fontFamily: 'monospace'
                                }
                            }}
                            helperText={
                                useBackupCode
                                    ? 'Each backup code can only be used once'
                                    : 'Open your authenticator app to get the code'
                            }
                            sx={{ mb: 3 }}
                        />

                        {/* Submit Button */}
                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            size="large"
                            disabled={
                                loading ||
                                (useBackupCode ? code.length !== 8 : code.length !== 6)
                            }
                            startIcon={loading ? <CircularProgress size={20} /> : <SecurityIcon />}
                            sx={{ mb: 2, py: 1.5 }}
                        >
                            {loading ? 'Verifying...' : 'Verify & Log In'}
                        </Button>

                        <Divider sx={{ my: 3 }}>
                            <Typography variant="caption" color="text.secondary">
                                OR
                            </Typography>
                        </Divider>

                        {/* Toggle Input Mode */}
                        <Box sx={{ textAlign: 'center', mb: 3 }}>
                            <Link
                                component="button"
                                type="button"
                                variant="body2"
                                onClick={toggleInputMode}
                                disabled={loading}
                                sx={{ cursor: 'pointer' }}
                            >
                                {useBackupCode
                                    ? '← Use Authenticator App'
                                    : 'Lost your device? Use Backup Code →'}
                            </Link>
                        </Box>

                        {/* Info Box */}
                        <Box
                            sx={{
                                mb: 3,
                                p: 2,
                                bgcolor: 'info.50',
                                borderRadius: 1,
                                border: '1px solid',
                                borderColor: 'info.200'
                            }}
                        >
                            <Typography variant="body2" color="info.main">
                                <strong>Need help?</strong> Contact your system administrator if you've lost access
                                to both your authenticator app and backup codes.
                            </Typography>
                        </Box>

                        {/* Back to Login */}
                        <Box sx={{ textAlign: 'center' }}>
                            <Link
                                component="button"
                                type="button"
                                variant="body2"
                                onClick={handleBackToLogin}
                                disabled={loading}
                                sx={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    cursor: 'pointer'
                                }}
                            >
                                <BackIcon sx={{ fontSize: 16, mr: 0.5 }} />
                                Back to Login
                            </Link>
                        </Box>
                    </Box>
                </Paper>

                {/* Footer */}
                <Box sx={{ mt: 4, mb: 2 }}>
                    <Typography variant="body2" color="text.secondary" align="center">
                        © 2025 Preschool ERP System. All rights reserved.
                    </Typography>
                </Box>
            </Box>
        </Container>
    );
};

export default Verify2FAPage;
