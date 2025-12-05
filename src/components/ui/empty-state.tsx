import { memo } from "react";
import { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  actionIcon?: LucideIcon;
  className?: string;
  variant?: "card" | "inline";
}

export const EmptyState = memo(function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  actionIcon: ActionIcon,
  className,
  variant = "card"
}: EmptyStateProps) {
  const content = (
    <div className={cn("text-center", variant === "card" ? "p-8 sm:p-12" : "py-8", className)}>
      <Icon className="h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-4 text-gray-400 dark:text-gray-500" />
      <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-2">
        {title}
      </h3>
      {description && (
        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-4">
          {description}
        </p>
      )}
      {actionLabel && onAction && (
        <Button onClick={onAction} className="mt-2 bg-primary hover:bg-primary/90 text-white">
          {ActionIcon && <ActionIcon className="h-4 w-4 mr-2" />}
          {actionLabel}
        </Button>
      )}
    </div>
  );

  if (variant === "inline") {
    return content;
  }

  return (
    <Card className="border-dashed border-2 border-gray-300 dark:border-gray-600">
      <CardContent className="p-0">
        {content}
      </CardContent>
    </Card>
  );
});
