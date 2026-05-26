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

const VARIANTS = {
  default: "bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] text-white shadow-lg shadow-indigo-500/20 border-transparent",
  success: "bg-gradient-to-br from-[#10b981] to-[#059669] text-white shadow-lg shadow-emerald-500/20 border-transparent",
  warning: "bg-gradient-to-br from-[#f59e0b] to-[#ea580c] text-white shadow-lg shadow-amber-500/20 border-transparent",
  error: "bg-gradient-to-br from-[#ef4444] to-[#dc2626] text-white shadow-lg shadow-red-500/20 border-transparent",
  info: "bg-gradient-to-br from-[#0ea5e9] to-[#2563eb] text-white shadow-lg shadow-blue-500/20 border-transparent",
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
        "group relative overflow-hidden rounded-xl p-4 transition-all duration-200 border",
        VARIANTS[variant],
        "hover:shadow-lg hover:-translate-y-0.5",
        onClick && "cursor-pointer active:translate-y-0",
        className
      )}
      onClick={onClick}
    >
      {/* Top subtle highlight */}
      <div className="absolute inset-x-0 top-0 h-px bg-white/25" />

      {/* Content */}
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-3">
          <div className="p-1.5 rounded-md bg-white/20 backdrop-blur-sm">
            <Icon className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-white/90 leading-none">
            {title}
          </span>
        </div>

        <div className="flex flex-col gap-0.5">
          <div className="flex items-baseline gap-2">
            <h3 className="text-2xl font-bold tracking-tight text-white">
              {value}
            </h3>

            {trend && (
              <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-white/20 text-white">
                {trend.type === "positive" ? <TrendingUp size={10} strokeWidth={3} /> :
                  trend.type === "negative" ? <TrendingDown size={10} strokeWidth={3} /> : null}
                {trend.value}
              </div>
            )}
          </div>

          {(trend?.label || subtitle) && (
            <p className="text-[11px] font-medium text-white/75 leading-tight">
              {trend?.label || subtitle}
            </p>
          )}
        </div>
      </div>
    </div>
  );
});
