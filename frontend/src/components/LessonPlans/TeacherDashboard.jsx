import React, { useState, useEffect } from 'react';
import {
    Box, Card, CardContent, Typography, Button, Grid, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Paper, Chip, CircularProgress, Alert,
    Dialog, DialogTitle, DialogContent, DialogActions, TextField, FormControl,
    InputLabel, Select, MenuItem, Accordion, AccordionSummary, AccordionDetails, Rating
} from '@mui/material';
import {
    CheckCircle as CheckIcon,
    Feedback as FeedbackIcon,
    ExpandMore as ExpandMoreIcon,
    Assignment as AssignmentIcon
} from '@mui/icons-material';
import {
    lessonPlanTeacherAPI, formatDate, getStatusColor, getStatusText,
    ACTIVITY_CATEGORIES, FEEDBACK_RATINGS, ENGAGEMENT_LEVELS, COMPLETION_STATUSES
} from '../../services/lessonPlanService';

const TeacherDashboard = () => {
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    // Dialogs
    const [detailsDialog, setDetailsDialog] = useState(false);
    const [feedbackDialog, setFeedbackDialog] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [planDetails, setPlanDetails] = useState(null);
    const [selectedActivity, setSelectedActivity] = useState(null);

    // Feedback form
    const [feedback, setFeedback] = useState({
        rating: '',
        childEngagement: '',
        completionStatus: '',
        observations: '',
        challengesFaced: '',
        childResponse: '',
        suggestedModifications: '',
        achievements: ''
    });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        loadPlans();
    }, []);

    const loadPlans = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await lessonPlanTeacherAPI.getAssignedPlans();
            setPlans(data.plans || []);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load lesson plans');
        } finally {
            setLoading(false);
        }
    };

    const handleViewPlan = async (plan) => {
        setSelectedPlan(plan);
        setLoading(true);
        try {
            const data = await lessonPlanTeacherAPI.getPlanDetails(plan.id);
            setPlanDetails(data);
            setDetailsDialog(true);
        } catch (err) {
            setError('Failed to load plan details');
        } finally {
            setLoading(false);
        }
    };

    const handleAcknowledge = async (planId) => {
        try {
            await lessonPlanTeacherAPI.acknowledgePlan(planId);
            setSuccess('Lesson plan acknowledged');
            loadPlans();
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to acknowledge plan');
        }
    };

    const handleProvideFeedback = (activity) => {
        setSelectedActivity(activity);
        setFeedback({
            rating: '',
            childEngagement: '',
            completionStatus: '',
            observations: '',
            challengesFaced: '',
            childResponse: '',
            suggestedModifications: '',
            achievements: ''
        });
        setFeedbackDialog(true);
    };

    const handleSubmitFeedback = async () => {
        if (!feedback.observations) {
            setError('Observations are required');
            return;
        }

        setSubmitting(true);
        try {
            await lessonPlanTeacherAPI.submitFeedback(selectedPlan.id, {
                activityId: selectedActivity.id,
                feedbackType: 'activity',
                ...feedback
            });
            setSuccess('Feedback submitted successfully');
            setFeedbackDialog(false);
            loadPlans();
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to submit feedback');
        } finally {
            setSubmitting(false);
        }
    };

    const getCategoryLabel = (category) => {
        const cat = ACTIVITY_CATEGORIES.find(c => c.value === category);
        return cat ? cat.label : category;
    };

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" sx={{ mb: 3 }}>My Assigned Lesson Plans</Typography>

            {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>{success}</Alert>}

            {loading && !detailsDialog ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                    <CircularProgress />
                </Box>
            ) : plans.length === 0 ? (
                <Card>
                    <CardContent>
                        <Typography color="text.secondary" align="center">
                            No lesson plans assigned yet
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
                                <TableCell>Activities</TableCell>
                                <TableCell>My Feedback</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {plans.map((plan) => (
                                <TableRow key={plan.id}>
                                    <TableCell>
                                        <Typography variant="body2">Week {plan.week_number}</Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {formatDate(plan.week_start_date)} - {formatDate(plan.week_end_date)}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>{plan.first_name} {plan.last_name}</TableCell>
                                    <TableCell>{plan.classroom_name || 'N/A'}</TableCell>
                                    <TableCell>
                                        <Chip label={`${plan.activity_count}`} size="small" color="primary" />
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={`${plan.my_feedback_count}/${plan.activity_count}`}
                                            size="small"
                                            color={plan.my_feedback_count === plan.activity_count ? 'success' : 'default'}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={plan.assignment_status}
                                            size="small"
                                            color={getStatusColor(plan.assignment_status)}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', gap: 1 }}>
                                            <Button
                                                size="small"
                                                variant="outlined"
                                                startIcon={<AssignmentIcon />}
                                                onClick={() => handleViewPlan(plan)}
                                            >
                                                View
                                            </Button>
                                            {plan.assignment_status === 'pending' && (
                                                <Button
                                                    size="small"
                                                    variant="contained"
                                                    startIcon={<CheckIcon />}
                                                    onClick={() => handleAcknowledge(plan.id)}
                                                >
                                                    Acknowledge
                                                </Button>
                                            )}
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            {/* Plan Details Dialog */}
            <Dialog open={detailsDialog} onClose={() => setDetailsDialog(false)} maxWidth="lg" fullWidth>
                <DialogTitle>
                    Lesson Plan - {planDetails?.plan?.first_name} {planDetails?.plan?.last_name}
                    <Typography variant="caption" display="block" color="text.secondary">
                        Week {planDetails?.plan?.week_number} ({formatDate(planDetails?.plan?.week_start_date)} - {formatDate(planDetails?.plan?.week_end_date)})
                    </Typography>
                </DialogTitle>
                <DialogContent>
                    {planDetails && (
                        <Box>
                            {planDetails.plan.overall_objectives && (
                                <Alert severity="info" sx={{ mb: 2 }}>
                                    <strong>Objectives:</strong> {planDetails.plan.overall_objectives}
                                </Alert>
                            )}

                            {planDetails.activities.map((activity, index) => (
                                <Accordion key={activity.id} defaultExpanded={index === 0}>
                                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                                            <Typography sx={{ flexGrow: 1 }}>
                                                <strong>{activity.day_of_week}:</strong> {activity.activity_title}
                                            </Typography>
                                            <Chip label={getCategoryLabel(activity.category)} size="small" />
                                            <Chip label={`${activity.duration_minutes} min`} size="small" variant="outlined" />
                                        </Box>
                                    </AccordionSummary>
                                    <AccordionDetails>
                                        <Grid container spacing={2}>
                                            {activity.activity_description && (
                                                <Grid item xs={12}>
                                                    <Typography variant="body2"><strong>Description:</strong></Typography>
                                                    <Typography variant="body2">{activity.activity_description}</Typography>
                                                </Grid>
                                            )}
                                            {activity.learning_outcomes && (
                                                <Grid item xs={12} md={6}>
                                                    <Typography variant="body2"><strong>Learning Outcomes:</strong></Typography>
                                                    <Typography variant="body2">{activity.learning_outcomes}</Typography>
                                                </Grid>
                                            )}
                                            {activity.materials_needed && (
                                                <Grid item xs={12} md={6}>
                                                    <Typography variant="body2"><strong>Materials:</strong></Typography>
                                                    <Typography variant="body2">{activity.materials_needed}</Typography>
                                                </Grid>
                                            )}
                                            {activity.instructions && (
                                                <Grid item xs={12}>
                                                    <Typography variant="body2"><strong>Instructions:</strong></Typography>
                                                    <Typography variant="body2">{activity.instructions}</Typography>
                                                </Grid>
                                            )}
                                            <Grid item xs={12}>
                                                <Button
                                                    variant="contained"
                                                    size="small"
                                                    startIcon={<FeedbackIcon />}
                                                    onClick={() => handleProvideFeedback(activity)}
                                                >
                                                    Provide Feedback
                                                </Button>
                                            </Grid>
                                        </Grid>
                                    </AccordionDetails>
                                </Accordion>
                            ))}
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDetailsDialog(false)}>Close</Button>
                </DialogActions>
            </Dialog>

            {/* Feedback Dialog */}
            <Dialog open={feedbackDialog} onClose={() => setFeedbackDialog(false)} maxWidth="md" fullWidth>
                <DialogTitle>
                    Provide Feedback - {selectedActivity?.activity_title}
                </DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ pt: 2 }}>
                        <Grid item xs={12} md={4}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Rating</InputLabel>
                                <Select
                                    value={feedback.rating}
                                    onChange={(e) => setFeedback({ ...feedback, rating: e.target.value })}
                                    label="Rating"
                                >
                                    {FEEDBACK_RATINGS.map(r => (
                                        <MenuItem key={r.value} value={r.value}>{r.label}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Engagement</InputLabel>
                                <Select
                                    value={feedback.childEngagement}
                                    onChange={(e) => setFeedback({ ...feedback, childEngagement: e.target.value })}
                                    label="Engagement"
                                >
                                    {ENGAGEMENT_LEVELS.map(e => (
                                        <MenuItem key={e.value} value={e.value}>{e.label}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Completion</InputLabel>
                                <Select
                                    value={feedback.completionStatus}
                                    onChange={(e) => setFeedback({ ...feedback, completionStatus: e.target.value })}
                                    label="Completion"
                                >
                                    {COMPLETION_STATUSES.map(c => (
                                        <MenuItem key={c.value} value={c.value}>{c.label}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                required
                                label="Observations *"
                                multiline
                                rows={3}
                                value={feedback.observations}
                                onChange={(e) => setFeedback({ ...feedback, observations: e.target.value })}
                                placeholder="What did you observe during the activity?"
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Child's Response"
                                multiline
                                rows={2}
                                value={feedback.childResponse}
                                onChange={(e) => setFeedback({ ...feedback, childResponse: e.target.value })}
                                placeholder="How did the child respond?"
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Achievements"
                                multiline
                                rows={2}
                                value={feedback.achievements}
                                onChange={(e) => setFeedback({ ...feedback, achievements: e.target.value })}
                                placeholder="Notable achievements or milestones"
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Challenges Faced"
                                multiline
                                rows={2}
                                value={feedback.challengesFaced}
                                onChange={(e) => setFeedback({ ...feedback, challengesFaced: e.target.value })}
                                placeholder="Any challenges or difficulties encountered"
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Suggested Modifications"
                                multiline
                                rows={2}
                                value={feedback.suggestedModifications}
                                onChange={(e) => setFeedback({ ...feedback, suggestedModifications: e.target.value })}
                                placeholder="Suggestions for improving this activity"
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setFeedbackDialog(false)} disabled={submitting}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmitFeedback}
                        variant="contained"
                        disabled={submitting || !feedback.observations}
                    >
                        {submitting ? <CircularProgress size={24} /> : 'Submit Feedback'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default TeacherDashboard;
