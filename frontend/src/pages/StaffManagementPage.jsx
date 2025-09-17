import React from 'react';
import StaffManagement from '../components/StaffManagement';
import DashboardLayout from '../components/DashboardLayout';

const StaffManagementPage = () => {
    return (
        <DashboardLayout>
            <StaffManagement />
        </DashboardLayout>
    );
};

export default StaffManagementPage;