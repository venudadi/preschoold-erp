import React from 'react';
import { Box, Typography } from '@mui/material';
import DashboardLayout from '../components/DashboardLayout';
import DocumentManagement from '../components/DocumentManagement';

const DocumentManagementPage = () => {
    return (
        <DashboardLayout>
            <Box sx={{ p: 3 }}>
                <Typography variant="h4" sx={{ mb: 3 }}>
                    Document Management
                </Typography>
                <DocumentManagement />
            </Box>
        </DashboardLayout>
    );
};

export default DocumentManagementPage;