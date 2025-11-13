/**
 * Modelo de Estructura Organizacional para 360Â° Evaluations
 * 
 * Define la jerarquÃ­a de 3 niveles: OrganizaciÃ³n â†’ Ãrea â†’ Departamento
 * Con soporte para managers mÃºltiples (funcional, proyecto, matriz)
 */

// ========== CONSTANTS ==========

export const ORG_LEVELS = {
  ORGANIZATION: 1,
  AREA: 2,
  DEPARTMENT: 3
};

export const MANAGER_TYPES = {
  FUNCTIONAL: 'functional',    // Jefe directo funcional
  PROJECT: 'project',         // Jefe de proyecto (temporal)
  MATRIX: 'matrix'           // Jefe matriz (estructura compleja)
};

export const VALIDATION_RULES = {
  MAX_DEPTH: 3,
  MIN_NAME_LENGTH: 2,
  MAX_NAME_LENGTH: 100,
  MAX_DESCRIPTION_LENGTH: 500
};

// ========== DATA MODELS ==========

/**
 * Modelo de Ãrea/Departamento
 */
export const createAreaModel = (data) => {
  const now = new Date();
  
  return {
    // Identificadores
    areaId: data.areaId || `area_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    orgId: data.orgId,
    
    // InformaciÃ³n bÃ¡sica
    name: data.name?.trim(),
    description: data.description?.trim() || '',
    
    // JerarquÃ­a
    level: data.level || ORG_LEVELS.AREA,
    parentId: data.parentId || null,
    path: data.path || [], // Array de IDs desde raÃ­z
    
    // Manager
    managerId: data.managerId || null,
    managerType: data.managerType || MANAGER_TYPES.FUNCTIONAL,
    
    // Metadatos
    memberCount: data.memberCount || 0,
    isActive: data.isActive !== undefined ? data.isActive : true,
    
    // Timestamps
    createdAt: data.createdAt || now,
    updatedAt: data.updatedAt || now,
    createdBy: data.createdBy,
    updatedBy: data.updatedBy
  };
};

/**
 * Modelo de Usuario extendido con estructura organizacional
 */
export const createExtendedUserModel = (data) => {
  const now = new Date();
  
  return {
    // Identificadores
    userId: data.userId,
    orgId: data.orgId,
    
    // InformaciÃ³n bÃ¡sica
    email: data.email,
    displayName: data.displayName,
    jobTitle: data.jobTitle,
    
    // Estructura organizacional
    areaId: data.areaId || null,
    departmentId: data.departmentId || null,
    
    // Relaciones jerÃ¡rquicas
    managerId: data.managerId || null,
    managerType: data.managerType || MANAGER_TYPES.FUNCTIONAL,
    subordinateIds: data.subordinateIds || [],
    
    // Job Families (mÃºltiples permitidas)
    jobFamilyIds: data.jobFamilyIds || [],
    
    // Metadatos
    hireDate: data.hireDate,
    isActive: data.isActive !== undefined ? data.isActive : true,
    
    // Timestamps
    createdAt: data.createdAt || now,
    updatedAt: data.updatedAt || now,
    createdBy: data.createdBy,
    updatedBy: data.updatedBy
  };
};

// ========== VALIDATION FUNCTIONS ==========

/**
 * Validar estructura de Ã¡rea
 */
export const validateArea = (area) => {
  const errors = [];
  
  // Validaciones bÃ¡sicas
  if (!area.name || area.name.length < VALIDATION_RULES.MIN_NAME_LENGTH) {
    errors.push(`Nombre debe tener al menos ${VALIDATION_RULES.MIN_NAME_LENGTH} caracteres`);
  }
  
  if (area.name && area.name.length > VALIDATION_RULES.MAX_NAME_LENGTH) {
    errors.push(`Nombre no puede exceder ${VALIDATION_RULES.MAX_NAME_LENGTH} caracteres`);
  }
  
  if (area.description && area.description.length > VALIDATION_RULES.MAX_DESCRIPTION_LENGTH) {
    errors.push(`DescripciÃ³n no puede exceder ${VALIDATION_RULES.MAX_DESCRIPTION_LENGTH} caracteres`);
  }
  
  // Validaciones de nivel
  if (area.level < ORG_LEVELS.ORGANIZATION || area.level > ORG_LEVELS.DEPARTMENT) {
    errors.push('Nivel debe estar entre 1 (OrganizaciÃ³n) y 3 (Departamento)');
  }
  
  // ValidaciÃ³n de profundidad
  if (area.level > VALIDATION_RULES.MAX_DEPTH) {
    errors.push(`Profundidad mÃ¡xima permitida: ${VALIDATION_RULES.MAX_DEPTH} niveles`);
  }
  
  // ValidaciÃ³n de manager type
  if (area.managerType && !Object.values(MANAGER_TYPES).includes(area.managerType)) {
    errors.push(`Tipo de manager invÃ¡lido: ${area.managerType}`);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validar usuario extendido
 */
export const validateExtendedUser = (user) => {
  const errors = [];
  
  // Validaciones bÃ¡sicas
  if (!user.email || !user.email.includes('@')) {
    errors.push('Email vÃ¡lido requerido');
  }
  
  if (!user.displayName || user.displayName.length < 2) {
    errors.push('Nombre de usuario requerido (mÃ­nimo 2 caracteres)');
  }
  
  // ValidaciÃ³n de manager type
  if (user.managerType && !Object.values(MANAGER_TYPES).includes(user.managerType)) {
    errors.push(`Tipo de manager invÃ¡lido: ${user.managerType}`);
  }
  
  // ValidaciÃ³n de job families
  if (user.jobFamilyIds && !Array.isArray(user.jobFamilyIds)) {
    errors.push('Job Family IDs debe ser un array');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// ========== HIERARCHY FUNCTIONS ==========

/**
 * Construir path jerÃ¡rquico para un Ã¡rea
 */
export const buildAreaPath = (areaId, areasMap) => {
  const path = [];
  let currentId = areaId;
  
  while (currentId && areasMap[currentId]) {
    path.unshift(currentId);
    currentId = areasMap[currentId].parentId;
  }
  
  return path;
};

/**
 * Obtener todas las Ã¡reas hijas de un Ã¡rea padre
 */
export const getChildAreas = (parentId, areas) => {
  return areas.filter(area => area.parentId === parentId);
};

/**
 * Obtener Ã¡rbol completo de estructura organizacional
 */
export const buildOrgTree = (areas) => {
  const areasMap = {};
  const rootAreas = [];
  
  // Crear mapa de Ã¡reas
  areas.forEach(area => {
    areasMap[area.areaId] = { ...area, children: [] };
  });
  
  // Construir Ã¡rbol
  areas.forEach(area => {
    if (area.parentId && areasMap[area.parentId]) {
      areasMap[area.parentId].children.push(areasMap[area.areaId]);
    } else {
      rootAreas.push(areasMap[area.areaId]);
    }
  });
  
  return {
    rootAreas,
    areasMap
  };
};

/**
 * Detectar ciclos en relaciones de manager
 */
export const detectManagerCycles = (users) => {
  const cycles = [];
  const visited = new Set();
  const recursionStack = new Set();
  
  const dfs = (userId, path = []) => {
    if (recursionStack.has(userId)) {
      // Ciclo detectado
      const cycleStart = path.indexOf(userId);
      cycles.push(path.slice(cycleStart));
      return;
    }
    
    if (visited.has(userId)) return;
    
    visited.add(userId);
    recursionStack.add(userId);
    
    const user = users.find(u => u.userId === userId);
    if (user && user.managerId) {
      dfs(user.managerId, [...path, userId]);
    }
    
    recursionStack.delete(userId);
  };
  
  users.forEach(user => {
    if (!visited.has(user.userId)) {
      dfs(user.userId);
    }
  });
  
  return cycles;
};

/**
 * Validar nombres Ãºnicos por nivel
 */
export const validateUniqueNames = (areas, newArea) => {
  const siblings = areas.filter(area => 
    area.parentId === newArea.parentId && 
    area.areaId !== newArea.areaId &&
    area.isActive
  );
  
  const duplicateName = siblings.find(area => 
    area.name.toLowerCase() === newArea.name.toLowerCase()
  );
  
  return {
    isValid: !duplicateName,
    duplicate: duplicateName
  };
};

// ========== UTILITY FUNCTIONS ==========

/**
 * Obtener Ã¡rea por ID
 */
export const getAreaById = (areaId, areas) => {
  return areas.find(area => area.areaId === areaId);
};

/**
 * Obtener usuarios por Ã¡rea
 */
export const getUsersByArea = (areaId, users) => {
  return users.filter(user => 
    user.areaId === areaId || user.departmentId === areaId
  );
};

/**
 * Obtener manager chain (jerarquÃ­a hacia arriba)
 */
export const getManagerChain = (userId, users) => {
  const chain = [];
  let currentUserId = userId;
  
  while (currentUserId) {
    const user = users.find(u => u.userId === currentUserId);
    if (!user || !user.managerId) break;
    
    chain.push(user.managerId);
    currentUserId = user.managerId;
  }
  
  return chain;
};

/**
 * Obtener subordinados directos
 */
export const getDirectSubordinates = (managerId, users) => {
  return users.filter(user => user.managerId === managerId);
};

/**
 * Obtener todos los subordinados (recursivo)
 */
export const getAllSubordinates = (managerId, users) => {
  const allSubordinates = [];
  const directSubordinates = getDirectSubordinates(managerId, users);
  
  directSubordinates.forEach(subordinate => {
    allSubordinates.push(subordinate);
    allSubordinates.push(...getAllSubordinates(subordinate.userId, users));
  });
  
  return allSubordinates;
};

// ========== EXPORT DEFAULT ==========

export default {

};
