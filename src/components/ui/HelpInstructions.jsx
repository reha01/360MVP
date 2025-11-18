/**
 * HelpInstructions - Componente reutilizable para mostrar instrucciones
 * 
 * Características:
 * - Botón minimalista de ayuda (ampolleta/pregunta) flotante
 * - Instrucciones colapsables que aparecen en el flujo del documento
 * - Estilo consistente con el diseño del sistema
 * - Reutilizable en cualquier página
 * 
 * Uso:
 * <HelpInstructions title="Título opcional">
 *   <p>Contenido de las instrucciones...</p>
 * </HelpInstructions>
 */

import React, { useState } from 'react';
import './HelpInstructions.css';

const HelpInstructions = ({ title = '📖 ¿Cómo usar esta pantalla?', children }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Botón de ayuda minimalista flotante */}
      <button
        className={`help-button ${isOpen ? 'help-button-active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        title={isOpen ? "Ocultar instrucciones" : "Mostrar instrucciones"}
        aria-label="Mostrar/ocultar instrucciones"
        aria-expanded={isOpen}
      >
        <span className="help-icon">{isOpen ? '✕' : '💡'}</span>
      </button>

      {/* Panel de instrucciones - aparece en el flujo del documento */}
      {isOpen && (
        <div className="instructions-panel">
          <div className="instructions-header">
            <h3>{title}</h3>
            <button 
              className="btn-close-instructions"
              onClick={() => setIsOpen(false)}
              title="Cerrar instrucciones"
              aria-label="Cerrar instrucciones"
            >
              ✕
            </button>
          </div>
          <div className="instructions-content">
            {children}
          </div>
        </div>
      )}
    </>
  );
};

export default HelpInstructions;

