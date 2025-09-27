/**
 * ChordProSplitViewWithErrorBoundary Component
 *
 * Wraps ChordProSplitView with error boundary for graceful error handling
 * Provides fallback UI when errors occur in editor or viewer
 */

import { Component } from 'react';
import { ChordProSplitView } from './ChordProSplitView';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';
import logger from '@/lib/logger';

/**
 * Error boundary class component
 */
class ChordProErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0
    };
  }

  static getDerivedStateFromError() {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details
    logger.error('ChordProSplitView Error:', error, errorInfo);

    // Update state with error details
    this.setState({
      error,
      errorInfo
    });

    // Report to error tracking service if available
    // window.reportError?.(error, errorInfo);
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: this.state.retryCount + 1
    });
  };

  render() {
    if (this.state.hasError) {
      // Fallback UI when error occurs
      return (
        <Card className="w-full h-full flex items-center justify-center">
          <CardContent className="text-center space-y-4 p-8">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto" />

            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Something went wrong</h3>
              <p className="text-sm text-muted-foreground">
                The ChordPro editor encountered an error.
              </p>
            </div>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="text-left">
                <summary className="cursor-pointer text-sm font-medium">
                  Error details
                </summary>
                <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-auto max-h-40">
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}

            <div className="flex gap-2 justify-center">
              <Button
                onClick={this.handleReset}
                variant="default"
                className="gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Try Again
              </Button>

              <Button
                onClick={() => window.location.reload()}
                variant="outline"
              >
                Refresh Page
              </Button>
            </div>

            {this.state.retryCount > 2 && (
              <p className="text-xs text-muted-foreground">
                If the problem persists, please try refreshing the page or contact support.
              </p>
            )}
          </CardContent>
        </Card>
      );
    }

    // Normal render - pass through all props
    return <ChordProSplitView {...this.props} />;
  }
}

// Export with error boundary
export default ChordProErrorBoundary;

// Also export the raw component for testing
export { ChordProSplitView };