import React from 'react';
import ChildList from '../components/ChildList.jsx';
import { Typography, Box } from '@mui/material';

const ChildrenManagementPage = () => {
    return (
        <Box>
            <Typography variant="h4" component="h1" gutterBottom>
                Children Management
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                View and manage all enrolled children.
            </Typography>
            <ChildList />
        </Box>
    );
};

export default ChildrenManagementPage;