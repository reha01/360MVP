/**
 * Evaluator Assignment Logic
 * 
 * Centraliza la lógica de asignación automática de evaluadores según el tipo de campaña.
 * Basado en la "Matriz de 5 Tipos" de evaluación.
 */

// ========== CONSTANTS ==========

export const EVALUATION_TYPES = {
    SELF_ONLY: 'SELF_ONLY',
    TOP_DOWN: 'TOP_DOWN',
    PEER_TO_PEER: 'PEER_TO_PEER',
    LEADERSHIP_180: 'LEADERSHIP_180',
    FULL_360: 'FULL_360'
};

export const RELATION_TYPES = {
    SELF: 'SELF',
    MANAGER: 'MANAGER',
    PEER: 'PEER',
    SUBORDINATE: 'SUBORDINATE'
};

// ========== HELPER FUNCTIONS ==========

/**
 * Obtener el manager de un usuario
 */
export const getManager = (user, allUsers) => {
    if (!user.managerId) return null;
    return allUsers.find(u => u.id === user.managerId);
};

/**
 * Obtener el equipo (subordinados directos) de un usuario
 */
export const getTeam = (user, allUsers) => {
    return allUsers.filter(u => u.managerId === user.id);
};

/**
 * Obtener los pares de un usuario (mismo managerId, excluyendo al usuario mismo)
 */
export const getPeers = (user, allUsers) => {
    if (!user.managerId) return [];
    return allUsers.filter(u =>
        u.managerId === user.managerId && u.id !== user.id
    );
};

// ========== CORE ASSIGNMENT LOGIC ==========

/**
 * Calcula los evaluadores sugeridos (Incoming) para un usuario
 * según el tipo de campaña.
 * 
 * @param {Object} user - Usuario evaluatee
 * @param {string} campaignType - Tipo de evaluación (EVALUATION_TYPES)
 * @param {Array} allUsers - Lista completa de usuarios de la organización
 * @returns {Array} Array de { id, relation } de evaluadores sugeridos
 */
export const getSuggestedEvaluators = (user, campaignType, allUsers) => {
    const assignments = [];

    // 1. Siempre Auto (excepto validaciones)
    assignments.push({ id: user.id, relation: RELATION_TYPES.SELF });

    // Helpers
    const manager = getManager(user, allUsers);
    const team = getTeam(user, allUsers);
    const peers = getPeers(user, allUsers);

    switch (campaignType) {
        case EVALUATION_TYPES.SELF_ONLY:
            // Solo Self, ya agregado arriba
            break;

        case EVALUATION_TYPES.TOP_DOWN:
            // Incoming: Manager + Self
            if (manager) {
                assignments.push({ id: manager.id, relation: RELATION_TYPES.MANAGER });
            }
            break;

        case EVALUATION_TYPES.PEER_TO_PEER:
            // Incoming: Peers + Self
            peers.forEach(peer => {
                assignments.push({ id: peer.id, relation: RELATION_TYPES.PEER });
            });
            break;

        case EVALUATION_TYPES.LEADERSHIP_180:
            // Incoming: Manager + Team + Self
            if (manager) {
                assignments.push({ id: manager.id, relation: RELATION_TYPES.MANAGER });
            }
            team.forEach(member => {
                assignments.push({ id: member.id, relation: RELATION_TYPES.SUBORDINATE });
            });
            break;

        case EVALUATION_TYPES.FULL_360:
            // Incoming: Manager + Team + Peers + Self
            if (manager) {
                assignments.push({ id: manager.id, relation: RELATION_TYPES.MANAGER });
            }
            team.forEach(member => {
                assignments.push({ id: member.id, relation: RELATION_TYPES.SUBORDINATE });
            });
            peers.forEach(peer => {
                assignments.push({ id: peer.id, relation: RELATION_TYPES.PEER });
            });
            break;

        default:
            console.warn(`[getSuggestedEvaluators] Unknown campaign type: ${campaignType}`);
    }

    return assignments;
};

/**
 * Calcula a quién debe evaluar un usuario (Outgoing)
 * según el tipo de campaña.
 * 
 * @param {Object} user - Usuario evaluador
 * @param {string} campaignType - Tipo de evaluación
 * @param {Array} allUsers - Lista completa de usuarios
 * @returns {Array} Array de { id, relation } de usuarios a evaluar
 */
export const getOutgoingEvaluations = (user, campaignType, allUsers) => {
    const outgoing = [];

    // Siempre Self
    outgoing.push({ id: user.id, relation: RELATION_TYPES.SELF });

    // Helpers
    const team = getTeam(user, allUsers);
    const peers = getPeers(user, allUsers);

    switch (campaignType) {
        case EVALUATION_TYPES.SELF_ONLY:
            // Solo Self
            break;

        case EVALUATION_TYPES.TOP_DOWN:
            // Outgoing: Team (si existe) + Self
            if (team.length > 0) {
                team.forEach(member => {
                    outgoing.push({ id: member.id, relation: RELATION_TYPES.SUBORDINATE });
                });
            }
            break;

        case EVALUATION_TYPES.PEER_TO_PEER:
            // Outgoing: Peers + Self
            peers.forEach(peer => {
                outgoing.push({ id: peer.id, relation: RELATION_TYPES.PEER });
            });
            break;

        case EVALUATION_TYPES.LEADERSHIP_180:
            // Outgoing: SOLO Self (el líder NO evalúa a su equipo)
            break;

        case EVALUATION_TYPES.FULL_360:
            // Outgoing: Team + Peers + Self (+ Manager si se requiere evaluar hacia arriba)
            team.forEach(member => {
                outgoing.push({ id: member.id, relation: RELATION_TYPES.SUBORDINATE });
            });
            peers.forEach(peer => {
                outgoing.push({ id: peer.id, relation: RELATION_TYPES.PEER });
            });
            break;

        default:
            console.warn(`[getOutgoingEvaluations] Unknown campaign type: ${campaignType}`);
    }

    return outgoing;
};

// ========== VALIDATION FUNCTIONS ==========

/**
 * Valida si un usuario puede participar en un tipo de campaña específico
 * 
 * @param {Object} user - Usuario a validar
 * @param {string} campaignType - Tipo de campaña
 * @param {Array} allUsers - Lista completa de usuarios
 * @returns {Object} { isValid: boolean, error: string|null }
 */
export const validateCampaignType = (user, campaignType, allUsers) => {
    const team = getTeam(user, allUsers);
    const peers = getPeers(user, allUsers);

    switch (campaignType) {
        case EVALUATION_TYPES.LEADERSHIP_180:
            // Requiere tener equipo
            if (team.length === 0) {
                return {
                    isValid: false,
                    error: `El usuario "${user.name}" no tiene equipo y no puede participar en 180º Liderazgo`
                };
            }
            break;

        case EVALUATION_TYPES.PEER_TO_PEER:
            // Advertencia si no tiene peers (no bloqueante, solo warning)
            if (peers.length === 0) {
                return {
                    isValid: true,
                    warning: `El usuario "${user.name}" no tiene pares asignados`
                };
            }
            break;

        // Otros tipos no tienen validaciones específicas
    }

    return { isValid: true, error: null };
};

/**
 * Valida todos los usuarios de una campaña
 * 
 * @param {Array} selectedUsers - Usuarios seleccionados para la campaña
 * @param {string} campaignType - Tipo de campaña
 * @param {Array} allUsers - Lista completa de usuarios
 * @returns {Object} { isValid: boolean, errors: Array, warnings: Array }
 */
export const validateCampaignUsers = (selectedUsers, campaignType, allUsers) => {
    const errors = [];
    const warnings = [];

    selectedUsers.forEach(user => {
        const validation = validateCampaignType(user, campaignType, allUsers);

        if (!validation.isValid) {
            errors.push(validation.error);
        }

        if (validation.warning) {
            warnings.push(validation.warning);
        }
    });

    return {
        isValid: errors.length === 0,
        errors,
        warnings
    };
};

// ========== UTILITY FUNCTIONS ==========

/**
 * Convierte el formato de evaluadores sugeridos al formato customEvaluators
 * usado en el modelo de campaña
 * 
 * @param {Array} suggestedEvaluators - Array de { id, relation }
 * @returns {Object} { managers: [], peers: [], subordinates: [] }
 */
export const convertToCustomEvaluatorsFormat = (suggestedEvaluators) => {
    const customEvaluators = {
        managers: [],
        peers: [],
        subordinates: []
    };

    suggestedEvaluators.forEach(evaluator => {
        // SELF no se agrega a customEvaluators (se maneja con evaluatorRules.self)
        if (evaluator.relation === RELATION_TYPES.SELF) return;

        switch (evaluator.relation) {
            case RELATION_TYPES.MANAGER:
                customEvaluators.managers.push(evaluator.id);
                break;
            case RELATION_TYPES.PEER:
                customEvaluators.peers.push(evaluator.id);
                break;
            case RELATION_TYPES.SUBORDINATE:
                customEvaluators.subordinates.push(evaluator.id);
                break;
        }
    });

    return customEvaluators;
};

/**
 * Obtiene las reglas de evaluador para un tipo de campaña
 * 
 * @param {string} campaignType - Tipo de campaña
 * @returns {Object} evaluatorRules { self, manager, peers, subordinates, external }
 */
export const getEvaluatorRulesForType = (campaignType) => {
    const rules = {
        self: true, // Siempre true por defecto
        manager: false,
        peers: false,
        subordinates: false,
        external: false
    };

    switch (campaignType) {
        case EVALUATION_TYPES.SELF_ONLY:
            // Solo self ya está en true
            break;

        case EVALUATION_TYPES.TOP_DOWN:
            rules.manager = true;
            rules.subordinates = true;
            break;

        case EVALUATION_TYPES.PEER_TO_PEER:
            rules.peers = true;
            break;

        case EVALUATION_TYPES.LEADERSHIP_180:
            rules.manager = true;
            rules.subordinates = true;
            break;

        case EVALUATION_TYPES.FULL_360:
            rules.manager = true;
            rules.peers = true;
            rules.subordinates = true;
            break;
    }

    return rules;
};
