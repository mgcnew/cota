import { memo } from "react";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface MobileMetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  variant?: "default" | "success" | "warning" | "error" | "info";
  onClick?: () => void;
  pulse?: boolean;
  isEmpty?: boolean;
  trend?: {
    value: string | number;
    label: string;
    type: "positive" | "negative" | "neutral";
  };
}

interface VariantStyle {
  wash: string;
  iconBg: string;
  iconRing: string;
  icon: string;
}

const VARIANTS: Record<string, VariantStyle> = {
  default: { wash: "from-indigo-500/[0.07]",  iconBg: "bg-indigo-500/10",  iconRing: "ring-indigo-500/20",  icon: "text-indigo-500" },
  success: { wash: "from-emerald-500/[0.07]", iconBg: "bg-emerald-500/10", iconRing: "ring-emerald-500/20", icon: "text-emerald-500" },
  warning: { wash: "from-amber-500/[0.09]",   iconBg: "bg-amber-500/10",   iconRing: "ring-amber-500/20",   icon: "text-amber-500" },
  error:   { wash: "from-red-500/[0.07]",     iconBg: "bg-red-500/10",     iconRing: "ring-red-500/20",     icon: "text-red-500" },
  info:    { wash: "from-blue-500/[0.07]",    iconBg: "bg-blue-500/10",    iconRing: "ring-blue-500/20",    icon: "text-blue-500" },
};

export const MobileMetricCard = memo(function MobileMetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = "default",
  onClick,
  pulse = false,
  isEmpty = false,
  trend,
}: MobileMetricCardProps) {
  const v = VARIANTS[variant];

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-border dark:border-white/[0.06] bg-card",
        "w-[156px] flex-shrink-0 p-3.5 flex flex-col justify-between min-h-[104px]",
        "transition-all duration-150",
        onClick && !isEmpty && "cursor-pointer active:scale-[0.98]",
        isEmpty && "opacity-50 cursor-default"
      )}
      onClick={isEmpty ? undefined : onClick}
      role={onClick && !isEmpty ? "button" : undefined}
      aria-label={`${title}: ${value}`}
    >
      {/* Lavada de cor da variante */}
      {!isEmpty && (
        <div className={cn("pointer-events-none absolute inset-0 bg-gradient-to-br to-transparent", v.wash)} />
      )}

      <div className="relative flex items-start justify-between mb-2">
        <div className={cn("flex items-center justify-center h-9 w-9 rounded-xl ring-1", v.iconBg, v.iconRing)}>
          <Icon className={cn("h-[17px] w-[17px]", v.icon)} strokeWidth={2.25} />
        </div>
        {pulse && !isEmpty && (
          <span className={cn("relative flex h-2 w-2 mt-0.5", v.icon)}>
            <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-current opacity-50" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-current" />
          </span>
        )}
      </div>

      <div className="relative">
        <p className="text-2xl font-extrabold leading-none tracking-tight tabular-nums text-foreground truncate">
          {value}
        </p>
        <p className="mt-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground leading-none">
          {title}
        </p>
        {(subtitle || trend?.label) && (
          <p className="text-[11px] text-muted-foreground mt-1 leading-tight line-clamp-2">
            {subtitle || trend?.label}
          </p>
        )}
      </div>
    </div>
  );
});
