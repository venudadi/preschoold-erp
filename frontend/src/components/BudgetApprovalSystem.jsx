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
  InputAdornment,
  Divider,
  Badge,
  Tooltip,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  CheckCircle,
  Cancel,
  Pending,
  AttachMoney,
  Category,
  DateRange,
  Description,
  Person,
  ExpandMore,
  Visibility,
  ThumbUp,
  ThumbDown,
  Schedule,
  Warning,
  Info,
  TrendingUp,
  AccountBalance,
  Receipt,
  RequestQuote,
  FilterList
} from '@mui/icons-material';

const BudgetApprovalSystem = ({ user }) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [approvalDialog, setApprovalDialog] = useState(false);
  const [currentTab, setCurrentTab] = useState(0);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });
  const [filters, setFilters] = useState({
    status: 'pending',
    category: 'all',
    priority: 'all'
  });

  const [approvalForm, setApprovalForm] = useState({
    status: 'approved',
    approval_notes: ''
  });

  const [budgetSummary, setBudgetSummary] = useState({
    totalBudget: 0,
    approvalLimit: 0,
    pendingAmount: 0,
    approvedAmount: 0
  });

  useEffect(() => {
    loadRequests();
    loadBudgetSummary();
  }, [pagination.page, filters]);

  const loadRequests = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        status: filters.status,
        ...(filters.category !== 'all' && { category: filters.category }),
        ...(filters.priority !== 'all' && { priority: filters.priority })
      });

      const response = await fetch(`/api/center-director/budget/requests?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setRequests(data.data || []);
        setPagination(prev => ({
          ...prev,
          total: data.pagination.total,
          pages: data.pagination.pages
        }));
      } else {
        setError('Failed to load budget requests');
      }
    } catch (err) {
      console.error('Load requests error:', err);
      setError('Failed to load budget requests');
    } finally {
      setLoading(false);
    }
  };

  const loadBudgetSummary = async () => {
    try {
      const response = await fetch('/api/center-director/dashboard', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        // Get dynamic approval limit from Financial Manager system
        const dynamicLimit = data.data.budget?.dynamic_approval_limit || data.data.budget?.approval_limit || 0;

        setBudgetSummary({
          totalBudget: data.data.centerInfo?.monthly_budget || 0,
          approvalLimit: dynamicLimit,
          pendingAmount: data.data.budget?.pending_approvals || 0,
          approvedAmount: data.data.budget?.approved_amount || 0
        });
      }
    } catch (err) {
      console.error('Load budget summary error:', err);
    }
  };

  const handleApproval = async (requestId, status, notes) => {
    try {
      const response = await fetch(`/api/center-director/budget/approve/${requestId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          status,
          approval_notes: notes
        })
      });

      if (response.ok) {
        setApprovalDialog(false);
        setSelectedRequest(null);
        setApprovalForm({ status: 'approved', approval_notes: '' });
        loadRequests();
        loadBudgetSummary();
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to process approval');
      }
    } catch (err) {
      console.error('Approval error:', err);
      setError('Failed to process approval');
    }
  };

  const openApprovalDialog = (request) => {
    setSelectedRequest(request);
    setApprovalForm({ status: 'approved', approval_notes: '' });
    setApprovalDialog(true);
  };

  const openRequestDetails = (request) => {
    setSelectedRequest(request);
    setDetailsOpen(true);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'approved': return 'success';
      case 'rejected': return 'error';
      case 'revision_required': return 'info';
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

  const getCategoryIcon = (category) => {
    const icons = {
      operations: <AccountBalance />,
      staff: <Person />,
      maintenance: <Receipt />,
      supplies: <Category />,
      marketing: <TrendingUp />,
      technology: <Info />,
      emergency: <Warning />,
      other: <RequestQuote />
    };
    return icons[category] || <RequestQuote />;
  };

  if (loading && requests.length === 0) {
    return (
      <Box p={3}>
        <Typography variant="h5" gutterBottom>Budget Approval System</Typography>
        <LinearProgress />
        <Typography variant="body2" color="text.secondary" mt={2}>
          Loading budget requests...
        </Typography>
      </Box>
    );
  }

  return (
    <Box p={2}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4">Budget Approval System</Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Review and approve budget requests within your authority
          </Typography>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Budget Overview */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Stack direction="row" spacing={2} alignItems="center">
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                  <AccountBalance />
                </Avatar>
                <Box>
                  <Typography variant="h5">{formatCurrency(budgetSummary.approvalLimit)}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Your Approval Limit
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
                  <Badge badgeContent={requests.filter(r => r.status === 'pending').length} color="error">
                    <Schedule />
                  </Badge>
                </Avatar>
                <Box>
                  <Typography variant="h5">{formatCurrency(budgetSummary.pendingAmount)}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Pending Approvals
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
                  <CheckCircle />
                </Avatar>
                <Box>
                  <Typography variant="h5">{formatCurrency(budgetSummary.approvedAmount)}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Approved This Month
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
                  <Typography variant="h5">
                    {budgetSummary.totalBudget > 0
                      ? Math.round((budgetSummary.approvedAmount / budgetSummary.totalBudget) * 100)
                      : 0}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Budget Utilized
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                >
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="approved">Approved</MenuItem>
                  <MenuItem value="rejected">Rejected</MenuItem>
                  <MenuItem value="revision_required">Revision Required</MenuItem>
                  <MenuItem value="all">All Requests</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Category</InputLabel>
                <Select
                  value={filters.category}
                  onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                >
                  <MenuItem value="all">All Categories</MenuItem>
                  <MenuItem value="operations">Operations</MenuItem>
                  <MenuItem value="staff">Staff</MenuItem>
                  <MenuItem value="maintenance">Maintenance</MenuItem>
                  <MenuItem value="supplies">Supplies</MenuItem>
                  <MenuItem value="marketing">Marketing</MenuItem>
                  <MenuItem value="technology">Technology</MenuItem>
                  <MenuItem value="emergency">Emergency</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
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

            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="body2" color="text.secondary">
                {requests.length} of {pagination.total} requests
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Requests Table */}
      <Card>
        <CardHeader
          title="Budget Requests"
          action={
            <Chip
              icon={<FilterList />}
              label={`${filters.status} requests`}
              color={filters.status === 'pending' ? 'warning' : 'default'}
            />
          }
        />
        <CardContent>
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Request Details</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Priority</TableCell>
                  <TableCell>Requested By</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {requests.map((request) => (
                  <TableRow key={request.id} hover>
                    <TableCell>
                      <Box>
                        <Typography variant="subtitle2" gutterBottom>
                          {request.description}
                        </Typography>
                        {request.justification && (
                          <Typography variant="caption" color="text.secondary">
                            {request.justification.substring(0, 100)}
                            {request.justification.length > 100 && '...'}
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography
                        variant="h6"
                        color={request.amount > budgetSummary.approvalLimit ? 'error' : 'inherit'}
                      >
                        {formatCurrency(request.amount)}
                      </Typography>
                      {request.amount > budgetSummary.approvalLimit && (
                        <Typography variant="caption" color="error">
                          Exceeds limit
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        {getCategoryIcon(request.category)}
                        <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                          {request.category}
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={request.priority}
                        color={getPriorityColor(request.priority)}
                        size="small"
                        sx={{ textTransform: 'capitalize' }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {request.requested_by_name || 'Unknown'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {new Date(request.requested_date).toLocaleDateString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={request.status}
                        color={getStatusColor(request.status)}
                        size="small"
                        sx={{ textTransform: 'capitalize' }}
                      />
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1}>
                        <Tooltip title="View Details">
                          <IconButton
                            size="small"
                            onClick={() => openRequestDetails(request)}
                          >
                            <Visibility />
                          </IconButton>
                        </Tooltip>
                        {request.status === 'pending' && (
                          <>
                            <Tooltip title="Approve">
                              <IconButton
                                size="small"
                                color="success"
                                onClick={() => openApprovalDialog(request)}
                                disabled={request.amount > budgetSummary.approvalLimit}
                              >
                                <ThumbUp />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Reject">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => {
                                  setSelectedRequest(request);
                                  setApprovalForm({ status: 'rejected', approval_notes: '' });
                                  setApprovalDialog(true);
                                }}
                              >
                                <ThumbDown />
                              </IconButton>
                            </Tooltip>
                          </>
                        )}
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
                {requests.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      <Box py={4}>
                        <Typography variant="body2" color="text.secondary">
                          No budget requests found for the selected filters
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <Box display="flex" justifyContent="center" mt={2}>
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

      {/* Request Details Dialog */}
      <Dialog
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Budget Request Details</DialogTitle>
        <DialogContent>
          {selectedRequest && (
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  {selectedRequest.description}
                </Typography>
                <Divider />
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">Amount</Typography>
                <Typography variant="h5" color={selectedRequest.amount > budgetSummary.approvalLimit ? 'error' : 'inherit'}>
                  {formatCurrency(selectedRequest.amount)}
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">Category</Typography>
                <Stack direction="row" alignItems="center" spacing={1}>
                  {getCategoryIcon(selectedRequest.category)}
                  <Typography variant="body1" sx={{ textTransform: 'capitalize' }}>
                    {selectedRequest.category}
                  </Typography>
                </Stack>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">Priority</Typography>
                <Chip
                  label={selectedRequest.priority}
                  color={getPriorityColor(selectedRequest.priority)}
                  sx={{ textTransform: 'capitalize' }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">Requested By</Typography>
                <Typography variant="body1">
                  {selectedRequest.requested_by_name || 'Unknown'}
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">Request Date</Typography>
                <Typography variant="body1">
                  {new Date(selectedRequest.requested_date).toLocaleString()}
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">Status</Typography>
                <Chip
                  label={selectedRequest.status}
                  color={getStatusColor(selectedRequest.status)}
                  sx={{ textTransform: 'capitalize' }}
                />
              </Grid>

              {selectedRequest.justification && (
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>Justification</Typography>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="body1">
                      {selectedRequest.justification}
                    </Typography>
                  </Paper>
                </Grid>
              )}

              {selectedRequest.budget_code && (
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">Budget Code</Typography>
                  <Typography variant="body1">{selectedRequest.budget_code}</Typography>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsOpen(false)}>Close</Button>
          {selectedRequest?.status === 'pending' && (
            <Button
              variant="contained"
              onClick={() => {
                setDetailsOpen(false);
                openApprovalDialog(selectedRequest);
              }}
              disabled={selectedRequest?.amount > budgetSummary.approvalLimit}
            >
              Review for Approval
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Approval Dialog */}
      <Dialog
        open={approvalDialog}
        onClose={() => setApprovalDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {approvalForm.status === 'approved' ? 'Approve' :
           approvalForm.status === 'rejected' ? 'Reject' : 'Request Revision'} Budget Request
        </DialogTitle>
        <DialogContent>
          {selectedRequest && (
            <Box sx={{ mt: 1 }}>
              <Typography variant="body1" gutterBottom>
                <strong>Request:</strong> {selectedRequest.description}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Amount:</strong> {formatCurrency(selectedRequest.amount)}
              </Typography>

              {selectedRequest.amount > budgetSummary.approvalLimit && (
                <Alert severity="error" sx={{ mt: 2, mb: 2 }}>
                  This request exceeds your approval limit of {formatCurrency(budgetSummary.approvalLimit)}.
                  You cannot approve this request.
                </Alert>
              )}

              <FormControl fullWidth margin="normal">
                <InputLabel>Decision</InputLabel>
                <Select
                  value={approvalForm.status}
                  onChange={(e) => setApprovalForm({
                    ...approvalForm,
                    status: e.target.value
                  })}
                >
                  <MenuItem value="approved">Approve</MenuItem>
                  <MenuItem value="rejected">Reject</MenuItem>
                  <MenuItem value="revision_required">Request Revision</MenuItem>
                </Select>
              </FormControl>

              <TextField
                fullWidth
                multiline
                rows={4}
                label="Comments"
                value={approvalForm.approval_notes}
                onChange={(e) => setApprovalForm({
                  ...approvalForm,
                  approval_notes: e.target.value
                })}
                placeholder={
                  approvalForm.status === 'approved'
                    ? 'Optional approval comments...'
                    : 'Please provide reason for ' + approvalForm.status.replace('_', ' ')
                }
                margin="normal"
                required={approvalForm.status !== 'approved'}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setApprovalDialog(false)}>Cancel</Button>
          <Button
            onClick={() => handleApproval(
              selectedRequest?.id,
              approvalForm.status,
              approvalForm.approval_notes
            )}
            variant="contained"
            color={approvalForm.status === 'approved' ? 'success' : 'error'}
            disabled={
              (selectedRequest?.amount > budgetSummary.approvalLimit && approvalForm.status === 'approved') ||
              (approvalForm.status !== 'approved' && !approvalForm.approval_notes.trim())
            }
          >
            Confirm {approvalForm.status === 'approved' ? 'Approval' :
                     approvalForm.status === 'rejected' ? 'Rejection' : 'Revision Request'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BudgetApprovalSystem;