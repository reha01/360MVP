/**
 * useSuperAdmin Hook
 * 
 * Detecta si el usuario actual es el Super Admin (reha01@gmail.com)
 * El Super Admin tiene permisos para gestionar el catálogo global de tests
 */

import { useAuth } from '../context/AuthContext';

const SUPER_ADMIN_EMAIL = 'reha01@gmail.com';

export const useSuperAdmin = () => {
  const { user } = useAuth();

  const isSuperAdmin = user?.email === SUPER_ADMIN_EMAIL;

  return {
    isSuperAdmin,
    superAdminEmail: SUPER_ADMIN_EMAIL,
    user
  };
};

export default useSuperAdmin;

