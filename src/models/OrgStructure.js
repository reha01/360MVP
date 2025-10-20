/**
 * Modelo de Estructura Organizacional para 360° Evaluations
 * 
 * Define la jerarquía de 3 niveles: Organización → Área → Departamento
 * Con soporte para managers múltiples (funcional, proyecto, matriz)
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
 * Modelo de Área/Departamento
 */
export const createAreaModel = (data) => {
  const now = new Date();
  
  return {
    // Identificadores
    areaId: data.areaId || `area_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    orgId: data.orgId,
    
    // Información básica
    name: data.name?.trim(),
    description: data.description?.trim() || '',
    
    // Jerarquía
    level: data.level || ORG_LEVELS.AREA,
    parentId: data.parentId || null,
    path: data.path || [], // Array de IDs desde raíz
    
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
    
    // Información básica
    email: data.email,
    displayName: data.displayName,
    jobTitle: data.jobTitle,
    
    // Estructura organizacional
    areaId: data.areaId || null,
    departmentId: data.departmentId || null,
    
    // Relaciones jerárquicas
    managerId: data.managerId || null,
    managerType: data.managerType || MANAGER_TYPES.FUNCTIONAL,
    subordinateIds: data.subordinateIds || [],
    
    // Job Families (múltiples permitidas)
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
 * Validar estructura de área
 */
export const validateArea = (area) => {
  const errors = [];
  
  // Validaciones básicas
  if (!area.name || area.name.length < VALIDATION_RULES.MIN_NAME_LENGTH) {
    errors.push(`Nombre debe tener al menos ${VALIDATION_RULES.MIN_NAME_LENGTH} caracteres`);
  }
  
  if (area.name && area.name.length > VALIDATION_RULES.MAX_NAME_LENGTH) {
    errors.push(`Nombre no puede exceder ${VALIDATION_RULES.MAX_NAME_LENGTH} caracteres`);
  }
  
  if (area.description && area.description.length > VALIDATION_RULES.MAX_DESCRIPTION_LENGTH) {
    errors.push(`Descripción no puede exceder ${VALIDATION_RULES.MAX_DESCRIPTION_LENGTH} caracteres`);
  }
  
  // Validaciones de nivel
  if (area.level < ORG_LEVELS.ORGANIZATION || area.level > ORG_LEVELS.DEPARTMENT) {
    errors.push('Nivel debe estar entre 1 (Organización) y 3 (Departamento)');
  }
  
  // Validación de profundidad
  if (area.level > VALIDATION_RULES.MAX_DEPTH) {
    errors.push(`Profundidad máxima permitida: ${VALIDATION_RULES.MAX_DEPTH} niveles`);
  }
  
  // Validación de manager type
  if (area.managerType && !Object.values(MANAGER_TYPES).includes(area.managerType)) {
    errors.push(`Tipo de manager inválido: ${area.managerType}`);
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
  
  // Validaciones básicas
  if (!user.email || !user.email.includes('@')) {
    errors.push('Email válido requerido');
  }
  
  if (!user.displayName || user.displayName.length < 2) {
    errors.push('Nombre de usuario requerido (mínimo 2 caracteres)');
  }
  
  // Validación de manager type
  if (user.managerType && !Object.values(MANAGER_TYPES).includes(user.managerType)) {
    errors.push(`Tipo de manager inválido: ${user.managerType}`);
  }
  
  // Validación de job families
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
 * Construir path jerárquico para un área
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
 * Obtener todas las áreas hijas de un área padre
 */
export const getChildAreas = (parentId, areas) => {
  return areas.filter(area => area.parentId === parentId);
};

/**
 * Obtener árbol completo de estructura organizacional
 */
export const buildOrgTree = (areas) => {
  const areasMap = {};
  const rootAreas = [];
  
  // Crear mapa de áreas
  areas.forEach(area => {
    areasMap[area.areaId] = { ...area, children: [] };
  });
  
  // Construir árbol
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
 * Validar nombres únicos por nivel
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
 * Obtener área por ID
 */
export const getAreaById = (areaId, areas) => {
  return areas.find(area => area.areaId === areaId);
};

/**
 * Obtener usuarios por área
 */
export const getUsersByArea = (areaId, users) => {
  return users.filter(user => 
    user.areaId === areaId || user.departmentId === areaId
  );
};

/**
 * Obtener manager chain (jerarquía hacia arriba)
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
  // Constants
  ORG_LEVELS,
  MANAGER_TYPES,
  VALIDATION_RULES,
  
  // Models
  createAreaModel,
  createExtendedUserModel,
  
  // Validation
  validateArea,
  validateExtendedUser,
  validateUniqueNames,
  
  // Hierarchy
  buildAreaPath,
  getChildAreas,
  buildOrgTree,
  detectManagerCycles,
  
  // Utilities
  getAreaById,
  getUsersByArea,
  getManagerChain,
  getDirectSubordinates,
  getAllSubordinates
};
