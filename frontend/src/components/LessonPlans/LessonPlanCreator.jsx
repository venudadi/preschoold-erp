import React, { useState, useEffect } from 'react';
import {
    Box,
    Button,
    Grid,
    TextField,
    Typography,
    Paper,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    CircularProgress,
    Alert,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    IconButton,
    Chip
} from '@mui/material';
import {
    ExpandMore as ExpandMoreIcon,
    Add as AddIcon,
    Delete as DeleteIcon
} from '@mui/icons-material';
import {
    lessonPlanCoordinatorAPI,
    getWeekDates,
    ACTIVITY_CATEGORIES,
    DAYS_OF_WEEK
} from '../../services/lessonPlanService';

const LessonPlanCreator = ({ onSuccess, onCancel }) => {
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [children, setChildren] = useState([]);

    // Form state
    const [selectedChild, setSelectedChild] = useState('');
    const [weekStartDate, setWeekStartDate] = useState('');
    const [overallObjectives, setOverallObjectives] = useState('');
    const [specialNotes, setSpecialNotes] = useState('');
    const [activities, setActivities] = useState([]);

    useEffect(() => {
        loadChildren();
    }, []);

    useEffect(() => {
        // Set default week start date to next Monday
        const getNextMonday = () => {
            const today = new Date();
            const day = today.getDay();
            const diff = day === 0 ? 1 : 8 - day;
            const nextMonday = new Date(today);
            nextMonday.setDate(today.getDate() + diff);
            return nextMonday.toISOString().split('T')[0];
        };
        setWeekStartDate(getNextMonday());
    }, []);

    const loadChildren = async () => {
        setLoading(true);
        try {
            const data = await lessonPlanCoordinatorAPI.getChildren();
            setChildren(data.children || []);
        } catch (err) {
            setError('Failed to load children');
        } finally {
            setLoading(false);
        }
    };

    const handleAddActivity = () => {
        setActivities([
            ...activities,
            {
                category: '',
                dayOfWeek: 'Monday',
                title: '',
                description: '',
                learningOutcomes: '',
                materialsNeeded: '',
                durationMinutes: 30,
                instructions: '',
                adaptations: ''
            }
        ]);
    };

    const handleRemoveActivity = (index) => {
        setActivities(activities.filter((_, i) => i !== index));
    };

    const handleActivityChange = (index, field, value) => {
        const updated = [...activities];
        updated[index] = { ...updated[index], [field]: value };
        setActivities(updated);
    };

    const getCategoryIcon = (category) => {
        const cat = ACTIVITY_CATEGORIES.find(c => c.value === category);
        return cat ? cat.icon : '';
    };

    const getCategoryLabel = (category) => {
        const cat = ACTIVITY_CATEGORIES.find(c => c.value === category);
        return cat ? cat.label : category;
    };

    const handleSubmit = async () => {
        // Validation
        if (!selectedChild) {
            setError('Please select a child');
            return;
        }

        if (!weekStartDate) {
            setError('Please select a week start date');
            return;
        }

        if (activities.length === 0) {
            setError('Please add at least one activity');
            return;
        }

        // Check if all activities have required fields
        const invalidActivity = activities.find(a => !a.category || !a.dayOfWeek || !a.title);
        if (invalidActivity) {
            setError('All activities must have a category, day, and title');
            return;
        }

        setSubmitting(true);
        setError(null);

        try {
            const child = children.find(c => c.id === selectedChild);

            const planData = {
                childId: selectedChild,
                centerId: child.center_id,
                classroomId: child.classroom_id,
                weekStartDate,
                overallObjectives,
                specialNotes,
                activities
            };

            await lessonPlanCoordinatorAPI.createPlan(planData);
            onSuccess();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create lesson plan');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ p: 2 }}>
            {error && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            <Grid container spacing={3}>
                {/* Child and Week Selection */}
                <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                        <InputLabel>Select Child *</InputLabel>
                        <Select
                            value={selectedChild}
                            onChange={(e) => setSelectedChild(e.target.value)}
                            label="Select Child *"
                        >
                            {children.map((child) => (
                                <MenuItem key={child.id} value={child.id}>
                                    {child.first_name} {child.last_name} - {child.classroom_name} ({child.age_years}y {child.age_months}m)
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Grid>

                <Grid item xs={12} md={6}>
                    <TextField
                        fullWidth
                        label="Week Start Date (Monday) *"
                        type="date"
                        value={weekStartDate}
                        onChange={(e) => setWeekStartDate(e.target.value)}
                        InputLabelProps={{ shrink: true }}
                    />
                </Grid>

                {/* Overall Objectives */}
                <Grid item xs={12}>
                    <TextField
                        fullWidth
                        label="Overall Learning Objectives"
                        multiline
                        rows={2}
                        value={overallObjectives}
                        onChange={(e) => setOverallObjectives(e.target.value)}
                        placeholder="What are the main learning goals for this week?"
                    />
                </Grid>

                {/* Special Notes */}
                <Grid item xs={12}>
                    <TextField
                        fullWidth
                        label="Special Notes / Considerations"
                        multiline
                        rows={2}
                        value={specialNotes}
                        onChange={(e) => setSpecialNotes(e.target.value)}
                        placeholder="Any special instructions or adaptations needed?"
                    />
                </Grid>

                {/* Activities Section */}
                <Grid item xs={12}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h6">
                            Weekly Activities ({activities.length})
                        </Typography>
                        <Button
                            variant="outlined"
                            startIcon={<AddIcon />}
                            onClick={handleAddActivity}
                        >
                            Add Activity
                        </Button>
                    </Box>

                    {activities.length === 0 ? (
                        <Paper sx={{ p: 3, textAlign: 'center' }}>
                            <Typography variant="body2" color="text.secondary">
                                No activities added yet. Click "Add Activity" to create the first activity.
                            </Typography>
                        </Paper>
                    ) : (
                        activities.map((activity, index) => (
                            <Accordion key={index} sx={{ mb: 1 }}>
                                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
                                        <Typography>{getCategoryIcon(activity.category)}</Typography>
                                        <Typography>
                                            {activity.title || `Activity ${index + 1}`}
                                        </Typography>
                                        {activity.category && (
                                            <Chip
                                                label={getCategoryLabel(activity.category)}
                                                size="small"
                                                color="primary"
                                            />
                                        )}
                                        {activity.dayOfWeek && (
                                            <Chip
                                                label={activity.dayOfWeek}
                                                size="small"
                                                variant="outlined"
                                            />
                                        )}
                                        <IconButton
                                            size="small"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleRemoveActivity(index);
                                            }}
                                            sx={{ ml: 'auto' }}
                                        >
                                            <DeleteIcon fontSize="small" />
                                        </IconButton>
                                    </Box>
                                </AccordionSummary>
                                <AccordionDetails>
                                    <Grid container spacing={2}>
                                        <Grid item xs={12} md={4}>
                                            <FormControl fullWidth size="small">
                                                <InputLabel>Category *</InputLabel>
                                                <Select
                                                    value={activity.category}
                                                    onChange={(e) => handleActivityChange(index, 'category', e.target.value)}
                                                    label="Category *"
                                                >
                                                    {ACTIVITY_CATEGORIES.map((cat) => (
                                                        <MenuItem key={cat.value} value={cat.value}>
                                                            {cat.icon} {cat.label}
                                                        </MenuItem>
                                                    ))}
                                                </Select>
                                            </FormControl>
                                        </Grid>

                                        <Grid item xs={12} md={4}>
                                            <FormControl fullWidth size="small">
                                                <InputLabel>Day of Week *</InputLabel>
                                                <Select
                                                    value={activity.dayOfWeek}
                                                    onChange={(e) => handleActivityChange(index, 'dayOfWeek', e.target.value)}
                                                    label="Day of Week *"
                                                >
                                                    {DAYS_OF_WEEK.map((day) => (
                                                        <MenuItem key={day} value={day}>
                                                            {day}
                                                        </MenuItem>
                                                    ))}
                                                </Select>
                                            </FormControl>
                                        </Grid>

                                        <Grid item xs={12} md={4}>
                                            <TextField
                                                fullWidth
                                                size="small"
                                                label="Duration (minutes)"
                                                type="number"
                                                value={activity.durationMinutes}
                                                onChange={(e) => handleActivityChange(index, 'durationMinutes', parseInt(e.target.value))}
                                            />
                                        </Grid>

                                        <Grid item xs={12}>
                                            <TextField
                                                fullWidth
                                                size="small"
                                                label="Activity Title *"
                                                value={activity.title}
                                                onChange={(e) => handleActivityChange(index, 'title', e.target.value)}
                                                placeholder="e.g., Good Morning Song, Letter Recognition A-B-C"
                                            />
                                        </Grid>

                                        <Grid item xs={12}>
                                            <TextField
                                                fullWidth
                                                size="small"
                                                label="Description"
                                                multiline
                                                rows={2}
                                                value={activity.description}
                                                onChange={(e) => handleActivityChange(index, 'description', e.target.value)}
                                                placeholder="Describe the activity"
                                            />
                                        </Grid>

                                        <Grid item xs={12} md={6}>
                                            <TextField
                                                fullWidth
                                                size="small"
                                                label="Learning Outcomes"
                                                multiline
                                                rows={2}
                                                value={activity.learningOutcomes}
                                                onChange={(e) => handleActivityChange(index, 'learningOutcomes', e.target.value)}
                                                placeholder="What will the child learn?"
                                            />
                                        </Grid>

                                        <Grid item xs={12} md={6}>
                                            <TextField
                                                fullWidth
                                                size="small"
                                                label="Materials Needed"
                                                multiline
                                                rows={2}
                                                value={activity.materialsNeeded}
                                                onChange={(e) => handleActivityChange(index, 'materialsNeeded', e.target.value)}
                                                placeholder="List required materials"
                                            />
                                        </Grid>

                                        <Grid item xs={12}>
                                            <TextField
                                                fullWidth
                                                size="small"
                                                label="Instructions for Teacher"
                                                multiline
                                                rows={2}
                                                value={activity.instructions}
                                                onChange={(e) => handleActivityChange(index, 'instructions', e.target.value)}
                                                placeholder="Detailed instructions"
                                            />
                                        </Grid>

                                        <Grid item xs={12}>
                                            <TextField
                                                fullWidth
                                                size="small"
                                                label="Adaptations / Modifications"
                                                multiline
                                                rows={2}
                                                value={activity.adaptations}
                                                onChange={(e) => handleActivityChange(index, 'adaptations', e.target.value)}
                                                placeholder="Alternative approaches for different learning needs"
                                            />
                                        </Grid>
                                    </Grid>
                                </AccordionDetails>
                            </Accordion>
                        ))
                    )}
                </Grid>

                {/* Action Buttons */}
                <Grid item xs={12}>
                    <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                        <Button
                            variant="outlined"
                            onClick={onCancel}
                            disabled={submitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={handleSubmit}
                            disabled={submitting || !selectedChild || !weekStartDate || activities.length === 0}
                        >
                            {submitting ? <CircularProgress size={24} /> : 'Create Lesson Plan'}
                        </Button>
                    </Box>
                </Grid>
            </Grid>
        </Box>
    );
};

export default LessonPlanCreator;
