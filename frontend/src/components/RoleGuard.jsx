import React from 'react';
import { useUserRole } from '../hooks/useUserRole';
import LoadingSpinner from './LoadingSpinner';

const RoleGuard = ({ 
  children, 
  requiredRole = null, 
  requiredPermission = null,
  fallback = null 
}) => {
  const { 
    role, 
    isLoading, 
    isAdmin, 
    isReviewer, 
    isSubmitter,
    canCreate,
    canEdit,
    canView,
    canManageUsers 
  } = useUserRole();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  // Check specific role requirement
  if (requiredRole) {
    const hasRequiredRole = 
      (requiredRole === 'admin' && isAdmin) ||
      (requiredRole === 'reviewer' && (isAdmin || isReviewer)) ||
      (requiredRole === 'submitter' && (isAdmin || isSubmitter));

    if (!hasRequiredRole) {
      return fallback || null; // Return null instead of ugly error message
    }
  }

  // Check specific permission requirement
  if (requiredPermission) {
    const hasPermission = 
      (requiredPermission === 'create' && canCreate) ||
      (requiredPermission === 'edit' && canEdit) ||
      (requiredPermission === 'view' && canView) ||
      (requiredPermission === 'manageUsers' && canManageUsers);

    if (!hasPermission) {
      return fallback || null; // Return null instead of ugly error message
    }
  }

  return children;
};

export default RoleGuard;