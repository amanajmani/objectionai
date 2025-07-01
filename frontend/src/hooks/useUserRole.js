import { useState, useEffect } from 'react';
import { trpc } from '../lib/trpc';

export const useUserRole = () => {
  const [role, setRole] = useState('submitter');
  const [isLoading, setIsLoading] = useState(true);
  const [hasRole, setHasRole] = useState(false);

  const { data, isLoading: queryLoading, error } = trpc.userRoles.getMyRole.useQuery(undefined, {
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    staleTime: 0, // Always refetch
    cacheTime: 0  // Don't cache
  });

  useEffect(() => {
    if (data) {
      console.log('Role Data Received:', data);
      setRole(data.role);
      setHasRole(data.hasRole);
      setIsLoading(false);
    } else if (!queryLoading) {
      setIsLoading(false);
    }
  }, [data, queryLoading]);

  const isAdmin = role === 'admin';
  const isReviewer = role === 'reviewer';
  const isSubmitter = role === 'submitter';
  
  const canCreate = isAdmin || isSubmitter;
  const canEdit = isAdmin;
  const canView = isAdmin || isReviewer || isSubmitter;
  const canGenerateDocuments = isAdmin || isReviewer || isSubmitter; // All roles can generate docs
  const canManageUsers = isAdmin;

  // Debug logging
  console.log('DEBUG Role Hook:', { role, isAdmin, canManageUsers, data });

  return {
    role,
    isLoading,
    hasRole,
    error,
    isAdmin,
    isReviewer,
    isSubmitter,
    canCreate,
    canEdit,
    canView,
    canGenerateDocuments,
    canManageUsers,
  };
};