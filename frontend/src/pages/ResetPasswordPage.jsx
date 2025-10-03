/**
 * Reset Password Page
 * Final step of password reset process - set new password
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
    Stepper,
    Step,
    StepLabel,
    InputAdornment,
    IconButton
} from '@mui/material';
import {
    Lock as LockIcon,
    Visibility,
    VisibilityOff,
    CheckCircle as CheckIcon,
    ArrowBack as BackIcon
} from '@mui/icons-material';
import passwordResetAPI from '../services/passwordResetApi';
import PasswordStrengthIndicator from '../components/PasswordStrengthIndicator';

const ResetPasswordPage = () => {
    const navigate = useNavigate();
    const location = useLocation();

    // Get data from previous step
    const { email, resetToken, resetId, userName } = location.state || {};

    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Form validation states
    const [passwordError, setPasswordError] = useState('');
    const [confirmPasswordError, setConfirmPasswordError] = useState('');

    // Password validation
    const passwordValidation = passwordResetAPI.validatePassword(newPassword);

    // Redirect if no required data
    useEffect(() => {
        if (!email || !resetToken || !resetId) {
            navigate('/forgot-password');
        }
    }, [email, resetToken, resetId, navigate]);

    const validateForm = () => {
        let isValid = true;

        // Validate new password
        if (!passwordValidation.valid) {
            setPasswordError(passwordValidation.error);
            isValid = false;
        } else {
            setPasswordError('');
        }

        // Validate password confirmation
        if (!confirmPassword) {
            setConfirmPasswordError('Please confirm your password');
            isValid = false;
        } else if (newPassword !== confirmPassword) {
            setConfirmPasswordError('Passwords do not match');
            isValid = false;
        } else {
            setConfirmPasswordError('');
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
            const result = await passwordResetAPI.resetPassword(
                email,
                newPassword,
                resetToken,
                resetId
            );

            if (result.success) {
                setSuccess(result.data.message);

                // Redirect to login after success
                setTimeout(() => {
                    navigate('/login', {
                        state: {
                            message: 'Password reset successful! Please log in with your new password.',
                            email: email
                        }
                    });
                }, 3000);
            } else {
                setError(result.error);
            }

        } catch (error) {
            console.error('Password reset error:', error);
            setError('An unexpected error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordChange = (e) => {
        setNewPassword(e.target.value);
        if (passwordError) {
            setPasswordError('');
        }
        if (error) {
            setError('');
        }
        // Clear confirm password error if passwords now match
        if (confirmPasswordError && e.target.value === confirmPassword) {
            setConfirmPasswordError('');
        }
    };

    const handleConfirmPasswordChange = (e) => {
        setConfirmPassword(e.target.value);
        if (confirmPasswordError) {
            setConfirmPasswordError('');
        }
        if (error) {
            setError('');
        }
    };

    const handleBackToVerification = () => {
        navigate('/verify-reset-code', {
            state: { email, resetId }
        });
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
                        <LockIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
                        <Typography component="h1" variant="h4" gutterBottom>
                            Set New Password
                        </Typography>
                        <Typography variant="body1" color="text.secondary">
                            {userName ? `Welcome back, ${userName}!` : 'Welcome back!'} Create a strong new password for your account.
                        </Typography>
                    </Box>

                    {/* Progress Stepper */}
                    <Stepper activeStep={2} sx={{ mb: 4 }}>
                        {steps.map((label) => (
                            <Step key={label}>
                                <StepLabel>{label}</StepLabel>
                            </Step>
                        ))}
                    </Stepper>

                    {/* Success Message */}
                    {success && (
                        <Alert severity="success" sx={{ mb: 3 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <CheckIcon sx={{ mr: 1 }} />
                                <Box>
                                    <Typography variant="body2">
                                        {success}
                                    </Typography>
                                    <Typography variant="body2" sx={{ mt: 1, fontWeight: 'bold' }}>
                                        Redirecting to login page...
                                    </Typography>
                                </Box>
                            </Box>
                        </Alert>
                    )}

                    {/* Error Message */}
                    {error && (
                        <Alert severity="error" sx={{ mb: 3 }}>
                            {error}
                        </Alert>
                    )}

                    {/* Form */}
                    <Box component="form" onSubmit={handleSubmit}>
                        {/* New Password Field */}
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            id="newPassword"
                            label="New Password"
                            name="newPassword"
                            type={showPassword ? 'text' : 'password'}
                            value={newPassword}
                            onChange={handlePasswordChange}
                            error={!!passwordError}
                            helperText={passwordError}
                            disabled={loading || !!success}
                            InputProps={{
                                startAdornment: <LockIcon sx={{ color: 'text.secondary', mr: 1 }} />,
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton
                                            aria-label="toggle password visibility"
                                            onClick={() => setShowPassword(!showPassword)}
                                            edge="end"
                                            disabled={loading || !!success}
                                        >
                                            {showPassword ? <VisibilityOff /> : <Visibility />}
                                        </IconButton>
                                    </InputAdornment>
                                )
                            }}
                            sx={{ mb: 1 }}
                        />

                        {/* Password Strength Indicator */}
                        {newPassword && (
                            <PasswordStrengthIndicator
                                password={newPassword}
                                validation={passwordValidation}
                            />
                        )}

                        {/* Confirm Password Field */}
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            id="confirmPassword"
                            label="Confirm New Password"
                            name="confirmPassword"
                            type={showConfirmPassword ? 'text' : 'password'}
                            value={confirmPassword}
                            onChange={handleConfirmPasswordChange}
                            error={!!confirmPasswordError}
                            helperText={confirmPasswordError}
                            disabled={loading || !!success}
                            InputProps={{
                                startAdornment: <LockIcon sx={{ color: 'text.secondary', mr: 1 }} />,
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton
                                            aria-label="toggle confirm password visibility"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            edge="end"
                                            disabled={loading || !!success}
                                        >
                                            {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                                        </IconButton>
                                    </InputAdornment>
                                )
                            }}
                            sx={{ mb: 2 }}
                        />

                        {/* Password Match Indicator */}
                        {confirmPassword && (
                            <Box sx={{ mb: 2 }}>
                                {newPassword === confirmPassword ? (
                                    <Alert severity="success" sx={{ py: 0.5 }}>
                                        <Typography variant="body2">
                                            ✓ Passwords match
                                        </Typography>
                                    </Alert>
                                ) : (
                                    <Alert severity="warning" sx={{ py: 0.5 }}>
                                        <Typography variant="body2">
                                            ⚠ Passwords do not match
                                        </Typography>
                                    </Alert>
                                )}
                            </Box>
                        )}

                        {/* Security Info */}
                        <Box sx={{
                            mb: 3,
                            p: 2,
                            bgcolor: 'success.50',
                            borderRadius: 1,
                            border: '1px solid',
                            borderColor: 'success.200'
                        }}>
                            <Typography variant="body2" color="success.main">
                                <strong>Security Tips:</strong>
                                <br />• Use a unique password you haven't used before
                                <br />• Consider using a password manager
                                <br />• Keep your password secure and don't share it
                            </Typography>
                        </Box>

                        {/* Submit Button */}
                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            size="large"
                            disabled={!passwordValidation.valid || newPassword !== confirmPassword || loading || !!success}
                            startIcon={loading ? <CircularProgress size={20} /> : <CheckIcon />}
                            sx={{ mb: 3, py: 1.5 }}
                        >
                            {loading ? 'Updating Password...' : 'Update Password'}
                        </Button>

                        {/* Back to Verification */}
                        <Box sx={{ textAlign: 'center' }}>
                            <Link
                                component="button"
                                variant="body2"
                                onClick={handleBackToVerification}
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
                                Back to Verification
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

export default ResetPasswordPage;