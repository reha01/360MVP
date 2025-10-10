/**
 * Banco de Preguntas para Evaluación 360° de Liderazgo
 * 
 * Estructura:
 * - 8 Categorías de Liderazgo
 * - 50+ Preguntas totales
 * - Escala Likert 1-5
 * - Ponderación por importancia
 */

export const LEADERSHIP_CATEGORIES = {
  VISION: {
    id: 'vision',
    name: 'Visión Estratégica',
    description: 'Capacidad para definir y comunicar una dirección clara',
    icon: '🎯',
    color: '#4A90E2'
  },
  COMMUNICATION: {
    id: 'communication',
    name: 'Comunicación',
    description: 'Habilidad para transmitir ideas de forma efectiva',
    icon: '💬',
    color: '#50C878'
  },
  DECISION_MAKING: {
    id: 'decision_making',
    name: 'Toma de Decisiones',
    description: 'Capacidad para tomar decisiones efectivas bajo presión',
    icon: '⚖️',
    color: '#F5A623'
  },
  TEAM_BUILDING: {
    id: 'team_building',
    name: 'Construcción de Equipos',
    description: 'Habilidad para formar y desarrollar equipos de alto rendimiento',
    icon: '👥',
    color: '#9013FE'
  },
  ADAPTABILITY: {
    id: 'adaptability',
    name: 'Adaptabilidad',
    description: 'Flexibilidad ante el cambio y situaciones imprevistas',
    icon: '🔄',
    color: '#ED5A6B'
  },
  EMOTIONAL_INTELLIGENCE: {
    id: 'emotional_intelligence',
    name: 'Inteligencia Emocional',
    description: 'Capacidad para entender y gestionar emociones propias y ajenas',
    icon: '❤️',
    color: '#FF6B9D'
  },
  ACCOUNTABILITY: {
    id: 'accountability',
    name: 'Responsabilidad',
    description: 'Compromiso con los resultados y asunción de responsabilidades',
    icon: '✓',
    color: '#417505'
  },
  INNOVATION: {
    id: 'innovation',
    name: 'Innovación',
    description: 'Capacidad para generar ideas nuevas y fomentar la creatividad',
    icon: '💡',
    color: '#FFD700'
  }
};

/**
 * Banco de Preguntas Organizado por Categoría
 * 
 * Cada pregunta incluye:
 * - id: Identificador único
 * - category: Categoría a la que pertenece
 * - text: Texto de la pregunta
 * - type: Tipo de respuesta (likert, multiple_choice, text)
 * - weight: Peso en el cálculo final (1-3)
 * - reverse: Si la pregunta se puntúa inversamente
 */
export const QUESTION_BANK = [
  // ===== VISIÓN ESTRATÉGICA (7 preguntas) =====
  {
    id: 'v1',
    category: 'vision',
    text: '¿Con qué claridad comunico la visión y objetivos del equipo/organización?',
    type: 'likert',
    weight: 3,
    reverse: false
  },
  {
    id: 'v2',
    category: 'vision',
    text: '¿Qué tan efectivo soy al alinear las acciones del equipo con los objetivos estratégicos?',
    type: 'likert',
    weight: 3,
    reverse: false
  },
  {
    id: 'v3',
    category: 'vision',
    text: '¿Cómo evalúo mi capacidad para anticipar tendencias y preparar al equipo para el futuro?',
    type: 'likert',
    weight: 2,
    reverse: false
  },
  {
    id: 'v4',
    category: 'vision',
    text: '¿Con qué frecuencia reviso y ajusto la dirección estratégica según sea necesario?',
    type: 'likert',
    weight: 2,
    reverse: false
  },
  {
    id: 'v5',
    category: 'vision',
    text: '¿Qué tan bien inspiro a otros a comprometerse con la visión compartida?',
    type: 'likert',
    weight: 3,
    reverse: false
  },
  {
    id: 'v6',
    category: 'vision',
    text: '¿Cómo calificaría mi habilidad para traducir la visión en planes de acción concretos?',
    type: 'likert',
    weight: 2,
    reverse: false
  },
  {
    id: 'v7',
    category: 'vision',
    text: '¿Qué tan efectivo soy al priorizar iniciativas que se alinean con la visión?',
    type: 'likert',
    weight: 2,
    reverse: false
  },

  // ===== COMUNICACIÓN (7 preguntas) =====
  {
    id: 'c1',
    category: 'communication',
    text: '¿Con qué claridad expreso mis ideas y expectativas?',
    type: 'likert',
    weight: 3,
    reverse: false
  },
  {
    id: 'c2',
    category: 'communication',
    text: '¿Qué tan bien escucho y considero las opiniones de los demás?',
    type: 'likert',
    weight: 3,
    reverse: false
  },
  {
    id: 'c3',
    category: 'communication',
    text: '¿Cómo manejo las conversaciones difíciles o los conflictos?',
    type: 'likert',
    weight: 3,
    reverse: false
  },
  {
    id: 'c4',
    category: 'communication',
    text: '¿Con qué efectividad adapto mi estilo de comunicación a diferentes audiencias?',
    type: 'likert',
    weight: 2,
    reverse: false
  },
  {
    id: 'c5',
    category: 'communication',
    text: '¿Qué tan transparente soy al compartir información relevante con el equipo?',
    type: 'likert',
    weight: 3,
    reverse: false
  },
  {
    id: 'c6',
    category: 'communication',
    text: '¿Cómo proporciono feedback constructivo y oportuno?',
    type: 'likert',
    weight: 3,
    reverse: false
  },
  {
    id: 'c7',
    category: 'communication',
    text: '¿Con qué frecuencia verifico que mi mensaje haya sido comprendido correctamente?',
    type: 'likert',
    weight: 2,
    reverse: false
  },

  // ===== TOMA DE DECISIONES (7 preguntas) =====
  {
    id: 'd1',
    category: 'decision_making',
    text: '¿Qué tan efectivo soy al analizar información antes de tomar decisiones importantes?',
    type: 'likert',
    weight: 3,
    reverse: false
  },
  {
    id: 'd2',
    category: 'decision_making',
    text: '¿Cómo manejo la toma de decisiones bajo presión o con información incompleta?',
    type: 'likert',
    weight: 3,
    reverse: false
  },
  {
    id: 'd3',
    category: 'decision_making',
    text: '¿Con qué frecuencia involucro al equipo en decisiones que les afectan?',
    type: 'likert',
    weight: 2,
    reverse: false
  },
  {
    id: 'd4',
    category: 'decision_making',
    text: '¿Qué tan confiado me siento al tomar decisiones difíciles o impopulares cuando es necesario?',
    type: 'likert',
    weight: 3,
    reverse: false
  },
  {
    id: 'd5',
    category: 'decision_making',
    text: '¿Cómo evalúo las consecuencias a largo plazo de mis decisiones?',
    type: 'likert',
    weight: 2,
    reverse: false
  },
  {
    id: 'd6',
    category: 'decision_making',
    text: '¿Con qué efectividad aprendo de decisiones pasadas para mejorar futuras?',
    type: 'likert',
    weight: 2,
    reverse: false
  },
  {
    id: 'd7',
    category: 'decision_making',
    text: '¿Qué tan bien equilibro la velocidad con la calidad al tomar decisiones?',
    type: 'likert',
    weight: 2,
    reverse: false
  },

  // ===== CONSTRUCCIÓN DE EQUIPOS (7 preguntas) =====
  {
    id: 't1',
    category: 'team_building',
    text: '¿Qué tan efectivo soy al identificar y desarrollar el talento en mi equipo?',
    type: 'likert',
    weight: 3,
    reverse: false
  },
  {
    id: 't2',
    category: 'team_building',
    text: '¿Cómo fomento la colaboración y el trabajo en equipo?',
    type: 'likert',
    weight: 3,
    reverse: false
  },
  {
    id: 't3',
    category: 'team_building',
    text: '¿Con qué claridad defino roles y responsabilidades dentro del equipo?',
    type: 'likert',
    weight: 2,
    reverse: false
  },
  {
    id: 't4',
    category: 'team_building',
    text: '¿Qué tan bien reconozco y celebro los logros del equipo?',
    type: 'likert',
    weight: 2,
    reverse: false
  },
  {
    id: 't5',
    category: 'team_building',
    text: '¿Cómo manejo el bajo rendimiento o los conflictos dentro del equipo?',
    type: 'likert',
    weight: 3,
    reverse: false
  },
  {
    id: 't6',
    category: 'team_building',
    text: '¿Con qué efectividad delego tareas y empodera a los miembros del equipo?',
    type: 'likert',
    weight: 3,
    reverse: false
  },
  {
    id: 't7',
    category: 'team_building',
    text: '¿Qué tan bien creo un ambiente de confianza y seguridad psicológica?',
    type: 'likert',
    weight: 3,
    reverse: false
  },

  // ===== ADAPTABILIDAD (6 preguntas) =====
  {
    id: 'a1',
    category: 'adaptability',
    text: '¿Qué tan cómodo me siento con el cambio y la ambigüedad?',
    type: 'likert',
    weight: 3,
    reverse: false
  },
  {
    id: 'a2',
    category: 'adaptability',
    text: '¿Cómo respondo cuando los planes no salen como esperaba?',
    type: 'likert',
    weight: 3,
    reverse: false
  },
  {
    id: 'a3',
    category: 'adaptability',
    text: '¿Con qué facilidad ajusto mi enfoque basándome en nueva información?',
    type: 'likert',
    weight: 2,
    reverse: false
  },
  {
    id: 'a4',
    category: 'adaptability',
    text: '¿Qué tan efectivo soy al ayudar al equipo a navegar a través de cambios?',
    type: 'likert',
    weight: 3,
    reverse: false
  },
  {
    id: 'a5',
    category: 'adaptability',
    text: '¿Cómo manejo la presión de múltiples prioridades cambiantes?',
    type: 'likert',
    weight: 2,
    reverse: false
  },
  {
    id: 'a6',
    category: 'adaptability',
    text: '¿Con qué apertura acepto y experimento con nuevas formas de trabajar?',
    type: 'likert',
    weight: 2,
    reverse: false
  },

  // ===== INTELIGENCIA EMOCIONAL (7 preguntas) =====
  {
    id: 'e1',
    category: 'emotional_intelligence',
    text: '¿Qué tan consciente soy de mis propias emociones y cómo me afectan?',
    type: 'likert',
    weight: 3,
    reverse: false
  },
  {
    id: 'e2',
    category: 'emotional_intelligence',
    text: '¿Cómo manejo mis emociones en situaciones estresantes o desafiantes?',
    type: 'likert',
    weight: 3,
    reverse: false
  },
  {
    id: 'e3',
    category: 'emotional_intelligence',
    text: '¿Con qué efectividad reconozco y comprendo las emociones de los demás?',
    type: 'likert',
    weight: 3,
    reverse: false
  },
  {
    id: 'e4',
    category: 'emotional_intelligence',
    text: '¿Qué tan bien ajusto mi comportamiento según el estado emocional de otros?',
    type: 'likert',
    weight: 2,
    reverse: false
  },
  {
    id: 'e5',
    category: 'emotional_intelligence',
    text: '¿Cómo demuestro empatía hacia los desafíos y preocupaciones del equipo?',
    type: 'likert',
    weight: 3,
    reverse: false
  },
  {
    id: 'e6',
    category: 'emotional_intelligence',
    text: '¿Con qué frecuencia mantengo una actitud positiva ante la adversidad?',
    type: 'likert',
    weight: 2,
    reverse: false
  },
  {
    id: 'e7',
    category: 'emotional_intelligence',
    text: '¿Qué tan efectivo soy al construir relaciones significativas con el equipo?',
    type: 'likert',
    weight: 3,
    reverse: false
  },

  // ===== RESPONSABILIDAD (6 preguntas) =====
  {
    id: 'r1',
    category: 'accountability',
    text: '¿Con qué consistencia cumplo con mis compromisos y plazos?',
    type: 'likert',
    weight: 3,
    reverse: false
  },
  {
    id: 'r2',
    category: 'accountability',
    text: '¿Qué tan cómodo me siento asumiendo la responsabilidad cuando las cosas salen mal?',
    type: 'likert',
    weight: 3,
    reverse: false
  },
  {
    id: 'r3',
    category: 'accountability',
    text: '¿Cómo establezco y mantengo estándares altos de calidad?',
    type: 'likert',
    weight: 2,
    reverse: false
  },
  {
    id: 'r4',
    category: 'accountability',
    text: '¿Con qué efectividad responsabilizo a los demás de manera justa y constructiva?',
    type: 'likert',
    weight: 3,
    reverse: false
  },
  {
    id: 'r5',
    category: 'accountability',
    text: '¿Qué tan bien hago seguimiento a los compromisos del equipo?',
    type: 'likert',
    weight: 2,
    reverse: false
  },
  {
    id: 'r6',
    category: 'accountability',
    text: '¿Cómo demuestro integridad en mis acciones y decisiones?',
    type: 'likert',
    weight: 3,
    reverse: false
  },

  // ===== INNOVACIÓN (6 preguntas) =====
  {
    id: 'i1',
    category: 'innovation',
    text: '¿Qué tan abierto estoy a considerar nuevas ideas y enfoques?',
    type: 'likert',
    weight: 2,
    reverse: false
  },
  {
    id: 'i2',
    category: 'innovation',
    text: '¿Cómo fomento la creatividad y el pensamiento innovador en el equipo?',
    type: 'likert',
    weight: 3,
    reverse: false
  },
  {
    id: 'i3',
    category: 'innovation',
    text: '¿Con qué frecuencia cuestiono el status quo y busco mejoras?',
    type: 'likert',
    weight: 2,
    reverse: false
  },
  {
    id: 'i4',
    category: 'innovation',
    text: '¿Qué tan efectivo soy al implementar y escalar soluciones innovadoras?',
    type: 'likert',
    weight: 3,
    reverse: false
  },
  {
    id: 'i5',
    category: 'innovation',
    text: '¿Cómo manejo los errores y los veo como oportunidades de aprendizaje?',
    type: 'likert',
    weight: 2,
    reverse: false
  },
  {
    id: 'i6',
    category: 'innovation',
    text: '¿Con qué claridad comunico y promuevo una cultura de experimentación?',
    type: 'likert',
    weight: 2,
    reverse: false
  }
];

/**
 * Opciones de respuesta para escala Likert
 */
export const LIKERT_SCALE = [
  { value: 1, label: 'Muy Bajo', description: 'Necesito desarrollo significativo en esta área' },
  { value: 2, label: 'Bajo', description: 'Tengo margen de mejora considerable' },
  { value: 3, label: 'Moderado', description: 'Competente, con áreas de oportunidad' },
  { value: 4, label: 'Alto', description: 'Desempeño sólido y consistente' },
  { value: 5, label: 'Muy Alto', description: 'Excelencia y modelo a seguir' }
];

/**
 * Obtener preguntas por categoría
 */
export const getQuestionsByCategory = (categoryId) => {
  return QUESTION_BANK.filter(q => q.category === categoryId);
};

/**
 * Obtener estadísticas del banco de preguntas
 */
export const getQuestionBankStats = () => {
  const stats = {
    total: QUESTION_BANK.length,
    byCategory: {}
  };

  Object.keys(LEADERSHIP_CATEGORIES).forEach(key => {
    const categoryId = LEADERSHIP_CATEGORIES[key].id;
    stats.byCategory[categoryId] = getQuestionsByCategory(categoryId).length;
  });

  return stats;
};

/**
 * Validar que todas las preguntas tengan categorías válidas
 */
export const validateQuestionBank = () => {
  const validCategories = Object.keys(LEADERSHIP_CATEGORIES).map(
    key => LEADERSHIP_CATEGORIES[key].id
  );
  
  const invalidQuestions = QUESTION_BANK.filter(
    q => !validCategories.includes(q.category)
  );

  if (invalidQuestions.length > 0) {
    console.error('Questions with invalid categories:', invalidQuestions);
    return false;
  }

  return true;
};

export default {
  LEADERSHIP_CATEGORIES,
  QUESTION_BANK,
  LIKERT_SCALE,
  getQuestionsByCategory,
  getQuestionBankStats,
  validateQuestionBank
};

