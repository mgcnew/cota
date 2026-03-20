import { memo } from "react";
import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";
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
  subtitle?: string;
}

const LIGHT_VARIANTS = {
  default: "bg-brand text-brand-foreground border-brand shadow-brand/20",
  success: "bg-emerald-500 text-white border-emerald-500 shadow-emerald-200/40",
  warning: "bg-amber-500 text-white border-amber-500 shadow-amber-200/40",
  error: "bg-red-500 text-white border-red-500 shadow-red-200/40",
  info: "bg-blue-500 text-white border-blue-500 shadow-blue-200/40",
};

const DARK_VARIANTS = {
  default: "dark:bg-zinc-900/80 dark:text-zinc-50 dark:border-zinc-800",
  success: "dark:bg-zinc-900/80 dark:text-zinc-50 dark:border-zinc-800",
  warning: "dark:bg-zinc-900/80 dark:text-zinc-50 dark:border-zinc-800",
  error: "dark:bg-zinc-900/80 dark:text-zinc-50 dark:border-zinc-800",
  info: "dark:bg-zinc-900/80 dark:text-zinc-50 dark:border-zinc-800",
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
}: MetricCardProps) {
  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl p-5 transition-all duration-500 border",
        LIGHT_VARIANTS[variant],
        DARK_VARIANTS[variant],
        "hover:shadow-2xl hover:scale-[1.04]",
        "hover:border-white/40 dark:hover:border-border/50",
        onClick && "cursor-pointer active:scale-[0.98]",
        className
      )}
      onClick={onClick}
    >
      {/* Background Silhouette (Hover Effect) */}
      <div className="absolute -right-6 -bottom-6 opacity-0 group-hover:opacity-[0.15] dark:group-hover:opacity-[0.05] transition-all duration-700 transform group-hover:-translate-y-4 group-hover:-translate-x-2 pointer-events-none rotate-6">
        <Icon size={160} strokeWidth={1} />
      </div>

      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-4">
          <div className={cn(
            "p-2 rounded-xl transition-all duration-300",
            "bg-white/20 dark:bg-accent",
            "text-white dark:text-foreground"
          )}>
            <Icon className="w-5 h-5" />
          </div>
          <span className={cn(
            "text-[10px] font-black uppercase tracking-widest transition-opacity duration-300",
            "text-white/90 dark:text-muted-foreground"
          )}>
            {title}
          </span>
        </div>

        <div className="flex flex-col gap-1">
          <div className="flex items-baseline gap-2">
            <h3 className={cn(
              "text-2xl lg:text-3xl font-black tracking-tight",
              "text-white dark:text-foreground"
            )}>
              {value}
            </h3>

            {trend && (
              <div className={cn(
                "flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[11px] font-bold transition-all",
                "bg-white/20 text-white dark:bg-accent dark:text-foreground"
              )}>
                {trend.type === "positive" ? <TrendingUp size={12} strokeWidth={3} /> :
                  trend.type === "negative" ? <TrendingDown size={12} strokeWidth={3} /> : null}
                {trend.value}
              </div>
            )}
          </div>

          {trend?.label && (
            <p className={cn(
              "text-[11px] font-medium transition-colors",
              "text-white/70 dark:text-muted-foreground"
            )}>
              {trend.label}
            </p>
          )}

          {subtitle && !trend?.label && (
            <p className={cn(
              "text-[11px] font-medium transition-colors",
              "text-white/70 dark:text-muted-foreground"
            )}>
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Subtle bottom accent line on hover (Dark Mode Only) */}
      <div className="hidden dark:block absolute bottom-0 left-0 h-[2px] w-full bg-brand scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-500" />
    </div>
  );
});
