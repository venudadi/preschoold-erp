/**
 * Forgot Password Page
 * First step of password reset process - email input
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
    StepLabel
} from '@mui/material';
import {
    Email as EmailIcon,
    ArrowBack as BackIcon,
    Send as SendIcon
} from '@mui/icons-material';
import passwordResetAPI from '../services/passwordResetApi';

const ForgotPasswordPage = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Form validation
    const [emailError, setEmailError] = useState('');

    const validateForm = () => {
        let isValid = true;

        // Validate email
        const emailValidation = passwordResetAPI.validateEmail(email);
        if (!emailValidation.valid) {
            setEmailError(emailValidation.error);
            isValid = false;
        } else {
            setEmailError('');
        }

        return isValid;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!validateForm()) {
            return;
        }

        setLoading(true);

        try {
            const result = await passwordResetAPI.requestPasswordReset(email);

            if (result.success) {
                setSuccess(result.data.message);

                // Navigate to verification page after a short delay
                setTimeout(() => {
                    navigate('/verify-reset-code', {
                        state: {
                            email: email,
                            resetId: result.resetId,
                            maskedEmail: result.maskedEmail
                        }
                    });
                }, 2000);
            } else {
                setError(result.error);
            }

        } catch (error) {
            console.error('Forgot password error:', error);
            setError('An unexpected error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleBackToLogin = () => {
        navigate('/login');
    };

    const handleEmailChange = (e) => {
        setEmail(e.target.value);
        if (emailError) {
            setEmailError('');
        }
        if (error) {
            setError('');
        }
    };

    const steps = ['Enter Email', 'Verify Code', 'Reset Password'];

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
                        <EmailIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
                        <Typography component="h1" variant="h4" gutterBottom>
                            Forgot Password?
                        </Typography>
                        <Typography variant="body1" color="text.secondary">
                            Enter your email address and we'll send you a verification code to reset your password.
                        </Typography>
                    </Box>

                    {/* Progress Stepper */}
                    <Stepper activeStep={0} sx={{ mb: 4 }}>
                        {steps.map((label) => (
                            <Step key={label}>
                                <StepLabel>{label}</StepLabel>
                            </Step>
                        ))}
                    </Stepper>

                    {/* Success Message */}
                    {success && (
                        <Alert severity="success" sx={{ mb: 3 }}>
                            <Typography variant="body2">
                                {success}
                            </Typography>
                            <Typography variant="body2" sx={{ mt: 1, fontWeight: 'bold' }}>
                                Redirecting to verification page...
                            </Typography>
                        </Alert>
                    )}

                    {/* Error Message */}
                    {error && (
                        <Alert severity="error" sx={{ mb: 3 }}>
                            {error}
                        </Alert>
                    )}

                    {/* Form */}
                    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            id="email"
                            label="Email Address"
                            name="email"
                            autoComplete="email"
                            autoFocus
                            type="email"
                            value={email}
                            onChange={handleEmailChange}
                            error={!!emailError}
                            helperText={emailError}
                            disabled={loading || !!success}
                            InputProps={{
                                startAdornment: <EmailIcon sx={{ color: 'text.secondary', mr: 1 }} />
                            }}
                            sx={{ mb: 2 }}
                        />

                        {/* Info Box */}
                        <Box sx={{
                            mb: 3,
                            p: 2,
                            bgcolor: 'info.50',
                            borderRadius: 1,
                            border: '1px solid',
                            borderColor: 'info.200'
                        }}>
                            <Typography variant="body2" color="info.main">
                                <strong>Important:</strong> If you don't have an account or can't remember your email,
                                please contact your center administrator for assistance.
                            </Typography>
                        </Box>

                        {/* Submit Button */}
                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            size="large"
                            disabled={loading || !!success}
                            startIcon={loading ? <CircularProgress size={20} /> : <SendIcon />}
                            sx={{ mb: 3, py: 1.5 }}
                        >
                            {loading ? 'Sending...' : 'Send Verification Code'}
                        </Button>

                        {/* Back to Login */}
                        <Box sx={{ textAlign: 'center' }}>
                            <Link
                                component="button"
                                variant="body2"
                                onClick={handleBackToLogin}
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

export default ForgotPasswordPage;