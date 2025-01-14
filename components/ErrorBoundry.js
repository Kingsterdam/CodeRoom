import React from 'react';
import { AlertCircle, RefreshCcw, ChevronDown, ChevronUp } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      isExpanded: false
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleRefresh = () => {
    window.location.reload();
  };

  toggleDetails = () => {
    this.setState(prevState => ({
      isExpanded: !prevState.isExpanded
    }));
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div className="min-h-[200px] p-6 mx-auto max-w-2xl my-8 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
        <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
          <AlertCircle className="w-6 h-6" />
          <h2 className="text-lg font-semibold">Oops! Something went wrong</h2>
        </div>

        <p className="mt-3 text-gray-600 dark:text-gray-300">
          Don't worry - it's not your fault. Our team has been notified and we're looking into it.
        </p>

        <div className="mt-4 flex gap-4">
          <button
            onClick={this.handleRefresh}
            className="flex items-center gap-2 px-4 py-2 text-sm rounded-md bg-red-100 dark:bg-red-800 text-red-600 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-700 transition-colors"
          >
            <RefreshCcw className="w-4 h-4" />
            Try Again
          </button>

          <button
            onClick={this.toggleDetails}
            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
          >
            {this.state.isExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
            {this.state.isExpanded ? 'Hide' : 'Show'} Details
          </button>
        </div>

        {this.state.isExpanded && (
          <div className="mt-4 p-4 rounded-md bg-red-100/50 dark:bg-red-900/30 font-mono text-sm">
            <div className="text-red-700 dark:text-red-300">
              {this.state.error && this.state.error.toString()}
            </div>
            {this.state.errorInfo && (
              <div className="mt-2 text-gray-600 dark:text-gray-400 text-xs overflow-auto max-h-[200px]">
                {this.state.errorInfo.componentStack}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }
}

export default ErrorBoundary;