import React, { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Alert,
    CircularProgress,
    Typography,
    Box,
    Chip,
    Grid
} from '@mui/material';
import { PlayArrow, DateRange, AccessTime } from '@mui/icons-material';
import dayjs from 'dayjs';
import axios from 'axios';

const ResumeStudentModal = ({ open, onClose, student, onSuccess }) => {
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const token = localStorage.getItem('token');
            const sessionToken = localStorage.getItem('sessionToken');

            if (!token || !sessionToken) {
                throw new Error('Authentication tokens not found');
            }

            await axios.patch(
                `http://localhost:5000/api/students/${student.id}/resume`,
                { notes },
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'X-Session-Token': sessionToken,
                        'Content-Type': 'application/json'
                    }
                }
            );

            onSuccess({
                type: 'success',
                message: `${student.name} has been resumed successfully`
            });
            handleClose();
        } catch (err) {
            console.error('Error resuming student:', err);
            setError(err.response?.data?.error || 'Failed to resume student');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setNotes('');
        setError('');
        onClose();
    };

    const formatDate = (date) => {
        return dayjs(date).format('MMM DD, YYYY');
    };

    const getDaysRemaining = () => {
        if (!student?.pause_end_date) return null;
        const endDate = dayjs(student.pause_end_date);
        const today = dayjs();
        const diff = endDate.diff(today, 'day');
        return diff;
    };

    const isPauseExpired = () => {
        const daysRemaining = getDaysRemaining();
        return daysRemaining !== null && daysRemaining < 0;
    };

    const getPauseDuration = () => {
        if (!student?.pause_start_date || !student?.pause_end_date) return null;
        const startDate = dayjs(student.pause_start_date);
        const endDate = dayjs(student.pause_end_date);
        return endDate.diff(startDate, 'day');
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
            <DialogTitle>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PlayArrow color="primary" />
                    <Typography variant="h6" component="div">
                        Resume Student Enrollment
                    </Typography>
                </Box>
                {student && (
                    <Box sx={{ mt: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                            Student: <strong>{student.name}</strong>
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Student ID: <strong>{student.student_id}</strong>
                        </Typography>
                        <Chip
                            label="Currently Paused"
                            color="warning"
                            size="small"
                            sx={{ mt: 1 }}
                        />
                    </Box>
                )}
            </DialogTitle>

            <form onSubmit={handleSubmit}>
                <DialogContent>
                    {error && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {error}
                        </Alert>
                    )}

                    {/* Current Pause Information */}
                    {student && (
                        <Grid container spacing={2} sx={{ mb: 3 }}>
                            <Grid item xs={12}>
                                <Box sx={{
                                    bgcolor: 'grey.50',
                                    p: 2,
                                    borderRadius: 1,
                                    border: '1px solid',
                                    borderColor: 'grey.200'
                                }}>
                                    <Typography variant="subtitle2" gutterBottom>
                                        Current Pause Details:
                                    </Typography>

                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                        <DateRange fontSize="small" color="action" />
                                        <Typography variant="body2">
                                            <strong>Period:</strong> {formatDate(student.pause_start_date)} - {formatDate(student.pause_end_date)}
                                        </Typography>
                                    </Box>

                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                        <AccessTime fontSize="small" color="action" />
                                        <Typography variant="body2">
                                            <strong>Duration:</strong> {getPauseDuration()} days
                                        </Typography>
                                    </Box>

                                    {getDaysRemaining() !== null && (
                                        <Box sx={{ mt: 1 }}>
                                            {isPauseExpired() ? (
                                                <Chip
                                                    label={`Pause expired ${Math.abs(getDaysRemaining())} days ago`}
                                                    color="error"
                                                    size="small"
                                                />
                                            ) : (
                                                <Chip
                                                    label={`${getDaysRemaining()} days remaining`}
                                                    color="info"
                                                    size="small"
                                                />
                                            )}
                                        </Box>
                                    )}

                                    {student.pause_reason && (
                                        <Box sx={{ mt: 2 }}>
                                            <Typography variant="caption" color="text.secondary">
                                                Original Reason:
                                            </Typography>
                                            <Typography variant="body2">
                                                {student.pause_reason}
                                            </Typography>
                                        </Box>
                                    )}
                                </Box>
                            </Grid>
                        </Grid>
                    )}

                    {isPauseExpired() && (
                        <Alert severity="warning" sx={{ mb: 2 }}>
                            <strong>Note:</strong> The pause period has already expired.
                            The student should have been automatically resumed, but you can manually resume them now.
                        </Alert>
                    )}

                    <TextField
                        label="Resume Notes (Optional)"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        fullWidth
                        multiline
                        rows={4}
                        placeholder="Add any notes about the student's return or current status..."
                        sx={{ mb: 2 }}
                    />

                    <Alert severity="info">
                        <Typography variant="body2">
                            <strong>After resuming:</strong>
                        </Typography>
                        <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
                            <li>Student status will be changed to "Active"</li>
                            <li>Attendance tracking will resume</li>
                            <li>Billing/invoicing will resume</li>
                            <li>All normal school activities will be available</li>
                        </ul>
                    </Alert>
                </DialogContent>

                <DialogActions sx={{ p: 3 }}>
                    <Button onClick={handleClose} disabled={loading}>
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        disabled={loading}
                        startIcon={loading ? <CircularProgress size={20} /> : <PlayArrow />}
                    >
                        {loading ? 'Resuming...' : 'Resume Student'}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
};

export default ResumeStudentModal;