import React from 'react';
import { hasAnyPermission, hasAllPermissions } from '../config/permissions';

/**
 * PermissionGate - A reusable component for role-based access control
 * 
 * @param {Object} props
 * @param {string|string[]} props.features - Feature(s) required to show content
 * @param {string} props.userRole - Current user's role
 * @param {boolean} props.requireAny - If true, user needs ANY of the features. If false, ALL features required
 * @param {React.ReactNode} props.children - Content to show if user has permission
 * @param {React.ReactNode} props.fallback - Content to show if user lacks permission
 * @param {boolean} props.hideOnDenied - If true, render nothing when access denied. Overrides fallback
 */
const PermissionGate = ({ 
    features, 
    userRole, 
    requireAny = false, 
    children, 
    fallback = null, 
    hideOnDenied = true 
}) => {
    if (!userRole) {
        return hideOnDenied ? null : fallback;
    }

    const featureArray = Array.isArray(features) ? features : [features];
    
    let hasAccess;
    if (requireAny) {
        hasAccess = hasAnyPermission(userRole, featureArray);
    } else {
        hasAccess = hasAllPermissions(userRole, featureArray);
    }
    
    if (hasAccess) {
        return children;
    }
    
    return hideOnDenied ? null : fallback;
};

/**
 * Component for showing role-based content sections
 * 
 * @param {Object} props
 * @param {Object} props.roles - Object mapping roles to content
 * @param {string} props.userRole - Current user's role
 * @param {React.ReactNode} props.defaultContent - Default content if no role match
 */
export const RoleBasedContent = ({ roles, userRole, defaultContent = null }) => {
    if (roles[userRole]) {
        return roles[userRole];
    }
    
    return defaultContent;
};

export default PermissionGate;