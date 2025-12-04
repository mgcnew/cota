import { memo } from "react";
import { CardTitle } from "@/components/ui/card";
import { ResponsiveCard } from "@/components/responsive/ResponsiveCard";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useBreakpoint } from "@/hooks/useBreakpoint";

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: string;
    label: string;
    type: "positive" | "negative" | "neutral";
  };
  variant?: "default" | "success" | "warning" | "error" | "info";
  className?: string;
}

const VARIANT_STYLES = {
  default: {
    cardBg: "bg-purple-50 dark:bg-purple-950/30",
    iconBg: "bg-purple-600 dark:bg-purple-500",
    border: "border-purple-200 dark:border-purple-800",
    glow: "shadow-md hover:shadow-lg shadow-purple-100 dark:shadow-purple-900/50",
    titleColor: "text-purple-700 dark:text-purple-300",
  },
  success: {
    cardBg: "bg-green-50 dark:bg-green-950/30",
    iconBg: "bg-green-600 dark:bg-green-500",
    border: "border-green-200 dark:border-green-800",
    glow: "shadow-md hover:shadow-lg shadow-green-100 dark:shadow-green-900/50",
    titleColor: "text-green-700 dark:text-green-300",
  },
  warning: {
    cardBg: "bg-amber-50 dark:bg-amber-950/30",
    iconBg: "bg-amber-600 dark:bg-amber-500",
    border: "border-amber-200 dark:border-amber-800",
    glow: "shadow-md hover:shadow-lg shadow-amber-100 dark:shadow-amber-900/50",
    titleColor: "text-amber-700 dark:text-amber-300",
  },
  error: {
    cardBg: "bg-red-50 dark:bg-red-950/30",
    iconBg: "bg-red-600 dark:bg-red-500",
    border: "border-red-200 dark:border-red-800",
    glow: "shadow-md hover:shadow-lg shadow-red-100 dark:shadow-red-900/50",
    titleColor: "text-red-700 dark:text-red-300",
  },
  info: {
    cardBg: "bg-blue-50 dark:bg-blue-950/30",
    iconBg: "bg-blue-600 dark:bg-blue-500",
    border: "border-blue-200 dark:border-blue-800",
    glow: "shadow-md hover:shadow-lg shadow-blue-100 dark:shadow-blue-900/50",
    titleColor: "text-blue-700 dark:text-blue-300",
  },
} as const;

const TREND_COLORS = {
  positive: "text-green-600 dark:text-green-400",
  negative: "text-red-600 dark:text-red-400",
  neutral: "text-gray-600 dark:text-gray-400",
} as const;

export const MetricCard = memo(function MetricCard({
  title,
  value,
  icon: Icon,
  trend,
  variant = "default",
  className,
}: MetricCardProps) {
  const { isMobile } = useBreakpoint();
  const styles = VARIANT_STYLES[variant];

  return (
    <ResponsiveCard
      size="default"
      padding="md"
      interactive
      className={cn(
        "relative overflow-hidden border-2 transition-all duration-200 group",
        !isMobile && "hover:scale-[1.02]",
        styles.border,
        styles.glow,
        styles.cardBg,
        className
      )}
    >
      <div className="relative flex flex-row items-center justify-between space-y-0">
        <CardTitle className={cn("text-xs sm:text-sm font-semibold truncate pr-2", styles.titleColor)}>
          {title}
        </CardTitle>
        <div className={cn(
          "p-1.5 sm:p-2.5 rounded-lg sm:rounded-xl shadow-md flex-shrink-0",
          !isMobile && "group-hover:scale-110 transition-transform duration-200",
          styles.iconBg
        )}>
          <Icon className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 text-white" />
        </div>
      </div>

      <div className="relative mt-2 sm:mt-3">
        <div className="text-lg sm:text-2xl md:text-3xl font-bold text-foreground truncate">
          {value}
        </div>
        {trend && (
          <div className="flex items-center gap-1 mt-1 sm:mt-2 flex-wrap">
            <span className={cn("text-[10px] sm:text-xs font-semibold", TREND_COLORS[trend.type])}>
              {trend.value}
            </span>
            <span className="text-[10px] sm:text-xs text-muted-foreground truncate">
              {trend.label}
            </span>
          </div>
        )}
      </div>
    </ResponsiveCard>
  );
});
