/**
 * Error Boundary para el Campaign Wizard
 * Captura errores de renderizado y muestra un mensaje amigable
 */

import React from 'react';

class WizardErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[WizardErrorBoundary] Error capturado:', error);
    console.error('[WizardErrorBoundary] Error info:', errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="wizard-alert wizard-alert-error" style={{ margin: '20px', padding: '20px' }}>
          <h3 style={{ marginTop: 0 }}>Error al cargar el paso</h3>
          <p>Hubo un problema al cargar este paso del wizard. Por favor, intenta nuevamente.</p>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null });
              if (this.props.onReset) {
                this.props.onReset();
              }
            }}
            className="wizard-btn wizard-btn-primary"
            style={{ marginTop: '12px' }}
          >
            Reintentar
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default WizardErrorBoundary;




