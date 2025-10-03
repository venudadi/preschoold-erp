/**
 * Verify Reset Code Page
 * Second step of password reset process - challenge code verification
 */

import React, { useState, useEffect, useRef } from 'react';
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
    Stepper,
    Step,
    StepLabel,
    Chip
} from '@mui/material';
import {
    Security as SecurityIcon,
    ArrowBack as BackIcon,
    Refresh as RefreshIcon,
    CheckCircle as CheckIcon
} from '@mui/icons-material';
import passwordResetAPI from '../services/passwordResetApi';

const VerifyResetCodePage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const inputRefs = useRef([]);

    // Get data from previous step
    const { email, resetId, maskedEmail } = location.state || {};

    const [code, setCode] = useState(['', '', '', '', '', '']);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [timeLeft, setTimeLeft] = useState(900); // 15 minutes in seconds
    const [canResend, setCanResend] = useState(false);

    // Countdown timer
    useEffect(() => {
        if (timeLeft > 0) {
            const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
            return () => clearTimeout(timer);
        } else {
            setCanResend(true);
        }
    }, [timeLeft]);

    // Redirect if no email or resetId
    useEffect(() => {
        if (!email || !resetId) {
            navigate('/forgot-password');
        }
    }, [email, resetId, navigate]);

    // Focus first input on mount
    useEffect(() => {
        if (inputRefs.current[0]) {
            inputRefs.current[0].focus();
        }
    }, []);

    const formatTime = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    const handleCodeChange = (index, value) => {
        // Only allow alphanumeric characters
        const sanitizedValue = value.toUpperCase().replace(/[^A-Z0-9]/g, '');

        if (sanitizedValue.length <= 1) {
            const newCode = [...code];
            newCode[index] = sanitizedValue;
            setCode(newCode);

            // Auto-focus next input
            if (sanitizedValue && index < 5) {
                inputRefs.current[index + 1]?.focus();
            }

            // Clear error when user starts typing
            if (error) {
                setError('');
            }
        }
    };

    const handleKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !code[index] && index > 0) {
            // Focus previous input on backspace
            inputRefs.current[index - 1]?.focus();
        } else if (e.key === 'ArrowLeft' && index > 0) {
            inputRefs.current[index - 1]?.focus();
        } else if (e.key === 'ArrowRight' && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const pasteData = e.clipboardData.getData('text').toUpperCase().replace(/[^A-Z0-9]/g, '');

        if (pasteData.length === 6) {
            const newCode = pasteData.split('');
            setCode(newCode);
            inputRefs.current[5]?.focus(); // Focus last input
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        const challengeCode = code.join('');

        // Validate code
        const validation = passwordResetAPI.validateChallengeCode(challengeCode);
        if (!validation.valid) {
            setError(validation.error);
            return;
        }

        setLoading(true);

        try {
            const result = await passwordResetAPI.verifyResetCode(email, challengeCode, resetId);

            if (result.success) {
                setSuccess('Code verified successfully! Redirecting...');

                setTimeout(() => {
                    navigate('/reset-password', {
                        state: {
                            email: email,
                            resetToken: result.resetToken,
                            resetId: resetId,
                            userName: result.userName
                        }
                    });
                }, 1500);
            } else {
                setError(result.error);
            }

        } catch (error) {
            console.error('Code verification error:', error);
            setError('An unexpected error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleResendCode = async () => {
        setLoading(true);
        setError('');

        try {
            const result = await passwordResetAPI.requestPasswordReset(email);

            if (result.success) {
                setSuccess('New verification code sent to your email!');
                setTimeLeft(900); // Reset timer
                setCanResend(false);
                setCode(['', '', '', '', '', '']); // Clear current code
                inputRefs.current[0]?.focus();
            } else {
                setError(result.error);
            }

        } catch (error) {
            console.error('Resend code error:', error);
            setError('Failed to resend code. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleBackToEmail = () => {
        navigate('/forgot-password');
    };

    const steps = ['Enter Email', 'Verify Code', 'Reset Password'];
    const isCodeComplete = code.every(digit => digit !== '');

    return (
        <Container component="main" maxWidth="sm">
            <Box
                sx={{
                    marginTop: 4,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    minHeight: '100vh'
                }}
            >
                <Paper elevation={3} sx={{ padding: 4, width: '100%', maxWidth: 500 }}>
                    {/* Header */}
                    <Box sx={{ mb: 4, textAlign: 'center' }}>
                        <SecurityIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
                        <Typography component="h1" variant="h4" gutterBottom>
                            Enter Verification Code
                        </Typography>
                        <Typography variant="body1" color="text.secondary">
                            We've sent a 6-character code to
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                            {maskedEmail || email}
                        </Typography>
                    </Box>

                    {/* Progress Stepper */}
                    <Stepper activeStep={1} sx={{ mb: 4 }}>
                        {steps.map((label) => (
                            <Step key={label}>
                                <StepLabel>{label}</StepLabel>
                            </Step>
                        ))}
                    </Stepper>

                    {/* Timer */}
                    <Box sx={{ textAlign: 'center', mb: 3 }}>
                        <Chip
                            label={`Code expires in ${formatTime(timeLeft)}`}
                            color={timeLeft < 300 ? 'error' : 'primary'}
                            variant="outlined"
                            sx={{ fontSize: '0.875rem' }}
                        />
                    </Box>

                    {/* Success Message */}
                    {success && (
                        <Alert severity="success" sx={{ mb: 3 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <CheckIcon sx={{ mr: 1 }} />
                                {success}
                            </Box>
                        </Alert>
                    )}

                    {/* Error Message */}
                    {error && (
                        <Alert severity="error" sx={{ mb: 3 }}>
                            {error}
                        </Alert>
                    )}

                    {/* Code Input Form */}
                    <Box component="form" onSubmit={handleSubmit}>
                        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mb: 3 }}>
                            {code.map((digit, index) => (
                                <TextField
                                    key={index}
                                    inputRef={el => inputRefs.current[index] = el}
                                    value={digit}
                                    onChange={(e) => handleCodeChange(index, e.target.value)}
                                    onKeyDown={(e) => handleKeyDown(index, e)}
                                    onPaste={index === 0 ? handlePaste : undefined}
                                    inputProps={{
                                        maxLength: 1,
                                        style: {
                                            textAlign: 'center',
                                            fontSize: '1.5rem',
                                            fontWeight: 'bold',
                                            letterSpacing: '0.1em'
                                        }
                                    }}
                                    sx={{
                                        width: 60,
                                        '& .MuiOutlinedInput-root': {
                                            '&.Mui-focused fieldset': {
                                                borderColor: 'primary.main',
                                                borderWidth: 2
                                            }
                                        }
                                    }}
                                    disabled={loading || !!success}
                                />
                            ))}
                        </Box>

                        {/* Info */}
                        <Box sx={{
                            mb: 3,
                            p: 2,
                            bgcolor: 'info.50',
                            borderRadius: 1,
                            border: '1px solid',
                            borderColor: 'info.200'
                        }}>
                            <Typography variant="body2" color="info.main">
                                <strong>Tip:</strong> Check your spam folder if you don't see the email.
                                The code is case-insensitive and expires in 15 minutes.
                            </Typography>
                        </Box>

                        {/* Submit Button */}
                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            size="large"
                            disabled={!isCodeComplete || loading || !!success || timeLeft === 0}
                            startIcon={loading ? <CircularProgress size={20} /> : <CheckIcon />}
                            sx={{ mb: 2, py: 1.5 }}
                        >
                            {loading ? 'Verifying...' : 'Verify Code'}
                        </Button>

                        {/* Resend Button */}
                        <Button
                            fullWidth
                            variant="outlined"
                            size="large"
                            disabled={!canResend || loading || !!success}
                            startIcon={<RefreshIcon />}
                            onClick={handleResendCode}
                            sx={{ mb: 3, py: 1.5 }}
                        >
                            Send New Code
                        </Button>

                        {/* Back to Email */}
                        <Box sx={{ textAlign: 'center' }}>
                            <Link
                                component="button"
                                variant="body2"
                                onClick={handleBackToEmail}
                                disabled={loading}
                                sx={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    textDecoration: 'none',
                                    '&:hover': {
                                        textDecoration: 'underline'
                                    }
                                }}
                            >
                                <BackIcon sx={{ fontSize: 16, mr: 0.5 }} />
                                Change Email Address
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

export default VerifyResetCodePage;