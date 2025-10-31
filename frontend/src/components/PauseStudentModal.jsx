import React, { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Grid,
    Alert,
    CircularProgress,
    Typography,
    Box,
    Chip
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import api from '../services/api';

const PauseStudentModal = ({ open, onClose, student, onSuccess }) => {
    const [formData, setFormData] = useState({
        pause_start_date: dayjs().add(1, 'day'),
        pause_end_date: dayjs().add(7, 'day'),
        reason: '',
        notes: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const payload = {
                pause_start_date: formData.pause_start_date.format('YYYY-MM-DD'),
                pause_end_date: formData.pause_end_date.format('YYYY-MM-DD'),
                reason: formData.reason,
                notes: formData.notes
            };

            await api.patch(`/students/${student.id}/pause`, payload);

            onSuccess({
                type: 'success',
                message: `${student.name} has been paused successfully`
            });
            handleClose();
        } catch (err) {
            console.error('Error pausing student:', err);
            setError(err.response?.data?.error || 'Failed to pause student');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setFormData({
            pause_start_date: dayjs().add(1, 'day'),
            pause_end_date: dayjs().add(7, 'day'),
            reason: '',
            notes: ''
        });
        setError('');
        onClose();
    };

    const calculateDuration = () => {
        if (formData.pause_start_date && formData.pause_end_date) {
            const duration = formData.pause_end_date.diff(formData.pause_start_date, 'day');
            return duration > 0 ? duration : 0;
        }
        return 0;
    };

    const getCommonReasons = () => [
        'Vacation/Travel',
        'Medical reasons',
        'Family circumstances',
        'Temporary relocation',
        'Financial constraints',
        'Other'
    ];

    return (
        <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
                <DialogTitle>
                    <Typography variant="h6" component="div">
                        Pause Student Enrollment
                    </Typography>
                    {student && (
                        <Box sx={{ mt: 1 }}>
                            <Typography variant="body2" color="text.secondary">
                                Student: <strong>{student.name}</strong>
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Student ID: <strong>{student.student_id}</strong>
                            </Typography>
                            <Chip
                                label={`Current Status: ${student.status || 'active'}`}
                                color="primary"
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

                        <Grid container spacing={3}>
                            <Grid item xs={12} sm={6}>
                                <DatePicker
                                    label="Pause Start Date"
                                    value={formData.pause_start_date}
                                    onChange={(newValue) => {
                                        setFormData(prev => ({
                                            ...prev,
                                            pause_start_date: newValue,
                                            // Auto-adjust end date if it's before start date
                                            pause_end_date: newValue && prev.pause_end_date.isBefore(newValue)
                                                ? newValue.add(1, 'week')
                                                : prev.pause_end_date
                                        }));
                                    }}
                                    minDate={dayjs().add(1, 'day')}
                                    slotProps={{
                                        textField: {
                                            fullWidth: true,
                                            required: true
                                        }
                                    }}
                                />
                            </Grid>

                            <Grid item xs={12} sm={6}>
                                <DatePicker
                                    label="Pause End Date"
                                    value={formData.pause_end_date}
                                    onChange={(newValue) => {
                                        setFormData(prev => ({
                                            ...prev,
                                            pause_end_date: newValue
                                        }));
                                    }}
                                    minDate={formData.pause_start_date?.add(1, 'day')}
                                    slotProps={{
                                        textField: {
                                            fullWidth: true,
                                            required: true
                                        }
                                    }}
                                />
                            </Grid>

                            {calculateDuration() > 0 && (
                                <Grid item xs={12}>
                                    <Alert severity="info">
                                        <Typography variant="body2">
                                            Pause Duration: <strong>{calculateDuration()} days</strong>
                                        </Typography>
                                    </Alert>
                                </Grid>
                            )}

                            <Grid item xs={12}>
                                <TextField
                                    label="Reason for Pause"
                                    value={formData.reason}
                                    onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                                    required
                                    fullWidth
                                    multiline
                                    rows={2}
                                    placeholder="Please specify the reason for pausing this student's enrollment"
                                />
                                <Box sx={{ mt: 1 }}>
                                    <Typography variant="caption" color="text.secondary">
                                        Common reasons:
                                    </Typography>
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                                        {getCommonReasons().map((reason) => (
                                            <Chip
                                                key={reason}
                                                label={reason}
                                                size="small"
                                                variant="outlined"
                                                onClick={() => setFormData(prev => ({ ...prev, reason }))}
                                                sx={{ cursor: 'pointer' }}
                                            />
                                        ))}
                                    </Box>
                                </Box>
                            </Grid>

                            <Grid item xs={12}>
                                <TextField
                                    label="Additional Notes (Optional)"
                                    value={formData.notes}
                                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                                    fullWidth
                                    multiline
                                    rows={3}
                                    placeholder="Any additional information about the pause..."
                                />
                            </Grid>

                            <Grid item xs={12}>
                                <Alert severity="warning">
                                    <Typography variant="body2">
                                        <strong>Important:</strong> During the pause period:
                                    </Typography>
                                    <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
                                        <li>Student will be excluded from attendance tracking</li>
                                        <li>Billing/invoicing will be paused</li>
                                        <li>Parent communications will be suspended</li>
                                        <li>Student will automatically resume on the end date</li>
                                    </ul>
                                </Alert>
                            </Grid>
                        </Grid>
                    </DialogContent>

                    <DialogActions sx={{ p: 3 }}>
                        <Button onClick={handleClose} disabled={loading}>
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="contained"
                            disabled={loading || !formData.reason.trim()}
                            startIcon={loading ? <CircularProgress size={20} /> : null}
                        >
                            {loading ? 'Pausing...' : 'Pause Student'}
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>
        </LocalizationProvider>
    );
};

export default PauseStudentModal;