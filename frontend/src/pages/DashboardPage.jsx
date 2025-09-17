import React, { useState, useEffect } from 'react';
import { 
    Box, 
    Typography, 
    Grid, 
    Button,
    ButtonGroup,
    useMediaQuery,
    useTheme,
    Alert
} from '@mui/material';
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

import MetricCard from '../components/MetricCard.jsx';
import ChartContainer from '../components/ChartContainer.jsx';
import CenterSelector from '../components/CenterSelector.jsx';
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
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    // State management
    const [selectedCenter, setSelectedCenter] = useState('');
    const [timeRange, setTimeRange] = useState('3months');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    
    // Analytics data state
    const [overview, setOverview] = useState({});
    const [demographics, setDemographics] = useState({});
    const [enrollmentTrends, setEnrollmentTrends] = useState({});
    const [conversionMetrics, setConversionMetrics] = useState({});
    const [financialData, setFinancialData] = useState({});
    const [centerComparison, setCenterComparison] = useState([]);

    // Fetch all analytics data
    const fetchAnalyticsData = async (centerId = selectedCenter) => {
        if (user.role !== 'owner' && user.role !== 'superadmin') {
            return; // Only owners and superadmins see analytics
        }

        setLoading(true);
        setError('');
        
        try {
            const params = centerId ? { centerId } : {};
            
            const [
                overviewRes,
                demographicsRes,
                trendsRes,
                conversionRes,
                financialRes
            ] = await Promise.all([
                getAnalyticsOverview(params),
                getAnalyticsDemographics(params),
                getAnalyticsEnrollmentTrends(params),
                getAnalyticsConversionMetrics(params),
                getAnalyticsFinancialOverview(params)
            ]);

            setOverview(overviewRes);
            setDemographics(demographicsRes);
            setEnrollmentTrends(trendsRes);
            setConversionMetrics(conversionRes);
            setFinancialData(financialRes);

            // Fetch center comparison for superadmin
            if (user.role === 'superadmin') {
                const comparisonRes = await getAnalyticsCenterComparison();
                setCenterComparison(comparisonRes);
            }

        } catch (err) {
            setError('Failed to load analytics data');
            console.error('Analytics error:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAnalyticsData();
    }, [selectedCenter, timeRange]);

    // Handle center change for superadmin
    const handleCenterChange = (centerId) => {
        setSelectedCenter(centerId);
    };

    // Show basic dashboard for non-analytics users
    if (user.role !== 'owner' && user.role !== 'superadmin') {
        return (
            <Box>
                <Typography variant="h4" component="h1" gutterBottom>
                    Dashboard
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                    Welcome! Here is your workspace overview.
                </Typography>
                
                <Grid container spacing={3}>
                    <Grid item xs={12} sm={6} md={3}>
                        <MetricCard 
                            title="Your Role" 
                            value={user.role?.toUpperCase() || 'User'} 
                            icon={<PeopleIcon />}
                            color="primary"
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <MetricCard 
                            title="Quick Actions" 
                            value="Available" 
                            icon={<AssessmentIcon />}
                            color="success"
                        />
                    </Grid>
                </Grid>
            </Box>
        );
    }

    return (
        <Box sx={{ pb: 3 }}>
            {/* Header with center selector */}
            <Box sx={{ 
                display: 'flex', 
                flexDirection: isMobile ? 'column' : 'row',
                justifyContent: 'space-between', 
                alignItems: isMobile ? 'flex-start' : 'center',
                mb: 3,
                gap: 2
            }}>
                <Box>
                    <Typography variant="h4" component="h1" gutterBottom>
                        Analytics Dashboard
                    </Typography>
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

            {/* Center Comparison for Superadmin */}
            {user.role === 'superadmin' && centerComparison.length > 0 && (
                <Grid container spacing={3}>
                    <Grid item xs={12}>
                        <ChartContainer 
                            title="Center Performance Comparison" 
                            subtitle="Revenue and enrollment metrics across centers"
                            loading={loading}
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
    );
};

export default DashboardPage;