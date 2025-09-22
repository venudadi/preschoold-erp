
import React from 'react';
import { Typography, Box, Skeleton, Button } from '@mui/material';
import '../modern-theme.css';

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
        <div className="glass-card" style={{ minHeight: height + 100, display: 'flex', flexDirection: 'column', padding: 24, marginBottom: 24 }}>
            {/* Chart header */}
            <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'flex-start',
                mb: 2,
                minHeight: 40
            }}>
                <Box>
                    <Typography variant="h6" component="h3" fontWeight="bold" className="gradient-text" gutterBottom>
                        {title}
                    </Typography>
                    {subtitle && (
                        <Typography variant="body2" color="var(--color-muted)">
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
                        <Skeleton variant="rectangular" height={height - 20} sx={{ borderRadius: 1, bgcolor: 'rgba(255,255,255,0.08)' }} />
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
                        color: 'var(--color-danger)'
                    }}>
                        <Typography variant="h6">⚠️</Typography>
                        <Typography variant="body2" style={{ color: 'var(--color-danger)' }} textAlign="center">
                            {error}
                        </Typography>
                        {onRetry && (
                            <Button variant="outlined" style={{ borderColor: 'var(--color-danger)', color: 'var(--color-danger)' }} size="small" onClick={onRetry}>
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
                        color: 'var(--color-muted)'
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
        </div>
    );
};

export default ChartContainer;