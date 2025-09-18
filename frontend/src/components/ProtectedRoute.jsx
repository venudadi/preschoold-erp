import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useApi } from '../services/api';

const ProtectedRoute = ({ children, requiredRole = null }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const location = useLocation();
    const api = useApi();

    useEffect(() => {
        const verifyAuth = async () => {
            const token = localStorage.getItem('token');
            const user = JSON.parse(localStorage.getItem('user') || '{}');

            if (!token) {
                setIsAuthenticated(false);
                setIsLoading(false);
                return;
            }

            try {
                // Verify token with backend
                await api.get('/auth/verify');
                
                // If role is required, check it
                if (requiredRole && user.role !== requiredRole) {
                    throw new Error('Insufficient permissions');
                }

                setIsAuthenticated(true);
            } catch (error) {
                console.error('Authentication verification failed:', error);
                // Only clear auth data if it's not a network error
                if (error.response) {
                    localStorage.removeItem('token');
                    localStorage.removeItem('refreshToken');
                    localStorage.removeItem('sessionToken');
                    localStorage.removeItem('csrfToken');
                    localStorage.removeItem('user');
                }
                setIsAuthenticated(false);
            } finally {
                setIsLoading(false);
            }
        };

        verifyAuth();
    }, [api, requiredRole]);

    if (isLoading) {
        // You can replace this with a loading spinner component
        return <div>Loading...</div>;
    }

    if (!isAuthenticated) {
        // Redirect to login while saving the attempted URL
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return children;
};

export default ProtectedRoute;