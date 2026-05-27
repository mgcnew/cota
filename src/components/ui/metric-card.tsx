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
}

const VARIANTS: Record<string, { border: string; icon: string; iconBg: string; value: string }> = {
  default: {
    border: "border-l-indigo-500",
    icon: "text-indigo-500",
    iconBg: "bg-indigo-500/10",
    value: "text-foreground",
  },
  success: {
    border: "border-l-emerald-500",
    icon: "text-emerald-500",
    iconBg: "bg-emerald-500/10",
    value: "text-foreground",
  },
  warning: {
    border: "border-l-amber-500",
    icon: "text-amber-500",
    iconBg: "bg-amber-500/10",
    value: "text-foreground",
  },
  error: {
    border: "border-l-red-500",
    icon: "text-red-500",
    iconBg: "bg-red-500/10",
    value: "text-foreground",
  },
  info: {
    border: "border-l-blue-500",
    icon: "text-blue-500",
    iconBg: "bg-blue-500/10",
    value: "text-foreground",
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
}: MetricCardProps) {
  const v = VARIANTS[variant];

  return (
    <div
      className={cn(
        "relative bg-card border border-border dark:border-white/5 rounded-lg p-4",
        "border-l-[3px]",
        v.border,
        "transition-all duration-150",
        "hover:shadow-md hover:-translate-y-px",
        onClick && "cursor-pointer active:translate-y-0 active:shadow-sm",
        className
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground leading-none">
            {title}
          </span>
          {popoverContent && (
            <Popover>
              <PopoverTrigger asChild>
                <button
                  onClick={(e) => e.stopPropagation()}
                  className="text-muted-foreground/50 hover:text-muted-foreground transition-colors"
                >
                  <Info className="w-3 h-3" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-0" align="start">
                {popoverContent}
              </PopoverContent>
            </Popover>
          )}
        </div>
        <div className={cn("p-1.5 rounded-md shrink-0", v.iconBg)}>
          <Icon className={cn("w-3.5 h-3.5", v.icon)} />
        </div>
      </div>

      <div>
        <p className={cn("text-xl font-bold leading-none", v.value)}>
          {value}
        </p>
        {(trend?.label || subtitle) && (
          <p className="text-xs text-muted-foreground mt-1.5 leading-tight">
            {trend?.label || subtitle}
          </p>
        )}
        {trend && (
          <p className={cn(
            "text-xs font-semibold mt-1",
            trend.type === "positive" ? "text-emerald-500" :
            trend.type === "negative" ? "text-red-500" : "text-muted-foreground"
          )}>
            {trend.value}
          </p>
        )}
      </div>
    </div>
  );
});
