import { useMemo } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DollarSign, ArrowUp, ArrowDown, Loader2 } from 'lucide-react';

interface EconomyChartProps {
    data: any[];
    period: string;
    onPeriodChange: (value: string) => void;
    isLoading?: boolean;
}

export function EconomyChart({ data, period, onPeriodChange, isLoading }: EconomyChartProps) {
    const isMobile = useIsMobile();

    const stats = useMemo(() => {
        if (!data || data.length === 0) {
            return {
                avgEconomia: 0,
                trendEconomia: 0,
                totalEconomia: 0
            };
        }

        const economias = data.map(d => d.economia || 0);
        const avgEconomia = economias.reduce((a, b) => a + b, 0) / economias.length;
        const totalEconomia = economias.reduce((a, b) => a + b, 0);

        const sliceSize = Math.max(1, Math.floor(data.length * 0.3));
        const firstSlice = economias.slice(0, sliceSize);
        const lastSlice = economias.slice(-sliceSize);
        const firstAvg = firstSlice.reduce((a, b) => a + b, 0) / firstSlice.length;
        const lastAvg = lastSlice.reduce((a, b) => a + b, 0) / lastSlice.length;
        const trendEconomia = firstAvg > 0 ? ((lastAvg - firstAvg) / firstAvg) * 100 : 0;

        return {
            avgEconomia,
            trendEconomia,
            totalEconomia
        };
    }, [data]);

    const formatCurrency = (value: number) => {
        return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    return (
        <Card className="bg-white dark:bg-[#1C1F26] border border-gray-200 dark:border-gray-700/30 shadow-sm dark:shadow-lg hover:shadow-md dark:hover:shadow-xl rounded-xl hover:border-gray-300 dark:hover:border-gray-600/50 transition-all duration-300">
            <CardHeader className="p-3 sm:p-4 pb-2 sm:pb-4 border-b border-gray-100 dark:border-gray-700/30">
                <div className="flex flex-col gap-2 sm:gap-3">
                    <div className="flex items-center justify-between gap-2">
                        <CardTitle className="flex items-center gap-2 sm:gap-3 text-sm sm:text-base">
                            <div className="p-1.5 sm:p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg shadow-sm">
                                <DollarSign className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" />
                            </div>
                            <span className="font-semibold text-gray-900 dark:text-white truncate">
                                Economia Gerada
                            </span>
                        </CardTitle>
                        <Select value={period} onValueChange={onPeriodChange}>
                            <SelectTrigger className="w-[100px] sm:w-[140px] h-8 sm:h-9 text-xs border-gray-200 dark:border-gray-700/60 hover:border-green-400 dark:hover:border-green-500">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="7d">7 dias</SelectItem>
                                <SelectItem value="1m">1 mês</SelectItem>
                                <SelectItem value="3m">3 meses</SelectItem>
                                <SelectItem value="6m">6 meses</SelectItem>
                                <SelectItem value="1y">1 ano</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    {data && data.length > 0 && (
                        <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-[10px] sm:text-xs">
                            <div className="flex items-center gap-1 sm:gap-2">
                                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                <span className="text-gray-600 dark:text-gray-400">Total:</span>
                                <span className="font-semibold text-gray-900 dark:text-white">
                                    {formatCurrency(stats.totalEconomia)}
                                </span>
                                <span className={`flex items-center gap-1 ${stats.trendEconomia >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                    {stats.trendEconomia >= 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                                    {Math.abs(stats.trendEconomia).toFixed(1)}%
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            </CardHeader>
            <CardContent className="p-2 sm:p-4">
                {isLoading ? (
                    <div className="flex items-center justify-center h-[200px] sm:h-[320px]">
                        <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-green-500" />
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height={isMobile ? 200 : 320}>
                        <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-700/20" opacity={0.3} vertical={false} />
                            <XAxis
                                dataKey={period === '7d' ? 'day' : 'month'}
                                stroke="#6b7280"
                                className="dark:stroke-gray-500"
                                style={{ fontSize: '12px', fontWeight: 500 }}
                                tickLine={false}
                                axisLine={{ stroke: '#e5e7eb', className: 'dark:stroke-gray-700/30' }}
                            />
                            <YAxis
                                stroke="#6b7280"
                                className="dark:stroke-gray-500"
                                style={{ fontSize: '12px', fontWeight: 500 }}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(value) => `R$ ${value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value}`}
                            />
                            <Tooltip
                                cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                                content={({ active, payload, label }) => {
                                    if (active && payload && payload.length) {
                                        return (
                                            <div className="bg-white dark:bg-[#1C1F26] p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700/30 backdrop-blur-sm">
                                                <p className="font-semibold text-gray-900 dark:text-white mb-2.5 text-sm">{label}</p>
                                                <div className="space-y-2">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-2 h-2 rounded-full bg-green-500" />
                                                        <span className="text-sm text-gray-600 dark:text-gray-400">Economia:</span>
                                                        <span className="font-semibold text-gray-900 dark:text-white">
                                                            {formatCurrency(payload[0].value as number)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    }
                                    return null;
                                }}
                            />
                            <Bar dataKey="economia" radius={[4, 4, 0, 0]}>
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.fill || '#10b981'} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </CardContent>
        </Card>
    );
}
