import React, { useState, useEffect, useCallback } from 'react';
import { Box, TextField, Button, Paper, Typography, List, ListItem, ListItemText, Grid } from '@mui/material';
import { getCompanies, createCompany } from '../services/api';

const CompanyManagement = () => {
    const [companies, setCompanies] = useState([]);
    const [companyName, setCompanyName] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const fetchCompanies = useCallback(async () => {
        try {
            const data = await getCompanies();
            setCompanies(data);
        } catch (err) {
            // UPDATED: Use the actual error message from the 'err' object
            setError(err.message || 'Failed to load companies.');
        }
    }, []);

    useEffect(() => {
        fetchCompanies();
    }, [fetchCompanies]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        try {
            await createCompany({ companyName });
            setSuccess('Company added successfully!');
            setCompanyName('');
            fetchCompanies(); // Refresh the list
        } catch (err) {
            // UPDATED: Use the actual error message from the 'err' object
            setError(err.message || 'Failed to add company.');
        }
    };

    return (
        <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>Manage Tie-up Companies</Typography>
            <Box component="form" onSubmit={handleSubmit} sx={{ mb: 3 }}>
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={10}>
                        <TextField
                            fullWidth
                            label="Company Name"
                            value={companyName}
                            onChange={(e) => setCompanyName(e.target.value)}
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
            <Typography variant="h6">Existing Companies</Typography>
            <List dense>
                {companies.map(c => (
                    <ListItem key={c.id}>
                        <ListItemText primary={c.company_name} />
                    </ListItem>
                ))}
            </List>
        </Paper>
    );
};

export default CompanyManagement;

