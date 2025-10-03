import React from 'react';
import { Box, Container } from '@mui/material';
import AdminPortfolioDashboard from '../components/AdminPortfolioDashboard';

const AdminPortfolioPage = ({ user }) => {
  return (
    <Container maxWidth="xl" sx={{ mt: 2 }}>
      <AdminPortfolioDashboard userRole={user?.role || 'admin'} />
    </Container>
  );
};

export default AdminPortfolioPage;