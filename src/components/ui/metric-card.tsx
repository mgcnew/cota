import { memo } from "react";
import { LucideIcon, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

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
  subtitle?: string;
  popoverContent?: React.ReactNode;
  pulse?: boolean;
}

interface VariantStyle {
  wash: string;
  iconBg: string;
  iconRing: string;
  icon: string;
  dot: string;
}

const VARIANTS: Record<string, VariantStyle> = {
  default: {
    wash: "from-indigo-500/[0.07]",
    iconBg: "bg-indigo-500/10",
    iconRing: "ring-indigo-500/20",
    icon: "text-indigo-500",
    dot: "text-indigo-500",
  },
  success: {
    wash: "from-emerald-500/[0.07]",
    iconBg: "bg-emerald-500/10",
    iconRing: "ring-emerald-500/20",
    icon: "text-emerald-500",
    dot: "text-emerald-500",
  },
  warning: {
    wash: "from-amber-500/[0.09]",
    iconBg: "bg-amber-500/10",
    iconRing: "ring-amber-500/20",
    icon: "text-amber-500",
    dot: "text-amber-500",
  },
  error: {
    wash: "from-red-500/[0.07]",
    iconBg: "bg-red-500/10",
    iconRing: "ring-red-500/20",
    icon: "text-red-500",
    dot: "text-red-500",
  },
  info: {
    wash: "from-blue-500/[0.07]",
    iconBg: "bg-blue-500/10",
    iconRing: "ring-blue-500/20",
    icon: "text-blue-500",
    dot: "text-blue-500",
  },
};

export const MetricCard = memo(function MetricCard({
  title,
  value,
  icon: Icon,
  trend,
  variant = "default",
  className,
  onClick,
  subtitle,
  popoverContent,
  pulse,
}: MetricCardProps) {
  const v = VARIANTS[variant];

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-border dark:border-white/[0.06] bg-card p-4",
        "transition-all duration-200 ease-out",
        "hover:shadow-lg hover:shadow-black/[0.04] hover:-translate-y-0.5",
        onClick && "cursor-pointer active:translate-y-0 active:shadow-sm",
        className
      )}
      onClick={onClick}
    >
      {/* Lavada de cor da variante — identidade + profundidade */}
      <div className={cn("pointer-events-none absolute inset-0 bg-gradient-to-br to-transparent", v.wash)} />

      <div className="relative">
        {/* Topo: token de ícone + indicadores */}
        <div className="flex items-start justify-between mb-3.5">
          <div
            className={cn(
              "flex items-center justify-center h-10 w-10 rounded-xl ring-1 transition-transform duration-200 group-hover:scale-105",
              v.iconBg,
              v.iconRing
            )}
          >
            <Icon className={cn("h-[18px] w-[18px]", v.icon)} strokeWidth={2.25} />
          </div>
          <div className="flex items-center gap-2">
            {popoverContent && (
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    onClick={(e) => e.stopPropagation()}
                    className="text-muted-foreground/50 hover:text-muted-foreground transition-colors"
                  >
                    <Info className="w-3.5 h-3.5" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-0" align="end">
                  {popoverContent}
                </PopoverContent>
              </Popover>
            )}
            {pulse && (
              <span className={cn("relative flex h-2 w-2 mt-1", v.dot)}>
                <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full opacity-60 bg-current" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-current" />
              </span>
            )}
          </div>
        </div>

        {/* Número protagonista */}
        <p className="text-2xl font-extrabold leading-none tracking-tight tabular-nums text-foreground truncate">
          {value}
        </p>

        {/* Rótulo */}
        <p className="mt-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground leading-none">
          {title}
        </p>

        {(trend?.label || subtitle) && (
          <p className="text-xs text-muted-foreground mt-1.5 leading-tight">
            {trend?.label || subtitle}
          </p>
        )}
        {trend && (
          <p
            className={cn(
              "text-xs font-semibold mt-1 tabular-nums",
              trend.type === "positive"
                ? "text-emerald-500"
                : trend.type === "negative"
                ? "text-red-500"
                : "text-muted-foreground"
            )}
          >
            {trend.value}
          </p>
        )}
      </div>
    </div>
  );
});
