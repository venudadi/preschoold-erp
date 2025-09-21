import React from 'react';
import { hasPermission, hasAnyPermission, hasAllPermissions } from '../config/permissions';

/**
 * Hook for checking permissions in functional components
 * 
 * @param {string} userRole - Current user's role
 * @returns {Object} Permission checking functions
 */
export const usePermissions = (userRole) => {
    return {
        can: (feature) => hasPermission(userRole, feature),
        canAny: (features) => hasAnyPermission(userRole, features),
        canAll: (features) => hasAllPermissions(userRole, features),
        userRole
    };
};

/**
 * Higher-order component for protecting entire components
 * 
 * @param {React.Component} Component - Component to protect
 * @param {string|string[]} requiredFeatures - Required features for access
 * @param {boolean} requireAny - Whether to require any or all features
 * @returns {React.Component} Protected component
 */
export const withPermission = (Component, requiredFeatures, requireAny = false) => {
    return (props) => {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const featureArray = Array.isArray(requiredFeatures) ? requiredFeatures : [requiredFeatures];
        
        let hasAccess;
        if (requireAny) {
            hasAccess = hasAnyPermission(user.role, featureArray);
        } else {
            hasAccess = hasAllPermissions(user.role, featureArray);
        }
        
        if (!hasAccess) {
            return null;
        }
        
        return React.createElement(Component, props);
    };
};