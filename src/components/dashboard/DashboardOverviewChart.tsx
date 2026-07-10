import { memo, useMemo, useState } from "react";
import { AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/utils/formatters";

interface MonthPoint {
  month: string;
  economia: number;
  compras: number;
}

interface DashboardOverviewChartProps {
  data: MonthPoint[];
}

type SerieKey = "economia" | "compras" | "variacao";

const SERIES: { key: SerieKey; label: string; stroke: string; subtitle: string }[] = [
  { key: "economia", label: "Economia", stroke: "#10b981", subtitle: "Economia obtida nas cotações por mês" },
  { key: "compras", label: "Compras", stroke: "#3b82f6", subtitle: "Valor comprado em pedidos por mês" },
  { key: "variacao", label: "Variação", stroke: "#f59e0b", subtitle: "Variação % dos gastos vs mês anterior" },
];

const compactBRL = (v: number) => {
  const abs = Math.abs(v);
  if (abs >= 1_000_000) return `R$ ${(v / 1_000_000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}M`;
  if (abs >= 1_000) return `R$ ${(v / 1_000).toLocaleString("pt-BR", { maximumFractionDigits: 0 })}k`;
  return `R$ ${v.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}`;
};

export const DashboardOverviewChart = memo(function DashboardOverviewChart({ data }: DashboardOverviewChartProps) {
  const [serie, setSerie] = useState<SerieKey>("economia");
  const active = SERIES.find((s) => s.key === serie)!;

  const chartData = useMemo(() => {
    if (serie !== "variacao") {
      return data.map((d) => ({ month: d.month, valor: d[serie] }));
    }
    // Variação % dos gastos mês a mês (1º mês da janela não tem base de comparação)
    return data.map((d, i) => {
      if (i === 0) return { month: d.month, valor: 0 };
      const prev = data[i - 1].compras;
      const valor = prev > 0 ? ((d.compras - prev) / prev) * 100 : d.compras > 0 ? 100 : 0;
      return { month: d.month, valor: Math.round(valor * 10) / 10 };
    });
  }, [data, serie]);

  const isPercent = serie === "variacao";

  return (
    <div className="rounded-2xl border border-border dark:border-white/[0.06] bg-card">
      {/* Cabeçalho: título + filtros */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 pb-2">
        <div>
          <h2 className="text-[15px] font-bold text-foreground leading-tight">Visão Geral</h2>
          <p className="text-xs text-muted-foreground mt-0.5">{active.subtitle}</p>
        </div>
        <div className="flex items-center gap-0.5 p-1 rounded-lg bg-muted/60 dark:bg-white/5 self-start sm:self-auto">
          {SERIES.map((s) => (
            <button
              key={s.key}
              onClick={() => setSerie(s.key)}
              className={cn(
                "px-3 py-1.5 rounded-md text-xs font-semibold transition-all",
                serie === s.key
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Gráfico */}
      <div className="h-[260px] px-2 pb-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 12, right: 16, bottom: 0, left: 4 }}>
            <defs>
              <linearGradient id={`overview-fill-${serie}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={active.stroke} stopOpacity={0.18} />
                <stop offset="100%" stopColor={active.stroke} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              horizontal
              vertical={false}
              strokeDasharray="4 6"
              stroke="currentColor"
              className="text-border dark:text-white/10"
            />
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              dy={8}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              width={56}
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              tickFormatter={(v: number) => (isPercent ? `${v}%` : compactBRL(v))}
            />
            <Tooltip
              cursor={{ stroke: active.stroke, strokeOpacity: 0.25, strokeWidth: 1 }}
              content={({ active: hovered, payload, label }) => {
                if (!hovered || !payload?.length) return null;
                const v = payload[0].value as number;
                return (
                  <div className="rounded-lg border border-border bg-popover px-3 py-2 shadow-lg">
                    <p className="text-[11px] text-muted-foreground">{label}</p>
                    <p className="text-sm font-bold text-foreground tabular-nums">
                      {isPercent ? `${v > 0 ? "+" : ""}${v}%` : formatCurrency(v)}
                    </p>
                  </div>
                );
              }}
            />
            <Area
              type="monotone"
              dataKey="valor"
              stroke={active.stroke}
              strokeWidth={2}
              fill={`url(#overview-fill-${serie})`}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 2, stroke: "hsl(var(--card))" }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
});
