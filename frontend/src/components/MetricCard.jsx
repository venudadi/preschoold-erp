

import React from 'react';
import { CardContent, Typography, Box } from '@mui/material';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import '../modern-theme.css';


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
    // Helper for animated number
    return (
        <div className="glass-card glow" style={{ height: '100%' }}>
            <CardContent>
                <Box display="flex" alignItems="center" gap={2}>
                    {icon && (
                        <Box sx={{ fontSize: 40, color: 'var(--color-primary)', filter: 'drop-shadow(0 0 8px var(--color-accent))' }}>
                            {icon}
                        </Box>
                    )}
                    <Box>
                        <Typography variant="h6" className="gradient-text" gutterBottom>
                            {title}
                        </Typography>
                        <Typography variant="h3" fontWeight={700} className="gradient-text" style={{ letterSpacing: 1 }}>
                            <AnimatedNumber value={value} format={format} loading={loading} />
                        </Typography>
                        {subtitle && (
                            <Typography variant="body2" color="var(--color-muted)">
                                {subtitle}
                            </Typography>
                        )}
                    </Box>
                </Box>
                {/* Trend and progress */}
                <Box mt={2} display="flex" alignItems="center" gap={2}>
                    {progressValue !== null && (
                        <Box width={48} height={48}>
                            <CircularProgressbar
                                value={progressValue}
                                maxValue={maxValue || 100}
                                text={`${progressValue}%`}
                                styles={buildStyles({
                                    pathColor: 'var(--color-primary)',
                                    textColor: 'var(--color-primary)',
                                    trailColor: '#222b3a',
                                    backgroundColor: 'transparent'
                                })}
                            />
                        </Box>
                    )}
                    {trend && (
                        <Typography style={{ color: trend.isPositive ? 'var(--color-success)' : 'var(--color-danger)', fontWeight: 600 }}>
                            {trend.isPositive ? '+' : '-'}{trend.value}%
                        </Typography>
                    )}
                </Box>
            </CardContent>
        </div>
    );
};

// Animated number for futuristic effect
function AnimatedNumber({ value, format, loading }) {
    const [display, setDisplay] = React.useState(0);
    React.useEffect(() => {
        if (loading || value == null) return;
        let start = display;
        let end = typeof value === 'number' ? value : 0;
        if (start === end) return;
        let frame;
        const duration = 800;
        const startTime = performance.now();
        function animate(now) {
            const progress = Math.min((now - startTime) / duration, 1);
            setDisplay(start + (end - start) * progress);
            if (progress < 1) frame = requestAnimationFrame(animate);
            else setDisplay(end);
        }
        frame = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(frame);
        // eslint-disable-next-line
    }, [value, loading]);
    if (loading || value == null) return '...';
    switch (format) {
        case 'currency':
            return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Math.round(display));
        case 'percentage':
            return `${Math.round(display)}%`;
        default:
            return Math.round(display).toLocaleString('en-IN');
    }
}

export default MetricCard;