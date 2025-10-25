import { Component, ErrorInfo, ReactNode } from 'react';
import { errorHandlingService, ErrorDetails, ErrorRecoveryAction } from '../services/errorHandlingService';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  errorDetails: ErrorDetails | null;
  recoveryActions: ErrorRecoveryAction[];
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      errorDetails: null,
      recoveryActions: []
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Process the error through our error handling service
    const errorDetails = errorHandlingService.processError(error, {
      component: 'ErrorBoundary',
      type: 'react-error-boundary'
    });

    const recoveryActions = errorHandlingService.getRecoveryActions(errorDetails);

    return {
      hasError: true,
      errorDetails,
      recoveryActions
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log additional error info
    errorHandlingService.processError(error, {
      ...errorInfo,
      component: 'ErrorBoundary',
      type: 'react-error-boundary'
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      errorDetails: null,
      recoveryActions: []
    });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
          <div className="sm:mx-auto sm:w-full sm:max-w-md">
            <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
              <div className="text-center">
                <div className="text-6xl mb-4">😵</div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Oops! Something went wrong
                </h2>
                
                {this.state.errorDetails && (
                  <div className="mb-6">
                    <p className="text-gray-600 mb-4">
                      {this.state.errorDetails.userMessage}
                    </p>
                    
                    {import.meta.env.DEV && (
                      <details className="text-left bg-gray-100 p-4 rounded mb-4">
                        <summary className="cursor-pointer font-medium text-gray-700 mb-2">
                          Technical Details
                        </summary>
                        <div className="text-sm text-gray-600 space-y-2">
                          <div><strong>Code:</strong> {this.state.errorDetails.code}</div>
                          <div><strong>Message:</strong> {this.state.errorDetails.message}</div>
                          <div><strong>Severity:</strong> {this.state.errorDetails.severity}</div>
                          <div><strong>Category:</strong> {this.state.errorDetails.category}</div>
                          <div><strong>Time:</strong> {new Date(this.state.errorDetails.timestamp).toLocaleString()}</div>
                          {this.state.errorDetails.stack && (
                            <div>
                              <strong>Stack:</strong>
                              <pre className="mt-1 text-xs bg-gray-200 p-2 rounded overflow-auto">
                                {this.state.errorDetails.stack}
                              </pre>
                            </div>
                          )}
                        </div>
                      </details>
                    )}
                  </div>
                )}

                <div className="space-y-3">
                  {this.state.recoveryActions.map((action, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        if (action.type === 'retry') {
                          this.handleRetry();
                        } else {
                          action.action();
                        }
                      }}
                      className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                        action.type === 'retry'
                          ? 'bg-blue-600 hover:bg-blue-700'
                          : action.type === 'logout'
                          ? 'bg-red-600 hover:bg-red-700'
                          : 'bg-gray-600 hover:bg-gray-700'
                      } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                    >
                      {action.label}
                    </button>
                  ))}
                  
                  {this.state.recoveryActions.length === 0 && (
                    <button
                      onClick={this.handleRetry}
                      className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Try Again
                    </button>
                  )}
                </div>

                <div className="mt-6 text-sm text-gray-500">
                  <p>
                    If this problem persists, please{' '}
                    <a href="/support" className="text-blue-600 hover:text-blue-500">
                      contact support
                    </a>
                    .
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;