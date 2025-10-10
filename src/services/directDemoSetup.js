/**
 * DirectDemoSetup - Configuración directa del usuario demo
 * 
 * En lugar de crear organizaciones en Firestore, vamos a simular
 * que el usuario ya tiene una organización y permisos
 */

export const directDemoSetup = async (user) => {
  try {
    console.log('[DirectDemoSetup] Setting up demo user directly:', user.uid);

    if (!user || !user.uid) {
      throw new Error('User not authenticated');
    }

    // Crear configuración demo en localStorage
    const demoConfig = {
      userId: user.uid,
      email: user.email,
      orgId: `demo_org_${user.uid.slice(-8)}`,
      orgName: 'Mi Organización Demo',
      role: 'owner',
      status: 'active',
      isDemo: true,
      createdAt: new Date().toISOString()
    };

    // Guardar configuración
    localStorage.setItem('demo_user_config', JSON.stringify(demoConfig));
    
    // También guardar en sessionStorage para esta sesión
    sessionStorage.setItem('current_org_id', demoConfig.orgId);
    sessionStorage.setItem('current_org_name', demoConfig.orgName);
    sessionStorage.setItem('user_role', demoConfig.role);

    console.log('[DirectDemoSetup] Demo configuration saved to localStorage');

    return {
      success: true,
      orgId: demoConfig.orgId,
      message: 'Configuración demo creada (modo local)'
    };

  } catch (error) {
    console.error('[DirectDemoSetup] Error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};
