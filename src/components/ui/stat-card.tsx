import { memo, useId } from "react";
import { LucideIcon, ArrowUpRight, ArrowDownRight, Info } from "lucide-react";
import { AreaChart, Area, ResponsiveContainer } from "recharts";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface StatCardProps {
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
  pulse?: boolean;
  /** Série curta (3–12 pontos) para o mini-gráfico de tendência no rodapé do card. */
  sparklineData?: number[];
  /** Conteúdo exibido num popover ao clicar no ícone de info, ao lado do badge. */
  popoverContent?: React.ReactNode;
}

interface VariantStyle {
  iconBg: string;
  iconRing: string;
  icon: string;
  dot: string;
  stroke: string;
}

const VARIANTS: Record<string, VariantStyle> = {
  default: { iconBg: "bg-indigo-500/15", iconRing: "ring-indigo-500/20", icon: "text-indigo-400", dot: "text-indigo-500", stroke: "#6366f1" },
  success: { iconBg: "bg-emerald-500/15", iconRing: "ring-emerald-500/20", icon: "text-emerald-400", dot: "text-emerald-500", stroke: "#10b981" },
  warning: { iconBg: "bg-amber-500/15", iconRing: "ring-amber-500/20", icon: "text-amber-400", dot: "text-amber-500", stroke: "#f59e0b" },
  error: { iconBg: "bg-red-500/15", iconRing: "ring-red-500/20", icon: "text-red-400", dot: "text-red-500", stroke: "#ef4444" },
  info: { iconBg: "bg-blue-500/15", iconRing: "ring-blue-500/20", icon: "text-blue-400", dot: "text-blue-500", stroke: "#3b82f6" },
};

/**
 * Card de estatística padrão: rótulo + ícone no topo, valor grande,
 * variação real (quando houver) e uma sparkline decorativa no rodapé.
 * Reutilizado em Dashboard, Produtos e demais páginas com métricas de topo.
 */
export const StatCard = memo(function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  variant = "default",
  className,
  onClick,
  subtitle,
  pulse,
  sparklineData,
  popoverContent,
}: StatCardProps) {
  const v = VARIANTS[variant];
  const gradientId = `stat-spark-${useId()}`;
  const chartData = sparklineData?.map((val, i) => ({ i, val }));

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-border dark:border-white/[0.06] bg-card",
        "transition-all duration-200 ease-out",
        "hover:shadow-lg hover:shadow-black/[0.04] hover:-translate-y-0.5",
        onClick && "cursor-pointer active:translate-y-0 active:shadow-sm",
        className
      )}
      onClick={onClick}
    >
      <div className="p-4 pb-2">
        {/* Topo: rótulo + token de ícone */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <p className="text-xs text-muted-foreground leading-none truncate">
            {title}
          </p>
          <div className="flex items-center gap-1.5 shrink-0">
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
            <div
              className={cn(
                "relative flex items-center justify-center h-9 w-9 rounded-xl ring-1 transition-transform duration-200 group-hover:scale-105 shrink-0",
                v.iconBg,
                v.iconRing
              )}
            >
              <Icon className={cn("h-4 w-4", v.icon)} strokeWidth={2.25} />
              {pulse && (
                <span className={cn("absolute -top-1 -right-1 flex h-2.5 w-2.5", v.dot)}>
                  <span className="animate-ping absolute inline-flex h-2.5 w-2.5 rounded-full opacity-60 bg-current" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-current ring-2 ring-card" />
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Número protagonista */}
        <p className="text-2xl font-bold leading-none text-foreground truncate">
          {value}
        </p>

        {/* Variação real (quando houver) ou texto descritivo */}
        {trend ? (
          <div className="flex items-center gap-1 mt-2.5">
            {trend.type !== "neutral" && (
              trend.type === "positive"
                ? <ArrowUpRight className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                : <ArrowDownRight className="h-3.5 w-3.5 text-red-500 shrink-0" />
            )}
            <span
              className={cn(
                "text-xs font-semibold tabular-nums",
                trend.type === "positive"
                  ? "text-emerald-500"
                  : trend.type === "negative"
                  ? "text-red-500"
                  : "text-muted-foreground"
              )}
            >
              {trend.value}
            </span>
            <span className="text-xs text-muted-foreground truncate">{trend.label}</span>
          </div>
        ) : subtitle ? (
          <p className="text-xs text-muted-foreground mt-2.5 leading-tight truncate">
            {subtitle}
          </p>
        ) : null}
      </div>

      {/* Sparkline decorativa — só quando há uma série real pra mostrar */}
      {chartData && chartData.length > 1 && (
        <div className="relative h-10 -mt-1">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={v.stroke} stopOpacity={0.25} />
                  <stop offset="100%" stopColor={v.stroke} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="val"
                stroke={v.stroke}
                strokeWidth={2}
                fill={`url(#${gradientId})`}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
});
