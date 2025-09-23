import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Typography,
    Grid,
    Card,
    CardContent,
    Alert,
    CircularProgress,
    Chip,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Divider
} from '@mui/material';
import {
    People,
    PeopleOutline,
    School,
    Receipt,
    QuestionAnswer,
    Class,
    MonetizationOn,
    Security,
    Dashboard
} from '@mui/icons-material';
import { getAnalyticsOverview, getAnalyticsCenterComparison } from '../services/api';

const SuperAdminDashboard = ({ user, ...props }) => {
    const navigate = useNavigate();
    const [analytics, setAnalytics] = useState(null);
    const [centers, setCenters] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setLoading(true);
                const [analyticsData, centersData] = await Promise.all([
                    getAnalyticsOverview(),
                    getAnalyticsCenterComparison()
                ]);
                setAnalytics(analyticsData);
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

    const statsCards = [
        {
            title: 'Total Students',
            value: analytics?.total_students || 0,
            icon: <School color="primary" />,
            color: '#1976d2'
        },
        {
            title: 'Total Staff',
            value: analytics?.total_staff || 0,
            icon: <PeopleOutline color="secondary" />,
            color: '#9c27b0'
        },
        {
            title: 'Total Classrooms',
            value: analytics?.total_classrooms || 0,
            icon: <Class color="success" />,
            color: '#2e7d32'
        },
        {
            title: 'Open Enquiries',
            value: analytics?.open_enquiries || 0,
            icon: <QuestionAnswer color="warning" />,
            color: '#ed6c02'
        },
        {
            title: 'Pending Invoices',
            value: analytics?.pending_invoices || 0,
            icon: <Receipt color="error" />,
            color: '#d32f2f'
        },
        {
            title: 'Monthly Revenue',
            value: analytics?.monthly_revenue ? `₹${analytics.monthly_revenue}` : '₹0',
            icon: <MonetizationOn color="success" />,
            color: '#388e3c'
        }
    ];

    return (
        <Box sx={{ flexGrow: 1, p: 3 }}>
            <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
                <Security sx={{ mr: 2, fontSize: 40 }} />
                Super Admin Dashboard
            </Typography>

            <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
                Welcome, {user?.fullName || 'Super Admin'}
            </Typography>

            {/* System Overview Stats */}
            <Typography variant="h5" gutterBottom sx={{ mt: 4, mb: 2 }}>
                System Overview
            </Typography>
            
            <Grid container spacing={3} sx={{ mb: 4 }}>
                {statsCards.map((stat, index) => (
                    <Grid item xs={12} sm={6} md={4} key={index}>
                        <Card sx={{ height: '100%', border: `2px solid ${stat.color}20` }}>
                            <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <Box>
                                        <Typography color="textSecondary" gutterBottom variant="body2">
                                            {stat.title}
                                        </Typography>
                                        <Typography variant="h4" component="h2" sx={{ color: stat.color }}>
                                            {stat.value}
                                        </Typography>
                                    </Box>
                                    <Box sx={{ opacity: 0.7 }}>
                                        {stat.icon}
                                    </Box>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            {/* Centers Overview */}
            {centers.length > 0 && (
                <>
                    <Typography variant="h5" gutterBottom sx={{ mt: 4, mb: 2 }}>
                        Centers Overview
                    </Typography>
                    <Grid container spacing={3}>
                        {centers.map((center, index) => (
                            <Grid item xs={12} md={6} lg={4} key={index}>
                                <Card>
                                    <CardContent>
                                        <Typography variant="h6" gutterBottom>
                                            {center.name}
                                        </Typography>
                                        <List dense>
                                            <ListItem>
                                                <ListItemIcon>
                                                    <School fontSize="small" />
                                                </ListItemIcon>
                                                <ListItemText primary={`Students: ${center.student_count || 0}`} />
                                            </ListItem>
                                            <ListItem>
                                                <ListItemIcon>
                                                    <PeopleOutline fontSize="small" />
                                                </ListItemIcon>
                                                <ListItemText primary={`Staff: ${center.staff_count || 0}`} />
                                            </ListItem>
                                            <ListItem>
                                                <ListItemIcon>
                                                    <Class fontSize="small" />
                                                </ListItemIcon>
                                                <ListItemText primary={`Classrooms: ${center.classroom_count || 0}`} />
                                            </ListItem>
                                        </List>
                                        <Chip 
                                            label={center.is_active ? 'Active' : 'Inactive'} 
                                            color={center.is_active ? 'success' : 'default'}
                                            size="small"
                                            sx={{ mt: 1 }}
                                        />
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                </>
            )}

            {/* Quick Actions */}
            <Typography variant="h5" gutterBottom sx={{ mt: 4, mb: 2 }}>
                System Management
            </Typography>
            <Card>
                <CardContent>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                        As a Super Admin, you have access to all system features and can manage multiple centers, 
                        users, and system-wide settings.
                    </Typography>
                    <List>
                        <ListItem button onClick={() => navigate('/users')}>
                            <ListItemIcon>
                                <Security />
                            </ListItemIcon>
                            <ListItemText 
                                primary="User Management" 
                                secondary="Manage user accounts, roles, and permissions across all centers"
                            />
                        </ListItem>
                        <Divider />
                        <ListItem>
                            <ListItemIcon>
                                <Dashboard />
                            </ListItemIcon>
                            <ListItemText 
                                primary="System Analytics" 
                                secondary="View comprehensive analytics and reports across all centers"
                            />
                        </ListItem>
                        <Divider />
                        <ListItem>
                            <ListItemIcon>
                                <School />
                            </ListItemIcon>
                            <ListItemText 
                                primary="Center Management" 
                                secondary="Oversee all preschool centers and their operations"
                            />
                        </ListItem>
                    </List>
                </CardContent>
            </Card>
        </Box>
    );
};

export default SuperAdminDashboard;
