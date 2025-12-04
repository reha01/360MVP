/**
 * Paso 2: Estrategia de Evaluación
 * Selección del tipo de evaluación mediante tarjetas visuales
 */

import React from 'react';
import './StrategySelectionStep.css';

// Configuraciones de estrategia (5 Tipos) - Con Rich Tooltips
const STRATEGIES = {
  SELF_ONLY: {
    id: 'SELF_ONLY',
    title: 'Autoevaluación',
    subtitle: '',
    icon: '👤',
    shortDescription: 'Reflexión personal simple.',
    color: 'bg-gray-50',
    tags: {
      incoming: [],
      outgoing: ['Auto']
    },
    tooltip: {
      target: 'Todos los colaboradores.',
      objective: 'Fomentar la introspección antes de recibir feedback externo.',
      usage: 'Ideal para check-ins mensuales o pre-reuniones 1 a 1.'
    },
    evaluatorRules: {
      self: true,
      manager: false,
      peers: false,
      subordinates: false,
      external: false
    }
  },
  TOP_DOWN: {
    id: 'TOP_DOWN',
    title: 'Desempeño',
    subtitle: '(Top-Down)',
    icon: '📊',
    shortDescription: 'Evaluación clásica Jefe a Subordinado.',
    color: 'bg-blue-50',
    tags: {
      incoming: ['Jefe'],
      outgoing: ['Auto', 'Equipo*']
    },
    tooltip: {
      target: 'Cargos Operativos y Asistentes.',
      objective: 'Medir cumplimiento de KPIs y competencias desde la autoridad.',
      usage: 'Cálculo de bonos, aumentos y feedback formal anual.'
    },
    evaluatorRules: {
      self: true,
      manager: true,
      peers: false,
      subordinates: true,
      external: false
    }
  },
  PEER_TO_PEER: {
    id: 'PEER_TO_PEER',
    title: 'Peer-to-Peer',
    subtitle: '',
    icon: '🤝',
    shortDescription: 'Colaboración entre colegas (Squads).',
    color: 'bg-purple-50',
    tags: {
      incoming: ['Pares'],
      outgoing: ['Auto', 'Pares']
    },
    tooltip: {
      target: 'Equipos Ágiles y Cultura Horizontal.',
      objective: 'Medir servicio, compañerismo y trabajo en equipo.',
      usage: 'Cuando el jefe no ve el trabajo diario (ej. Desarrolladores).'
    },
    evaluatorRules: {
      self: true,
      manager: false,
      peers: true,
      subordinates: false,
      external: false
    }
  },
  LEADERSHIP_180: {
    id: 'LEADERSHIP_180',
    title: '180º Liderazgo',
    subtitle: '',
    icon: '👥',
    shortDescription: 'Líderes evalúan líderes.',
    color: 'bg-orange-50',
    tags: {
      incoming: ['Jefe', 'Equipo'],
      outgoing: ['Auto']
    },
    tooltip: {
      target: 'Solo Jefaturas con gente a cargo.',
      objective: 'Medir calidad del liderazgo y clima del equipo.',
      usage: 'Detectar líderes tóxicos o validar a nuevos gerentes.'
    },
    evaluatorRules: {
      self: true,
      manager: true,
      peers: false,
      subordinates: true,
      external: false
    }
  },
  FULL_360: {
    id: 'FULL_360',
    title: '360º Integral',
    subtitle: '',
    icon: '🌍',
    shortDescription: 'Visión total: 360 grados.',
    color: 'bg-green-50',
    tags: {
      incoming: ['Jefe', 'Equipo', 'Pares'],
      outgoing: ['Auto', 'Jefe', 'Equipo', 'Pares']
    },
    tooltip: {
      target: 'Gerentes, Directores y Talento Clave.',
      objective: 'Radiografía completa (Estratégica + Humana).',
      usage: 'Planes de sucesión y desarrollo de alto potencial.'
    },
    evaluatorRules: {
      self: true,
      manager: true,
      peers: true,
      subordinates: true,
      external: false
    }
  }
};

const StrategySelectionStep = ({ selectedStrategy, onChange }) => {
  const handleStrategySelect = (strategyId) => {
    const strategy = STRATEGIES[strategyId];
    onChange({
      selectedStrategy: strategyId,
      evaluatorRules: strategy.evaluatorRules
    });
  };

  return (
    <div className="strategy-selection-step">
      <div className="strategy-header">
        <h3>¿Qué tipo de evaluación deseas crear?</h3>
        <p className="strategy-subtitle">
          Selecciona la estrategia que mejor se adapte a tus objetivos de desarrollo
        </p>
      </div>

      <div className="strategy-cards-grid">
        {Object.values(STRATEGIES).map((strategy) => (
          <div
            key={strategy.id}
            className={`strategy-card ${selectedStrategy === strategy.id ? 'selected' : ''}`}
            onClick={() => handleStrategySelect(strategy.id)}
          >
            <div className="strategy-icon">{strategy.icon}</div>
            <h4 className="strategy-title">
              {strategy.title}
              {strategy.subtitle && <span className="strategy-subtitle"> {strategy.subtitle}</span>}
            </h4>
            <p className="strategy-description">{strategy.shortDescription}</p>

            {/* Rich Tooltip - Visible on Hover */}
            <div className="strategy-tooltip">
              <div className="tooltip-section">
                <strong>🎯 Target:</strong> {strategy.tooltip.target}
              </div>
              <div className="tooltip-section">
                <strong>💡 Objetivo:</strong> {strategy.tooltip.objective}
              </div>
              <div className="tooltip-section">
                <strong>📋 Uso:</strong> {strategy.tooltip.usage}
              </div>
            </div>

            {/* Input/Output Sections - Critical UX Improvement */}
            <div className="strategy-evaluators">
              {/* Incoming Section */}
              <div className="tags-section">
                <div className="tags-label">📥 Recibe de:</div>
                <div className="evaluator-tags">
                  {strategy.tags.incoming.map((tag, index) => (
                    <span key={index} className="tag tag-incoming">{tag}</span>
                  ))}
                </div>
              </div>

              {/* Divider */}
              <div className="tags-divider"></div>

              {/* Outgoing Section */}
              <div className="tags-section">
                <div className="tags-label">📤 Evalúa a:</div>
                <div className="evaluator-tags">
                  {strategy.tags.outgoing.map((tag, index) => (
                    <span
                      key={index}
                      className="tag tag-outgoing"
                      title={tag.includes('*') ? 'Si tiene equipo a cargo' : ''}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {selectedStrategy === strategy.id && (
              <div className="strategy-selected-badge">✓ Seleccionado</div>
            )}
          </div>
        ))}
      </div>

      {selectedStrategy && (
        <div className="strategy-selection-summary">
          <p>
            <strong>Estrategia seleccionada:</strong> {STRATEGIES[selectedStrategy].title}
          </p>
        </div>
      )}
    </div>
  );
};

export default StrategySelectionStep;
export { STRATEGIES };
