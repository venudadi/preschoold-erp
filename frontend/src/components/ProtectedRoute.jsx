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
            const sessionToken = localStorage.getItem('sessionToken');
            const csrfToken = localStorage.getItem('csrfToken');
            const user = JSON.parse(localStorage.getItem('user') || '{}');

            // Debug: log tokens and user
            console.debug('[ProtectedRoute] token:', token);
            console.debug('[ProtectedRoute] sessionToken:', sessionToken);
            console.debug('[ProtectedRoute] csrfToken:', csrfToken);
            console.debug('[ProtectedRoute] user:', user);

            if (!token) {
                console.debug('[ProtectedRoute] No token found, not authenticated.');
                setIsAuthenticated(false);
                setIsLoading(false);
                return;
            }

            try {
                // Verify token with backend
                const verifyResp = await api.get('/auth/verify');
                console.debug('[ProtectedRoute] /auth/verify response:', verifyResp);

                // If role is required, check it
                if (requiredRole && user.role !== requiredRole) {
                    throw new Error('Insufficient permissions');
                }

                setIsAuthenticated(true);
            } catch (error) {
                console.error('[ProtectedRoute] Authentication verification failed:', error);
                if (error.response) {
                    console.error('[ProtectedRoute] Error response data:', error.response.data);
                }
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
        return <div style={{ padding: 16 }}>Loading…</div>;
    }

    if (!isAuthenticated) {
        // Redirect to login while saving the attempted URL
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return children;
};

export default ProtectedRoute;