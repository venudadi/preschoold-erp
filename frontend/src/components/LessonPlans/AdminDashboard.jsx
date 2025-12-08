import React, { useState, useEffect } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Button,
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
    CircularProgress,
    Alert,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    TextField
} from '@mui/material';
import {
    Send as SendIcon,
    Feedback as FeedbackIcon
} from '@mui/icons-material';
import axios from 'axios';
import { lessonPlanAdminAPI, formatDate, getStatusColor, getStatusText } from '../../services/lessonPlanService';

const AdminDashboard = () => {
    const [currentTab, setCurrentTab] = useState(0);
    const [pendingPlans, setPendingPlans] = useState([]);
    const [feedbackPlans, setFeedbackPlans] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    // Forward to Teacher Dialog
    const [forwardDialog, setForwardDialog] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [teachers, setTeachers] = useState([]);
    const [selectedTeacher, setSelectedTeacher] = useState('');
    const [forwardNotes, setForwardNotes] = useState('');
    const [forwarding, setForwarding] = useState(false);

    useEffect(() => {
        loadData();
        loadTeachers();
    }, [currentTab]);

    const loadData = async () => {
        setLoading(true);
        setError(null);
        try {
            if (currentTab === 0) {
                const data = await lessonPlanAdminAPI.getPendingPlans();
                setPendingPlans(data.plans || []);
            } else {
                const data = await lessonPlanAdminAPI.getFeedbackReceivedPlans();
                setFeedbackPlans(data.plans || []);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load lesson plans');
        } finally {
            setLoading(false);
        }
    };

    const loadTeachers = async () => {
        try {
            const apiBase = import.meta.env.VITE_API_BASE_URL || '/api';
            const token = localStorage.getItem('token');
            const response = await axios.get(`${apiBase}/admin/staff`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const teacherList = response.data.staff?.filter(s => s.role === 'teacher') || [];
            setTeachers(teacherList);
        } catch (err) {
            console.error('Failed to load teachers:', err);
        }
    };

    const handleForwardToTeacher = (plan) => {
        setSelectedPlan(plan);
        setSelectedTeacher('');
        setForwardNotes('');
        setForwardDialog(true);
    };

    const handleConfirmForward = async () => {
        if (!selectedTeacher) {
            setError('Please select a teacher');
            return;
        }

        setForwarding(true);
        try {
            await lessonPlanAdminAPI.forwardToTeacher(selectedPlan.id, selectedTeacher, forwardNotes);
            setSuccess('Lesson plan forwarded to teacher successfully');
            setForwardDialog(false);
            loadData();
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to forward lesson plan');
        } finally {
            setForwarding(false);
        }
    };

    const handleForwardFeedback = async (planId) => {
        if (!window.confirm('Forward this feedback to the academic coordinator?')) {
            return;
        }

        try {
            await lessonPlanAdminAPI.forwardFeedback(planId);
            setSuccess('Feedback forwarded to academic coordinator successfully');
            loadData();
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to forward feedback');
        }
    };

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" sx={{ mb: 3 }}>Lesson Plan Management</Typography>

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
                    <Tab label={`Pending Forwarding (${pendingPlans.length})`} />
                    <Tab label={`Feedback Received (${feedbackPlans.length})`} />
                </Tabs>
            </Paper>

            {/* Content */}
            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                    <CircularProgress />
                </Box>
            ) : currentTab === 0 ? (
                /* Pending Plans Table */
                pendingPlans.length === 0 ? (
                    <Card>
                        <CardContent>
                            <Typography color="text.secondary" align="center">
                                No pending lesson plans
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
                                    <TableCell>Coordinator</TableCell>
                                    <TableCell>Activities</TableCell>
                                    <TableCell>Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {pendingPlans.map((plan) => (
                                    <TableRow key={plan.id}>
                                        <TableCell>
                                            <Typography variant="body2">Week {plan.week_number}</Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {formatDate(plan.week_start_date)} - {formatDate(plan.week_end_date)}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>{plan.first_name} {plan.last_name}</TableCell>
                                        <TableCell>{plan.classroom_name || 'N/A'}</TableCell>
                                        <TableCell>{plan.coordinator_name}</TableCell>
                                        <TableCell>
                                            <Chip label={`${plan.activity_count} activities`} size="small" color="primary" />
                                        </TableCell>
                                        <TableCell>
                                            <Button
                                                size="small"
                                                variant="contained"
                                                color="primary"
                                                startIcon={<SendIcon />}
                                                onClick={() => handleForwardToTeacher(plan)}
                                            >
                                                Forward
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )
            ) : (
                /* Feedback Received Table */
                feedbackPlans.length === 0 ? (
                    <Card>
                        <CardContent>
                            <Typography color="text.secondary" align="center">
                                No feedback received
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
                                    <TableCell>Coordinator</TableCell>
                                    <TableCell>Feedback</TableCell>
                                    <TableCell>Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {feedbackPlans.map((plan) => (
                                    <TableRow key={plan.id}>
                                        <TableCell>
                                            <Typography variant="body2">Week {plan.week_number}</Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {formatDate(plan.week_start_date)} - {formatDate(plan.week_end_date)}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>{plan.first_name} {plan.last_name}</TableCell>
                                        <TableCell>{plan.classroom_name || 'N/A'}</TableCell>
                                        <TableCell>{plan.coordinator_name}</TableCell>
                                        <TableCell>
                                            <Chip label={`${plan.feedback_count} feedback`} size="small" color="success" />
                                        </TableCell>
                                        <TableCell>
                                            <Button
                                                size="small"
                                                variant="contained"
                                                color="success"
                                                startIcon={<FeedbackIcon />}
                                                onClick={() => handleForwardFeedback(plan.id)}
                                            >
                                                Forward Feedback
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )
            )}

            {/* Forward to Teacher Dialog */}
            <Dialog open={forwardDialog} onClose={() => setForwardDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Forward Lesson Plan to Teacher</DialogTitle>
                <DialogContent>
                    <Box sx={{ pt: 2 }}>
                        <Typography variant="body2" sx={{ mb: 2 }}>
                            <strong>Child:</strong> {selectedPlan?.first_name} {selectedPlan?.last_name}<br />
                            <strong>Week:</strong> {selectedPlan && formatDate(selectedPlan.week_start_date)} - {selectedPlan && formatDate(selectedPlan.week_end_date)}
                        </Typography>

                        <FormControl fullWidth sx={{ mb: 2 }}>
                            <InputLabel>Select Teacher *</InputLabel>
                            <Select
                                value={selectedTeacher}
                                onChange={(e) => setSelectedTeacher(e.target.value)}
                                label="Select Teacher *"
                            >
                                {teachers.map((teacher) => (
                                    <MenuItem key={teacher.user_id} value={teacher.user_id}>
                                        {teacher.full_name} ({teacher.email})
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <TextField
                            fullWidth
                            label="Notes (optional)"
                            multiline
                            rows={3}
                            value={forwardNotes}
                            onChange={(e) => setForwardNotes(e.target.value)}
                            placeholder="Any special instructions for the teacher"
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setForwardDialog(false)} disabled={forwarding}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleConfirmForward}
                        variant="contained"
                        color="primary"
                        disabled={forwarding || !selectedTeacher}
                    >
                        {forwarding ? <CircularProgress size={24} /> : 'Forward'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default AdminDashboard;
