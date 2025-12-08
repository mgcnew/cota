import { memo } from "react";
import { AlertCircle, RefreshCw, LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/**
 * ErrorState Component
 * 
 * Reusable error state component with retry functionality.
 * Displays error message and optional retry button.
 * 
 * Requirements: 10.5
 * - Display error state with retry option
 * - Consistent error handling across the application
 */

export interface ErrorStateProps {
  /** Error title - defaults to "Algo deu errado" */
  title?: string;
  /** Error description/message */
  message?: string;
  /** Custom icon - defaults to AlertCircle */
  icon?: LucideIcon;
  /** Retry button label - defaults to "Tentar novamente" */
  retryLabel?: string;
  /** Callback when retry button is clicked */
  onRetry?: () => void;
  /** Whether retry is in progress */
  isRetrying?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Display variant */
  variant?: "card" | "inline" | "fullscreen";
  /** Size variant */
  size?: "sm" | "md" | "lg";
}

export const ErrorState = memo(function ErrorState({
  title = "Algo deu errado",
  message = "Ocorreu um erro ao carregar os dados. Por favor, tente novamente.",
  icon: Icon = AlertCircle,
  retryLabel = "Tentar novamente",
  onRetry,
  isRetrying = false,
  className,
  variant = "card",
  size = "md",
}: ErrorStateProps) {
  const sizeClasses = {
    sm: {
      icon: "h-8 w-8",
      title: "text-sm font-medium",
      message: "text-xs",
      padding: "p-4",
      button: "h-8 text-xs",
    },
    md: {
      icon: "h-12 w-12",
      title: "text-base font-semibold",
      message: "text-sm",
      padding: "p-6 sm:p-8",
      button: "h-9 text-sm",
    },
    lg: {
      icon: "h-16 w-16",
      title: "text-lg font-bold",
      message: "text-base",
      padding: "p-8 sm:p-12",
      button: "h-10 text-base",
    },
  };

  const sizes = sizeClasses[size];

  const content = (
    <div
      className={cn(
        "text-center animate-fade-in",
        variant === "fullscreen" && "min-h-screen flex flex-col items-center justify-center",
        variant !== "fullscreen" && sizes.padding,
        className
      )}
    >
      <div className="flex justify-center mb-4">
        <Icon
          className={cn(
            sizes.icon,
            "text-destructive"
          )}
        />
      </div>
      <div className="space-y-2">
        <h3
          className={cn(
            sizes.title,
            "text-foreground"
          )}
        >
          {title}
        </h3>
        {message && (
          <p
            className={cn(
              sizes.message,
              "text-muted-foreground max-w-md mx-auto"
            )}
          >
            {message}
          </p>
        )}
      </div>
      {onRetry && (
        <Button
          onClick={onRetry}
          disabled={isRetrying}
          variant="outline"
          className={cn(
            "mt-4 min-w-[44px] min-h-[44px]",
            sizes.button
          )}
        >
          <RefreshCw
            className={cn(
              "h-4 w-4 mr-2",
              isRetrying && "animate-spin"
            )}
          />
          {isRetrying ? "Carregando..." : retryLabel}
        </Button>
      )}
    </div>
  );

  if (variant === "inline" || variant === "fullscreen") {
    return content;
  }

  return (
    <Card className="border-destructive/20 bg-destructive/5">
      <CardContent className="p-0">
        {content}
      </CardContent>
    </Card>
  );
});

export default ErrorState;
