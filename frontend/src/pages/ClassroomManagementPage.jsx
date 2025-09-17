import React from 'react';
import ClassroomManagement from '../components/ClassroomManagement.jsx';
import { Typography, Box } from '@mui/material';

const ClassroomManagementPage = () => {
    return (
        <Box>
            <Typography variant="h4" component="h1" gutterBottom>
                Classroom Management
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                Create new classrooms and view existing ones.
            </Typography>
            <ClassroomManagement />
        </Box>
    );
};

export default ClassroomManagementPage;

