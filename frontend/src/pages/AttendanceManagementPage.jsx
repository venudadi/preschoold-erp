import React from 'react';
import AttendanceManagement from '../components/AttendanceManagement';
import DashboardLayout from '../components/DashboardLayout';

const AttendanceManagementPage = () => {
    return (
        <DashboardLayout>
            <AttendanceManagement />
        </DashboardLayout>
    );
};

export default AttendanceManagementPage;