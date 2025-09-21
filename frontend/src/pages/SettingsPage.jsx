import React from 'react';
import { Box, Typography, Grid } from '@mui/material';
import ProgramManagement from '../components/ProgramManagement.jsx';
import CompanyManagement from '../components/CompanyManagement.jsx';
import CenterManagement from '../components/CenterManagement.jsx';

const SettingsPage = () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    return (
        <Box>
            <Typography variant="h4" component="h1" gutterBottom>
                Application Settings
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                Manage academic programs, corporate tie-ups, and system configurations.
            </Typography>

            <Grid container spacing={4}>
                {/* Center Management - Super Admin Only */}
                {user.role === 'super_admin' && (
                    <Grid item xs={12}>
                        <CenterManagement />
                    </Grid>
                )}
                
                <Grid item xs={12} md={6}>
                    <ProgramManagement />
                </Grid>
                <Grid item xs={12} md={6}>
                    <CompanyManagement />
                </Grid>
            </Grid>
        </Box>
    );
};

export default SettingsPage;