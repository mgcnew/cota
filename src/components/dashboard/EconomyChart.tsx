import { useMemo } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DollarSign, ArrowUp, ArrowDown, Loader2 } from 'lucide-react';

interface EconomyChartProps {
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

const formatCurrency = (value: number) =>
  `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export function EconomyChart({ data, period, onPeriodChange, isLoading }: EconomyChartProps) {
  const isMobile = useIsMobile();

  const stats = useMemo(() => {
    if (!data?.length) return { totalEconomia: 0, trendEconomia: 0 };

    const economias = data.map(d => d.economia || 0);
    const totalEconomia = economias.reduce((a, b) => a + b, 0);

    const sliceSize = Math.max(1, Math.floor(data.length * 0.3));
    const firstAvg = economias.slice(0, sliceSize).reduce((a, b) => a + b, 0) / sliceSize;
    const lastAvg = economias.slice(-sliceSize).reduce((a, b) => a + b, 0) / sliceSize;
    const trendEconomia = firstAvg > 0 ? ((lastAvg - firstAvg) / firstAvg) * 100 : 0;

    return { totalEconomia, trendEconomia };
  }, [data]);

  return (
    <Card className="bg-card border border-subtle shadow-sm rounded-xl transition-all duration-300 hover:shadow-md">
      <CardHeader className="p-3 sm:p-4 pb-2 sm:pb-4 border-b border-muted">
        <div className="flex flex-col gap-2 sm:gap-3">
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="flex items-center gap-2 sm:gap-3 text-sm sm:text-base">
              <div className="p-1.5 sm:p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg shadow-sm">
                <DollarSign className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" />
              </div>
              <span className="font-semibold text-foreground truncate">Economia Gerada</span>
            </CardTitle>
            <Select value={period} onValueChange={onPeriodChange}>
              <SelectTrigger className="w-[100px] sm:w-[140px] h-8 sm:h-9 text-xs border-gray-200 dark:border-gray-700/60 hover:border-green-400">
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
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-muted-foreground">Total:</span>
                <span className="font-semibold text-foreground">{formatCurrency(stats.totalEconomia)}</span>
                <span className={`flex items-center gap-1 ${stats.trendEconomia >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {stats.trendEconomia >= 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                  {Math.abs(stats.trendEconomia).toFixed(1)}%
                </span>
              </div>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-1 sm:p-2 pt-2 sm:pt-3">
        {isLoading ? (
          <div className="flex items-center justify-center h-[200px] sm:h-[280px]">
            <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-green-500" />
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={isMobile ? 200 : 280}>
            <AreaChart data={data} margin={{ top: 5, right: 15, left: -10, bottom: 5 }}>
              <defs>
                <linearGradient id="economyGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-700/30" opacity={0.4} vertical={false} />
              <XAxis dataKey={period === '7d' ? 'day' : 'month'} stroke="#9ca3af" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis
                stroke="#9ca3af"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                width={85}
                tickFormatter={(v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                  fontSize: '12px',
                  color: 'hsl(var(--foreground))',
                }}
                labelStyle={{ fontWeight: 600, marginBottom: '4px', color: 'hsl(var(--foreground))' }}
                formatter={(value: number) => [formatCurrency(value), 'Economia']}
              />
              <Area
                type="monotone"
                dataKey="economia"
                name="Economia"
                stroke="#10b981"
                strokeWidth={2.5}
                fill="url(#economyGradient)"
                dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 6, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
