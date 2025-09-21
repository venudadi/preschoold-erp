import React, { useState, useEffect, useRef } from 'react';
import { 
    Box, 
    Typography, 
    Grid, 
    Button,
    ButtonGroup,
    useMediaQuery,
    useTheme,
    Alert,
    Card,
    CardContent,
    Chip,
    CardActionArea,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Divider
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    LineChart, Line, PieChart, Pie, Cell, FunnelChart, Funnel, LabelList
} from 'recharts';
import PeopleIcon from '@mui/icons-material/People';
import SchoolIcon from '@mui/icons-material/School';
import ReceiptIcon from '@mui/icons-material/Receipt';
import QuestionAnswerIcon from '@mui/icons-material/QuestionAnswer';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import ClassIcon from '@mui/icons-material/Class';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AssessmentIcon from '@mui/icons-material/Assessment';
import SecurityIcon from '@mui/icons-material/Security';
import DashboardIcon from '@mui/icons-material/Dashboard';

import MetricCard from '../components/MetricCard.jsx';
import ChartContainer from '../components/ChartContainer.jsx';
import CenterSelector from '../components/CenterSelector.jsx';
import PermissionGate, { RoleBasedContent } from '../components/PermissionGate.jsx';
import { usePermissions } from '../hooks/usePermissions.js';
import { FEATURES, ROLE_INFO } from '../config/permissions.js';
import { 
    getAnalyticsOverview, 
    getAnalyticsDemographics, 
    getAnalyticsEnrollmentTrends,
    getAnalyticsConversionMetrics,
    getAnalyticsFinancialOverview,
    getAnalyticsCenterComparison 
} from '../services/api';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

const DashboardPage = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const permissions = usePermissions(user.role);
    const roleInfo = ROLE_INFO[user.role];
    
    // State management
    const [selectedCenter, setSelectedCenter] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    
    // Analytics data state
    const [overview, setOverview] = useState({});
    const [demographics, setDemographics] = useState({});
    const [enrollmentTrends, setEnrollmentTrends] = useState({});
    const [conversionMetrics, setConversionMetrics] = useState({});
    const [financialData, setFinancialData] = useState({});
    const [centerComparison, setCenterComparison] = useState([]);
    const [refreshKey, setRefreshKey] = useState(0);
    const fetchGuardRef = useRef(null);

    useEffect(() => {
        // Only admin, owners and super_admins see analytics
        if (user.role !== 'admin' && user.role !== 'owner' && user.role !== 'super_admin') {
            return;
        }

        const controller = new AbortController();
        const token = Symbol('analytics-fetch');
        fetchGuardRef.current = token;

        const load = async () => {
            setLoading(true);
            setError('');
            try {
                const params = selectedCenter ? { centerId: selectedCenter } : {};
                const options = { signal: controller.signal };

                // Overview metrics
                const overviewRes = await getAnalyticsOverview(params, options);
                if (fetchGuardRef.current !== token) return;
                setOverview(overviewRes);

                if (user.role === 'owner' || user.role === 'super_admin') {
                    // Load remaining analytics in parallel
                    const [trendsRes, demographicsRes, conversionRes, financialRes] = await Promise.all([
                        getAnalyticsEnrollmentTrends(params, options),
                        getAnalyticsDemographics(params, options),
                        getAnalyticsConversionMetrics(params, options),
                        getAnalyticsFinancialOverview(params, options)
                    ]);
                    if (fetchGuardRef.current !== token) return;
                    setEnrollmentTrends(trendsRes);
                    setDemographics(demographicsRes);
                    setConversionMetrics(conversionRes);
                    setFinancialData(financialRes);

                    if (user.role === 'super_admin') {
                        const comparisonRes = await getAnalyticsCenterComparison(options);
                        if (fetchGuardRef.current !== token) return;
                        setCenterComparison(comparisonRes);
                    }
                }
            } catch (err) {
                if (err.name !== 'CanceledError' && err.name !== 'AbortError') {
                    setError(err?.message || 'Failed to load analytics data');
                    console.error('Analytics error:', err);
                }
            } finally {
                if (fetchGuardRef.current === token) {
                    setLoading(false);
                }
            }
        };

        load();
        return () => {
            fetchGuardRef.current = null;
            controller.abort();
        };
    }, [selectedCenter, user.role, refreshKey]);

    // Handle center change for superadmin
    const handleCenterChange = (centerId) => {
        setSelectedCenter(centerId);
    };

    // Show basic dashboard for non-analytics users (teachers, parents, academic coordinators)
    if (user.role !== 'admin' && user.role !== 'owner' && user.role !== 'super_admin') {
        return (
            <Box>
                <Box sx={{ mb: 4 }}>
                    <Typography variant="h4" component="h1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <DashboardIcon color="primary" />
                        Dashboard
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                        <Typography variant="h6">Welcome, {user.fullName}!</Typography>
                        {roleInfo && (
                            <Chip 
                                label={roleInfo.displayName}
                                sx={{ 
                                    backgroundColor: roleInfo.color,
                                    color: 'white',
                                    fontWeight: 'bold'
                                }}
                                icon={<SecurityIcon sx={{ color: 'white !important' }} />}
                            />
                        )}
                    </Box>
                    <Typography variant="body1" color="text.secondary">
                        {roleInfo?.description || 'Here is your workspace overview.'}
                    </Typography>
                </Box>
                
                <Grid container spacing={3}>
                    {/* Role Information Card */}
                    <Grid item xs={12} md={6}>
                        <Card sx={{ background: `linear-gradient(135deg, ${roleInfo?.color}20, ${roleInfo?.color}05)` }}>
                            <CardActionArea 
                                onClick={() => navigate('/settings')}
                                sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}
                            >
                                <CardContent sx={{ flexGrow: 1 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                                        <SecurityIcon sx={{ color: roleInfo?.color, fontSize: 32 }} />
                                        <Typography variant="h6">Your Access Level</Typography>
                                    </Box>
                                    <Typography variant="body1" sx={{ mb: 2 }}>
                                        <strong>Role:</strong> {roleInfo?.displayName || user.role}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                        You have access to {permissions.userRole === 'teacher' ? 'your assigned classrooms and attendance management' :
                                        permissions.userRole === 'parent' ? 'your children information and documents' :
                                        permissions.userRole === 'academic_coordinator' ? 'academic management and reporting' :
                                        permissions.userRole === 'admin' ? 'administrative functions and billing' :
                                        'system features'} based on your role.
                                    </Typography>
                                    <Divider sx={{ my: 1 }} />
                                    <Typography variant="body2" color="primary" sx={{ fontWeight: 'medium' }}>
                                        Click to manage your profile →
                                    </Typography>
                                </CardContent>
                            </CardActionArea>
                        </Card>
                    </Grid>

                    {/* Quick Access Features */}
                    <Grid item xs={12} md={6}>
                        <Card>
                            <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                                    <DashboardIcon color="primary" sx={{ fontSize: 32 }} />
                                    <Typography variant="h6">Quick Access</Typography>
                                </Box>
                                
                                <RoleBasedContent 
                                    userRole={user.role}
                                    roles={{
                                        teacher: (
                                            <List dense>
                                                <ListItem 
                                                    component="button" 
                                                    onClick={() => navigate('/classrooms')}
                                                    sx={{ 
                                                        cursor: 'pointer', 
                                                        border: 'none', 
                                                        bgcolor: 'transparent',
                                                        '&:hover': { bgcolor: 'action.hover' },
                                                        borderRadius: 1
                                                    }}
                                                >
                                                    <ListItemIcon><ClassIcon color="primary" /></ListItemIcon>
                                                    <ListItemText primary="View Assigned Classrooms" />
                                                </ListItem>
                                                <ListItem 
                                                    component="button" 
                                                    onClick={() => navigate('/attendance')}
                                                    sx={{ 
                                                        cursor: 'pointer', 
                                                        border: 'none', 
                                                        bgcolor: 'transparent',
                                                        '&:hover': { bgcolor: 'action.hover' },
                                                        borderRadius: 1
                                                    }}
                                                >
                                                    <ListItemIcon><PeopleIcon color="primary" /></ListItemIcon>
                                                    <ListItemText primary="Manage Attendance" />
                                                </ListItem>
                                            </List>
                                        ),
                                        parent: (
                                            <List dense>
                                                <ListItem 
                                                    component="button" 
                                                    onClick={() => navigate('/children')}
                                                    sx={{ 
                                                        cursor: 'pointer', 
                                                        border: 'none', 
                                                        bgcolor: 'transparent',
                                                        '&:hover': { bgcolor: 'action.hover' },
                                                        borderRadius: 1
                                                    }}
                                                >
                                                    <ListItemIcon><SchoolIcon color="primary" /></ListItemIcon>
                                                    <ListItemText primary="View Your Children" />
                                                </ListItem>
                                                <ListItem 
                                                    component="button" 
                                                    onClick={() => navigate('/documents')}
                                                    sx={{ 
                                                        cursor: 'pointer', 
                                                        border: 'none', 
                                                        bgcolor: 'transparent',
                                                        '&:hover': { bgcolor: 'action.hover' },
                                                        borderRadius: 1
                                                    }}
                                                >
                                                    <ListItemIcon><ReceiptIcon color="primary" /></ListItemIcon>
                                                    <ListItemText primary="Access Documents" />
                                                </ListItem>
                                            </List>
                                        ),
                                        academic_coordinator: (
                                            <List dense>
                                                <ListItem 
                                                    component="button" 
                                                    onClick={() => navigate('/classrooms')}
                                                    sx={{ 
                                                        cursor: 'pointer', 
                                                        border: 'none', 
                                                        bgcolor: 'transparent',
                                                        '&:hover': { bgcolor: 'action.hover' },
                                                        borderRadius: 1
                                                    }}
                                                >
                                                    <ListItemIcon><ClassIcon color="primary" /></ListItemIcon>
                                                    <ListItemText primary="Manage Classrooms" />
                                                </ListItem>
                                                <ListItem 
                                                    component="button" 
                                                    onClick={() => navigate('/enquiries')}
                                                    sx={{ 
                                                        cursor: 'pointer', 
                                                        border: 'none', 
                                                        bgcolor: 'transparent',
                                                        '&:hover': { bgcolor: 'action.hover' },
                                                        borderRadius: 1
                                                    }}
                                                >
                                                    <ListItemIcon><QuestionAnswerIcon color="primary" /></ListItemIcon>
                                                    <ListItemText primary="Handle Enquiries" />
                                                </ListItem>
                                            </List>
                                        ),
                                        admin: (
                                            <List dense>
                                                <ListItem 
                                                    component="button" 
                                                    onClick={() => navigate('/children')}
                                                    sx={{ 
                                                        cursor: 'pointer', 
                                                        border: 'none', 
                                                        bgcolor: 'transparent',
                                                        '&:hover': { bgcolor: 'action.hover' },
                                                        borderRadius: 1
                                                    }}
                                                >
                                                    <ListItemIcon><PeopleIcon color="primary" /></ListItemIcon>
                                                    <ListItemText primary="Manage Students" />
                                                </ListItem>
                                                <ListItem 
                                                    component="button" 
                                                    onClick={() => navigate('/billing')}
                                                    sx={{ 
                                                        cursor: 'pointer', 
                                                        border: 'none', 
                                                        bgcolor: 'transparent',
                                                        '&:hover': { bgcolor: 'action.hover' },
                                                        borderRadius: 1
                                                    }}
                                                >
                                                    <ListItemIcon><MonetizationOnIcon color="primary" /></ListItemIcon>
                                                    <ListItemText primary="Billing Management" />
                                                </ListItem>
                                                <ListItem 
                                                    component="button" 
                                                    onClick={() => navigate('/enquiries')}
                                                    sx={{ 
                                                        cursor: 'pointer', 
                                                        border: 'none', 
                                                        bgcolor: 'transparent',
                                                        '&:hover': { bgcolor: 'action.hover' },
                                                        borderRadius: 1
                                                    }}
                                                >
                                                    <ListItemIcon><QuestionAnswerIcon color="primary" /></ListItemIcon>
                                                    <ListItemText primary="Manage Enquiries" />
                                                </ListItem>
                                            </List>
                                        )
                                    }}
                                    defaultContent={
                                        <Typography variant="body2" color="text.secondary">
                                            No quick actions available for your role.
                                        </Typography>
                                    }
                                />
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Center Information */}
                    {user.centerName && (
                        <Grid item xs={12} md={6}>
                            <Card>
                                <CardActionArea 
                                    onClick={() => navigate('/settings')}
                                    sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}
                                >
                                    <CardContent sx={{ flexGrow: 1 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                                            <SchoolIcon sx={{ fontSize: 32, color: 'info.main' }} />
                                            <Typography variant="h6">Your Center</Typography>
                                        </Box>
                                        <Typography variant="body1" sx={{ fontWeight: 'bold', mb: 1 }}>
                                            {user.centerName}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                            Currently managing this center
                                        </Typography>
                                        <Divider sx={{ my: 1 }} />
                                        <Typography variant="body2" color="primary" sx={{ fontWeight: 'medium' }}>
                                            Click to view center settings →
                                        </Typography>
                                    </CardContent>
                                </CardActionArea>
                            </Card>
                        </Grid>
                    )}

                    {/* Quick Stats for Admin/Super Admin */}
                    {(user.role === 'admin' || user.role === 'super_admin') && (
                        <>
                            <Grid item xs={12}>
                                <Typography variant="h6" sx={{ mb: 2, mt: 2 }}>Quick Overview</Typography>
                            </Grid>
                            <Grid item xs={6} md={3}>
                                <Card>
                                    <CardActionArea onClick={() => navigate('/children')}>
                                        <CardContent sx={{ textAlign: 'center' }}>
                                            <PeopleIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                                            <Typography variant="h6" color="primary">
                                                {loading ? '...' : (overview.total_students || 'N/A')}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                Total Students
                                            </Typography>
                                        </CardContent>
                                    </CardActionArea>
                                </Card>
                            </Grid>
                            <Grid item xs={6} md={3}>
                                <Card>
                                    <CardActionArea onClick={() => navigate('/enquiries')}>
                                        <CardContent sx={{ textAlign: 'center' }}>
                                            <QuestionAnswerIcon sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
                                            <Typography variant="h6" color="warning.main">
                                                {loading ? '...' : (overview.open_enquiries || 'N/A')}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                Open Enquiries
                                            </Typography>
                                        </CardContent>
                                    </CardActionArea>
                                </Card>
                            </Grid>
                            <Grid item xs={6} md={3}>
                                <Card>
                                    <CardActionArea onClick={() => navigate('/billing')}>
                                        <CardContent sx={{ textAlign: 'center' }}>
                                            <ReceiptIcon sx={{ fontSize: 40, color: 'error.main', mb: 1 }} />
                                            <Typography variant="h6" color="error.main">
                                                {loading ? '...' : (overview.pending_invoices || 'N/A')}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                Pending Invoices
                                            </Typography>
                                        </CardContent>
                                    </CardActionArea>
                                </Card>
                            </Grid>
                            <Grid item xs={6} md={3}>
                                <Card>
                                    <CardActionArea onClick={() => navigate('/classrooms')}>
                                        <CardContent sx={{ textAlign: 'center' }}>
                                            <ClassIcon sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
                                            <Typography variant="h6" color="success.main">
                                                {loading ? '...' : (overview.total_classrooms || 'N/A')}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                Total Classrooms
                                            </Typography>
                                        </CardContent>
                                    </CardActionArea>
                                </Card>
                            </Grid>
                        </>
                    )}

                    {/* Data not available message */}
                    {loading && (
                        <Grid item xs={12}>
                            <Alert severity="info">
                                Loading dashboard data...
                            </Alert>
                        </Grid>
                    )}
                    
                    {error && (
                        <Grid item xs={12}>
                            <Alert severity="warning">
                                {error} - Some metrics may show 'N/A' until data is available.
                            </Alert>
                        </Grid>
                    )}

                    {/* Feature Access Summary */}
                    <Grid item xs={12} md={6}>
                        <Card>
                            <CardActionArea 
                                onClick={() => navigate('/settings')}
                                sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}
                            >
                                <CardContent sx={{ flexGrow: 1 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                                        <AssessmentIcon sx={{ fontSize: 32, color: 'success.main' }} />
                                        <Typography variant="h6">Available Features</Typography>
                                    </Box>
                                    <Typography variant="h3" sx={{ color: 'success.main', fontWeight: 'bold' }}>
                                        {Object.values(FEATURES).filter(feature => permissions.can(feature)).length}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                        Features accessible to your role
                                    </Typography>
                                    <Divider sx={{ my: 1 }} />
                                    <Typography variant="body2" color="primary" sx={{ fontWeight: 'medium' }}>
                                        Click to view all permissions →
                                    </Typography>
                                </CardContent>
                            </CardActionArea>
                        </Card>
                    </Grid>
                </Grid>
            </Box>
        );
    }

    return (
        <PermissionGate 
            features={FEATURES.ANALYTICS_DASHBOARD}
            userRole={user.role}
            fallback={
                <Box sx={{ textAlign: 'center', py: 8 }}>
                    <SecurityIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h5" gutterBottom>Access Restricted</Typography>
                    <Typography variant="body1" color="text.secondary">
                        You don't have permission to view the analytics dashboard.
                    </Typography>
                </Box>
            }
            hideOnDenied={false}
        >
            <Box sx={{ pb: 3 }}>
                {/* Header with role indicator and center selector */}
                <Box sx={{ 
                    display: 'flex', 
                    flexDirection: isMobile ? 'column' : 'row',
                    justifyContent: 'space-between', 
                    alignItems: isMobile ? 'flex-start' : 'center',
                    mb: 3,
                    gap: 2
                }}>
                    <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                            <Typography variant="h4" component="h1">
                                Analytics Dashboard
                            </Typography>
                            {roleInfo && (
                                <Chip 
                                    label={roleInfo.displayName}
                                    sx={{ 
                                        backgroundColor: roleInfo.color,
                                        color: 'white',
                                        fontWeight: 'bold'
                                    }}
                                    size="small"
                                />
                            )}
                        </Box>
                        <Typography variant="body1" color="text.secondary">
                            Real-time insights and performance metrics
                        </Typography>
                    </Box>
                
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                    <CenterSelector 
                        selectedCenter={selectedCenter}
                        onCenterChange={handleCenterChange}
                        userRole={user.role}
                    />
                </Box>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                </Alert>
            )}

            {/* Overview Metrics */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6} md={2}>
                    <MetricCard
                        title="Total Students"
                        value={overview.total_students}
                        icon={<PeopleIcon />}
                        color="primary"
                        loading={loading}
                        subtitle="Enrolled"
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={2}>
                    <MetricCard
                        title="Total Staff"
                        value={overview.total_staff}
                        icon={<SchoolIcon />}
                        color="secondary"
                        loading={loading}
                        subtitle="Active"
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={2}>
                    <MetricCard
                        title="Pending Invoices"
                        value={overview.pending_invoices}
                        icon={<ReceiptIcon />}
                        color="warning"
                        loading={loading}
                        subtitle="Awaiting payment"
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={2}>
                    <MetricCard
                        title="Open Enquiries"
                        value={overview.open_enquiries}
                        icon={<QuestionAnswerIcon />}
                        color="info"
                        loading={loading}
                        subtitle="New leads"
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={2}>
                    <MetricCard
                        title="Classrooms"
                        value={overview.total_classrooms}
                        icon={<ClassIcon />}
                        color="success"
                        loading={loading}
                        subtitle="Active"
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={2}>
                    <MetricCard
                        title="Monthly Revenue"
                        value={overview.monthly_revenue}
                        icon={<MonetizationOnIcon />}
                        color="success"
                        loading={loading}
                        format="currency"
                        subtitle="Current month"
                    />
                </Grid>
            </Grid>

            {/* Charts Section */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                {/* Demographics */}
                <Grid item xs={12} md={6}>
                    <ChartContainer 
                        title="Student Demographics" 
                        subtitle="Age group distribution"
                        loading={loading}
                        error={error || null}
                        empty={!loading && !error && (!demographics.age_groups || demographics.age_groups.length === 0)}
                        emptyMessage="No demographic data available. Try adjusting filters."
                        onRetry={() => setRefreshKey(k => k + 1)}
                        height={300}
                    >
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={demographics.age_groups || []}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="count"
                                >
                                    {(demographics.age_groups || []).map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </ChartContainer>
                </Grid>

                {/* Enrollment Trends */}
                <Grid item xs={12} md={6}>
                    <ChartContainer 
                        title="Enrollment Trends" 
                        subtitle="Monthly enrollments over time"
                        loading={loading}
                        error={error || null}
                        empty={!loading && !error && (!enrollmentTrends.monthly_enrollments || enrollmentTrends.monthly_enrollments.length === 0)}
                        emptyMessage="No enrollment data for the selected period."
                        onRetry={() => setRefreshKey(k => k + 1)}
                        height={300}
                    >
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={enrollmentTrends.monthly_enrollments || []}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="month" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Line 
                                    type="monotone" 
                                    dataKey="enrollments" 
                                    stroke="#8884d8" 
                                    strokeWidth={2}
                                    name="New Enrollments"
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </ChartContainer>
                </Grid>
            </Grid>

            {/* Conversion Funnel and Revenue */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                {/* Conversion Funnel */}
                <Grid item xs={12} md={6}>
                    <ChartContainer 
                        title="Enquiry Conversion Funnel" 
                        subtitle="Lead progression through stages"
                        loading={loading}
                        error={error || null}
                        empty={!loading && !error && (!conversionMetrics.funnel_data || conversionMetrics.funnel_data.length === 0)}
                        emptyMessage="No enquiries to display in the funnel."
                        onRetry={() => setRefreshKey(k => k + 1)}
                        height={300}
                    >
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart 
                                data={conversionMetrics.funnel_data || []}
                                layout="horizontal"
                            >
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis type="number" />
                                <YAxis dataKey="status" type="category" width={80} />
                                <Tooltip />
                                <Bar dataKey="count" fill="#8884d8" />
                            </BarChart>
                        </ResponsiveContainer>
                    </ChartContainer>
                </Grid>

                {/* Revenue Trends */}
                <Grid item xs={12} md={6}>
                    <ChartContainer 
                        title="Revenue Trends" 
                        subtitle="Monthly revenue breakdown"
                        loading={loading}
                        error={error || null}
                        empty={!loading && !error && (!financialData.revenue_trends || financialData.revenue_trends.length === 0)}
                        emptyMessage="No revenue data found for this timeframe."
                        onRetry={() => setRefreshKey(k => k + 1)}
                        height={300}
                    >
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={financialData.revenue_trends || []}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="month" />
                                <YAxis />
                                <Tooltip formatter={(value) => [`₹${value.toLocaleString()}`, '']} />
                                <Legend />
                                <Bar dataKey="paid_amount" stackId="a" fill="#00C49F" name="Paid" />
                                <Bar dataKey="pending_amount" stackId="a" fill="#FFBB28" name="Pending" />
                                <Bar dataKey="overdue_amount" stackId="a" fill="#FF8042" name="Overdue" />
                            </BarChart>
                        </ResponsiveContainer>
                    </ChartContainer>
                </Grid>
            </Grid>

            {/* Center Comparison for Super Admin */}
            {user.role === 'super_admin' && (
                <Grid container spacing={3}>
                    <Grid item xs={12}>
                        <ChartContainer 
                            title="Center Performance Comparison" 
                            subtitle="Revenue and enrollment metrics across centers"
                            loading={loading}
                            error={error || null}
                            empty={!loading && !error && centerComparison.length === 0}
                            emptyMessage="No comparable data across centers."
                            onRetry={() => setRefreshKey(k => k + 1)}
                            height={400}
                        >
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={centerComparison}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="center_name" />
                                    <YAxis />
                                    <Tooltip 
                                        formatter={(value, name) => {
                                            if (name.includes('revenue')) {
                                                return [`₹${value.toLocaleString()}`, name];
                                            }
                                            return [value, name];
                                        }}
                                    />
                                    <Legend />
                                    <Bar dataKey="total_students" fill="#8884d8" name="Students" />
                                    <Bar dataKey="monthly_revenue" fill="#82ca9d" name="Monthly Revenue (₹)" />
                                </BarChart>
            </ResponsiveContainer>
        </ChartContainer>
    </Grid>
</Grid>
)}
</Box>
</PermissionGate>
);
};

export default DashboardPage;