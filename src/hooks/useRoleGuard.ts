import { useAuth, UserRole } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

/**
 * Hook to enforce role-based access at the component level.
 * This provides defense-in-depth on top of RLS policies.
 */
export function useRoleGuard(allowedRoles: UserRole[]) {
  const { role, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && role && !allowedRoles.includes(role)) {
      navigate('/dashboard', { replace: true });
    }
  }, [role, loading, allowedRoles, navigate]);

  return { isAuthorized: role && allowedRoles.includes(role), loading };
}
