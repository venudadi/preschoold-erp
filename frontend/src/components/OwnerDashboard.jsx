import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Grid,
    Card,
    CardContent,
    Alert,
    CircularProgress,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Divider,
    Button,
    CardActions,
    Chip
} from '@mui/material';
import {
    BusinessCenter,
    TrendingUp,
    People,
    School,
    Receipt,
    QuestionAnswer,
    Class,
    MonetizationOn,
    Assessment,
    Settings,
    PhotoLibrary
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { getAnalyticsOverview, getAnalyticsCenterComparison, getAnalyticsFinancialOverview } from '../services/api';

const OwnerDashboard = ({ user, ...props }) => {
    const [analytics, setAnalytics] = useState(null);
    const [financial, setFinancial] = useState(null);
    const [centers, setCenters] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setLoading(true);
                const [analyticsData, financialData, centersData] = await Promise.all([
                    getAnalyticsOverview(),
                    getAnalyticsFinancialOverview().catch(() => null),
                    getAnalyticsCenterComparison().catch(() => ({ centers: [] }))
                ]);
                setAnalytics(analyticsData);
                setFinancial(financialData);
                setCenters(centersData?.centers || []);
            } catch (error) {
                console.error('Failed to fetch dashboard data:', error);
                setError(error.message || 'Failed to load dashboard data');
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
                <CircularProgress />
                <Typography sx={{ ml: 2 }}>Loading dashboard...</Typography>
            </Box>
        );
    }

    if (error) {
        return (
            <Alert severity="error" sx={{ mt: 2 }}>
                Error loading dashboard: {error}
            </Alert>
        );
    }

    const businessMetrics = [
        {
            title: 'Monthly Revenue',
            value: financial?.monthly_revenue ? `₹${financial.monthly_revenue}` : `₹${analytics?.monthly_revenue || 0}`,
            icon: <MonetizationOn color="success" />,
            color: '#388e3c'
        },
        {
            title: 'Total Students',
            value: analytics?.total_students || 0,
            icon: <School color="primary" />,
            color: '#1976d2'
        },
        {
            title: 'Active Staff',
            value: analytics?.total_staff || 0,
            icon: <People color="secondary" />,
            color: '#9c27b0'
        },
        {
            title: 'Open Enquiries',
            value: analytics?.open_enquiries || 0,
            icon: <QuestionAnswer color="warning" />,
            color: '#ed6c02'
        },
        {
            title: 'Pending Payments',
            value: analytics?.pending_invoices || 0,
            icon: <Receipt color="error" />,
            color: '#d32f2f'
        },
        {
            title: 'Total Classrooms',
            value: analytics?.total_classrooms || 0,
            icon: <Class color="info" />,
            color: '#0288d1'
        }
    ];

    const businessActions = [
        {
            title: 'Financial Reports',
            description: 'View detailed financial analytics and reports',
            icon: <Assessment />,
            action: () => navigate('/reports'),
            color: 'success'
        },
        {
            title: 'Staff Management',
            description: 'Manage staff, assignments, and payroll',
            icon: <People />,
            action: () => navigate('/staff'),
            color: 'primary'
        },
        {
            title: 'Business Analytics',
            description: 'Track enrollment trends and business metrics',
            icon: <TrendingUp />,
            action: () => navigate('/reports'),
            color: 'secondary'
        },
        {
            title: 'Center Settings',
            description: 'Configure centers and operational settings',
            icon: <Settings />,
            action: () => navigate('/settings'),
            color: 'info'
        },
        {
            title: 'Digital Portfolios',
            description: 'View and manage student portfolios across centers',
            icon: <PhotoLibrary />,
            action: () => navigate('/admin/portfolios'),
            color: 'success'
        }
    ];

    return (
        <Box sx={{ flexGrow: 1, p: 3 }}>
            <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
                <BusinessCenter sx={{ mr: 2, fontSize: 40 }} />
                Owner Dashboard
            </Typography>

            <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
                Welcome, {user?.fullName || 'Business Owner'}
            </Typography>

            {/* Business Metrics */}
            <Typography variant="h5" gutterBottom sx={{ mt: 4, mb: 2 }}>
                Business Overview
            </Typography>
            
            <Grid container spacing={3} sx={{ mb: 4 }}>
                {businessMetrics.map((metric, index) => (
                    <Grid item xs={12} sm={6} md={4} lg={2} key={index}>
                        <Card sx={{ height: '100%', border: `2px solid ${metric.color}20` }}>
                            <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <Box>
                                        <Typography color="textSecondary" gutterBottom variant="body2">
                                            {metric.title}
                                        </Typography>
                                        <Typography variant="h5" component="h2" sx={{ color: metric.color }}>
                                            {metric.value}
                                        </Typography>
                                    </Box>
                                    <Box sx={{ opacity: 0.7 }}>
                                        {metric.icon}
                                    </Box>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            {/* Centers Performance */}
            {centers.length > 0 && (
                <>
                    <Typography variant="h5" gutterBottom sx={{ mt: 4, mb: 2 }}>
                        Centers Performance
                    </Typography>
                    <Grid container spacing={3} sx={{ mb: 4 }}>
                        {centers.map((center, index) => (
                            <Grid item xs={12} md={6} lg={4} key={index}>
                                <Card>
                                    <CardContent>
                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                                            <Typography variant="h6">
                                                {center.name}
                                            </Typography>
                                            <Chip 
                                                label={center.is_active ? 'Active' : 'Inactive'} 
                                                color={center.is_active ? 'success' : 'default'}
                                                size="small"
                                            />
                                        </Box>
                                        <List dense>
                                            <ListItem sx={{ px: 0 }}>
                                                <ListItemIcon sx={{ minWidth: 32 }}>
                                                    <School fontSize="small" />
                                                </ListItemIcon>
                                                <ListItemText primary={`${center.student_count || 0} Students`} />
                                            </ListItem>
                                            <ListItem sx={{ px: 0 }}>
                                                <ListItemIcon sx={{ minWidth: 32 }}>
                                                    <People fontSize="small" />
                                                </ListItemIcon>
                                                <ListItemText primary={`${center.staff_count || 0} Staff`} />
                                            </ListItem>
                                            <ListItem sx={{ px: 0 }}>
                                                <ListItemIcon sx={{ minWidth: 32 }}>
                                                    <Class fontSize="small" />
                                                </ListItemIcon>
                                                <ListItemText primary={`${center.classroom_count || 0} Classrooms`} />
                                            </ListItem>
                                        </List>
                                    </CardContent>
                                    <CardActions>
                                        <Button size="small" onClick={() => navigate('/centers')}>
                                            View Details
                                        </Button>
                                    </CardActions>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                </>
            )}

            {/* Business Management Actions */}
            <Typography variant="h5" gutterBottom sx={{ mt: 4, mb: 2 }}>
                Business Management
            </Typography>
            <Grid container spacing={3} sx={{ mb: 4 }}>
                {businessActions.map((action, index) => (
                    <Grid item xs={12} sm={6} md={3} key={index}>
                        <Card sx={{ height: '100%' }}>
                            <CardContent sx={{ textAlign: 'center' }}>
                                <Box sx={{ mb: 2 }}>
                                    {React.cloneElement(action.icon, { 
                                        sx: { fontSize: 48 }, 
                                        color: action.color 
                                    })}
                                </Box>
                                <Typography variant="h6" gutterBottom>
                                    {action.title}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    {action.description}
                                </Typography>
                            </CardContent>
                            <CardActions sx={{ justifyContent: 'center' }}>
                                <Button 
                                    variant="outlined" 
                                    color={action.color}
                                    onClick={action.action}
                                >
                                    Open
                                </Button>
                            </CardActions>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            {/* Business Insights */}
            <Typography variant="h5" gutterBottom sx={{ mt: 4, mb: 2 }}>
                Key Business Insights
            </Typography>
            <Card>
                <CardContent>
                    <List>
                        {analytics?.open_enquiries > 10 && (
                            <ListItem>
                                <ListItemIcon>
                                    <TrendingUp color="success" />
                                </ListItemIcon>
                                <ListItemText 
                                    primary="High Enquiry Volume"
                                    secondary={`${analytics.open_enquiries} open enquiries - consider expanding capacity`}
                                />
                            </ListItem>
                        )}
                        {analytics?.pending_invoices > 0 && (
                            <>
                                <Divider />
                                <ListItem>
                                    <ListItemIcon>
                                        <Receipt color="warning" />
                                    </ListItemIcon>
                                    <ListItemText 
                                        primary="Outstanding Payments"
                                        secondary={`${analytics.pending_invoices} pending invoices require follow-up`}
                                    />
                                </ListItem>
                            </>
                        )}
                        <Divider />
                        <ListItem>
                            <ListItemIcon>
                                <Assessment color="info" />
                            </ListItemIcon>
                            <ListItemText 
                                primary="Monthly Performance Review"
                                secondary="Schedule time to review monthly business metrics and KPIs"
                            />
                        </ListItem>
                    </List>
                </CardContent>
            </Card>
        </Box>
    );
};

export default OwnerDashboard;
