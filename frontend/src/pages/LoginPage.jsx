import React, { useState, useEffect } from 'react';
import { Button, TextField, Box, Typography, Container, Link, Alert, Paper, InputAdornment, IconButton } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { loginUser } from '../services/api';
import { School, Email, Lock, Visibility, VisibilityOff } from '@mui/icons-material';

const LoginPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    // Handle success message from password reset
    useEffect(() => {
        if (location.state?.message) {
            setSuccessMessage(location.state.message);
            if (location.state?.email) {
                setEmail(location.state.email);
            }
        }
    }, [location]);

    const handleLogin = async (e) => {
        // Prevent the browser from reloading the page
        e.preventDefault();

        // Clear any previous error messages
        setError('');
        setSuccessMessage('');

        try {
            // Call the login function from our API service
            const data = await loginUser(email, password);

            // Check if 2FA is required
            if (data.require2FA) {
                // Redirect to 2FA verification page
                navigate('/verify-2fa', {
                    state: {
                        sessionToken: data.sessionToken,
                        expiresIn: data.expiresIn || 600
                    }
                });
                return;
            }

            // If successful (no 2FA), store all tokens and user info
            localStorage.setItem('token', data.token);
            localStorage.setItem('sessionToken', data.sessionToken);
            localStorage.setItem('csrfToken', data.csrfToken);
            if (data.refreshToken) {
                localStorage.setItem('refreshToken', data.refreshToken);
            }
            localStorage.setItem('user', JSON.stringify(data.user));

            // Redirect the user to the main dashboard page
            navigate('/');

        } catch (err) {
            // If the API call fails, display the error message
            console.error('Login failed:', err);
            setError(err.message || 'An error occurred. Please try again.');
        }
    };

    return (
        <Box
            sx={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                position: 'relative',
                overflow: 'hidden',
                '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%)',
                    pointerEvents: 'none',
                }
            }}
        >
            <Container component="main" maxWidth="xs">
                <Paper
                    elevation={24}
                    sx={{
                        p: 4,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        borderRadius: 4,
                        background: 'rgba(255, 255, 255, 0.95)',
                        backdropFilter: 'blur(10px)',
                        position: 'relative',
                        zIndex: 1,
                    }}
                >
                    <Box
                        sx={{
                            width: 80,
                            height: 80,
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            mb: 2,
                            boxShadow: '0 8px 16px rgba(102, 126, 234, 0.3)',
                        }}
                    >
                        <School sx={{ fontSize: 48, color: 'white' }} />
                    </Box>

                    <Typography
                        component="h1"
                        variant="h4"
                        sx={{
                            mb: 1,
                            fontWeight: 700,
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                        }}
                    >
                        Welcome Back
                    </Typography>

                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        Sign in to access your preschool dashboard
                    </Typography>

                    <Box component="form" onSubmit={handleLogin} noValidate sx={{ width: '100%' }}>
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            id="email"
                            label="Email Address"
                            name="email"
                            autoComplete="email"
                            autoFocus
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <Email sx={{ color: '#667eea' }} />
                                    </InputAdornment>
                                ),
                            }}
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    '&:hover fieldset': {
                                        borderColor: '#667eea',
                                    },
                                    '&.Mui-focused fieldset': {
                                        borderColor: '#667eea',
                                    },
                                },
                            }}
                        />
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            name="password"
                            label="Password"
                            type={showPassword ? 'text' : 'password'}
                            id="password"
                            autoComplete="current-password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <Lock sx={{ color: '#667eea' }} />
                                    </InputAdornment>
                                ),
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton
                                            onClick={() => setShowPassword(!showPassword)}
                                            edge="end"
                                        >
                                            {showPassword ? <VisibilityOff /> : <Visibility />}
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    '&:hover fieldset': {
                                        borderColor: '#667eea',
                                    },
                                    '&.Mui-focused fieldset': {
                                        borderColor: '#667eea',
                                    },
                                },
                            }}
                        />

                        {/* Display success message if exists */}
                        {successMessage && (
                            <Alert
                                severity="success"
                                sx={{
                                    mt: 2,
                                    mb: 1,
                                    borderRadius: 2,
                                }}
                            >
                                {successMessage}
                            </Alert>
                        )}

                        {/* Display the error message if it exists */}
                        {error && (
                            <Alert
                                severity="error"
                                sx={{
                                    mt: 2,
                                    mb: 1,
                                    borderRadius: 2,
                                }}
                            >
                                {error}
                            </Alert>
                        )}

                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            sx={{
                                mt: 3,
                                mb: 2,
                                py: 1.5,
                                borderRadius: 2,
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                fontSize: '1.1rem',
                                fontWeight: 600,
                                textTransform: 'none',
                                boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
                                transition: 'all 0.3s ease',
                                '&:hover': {
                                    background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
                                    boxShadow: '0 6px 20px rgba(102, 126, 234, 0.6)',
                                    transform: 'translateY(-2px)',
                                }
                            }}
                        >
                            Sign In
                        </Button>

                        {/* Forgot Password Link */}
                        <Box sx={{ textAlign: 'center' }}>
                            <Link
                                component="button"
                                variant="body2"
                                onClick={(e) => {
                                    e.preventDefault();
                                    navigate('/forgot-password');
                                }}
                                sx={{
                                    color: '#667eea',
                                    textDecoration: 'none',
                                    fontWeight: 500,
                                    transition: 'all 0.2s ease',
                                    '&:hover': {
                                        textDecoration: 'underline',
                                        color: '#764ba2',
                                    }
                                }}
                            >
                                Forgot your password?
                            </Link>
                        </Box>
                    </Box>
                </Paper>
            </Container>
        </Box>
    );
};

export default LoginPage;

