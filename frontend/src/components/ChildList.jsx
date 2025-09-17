import React, { useState, useEffect } from 'react';
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, CircularProgress } from '@mui/material';
import { getChildren } from '../services/api';

const ChildList = () => {
    const [children, setChildren] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

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
        </Box>
    );
};

export default ChildList;
