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

const VARIANTS: Record<string, { border: string; icon: string; iconBg: string }> = {
  default: { border: "border-l-indigo-500", icon: "text-indigo-500", iconBg: "bg-indigo-500/10" },
  success:  { border: "border-l-emerald-500", icon: "text-emerald-500", iconBg: "bg-emerald-500/10" },
  warning:  { border: "border-l-amber-500",   icon: "text-amber-500",   iconBg: "bg-amber-500/10"   },
  error:    { border: "border-l-red-500",     icon: "text-red-500",     iconBg: "bg-red-500/10"     },
  info:     { border: "border-l-blue-500",    icon: "text-blue-500",    iconBg: "bg-blue-500/10"    },
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
        "relative bg-card border border-border dark:border-white/5 rounded-lg",
        "border-l-[3px]", v.border,
        "w-[152px] flex-shrink-0",
        "p-3 flex flex-col justify-between min-h-[100px]",
        "transition-all duration-150",
        onClick && !isEmpty && "cursor-pointer active:scale-[0.98]",
        isEmpty && "opacity-50 cursor-default"
      )}
      onClick={isEmpty ? undefined : onClick}
      role={onClick && !isEmpty ? "button" : undefined}
      aria-label={`${title}: ${value}`}
    >
      <div className="flex items-start justify-between mb-2">
        <div className={cn("p-1.5 rounded-md", v.iconBg)}>
          <Icon className={cn("w-3.5 h-3.5", v.icon)} />
        </div>
        {pulse && !isEmpty && (
          <span className="relative flex h-2 w-2 mt-0.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-50" />
            <span className={cn("relative inline-flex rounded-full h-2 w-2", v.icon, "bg-current")} />
          </span>
        )}
      </div>

      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground leading-none mb-1.5">
          {title}
        </p>
        <p className="text-xl font-bold leading-none text-foreground">
          {value}
        </p>
        {(subtitle || trend?.label) && (
          <p className="text-[11px] text-muted-foreground mt-1 leading-tight">
            {subtitle || trend?.label}
          </p>
        )}
      </div>
    </div>
  );
});
