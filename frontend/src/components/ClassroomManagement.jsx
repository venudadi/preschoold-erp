import React, { useState, useEffect } from 'react';
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, CircularProgress, TextField, Button, Alert } from '@mui/material';
import { getClassrooms, createClassroom } from '../services/api';

const ClassroomList = () => {
    const [classrooms, setClassrooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // State for the new classroom form
    const [newClassName, setNewClassName] = useState('');
    const [newClassDescription, setNewClassDescription] = useState('');

    const fetchClassrooms = async () => {
        setLoading(true);
        try {
            const data = await getClassrooms();
            setClassrooms(data);
        } catch (err) {
            setError(err.message || 'Failed to fetch classrooms.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchClassrooms();
    }, []);

    const handleCreateClassroom = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        try {
            await createClassroom(newClassName, newClassDescription);
            setSuccess('Classroom created successfully!');
            setNewClassName('');
            setNewClassDescription('');
            // Refetch classrooms to update the list
            fetchClassrooms();
        } catch (err) {
            setError(err.message || 'Failed to create classroom.');
        }
    };

    if (loading) {
        return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;
    }

    return (
        <Box sx={{ mt: 4 }}>
            <Typography variant="h5" component="h2" gutterBottom>
                Manage Classrooms
            </Typography>

            {/* Add New Classroom Form */}
            <Box component="form" onSubmit={handleCreateClassroom} sx={{ mb: 4, p: 2, border: '1px solid #ccc', borderRadius: 1 }}>
                <Typography variant="h6">Add New Classroom</Typography>
                <TextField
                    label="Classroom Name"
                    variant="outlined"
                    fullWidth
                    required
                    value={newClassName}
                    onChange={(e) => setNewClassName(e.target.value)}
                    sx={{ mt: 2 }}
                />
                <TextField
                    label="Description"
                    variant="outlined"
                    fullWidth
                    multiline
                    rows={2}
                    value={newClassDescription}
                    onChange={(e) => setNewClassDescription(e.target.value)}
                    sx={{ mt: 2 }}
                />
                <Button type="submit" variant="contained" sx={{ mt: 2 }}>
                    Create Classroom
                </Button>
                {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
                {success && <Alert severity="success" sx={{ mt: 2 }}>{success}</Alert>}
            </Box>

            {/* Existing Classrooms Table */}
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Name</TableCell>
                            <TableCell>Description</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {classrooms.length > 0 ? (
                            classrooms.map((classroom) => (
                                <TableRow key={classroom.id}>
                                    <TableCell>{classroom.name}</TableCell>
                                    <TableCell>{classroom.description}</TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={2} align="center">
                                    No classrooms have been created yet.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
};

export default ClassroomList;