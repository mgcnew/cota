import { useMemo, memo, useCallback } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart3, ArrowUp, ArrowDown, Loader2 } from 'lucide-react';

interface EvolutionChartProps {
  data: any[];
  period: string;
  onPeriodChange: (value: string) => void;
  isLoading?: boolean;
}

const PERIOD_OPTIONS = [
  { value: '7d', label: '7 dias' },
  { value: '1m', label: '1 mês' },
  { value: '3m', label: '3 meses' },
  { value: '6m', label: '6 meses' },
  { value: '1y', label: '1 ano' },
];

const calcTrend = (values: number[]) => {
  if (values.length < 2) return 0;
  const sliceSize = Math.max(1, Math.floor(values.length * 0.3));
  const firstAvg = values.slice(0, sliceSize).reduce((a, b) => a + b, 0) / sliceSize;
  const lastAvg = values.slice(-sliceSize).reduce((a, b) => a + b, 0) / sliceSize;
  return firstAvg > 0 ? ((lastAvg - firstAvg) / firstAvg) * 100 : 0;
};

// Componente memoizado para indicador de tendência
const TrendIndicator = memo(function TrendIndicator({ value }: { value: number }) {
  return (
    <span className={`flex items-center ${value >= 0 ? 'text-green-600' : 'text-red-600'}`}>
      {value >= 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
      {Math.abs(value).toFixed(0)}%
    </span>
  );
});

// Tooltip style estático para evitar recriação
const TOOLTIP_STYLE = {
  backgroundColor: 'hsl(var(--card))',
  border: '1px solid hsl(var(--border))',
  borderRadius: '8px',
  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
  fontSize: '12px',
  color: 'hsl(var(--foreground))',
};

const LABEL_STYLE = { fontWeight: 600, marginBottom: '4px', color: 'hsl(var(--foreground))' };

export const EvolutionChart = memo(function EvolutionChart({ data, period, onPeriodChange, isLoading }: EvolutionChartProps) {
  const isMobile = useIsMobile();

  const stats = useMemo(() => {
    if (!data?.length) return { avgCotacoes: 0, avgFornecedores: 0, trendCotacoes: 0, trendFornecedores: 0 };

    const cotacoes = data.map(d => d.cotacoes || 0);
    const fornecedores = data.map(d => d.fornecedores || 0);

    return {
      avgCotacoes: cotacoes.reduce((a, b) => a + b, 0) / cotacoes.length,
      avgFornecedores: fornecedores.reduce((a, b) => a + b, 0) / fornecedores.length,
      trendCotacoes: calcTrend(cotacoes),
      trendFornecedores: calcTrend(fornecedores),
    };
  }, [data]);

  const chartHeight = useMemo(() => isMobile ? 200 : 280, [isMobile]);
  const dataKey = useMemo(() => period === '7d' ? 'day' : 'month', [period]);

  return (
    <Card className="col-span-1 lg:col-span-2 bg-card border border-subtle shadow-sm rounded-xl">
      <CardHeader className="p-3 sm:p-4 pb-2 sm:pb-4 border-b border-muted">
        <div className="flex flex-col gap-2 sm:gap-3">
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="flex items-center gap-2 sm:gap-3 text-sm sm:text-base">
              <div className="p-1.5 sm:p-2 bg-gradient-to-br from-primary to-primary-light rounded-lg shadow-sm">
                <BarChart3 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" />
              </div>
              <span className="font-semibold text-foreground truncate">Evolução das Cotações</span>
            </CardTitle>
            <Select value={period} onValueChange={onPeriodChange}>
              <SelectTrigger className="w-[100px] sm:w-[140px] h-8 sm:h-9 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PERIOD_OPTIONS.map(({ value, label }) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {data?.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-[10px] sm:text-xs">
              <div className="flex items-center gap-1 sm:gap-2">
                <div className="w-2 h-2 rounded-full bg-purple-500" />
                <span className="text-muted-foreground">Cotações:</span>
                <span className="font-semibold text-foreground">{Math.round(stats.avgCotacoes)}</span>
                <TrendIndicator value={stats.trendCotacoes} color="purple" />
              </div>
              <div className="flex items-center gap-1 sm:gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-muted-foreground">Fornec:</span>
                <span className="font-semibold text-foreground">{Math.round(stats.avgFornecedores)}</span>
                <TrendIndicator value={stats.trendFornecedores} color="green" />
              </div>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-1 sm:p-2 pt-2 sm:pt-3">
        {isLoading ? (
          <div className="flex items-center justify-center h-[200px] sm:h-[280px]">
            <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-purple-500" />
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={chartHeight}>
            <LineChart data={data} margin={{ top: 5, right: 20, left: 5, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-700/30" opacity={0.4} vertical={false} />
              <XAxis dataKey={dataKey} stroke="#9ca3af" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="#9ca3af" fontSize={11} tickLine={false} axisLine={false} width={35} />
              <ReferenceLine y={stats.avgCotacoes} stroke="#7C3AED" strokeDasharray="4 4" strokeWidth={1} strokeOpacity={0.5} />
              <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={LABEL_STYLE} />
              <Line type="monotone" dataKey="cotacoes" name="Cotações" stroke="#7C3AED" strokeWidth={2.5}
                dot={{ r: 4, fill: '#7C3AED', strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 6, fill: '#7C3AED', strokeWidth: 2, stroke: '#fff' }}
                isAnimationActive={false}
              />
              <Line type="monotone" dataKey="fornecedores" name="Fornecedores" stroke="#22C55E" strokeWidth={2.5}
                dot={{ r: 4, fill: '#22C55E', strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 6, fill: '#22C55E', strokeWidth: 2, stroke: '#fff' }}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
});
