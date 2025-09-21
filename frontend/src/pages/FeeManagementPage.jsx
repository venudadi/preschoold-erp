import React from 'react';
import { Box, Typography, Tab, Tabs } from '@mui/material';
import FeeStructureManagement from '../components/FeeStructureManagement';
import ExitRecordsTab from '../components/ExitRecordsTab';

const FeeManagementPage = () => {
    const [currentTab, setCurrentTab] = React.useState(0);

    const handleTabChange = (event, newValue) => {
        setCurrentTab(newValue);
    };

    return (
        <Box>
            <Typography variant="h4" gutterBottom>
                Fee Management
            </Typography>

            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                <Tabs value={currentTab} onChange={handleTabChange}>
                    <Tab label="Fee Structures" />
                    <Tab label="Exit Records" />
                </Tabs>
            </Box>

            {currentTab === 0 && <FeeStructureManagement />}
            {currentTab === 1 && <ExitRecordsTab />}
        </Box>
    );
};

export default FeeManagementPage;