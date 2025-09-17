import React, { useState, useEffect, useCallback } from 'react';
import {
    Box,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Button,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    TextField,
    Typography,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Alert,
    IconButton
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import RefreshIcon from '@mui/icons-material/Refresh';
import { format } from 'date-fns';
import { useApi } from '../services/api';

const AttendanceManagement = () => {
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [selectedClassroom, setSelectedClassroom] = useState('');
    const [classrooms, setClassrooms] = useState([]);
    const [attendanceData, setAttendanceData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [openDialog, setOpenDialog] = useState(false);
    const [selectedChild, setSelectedChild] = useState(null);
    const [attendanceStatus, setAttendanceStatus] = useState('present');
    const [reason, setReason] = useState('');
    const api = useApi();

    const fetchClassrooms = useCallback(async () => {
        try {
            const response = await api.get('/admin/classrooms');
            setClassrooms(response.data);
        } catch (error) {
            setError('Failed to fetch classrooms');
            console.error('Error fetching classrooms:', error);
        }
    }, [api]);

    const fetchAttendance = useCallback(async () => {
        setLoading(true);
        try {
            const formattedDate = format(selectedDate, 'yyyy-MM-dd');
            const response = await api.get(
                `/attendance/classroom/${selectedClassroom}?date=${formattedDate}`
            );
            setAttendanceData(response.data);
            setError(null);
        } catch (error) {
            setError('Failed to fetch attendance data');
            console.error('Error fetching attendance:', error);
        } finally {
            setLoading(false);
        }
    }, [api, selectedClassroom, selectedDate]);

    useEffect(() => {
        fetchClassrooms();
    }, [fetchClassrooms]);

    useEffect(() => {
        if (selectedClassroom && selectedDate) {
            fetchAttendance();
        }
    }, [selectedClassroom, selectedDate, fetchAttendance]);



    const handleMarkAttendance = async () => {
        try {
            await api.post('/attendance/mark', {
                child_id: selectedChild.id,
                classroom_id: selectedClassroom,
                center_id: selectedChild.center_id,
                status: attendanceStatus,
                reason: reason
            });
            
            setOpenDialog(false);
            fetchAttendance(); // Refresh the attendance data
            setError(null);
        } catch (error) {
            setError('Failed to mark attendance');
            console.error('Error marking attendance:', error);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'present':
                return 'success.main';
            case 'absent':
                return 'error.main';
            case 'late':
                return 'warning.main';
            case 'excused':
                return 'info.main';
            default:
                return 'text.primary';
        }
    };

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Box p={3}>
                <Typography variant="h4" gutterBottom>
                    Attendance Management
                </Typography>

                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                <Box display="flex" gap={2} mb={3}>
                    <FormControl sx={{ minWidth: 200 }}>
                        <InputLabel>Classroom</InputLabel>
                        <Select
                            value={selectedClassroom}
                            onChange={(e) => setSelectedClassroom(e.target.value)}
                            label="Classroom"
                        >
                            {classrooms.map((classroom) => (
                                <MenuItem key={classroom.id} value={classroom.id}>
                                    {classroom.name}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <DatePicker
                        label="Date"
                        value={selectedDate}
                        onChange={setSelectedDate}
                        renderInput={(params) => <TextField {...params} />}
                    />

                    <IconButton onClick={fetchAttendance} disabled={loading}>
                        <RefreshIcon />
                    </IconButton>
                </Box>

                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Name</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell>Check-in Time</TableCell>
                                <TableCell>Check-out Time</TableCell>
                                <TableCell>Reason</TableCell>
                                <TableCell>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {attendanceData.map((record) => (
                                <TableRow key={record.id}>
                                    <TableCell>
                                        {record.first_name} {record.last_name}
                                    </TableCell>
                                    <TableCell>
                                        <Typography color={getStatusColor(record.status)}>
                                            {record.status?.toUpperCase()}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        {record.check_in ? 
                                            format(new Date(record.check_in), 'HH:mm') : 
                                            '-'}
                                    </TableCell>
                                    <TableCell>
                                        {record.check_out ? 
                                            format(new Date(record.check_out), 'HH:mm') : 
                                            '-'}
                                    </TableCell>
                                    <TableCell>{record.reason || '-'}</TableCell>
                                    <TableCell>
                                        <Button
                                            variant="contained"
                                            size="small"
                                            onClick={() => {
                                                setSelectedChild(record);
                                                setOpenDialog(true);
                                            }}
                                        >
                                            Update
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>

                <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
                    <DialogTitle>
                        Mark Attendance - {selectedChild?.first_name} {selectedChild?.last_name}
                    </DialogTitle>
                    <DialogContent>
                        <Box sx={{ pt: 2 }}>
                            <FormControl fullWidth sx={{ mb: 2 }}>
                                <InputLabel>Status</InputLabel>
                                <Select
                                    value={attendanceStatus}
                                    onChange={(e) => setAttendanceStatus(e.target.value)}
                                    label="Status"
                                >
                                    <MenuItem value="present">Present</MenuItem>
                                    <MenuItem value="absent">Absent</MenuItem>
                                    <MenuItem value="late">Late</MenuItem>
                                    <MenuItem value="excused">Excused</MenuItem>
                                </Select>
                            </FormControl>

                            <TextField
                                fullWidth
                                label="Reason"
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                multiline
                                rows={3}
                            />
                        </Box>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
                        <Button onClick={handleMarkAttendance} variant="contained">
                            Save
                        </Button>
                    </DialogActions>
                </Dialog>
            </Box>
        </LocalizationProvider>
    );
};

export default AttendanceManagement;