import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Link } from 'react-router-dom';

type Props = {
  children: ReactNode;
  fallback?: ReactNode;
};

type State = {
  hasError: boolean;
  error: Error | null;
};

export class ErrorBoundary extends Component<Props, State> {
  public override state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    if (import.meta.env?.DEV) {
      console.error('ErrorBoundary capturó un error:', error, errorInfo);
    }
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public override render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <main className="app-shell flex items-center justify-center min-h-[60vh] p-6">
          <section className="card narrow text-center p-8 bg-white border border-red-200 rounded-2xl shadow-lg" role="alert">
            <div className="text-4xl mb-3" aria-hidden="true">
              🛡️
            </div>
            <p className="eyebrow text-red-600">Error en la aplicación</p>
            <h2 className="text-2xl font-bold text-slate-900 mt-2">
              Ha ocurrido un problema inesperado
            </h2>
            <p className="text-slate-600 mt-3 text-sm">
              El componente no pudo cargarse correctamente. No te preocupes, puedes reintentar la operación o volver a la pantalla principal.
            </p>

            {this.state.error && (
              <pre className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-left text-red-800 overflow-x-auto max-h-32">
                {this.state.error.message}
              </pre>
            )}

            <div className="flex justify-center gap-3 mt-6">
              <button
                type="button"
                onClick={this.handleReset}
                className="secondary-button"
              >
                🔄 Reintentar
              </button>
              <Link to="/inicio" className="primary-button" onClick={this.handleReset}>
                Ir al inicio
              </Link>
            </div>
          </section>
        </main>
      );
    }

    return this.props.children;
  }
}
