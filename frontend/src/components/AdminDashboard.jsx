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
    CardActions
} from '@mui/material';
import {
    People,
    School,
    Receipt,
    QuestionAnswer,
    Class,
    Assignment,
    Description,
    AdminPanelSettings
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { getAnalyticsOverview } from '../services/api';

const AdminDashboard = ({ user, ...props }) => {
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setLoading(true);
                const analyticsData = await getAnalyticsOverview();
                setAnalytics(analyticsData);
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
            action: () => navigate('/children')
        },
        {
            title: 'Total Classrooms',
            value: analytics?.total_classrooms || 0,
            icon: <Class color="secondary" />,
            action: () => navigate('/classrooms')
        },
        {
            title: 'Open Enquiries',
            value: analytics?.open_enquiries || 0,
            icon: <QuestionAnswer color="warning" />,
            action: () => navigate('/enquiries')
        },
        {
            title: 'Pending Invoices',
            value: analytics?.pending_invoices || 0,
            icon: <Receipt color="error" />,
            action: () => navigate('/billing')
        }
    ];

    const quickActions = [
        {
            title: 'Manage Students',
            description: 'Add, edit, and manage student enrollment',
            icon: <People />,
            action: () => navigate('/children')
        },
        {
            title: 'Classroom Management',
            description: 'Organize classrooms and assignments',
            icon: <Class />,
            action: () => navigate('/classrooms')
        },
        {
            title: 'Enquiry Management',
            description: 'Handle new enquiries and follow-ups',
            icon: <QuestionAnswer />,
            action: () => navigate('/enquiries')
        },
        {
            title: 'Billing & Invoices',
            description: 'Generate invoices and manage billing',
            icon: <Receipt />,
            action: () => navigate('/billing')
        },
        {
            title: 'Attendance Reports',
            description: 'View and manage attendance records',
            icon: <Assignment />,
            action: () => navigate('/attendance')
        },
        {
            title: 'Document Management',
            description: 'Upload and manage documents',
            icon: <Description />,
            action: () => navigate('/documents')
        }
    ];

    return (
        <Box sx={{ flexGrow: 1, p: 3 }}>
            <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
                <AdminPanelSettings sx={{ mr: 2, fontSize: 40 }} />
                Admin Dashboard
            </Typography>

            <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
                Welcome, {user?.fullName || 'Admin'}
            </Typography>

            {/* Statistics Overview */}
            <Typography variant="h5" gutterBottom sx={{ mt: 4, mb: 2 }}>
                Overview
            </Typography>
            
            <Grid container spacing={3} sx={{ mb: 4 }}>
                {statsCards.map((stat, index) => (
                    <Grid item xs={12} sm={6} md={3} key={index}>
                        <Card sx={{ height: '100%', cursor: 'pointer' }} onClick={stat.action}>
                            <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <Box>
                                        <Typography color="textSecondary" gutterBottom variant="body2">
                                            {stat.title}
                                        </Typography>
                                        <Typography variant="h4" component="h2">
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

            {/* Quick Actions */}
            <Typography variant="h5" gutterBottom sx={{ mt: 4, mb: 2 }}>
                Quick Actions
            </Typography>
            <Grid container spacing={3}>
                {quickActions.map((action, index) => (
                    <Grid item xs={12} md={6} lg={4} key={index}>
                        <Card sx={{ height: '100%' }}>
                            <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                    {action.icon}
                                    <Typography variant="h6" sx={{ ml: 1 }}>
                                        {action.title}
                                    </Typography>
                                </Box>
                                <Typography variant="body2" color="text.secondary">
                                    {action.description}
                                </Typography>
                            </CardContent>
                            <CardActions>
                                <Button size="small" onClick={action.action}>
                                    Open
                                </Button>
                            </CardActions>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            {/* Today's Tasks */}
            <Typography variant="h5" gutterBottom sx={{ mt: 4, mb: 2 }}>
                Today's Focus
            </Typography>
            <Card>
                <CardContent>
                    <List>
                        {analytics?.open_enquiries > 0 && (
                            <ListItem button onClick={() => navigate('/enquiries')}>
                                <ListItemIcon>
                                    <QuestionAnswer color="warning" />
                                </ListItemIcon>
                                <ListItemText 
                                    primary={`${analytics.open_enquiries} Open Enquiries`}
                                    secondary="Follow up with potential enrollments"
                                />
                            </ListItem>
                        )}
                        {analytics?.pending_invoices > 0 && (
                            <>
                                <Divider />
                                <ListItem button onClick={() => navigate('/billing')}>
                                    <ListItemIcon>
                                        <Receipt color="error" />
                                    </ListItemIcon>
                                    <ListItemText 
                                        primary={`${analytics.pending_invoices} Pending Invoices`}
                                        secondary="Review and send pending invoices"
                                    />
                                </ListItem>
                            </>
                        )}
                        <Divider />
                        <ListItem button onClick={() => navigate('/attendance')}>
                            <ListItemIcon>
                                <Assignment />
                            </ListItemIcon>
                            <ListItemText 
                                primary="Review Today's Attendance"
                                secondary="Check attendance reports and address any issues"
                            />
                        </ListItem>
                    </List>
                </CardContent>
            </Card>
        </Box>
    );
};

export default AdminDashboard;
