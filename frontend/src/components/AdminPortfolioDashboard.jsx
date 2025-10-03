import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardHeader,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Tab,
  Tabs,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
  Alert,
  Stack,
  Divider
} from '@mui/material';
import {
  PhotoLibrary,
  Person,
  School,
  Favorite,
  TrendingUp,
  CameraAlt,
  Close,
  Visibility,
  Assessment,
  Timeline,
  CalendarToday
} from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import PortfolioGallery from './PortfolioGallery';

const AdminPortfolioDashboard = ({ userRole }) => {
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [currentTab, setCurrentTab] = useState(0);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/digital-portfolio/center/stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load dashboard data');
      }

      const data = await response.json();
      setStats(data);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString();
  };

  // Prepare chart data
  const activityChartData = stats.recentActivity?.map(item => ({
    date: new Date(item.upload_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    uploads: item.items_count
  })) || [];

  const childrenChartData = stats.topChildren?.slice(0, 5).map(child => ({
    name: child.child_name.split(' ')[0],
    photos: child.total_items,
    favorites: child.favorites
  })) || [];

  const teacherChartData = stats.activeTeachers?.slice(0, 5).map(teacher => ({
    name: teacher.teacher_name.split(' ')[0],
    uploads: teacher.total_uploads,
    favorites: teacher.favorites_marked
  })) || [];

  const pieChartData = [
    { name: 'Images', value: stats.overall?.images || 0, color: '#8884d8' },
    { name: 'Videos', value: stats.overall?.videos || 0, color: '#82ca9d' }
  ];

  if (loading) {
    return (
      <Box p={3}>
        <Typography variant="h5" gutterBottom>Portfolio Dashboard</Typography>
        <LinearProgress />
        <Box mt={2}>
          <Typography variant="body2" color="text.secondary">
            Loading dashboard data...
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box p={2}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5">Portfolio Dashboard</Typography>
        <Button
          variant="contained"
          startIcon={<Visibility />}
          onClick={() => setGalleryOpen(true)}
        >
          View All Photos
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Overview Cards */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Stack direction="row" spacing={2} alignItems="center">
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                  <PhotoLibrary />
                </Avatar>
                <Box>
                  <Typography variant="h4">{stats.overall?.total_items || 0}</Typography>
                  <Typography variant="body2" color="text.secondary">Total Photos</Typography>
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
                  <Person />
                </Avatar>
                <Box>
                  <Typography variant="h4">{stats.overall?.children_with_portfolios || 0}</Typography>
                  <Typography variant="body2" color="text.secondary">Children</Typography>
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
                  <School />
                </Avatar>
                <Box>
                  <Typography variant="h4">{stats.overall?.active_teachers || 0}</Typography>
                  <Typography variant="body2" color="text.secondary">Active Teachers</Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Stack direction="row" spacing={2} alignItems="center">
                <Avatar sx={{ bgcolor: 'error.main' }}>
                  <Favorite />
                </Avatar>
                <Box>
                  <Typography variant="h4">{stats.overall?.favorites || 0}</Typography>
                  <Typography variant="body2" color="text.secondary">Favorites</Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Storage Info */}
      <Card sx={{ mb: 3 }}>
        <CardHeader
          title="Storage Usage"
          avatar={<Assessment />}
        />
        <CardContent>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" gutterBottom>
                Total Storage Used: <strong>{formatFileSize(stats.overall?.total_size)}</strong>
              </Typography>
              <Typography variant="body2" gutterBottom>
                First Upload: {formatDate(stats.overall?.first_upload)}
              </Typography>
              <Typography variant="body2">
                Latest Upload: {formatDate(stats.overall?.latest_upload)}
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              {pieChartData.some(d => d.value > 0) && (
                <ResponsiveContainer width="100%" height={150}>
                  <PieChart>
                    <Pie
                      data={pieChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={60}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Charts Section */}
      <Grid container spacing={3} mb={3}>
        {/* Recent Activity Chart */}
        <Grid item xs={12} lg={8}>
          <Card>
            <CardHeader
              title="Recent Upload Activity (Last 7 Days)"
              avatar={<Timeline />}
            />
            <CardContent>
              {activityChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={activityChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="uploads"
                      stroke="#8884d8"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <Box textAlign="center" py={4}>
                  <Typography variant="body2" color="text.secondary">
                    No activity in the last 7 days
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Top Children */}
        <Grid item xs={12} lg={4}>
          <Card>
            <CardHeader
              title="Most Active Children"
              avatar={<TrendingUp />}
            />
            <CardContent>
              {stats.topChildren && stats.topChildren.length > 0 ? (
                <List dense>
                  {stats.topChildren.slice(0, 5).map((child, index) => (
                    <ListItem key={child.id}>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'primary.light' }}>
                          {child.child_name.charAt(0)}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={child.child_name}
                        secondary={
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Chip
                              size="small"
                              label={`${child.total_items} photos`}
                              variant="outlined"
                            />
                            {child.favorites > 0 && (
                              <Chip
                                size="small"
                                label={`${child.favorites} ♥`}
                                color="error"
                                variant="outlined"
                              />
                            )}
                          </Stack>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Box textAlign="center" py={2}>
                  <Typography variant="body2" color="text.secondary">
                    No portfolio data available
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Teachers Performance */}
      <Grid container spacing={3}>
        <Grid item xs={12} lg={8}>
          <Card>
            <CardHeader
              title="Teacher Upload Activity"
              avatar={<School />}
            />
            <CardContent>
              {teacherChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={teacherChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="uploads" fill="#8884d8" name="Total Uploads" />
                    <Bar dataKey="favorites" fill="#82ca9d" name="Favorites Marked" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <Box textAlign="center" py={4}>
                  <Typography variant="body2" color="text.secondary">
                    No teacher activity data available
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} lg={4}>
          <Card>
            <CardHeader
              title="Active Teachers"
              avatar={<School />}
            />
            <CardContent>
              {stats.activeTeachers && stats.activeTeachers.length > 0 ? (
                <List dense>
                  {stats.activeTeachers.slice(0, 5).map((teacher) => (
                    <ListItem key={teacher.id}>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'secondary.light' }}>
                          <CameraAlt />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={teacher.teacher_name}
                        secondary={
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Chip
                              size="small"
                              label={`${teacher.total_uploads} uploads`}
                              variant="outlined"
                            />
                            <Typography variant="caption" color="text.secondary">
                              Last: {formatDate(teacher.latest_upload)}
                            </Typography>
                          </Stack>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Box textAlign="center" py={2}>
                  <Typography variant="body2" color="text.secondary">
                    No teacher activity found
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Full Gallery Dialog */}
      <Dialog open={galleryOpen} onClose={() => setGalleryOpen(false)} maxWidth="xl" fullWidth>
        <DialogTitle>
          <Box display="flex" justifyContent="between" alignItems="center">
            <Typography variant="h6">All Portfolio Photos</Typography>
            <IconButton onClick={() => setGalleryOpen(false)}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ minHeight: '70vh' }}>
          <PortfolioGallery
            userRole={userRole}
            showAllChildren={true}
            onUpload={() => {
              loadDashboardData();
              setGalleryOpen(false);
            }}
          />
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default AdminPortfolioDashboard;