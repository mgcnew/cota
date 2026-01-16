import { memo } from "react";
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
        "relative overflow-hidden rounded-xl p-4 text-white",
        styles.cardBg,
        // Hover effect only on desktop - brightness change
        "md:hover:brightness-110 md:hover:shadow-md",
        onClick && "cursor-pointer",
        className
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-3">
        <div className={cn("p-2.5 rounded-xl", styles.iconBg)}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div className="space-y-1">
        <p className="text-2xl lg:text-3xl font-bold tracking-tight">{value}</p>
        <p className="text-sm font-medium text-white/90">{title}</p>
        {trend && (
          <p className="text-xs text-white/70">{trend.value} {trend.label}</p>
        )}
      </div>
    </div>
  );
});
