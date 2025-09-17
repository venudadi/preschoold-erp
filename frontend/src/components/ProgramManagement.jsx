import React, { useState, useEffect, useCallback } from 'react';
import { Box, TextField, Button, Paper, Typography, List, ListItem, ListItemText, Grid } from '@mui/material';
import { getPrograms, createProgram } from '../services/api';

const ProgramManagement = () => {
    const [programs, setPrograms] = useState([]);
    const [majorProgram, setMajorProgram] = useState('');
    const [specificProgram, setSpecificProgram] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const fetchPrograms = useCallback(async () => {
        try {
            const data = await getPrograms();
            setPrograms(data);
        } catch (err) {
            setError(err.message || 'Failed to load programs.');
        }
    }, []);

    useEffect(() => {
        fetchPrograms();
    }, [fetchPrograms]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        try {
            await createProgram({ majorProgram, specificProgram });
            setSuccess('Program added successfully!');
            setMajorProgram('');
            setSpecificProgram('');
            fetchPrograms(); // Refresh the list
        } catch (err) {
            setError(err.message || 'Failed to add program.');
        }
    };

    return (
        <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
            <Typography variant="h5" gutterBottom>Manage Academic Programs</Typography>
            <Box component="form" onSubmit={handleSubmit} sx={{ mb: 3 }}>
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={5}>
                        <TextField
                            fullWidth
                            label="Major Program (e.g., Daycare)"
                            value={majorProgram}
                            onChange={(e) => setMajorProgram(e.target.value)}
                            required
                        />
                    </Grid>
                    <Grid item xs={12} sm={5}>
                         <TextField
                            fullWidth
                            label="Specific Program (e.g., PLAYGROUP)"
                            value={specificProgram}
                            onChange={(e) => setSpecificProgram(e.target.value)}
                            required
                        />
                    </Grid>
                    <Grid item xs={12} sm={2}>
                        <Button type="submit" variant="contained" fullWidth>Add</Button>
                    </Grid>
                </Grid>
                {success && <Typography color="success.main" sx={{ mt: 1 }}>{success}</Typography>}
                {error && <Typography color="error" sx={{ mt: 1 }}>{error}</Typography>}
            </Box>
            <Typography variant="h6">Existing Programs</Typography>
            <List dense>
                {programs.map(p => (
                    <ListItem key={p.id}>
                        <ListItemText 
                            primary={p.specific_program} 
                            secondary={p.major_program} 
                        />
                    </ListItem>
                ))}
            </List>
        </Paper>
    );
};

export default ProgramManagement;

