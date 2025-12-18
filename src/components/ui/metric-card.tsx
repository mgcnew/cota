import { memo } from "react";
import { CardTitle } from "@/components/ui/card";
import { ResponsiveCard } from "@/components/responsive/ResponsiveCard";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

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

// Modo claro: cores vibrantes com hierarquia | Modo escuro: fundo neutro escuro
const VARIANT_STYLES = {
  default: {
    cardBg: "bg-gradient-to-br from-purple-100 to-violet-50 dark:from-gray-900 dark:to-gray-900",
    iconBg: "bg-purple-600 dark:bg-purple-600",
    border: "border-purple-200/70 dark:border-purple-500/20",
    glow: "shadow-md md:hover:shadow-lg md:transition-shadow md:duration-150",
    titleColor: "text-purple-800 dark:text-purple-400",
  },
  success: {
    cardBg: "bg-gradient-to-br from-emerald-100 to-teal-50 dark:from-gray-900 dark:to-gray-900",
    iconBg: "bg-emerald-600 dark:bg-emerald-600",
    border: "border-emerald-200/70 dark:border-emerald-500/20",
    glow: "shadow-md md:hover:shadow-lg md:transition-shadow md:duration-150",
    titleColor: "text-emerald-800 dark:text-emerald-400",
  },
  warning: {
    cardBg: "bg-gradient-to-br from-amber-100 to-yellow-50 dark:from-gray-900 dark:to-gray-900",
    iconBg: "bg-amber-600 dark:bg-amber-600",
    border: "border-amber-200/70 dark:border-amber-500/20",
    glow: "shadow-md md:hover:shadow-lg md:transition-shadow md:duration-150",
    titleColor: "text-amber-800 dark:text-amber-400",
  },
  error: {
    cardBg: "bg-gradient-to-br from-red-100 to-rose-50 dark:from-gray-900 dark:to-gray-900",
    iconBg: "bg-red-600 dark:bg-red-600",
    border: "border-red-200/70 dark:border-red-500/20",
    glow: "shadow-md md:hover:shadow-lg md:transition-shadow md:duration-150",
    titleColor: "text-red-800 dark:text-red-400",
  },
  info: {
    cardBg: "bg-gradient-to-br from-blue-100 to-indigo-50 dark:from-gray-900 dark:to-gray-900",
    iconBg: "bg-blue-600 dark:bg-blue-600",
    border: "border-blue-200/70 dark:border-blue-500/20",
    glow: "shadow-md md:hover:shadow-lg md:transition-shadow md:duration-150",
    titleColor: "text-blue-800 dark:text-blue-400",
  },
} as const;

const TREND_COLORS = {
  positive: "text-emerald-700 dark:text-emerald-400",
  negative: "text-red-700 dark:text-red-400",
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
  const styles = VARIANT_STYLES[variant];

  return (
    <ResponsiveCard
      size="default"
      padding="sm"
      interactive={false}
      className={cn(
        "relative overflow-hidden border",
        styles.border,
        styles.glow,
        styles.cardBg,
        className
      )}
    >
      <div className="flex flex-row items-center justify-between gap-2">
        <CardTitle className={cn("text-xs sm:text-sm font-bold truncate flex-1", styles.titleColor)}>
          {title}
        </CardTitle>
        {/* Icon with 44x44px minimum touch target on mobile */}
        <div className={cn("p-2 sm:p-2.5 rounded-lg sm:rounded-xl shadow-md flex-shrink-0 min-h-11 min-w-11 sm:min-h-auto sm:min-w-auto flex items-center justify-center", styles.iconBg)}>
          <Icon className="h-4 w-4 sm:h-4 sm:w-4 md:h-5 md:w-5 text-white" />
        </div>
      </div>

      <div className="mt-2 sm:mt-3">
        <div className="text-lg sm:text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white truncate">
          {value}
        </div>
        {trend && (
          <div className="flex items-center gap-1 mt-1 sm:mt-2 flex-wrap">
            <span className={cn("text-[10px] sm:text-xs font-bold", TREND_COLORS[trend.type])}>
              {trend.value}
            </span>
            <span className="text-[10px] sm:text-xs font-medium text-gray-500 dark:text-gray-400 truncate">
              {trend.label}
            </span>
          </div>
        )}
      </div>
    </ResponsiveCard>
  );
});
