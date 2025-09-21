import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Grid,
    Typography,
    Box
} from '@mui/material';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { differenceInMinutes } from 'date-fns';
import { useApi } from '../services/api';

const ProgramTimingModal = ({ open, onClose, student, onUpdate }) => {
    const [startTime, setStartTime] = useState(null);
    const [endTime, setEndTime] = useState(null);
    const [programType, setProgramType] = useState('preschool');
    const api = useApi();

    useEffect(() => {
        if (student) {
            setStartTime(student.program_start_time ? new Date(`2000-01-01T${student.program_start_time}`) : null);
            setEndTime(student.program_end_time ? new Date(`2000-01-01T${student.program_end_time}`) : null);
        }
    }, [student]);

    useEffect(() => {
        if (startTime && endTime) {
            const hours = differenceInMinutes(endTime, startTime) / 60;
            setProgramType(hours > 4 ? 'daycare' : 'preschool');
        }
    }, [startTime, endTime]);

    const handleSave = async () => {
        if (!startTime || !endTime) return;

        try {
            await api.patch(`/students/${student.id}/timing`, {
                program_start_time: startTime.toTimeString().split(' ')[0],
                program_end_time: endTime.toTimeString().split(' ')[0]
            });

            onUpdate();
            onClose();
        } catch (error) {
            console.error('Error updating program timing:', error);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>Set Program Timing</DialogTitle>
            <DialogContent>
                <Grid container spacing={3}>
                    <Grid item xs={12}>
                        <LocalizationProvider dateAdapter={AdapterDateFns}>
                            <Grid container spacing={2}>
                                <Grid item xs={6}>
                                    <TimePicker
                                        label="Start Time"
                                        value={startTime}
                                        onChange={setStartTime}
                                        renderInput={(params) => <TextField {...params} fullWidth />}
                                    />
                                </Grid>
                                <Grid item xs={6}>
                                    <TimePicker
                                        label="End Time"
                                        value={endTime}
                                        onChange={setEndTime}
                                        renderInput={(params) => <TextField {...params} fullWidth />}
                                    />
                                </Grid>
                            </Grid>
                        </LocalizationProvider>
                    </Grid>
                    {startTime && endTime && (
                        <Grid item xs={12}>
                            <Box sx={{ mt: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
                                <Typography variant="body1">
                                    Service Hours: {(differenceInMinutes(endTime, startTime) / 60).toFixed(1)} hours
                                </Typography>
                                <Typography variant="body1" sx={{ mt: 1 }}>
                                    Program Type: <strong>{programType.toUpperCase()}</strong>
                                </Typography>
                            </Box>
                        </Grid>
                    )}
                </Grid>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button 
                    onClick={handleSave} 
                    variant="contained" 
                    color="primary"
                    disabled={!startTime || !endTime}
                >
                    Save
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ProgramTimingModal;