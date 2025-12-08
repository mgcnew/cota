import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertCircle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * ErrorBoundary Component
 * 
 * Catches render errors in child components and displays a fallback UI.
 * Supports retry functionality and navigation back to home.
 * 
 * Requirements: 10.5
 * - Capture render errors
 * - Display error state with retry option
 */

interface Props {
  children: ReactNode;
  /** Custom fallback component */
  fallback?: ReactNode;
  /** Callback when error occurs */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  /** Whether to show retry button */
  showRetry?: boolean;
  /** Whether to show home button */
  showHome?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  isRetrying: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    isRetrying: false,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  private handleRetry = () => {
    this.setState({ isRetrying: true });
    // Small delay to show loading state
    setTimeout(() => {
      this.setState({ hasError: false, error: null, isRetrying: false });
    }, 300);
  };

  private handleGoHome = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = "/dashboard";
  };

  public render() {
    const { showRetry = true, showHome = true, fallback } = this.props;

    if (this.state.hasError) {
      // Use custom fallback if provided
      if (fallback) {
        return fallback;
      }

      return (
        <div className="min-h-[50vh] flex items-center justify-center bg-background p-4 animate-fade-in">
          <div className="max-w-md w-full text-center space-y-6">
            <div className="flex justify-center">
              <AlertCircle className="h-16 w-16 text-destructive" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-foreground">
                Algo deu errado
              </h1>
              <p className="text-muted-foreground">
                A aplicação encontrou um erro inesperado. Por favor, tente novamente.
              </p>
              {this.state.error && (
                <details className="mt-4 text-left">
                  <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
                    Detalhes técnicos
                  </summary>
                  <pre className="mt-2 p-4 bg-muted rounded-md text-xs overflow-auto max-h-32">
                    {this.state.error.toString()}
                  </pre>
                </details>
              )}
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {showRetry && (
                <Button
                  onClick={this.handleRetry}
                  disabled={this.state.isRetrying}
                  variant="default"
                  className="min-w-[44px] min-h-[44px]"
                >
                  <RefreshCw
                    className={`h-4 w-4 mr-2 ${this.state.isRetrying ? "animate-spin" : ""}`}
                  />
                  {this.state.isRetrying ? "Carregando..." : "Tentar novamente"}
                </Button>
              )}
              {showHome && (
                <Button
                  onClick={this.handleGoHome}
                  variant="outline"
                  className="min-w-[44px] min-h-[44px]"
                >
                  <Home className="h-4 w-4 mr-2" />
                  Ir para o início
                </Button>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * PageErrorBoundary - Specialized ErrorBoundary for page-level errors
 * Provides consistent error handling across all pages
 */
export class PageErrorBoundary extends ErrorBoundary {
  static defaultProps = {
    showRetry: true,
    showHome: true,
  };
}
