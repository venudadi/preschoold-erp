import React, { useState, useEffect } from 'react';
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, CircularProgress, Chip, IconButton, Tooltip, Alert, Tab, Tabs, MenuItem, Select, FormControl, InputLabel, TextField, InputAdornment } from '@mui/material';
import { Button } from '@mui/material';
import { Pause, PlayArrow, FilterList, Visibility, Search, Clear } from '@mui/icons-material';
import PromoteAssignStudentModal from './PromoteAssignStudentModal';
import TransferStudentModal from './TransferStudentModal';
import PauseStudentModal from './PauseStudentModal';
import ResumeStudentModal from './ResumeStudentModal';
import PausedStudentsView from './PausedStudentsView';
import ChildProfileModal from './ChildProfileModal';
import { getChildren } from '../services/api';
import dayjs from 'dayjs';

const ChildList = () => {
    const [children, setChildren] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [currentTab, setCurrentTab] = useState(0);
    const [alertMessage, setAlertMessage] = useState(null);

    // Modal state
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedChild, setSelectedChild] = useState(null);
    const [transferModalOpen, setTransferModalOpen] = useState(false);
    const [transferChild, setTransferChild] = useState(null);
    const [pauseModalOpen, setPauseModalOpen] = useState(false);
    const [pauseChild, setPauseChild] = useState(null);
    const [resumeModalOpen, setResumeModalOpen] = useState(false);
    const [resumeChild, setResumeChild] = useState(null);
    const [profileModalOpen, setProfileModalOpen] = useState(false);
    const [profileChildId, setProfileChildId] = useState(null);

    useEffect(() => {
        fetchChildren();
    }, [statusFilter]); // Re-fetch when status filter changes

    const fetchChildren = async () => {
        setLoading(true);
        try {
            const params = statusFilter !== 'all' ? { status: statusFilter } : {};
            const data = await getChildren(params);
            setChildren(data);
            setError('');
        } catch (err) {
            setError(err.message || 'Failed to fetch children data.');
        } finally {
            setLoading(false);
        }
    };

    const handlePauseSuccess = (message) => {
        setAlertMessage(message);
        fetchChildren(); // Refresh the list
        setTimeout(() => setAlertMessage(null), 5000);
    };

    const handleResumeSuccess = (message) => {
        setAlertMessage(message);
        fetchChildren(); // Refresh the list
        setTimeout(() => setAlertMessage(null), 5000);
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'active': return 'success';
            case 'paused': return 'warning';
            case 'left': return 'error';
            default: return 'default';
        }
    };

    const getDaysUntilResume = (endDate) => {
        if (!endDate) return null;
        const end = dayjs(endDate);
        const today = dayjs();
        return end.diff(today, 'day');
    };

    const getFilteredChildren = () => {
        let filtered = children;

        // Filter by status
        if (statusFilter !== 'all') {
            filtered = filtered.filter(child => child.status === statusFilter);
        }

        // Filter by search query (name or student ID)
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase().trim();
            filtered = filtered.filter(child => {
                const fullName = `${child.first_name || ''} ${child.last_name || ''}`.toLowerCase();
                const studentId = (child.student_id || '').toLowerCase();
                return fullName.includes(query) || studentId.includes(query);
            });
        }

        return filtered;
    };

    if (loading) {
        return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;
    }

    if (error) {
        return <Typography color="error" sx={{ mt: 4 }}>{error}</Typography>;
    }

    return (
        <Box sx={{ mt: 4 }}>
            {alertMessage && (
                <Alert
                    severity={alertMessage.type}
                    sx={{ mb: 2 }}
                    onClose={() => setAlertMessage(null)}
                >
                    {alertMessage.message}
                </Alert>
            )}

            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                <Tabs value={currentTab} onChange={(e, newValue) => setCurrentTab(newValue)}>
                    <Tab label="All Students" />
                    <Tab label="Paused Students" />
                </Tabs>
            </Box>

            {currentTab === 0 && (
                <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, gap: 2, flexWrap: 'wrap' }}>
                        <Typography variant="h5" component="h2">
                            Enrolled Children ({getFilteredChildren().length})
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                            <TextField
                                placeholder="Search by name or student ID..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                sx={{ minWidth: 300 }}
                                size="small"
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <Search />
                                        </InputAdornment>
                                    ),
                                    endAdornment: searchQuery && (
                                        <InputAdornment position="end">
                                            <IconButton
                                                size="small"
                                                onClick={() => setSearchQuery('')}
                                                edge="end"
                                            >
                                                <Clear />
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                }}
                            />
                            <FormControl sx={{ minWidth: 150 }} size="small">
                                <InputLabel>Filter by Status</InputLabel>
                                <Select
                                    value={statusFilter}
                                    label="Filter by Status"
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    startAdornment={<FilterList sx={{ ml: 1, mr: -0.5 }} />}
                                >
                                    <MenuItem value="all">All</MenuItem>
                                    <MenuItem value="active">Active</MenuItem>
                                    <MenuItem value="paused">Paused</MenuItem>
                                    <MenuItem value="left">Left</MenuItem>
                                </Select>
                            </FormControl>
                        </Box>
                    </Box>
                    <TableContainer component={Paper}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Full Name</TableCell>
                                    <TableCell>Status</TableCell>
                                    <TableCell>Date of Birth</TableCell>
                                    <TableCell>Classroom</TableCell>
                                    <TableCell>Enrollment Date</TableCell>
                                    <TableCell>Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {getFilteredChildren().length > 0 ? (
                                    getFilteredChildren().map((child) => (
                                        <TableRow key={child.id}>
                                            <TableCell>
                                                <Box>
                                                    <Typography variant="body2" fontWeight="medium">
                                                        {child.first_name} {child.last_name}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        ID: {child.student_id}
                                                    </Typography>
                                                </Box>
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={child.status || 'active'}
                                                    color={getStatusColor(child.status)}
                                                    size="small"
                                                />
                                                {child.status === 'paused' && child.pause_end_date && (
                                                    <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.5 }}>
                                                        {getDaysUntilResume(child.pause_end_date) >= 0
                                                            ? `${getDaysUntilResume(child.pause_end_date)} days remaining`
                                                            : 'Expired'
                                                        }
                                                    </Typography>
                                                )}
                                            </TableCell>
                                            <TableCell>{child.date_of_birth ? new Date(child.date_of_birth).toLocaleDateString() : 'N/A'}</TableCell>
                                            <TableCell>{child.classroom_name || 'Unassigned'}</TableCell>
                                            <TableCell>{child.enrollment_date ? new Date(child.enrollment_date).toLocaleDateString() : 'N/A'}</TableCell>
                                            <TableCell>
                                                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                                    <Tooltip title="View Profile">
                                                        <IconButton
                                                            size="small"
                                                            color="primary"
                                                            onClick={() => {
                                                                setProfileChildId(child.id);
                                                                setProfileModalOpen(true);
                                                            }}
                                                        >
                                                            <Visibility />
                                                        </IconButton>
                                                    </Tooltip>
                                                    {child.status !== 'paused' && child.status !== 'left' && (
                                                        <>
                                                            <Tooltip title="Pause Student">
                                                                <IconButton
                                                                    size="small"
                                                                    color="warning"
                                                                    onClick={() => {
                                                                        setPauseChild({
                                                                            ...child,
                                                                            name: `${child.first_name} ${child.last_name}`.trim()
                                                                        });
                                                                        setPauseModalOpen(true);
                                                                    }}
                                                                >
                                                                    <Pause />
                                                                </IconButton>
                                                            </Tooltip>
                                                            <Button
                                                                variant="outlined"
                                                                size="small"
                                                                onClick={() => { setSelectedChild(child); setModalOpen(true); }}
                                                            >
                                                                Promote
                                                            </Button>
                                                            <Button
                                                                variant="contained"
                                                                size="small"
                                                                color="secondary"
                                                                onClick={() => { setTransferChild(child); setTransferModalOpen(true); }}
                                                            >
                                                                Transfer
                                                            </Button>
                                                        </>
                                                    )}
                                                    {child.status === 'paused' && (
                                                        <>
                                                            <Tooltip title="Resume Student">
                                                                <IconButton
                                                                    size="small"
                                                                    color="success"
                                                                    onClick={() => {
                                                                        setResumeChild({
                                                                            ...child,
                                                                            name: `${child.first_name} ${child.last_name}`.trim()
                                                                        });
                                                                        setResumeModalOpen(true);
                                                                    }}
                                                                >
                                                                    <PlayArrow />
                                                                </IconButton>
                                                            </Tooltip>
                                                            <Typography variant="caption" color="text.secondary">
                                                                {child.pause_reason}
                                                            </Typography>
                                                        </>
                                                    )}
                                                </Box>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={6} align="center">
                                            {statusFilter === 'all' ? 'No children have been enrolled yet.' : `No ${statusFilter} children found.`}
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Box>
            )}

            {currentTab === 1 && (
                <PausedStudentsView onStudentResumed={fetchChildren} />
            )}

            {/* Modals */}
            <PromoteAssignStudentModal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                studentId={selectedChild?.id}
                currentClassId={selectedChild?.class_id}
                currentCenterId={selectedChild?.center_id}
                onSuccess={() => { setModalOpen(false); fetchChildren(); }}
            />
            <TransferStudentModal
                open={transferModalOpen}
                onClose={() => setTransferModalOpen(false)}
                studentId={transferChild?.id}
                fromCenterId={transferChild?.center_id}
                onSuccess={() => { setTransferModalOpen(false); fetchChildren(); }}
            />
            <PauseStudentModal
                open={pauseModalOpen}
                onClose={() => setPauseModalOpen(false)}
                student={pauseChild}
                onSuccess={handlePauseSuccess}
            />
            <ResumeStudentModal
                open={resumeModalOpen}
                onClose={() => setResumeModalOpen(false)}
                student={resumeChild}
                onSuccess={handleResumeSuccess}
            />
            <ChildProfileModal
                open={profileModalOpen}
                onClose={() => {
                    setProfileModalOpen(false);
                    setProfileChildId(null);
                }}
                childId={profileChildId}
            />
        </Box>
    );
};

export default ChildList;