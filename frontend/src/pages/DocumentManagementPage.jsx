import React from 'react';
import { Box, Typography } from '@mui/material';
import DocumentManagement from '../components/DocumentManagement';

const DocumentManagementPage = () => {
    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" sx={{ mb: 3 }}>
                Document Management
            </Typography>
            <DocumentManagement />
        </Box>
    );
};

export default DocumentManagementPage;