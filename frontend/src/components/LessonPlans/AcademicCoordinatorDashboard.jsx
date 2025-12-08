import React, { useState, useEffect } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Button,
    Grid,
    Tab,
    Tabs,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Chip,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    CircularProgress,
    Alert,
    Tooltip
} from '@mui/material';
import {
    Add as AddIcon,
    Visibility as ViewIcon,
    Edit as EditIcon,
    Send as SendIcon,
    Feedback as FeedbackIcon
} from '@mui/icons-material';
import {
    lessonPlanCoordinatorAPI,
    getStatusColor,
    getStatusText,
    formatDate,
    getWeekDates
} from '../../services/lessonPlanService';
import LessonPlanCreator from './LessonPlanCreator';
import LessonPlanFeedbackViewer from './LessonPlanFeedbackViewer';

const AcademicCoordinatorDashboard = () => {
    const [currentTab, setCurrentTab] = useState(0);
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    // Dialogs
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [feedbackDialogOpen, setFeedbackDialogOpen] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState(null);

    // Filters
    const [statusFilter, setStatusFilter] = useState('all');

    useEffect(() => {
        loadPlans();
    }, [statusFilter]);

    const loadPlans = async () => {
        setLoading(true);
        setError(null);
        try {
            const filters = {};
            if (statusFilter && statusFilter !== 'all') {
                filters.status = statusFilter;
            }
            const data = await lessonPlanCoordinatorAPI.getPlans(filters);
            setPlans(data.plans || []);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load lesson plans');
        } finally {
            setLoading(false);
        }
    };

    const handleCreatePlan = () => {
        setCreateDialogOpen(true);
    };

    const handlePlanCreated = () => {
        setCreateDialogOpen(false);
        setSuccess('Lesson plan created successfully');
        loadPlans();
        setTimeout(() => setSuccess(null), 3000);
    };

    const handleSubmitPlan = async (planId) => {
        if (!window.confirm('Are you sure you want to submit this lesson plan? It will be sent to the admin for forwarding to teachers.')) {
            return;
        }

        try {
            await lessonPlanCoordinatorAPI.submitPlan(planId);
            setSuccess('Lesson plan submitted successfully');
            loadPlans();
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to submit lesson plan');
        }
    };

    const handleViewFeedback = async (plan) => {
        setSelectedPlan(plan);
        setFeedbackDialogOpen(true);
    };

    const getTabCounts = () => {
        return {
            all: plans.length,
            draft: plans.filter(p => p.status === 'draft').length,
            submitted: plans.filter(p => p.status === 'submitted').length,
            active: plans.filter(p => ['forwarded_to_teacher', 'in_progress'].includes(p.status)).length,
            completed: plans.filter(p => ['feedback_received', 'completed'].includes(p.status)).length
        };
    };

    const counts = getTabCounts();

    const filteredPlans = () => {
        switch (currentTab) {
            case 1: // Draft
                return plans.filter(p => p.status === 'draft');
            case 2: // Submitted
                return plans.filter(p => p.status === 'submitted');
            case 3: // Active
                return plans.filter(p => ['forwarded_to_teacher', 'in_progress'].includes(p.status));
            case 4: // With Feedback
                return plans.filter(p => ['feedback_received', 'completed'].includes(p.status));
            default:
                return plans;
        }
    };

    return (
        <Box sx={{ p: 3 }}>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4">Lesson Planning</Typography>
                <Button
                    variant="contained"
                    color="primary"
                    startIcon={<AddIcon />}
                    onClick={handleCreatePlan}
                >
                    Create New Lesson Plan
                </Button>
            </Box>

            {/* Alerts */}
            {error && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}
            {success && (
                <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
                    {success}
                </Alert>
            )}

            {/* Tabs */}
            <Paper sx={{ mb: 3 }}>
                <Tabs
                    value={currentTab}
                    onChange={(e, newValue) => setCurrentTab(newValue)}
                    indicatorColor="primary"
                    textColor="primary"
                >
                    <Tab label={`All Plans (${counts.all})`} />
                    <Tab label={`Draft (${counts.draft})`} />
                    <Tab label={`Submitted (${counts.submitted})`} />
                    <Tab label={`Active (${counts.active})`} />
                    <Tab label={`With Feedback (${counts.completed})`} />
                </Tabs>
            </Paper>

            {/* Plans Table */}
            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                    <CircularProgress />
                </Box>
            ) : filteredPlans().length === 0 ? (
                <Card>
                    <CardContent>
                        <Typography variant="body1" color="text.secondary" align="center">
                            No lesson plans found. Click "Create New Lesson Plan" to get started.
                        </Typography>
                    </CardContent>
                </Card>
            ) : (
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Week</TableCell>
                                <TableCell>Child</TableCell>
                                <TableCell>Classroom</TableCell>
                                <TableCell>Center</TableCell>
                                <TableCell>Activities</TableCell>
                                <TableCell>Feedback</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredPlans().map((plan) => (
                                <TableRow key={plan.id}>
                                    <TableCell>
                                        <Typography variant="body2">
                                            Week {plan.week_number}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {formatDate(plan.week_start_date)} - {formatDate(plan.week_end_date)}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        {plan.first_name} {plan.last_name}
                                    </TableCell>
                                    <TableCell>{plan.classroom_name || 'N/A'}</TableCell>
                                    <TableCell>{plan.center_name}</TableCell>
                                    <TableCell>
                                        <Chip
                                            label={`${plan.activity_count} activities`}
                                            size="small"
                                            color={plan.activity_count > 0 ? 'primary' : 'default'}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={`${plan.feedback_count} feedback`}
                                            size="small"
                                            color={plan.feedback_count > 0 ? 'success' : 'default'}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={getStatusText(plan.status)}
                                            color={getStatusColor(plan.status)}
                                            size="small"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', gap: 1 }}>
                                            {plan.status === 'draft' && (
                                                <Tooltip title="Submit Plan">
                                                    <IconButton
                                                        size="small"
                                                        color="primary"
                                                        onClick={() => handleSubmitPlan(plan.id)}
                                                    >
                                                        <SendIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            )}
                                            {plan.feedback_count > 0 && (
                                                <Tooltip title="View Feedback">
                                                    <IconButton
                                                        size="small"
                                                        color="info"
                                                        onClick={() => handleViewFeedback(plan)}
                                                    >
                                                        <FeedbackIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            )}
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            {/* Create Plan Dialog */}
            <Dialog
                open={createDialogOpen}
                onClose={() => setCreateDialogOpen(false)}
                maxWidth="lg"
                fullWidth
            >
                <DialogTitle>Create New Lesson Plan</DialogTitle>
                <DialogContent>
                    <LessonPlanCreator
                        onSuccess={handlePlanCreated}
                        onCancel={() => setCreateDialogOpen(false)}
                    />
                </DialogContent>
            </Dialog>

            {/* Feedback Viewer Dialog */}
            <Dialog
                open={feedbackDialogOpen}
                onClose={() => setFeedbackDialogOpen(false)}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>
                    Lesson Plan Feedback - {selectedPlan?.first_name} {selectedPlan?.last_name}
                </DialogTitle>
                <DialogContent>
                    {selectedPlan && (
                        <LessonPlanFeedbackViewer planId={selectedPlan.id} />
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setFeedbackDialogOpen(false)}>Close</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default AcademicCoordinatorDashboard;
