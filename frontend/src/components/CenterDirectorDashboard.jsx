import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import EmergencyAlertDialog from './EmergencyAlertDialog';
import {
  Box,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Chip,
  LinearProgress,
  Alert,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tab,
  Tabs,
  Tooltip
} from '@mui/material';
import {
  TrendingUp,
  People,
  LocalAtm,
  Warning,
  CheckCircle,
  Schedule,
  Feedback,
  Policy,
  Assessment,
  School,
  SupervisorAccount,
  MonetizationOn,
  ReportProblem,
  Chat,
  Analytics,
  CalendarToday,
  Notifications,
  PersonAdd,
  AccountBalance,
  ReportProblem as Emergency,
  ThumbUp,
  ThumbDown,
  Refresh
} from '@mui/icons-material';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

const CenterDirectorDashboard = ({ user }) => {
  const [dashboardData, setDashboardData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentTab, setCurrentTab] = useState(0);
  const [selectedKPI, setSelectedKPI] = useState(null);
  const [realTimeUpdates, setRealTimeUpdates] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [emergencyDialogOpen, setEmergencyDialogOpen] = useState(false);
  const [activeEmergencies, setActiveEmergencies] = useState([]);
  const socketRef = useRef(null);

  useEffect(() => {
    loadDashboardData();
    initializeWebSocket();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  const initializeWebSocket = () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      // Connect to WebSocket server
      socketRef.current = io(import.meta.env.VITE_API_URL || 'http://localhost:5001', {
        auth: {
          token: token
        }
      });

      socketRef.current.on('connect', () => {
        console.log('WebSocket connected');
        setConnectionStatus('connected');

        // Join center-specific room for targeted updates
        if (user?.center_id) {
          socketRef.current.emit('join-center', user.center_id);
          socketRef.current.emit('subscribe-dashboard', {
            centerId: user.center_id,
            userId: user.id
          });
        }
      });

      socketRef.current.on('disconnect', () => {
        console.log('WebSocket disconnected');
        setConnectionStatus('disconnected');
      });

      // Listen for real-time dashboard updates
      socketRef.current.on('dashboard-update', (updateData) => {
        console.log('Dashboard update received:', updateData);
        handleRealTimeUpdate(updateData);
      });

      // Listen for emergency alerts
      socketRef.current.on('emergency-alert', (alertData) => {
        console.log('Emergency alert received:', alertData);
        handleEmergencyAlert(alertData);
      });

      // Listen for emergency resolutions
      socketRef.current.on('emergency-resolved', (resolutionData) => {
        console.log('Emergency resolved:', resolutionData);
        handleEmergencyResolved(resolutionData);
      });

      // Listen for staff updates
      socketRef.current.on('staff-status-update', (staffUpdate) => {
        console.log('Staff status update:', staffUpdate);
        updateStaffStatus(staffUpdate);
      });

      // Listen for new incidents
      socketRef.current.on('new-incident', (incidentData) => {
        console.log('New incident reported:', incidentData);
        updateIncidentData(incidentData);
      });

      // Listen for parent feedback
      socketRef.current.on('new-feedback', (feedbackData) => {
        console.log('New parent feedback:', feedbackData);
        updateFeedbackData(feedbackData);
      });

      socketRef.current.on('connect_error', (error) => {
        console.error('WebSocket connection error:', error);
        setConnectionStatus('error');
      });

    } catch (error) {
      console.error('Failed to initialize WebSocket:', error);
      setConnectionStatus('error');
    }
  };

  const handleRealTimeUpdate = (updateData) => {
    const timestamp = new Date().toLocaleTimeString();
    setRealTimeUpdates(prev => [{
      id: Date.now(),
      message: updateData.message,
      type: updateData.type,
      timestamp: timestamp
    }, ...prev.slice(0, 4)]); // Keep only last 5 updates

    // Apply the update to dashboard data
    if (updateData.type === 'kpi-update') {
      setDashboardData(prev => ({
        ...prev,
        operationalKPIs: prev.operationalKPIs?.map(kpi =>
          kpi.name === updateData.data.metric_name
            ? { ...kpi, value: updateData.data.metric_value, status: calculateKPIStatus(updateData.data) }
            : kpi
        ) || []
      }));
    }
  };

  const handleEmergencyAlert = (alertData) => {
    // Add to active emergencies
    setActiveEmergencies(prev => {
      // Check if this emergency is already in the list
      if (prev.some(e => e.id === alertData.id)) {
        return prev;
      }
      return [alertData, ...prev];
    });

    // Show emergency notification
    const timestamp = new Date().toLocaleTimeString();
    setRealTimeUpdates(prev => [{
      id: Date.now(),
      message: `EMERGENCY: ${alertData.message}`,
      type: 'emergency',
      timestamp: timestamp,
      severity: alertData.severity
    }, ...prev.slice(0, 4)]);

    // Browser notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('🚨 EMERGENCY ALERT', {
        body: `${alertData.type.toUpperCase()}: ${alertData.message}`,
        icon: '/emergency-icon.png',
        tag: 'emergency',
        requireInteraction: true
      });
    }

    // Audio alert
    try {
      const audio = new Audio('/emergency-alert.mp3');
      audio.play().catch(e => console.warn('Could not play emergency sound:', e));
    } catch (e) {
      console.warn('Emergency audio not available:', e);
    }
  };

  const handleEmergencyResolved = (resolutionData) => {
    // Remove from active emergencies
    setActiveEmergencies(prev =>
      prev.filter(emergency => emergency.id !== resolutionData.alert_id)
    );

    // Add resolution update
    const timestamp = new Date().toLocaleTimeString();
    setRealTimeUpdates(prev => [{
      id: Date.now(),
      message: `Emergency resolved: ${resolutionData.resolution_notes || 'All clear'}`,
      type: 'resolution',
      timestamp: timestamp
    }, ...prev.slice(0, 4)]);
  };

  const triggerEmergencyAlert = async (alertData) => {
    const token = localStorage.getItem('token');

    const response = await fetch('/api/center-director/emergency/alert', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(alertData)
    });

    if (!response.ok) {
      throw new Error(`Failed to trigger emergency alert: ${response.status}`);
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.message || 'Failed to trigger emergency alert');
    }

    return result;
  };

  const updateStaffStatus = (staffUpdate) => {
    setDashboardData(prev => ({
      ...prev,
      staffMetrics: {
        ...prev.staffMetrics,
        presentToday: staffUpdate.presentCount,
        onLeave: staffUpdate.onLeaveCount,
        overtime: staffUpdate.overtimeCount
      }
    }));
  };

  const updateIncidentData = (incidentData) => {
    setDashboardData(prev => ({
      ...prev,
      incidents: {
        ...prev.incidents,
        thisMonth: prev.incidents.thisMonth + 1,
        pending: prev.incidents.pending + 1,
        recent: [incidentData, ...prev.incidents.recent.slice(0, 4)]
      }
    }));
  };

  const updateFeedbackData = (feedbackData) => {
    setDashboardData(prev => ({
      ...prev,
      parentFeedback: {
        ...prev.parentFeedback,
        total: prev.parentFeedback.total + 1,
        pending: prev.parentFeedback.pending + 1
      }
    }));
  };

  const calculateKPIStatus = (kpiData) => {
    const value = parseFloat(kpiData.metric_value);
    const target = parseFloat(kpiData.target_value);

    if (!target) return 'good';

    const performance = kpiData.metric_name.toLowerCase().includes('incident') ?
      (target - value) / target : (value / target);

    if (performance >= 1.1) return 'excellent';
    else if (performance >= 0.9) return 'good';
    else if (performance >= 0.8) return 'warning';
    else return 'critical';
  };

  const loadDashboardData = async () => {
    setLoading(true);
    setError('');
    try {
      // Get authentication token
      const token = localStorage.getItem('token');

      if (!token) {
        throw new Error('No authentication token found');
      }

      // Fetch dashboard data from API
      const response = await fetch('/api/center-director/dashboard', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Failed to load dashboard data');
      }

      const apiData = result.data;

      // Transform API data to dashboard format
      const transformedData = {
        centerInfo: {
          name: apiData.centerInfo?.name || 'Center',
          capacity: 150, // This would come from center settings
          currentEnrollment: apiData.enrollment?.current_enrollment || 0,
          totalStaff: apiData.staff?.total_staff || 0,
          activeStaff: apiData.staff?.active_staff || 0,
          budgetLimit: apiData.centerInfo?.director_budget_limit || 25000,
          monthlyBudget: apiData.centerInfo?.monthly_budget || 0,
          emergencyFund: apiData.centerInfo?.emergency_fund || 0
        },
        operationalKPIs: transformKPIs(apiData.kpis || []),
        budgetSummary: {
          totalBudget: apiData.centerInfo?.monthly_budget || 125000,
          utilized: apiData.budget?.approved_amount || 0,
          remaining: (apiData.centerInfo?.monthly_budget || 125000) - (apiData.budget?.approved_amount || 0),
          pendingApprovals: apiData.budget?.pending_approvals || 0,
          approvalLimit: apiData.budget?.dynamic_approval_limit || apiData.budget?.approval_limit || 25000
        },
        staffMetrics: transformStaffMetrics(apiData.staff, apiData.performance),
        parentFeedback: {
          total: apiData.feedback?.total_feedback || 0,
          pending: apiData.feedback?.pending_feedback || 0,
          resolved: (apiData.feedback?.total_feedback || 0) - (apiData.feedback?.pending_feedback || 0),
          averageRating: parseFloat(apiData.feedback?.avg_rating || 0).toFixed(1),
          categories: [] // Will be populated by separate call if needed
        },
        incidents: {
          thisMonth: apiData.incidents?.length || 0,
          resolved: apiData.incidents?.filter(i => i.status === 'resolved').length || 0,
          pending: apiData.incidents?.filter(i => i.status !== 'resolved').length || 0,
          critical: apiData.incidents?.filter(i => i.severity === 'critical').length || 0,
          recent: (apiData.incidents || []).slice(0, 5).map(incident => ({
            id: incident.id,
            type: incident.incident_type,
            date: new Date(incident.incident_date).toLocaleDateString(),
            status: incident.status,
            severity: incident.severity
          }))
        },
        upcomingTasks: generateUpcomingTasks(apiData) // Generate based on pending items
      };

      setDashboardData(transformedData);
    } catch (err) {
      console.error('Dashboard load error:', err);
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const getKPIStatusColor = (status) => {
    switch (status) {
      case 'excellent': return '#4caf50';
      case 'good': return '#2196f3';
      case 'warning': return '#ff9800';
      case 'critical': return '#f44336';
      default: return '#757575';
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  // Transform KPIs from API format to dashboard format
  const transformKPIs = (kpis) => {
    const kpiMap = {};

    // Group KPIs by name and use the latest value
    kpis.forEach(kpi => {
      if (!kpiMap[kpi.metric_name] || new Date(kpi.measurement_date) > new Date(kpiMap[kpi.metric_name].measurement_date)) {
        kpiMap[kpi.metric_name] = kpi;
      }
    });

    // Convert to dashboard format with status calculation
    return Object.values(kpiMap).map(kpi => {
      const value = parseFloat(kpi.metric_value);
      const target = parseFloat(kpi.target_value);
      let status = 'good';

      if (target) {
        const performance = kpi.metric_name.toLowerCase().includes('incident') ?
          (target - value) / target : // For incidents, lower is better
          (value / target); // For most metrics, higher is better

        if (performance >= 1.1) status = 'excellent';
        else if (performance >= 0.9) status = 'good';
        else if (performance >= 0.8) status = 'warning';
        else status = 'critical';
      }

      return {
        name: kpi.metric_name,
        value: value,
        target: target,
        unit: kpi.metric_unit || '',
        status: status,
        category: kpi.category
      };
    });
  };

  // Transform staff metrics from API format
  const transformStaffMetrics = (staff, performance) => {
    const performanceMap = {};

    // Count performance ratings
    if (performance && Array.isArray(performance)) {
      performance.forEach(p => {
        performanceMap[p.overall_rating] = p.count;
      });
    }

    return {
      totalStaff: staff?.total_staff || 0,
      presentToday: staff?.active_staff || 0,
      onLeave: (staff?.total_staff || 0) - (staff?.active_staff || 0),
      overtime: 0, // This would need to be calculated from schedules
      newHires: 0, // This would need to be calculated from recent hires
      performance: {
        outstanding: performanceMap['outstanding'] || 0,
        exceeds: performanceMap['exceeds_expectations'] || 0,
        meets: performanceMap['meets_expectations'] || 0,
        below: performanceMap['below_expectations'] || 0,
        unsatisfactory: performanceMap['unsatisfactory'] || 0
      }
    };
  };

  // Generate upcoming tasks based on dashboard data
  const generateUpcomingTasks = (apiData) => {
    const tasks = [];
    const today = new Date();

    // Add pending budget approvals as tasks
    if (apiData.budget?.pending_approvals > 0) {
      const nextWeek = new Date(today);
      nextWeek.setDate(today.getDate() + 7);
      tasks.push({
        id: 'budget-review',
        task: `Review ${apiData.budget.pending_approvals} Budget Requests`,
        date: nextWeek.toLocaleDateString(),
        priority: 'High'
      });
    }

    // Add pending feedback as tasks
    if (apiData.feedback?.pending_feedback > 0) {
      const nextFriday = new Date(today);
      nextFriday.setDate(today.getDate() + (5 - today.getDay()));
      tasks.push({
        id: 'feedback-review',
        task: `Respond to ${apiData.feedback.pending_feedback} Parent Feedback`,
        date: nextFriday.toLocaleDateString(),
        priority: 'Medium'
      });
    }

    // Add monthly staff meeting
    const nextMonth = new Date(today);
    nextMonth.setMonth(today.getMonth() + 1, 1);
    tasks.push({
      id: 'staff-meeting',
      task: 'Monthly Staff Meeting',
      date: nextMonth.toLocaleDateString(),
      priority: 'High'
    });

    // Add safety drill reminder
    const nextSafetyDrill = new Date(today);
    nextSafetyDrill.setDate(today.getDate() + 28);
    tasks.push({
      id: 'safety-drill',
      task: 'Quarterly Safety Drill',
      date: nextSafetyDrill.toLocaleDateString(),
      priority: 'High'
    });

    return tasks.slice(0, 4); // Limit to 4 tasks
  };

  if (loading) {
    return (
      <Box p={3}>
        <Typography variant="h5" gutterBottom>Center Director Dashboard</Typography>
        <LinearProgress />
        <Typography variant="body2" color="text.secondary" mt={2}>
          Loading operational data...
        </Typography>
      </Box>
    );
  }

  const { centerInfo, operationalKPIs, budgetSummary, staffMetrics, parentFeedback, incidents, upcomingTasks } = dashboardData;

  return (
    <Box p={2}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Stack direction="row" spacing={2} alignItems="center">
            <Box>
              <Typography variant="h4">Center Director Dashboard</Typography>
              <Typography variant="subtitle1" color="text.secondary">
                {centerInfo?.name} • {new Date().toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </Typography>
            </Box>
            <Chip
              label={connectionStatus === 'connected' ? 'Live' : 'Offline'}
              color={connectionStatus === 'connected' ? 'success' : 'default'}
              size="small"
              variant="outlined"
              icon={connectionStatus === 'connected' ? <CheckCircle /> : <Warning />}
            />
          </Stack>
        </Box>
        <Stack direction="row" spacing={2}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={loadDashboardData}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<Emergency />}
            color="error"
            onClick={() => {
              // Request notification permission if needed
              if ('Notification' in window && Notification.permission === 'default') {
                Notification.requestPermission();
              }
              setEmergencyDialogOpen(true);
            }}
            sx={{
              animation: activeEmergencies.length > 0 ? 'pulse 2s infinite' : 'none',
              '@keyframes pulse': {
                '0%': {
                  boxShadow: '0 0 0 0 rgba(244, 67, 54, 0.7)',
                },
                '70%': {
                  boxShadow: '0 0 0 10px rgba(244, 67, 54, 0)',
                },
                '100%': {
                  boxShadow: '0 0 0 0 rgba(244, 67, 54, 0)',
                },
              },
            }}
          >
            Emergency {activeEmergencies.length > 0 && `(${activeEmergencies.length})`}
          </Button>
        </Stack>
      </Box>

      {/* Real-time Updates */}
      {realTimeUpdates.length > 0 && (
        <Card sx={{ mb: 3, border: connectionStatus === 'connected' ? '1px solid #4caf50' : 'none' }}>
          <CardHeader
            title="Live Updates"
            titleTypographyProps={{ variant: 'h6' }}
            action={
              <Chip
                label={`${realTimeUpdates.length} updates`}
                size="small"
                color="primary"
              />
            }
          />
          <CardContent sx={{ pt: 0 }}>
            <List dense>
              {realTimeUpdates.slice(0, 3).map((update) => (
                <ListItem key={update.id}>
                  <ListItemIcon>
                    {update.type === 'emergency' ? (
                      <Emergency color="error" />
                    ) : update.type === 'incident' ? (
                      <Warning color="warning" />
                    ) : (
                      <Notifications color="info" />
                    )}
                  </ListItemIcon>
                  <ListItemText
                    primary={update.message}
                    secondary={update.timestamp}
                    primaryTypographyProps={{
                      color: update.type === 'emergency' ? 'error.main' : 'text.primary'
                    }}
                  />
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      )}

      {/* Active Emergency Alerts */}
      {activeEmergencies.length > 0 && (
        <Card sx={{
          mb: 3,
          border: '3px solid #f44336',
          bgcolor: '#ffebee',
          animation: 'emergency-blink 2s infinite',
          '@keyframes emergency-blink': {
            '0%, 50%': { borderColor: '#f44336' },
            '25%, 75%': { borderColor: '#ff8a80' }
          }
        }}>
          <CardHeader
            title={
              <Stack direction="row" alignItems="center" spacing={1}>
                <Emergency sx={{ color: '#f44336' }} />
                <Typography variant="h6" color="error.main">
                  ACTIVE EMERGENCY ALERTS ({activeEmergencies.length})
                </Typography>
              </Stack>
            }
            sx={{ bgcolor: '#f44336', color: 'white' }}
          />
          <CardContent>
            {activeEmergencies.map((emergency) => (
              <Alert
                key={emergency.id}
                severity="error"
                sx={{ mb: 1 }}
                action={
                  <Button
                    color="inherit"
                    size="small"
                    onClick={() => {
                      // Here you could add functionality to resolve the emergency
                    }}
                  >
                    ACKNOWLEDGE
                  </Button>
                }
              >
                <Typography variant="subtitle2">
                  <strong>{emergency.type?.toUpperCase()}</strong> - {emergency.severity?.toUpperCase()}
                </Typography>
                <Typography variant="body2">
                  {emergency.message}
                </Typography>
                {emergency.location && (
                  <Typography variant="caption" display="block">
                    Location: {emergency.location}
                  </Typography>
                )}
                <Typography variant="caption" display="block">
                  Triggered: {new Date(emergency.triggered_at).toLocaleString()}
                </Typography>
              </Alert>
            ))}
          </CardContent>
        </Card>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Quick Stats */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Stack direction="row" spacing={2} alignItems="center">
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                  <School />
                </Avatar>
                <Box>
                  <Typography variant="h4">{centerInfo?.currentEnrollment}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Students Enrolled
                  </Typography>
                  <Typography variant="caption" color="success.main">
                    {((centerInfo?.currentEnrollment / centerInfo?.capacity) * 100).toFixed(1)}% capacity
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Stack direction="row" spacing={2} alignItems="center">
                <Avatar sx={{ bgcolor: 'secondary.main' }}>
                  <SupervisorAccount />
                </Avatar>
                <Box>
                  <Typography variant="h4">{staffMetrics?.presentToday}/{staffMetrics?.totalStaff}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Staff Present
                  </Typography>
                  <Typography variant="caption" color="success.main">
                    {((staffMetrics?.presentToday / staffMetrics?.totalStaff) * 100).toFixed(1)}% attendance
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Stack direction="row" spacing={2} alignItems="center">
                <Avatar sx={{ bgcolor: 'success.main' }}>
                  <MonetizationOn />
                </Avatar>
                <Box>
                  <Typography variant="h4">{formatCurrency(budgetSummary?.remaining)}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Budget Remaining
                  </Typography>
                  <Typography variant="caption" color="info.main">
                    {((budgetSummary?.remaining / budgetSummary?.totalBudget) * 100).toFixed(1)}% left
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Stack direction="row" spacing={2} alignItems="center">
                <Avatar sx={{ bgcolor: 'warning.main' }}>
                  <Notifications />
                </Avatar>
                <Box>
                  <Typography variant="h4">{parentFeedback?.pending}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Pending Feedback
                  </Typography>
                  <Typography variant="caption" color="warning.main">
                    Requires attention
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Main Content Tabs */}
      <Card sx={{ mb: 3 }}>
        <Tabs value={currentTab} onChange={(e, v) => setCurrentTab(v)} sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tab label="Operational KPIs" />
          <Tab label="Staff Overview" />
          <Tab label="Budget & Finance" />
          <Tab label="Parent Feedback" />
          <Tab label="Incidents & Safety" />
        </Tabs>

        <Box p={3}>
          {/* Operational KPIs Tab */}
          {currentTab === 0 && (
            <Grid container spacing={3}>
              <Grid item xs={12} lg={8}>
                <Typography variant="h6" gutterBottom>Key Performance Indicators</Typography>
                <Grid container spacing={2}>
                  {operationalKPIs?.map((kpi, index) => (
                    <Grid item xs={12} sm={6} key={index}>
                      <Card variant="outlined">
                        <CardContent>
                          <Stack direction="row" justifyContent="space-between" alignItems="center">
                            <Box>
                              <Typography variant="body2" color="text.secondary">{kpi.name}</Typography>
                              <Typography variant="h5" color={getKPIStatusColor(kpi.status)}>
                                {kpi.value}{kpi.unit}
                              </Typography>
                              <Typography variant="caption">
                                Target: {kpi.target}{kpi.unit}
                              </Typography>
                            </Box>
                            <Box textAlign="center">
                              <Chip
                                label={kpi.status}
                                color={kpi.status === 'excellent' ? 'success' : kpi.status === 'good' ? 'primary' : 'warning'}
                                size="small"
                              />
                            </Box>
                          </Stack>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Grid>

              <Grid item xs={12} lg={4}>
                <Card variant="outlined">
                  <CardHeader title="Upcoming Tasks" />
                  <CardContent>
                    <List dense>
                      {upcomingTasks?.map((task) => (
                        <ListItem key={task.id}>
                          <ListItemIcon>
                            <CalendarToday fontSize="small" />
                          </ListItemIcon>
                          <ListItemText
                            primary={task.task}
                            secondary={task.date}
                          />
                          <Chip
                            label={task.priority}
                            size="small"
                            color={task.priority === 'High' ? 'error' : 'default'}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}

          {/* Staff Overview Tab */}
          {currentTab === 1 && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardHeader title="Staff Attendance Today" />
                  <CardContent>
                    <Stack spacing={2}>
                      <Box display="flex" justifyContent="space-between">
                        <Typography>Present</Typography>
                        <Typography color="success.main">{staffMetrics?.presentToday}</Typography>
                      </Box>
                      <Box display="flex" justifyContent="space-between">
                        <Typography>On Leave</Typography>
                        <Typography color="warning.main">{staffMetrics?.onLeave}</Typography>
                      </Box>
                      <Box display="flex" justifyContent="space-between">
                        <Typography>Overtime</Typography>
                        <Typography color="info.main">{staffMetrics?.overtime}</Typography>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardHeader title="Performance Distribution" />
                  <CardContent>
                    <Stack spacing={2}>
                      {Object.entries(staffMetrics?.performance || {}).map(([level, count]) => (
                        <Box key={level} display="flex" justifyContent="space-between" alignItems="center">
                          <Typography sx={{ textTransform: 'capitalize' }}>{level}</Typography>
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <Typography>{count}</Typography>
                            <LinearProgress
                              variant="determinate"
                              value={(count / staffMetrics?.totalStaff) * 100}
                              sx={{ width: 60 }}
                            />
                          </Stack>
                        </Box>
                      ))}
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}

          {/* Budget & Finance Tab */}
          {currentTab === 2 && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardHeader title="Budget Overview" />
                  <CardContent>
                    <Stack spacing={2}>
                      <Box>
                        <Typography variant="body2" color="text.secondary">Total Budget</Typography>
                        <Typography variant="h5">{formatCurrency(budgetSummary?.totalBudget)}</Typography>
                      </Box>
                      <Box>
                        <Typography variant="body2" color="text.secondary">Utilized</Typography>
                        <Typography variant="h6" color="warning.main">
                          {formatCurrency(budgetSummary?.utilized)}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="body2" color="text.secondary">Remaining</Typography>
                        <Typography variant="h6" color="success.main">
                          {formatCurrency(budgetSummary?.remaining)}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="body2" color="text.secondary">Your Approval Limit</Typography>
                        <Typography variant="h6" color="primary.main">
                          {formatCurrency(budgetSummary?.approvalLimit)}
                        </Typography>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardHeader title="Pending Approvals" />
                  <CardContent>
                    <Box textAlign="center" py={2}>
                      <Typography variant="h4" color="warning.main">
                        {formatCurrency(budgetSummary?.pendingApprovals)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Awaiting your approval
                      </Typography>
                      <Button
                        variant="contained"
                        sx={{ mt: 2 }}
                        startIcon={<AccountBalance />}
                      >
                        Review Requests
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}

          {/* Parent Feedback Tab */}
          {currentTab === 3 && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardHeader title="Feedback Summary" />
                  <CardContent>
                    <Stack spacing={2}>
                      <Box display="flex" justifyContent="space-between">
                        <Typography>Total Feedback</Typography>
                        <Typography>{parentFeedback?.total}</Typography>
                      </Box>
                      <Box display="flex" justifyContent="space-between">
                        <Typography>Pending Response</Typography>
                        <Typography color="warning.main">{parentFeedback?.pending}</Typography>
                      </Box>
                      <Box display="flex" justifyContent="space-between">
                        <Typography>Average Rating</Typography>
                        <Typography color="success.main">
                          {parentFeedback?.averageRating}/5 ⭐
                        </Typography>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardHeader title="Feedback by Category" />
                  <CardContent>
                    {parentFeedback?.categories?.map((category) => (
                      <Box key={category.name} mb={2}>
                        <Stack direction="row" justifyContent="space-between" mb={1}>
                          <Typography variant="body2">{category.name}</Typography>
                          <Typography variant="body2">
                            {category.positive}/{category.count} positive
                          </Typography>
                        </Stack>
                        <LinearProgress
                          variant="determinate"
                          value={(category.positive / category.count) * 100}
                          color="success"
                        />
                      </Box>
                    ))}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}

          {/* Incidents & Safety Tab */}
          {currentTab === 4 && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardHeader title="Incident Summary" />
                  <CardContent>
                    <Stack spacing={2}>
                      <Box display="flex" justifyContent="space-between">
                        <Typography>This Month</Typography>
                        <Typography>{incidents?.thisMonth}</Typography>
                      </Box>
                      <Box display="flex" justifyContent="space-between">
                        <Typography>Resolved</Typography>
                        <Typography color="success.main">{incidents?.resolved}</Typography>
                      </Box>
                      <Box display="flex" justifyContent="space-between">
                        <Typography>Pending</Typography>
                        <Typography color="warning.main">{incidents?.pending}</Typography>
                      </Box>
                      <Box display="flex" justifyContent="space-between">
                        <Typography>Critical</Typography>
                        <Typography color="error.main">{incidents?.critical}</Typography>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardHeader title="Recent Incidents" />
                  <CardContent>
                    <List>
                      {incidents?.recent?.map((incident) => (
                        <ListItem key={incident.id}>
                          <ListItemIcon>
                            <ReportProblem
                              color={incident.severity === 'High' ? 'error' : 'warning'}
                            />
                          </ListItemIcon>
                          <ListItemText
                            primary={incident.type}
                            secondary={`${incident.date} • ${incident.status}`}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}
        </Box>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader title="Quick Actions" />
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={6} sm={4} md={2}>
              <Button
                variant="outlined"
                fullWidth
                startIcon={<PersonAdd />}
                sx={{ height: 60 }}
              >
                Add Staff
              </Button>
            </Grid>
            <Grid item xs={6} sm={4} md={2}>
              <Button
                variant="outlined"
                fullWidth
                startIcon={<Schedule />}
                sx={{ height: 60 }}
              >
                Schedule
              </Button>
            </Grid>
            <Grid item xs={6} sm={4} md={2}>
              <Button
                variant="outlined"
                fullWidth
                startIcon={<MonetizationOn />}
                sx={{ height: 60 }}
              >
                Budget
              </Button>
            </Grid>
            <Grid item xs={6} sm={4} md={2}>
              <Button
                variant="outlined"
                fullWidth
                startIcon={<Feedback />}
                sx={{ height: 60 }}
              >
                Feedback
              </Button>
            </Grid>
            <Grid item xs={6} sm={4} md={2}>
              <Button
                variant="outlined"
                fullWidth
                startIcon={<ReportProblem />}
                sx={{ height: 60 }}
              >
                Report
              </Button>
            </Grid>
            <Grid item xs={6} sm={4} md={2}>
              <Button
                variant="outlined"
                fullWidth
                startIcon={<Assessment />}
                sx={{ height: 60 }}
              >
                Analytics
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Emergency Alert Dialog */}
      <EmergencyAlertDialog
        open={emergencyDialogOpen}
        onClose={() => setEmergencyDialogOpen(false)}
        onSubmit={triggerEmergencyAlert}
      />
    </Box>
  );
};

export default CenterDirectorDashboard;