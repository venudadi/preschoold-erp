import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Grid,
    Card,
    CardContent,
    Tab,
    Tabs,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Chip,
    Alert,
    IconButton,
    LinearProgress,
    Skeleton,
    Badge,
    Tooltip,
    Stack,
    Divider,
    InputAdornment,
    Snackbar,
    SpeedDial,
    SpeedDialAction,
    SpeedDialIcon,
    TableSortLabel,
    Checkbox,
    Menu,
    ListItemIcon,
    ListItemText,
    Avatar,
    CardActions,
    Collapse
} from '@mui/material';
import {
    AttachMoney as MoneyIcon,
    Assessment as AssessmentIcon,
    Security as SecurityIcon,
    Warning as WarningIcon,
    CheckCircle as CheckIcon,
    Cancel as RejectIcon,
    Edit as EditIcon,
    Refresh as RefreshIcon,
    GetApp as ExportIcon,
    FileDownload as DownloadIcon,
    Notifications as NotificationsIcon,
    TrendingUp as TrendingUpIcon,
    TrendingDown as TrendingDownIcon,
    Search as SearchIcon,
    FilterList as FilterIcon,
    MoreVert as MoreIcon,
    Info as InfoIcon,
    Add as AddIcon,
    CheckBoxOutlineBlank as UncheckedIcon,
    CheckBox as CheckedIcon,
    NotificationsActive as AlertIcon,
    Dashboard as DashboardIcon,
    ExpandMore as ExpandMoreIcon,
    ExpandLess as ExpandLessIcon
} from '@mui/icons-material';
import { exportExpenses } from '../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line, Area, AreaChart } from 'recharts';

function TabPanel(props) {
    const { children, value, index, ...other } = props;
    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`tabpanel-${index}`}
            aria-labelledby={`tab-${index}`}
            {...other}
        >
            {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
        </div>
    );
}

const FinancialManagerDashboard = ({ user }) => {
    const [tabValue, setTabValue] = useState(0);
    const [dashboardData, setDashboardData] = useState({
        overview: {},
        budgetLimits: [],
        pendingApprovals: [],
        oversightItems: [],
        centers: [],
        analytics: { approvalActivity: [], budgetDistribution: [] }
    });
    const [limitDialog, setLimitDialog] = useState({ open: false, limit: null });
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [exportParams, setExportParams] = useState({ start_date: '', end_date: '', category: '', status: '' });
    const [exporting, setExporting] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedApprovals, setSelectedApprovals] = useState([]);
    const [anchorEl, setAnchorEl] = useState(null);
    const [expandedCards, setExpandedCards] = useState({});

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async (showRefreshIndicator = false) => {
        try {
            if (showRefreshIndicator) setRefreshing(true);

            const token = localStorage.getItem('token');
            const sessionToken = localStorage.getItem('sessionToken');
            const csrfToken = localStorage.getItem('csrfToken');

            const response = await fetch('/api/financial-manager/dashboard', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'X-Session-Token': sessionToken,
                    'X-CSRF-Token': csrfToken
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            setDashboardData({
                overview: data.overview || {},
                budgetLimits: data.budgetLimits || [],
                pendingApprovals: data.pendingApprovals || [],
                oversightItems: data.oversightItems || [],
                centers: data.centers || [],
                analytics: data.analytics || { approvalActivity: [], budgetDistribution: [] }
            });

            if (showRefreshIndicator) {
                setSnackbar({ open: true, message: 'Dashboard refreshed successfully', severity: 'success' });
            }
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            setSnackbar({ open: true, message: 'Failed to load dashboard data', severity: 'error' });
            // Keep default empty state on error
            setDashboardData({
                overview: {},
                budgetLimits: [],
                pendingApprovals: [],
                oversightItems: [],
                centers: [],
                analytics: { approvalActivity: [], budgetDistribution: [] }
            });
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    };

    const handleEditLimit = (limit) => {
        setLimitDialog({ open: true, limit: limit || {} });
    };

    const handleSaveLimit = async () => {
        try {
            const method = limitDialog.limit.id ? 'PUT' : 'POST';
            const url = limitDialog.limit.id
                ? `/api/financial-manager/budget-limits/${limitDialog.limit.id}`
                : '/api/financial-manager/budget-limits';

            await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(limitDialog.limit)
            });

            setLimitDialog({ open: false, limit: null });
            fetchDashboardData();
        } catch (error) {
            console.error('Error saving limit:', error);
        }
    };

    const handleApprovalAction = async (approvalId, action, notes = '') => {
        try {
            const response = await fetch(`/api/financial-manager/approvals/${approvalId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'X-Session-Token': localStorage.getItem('sessionToken'),
                    'X-CSRF-Token': localStorage.getItem('csrfToken')
                },
                body: JSON.stringify({ action, notes })
            });

            if (response.ok) {
                setSnackbar({ open: true, message: `Approval ${action}ed successfully`, severity: 'success' });
                fetchDashboardData();
            } else {
                throw new Error('Failed to process approval');
            }
        } catch (error) {
            console.error('Error processing approval:', error);
            setSnackbar({ open: true, message: 'Failed to process approval', severity: 'error' });
        }
    };

    const handleBulkApproval = async (action) => {
        if (selectedApprovals.length === 0) {
            setSnackbar({ open: true, message: 'Please select approvals first', severity: 'warning' });
            return;
        }

        try {
            const promises = selectedApprovals.map(id =>
                fetch(`/api/financial-manager/approvals/${id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`,
                        'X-Session-Token': localStorage.getItem('sessionToken'),
                        'X-CSRF-Token': localStorage.getItem('csrfToken')
                    },
                    body: JSON.stringify({ action, notes: `Bulk ${action}` })
                })
            );

            await Promise.all(promises);
            setSnackbar({ open: true, message: `${selectedApprovals.length} approvals ${action}ed`, severity: 'success' });
            setSelectedApprovals([]);
            fetchDashboardData();
        } catch (error) {
            console.error('Error processing bulk approval:', error);
            setSnackbar({ open: true, message: 'Failed to process bulk approval', severity: 'error' });
        }
    };

    const toggleSelectApproval = (id) => {
        setSelectedApprovals(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    const toggleSelectAll = () => {
        if (selectedApprovals.length === dashboardData.pendingApprovals.length) {
            setSelectedApprovals([]);
        } else {
            setSelectedApprovals(dashboardData.pendingApprovals.map(a => a.id));
        }
    };

    const getSeverityColor = (severity) => {
        switch (severity) {
            case 'critical': return 'error';
            case 'warning': return 'warning';
            default: return 'info';
        }
    };

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

    const filteredBudgetLimits = dashboardData.budgetLimits.filter(limit =>
        !searchQuery ||
        limit.center_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        limit.role?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const speedDialActions = [
        { icon: <RefreshIcon />, name: 'Refresh Data', action: () => fetchDashboardData(true) },
        { icon: <AddIcon />, name: 'Add Budget Limit', action: () => handleEditLimit() },
        { icon: <ExportIcon />, name: 'Export Report', action: () => setTabValue(0) },
        { icon: <NotificationsIcon />, name: 'Notifications', action: () => {} }
    ];

    if (loading) {
        return (
            <Box sx={{ p: 3 }}>
                <Typography variant="h4" gutterBottom>Financial Manager Dashboard</Typography>
                <Grid container spacing={3} sx={{ mb: 3 }}>
                    {[1, 2, 3, 4].map(i => (
                        <Grid item xs={12} sm={6} md={3} key={i}>
                            <Card><CardContent><Skeleton variant="rectangular" height={80} /></CardContent></Card>
                        </Grid>
                    ))}
                </Grid>
                <LinearProgress />
                <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
                    Loading Financial Manager Dashboard...
                </Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3, position: 'relative' }}>
            {/* Header with Actions */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box>
                    <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <DashboardIcon color="primary" fontSize="large" />
                        Financial Manager Dashboard
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                        Comprehensive budget oversight and approval management
                    </Typography>
                </Box>
                <Stack direction="row" spacing={2}>
                    <Tooltip title="Refresh Dashboard">
                        <IconButton
                            onClick={() => fetchDashboardData(true)}
                            disabled={refreshing}
                            color="primary"
                        >
                            <RefreshIcon className={refreshing ? 'rotating' : ''} />
                        </IconButton>
                    </Tooltip>
                    <Badge badgeContent={dashboardData.overview?.pendingApprovals || 0} color="error">
                        <Tooltip title="Pending Approvals">
                            <IconButton color="warning">
                                <NotificationsIcon />
                            </IconButton>
                        </Tooltip>
                    </Badge>
                </Stack>
            </Box>

            {refreshing && <LinearProgress sx={{ mb: 2 }} />}

            {/* Overview Cards */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
                        <CardContent>
                            <Stack spacing={2}>
                                <Box display="flex" alignItems="center" justifyContent="space-between">
                                    <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.3)', width: 56, height: 56 }}>
                                        <MoneyIcon fontSize="large" />
                                    </Avatar>
                                    <Chip
                                        label={<TrendingUpIcon />}
                                        size="small"
                                        sx={{ bgcolor: 'rgba(255,255,255,0.3)', color: 'white' }}
                                    />
                                </Box>
                                <Box>
                                    <Typography variant="h4">
                                        ${dashboardData.overview?.totalBudget?.toLocaleString() || 0}
                                    </Typography>
                                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                                        Total Budget Authority
                                    </Typography>
                                </Box>
                            </Stack>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white' }}>
                        <CardContent>
                            <Stack spacing={2}>
                                <Box display="flex" alignItems="center" justifyContent="space-between">
                                    <Badge badgeContent={dashboardData.overview?.pendingApprovals || 0} color="error">
                                        <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.3)', width: 56, height: 56 }}>
                                            <WarningIcon fontSize="large" />
                                        </Avatar>
                                    </Badge>
                                    <Chip
                                        label="Urgent"
                                        size="small"
                                        sx={{ bgcolor: 'rgba(255,255,255,0.3)', color: 'white' }}
                                    />
                                </Box>
                                <Box>
                                    <Typography variant="h4">
                                        {dashboardData.overview?.pendingApprovals || 0}
                                    </Typography>
                                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                                        Pending Approvals
                                    </Typography>
                                </Box>
                            </Stack>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', color: 'white' }}>
                        <CardContent>
                            <Stack spacing={2}>
                                <Box display="flex" alignItems="center" justifyContent="space-between">
                                    <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.3)', width: 56, height: 56 }}>
                                        <SecurityIcon fontSize="large" />
                                    </Avatar>
                                    <Chip
                                        label={<InfoIcon />}
                                        size="small"
                                        sx={{ bgcolor: 'rgba(255,255,255,0.3)', color: 'white' }}
                                    />
                                </Box>
                                <Box>
                                    <Typography variant="h4">
                                        {dashboardData.overview?.oversightItems || 0}
                                    </Typography>
                                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                                        Oversight Items
                                    </Typography>
                                </Box>
                            </Stack>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', color: 'white' }}>
                        <CardContent>
                            <Stack spacing={2}>
                                <Box display="flex" alignItems="center" justifyContent="space-between">
                                    <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.3)', width: 56, height: 56 }}>
                                        <AssessmentIcon fontSize="large" />
                                    </Avatar>
                                    <Chip
                                        label="Active"
                                        size="small"
                                        sx={{ bgcolor: 'rgba(255,255,255,0.3)', color: 'white' }}
                                    />
                                </Box>
                                <Box>
                                    <Typography variant="h4">
                                        {dashboardData.overview?.centersManaged || 0}
                                    </Typography>
                                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                                        Centers Managed
                                    </Typography>
                                </Box>
                            </Stack>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Export Panel */}
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Box display="flex" gap={2} alignItems="center" flexWrap="wrap">
                        <TextField
                            label="Start date"
                            type="date"
                            size="small"
                            InputLabelProps={{ shrink: true }}
                            value={exportParams.start_date}
                            onChange={e => setExportParams(p => ({ ...p, start_date: e.target.value }))}
                        />
                        <TextField
                            label="End date"
                            type="date"
                            size="small"
                            InputLabelProps={{ shrink: true }}
                            value={exportParams.end_date}
                            onChange={e => setExportParams(p => ({ ...p, end_date: e.target.value }))}
                        />
                        <FormControl size="small" sx={{ minWidth: 160 }}>
                            <InputLabel>Category</InputLabel>
                            <Select
                                value={exportParams.category}
                                label="Category"
                                onChange={e => setExportParams(p => ({ ...p, category: e.target.value }))}
                            >
                                <MenuItem value="">All</MenuItem>
                                {dashboardData.budgetLimits?.map((b) => (
                                    <MenuItem key={b.id} value={b.category || ''}>{b.category || b.role || 'General'}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <FormControl size="small" sx={{ minWidth: 160 }}>
                            <InputLabel>Status</InputLabel>
                            <Select
                                value={exportParams.status}
                                label="Status"
                                onChange={e => setExportParams(p => ({ ...p, status: e.target.value }))}
                            >
                                <MenuItem value="">All</MenuItem>
                                <MenuItem value="pending">Pending</MenuItem>
                                <MenuItem value="approved">Approved</MenuItem>
                                <MenuItem value="rejected">Rejected</MenuItem>
                            </Select>
                        </FormControl>

                        <Button variant="contained" color="primary" disabled={exporting} onClick={async () => {
                            try {
                                setExporting(true);
                                const token = localStorage.getItem('token');
                                const resp = await exportExpenses(exportParams);
                                // create blob link
                                const blob = new Blob([resp.data], { type: resp.headers['content-type'] || 'application/octet-stream' });
                                const url = window.URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                const filename = resp.headers['content-disposition'] && resp.headers['content-disposition'].match(/filename="?([^";]+)/)?.[1]
                                    ? resp.headers['content-disposition'].match(/filename="?([^";]+)/)[1]
                                    : `expenses_export_${Date.now()}.xlsx`;
                                a.href = url;
                                a.download = filename;
                                document.body.appendChild(a);
                                a.click();
                                a.remove();
                                window.URL.revokeObjectURL(url);
                            } catch (e) {
                                console.error('Export failed', e);
                            } finally {
                                setExporting(false);
                            }
                        }}>Export Expenses</Button>
                    </Box>
                </CardContent>
            </Card>

            {/* Tabs */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={tabValue} onChange={handleTabChange}>
                    <Tab label="Budget Limits" />
                    <Tab label="Pending Approvals" />
                    <Tab label="Financial Oversight" />
                    <Tab label="Analytics" />
                </Tabs>
            </Box>

            {/* Budget Limits Tab */}
            <TabPanel value={tabValue} index={0}>
                <Stack spacing={2} mb={2}>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography variant="h6">Budget Approval Limits</Typography>
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={() => handleEditLimit()}
                        >
                            Add New Limit
                        </Button>
                    </Box>
                    <TextField
                        placeholder="Search by center or role..."
                        size="small"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon />
                                </InputAdornment>
                            )
                        }}
                        sx={{ maxWidth: 400 }}
                    />
                </Stack>

                {filteredBudgetLimits.length === 0 ? (
                    <Card>
                        <CardContent sx={{ textAlign: 'center', py: 6 }}>
                            <MoneyIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                            <Typography variant="h6" color="textSecondary" gutterBottom>
                                No Budget Limits Found
                            </Typography>
                            <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                                {searchQuery ? 'Try adjusting your search' : 'Get started by adding your first budget limit'}
                            </Typography>
                            {!searchQuery && (
                                <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleEditLimit()}>
                                    Add Budget Limit
                                </Button>
                            )}
                        </CardContent>
                    </Card>
                ) : (
                    <TableContainer component={Paper}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Center</TableCell>
                                    <TableCell>Role</TableCell>
                                    <TableCell>Approval Limit</TableCell>
                                    <TableCell>Fiscal Year</TableCell>
                                    <TableCell>Status</TableCell>
                                    <TableCell>Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filteredBudgetLimits.map((limit) => (
                                    <TableRow key={limit.id} hover>
                                        <TableCell>
                                            <Typography variant="body2" fontWeight="medium">
                                                {limit.center_name}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={limit.role?.replace('_', ' ').toUpperCase()}
                                                size="small"
                                                color="primary"
                                                variant="outlined"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2" fontWeight="bold" color="primary.main">
                                                ${limit.approval_limit?.toLocaleString()}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>{limit.fiscal_year}</TableCell>
                                        <TableCell>
                                            <Chip
                                                label={limit.is_active ? 'Active' : 'Inactive'}
                                                color={limit.is_active ? 'success' : 'default'}
                                                size="small"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Tooltip title="Edit Limit">
                                                <IconButton
                                                    size="small"
                                                    onClick={() => handleEditLimit(limit)}
                                                    color="primary"
                                                >
                                                    <EditIcon />
                                                </IconButton>
                                            </Tooltip>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </TabPanel>

            {/* Pending Approvals Tab */}
            <TabPanel value={tabValue} index={1}>
                <Stack spacing={2} mb={2}>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography variant="h6">Pending Approvals</Typography>
                        {selectedApprovals.length > 0 && (
                            <Stack direction="row" spacing={1}>
                                <Chip
                                    label={`${selectedApprovals.length} selected`}
                                    onDelete={() => setSelectedApprovals([])}
                                    color="primary"
                                />
                                <Button
                                    variant="contained"
                                    color="success"
                                    size="small"
                                    startIcon={<CheckIcon />}
                                    onClick={() => handleBulkApproval('approve')}
                                >
                                    Approve Selected
                                </Button>
                                <Button
                                    variant="contained"
                                    color="error"
                                    size="small"
                                    startIcon={<RejectIcon />}
                                    onClick={() => handleBulkApproval('reject')}
                                >
                                    Reject Selected
                                </Button>
                            </Stack>
                        )}
                    </Box>
                    {dashboardData.pendingApprovals.length > 0 && (
                        <Button
                            variant="outlined"
                            size="small"
                            startIcon={selectedApprovals.length === dashboardData.pendingApprovals.length ? <UncheckedIcon /> : <CheckedIcon />}
                            onClick={toggleSelectAll}
                            sx={{ alignSelf: 'flex-start' }}
                        >
                            {selectedApprovals.length === dashboardData.pendingApprovals.length ? 'Deselect All' : 'Select All'}
                        </Button>
                    )}
                </Stack>

                {dashboardData.pendingApprovals.length === 0 ? (
                    <Card>
                        <CardContent sx={{ textAlign: 'center', py: 6 }}>
                            <CheckIcon sx={{ fontSize: 60, color: 'success.main', mb: 2 }} />
                            <Typography variant="h6" color="textSecondary" gutterBottom>
                                No Pending Approvals
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                                All budget approvals have been processed
                            </Typography>
                        </CardContent>
                    </Card>
                ) : (
                    dashboardData.pendingApprovals.map((approval) => (
                        <Card
                            key={approval.id}
                            sx={{
                                mb: 2,
                                border: selectedApprovals.includes(approval.id) ? 2 : 0,
                                borderColor: 'primary.main'
                            }}
                        >
                            <CardContent>
                                <Grid container spacing={2}>
                                    <Grid item xs={12} md={8}>
                                        <Stack direction="row" spacing={2} alignItems="flex-start">
                                            <Checkbox
                                                checked={selectedApprovals.includes(approval.id)}
                                                onChange={() => toggleSelectApproval(approval.id)}
                                            />
                                            <Box flex={1}>
                                                <Typography variant="h6">{approval.description}</Typography>
                                                <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
                                                    <Chip
                                                        icon={<MoneyIcon />}
                                                        label={`$${approval.amount?.toLocaleString()}`}
                                                        size="small"
                                                        color="primary"
                                                    />
                                                    <Chip
                                                        label={approval.category}
                                                        size="small"
                                                        variant="outlined"
                                                    />
                                                    <Chip
                                                        icon={<Avatar sx={{ width: 20, height: 20 }}>{approval.requester_name?.charAt(0)}</Avatar>}
                                                        label={approval.requester_name}
                                                        size="small"
                                                    />
                                                </Stack>
                                                {approval.justification && (
                                                    <Typography variant="body2" sx={{ mt: 2 }} color="textSecondary">
                                                        {approval.justification}
                                                    </Typography>
                                                )}
                                            </Box>
                                        </Stack>
                                    </Grid>
                                    <Grid item xs={12} md={4}>
                                        <Stack spacing={1}>
                                            <Button
                                                variant="contained"
                                                color="success"
                                                fullWidth
                                                startIcon={<CheckIcon />}
                                                onClick={() => handleApprovalAction(approval.id, 'approve')}
                                            >
                                                Approve
                                            </Button>
                                            <Button
                                                variant="contained"
                                                color="error"
                                                fullWidth
                                                startIcon={<RejectIcon />}
                                                onClick={() => handleApprovalAction(approval.id, 'reject')}
                                            >
                                                Reject
                                            </Button>
                                        </Stack>
                                    </Grid>
                                </Grid>
                            </CardContent>
                        </Card>
                    ))
                )}
            </TabPanel>

            {/* Financial Oversight Tab */}
            <TabPanel value={tabValue} index={2}>
                <Typography variant="h6" gutterBottom>Financial Oversight Items</Typography>

                {dashboardData.oversightItems.map((item) => (
                    <Alert
                        key={item.id}
                        severity={getSeverityColor(item.severity)}
                        sx={{ mb: 2 }}
                    >
                        <Typography variant="h6">{item.title}</Typography>
                        <Typography variant="body2">{item.description}</Typography>
                        {item.amount && (
                            <Typography variant="body2">Amount: ${item.amount.toLocaleString()}</Typography>
                        )}
                    </Alert>
                ))}
            </TabPanel>

            {/* Analytics Tab */}
            <TabPanel value={tabValue} index={3}>
                <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>Approval Activity</Typography>
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={dashboardData.analytics?.approvalActivity || []}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="month" />
                                        <YAxis />
                                        <Tooltip />
                                        <Bar dataKey="approvals" fill="#8884d8" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} md={6}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>Budget Distribution</Typography>
                                <ResponsiveContainer width="100%" height={300}>
                                    <PieChart>
                                        <Pie
                                            data={dashboardData.analytics?.budgetDistribution || []}
                                            cx="50%"
                                            cy="50%"
                                            outerRadius={100}
                                            fill="#8884d8"
                                            dataKey="value"
                                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                        >
                                            {(dashboardData.analytics?.budgetDistribution || []).map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            </TabPanel>

            {/* Budget Limit Dialog */}
            <Dialog open={limitDialog.open} onClose={() => setLimitDialog({ open: false, limit: null })}>
                <DialogTitle>
                    {limitDialog.limit?.id ? 'Edit Budget Limit' : 'Add Budget Limit'}
                </DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={12}>
                            <FormControl fullWidth>
                                <InputLabel>Center</InputLabel>
                                <Select
                                    value={limitDialog.limit?.center_id || ''}
                                    onChange={(e) => setLimitDialog({
                                        ...limitDialog,
                                        limit: { ...limitDialog.limit, center_id: e.target.value }
                                    })}
                                >
                                    {dashboardData.centers.map((center) => (
                                        <MenuItem key={center.id} value={center.id}>
                                            {center.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>

                        <Grid item xs={12}>
                            <FormControl fullWidth>
                                <InputLabel>Role</InputLabel>
                                <Select
                                    value={limitDialog.limit?.role || ''}
                                    onChange={(e) => setLimitDialog({
                                        ...limitDialog,
                                        limit: { ...limitDialog.limit, role: e.target.value }
                                    })}
                                >
                                    <MenuItem value="center_director">Center Director</MenuItem>
                                    <MenuItem value="admin">Admin</MenuItem>
                                    <MenuItem value="academic_coordinator">Academic Coordinator</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>

                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Approval Limit"
                                type="number"
                                value={limitDialog.limit?.approval_limit || ''}
                                onChange={(e) => setLimitDialog({
                                    ...limitDialog,
                                    limit: { ...limitDialog.limit, approval_limit: parseFloat(e.target.value) }
                                })}
                            />
                        </Grid>

                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Notes"
                                multiline
                                rows={3}
                                value={limitDialog.limit?.notes || ''}
                                onChange={(e) => setLimitDialog({
                                    ...limitDialog,
                                    limit: { ...limitDialog.limit, notes: e.target.value }
                                })}
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setLimitDialog({ open: false, limit: null })}>
                        Cancel
                    </Button>
                    <Button onClick={handleSaveLimit} variant="contained">
                        Save
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Speed Dial for Quick Actions */}
            <SpeedDial
                ariaLabel="Quick Actions"
                sx={{ position: 'fixed', bottom: 32, right: 32 }}
                icon={<SpeedDialIcon />}
            >
                {speedDialActions.map((action) => (
                    <SpeedDialAction
                        key={action.name}
                        icon={action.icon}
                        tooltipTitle={action.name}
                        onClick={action.action}
                    />
                ))}
            </SpeedDial>

            {/* Snackbar for notifications */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
            >
                <Alert
                    onClose={() => setSnackbar({ ...snackbar, open: false })}
                    severity={snackbar.severity}
                    sx={{ width: '100%' }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>

            <style>{`
                @keyframes rotate {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .rotating {
                    animation: rotate 1s linear infinite;
                }
            `}</style>
        </Box>
    );
};

export default FinancialManagerDashboard;