import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Stack,
  Alert,
  Tabs,
  Tab,
  LinearProgress,
  Avatar,
  Pagination,
  Rating,
  Divider,
  Badge,
  Tooltip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemAvatar,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  InputAdornment
} from '@mui/material';
import {
  Reply,
  Visibility,
  Star,
  StarBorder,
  Person,
  Child,
  DateRange,
  Category,
  Priority,
  Feedback,
  Message,
  Phone,
  Email,
  CheckCircle,
  Schedule,
  Warning,
  Info,
  ExpandMore,
  ThumbUp,
  ThumbDown,
  Assignment,
  TrendingUp,
  Assessment,
  School,
  Group,
  Chat,
  QuestionAnswer,
  Search,
  FilterList
} from '@mui/icons-material';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';

const ParentCommunicationOversight = ({ user }) => {
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [responseDialog, setResponseDialog] = useState(false);
  const [detailsDialog, setDetailsDialog] = useState(false);
  const [currentTab, setCurrentTab] = useState(0);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });
  const [filters, setFilters] = useState({
    status: 'all',
    category: 'all',
    feedback_type: 'all',
    priority: 'all'
  });
  const [searchTerm, setSearchTerm] = useState('');

  const [responseForm, setResponseForm] = useState({
    response: '',
    status: 'resolved'
  });

  const [communicationStats, setCommunicationStats] = useState({
    totalFeedback: 0,
    pendingResponses: 0,
    averageRating: 0,
    responseRate: 0,
    categoryBreakdown: [],
    satisfactionTrend: [],
    responseTimeAvg: 0
  });

  useEffect(() => {
    loadFeedback();
    loadCommunicationStats();
  }, [pagination.page, filters, searchTerm]);

  const loadFeedback = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        ...(filters.status !== 'all' && { status: filters.status }),
        ...(filters.category !== 'all' && { category: filters.category }),
        ...(filters.feedback_type !== 'all' && { feedback_type: filters.feedback_type }),
        ...(filters.priority !== 'all' && { priority: filters.priority }),
        ...(searchTerm && { search: searchTerm })
      });

      const response = await fetch(`/api/center-director/parent-feedback?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setFeedback(data.data || []);
        setPagination(prev => ({
          ...prev,
          total: data.pagination.total,
          pages: data.pagination.pages
        }));
      } else {
        setError('Failed to load parent feedback');
      }
    } catch (err) {
      console.error('Load feedback error:', err);
      setError('Failed to load parent feedback');
    } finally {
      setLoading(false);
    }
  };

  const loadCommunicationStats = async () => {
    try {
      // This would typically be a separate endpoint for communication analytics
      const mockStats = {
        totalFeedback: 84,
        pendingResponses: 12,
        averageRating: 4.6,
        responseRate: 92.5,
        categoryBreakdown: [
          { name: 'Academic', count: 25, satisfaction: 4.7 },
          { name: 'Staff', count: 32, satisfaction: 4.8 },
          { name: 'Facilities', count: 15, satisfaction: 4.2 },
          { name: 'Communication', count: 8, satisfaction: 4.5 },
          { name: 'Safety', count: 4, satisfaction: 4.9 }
        ],
        satisfactionTrend: [
          { month: 'Jan', rating: 4.4 },
          { month: 'Feb', rating: 4.5 },
          { month: 'Mar', rating: 4.6 },
          { month: 'Apr', rating: 4.7 },
          { month: 'May', rating: 4.6 }
        ],
        responseTimeAvg: 2.3
      };

      setCommunicationStats(mockStats);
    } catch (err) {
      console.error('Load communication stats error:', err);
    }
  };

  const handleResponse = async (feedbackId, response, status) => {
    try {
      const responseData = await fetch(`/api/center-director/parent-feedback/${feedbackId}/response`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ response, status })
      });

      if (responseData.ok) {
        setResponseDialog(false);
        setSelectedFeedback(null);
        setResponseForm({ response: '', status: 'resolved' });
        loadFeedback();
        loadCommunicationStats();
      } else {
        const errorData = await responseData.json();
        setError(errorData.message || 'Failed to send response');
      }
    } catch (err) {
      console.error('Response error:', err);
      setError('Failed to send response');
    }
  };

  const openResponseDialog = (feedbackItem) => {
    setSelectedFeedback(feedbackItem);
    setResponseForm({ response: '', status: 'resolved' });
    setResponseDialog(true);
  };

  const openDetailsDialog = (feedbackItem) => {
    setSelectedFeedback(feedbackItem);
    setDetailsDialog(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'new': return 'info';
      case 'acknowledged': return 'warning';
      case 'in_progress': return 'primary';
      case 'resolved': return 'success';
      case 'closed': return 'default';
      default: return 'default';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'error';
      case 'high': return 'warning';
      case 'medium': return 'info';
      case 'low': return 'default';
      default: return 'default';
    }
  };

  const getFeedbackTypeIcon = (type) => {
    const icons = {
      compliment: <ThumbUp />,
      complaint: <ThumbDown />,
      suggestion: <Info />,
      concern: <Warning />,
      question: <QuestionAnswer />,
      general: <Message />
    };
    return icons[type] || <Message />;
  };

  const getCategoryIcon = (category) => {
    const icons = {
      academic: <School />,
      staff: <Group />,
      facilities: <Category />,
      communication: <Chat />,
      safety: <Warning />,
      food_nutrition: <Category />,
      billing: <Category />,
      policies: <Assignment />,
      other: <Info />
    };
    return icons[category] || <Info />;
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  if (loading && feedback.length === 0) {
    return (
      <Box p={3}>
        <Typography variant="h5" gutterBottom>Parent Communication Oversight</Typography>
        <LinearProgress />
        <Typography variant="body2" color="text.secondary" mt={2}>
          Loading communication data...
        </Typography>
      </Box>
    );
  }

  return (
    <Box p={2}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4">Parent Communication Oversight</Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Monitor and manage parent feedback and communication
          </Typography>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Communication Overview */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Stack direction="row" spacing={2} alignItems="center">
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                  <Feedback />
                </Avatar>
                <Box>
                  <Typography variant="h4">{communicationStats.totalFeedback}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Feedback
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
                  <Badge badgeContent={communicationStats.pendingResponses} color="error">
                    <Schedule />
                  </Badge>
                </Avatar>
                <Box>
                  <Typography variant="h4">{communicationStats.pendingResponses}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Pending Response
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
                  <Star />
                </Avatar>
                <Box>
                  <Typography variant="h4">{communicationStats.averageRating.toFixed(1)}/5</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Average Satisfaction
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
                <Avatar sx={{ bgcolor: 'info.main' }}>
                  <TrendingUp />
                </Avatar>
                <Box>
                  <Typography variant="h4">{communicationStats.responseRate}%</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Response Rate
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Analytics Cards */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} lg={6}>
          <Card>
            <CardHeader title="Feedback by Category" />
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={communicationStats.categoryBreakdown}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                    label={({ name, count }) => `${name}: ${count}`}
                  >
                    {communicationStats.categoryBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} lg={6}>
          <Card>
            <CardHeader title="Satisfaction Trend" />
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={communicationStats.satisfactionTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis domain={[0, 5]} />
                  <RechartsTooltip />
                  <Bar dataKey="rating" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Search and Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search feedback..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  )
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                >
                  <MenuItem value="all">All Status</MenuItem>
                  <MenuItem value="new">New</MenuItem>
                  <MenuItem value="acknowledged">Acknowledged</MenuItem>
                  <MenuItem value="in_progress">In Progress</MenuItem>
                  <MenuItem value="resolved">Resolved</MenuItem>
                  <MenuItem value="closed">Closed</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Category</InputLabel>
                <Select
                  value={filters.category}
                  onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                >
                  <MenuItem value="all">All Categories</MenuItem>
                  <MenuItem value="academic">Academic</MenuItem>
                  <MenuItem value="staff">Staff</MenuItem>
                  <MenuItem value="facilities">Facilities</MenuItem>
                  <MenuItem value="communication">Communication</MenuItem>
                  <MenuItem value="safety">Safety</MenuItem>
                  <MenuItem value="food_nutrition">Food & Nutrition</MenuItem>
                  <MenuItem value="billing">Billing</MenuItem>
                  <MenuItem value="policies">Policies</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Type</InputLabel>
                <Select
                  value={filters.feedback_type}
                  onChange={(e) => setFilters({ ...filters, feedback_type: e.target.value })}
                >
                  <MenuItem value="all">All Types</MenuItem>
                  <MenuItem value="compliment">Compliment</MenuItem>
                  <MenuItem value="complaint">Complaint</MenuItem>
                  <MenuItem value="suggestion">Suggestion</MenuItem>
                  <MenuItem value="concern">Concern</MenuItem>
                  <MenuItem value="question">Question</MenuItem>
                  <MenuItem value="general">General</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Priority</InputLabel>
                <Select
                  value={filters.priority}
                  onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
                >
                  <MenuItem value="all">All Priorities</MenuItem>
                  <MenuItem value="urgent">Urgent</MenuItem>
                  <MenuItem value="high">High</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="low">Low</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Feedback List */}
      <Card>
        <CardHeader
          title="Parent Feedback"
          action={
            <Typography variant="body2" color="text.secondary">
              {feedback.length} of {pagination.total} items
            </Typography>
          }
        />
        <CardContent>
          <List>
            {feedback.map((item, index) => (
              <React.Fragment key={item.id}>
                <ListItem
                  alignItems="flex-start"
                  sx={{
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1,
                    mb: 2,
                    backgroundColor: item.status === 'new' ? 'action.hover' : 'inherit'
                  }}
                >
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: getPriorityColor(item.priority).replace('error', 'red').replace('warning', 'orange') + '.main' }}>
                      {getFeedbackTypeIcon(item.feedback_type)}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                        <Box>
                          <Typography variant="h6" gutterBottom>
                            {item.subject}
                          </Typography>
                          <Stack direction="row" spacing={1} mb={1}>
                            <Chip
                              label={item.feedback_type}
                              size="small"
                              sx={{ textTransform: 'capitalize' }}
                            />
                            <Chip
                              label={item.category}
                              size="small"
                              variant="outlined"
                              sx={{ textTransform: 'capitalize' }}
                            />
                            <Chip
                              label={item.priority}
                              color={getPriorityColor(item.priority)}
                              size="small"
                              sx={{ textTransform: 'capitalize' }}
                            />
                            <Chip
                              label={item.status}
                              color={getStatusColor(item.status)}
                              size="small"
                              sx={{ textTransform: 'capitalize' }}
                            />
                          </Stack>
                        </Box>
                        <Stack direction="row" spacing={1}>
                          <Tooltip title="View Details">
                            <IconButton size="small" onClick={() => openDetailsDialog(item)}>
                              <Visibility />
                            </IconButton>
                          </Tooltip>
                          {(item.status === 'new' || item.status === 'acknowledged') && (
                            <Tooltip title="Respond">
                              <IconButton size="small" color="primary" onClick={() => openResponseDialog(item)}>
                                <Reply />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Stack>
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2" color="text.secondary" paragraph>
                          {item.message.length > 200 ? `${item.message.substring(0, 200)}...` : item.message}
                        </Typography>
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                          <Box>
                            <Typography variant="caption" color="text.secondary">
                              {item.child_name ? `Regarding: ${item.child_name}` : 'General feedback'}
                            </Typography>
                          </Box>
                          <Box display="flex" alignItems="center" gap={2}>
                            {item.satisfaction_rating && (
                              <Rating value={item.satisfaction_rating} size="small" readOnly />
                            )}
                            <Typography variant="caption" color="text.secondary">
                              {new Date(item.submission_date).toLocaleDateString()}
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                    }
                  />
                </ListItem>
              </React.Fragment>
            ))}

            {feedback.length === 0 && (
              <Box textAlign="center" py={4}>
                <Typography variant="body2" color="text.secondary">
                  No feedback found for the selected filters
                </Typography>
              </Box>
            )}
          </List>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <Box display="flex" justifyContent="center" mt={3}>
              <Pagination
                count={pagination.pages}
                page={pagination.page}
                onChange={(e, page) => setPagination(prev => ({ ...prev, page }))}
                color="primary"
              />
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog
        open={detailsDialog}
        onClose={() => setDetailsDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Feedback Details</DialogTitle>
        <DialogContent>
          {selectedFeedback && (
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  {selectedFeedback.subject}
                </Typography>
                <Stack direction="row" spacing={1} mb={2}>
                  <Chip label={selectedFeedback.feedback_type} sx={{ textTransform: 'capitalize' }} />
                  <Chip label={selectedFeedback.category} variant="outlined" sx={{ textTransform: 'capitalize' }} />
                  <Chip label={selectedFeedback.priority} color={getPriorityColor(selectedFeedback.priority)} sx={{ textTransform: 'capitalize' }} />
                </Stack>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary" gutterBottom>Message</Typography>
                <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                  <Typography variant="body1">{selectedFeedback.message}</Typography>
                </Paper>
              </Grid>

              {selectedFeedback.child_name && (
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">Child</Typography>
                  <Typography variant="body1">{selectedFeedback.child_name}</Typography>
                </Grid>
              )}

              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">Submitted</Typography>
                <Typography variant="body1">
                  {new Date(selectedFeedback.submission_date).toLocaleString()}
                </Typography>
              </Grid>

              {selectedFeedback.satisfaction_rating && (
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">Rating</Typography>
                  <Rating value={selectedFeedback.satisfaction_rating} readOnly />
                </Grid>
              )}

              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">Status</Typography>
                <Chip
                  label={selectedFeedback.status}
                  color={getStatusColor(selectedFeedback.status)}
                  sx={{ textTransform: 'capitalize' }}
                />
              </Grid>

              {selectedFeedback.response && (
                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="body2" color="text.secondary" gutterBottom>Response</Typography>
                  <Paper variant="outlined" sx={{ p: 2, backgroundColor: 'action.hover' }}>
                    <Typography variant="body1">{selectedFeedback.response}</Typography>
                    {selectedFeedback.response_date && (
                      <Typography variant="caption" color="text.secondary" display="block" mt={1}>
                        Responded: {new Date(selectedFeedback.response_date).toLocaleString()}
                      </Typography>
                    )}
                  </Paper>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsDialog(false)}>Close</Button>
          {selectedFeedback && (selectedFeedback.status === 'new' || selectedFeedback.status === 'acknowledged') && (
            <Button
              variant="contained"
              onClick={() => {
                setDetailsDialog(false);
                openResponseDialog(selectedFeedback);
              }}
            >
              Respond
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Response Dialog */}
      <Dialog
        open={responseDialog}
        onClose={() => setResponseDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Respond to Feedback</DialogTitle>
        <DialogContent>
          {selectedFeedback && (
            <Box sx={{ mt: 1 }}>
              <Typography variant="body1" gutterBottom>
                <strong>Subject:</strong> {selectedFeedback.subject}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                <strong>Original Message:</strong>
              </Typography>
              <Paper variant="outlined" sx={{ p: 2, mb: 2, backgroundColor: 'action.hover' }}>
                <Typography variant="body2">
                  {selectedFeedback.message}
                </Typography>
              </Paper>

              <FormControl fullWidth margin="normal">
                <InputLabel>Status</InputLabel>
                <Select
                  value={responseForm.status}
                  onChange={(e) => setResponseForm({ ...responseForm, status: e.target.value })}
                >
                  <MenuItem value="acknowledged">Acknowledge</MenuItem>
                  <MenuItem value="in_progress">In Progress</MenuItem>
                  <MenuItem value="resolved">Resolve</MenuItem>
                </Select>
              </FormControl>

              <TextField
                fullWidth
                multiline
                rows={4}
                label="Response"
                value={responseForm.response}
                onChange={(e) => setResponseForm({ ...responseForm, response: e.target.value })}
                placeholder="Type your response to the parent..."
                margin="normal"
                required
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResponseDialog(false)}>Cancel</Button>
          <Button
            onClick={() => handleResponse(
              selectedFeedback?.id,
              responseForm.response,
              responseForm.status
            )}
            variant="contained"
            disabled={!responseForm.response.trim()}
          >
            Send Response
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ParentCommunicationOversight;