import React from 'react';
import { Navigate } from 'react-router-dom';
import AcademicCoordinatorDashboard from './AcademicCoordinatorDashboard';
import AdminDashboard from './AdminDashboard';
import TeacherDashboard from './TeacherDashboard';

const LessonPlansRouter = () => {
    // Get user role from localStorage or context
    const userStr = localStorage.getItem('user');
    if (!userStr) {
        return <Navigate to="/login" />;
    }

    const user = JSON.parse(userStr);
    const role = user.role;

    // Route to appropriate dashboard based on role
    switch (role) {
        case 'academic_coordinator':
            return <AcademicCoordinatorDashboard />;

        case 'admin':
        case 'center_director':
        case 'super_admin':
        case 'owner':
            return <AdminDashboard />;

        case 'teacher':
            return <TeacherDashboard />;

        default:
            return (
                <div style={{ padding: '24px', textAlign: 'center' }}>
                    <h2>Access Denied</h2>
                    <p>You do not have permission to access lesson planning.</p>
                </div>
            );
    }
};

export default LessonPlansRouter;
