import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error de render capturado por ErrorBoundary:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-100 px-4 py-10 text-slate-900 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl rounded-3xl border border-rose-200 bg-white p-8 shadow-panel">
            <h1 className="text-2xl font-bold">La aplicación ha recuperado un error de interfaz</h1>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              Puedes recargar la página o pulsar el botón para volver a intentar el render. La app está preparada para evitar pantallas en blanco incluso si se produce un fallo inesperado.
            </p>
            <button
              type="button"
              onClick={this.handleReset}
              className="mt-5 inline-flex items-center justify-center rounded-2xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-600/20 transition hover:bg-brand-700"
            >
              Reintentar
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
);
