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
    Chip,
    Radio,
    RadioGroup,
    FormControlLabel,
    FormLabel
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

    // Data lists
    const [centers, setCenters] = useState([]);
    const [classrooms, setClassrooms] = useState([]);
    const [children, setChildren] = useState([]);

    // Form state
    const [planType, setPlanType] = useState('child'); // 'child' or 'classroom'
    const [selectedCenter, setSelectedCenter] = useState('');
    const [selectedChild, setSelectedChild] = useState('');
    const [selectedClassroom, setSelectedClassroom] = useState('');
    const [weekStartDate, setWeekStartDate] = useState('');
    const [overallObjectives, setOverallObjectives] = useState('');
    const [specialNotes, setSpecialNotes] = useState('');
    const [activities, setActivities] = useState([]);

    useEffect(() => {
        loadCenters();
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

    // Load children/classrooms when center or plan type changes
    useEffect(() => {
        if (selectedCenter) {
            if (planType === 'child') {
                loadChildren(selectedCenter);
            } else {
                loadClassrooms(selectedCenter);
            }
        }
    }, [selectedCenter, planType]);

    const loadCenters = async () => {
        setLoading(true);
        try {
            const data = await lessonPlanCoordinatorAPI.getCenters();
            setCenters(data.centers || []);
        } catch (err) {
            setError('Failed to load centers');
        } finally {
            setLoading(false);
        }
    };

    const loadChildren = async (centerId) => {
        setLoading(true);
        try {
            const data = await lessonPlanCoordinatorAPI.getChildren(centerId);
            setChildren(data.children || []);
        } catch (err) {
            setError('Failed to load children');
        } finally {
            setLoading(false);
        }
    };

    const loadClassrooms = async (centerId) => {
        setLoading(true);
        try {
            const data = await lessonPlanCoordinatorAPI.getClassrooms(centerId);
            setClassrooms(data.classrooms || []);
        } catch (err) {
            setError('Failed to load classrooms');
        } finally {
            setLoading(false);
        }
    };

    const handlePlanTypeChange = (event) => {
        setPlanType(event.target.value);
        // Reset selections when switching plan type
        setSelectedChild('');
        setSelectedClassroom('');
    };

    const handleCenterChange = (event) => {
        setSelectedCenter(event.target.value);
        // Reset child/classroom selection when center changes
        setSelectedChild('');
        setSelectedClassroom('');
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
        if (!selectedCenter) {
            setError('Please select a center');
            return;
        }

        if (planType === 'child' && !selectedChild) {
            setError('Please select a child');
            return;
        }

        if (planType === 'classroom' && !selectedClassroom) {
            setError('Please select a classroom');
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
            const planData = {
                centerId: selectedCenter,
                weekStartDate,
                overallObjectives,
                specialNotes,
                activities
            };

            // Add either childId OR classroomId based on plan type
            if (planType === 'child') {
                const child = children.find(c => c.id === selectedChild);
                planData.childId = selectedChild;
                planData.classroomId = child?.classroom_id; // Include classroom if child has one
            } else {
                planData.classroomId = selectedClassroom;
            }

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
                {/* Plan Type Selection */}
                <Grid item xs={12}>
                    <FormControl component="fieldset">
                        <FormLabel component="legend">Create Lesson Plan For:</FormLabel>
                        <RadioGroup row value={planType} onChange={handlePlanTypeChange}>
                            <FormControlLabel value="child" control={<Radio />} label="Individual Child" />
                            <FormControlLabel value="classroom" control={<Radio />} label="Entire Classroom" />
                        </RadioGroup>
                    </FormControl>
                </Grid>

                {/* Center Selection */}
                <Grid item xs={12} md={6}>
                    <FormControl fullWidth required>
                        <InputLabel>Select Center *</InputLabel>
                        <Select
                            value={selectedCenter}
                            onChange={handleCenterChange}
                            label="Select Center *"
                        >
                            {centers.map((center) => (
                                <MenuItem key={center.id} value={center.id}>
                                    {center.name}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Grid>

                {/* Child or Classroom Selection - Conditional */}
                <Grid item xs={12} md={6}>
                    {planType === 'child' ? (
                        <FormControl fullWidth required disabled={!selectedCenter}>
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
                    ) : (
                        <FormControl fullWidth required disabled={!selectedCenter}>
                            <InputLabel>Select Classroom *</InputLabel>
                            <Select
                                value={selectedClassroom}
                                onChange={(e) => setSelectedClassroom(e.target.value)}
                                label="Select Classroom *"
                            >
                                {classrooms.map((classroom) => (
                                    <MenuItem key={classroom.id} value={classroom.id}>
                                        {classroom.name} ({classroom.child_count} children)
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    )}
                </Grid>

                {/* Week Start Date */}
                <Grid item xs={12} md={6}>
                    <TextField
                        fullWidth
                        required
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
                            disabled={
                                submitting ||
                                !selectedCenter ||
                                !weekStartDate ||
                                activities.length === 0 ||
                                (planType === 'child' && !selectedChild) ||
                                (planType === 'classroom' && !selectedClassroom)
                            }
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
