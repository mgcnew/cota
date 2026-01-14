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
  onClick?: () => void;
}

// Cores sólidas com significado lógico:
// default (purple) = padrão/geral
// success (emerald) = sucesso/dinheiro/positivo
// warning (amber) = atenção/alertas
// error (red) = problemas/urgente
// info (blue) = informação/documentos
const VARIANT_STYLES = {
  default: {
    cardBg: "bg-gradient-to-br from-purple-500 to-purple-600",
    iconBg: "bg-white/20",
    textColor: "text-white",
    subtitleColor: "text-white/80",
  },
  success: {
    cardBg: "bg-gradient-to-br from-emerald-500 to-emerald-600",
    iconBg: "bg-white/20",
    textColor: "text-white",
    subtitleColor: "text-white/80",
  },
  warning: {
    cardBg: "bg-gradient-to-br from-amber-500 to-amber-600",
    iconBg: "bg-white/20",
    textColor: "text-white",
    subtitleColor: "text-white/80",
  },
  error: {
    cardBg: "bg-gradient-to-br from-red-500 to-red-600",
    iconBg: "bg-white/20",
    textColor: "text-white",
    subtitleColor: "text-white/80",
  },
  info: {
    cardBg: "bg-gradient-to-br from-blue-500 to-blue-600",
    iconBg: "bg-white/20",
    textColor: "text-white",
    subtitleColor: "text-white/80",
  },
} as const;

const TREND_COLORS = {
  positive: "bg-white/20 text-white",
  negative: "bg-red-400/30 text-white",
  neutral: "bg-white/15 text-white/80",
} as const;

export const MetricCard = memo(function MetricCard({
  title,
  value,
  icon: Icon,
  trend,
  variant = "default",
  className,
  onClick,
}: MetricCardProps) {
  const styles = VARIANT_STYLES[variant];

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl p-4",
        styles.cardBg,
        onClick && "cursor-pointer hover:opacity-95 transition-opacity",
        className
      )}
      onClick={onClick}
    >
      <div className="flex flex-row items-center justify-between gap-2">
        <CardTitle className={cn("text-xs sm:text-sm font-semibold truncate flex-1", styles.subtitleColor)}>
          {title}
        </CardTitle>
        {/* Icon with background */}
        <div className={cn("p-2 sm:p-2.5 rounded-lg sm:rounded-xl flex-shrink-0 flex items-center justify-center", styles.iconBg)}>
          <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
        </div>
      </div>

      <div className="mt-2 sm:mt-3">
        <div className={cn("text-xl sm:text-2xl md:text-3xl font-bold truncate", styles.textColor)}>
          {value}
        </div>
        {trend && (
          <div className="flex items-center gap-2 mt-2">
            <span className={cn("text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded-full", TREND_COLORS[trend.type])}>
              {trend.value}
            </span>
            <span className={cn("text-[10px] sm:text-xs font-medium truncate", styles.subtitleColor)}>
              {trend.label}
            </span>
          </div>
        )}
      </div>
    </div>
  );
});
