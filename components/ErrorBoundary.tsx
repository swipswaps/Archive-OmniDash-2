import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full bg-gray-900 rounded-2xl border border-gray-800 shadow-2xl p-8">
            {/* Error Icon */}
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 rounded-full bg-red-500/10 border-2 border-red-500/30 flex items-center justify-center">
                <AlertTriangle className="w-10 h-10 text-red-500" />
              </div>
            </div>

            {/* Error Title */}
            <h1 className="text-2xl font-bold text-white text-center mb-3">
              Oops! Something went wrong
            </h1>

            {/* Error Description */}
            <p className="text-gray-400 text-center mb-6">
              The application encountered an unexpected error. This has been logged and we'll look into it.
            </p>

            {/* Error Details (Collapsible) */}
            <details className="mb-6 bg-gray-950 rounded-lg border border-gray-800 overflow-hidden">
              <summary className="px-4 py-3 cursor-pointer text-sm font-medium text-gray-300 hover:bg-gray-800 transition-colors select-none">
                View Error Details
              </summary>
              <div className="px-4 py-3 border-t border-gray-800">
                <div className="mb-3">
                  <div className="text-xs font-semibold text-gray-500 uppercase mb-1">Error Message</div>
                  <div className="text-sm text-red-400 font-mono bg-gray-900 p-3 rounded border border-gray-800">
                    {this.state.error?.toString()}
                  </div>
                </div>
                {this.state.errorInfo && (
                  <div>
                    <div className="text-xs font-semibold text-gray-500 uppercase mb-1">Stack Trace</div>
                    <pre className="text-xs text-gray-400 font-mono bg-gray-900 p-3 rounded border border-gray-800 overflow-auto max-h-64">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </div>
                )}
              </div>
            </details>

            {/* Action Buttons */}
            <div className="flex gap-3 justify-center">
              <button
                onClick={this.handleReset}
                className="px-6 py-3 bg-teal-500 hover:bg-teal-600 text-white font-medium rounded-lg transition-colors flex items-center gap-2 shadow-lg shadow-teal-500/20"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </button>
              <button
                onClick={this.handleGoHome}
                className="px-6 py-3 bg-gray-800 hover:bg-gray-700 text-gray-200 font-medium rounded-lg transition-colors flex items-center gap-2 border border-gray-700"
              >
                <Home className="w-4 h-4" />
                Go Home
              </button>
            </div>

            {/* Help Text */}
            <p className="text-xs text-gray-600 text-center mt-6">
              If this problem persists, please try refreshing the page or clearing your browser cache.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
