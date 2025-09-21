import React from 'react';
import { Paper, Typography, Box, CircularProgress, useTheme, Skeleton, Button } from '@mui/material';

const ChartContainer = ({ 
    title, 
    children, 
    loading = false, 
    error = null,
    height = 300,
    actions = null,
    subtitle = null,
    empty = false,
    emptyMessage = 'No data available for the selected filters.',
    onRetry = null
}) => {
    const theme = useTheme();

    return (
        <Paper 
            elevation={2} 
            sx={{ 
                p: 3, 
                height: height + 100, // Add space for header
                display: 'flex',
                flexDirection: 'column',
                transition: 'all 0.3s ease-in-out',
                '&:hover': {
                    boxShadow: 4
                }
            }}
        >
            {/* Chart header */}
            <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'flex-start',
                mb: 2,
                minHeight: 40
            }}>
                <Box>
                    <Typography variant="h6" component="h3" fontWeight="bold" gutterBottom>
                        {title}
                    </Typography>
                    {subtitle && (
                        <Typography variant="body2" color="text.secondary">
                            {subtitle}
                        </Typography>
                    )}
                </Box>
                {actions && (
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        {actions}
                    </Box>
                )}
            </Box>

            {/* Chart content */}
            <Box sx={{ 
                flexGrow: 1, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                position: 'relative',
                height: height
            }}>
                {loading ? (
                    <Box sx={{ width: '100%' }}>
                        <Skeleton variant="rectangular" height={height - 20} sx={{ borderRadius: 1 }} />
                        <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                            <Skeleton variant="text" width={120} />
                            <Skeleton variant="text" width={80} />
                        </Box>
                    </Box>
                ) : error ? (
                    <Box sx={{ 
                        display: 'flex', 
                        flexDirection: 'column', 
                        alignItems: 'center', 
                        gap: 2,
                        color: 'error.main'
                    }}>
                        <Typography variant="h6">⚠️</Typography>
                        <Typography variant="body2" color="error" textAlign="center">
                            {error}
                        </Typography>
                        {onRetry && (
                            <Button variant="outlined" color="error" size="small" onClick={onRetry}>
                                Retry
                            </Button>
                        )}
                    </Box>
                ) : empty ? (
                    <Box sx={{ 
                        display: 'flex', 
                        flexDirection: 'column', 
                        alignItems: 'center', 
                        gap: 1,
                        color: 'text.secondary'
                    }}>
                        <Typography variant="h6">No Data</Typography>
                        <Typography variant="body2" textAlign="center">
                            {emptyMessage}
                        </Typography>
                    </Box>
                ) : (
                    <Box sx={{ width: '100%', height: '100%' }}>
                        {children}
                    </Box>
                )}
            </Box>
        </Paper>
    );
};

export default ChartContainer;