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
        "group relative overflow-hidden rounded-2xl p-5 transition-all duration-300 border",
        VARIANTS[variant],
        "hover:shadow-xl hover:-translate-y-1",
        onClick && "cursor-pointer active:translate-y-0",
        className
      )}
      onClick={onClick}
    >
      {/* Top subtle highlight for 3D premium effect */}
      <div className="absolute inset-x-0 top-0 h-px bg-white/30" />
      <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />

      {/* Decorative large icon functioning as the card's unique graphic */}
      <div className="absolute -right-6 -bottom-6 transition-transform duration-500 group-hover:scale-110 group-hover:-translate-y-2 group-hover:-rotate-6 pointer-events-none">
        <Icon 
          size={150} 
          className="text-white/20" 
          strokeWidth={1.5} 
          style={{ filter: "drop-shadow(0px 10px 15px rgba(0,0,0,0.15))" }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-5">
          <div className="p-1.5 rounded-lg bg-white/20 backdrop-blur-sm shadow-sm">
            <Icon className="w-4 h-4 text-white" />
          </div>
          <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-white/90">
            {title}
          </span>
        </div>

        <div className="flex flex-col gap-1">
          <div className="flex items-baseline gap-2">
            <h3 className="text-3xl lg:text-4xl font-black tracking-tight text-white drop-shadow-sm">
              {value}
            </h3>

            {trend && (
              <div className="flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[11px] font-bold bg-white/20 text-white backdrop-blur-sm shadow-sm">
                {trend.type === "positive" ? <TrendingUp size={12} strokeWidth={3} /> :
                  trend.type === "negative" ? <TrendingDown size={12} strokeWidth={3} /> : null}
                {trend.value}
              </div>
            )}
          </div>

          {(trend?.label || subtitle) && (
            <p className="text-[11px] sm:text-xs font-medium text-white/80 mt-1 max-w-[75%] leading-tight">
              {trend?.label || subtitle}
            </p>
          )}
        </div>
      </div>
    </div>
  );
});
