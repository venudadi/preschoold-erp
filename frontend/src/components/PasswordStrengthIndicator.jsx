/**
 * Password Strength Indicator Component
 * Shows real-time password strength feedback
 */

import React from 'react';
import { Box, LinearProgress, Typography, Chip } from '@mui/material';
import {
    CheckCircle as CheckIcon,
    Cancel as CancelIcon,
    Security as SecurityIcon
} from '@mui/icons-material';

const PasswordStrengthIndicator = ({ password, validation }) => {
    const { strength = 0, strengthText = 'Very Weak', valid } = validation || {};

    // Color mapping for strength levels
    const getStrengthColor = (strength) => {
        switch (strength) {
            case 0:
            case 1:
                return 'error';
            case 2:
                return 'warning';
            case 3:
                return 'info';
            case 4:
                return 'primary';
            case 5:
                return 'success';
            default:
                return 'error';
        }
    };

    // Progress value calculation
    const progressValue = (strength / 5) * 100;

    // Password requirements
    const requirements = [
        {
            label: 'At least 8 characters',
            met: password.length >= 8,
            icon: password.length >= 8 ? <CheckIcon color="success" /> : <CancelIcon color="error" />
        },
        {
            label: 'One lowercase letter',
            met: /[a-z]/.test(password),
            icon: /[a-z]/.test(password) ? <CheckIcon color="success" /> : <CancelIcon color="error" />
        },
        {
            label: 'One uppercase letter',
            met: /[A-Z]/.test(password),
            icon: /[A-Z]/.test(password) ? <CheckIcon color="success" /> : <CancelIcon color="error" />
        },
        {
            label: 'One number',
            met: /\d/.test(password),
            icon: /\d/.test(password) ? <CheckIcon color="success" /> : <CancelIcon color="error" />
        },
        {
            label: 'One special character (recommended)',
            met: /[^a-zA-Z\d]/.test(password),
            icon: /[^a-zA-Z\d]/.test(password) ? <CheckIcon color="success" /> : <CancelIcon color="disabled" />,
            optional: true
        }
    ];

    if (!password) {
        return null;
    }

    return (
        <Box sx={{ mt: 2, mb: 1 }}>
            {/* Strength Indicator */}
            <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" color="textSecondary">
                        Password Strength
                    </Typography>
                    <Chip
                        size="small"
                        label={strengthText}
                        color={getStrengthColor(strength)}
                        icon={<SecurityIcon />}
                        sx={{ fontSize: '0.75rem' }}
                    />
                </Box>
                <LinearProgress
                    variant="determinate"
                    value={progressValue}
                    color={getStrengthColor(strength)}
                    sx={{
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: 'rgba(0, 0, 0, 0.1)',
                        '& .MuiLinearProgress-bar': {
                            borderRadius: 4,
                        }
                    }}
                />
            </Box>

            {/* Requirements List */}
            <Box sx={{ mt: 2 }}>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                    Password Requirements:
                </Typography>
                {requirements.map((requirement, index) => (
                    <Box
                        key={index}
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            mb: 0.5,
                            opacity: requirement.optional && !requirement.met ? 0.6 : 1
                        }}
                    >
                        <Box sx={{ mr: 1, fontSize: '1rem' }}>
                            {requirement.icon}
                        </Box>
                        <Typography
                            variant="body2"
                            sx={{
                                color: requirement.met
                                    ? 'success.main'
                                    : requirement.optional
                                        ? 'text.disabled'
                                        : 'error.main',
                                fontSize: '0.875rem'
                            }}
                        >
                            {requirement.label}
                        </Typography>
                    </Box>
                ))}
            </Box>

            {/* Validation Message */}
            {!valid && password.length > 0 && (
                <Box sx={{ mt: 1, p: 1, bgcolor: 'error.50', borderRadius: 1, border: '1px solid', borderColor: 'error.200' }}>
                    <Typography variant="body2" color="error.main">
                        {validation?.error || 'Password does not meet minimum requirements'}
                    </Typography>
                </Box>
            )}

            {/* Success Message */}
            {valid && (
                <Box sx={{ mt: 1, p: 1, bgcolor: 'success.50', borderRadius: 1, border: '1px solid', borderColor: 'success.200' }}>
                    <Typography variant="body2" color="success.main">
                        ✓ Password meets security requirements
                    </Typography>
                </Box>
            )}
        </Box>
    );
};

export default PasswordStrengthIndicator;