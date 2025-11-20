import React, { ReactNode, ErrorInfo } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AlertTriangle, RefreshCw, Trash2 } from 'lucide-react';

interface ErrorBoundaryProps {
  children?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

// Error Boundary Component to catch crashes and prevent White Screen of Death
class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  handleReset = () => {
    // Clear all storage to recover from corrupted state
    localStorage.clear();
    
    // Try to delete the DB if it exists (Advanced recovery)
    const DB_NAME = 'FinancePro360_EnterpriseDB';
    const req = indexedDB.deleteDatabase(DB_NAME);
    req.onsuccess = () => {
      window.location.reload();
    };
    req.onerror = () => {
      window.location.reload();
    };
    req.onblocked = () => {
      window.location.reload();
    };
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 font-sans">
          <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-lg border border-slate-200 text-center">
            <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle size={32} />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Ops! Algo deu errado.</h2>
            <p className="text-slate-500 mb-6">
              O aplicativo encontrou um erro inesperado. Isso geralmente acontece devido a uma falha de conexão ou dados antigos incompatíveis.
            </p>
            
            <div className="bg-slate-50 p-4 rounded-lg mb-6 text-left overflow-auto max-h-32">
                <p className="text-xs font-mono text-rose-500 break-all">
                    {this.state.error?.message || "Erro desconhecido"}
                </p>
            </div>

            <button
              onClick={() => window.location.reload()}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2 mb-3"
            >
              <RefreshCw size={18} />
              Tentar Novamente
            </button>

            <button
              onClick={this.handleReset}
              className="w-full bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <Trash2 size={18} />
              Resetar Dados (Recuperação)
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
        <App />
    </ErrorBoundary>
  </React.StrictMode>
);