import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Paper,
    CircularProgress,
    Alert,
    Card,
    CardContent,
    Chip,
    Divider,
    Grid
} from '@mui/material';
import {
    ThumbUp as ThumbUpIcon,
    Info as InfoIcon
} from '@mui/icons-material';
import { lessonPlanCoordinatorAPI } from '../../services/lessonPlanService';

const LessonPlanFeedbackViewer = ({ planId }) => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [feedback, setFeedback] = useState([]);

    useEffect(() => {
        loadFeedback();
    }, [planId]);

    const loadFeedback = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await lessonPlanCoordinatorAPI.getFeedback(planId);
            setFeedback(data.feedback || []);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load feedback');
        } finally {
            setLoading(false);
        }
    };

    const getRatingColor = (rating) => {
        const colors = {
            excellent: 'success',
            good: 'primary',
            satisfactory: 'warning',
            needs_improvement: 'error'
        };
        return colors[rating] || 'default';
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return <Alert severity="error">{error}</Alert>;
    }

    if (feedback.length === 0) {
        return (
            <Paper sx={{ p: 3, textAlign: 'center' }}>
                <InfoIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                <Typography variant="body1" color="text.secondary">
                    No feedback has been submitted yet.
                </Typography>
            </Paper>
        );
    }

    return (
        <Box>
            {feedback.map((item, index) => (
                <Card key={item.id} sx={{ mb: 2 }}>
                    <CardContent>
                        {/* Header */}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                            <Box>
                                <Typography variant="h6">
                                    {item.activity_title || 'Overall Feedback'}
                                </Typography>
                                {item.category && (
                                    <Typography variant="body2" color="text.secondary">
                                        {item.category.replace(/_/g, ' ')} - {item.day_of_week}
                                    </Typography>
                                )}
                                <Typography variant="caption" color="text.secondary">
                                    By: {item.teacher_name} ({item.teacher_email})
                                </Typography>
                            </Box>
                            <Box sx={{ textAlign: 'right' }}>
                                {item.rating && (
                                    <Chip
                                        label={item.rating.replace(/_/g, ' ')}
                                        color={getRatingColor(item.rating)}
                                        size="small"
                                        sx={{ mb: 1 }}
                                    />
                                )}
                                {item.child_engagement && (
                                    <Chip
                                        label={item.child_engagement.replace(/_/g, ' ')}
                                        size="small"
                                        variant="outlined"
                                    />
                                )}
                            </Box>
                        </Box>

                        <Divider sx={{ my: 2 }} />

                        {/* Feedback Content */}
                        <Grid container spacing={2}>
                            {item.completion_status && (
                                <Grid item xs={12}>
                                    <Typography variant="body2" color="text.secondary">
                                        <strong>Status:</strong> {item.completion_status.replace(/_/g, ' ')}
                                    </Typography>
                                </Grid>
                            )}

                            <Grid item xs={12}>
                                <Typography variant="body2" color="text.secondary">
                                    <strong>Observations:</strong>
                                </Typography>
                                <Typography variant="body1" sx={{ mt: 0.5 }}>
                                    {item.observations}
                                </Typography>
                            </Grid>

                            {item.child_response && (
                                <Grid item xs={12}>
                                    <Typography variant="body2" color="text.secondary">
                                        <strong>Child's Response:</strong>
                                    </Typography>
                                    <Typography variant="body1" sx={{ mt: 0.5 }}>
                                        {item.child_response}
                                    </Typography>
                                </Grid>
                            )}

                            {item.achievements && (
                                <Grid item xs={12}>
                                    <Paper sx={{ p: 1, bgcolor: 'success.50' }}>
                                        <Typography variant="body2" color="success.dark">
                                            <ThumbUpIcon sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
                                            <strong>Achievements:</strong> {item.achievements}
                                        </Typography>
                                    </Paper>
                                </Grid>
                            )}

                            {item.challenges_faced && (
                                <Grid item xs={12}>
                                    <Typography variant="body2" color="text.secondary">
                                        <strong>Challenges:</strong>
                                    </Typography>
                                    <Typography variant="body1" sx={{ mt: 0.5 }}>
                                        {item.challenges_faced}
                                    </Typography>
                                </Grid>
                            )}

                            {item.suggested_modifications && (
                                <Grid item xs={12}>
                                    <Paper sx={{ p: 1, bgcolor: 'info.50' }}>
                                        <Typography variant="body2" color="info.dark">
                                            <strong>Suggested Modifications:</strong> {item.suggested_modifications}
                                        </Typography>
                                    </Paper>
                                </Grid>
                            )}
                        </Grid>

                        {/* Timestamp */}
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
                            Submitted: {new Date(item.created_at).toLocaleString()}
                        </Typography>
                    </CardContent>
                </Card>
            ))}
        </Box>
    );
};

export default LessonPlanFeedbackViewer;
