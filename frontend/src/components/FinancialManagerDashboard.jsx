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
    Chip,
    LinearProgress
} from '@mui/material';
import {
    AccountBalance,
    TrendingUp,
    TrendingDown,
    Receipt,
    Payment,
    MonetizationOn,
    Assessment,
    Warning,
    CheckCircle,
    Schedule
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { getAnalyticsFinancialOverview, getAnalyticsOverview } from '../services/api';

const FinancialManagerDashboard = ({ user, ...props }) => {
    const [financial, setFinancial] = useState(null);
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setLoading(true);
                const [financialData, analyticsData] = await Promise.all([
                    getAnalyticsFinancialOverview().catch(() => null),
                    getAnalyticsOverview()
                ]);
                setFinancial(financialData);
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

    const financialMetrics = [
        {
            title: 'Monthly Revenue',
            value: financial?.monthly_revenue ? `₹${financial.monthly_revenue}` : `₹${analytics?.monthly_revenue || 0}`,
            icon: <MonetizationOn color="success" />,
            color: '#388e3c',
            trend: financial?.revenue_growth || 'stable'
        },
        {
            title: 'Pending Invoices',
            value: analytics?.pending_invoices || 0,
            icon: <Receipt color="warning" />,
            color: '#ed6c02',
            urgent: analytics?.pending_invoices > 5
        },
        {
            title: 'Collection Rate',
            value: financial?.collection_rate ? `${financial.collection_rate}%` : '95%',
            icon: <Payment color="info" />,
            color: '#0288d1'
        },
        {
            title: 'Outstanding Amount',
            value: financial?.outstanding_amount ? `₹${financial.outstanding_amount}` : '₹0',
            icon: <Warning color="error" />,
            color: '#d32f2f'
        }
    ];

    const financialActions = [
        {
            title: 'Generate Invoices',
            description: 'Create and send monthly invoices',
            icon: <Receipt />,
            action: () => navigate('/billing'),
            color: 'primary',
            count: analytics?.pending_invoices || 0
        },
        {
            title: 'Payment Processing',
            description: 'Process and record payments',
            icon: <Payment />,
            action: () => navigate('/billing'),
            color: 'success'
        },
        {
            title: 'Financial Reports',
            description: 'View detailed financial analytics',
            icon: <Assessment />,
            action: () => navigate('/reports'),
            color: 'info'
        },
        {
            title: 'Expense Management',
            description: 'Track and categorize expenses',
            icon: <AccountBalance />,
            action: () => navigate('/expenses'),
            color: 'secondary'
        }
    ];

    // Mock financial data for demonstration
    const recentTransactions = [
        { id: 1, type: 'Payment', amount: 15000, status: 'Completed', date: '2025-09-22' },
        { id: 2, type: 'Invoice', amount: 8500, status: 'Pending', date: '2025-09-21' },
        { id: 3, type: 'Payment', amount: 12000, status: 'Completed', date: '2025-09-20' },
        { id: 4, type: 'Expense', amount: 3500, status: 'Approved', date: '2025-09-19' }
    ];

    const paymentTargets = [
        { metric: 'Monthly Collection', current: 85, target: 95, unit: '%' },
        { metric: 'Invoice Processing', current: 45, target: 50, unit: '' },
        { metric: 'Revenue Target', current: 180000, target: 200000, unit: '₹' }
    ];

    return (
        <Box sx={{ flexGrow: 1, p: 3 }}>
            <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
                <AccountBalance sx={{ mr: 2, fontSize: 40 }} />
                Financial Manager Dashboard
            </Typography>

            <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
                Welcome, {user?.fullName || 'Financial Manager'}
            </Typography>

            {/* Financial Metrics */}
            <Typography variant="h5" gutterBottom sx={{ mt: 4, mb: 2 }}>
                Financial Overview
            </Typography>
            
            <Grid container spacing={3} sx={{ mb: 4 }}>
                {financialMetrics.map((metric, index) => (
                    <Grid item xs={12} sm={6} md={3} key={index}>
                        <Card sx={{ 
                            height: '100%', 
                            border: `2px solid ${metric.color}20`,
                            ...(metric.urgent && { borderColor: '#d32f2f', borderWidth: 3 })
                        }}>
                            <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <Box>
                                        <Typography color="textSecondary" gutterBottom variant="body2">
                                            {metric.title}
                                        </Typography>
                                        <Typography variant="h5" component="h2" sx={{ color: metric.color }}>
                                            {metric.value}
                                        </Typography>
                                        {metric.trend && (
                                            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                                                {metric.trend === 'up' ? 
                                                    <TrendingUp fontSize="small" color="success" /> :
                                                    metric.trend === 'down' ?
                                                    <TrendingDown fontSize="small" color="error" /> :
                                                    null
                                                }
                                                <Typography variant="caption" sx={{ ml: 0.5 }}>
                                                    {metric.trend}
                                                </Typography>
                                            </Box>
                                        )}
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

            {/* Performance Targets */}
            <Typography variant="h5" gutterBottom sx={{ mt: 4, mb: 2 }}>
                Performance Targets
            </Typography>
            <Grid container spacing={3} sx={{ mb: 4 }}>
                {paymentTargets.map((target, index) => (
                    <Grid item xs={12} md={4} key={index}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    {target.metric}
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                    <Typography variant="body2" color="text.secondary">
                                        {target.unit === '₹' ? 
                                            `₹${target.current.toLocaleString()} / ₹${target.target.toLocaleString()}` :
                                            `${target.current}${target.unit} / ${target.target}${target.unit}`
                                        }
                                    </Typography>
                                </Box>
                                <LinearProgress 
                                    variant="determinate" 
                                    value={(target.current / target.target) * 100}
                                    sx={{ height: 8, borderRadius: 4 }}
                                />
                                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                                    {Math.round((target.current / target.target) * 100)}% of target
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            {/* Financial Actions */}
            <Typography variant="h5" gutterBottom sx={{ mt: 4, mb: 2 }}>
                Financial Operations
            </Typography>
            <Grid container spacing={3} sx={{ mb: 4 }}>
                {financialActions.map((action, index) => (
                    <Grid item xs={12} sm={6} md={3} key={index}>
                        <Card sx={{ height: '100%' }}>
                            <CardContent sx={{ textAlign: 'center' }}>
                                <Box sx={{ mb: 2, position: 'relative' }}>
                                    {React.cloneElement(action.icon, { 
                                        sx: { fontSize: 48 }, 
                                        color: action.color 
                                    })}
                                    {action.count > 0 && (
                                        <Chip 
                                            label={action.count}
                                            color="error"
                                            size="small"
                                            sx={{ position: 'absolute', top: -5, right: 15 }}
                                        />
                                    )}
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

            {/* Recent Transactions */}
            <Typography variant="h5" gutterBottom sx={{ mt: 4, mb: 2 }}>
                Recent Transactions
            </Typography>
            <Card>
                <CardContent>
                    <List>
                        {recentTransactions.map((transaction, index) => (
                            <React.Fragment key={transaction.id}>
                                <ListItem>
                                    <ListItemIcon>
                                        {transaction.status === 'Completed' ? 
                                            <CheckCircle color="success" /> :
                                            transaction.status === 'Pending' ?
                                            <Schedule color="warning" /> :
                                            <Receipt color="info" />
                                        }
                                    </ListItemIcon>
                                    <ListItemText 
                                        primary={
                                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                <Typography variant="body1">
                                                    {transaction.type} - ₹{transaction.amount.toLocaleString()}
                                                </Typography>
                                                <Chip 
                                                    label={transaction.status}
                                                    color={
                                                        transaction.status === 'Completed' ? 'success' :
                                                        transaction.status === 'Pending' ? 'warning' : 'info'
                                                    }
                                                    size="small"
                                                />
                                            </Box>
                                        }
                                        secondary={transaction.date}
                                    />
                                </ListItem>
                                {index < recentTransactions.length - 1 && <Divider />}
                            </React.Fragment>
                        ))}
                    </List>
                </CardContent>
                <CardActions>
                    <Button onClick={() => navigate('/billing')}>View All Transactions</Button>
                </CardActions>
            </Card>
        </Box>
    );
};

export default FinancialManagerDashboard;
