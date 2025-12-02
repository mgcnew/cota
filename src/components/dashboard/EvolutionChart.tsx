import { useMemo } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    ReferenceLine
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
            <CardContent className="p-1 sm:p-2 pt-2 sm:pt-3">
                {isLoading ? (
                    <div className="flex items-center justify-center h-[200px] sm:h-[320px]">
                        <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-purple-500" />
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height={isMobile ? 200 : 280}>
                        <LineChart data={data} margin={{ top: 5, right: 20, left: 5, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-700/30" opacity={0.4} vertical={false} />
                            <XAxis
                                dataKey={period === '7d' ? 'day' : 'month'}
                                stroke="#9ca3af"
                                fontSize={11}
                                tickLine={false}
                                axisLine={false}
                            />
                            <YAxis
                                stroke="#9ca3af"
                                fontSize={11}
                                tickLine={false}
                                axisLine={false}
                                width={35}
                            />
                            <ReferenceLine
                                y={stats.avgCotacoes}
                                stroke="#7C3AED"
                                strokeDasharray="4 4"
                                strokeWidth={1}
                                strokeOpacity={0.5}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'rgba(255,255,255,0.95)',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '8px',
                                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                                    fontSize: '12px'
                                }}
                                labelStyle={{ fontWeight: 600, marginBottom: '4px' }}
                            />
                            <Line
                                type="monotone"
                                dataKey="cotacoes"
                                name="Cotações"
                                stroke="#7C3AED"
                                strokeWidth={2.5}
                                dot={{ r: 4, fill: '#7C3AED', strokeWidth: 2, stroke: '#fff' }}
                                activeDot={{ r: 6, fill: '#7C3AED', strokeWidth: 2, stroke: '#fff' }}
                            />
                            <Line
                                type="monotone"
                                dataKey="fornecedores"
                                name="Fornecedores"
                                stroke="#22C55E"
                                strokeWidth={2.5}
                                dot={{ r: 4, fill: '#22C55E', strokeWidth: 2, stroke: '#fff' }}
                                activeDot={{ r: 6, fill: '#22C55E', strokeWidth: 2, stroke: '#fff' }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                )}
            </CardContent>
        </Card>
    );
}
