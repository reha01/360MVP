// src/hooks/useOrgGuard.js
// Custom hook for route-level organization access control

import { useEffect, useState } from 'react';
import { useOrg } from '../context/OrgContext';
import { useAuth } from '../context/AuthContext';

export const useOrgGuard = (options = {}) => {
  const {
    requireActiveOrg = true,
    allowedRoles = ['owner', 'project_leader', 'coordinator', 'employee', 'evaluator'],
    redirectTo = '/select-workspace'
  } = options;

  const { user, loading: authLoading } = useAuth();
  const { 
    activeOrgId, 
    activeMembership, 
    loading: orgLoading,
    error: orgError 
  } = useOrg();

  const [guardState, setGuardState] = useState({
    loading: true,
    hasAccess: false,
    error: null,
    shouldRedirect: false,
    redirectUrl: null
  });

  useEffect(() => {
    // Still loading auth or org data
    if (authLoading || orgLoading) {
      setGuardState(prev => ({ ...prev, loading: true }));
      return;
    }

    // User not authenticated
    if (!user) {
      setGuardState({
        loading: false,
        hasAccess: false,
        error: 'User not authenticated',
        shouldRedirect: true,
        redirectUrl: '/login'
      });
      return;
    }

    // Org context error
    if (orgError) {
      setGuardState({
        loading: false,
        hasAccess: false,
        error: orgError,
        shouldRedirect: false,
        redirectUrl: null
      });
      return;
    }

    // No active org but required
    if (requireActiveOrg && !activeOrgId) {
      setGuardState({
        loading: false,
        hasAccess: false,
        error: 'No active workspace',
        shouldRedirect: true,
        redirectUrl: redirectTo
      });
      return;
    }

    // Has active org - check role permissions
    if (activeOrgId && activeMembership) {
      const hasValidRole = allowedRoles.includes(activeMembership.role);
      const isActiveMember = activeMembership.status === 'active';

      if (!hasValidRole) {
        setGuardState({
          loading: false,
          hasAccess: false,
          error: `Insufficient permissions. Required roles: ${allowedRoles.join(', ')}`,
          shouldRedirect: false,
          redirectUrl: null
        });
        return;
      }

      if (!isActiveMember) {
        setGuardState({
          loading: false,
          hasAccess: false,
          error: 'Membership is not active',
          shouldRedirect: true,
          redirectUrl: redirectTo
        });
        return;
      }

      // All checks passed
      setGuardState({
        loading: false,
        hasAccess: true,
        error: null,
        shouldRedirect: false,
        redirectUrl: null
      });
      return;
    }

    // No active org but not required
    if (!requireActiveOrg) {
      setGuardState({
        loading: false,
        hasAccess: true,
        error: null,
        shouldRedirect: false,
        redirectUrl: null
      });
      return;
    }

    // Default to no access
    setGuardState({
      loading: false,
      hasAccess: false,
      error: 'Access validation failed',
      shouldRedirect: true,
      redirectUrl: redirectTo
    });

  }, [
    user, 
    activeOrgId, 
    activeMembership, 
    authLoading, 
    orgLoading, 
    orgError,
    requireActiveOrg,
    allowedRoles,
    redirectTo
  ]);

  return guardState;
};

// HOC for protecting routes
export const withOrgGuard = (WrappedComponent, guardOptions = {}) => {
  return function GuardedComponent(props) {
    const guardState = useOrgGuard(guardOptions);
    const { navigate } = useNavigate ? useNavigate() : { navigate: null };

    useEffect(() => {
      if (guardState.shouldRedirect && guardState.redirectUrl && navigate) {
        navigate(guardState.redirectUrl);
      }
    }, [guardState.shouldRedirect, guardState.redirectUrl, navigate]);

    // Loading state
    if (guardState.loading) {
      return (
        <div className="org-guard-loading">
          <div className="loading-spinner" />
          <p>Validating workspace access...</p>
        </div>
      );
    }

    // Error state
    if (guardState.error && !guardState.shouldRedirect) {
      return (
        <div className="org-guard-error">
          <h3>Access Denied</h3>
          <p>{guardState.error}</p>
          <button onClick={() => window.history.back()}>
            Go Back
          </button>
        </div>
      );
    }

    // Redirect state (will redirect via useEffect)
    if (guardState.shouldRedirect) {
      return (
        <div className="org-guard-redirecting">
          <div className="loading-spinner" />
          <p>Redirecting...</p>
        </div>
      );
    }

    // Access granted
    if (guardState.hasAccess) {
      return <WrappedComponent {...props} />;
    }

    // Fallback
    return (
      <div className="org-guard-fallback">
        <p>Access validation in progress...</p>
      </div>
    );
  };
};

export default useOrgGuard;


