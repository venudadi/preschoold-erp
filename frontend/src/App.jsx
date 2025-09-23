import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginRoute from './pages/LoginRoute.jsx';
import AutoLogin from './pages/AutoLogin.jsx';
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
import UserManagementPage from './pages/OwnersManagementPage.jsx'; // Comprehensive User Management
import LessonPlansPage from './pages/LessonPlansPage.jsx';
import AssignmentsPage from './pages/AssignmentsPage.jsx';
import MessagingPage from './pages/MessagingPage.jsx';
import ObservationLogsPage from './pages/ObservationLogsPage.jsx';
import DigitalPortfolioPage from './pages/DigitalPortfolioPage.jsx';
import ClassroomAnnouncementsPage from './pages/ClassroomAnnouncementsPage.jsx';
import { Typography } from '@mui/material';

function App() {
  return (
    <Router>
      <Routes>
  <Route path="/login" element={<LoginRoute />} />
  <Route path="/auto-login" element={<AutoLogin />} />

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
          <Route path="users" element={<UserManagementPage />} /> {/* User Management (All Roles) */}
          <Route path="lesson-plans" element={<LessonPlansPage />} />
          <Route path="assignments" element={<AssignmentsPage />} />
          <Route path="messaging" element={<MessagingPage />} />
          <Route path="observation-logs" element={<ObservationLogsPage />} />
          <Route path="digital-portfolio" element={<DigitalPortfolioPage />} />
          <Route path="classroom-announcements" element={<ClassroomAnnouncementsPage />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;

