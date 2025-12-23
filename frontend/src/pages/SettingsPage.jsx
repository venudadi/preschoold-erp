import React, { useState } from 'react';
import { Box, Typography, Grid, Tabs, Tab, Paper } from '@mui/material';
import ProgramManagement from '../components/ProgramManagement.jsx';
import CompanyManagement from '../components/CompanyManagement.jsx';
import CenterManagement from '../components/CenterManagement.jsx';
import EmailSettingsManager from '../components/EmailSettingsManager.jsx';

const SettingsPage = () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const isSuperAdmin = user.role === 'super_admin';
    const [currentTab, setCurrentTab] = useState(0);

    const handleTabChange = (event, newValue) => {
        setCurrentTab(newValue);
    };

    return (
        <Box>
            <Typography variant="h4" component="h1" gutterBottom>
                Application Settings
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                Manage academic programs, corporate tie-ups, and system configurations.
            </Typography>

            <Paper sx={{ mb: 4 }}>
                <Tabs 
                    value={currentTab} 
                    onChange={handleTabChange}
                    indicatorColor="primary"
                    textColor="primary"
                >
                    <Tab label="Academic & Programs" />
                    <Tab label="Company Tie-ups" />
                    {isSuperAdmin && <Tab label="Centers" />}
                    {isSuperAdmin && <Tab label="Email Configuration" />}
                </Tabs>
            </Paper>

            <Box sx={{ mt: 2 }}>
                {currentTab === 0 && (
                    <Grid container spacing={4}>
                        <Grid item xs={12}>
                            <ProgramManagement />
                        </Grid>
                    </Grid>
                )}

                {currentTab === 1 && (
                    <Grid container spacing={4}>
                        <Grid item xs={12}>
                            <CompanyManagement />
                        </Grid>
                    </Grid>
                )}

                {isSuperAdmin && currentTab === 2 && (
                    <Grid container spacing={4}>
                        <Grid item xs={12}>
                            <CenterManagement />
                        </Grid>
                    </Grid>
                )}

                {isSuperAdmin && currentTab === 3 && (
                    <Grid container spacing={4}>
                        <Grid item xs={12}>
                            <EmailSettingsManager />
                        </Grid>
                    </Grid>
                )}
            </Box>
        </Box>
    );
};

export default SettingsPage;