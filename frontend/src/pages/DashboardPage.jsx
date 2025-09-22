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
                setError(err?.message || 'Failed to load analytics data');
                console.error('Analytics error:', err);
            }
        };

        load();
        return () => {
            fetchGuardRef.current = null;
            controller.abort();
        };
    }, [selectedCenter, user.role, refreshKey]);

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