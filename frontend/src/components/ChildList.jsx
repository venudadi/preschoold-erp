import React, { useState, useEffect } from 'react';
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, CircularProgress } from '@mui/material';
import { Button } from '@mui/material';
import PromoteAssignStudentModal from './PromoteAssignStudentModal';
import TransferStudentModal from './TransferStudentModal';
import { getChildren } from '../services/api';

const ChildList = () => {
    const [children, setChildren] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Modal state
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedChild, setSelectedChild] = useState(null);
    const [transferModalOpen, setTransferModalOpen] = useState(false);
    const [transferChild, setTransferChild] = useState(null);

    useEffect(() => {
        const fetchChildren = async () => {
            try {
                const data = await getChildren();
                setChildren(data);
            } catch (err) {
                setError(err.message || 'Failed to fetch children data.');
            } finally {
                setLoading(false);
            }
        };

        fetchChildren();
    }, []); // Empty dependency array means this runs once when the component mounts

    if (loading) {
        return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;
    }

    if (error) {
        return <Typography color="error" sx={{ mt: 4 }}>{error}</Typography>;
    }

    return (
        <Box sx={{ mt: 4 }}>
            <Typography variant="h5" component="h2" gutterBottom>
                Enrolled Children
            </Typography>
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Full Name</TableCell>
                            <TableCell>Date of Birth</TableCell>
                            <TableCell>Classroom</TableCell>
                            <TableCell>Enrollment Date</TableCell>
                            <TableCell>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {children.length > 0 ? (
                            children.map((child) => (
                                <TableRow key={child.id}>
                                    <TableCell>{child.full_name}</TableCell>
                                    <TableCell>{new Date(child.date_of_birth).toLocaleDateString()}</TableCell>
                                    <TableCell>{child.classroom_name || 'Unassigned'}</TableCell>
                                    <TableCell>{new Date(child.enrollment_date).toLocaleDateString()}</TableCell>
                                    <TableCell>
                                        <Button
                                            variant="outlined"
                                            size="small"
                                            onClick={() => { setSelectedChild(child); setModalOpen(true); }}
                                            sx={{ mr: 1 }}
                                        >
                                            Promote/Assign
                                        </Button>
                                        <Button
                                            variant="contained"
                                            size="small"
                                            color="secondary"
                                            onClick={() => { setTransferChild(child); setTransferModalOpen(true); }}
                                        >
                                            Transfer
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={4} align="center">
                                    No children have been enrolled yet.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
            <PromoteAssignStudentModal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                studentId={selectedChild?.id}
                currentClassId={selectedChild?.class_id}
                currentCenterId={selectedChild?.center_id}
                onSuccess={() => { setModalOpen(false); /* Optionally refetch children */ }}
            />
            <TransferStudentModal
                open={transferModalOpen}
                onClose={() => setTransferModalOpen(false)}
                studentId={transferChild?.id}
                fromCenterId={transferChild?.center_id}
                onSuccess={() => { setTransferModalOpen(false); /* Optionally refetch children */ }}
            />
        </Box>
    );
};

export default ChildList;
