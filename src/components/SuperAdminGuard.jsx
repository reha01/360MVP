/**
 * SuperAdminGuard - Protege rutas que solo el Super Admin puede acceder
 * 
 * No requiere workspace activo, solo verifica que el usuario sea Super Admin
 */

import { useSuperAdmin } from '../hooks/useSuperAdmin';
import { Navigate } from 'react-router-dom';

const SuperAdminGuard = ({ children }) => {
  const { isSuperAdmin } = useSuperAdmin();

  if (!isSuperAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default SuperAdminGuard;





