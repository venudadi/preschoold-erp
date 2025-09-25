import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Card,
    CardContent,
    Grid,
    Chip,
    Button,
    Alert,
    CircularProgress,
    IconButton,
    Tooltip,
    Divider,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
    Avatar,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions
} from '@mui/material';
import {
    PlayArrow,
    Schedule,
    Person,
    DateRange,
    Info,
    FilterList,
    Refresh
} from '@mui/icons-material';
import { DataGrid } from '@mui/x-data-grid';
import dayjs from 'dayjs';
import axios from 'axios';
import ResumeStudentModal from './ResumeStudentModal';

const PausedStudentsView = ({ centerId, onStudentResumed }) => {
    const [pausedStudents, setPausedStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [resumeModalOpen, setResumeModalOpen] = useState(false);
    const [detailsModalOpen, setDetailsModalOpen] = useState(false);
    const [alertMessage, setAlertMessage] = useState(null);

    useEffect(() => {
        fetchPausedStudents();
    }, [centerId]);

    const fetchPausedStudents = async () => {
        setLoading(true);
        setError('');
        try {
            const token = localStorage.getItem('token');
            const sessionToken = localStorage.getItem('sessionToken');

            if (!token || !sessionToken) {
                throw new Error('Authentication tokens not found');
            }

            const params = centerId ? { center_id: centerId } : {};
            const response = await axios.get('http://localhost:5000/api/students/paused', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'X-Session-Token': sessionToken
                },
                params
            });

            setPausedStudents(response.data);
        } catch (err) {
            console.error('Error fetching paused students:', err);
            setError(err.response?.data?.error || 'Failed to fetch paused students');
        } finally {
            setLoading(false);
        }
    };

    const handleResumeClick = (student) => {
        setSelectedStudent(student);
        setResumeModalOpen(true);
    };

    const handleDetailsClick = (student) => {
        setSelectedStudent(student);
        setDetailsModalOpen(true);
    };

    const handleResumeSuccess = (message) => {
        setAlertMessage(message);
        fetchPausedStudents(); // Refresh the list
        if (onStudentResumed) {
            onStudentResumed();
        }
        setTimeout(() => setAlertMessage(null), 5000);
    };

    const formatDate = (date) => {
        return dayjs(date).format('MMM DD, YYYY');
    };

    const getDaysUntilResume = (endDate) => {
        const end = dayjs(endDate);
        const today = dayjs();
        return end.diff(today, 'day');
    };

    const getStatusColor = (endDate) => {
        const daysRemaining = getDaysUntilResume(endDate);
        if (daysRemaining < 0) return 'error'; // Expired
        if (daysRemaining <= 3) return 'warning'; // Due soon
        return 'info'; // Normal
    };

    const getStatusLabel = (endDate) => {
        const daysRemaining = getDaysUntilResume(endDate);
        if (daysRemaining < 0) return `Expired ${Math.abs(daysRemaining)} days ago`;
        if (daysRemaining === 0) return 'Expires today';
        if (daysRemaining === 1) return 'Expires tomorrow';
        return `${daysRemaining} days remaining`;
    };

    const columns = [
        {
            field: 'name',
            headerName: 'Student Name',
            flex: 1,
            minWidth: 200,
            renderCell: (params) => (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                        {params.row.first_name?.[0] || 'S'}
                    </Avatar>
                    <Box>
                        <Typography variant="body2" fontWeight="medium">
                            {params.row.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            ID: {params.row.student_id}
                        </Typography>
                    </Box>
                </Box>
            ),
        },
        {
            field: 'classroom_name',
            headerName: 'Classroom',
            width: 150,
        },
        {
            field: 'pause_start_date',
            headerName: 'Pause Start',
            width: 130,
            renderCell: (params) => formatDate(params.value),
        },
        {
            field: 'pause_end_date',
            headerName: 'Pause End',
            width: 130,
            renderCell: (params) => formatDate(params.value),
        },
        {
            field: 'status_chip',
            headerName: 'Status',
            width: 180,
            renderCell: (params) => (
                <Chip
                    label={getStatusLabel(params.row.pause_end_date)}
                    color={getStatusColor(params.row.pause_end_date)}
                    size="small"
                    icon={<Schedule />}
                />
            ),
        },
        {
            field: 'actions',
            headerName: 'Actions',
            width: 150,
            sortable: false,
            renderCell: (params) => (
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Tooltip title="Resume Student">
                        <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleResumeClick(params.row)}
                        >
                            <PlayArrow />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="View Details">
                        <IconButton
                            size="small"
                            color="default"
                            onClick={() => handleDetailsClick(params.row)}
                        >
                            <Info />
                        </IconButton>
                    </Tooltip>
                </Box>
            ),
        },
    ];

    const expiredCount = pausedStudents.filter(student =>
        getDaysUntilResume(student.pause_end_date) < 0
    ).length;

    const dueSoonCount = pausedStudents.filter(student => {
        const days = getDaysUntilResume(student.pause_end_date);
        return days >= 0 && days <= 3;
    }).length;

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            {alertMessage && (
                <Alert
                    severity={alertMessage.type}
                    sx={{ mb: 2 }}
                    onClose={() => setAlertMessage(null)}
                >
                    {alertMessage.message}
                </Alert>
            )}

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5" component="h1">
                    Paused Students
                </Typography>
                <Button
                    variant="outlined"
                    startIcon={<Refresh />}
                    onClick={fetchPausedStudents}
                    disabled={loading}
                >
                    Refresh
                </Button>
            </Box>

            {/* Summary Cards */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Person color="primary" />
                                <Box>
                                    <Typography variant="h4" color="primary">
                                        {pausedStudents.length}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Total Paused
                                    </Typography>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Schedule color="error" />
                                <Box>
                                    <Typography variant="h4" color="error">
                                        {expiredCount}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Expired Pauses
                                    </Typography>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <DateRange color="warning" />
                                <Box>
                                    <Typography variant="h4" color="warning.main">
                                        {dueSoonCount}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Due Soon (≤3 days)
                                    </Typography>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            {pausedStudents.length === 0 && !loading ? (
                <Card>
                    <CardContent sx={{ textAlign: 'center', py: 6 }}>
                        <Person sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                        <Typography variant="h6" color="text.secondary" gutterBottom>
                            No Paused Students
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            All students are currently active.
                        </Typography>
                    </CardContent>
                </Card>
            ) : (
                <Card>
                    <CardContent>
                        <DataGrid
                            rows={pausedStudents}
                            columns={columns}
                            autoHeight
                            disableRowSelectionOnClick
                            pageSizeOptions={[10, 25, 50]}
                            initialState={{
                                pagination: {
                                    paginationModel: { pageSize: 10 },
                                },
                            }}
                        />
                    </CardContent>
                </Card>
            )}

            {/* Resume Student Modal */}
            <ResumeStudentModal
                open={resumeModalOpen}
                onClose={() => {
                    setResumeModalOpen(false);
                    setSelectedStudent(null);
                }}
                student={selectedStudent}
                onSuccess={handleResumeSuccess}
            />

            {/* Student Details Modal */}
            <Dialog
                open={detailsModalOpen}
                onClose={() => {
                    setDetailsModalOpen(false);
                    setSelectedStudent(null);
                }}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>
                    Pause Details - {selectedStudent?.name}
                </DialogTitle>
                <DialogContent>
                    {selectedStudent && (
                        <Grid container spacing={3}>
                            <Grid item xs={12} sm={6}>
                                <Typography variant="subtitle2" gutterBottom>
                                    Student Information
                                </Typography>
                                <List dense>
                                    <ListItem>
                                        <ListItemText
                                            primary="Name"
                                            secondary={selectedStudent.name}
                                        />
                                    </ListItem>
                                    <ListItem>
                                        <ListItemText
                                            primary="Student ID"
                                            secondary={selectedStudent.student_id}
                                        />
                                    </ListItem>
                                    <ListItem>
                                        <ListItemText
                                            primary="Classroom"
                                            secondary={selectedStudent.classroom_name}
                                        />
                                    </ListItem>
                                </List>
                            </Grid>

                            <Grid item xs={12} sm={6}>
                                <Typography variant="subtitle2" gutterBottom>
                                    Pause Information
                                </Typography>
                                <List dense>
                                    <ListItem>
                                        <ListItemText
                                            primary="Pause Start"
                                            secondary={formatDate(selectedStudent.pause_start_date)}
                                        />
                                    </ListItem>
                                    <ListItem>
                                        <ListItemText
                                            primary="Pause End"
                                            secondary={formatDate(selectedStudent.pause_end_date)}
                                        />
                                    </ListItem>
                                    <ListItem>
                                        <ListItemText
                                            primary="Paused By"
                                            secondary={selectedStudent.paused_by_name || 'Unknown'}
                                        />
                                    </ListItem>
                                </List>
                            </Grid>

                            <Grid item xs={12}>
                                <Divider sx={{ my: 2 }} />
                                <Typography variant="subtitle2" gutterBottom>
                                    Reason for Pause
                                </Typography>
                                <Typography variant="body2" sx={{ mb: 2 }}>
                                    {selectedStudent.pause_reason || 'No reason provided'}
                                </Typography>

                                {selectedStudent.pause_notes && (
                                    <>
                                        <Typography variant="subtitle2" gutterBottom>
                                            Additional Notes
                                        </Typography>
                                        <Typography variant="body2">
                                            {selectedStudent.pause_notes}
                                        </Typography>
                                    </>
                                )}
                            </Grid>
                        </Grid>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDetailsModalOpen(false)}>
                        Close
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={<PlayArrow />}
                        onClick={() => {
                            setDetailsModalOpen(false);
                            handleResumeClick(selectedStudent);
                        }}
                    >
                        Resume Student
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default PausedStudentsView;