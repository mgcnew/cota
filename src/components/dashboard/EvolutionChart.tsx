import { useMemo } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import {
    ComposedChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    ReferenceLine,
    Area
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart3, ArrowUp, ArrowDown, Loader2 } from 'lucide-react';

interface EvolutionChartProps {
    data: any[];
    period: string;
    onPeriodChange: (value: string) => void;
    isLoading?: boolean;
}

export function EvolutionChart({ data, period, onPeriodChange, isLoading }: EvolutionChartProps) {
    const isMobile = useIsMobile();

    const stats = useMemo(() => {
        if (!data || data.length === 0) {
            return {
                avgCotacoes: 0,
                avgFornecedores: 0,
                trendCotacoes: 0,
                trendFornecedores: 0
            };
        }

        const cotacoes = data.map(d => d.cotacoes || 0);
        const fornecedores = data.map(d => d.fornecedores || 0);

        const avgCotacoes = cotacoes.reduce((a, b) => a + b, 0) / cotacoes.length;
        const avgFornecedores = fornecedores.reduce((a, b) => a + b, 0) / fornecedores.length;

        const sliceSize = Math.max(1, Math.floor(data.length * 0.3));
        const firstSlice = cotacoes.slice(0, sliceSize);
        const lastSlice = cotacoes.slice(-sliceSize);
        const firstAvg = firstSlice.reduce((a, b) => a + b, 0) / firstSlice.length;
        const lastAvg = lastSlice.reduce((a, b) => a + b, 0) / lastSlice.length;
        const trendCotacoes = firstAvg > 0 ? ((lastAvg - firstAvg) / firstAvg) * 100 : 0;

        const firstSliceFornecedores = fornecedores.slice(0, sliceSize);
        const lastSliceFornecedores = fornecedores.slice(-sliceSize);
        const firstAvgFornecedores = firstSliceFornecedores.reduce((a, b) => a + b, 0) / firstSliceFornecedores.length;
        const lastAvgFornecedores = lastSliceFornecedores.reduce((a, b) => a + b, 0) / lastSliceFornecedores.length;
        const trendFornecedores = firstAvgFornecedores > 0 ? ((lastAvgFornecedores - firstAvgFornecedores) / firstAvgFornecedores) * 100 : 0;

        return {
            avgCotacoes,
            avgFornecedores,
            trendCotacoes,
            trendFornecedores
        };
    }, [data]);

    return (
        <Card className="col-span-1 lg:col-span-2 bg-white dark:bg-[#1C1F26] border border-gray-200 dark:border-gray-700/30 shadow-sm rounded-xl transition-all duration-300">
            <CardHeader className="p-3 sm:p-4 pb-2 sm:pb-4 border-b border-gray-100 dark:border-gray-700/30">
                <div className="flex flex-col gap-2 sm:gap-3">
                    <div className="flex items-center justify-between gap-2">
                        <CardTitle className="flex items-center gap-2 sm:gap-3 text-sm sm:text-base">
                            <div className="p-1.5 sm:p-2 bg-gradient-to-br from-primary to-primary-light rounded-lg shadow-sm">
                                <BarChart3 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" />
                            </div>
                            <span className="font-semibold text-gray-900 dark:text-white truncate">
                                Evolução das Cotações
                            </span>
                        </CardTitle>
                        <Select value={period} onValueChange={onPeriodChange}>
                            <SelectTrigger className="w-[100px] sm:w-[140px] h-8 sm:h-9 text-xs">
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
                                <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                                <span className="text-gray-600 dark:text-gray-400">Cotações:</span>
                                <span className="font-semibold text-gray-900 dark:text-white">
                                    {Math.round(stats.avgCotacoes)}
                                </span>
                                <span className={`flex items-center ${stats.trendCotacoes >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {stats.trendCotacoes >= 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                                    {Math.abs(stats.trendCotacoes).toFixed(0)}%
                                </span>
                            </div>
                            <div className="flex items-center gap-1 sm:gap-2">
                                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                <span className="text-gray-600 dark:text-gray-400">Fornec:</span>
                                <span className="font-semibold text-gray-900 dark:text-white">
                                    {Math.round(stats.avgFornecedores)}
                                </span>
                                <span className={`flex items-center ${stats.trendFornecedores >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {stats.trendFornecedores >= 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                                    {Math.abs(stats.trendFornecedores).toFixed(0)}%
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            </CardHeader>
            <CardContent className="p-2 sm:p-4">
                {isLoading ? (
                    <div className="flex items-center justify-center h-[200px] sm:h-[320px]">
                        <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-purple-500" />
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height={isMobile ? 200 : 320}>
                        <ComposedChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 10 }}>
                            <defs>
                                <linearGradient id="colorCotacoes" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.4} />
                                    <stop offset="95%" stopColor="#7C3AED" stopOpacity={0.05} />
                                </linearGradient>
                                <linearGradient id="colorFornecedores" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#22C55E" stopOpacity={0.35} />
                                    <stop offset="95%" stopColor="#22C55E" stopOpacity={0.05} />
                                </linearGradient>
                            </defs>
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
                                yAxisId="left"
                                stroke="#6b7280"
                                className="dark:stroke-gray-500"
                                style={{ fontSize: '12px', fontWeight: 500 }}
                                tickLine={false}
                                axisLine={false}
                            />
                            <YAxis
                                yAxisId="right"
                                orientation="right"
                                stroke="#22C55E"
                                className="dark:stroke-green-400"
                                style={{ fontSize: '12px', fontWeight: 500 }}
                                tickLine={false}
                                axisLine={false}
                            />
                            <ReferenceLine
                                yAxisId="left"
                                y={stats.avgCotacoes}
                                stroke="#7C3AED"
                                strokeDasharray="4 4"
                                strokeWidth={1.5}
                                strokeOpacity={0.6}
                            />
                            <ReferenceLine
                                yAxisId="right"
                                y={stats.avgFornecedores}
                                stroke="#22C55E"
                                strokeDasharray="4 4"
                                strokeWidth={1.5}
                                strokeOpacity={0.6}
                            />
                            <Tooltip
                                content={({ active, payload, label }) => {
                                    if (active && payload && payload.length) {
                                        return (
                                            <div className="bg-white dark:bg-[#1C1F26] p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700/30 backdrop-blur-sm">
                                                <p className="font-semibold text-gray-900 dark:text-white mb-2.5 text-sm">{label}</p>
                                                <div className="space-y-2">
                                                    {payload.map((entry: any, index: number) => (
                                                        <div key={index} className="flex items-center gap-2">
                                                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                                                            <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">{entry.name}:</span>
                                                            <span className="font-semibold text-gray-900 dark:text-white">{entry.value}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    }
                                    return null;
                                }}
                            />
                            <Area
                                yAxisId="left"
                                type="monotone"
                                dataKey="cotacoes"
                                name="Cotações"
                                stroke="#7C3AED"
                                strokeWidth={3}
                                fill="url(#colorCotacoes)"
                                activeDot={{ r: 6, strokeWidth: 0, fill: '#7C3AED' }}
                            />
                            <Bar
                                yAxisId="right"
                                dataKey="fornecedores"
                                name="Fornecedores"
                                fill="url(#colorFornecedores)"
                                radius={[4, 4, 0, 0]}
                                barSize={20}
                            />
                        </ComposedChart>
                    </ResponsiveContainer>
                )}
            </CardContent>
        </Card>
    );
}
