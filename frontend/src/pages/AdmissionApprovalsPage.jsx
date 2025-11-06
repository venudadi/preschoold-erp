import React from 'react';
import { Container, Box } from '@mui/material';
import AdmissionApprovalDashboard from '../components/AdmissionApprovalDashboard';

const AdmissionApprovalsPage = () => {
    return (
        <Container maxWidth="xl">
            <Box sx={{ mt: 4 }}>
                <AdmissionApprovalDashboard />
            </Box>
        </Container>
    );
};

export default AdmissionApprovalsPage;
