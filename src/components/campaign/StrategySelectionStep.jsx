/**
 * Paso 2: Estrategia de Evaluación
 * Selección del tipo de evaluación mediante tarjetas visuales
 */

import React from 'react';
import './StrategySelectionStep.css';

// Configuraciones de estrategia
const STRATEGIES = {
  SELF_ONLY: {
    id: 'SELF_ONLY',
    title: 'Autoevaluación',
    icon: '👤',
    description: 'Solo el colaborador se auto evalúa (Self).',
    evaluatorRules: {
      self: true,
      manager: false,
      peers: false,
      subordinates: false,
      external: false
    }
  },
  TEAM_EVALUATION: {
    id: 'TEAM_EVALUATION',
    title: 'Evaluación de Equipo',
    icon: '📉',
    description: 'El colaborador se evalúa (Self) + Evalúa a su equipo (Subordinados).',
    evaluatorRules: {
      self: true,
      manager: false,
      peers: false,
      subordinates: true,
      external: false
    }
  },
  LEADERSHIP_180: {
    id: 'LEADERSHIP_180',
    title: '180° (Liderazgo)',
    icon: '👥',
    description: 'El colaborador (Self) + Evalúa a su equipo (Subordinados) + Evalúa a Su Jefe (Manager).',
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
    title: '360° (Integral)',
    icon: '🌍',
    description: 'Todo lo anterior + Evalúa a sus Pares (Peers).',
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
            <h4 className="strategy-title">{strategy.title}</h4>
            <p className="strategy-description">{strategy.description}</p>

            {/* Visual indicator of active evaluators */}
            <div className="strategy-evaluators">
              <div className="evaluator-tags">
                {strategy.evaluatorRules.self && <span className="tag">Auto</span>}
                {strategy.evaluatorRules.manager && <span className="tag">Jefe</span>}
                {strategy.evaluatorRules.peers && <span className="tag">Pares</span>}
                {strategy.evaluatorRules.subordinates && <span className="tag">Reportes</span>}
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
