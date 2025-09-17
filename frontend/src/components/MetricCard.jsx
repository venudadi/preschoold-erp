import React from 'react';
import { Card, CardContent, Typography, Box, CircularProgress } from '@mui/material';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';

const MetricCard = ({ 
    title, 
    value, 
    subtitle, 
    icon, 
    color = 'primary', 
    loading = false,
    trend = null, // { value: 12, isPositive: true }
    progressValue = null, // For circular progress (0-100)
    maxValue = null,
    format = 'number' // 'number', 'currency', 'percentage'
}) => {
    const formatValue = (val) => {
        if (loading || val === null || val === undefined) return '...';
        
        switch (format) {
            case 'currency':
                return new Intl.NumberFormat('en-IN', {
                    style: 'currency',
                    currency: 'INR',
                    maximumFractionDigits: 0
                }).format(val);
            case 'percentage':
                return `${val}%`;
            default:
                return typeof val === 'number' ? val.toLocaleString('en-IN') : val;
        }
    };

    const getColorValue = (colorName) => {
        const colors = {
            primary: '#1976d2',
            secondary: '#dc004e',
            success: '#2e7d32',
            warning: '#ed6c02',
            error: '#d32f2f',
            info: '#0288d1'
        };
        return colors[colorName] || colors.primary;
    };

    return (
        <Card 
            sx={{ 
                height: '100%',
                background: `linear-gradient(135deg, ${getColorValue(color)}15, ${getColorValue(color)}05)`,
                border: `1px solid ${getColorValue(color)}20`,
                transition: 'all 0.3s ease-in-out',
                '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: 3,
                    borderColor: `${getColorValue(color)}40`
                }
            }}
        >
            <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                {/* Header with icon and title */}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="h6" component="h2" color="text.secondary" fontWeight="medium">
                        {title}
                    </Typography>
                    {icon && (
                        <Box sx={{ color: getColorValue(color), fontSize: 28 }}>
                            {icon}
                        </Box>
                    )}
                </Box>

                {/* Main value */}
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    {loading ? (
                        <CircularProgress size={24} />
                    ) : progressValue !== null ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                            <Box sx={{ width: 60, height: 60 }}>
                                <CircularProgressbar
                                    value={progressValue}
                                    text={formatValue(value)}
                                    styles={buildStyles({
                                        textSize: '16px',
                                        pathColor: getColorValue(color),
                                        textColor: getColorValue(color),
                                        trailColor: `${getColorValue(color)}20`
                                    })}
                                />
                            </Box>
                            <Box>
                                <Typography variant="h4" component="div" fontWeight="bold" color={getColorValue(color)}>
                                    {formatValue(value)}
                                </Typography>
                                {maxValue && (
                                    <Typography variant="caption" color="text.secondary">
                                        of {formatValue(maxValue)}
                                    </Typography>
                                )}
                            </Box>
                        </Box>
                    ) : (
                        <Typography variant="h3" component="div" fontWeight="bold" color={getColorValue(color)}>
                            {formatValue(value)}
                        </Typography>
                    )}
                </Box>

                {/* Subtitle and trend */}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    {subtitle && (
                        <Typography variant="body2" color="text.secondary">
                            {subtitle}
                        </Typography>
                    )}
                    {trend && (
                        <Box sx={{ 
                            display: 'flex', 
                            alignItems: 'center',
                            color: trend.isPositive ? 'success.main' : 'error.main',
                            fontSize: '0.875rem',
                            fontWeight: 'medium'
                        }}>
                            {trend.isPositive ? '↗' : '↘'} {Math.abs(trend.value)}%
                        </Box>
                    )}
                </Box>
            </CardContent>
        </Card>
    );
};

export default MetricCard;