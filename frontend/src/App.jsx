import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage.jsx';
import DashboardLayout from './components/DashboardLayout.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import ChildrenManagementPage from './pages/ChildrenManagementPage.jsx';
import ClassroomManagementPage from './pages/ClassroomManagementPage.jsx';
import EnquiryManagementPage from './pages/EnquiryManagementPage.jsx';
import BillingManagementPage from './pages/BillingManagementPage.jsx';
import SettingsPage from './pages/SettingsPage.jsx';
import DocumentManagementPage from './pages/DocumentManagementPage.jsx';
import FeeManagementPage from './pages/FeeManagementPage.jsx';
import OwnersManagementPage from './pages/OwnersManagementPage.jsx';
import { Typography } from '@mui/material';

function App() {
  return (
    <Router
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true
      }}
    >
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        {/* All protected routes are now children of the DashboardLayout */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          {/* Default route inside the dashboard will be the stats page */}
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="children" element={<ChildrenManagementPage />} />
          <Route path="classrooms" element={<ClassroomManagementPage />} />
          <Route path="attendance" element={<Typography variant="h4">Attendance Management (Coming Soon)</Typography>} />
          <Route path="enquiries" element={<EnquiryManagementPage />} /> {/* <-- ADD THIS ROUTE */}
          <Route path="billing" element={<BillingManagementPage />} /> {/* <-- ADD THIS ROUTE */}
          <Route path="reports" element={<Typography variant="h4">Reports Page (Coming Soon)</Typography>} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="documents" element={<DocumentManagementPage />} />
          <Route path="fees" element={<FeeManagementPage />} />
          <Route path="owners" element={<OwnersManagementPage />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;

