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

// Modo claro: pastéis suaves | Modo escuro: fundo neutro escuro com hierarquia via ícones/bordas
const VARIANT_STYLES = {
  default: {
    cardBg: "bg-purple-50 dark:bg-gray-900/80",
    iconBg: "bg-purple-500 dark:bg-purple-600",
    border: "border-purple-200/60 dark:border-purple-500/20",
    glow: "shadow-sm hover:shadow-md",
    titleColor: "text-purple-700 dark:text-purple-400",
  },
  success: {
    cardBg: "bg-emerald-50 dark:bg-gray-900/80",
    iconBg: "bg-emerald-500 dark:bg-emerald-600",
    border: "border-emerald-200/60 dark:border-emerald-500/20",
    glow: "shadow-sm hover:shadow-md",
    titleColor: "text-emerald-700 dark:text-emerald-400",
  },
  warning: {
    cardBg: "bg-amber-50 dark:bg-gray-900/80",
    iconBg: "bg-amber-500 dark:bg-amber-600",
    border: "border-amber-200/60 dark:border-amber-500/20",
    glow: "shadow-sm hover:shadow-md",
    titleColor: "text-amber-700 dark:text-amber-400",
  },
  error: {
    cardBg: "bg-red-50 dark:bg-gray-900/80",
    iconBg: "bg-red-500 dark:bg-red-600",
    border: "border-red-200/60 dark:border-red-500/20",
    glow: "shadow-sm hover:shadow-md",
    titleColor: "text-red-700 dark:text-red-400",
  },
  info: {
    cardBg: "bg-blue-50 dark:bg-gray-900/80",
    iconBg: "bg-blue-500 dark:bg-blue-600",
    border: "border-blue-200/60 dark:border-blue-500/20",
    glow: "shadow-sm hover:shadow-md",
    titleColor: "text-blue-700 dark:text-blue-400",
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
  const { isMobile } = useBreakpoint();
  const styles = VARIANT_STYLES[variant];

  return (
    <ResponsiveCard
      size="default"
      padding="md"
      interactive
      className={cn(
        "relative overflow-hidden border-2 transition-all duration-200 group",
        styles.border,
        styles.glow,
        styles.cardBg,
        className
      )}
    >
      <div className="relative flex flex-row items-center justify-between space-y-0">
        <CardTitle className={cn("text-xs sm:text-sm font-bold truncate pr-2", styles.titleColor)}>
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
