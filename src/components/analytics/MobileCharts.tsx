/**
 * MobileCharts - Simplified chart variants optimized for mobile devices
 * 
 * Features:
 * - Reduced data points for better performance
 * - Simplified legends and labels
 * - Touch-optimized interactions
 * - Smaller chart heights for mobile viewports
 * 
 * @module components/analytics/MobileCharts
 * Requirements: 6.2
 */

import { memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart3, TrendingUp, PieChart as PieChartIcon, Activity } from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface Fornecedor {
  fornecedor: string;
  score: number;
  cotacoes: number;
  economia: string;
  taxaResposta?: string;
  tempo: string;
}

interface TendenciaMensal {
  mes: string;
  cotacoes: number;
  economia: number;
  valor: number;
}

interface MobileChartsProps {
  performanceFornecedores: Fornecedor[];
  tendenciasMensais: TendenciaMensal[];
  isLoading?: boolean;
}

// Colors for charts
const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];

/**
 * Mobile-optimized skeleton for chart cards
 */
function MobileChartSkeleton() {
  return (
    <Card className="border border-gray-200 dark:border-gray-700/30">
      <CardHeader className="pb-2 px-3 pt-3">
        <Skeleton className="h-4 w-32" />
      </CardHeader>
      <CardContent className="px-3 pb-3">
        <Skeleton className="h-[150px] w-full" />
      </CardContent>
    </Card>
  );
}


/**
 * Simple mobile tooltip component
 */
function MobileTooltip({ active, payload, label }: any) {
  if (!active || !payload || payload.length === 0) return null;
  
  return (
    <div className="bg-white dark:bg-gray-800 p-2 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 text-xs">
      {label && <p className="font-medium text-gray-900 dark:text-white mb-1">{label}</p>}
      {payload.map((entry: any, index: number) => (
        <div key={index} className="flex items-center gap-2">
          <div 
            className="w-2 h-2 rounded-full" 
            style={{ backgroundColor: entry.color || COLORS[index % COLORS.length] }}
          />
          <span className="text-gray-600 dark:text-gray-400">{entry.name}:</span>
          <span className="font-medium" style={{ color: entry.color }}>
            {typeof entry.value === 'number' ? entry.value.toLocaleString('pt-BR') : entry.value}
          </span>
        </div>
      ))}
    </div>
  );
}

/**
 * MobileCharts - Simplified charts for mobile devices
 * 
 * Optimizations:
 * - Shows only top 3 items instead of top 5
 * - Reduced chart height (150px vs 300px)
 * - Simplified labels (truncated to 8 chars)
 * - No legends to save space
 * - Horizontal layout for bar charts
 */
export const MobileCharts = memo(function MobileCharts({
  performanceFornecedores,
  tendenciasMensais,
  isLoading = false,
}: MobileChartsProps) {
  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 mb-2">
          <Skeleton className="h-5 w-40" />
        </div>
        <div className="grid grid-cols-1 gap-3">
          <MobileChartSkeleton />
          <MobileChartSkeleton />
          <MobileChartSkeleton />
        </div>
      </div>
    );
  }

  // Limit data for mobile - only top 3 items
  const topFornecedores = performanceFornecedores.slice(0, 3).map(f => ({
    ...f,
    nome: f.fornecedor.substring(0, 8) + (f.fornecedor.length > 8 ? '...' : ''),
  }));

  // Limit monthly trends to last 4 months
  const recentTrends = tendenciasMensais.slice(-4).map(t => ({
    ...t,
    mesAbrev: t.mes.substring(0, 3),
  }));

  // Pie data for distribution
  const pieData = topFornecedores.map((f, index) => ({
    name: f.nome,
    value: f.score,
    color: COLORS[index % COLORS.length],
  }));

  const hasData = topFornecedores.length > 0 || recentTrends.length > 0;

  if (!hasData) {
    return (
      <Card className="border border-gray-200 dark:border-gray-700/30">
        <CardContent className="p-6 text-center">
          <BarChart3 className="h-10 w-10 mx-auto mb-2 text-gray-400" />
          <p className="text-sm text-gray-500">Nenhum dado disponível</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Activity className="h-4 w-4 text-purple-600" />
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
          Análise de Performance
        </h3>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {/* Top Fornecedores - Horizontal Bar Chart */}
        {topFornecedores.length > 0 && (
          <Card className="border-l-2 border-blue-500/60 border border-gray-200/60 dark:border-gray-700/30">
            <CardHeader className="pb-1 px-3 pt-3">
              <CardTitle className="text-xs font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                <BarChart3 className="h-3.5 w-3.5 text-blue-500" />
                Top Fornecedores
              </CardTitle>
            </CardHeader>
            <CardContent className="px-2 pb-2">
              <ResponsiveContainer width="100%" height={120}>
                <BarChart data={topFornecedores} layout="vertical" margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                  <XAxis type="number" domain={[0, 100]} hide />
                  <YAxis 
                    type="category" 
                    dataKey="nome" 
                    width={50}
                    tick={{ fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip content={<MobileTooltip />} />
                  <Bar dataKey="score" radius={[0, 4, 4, 0]} name="Score">
                    {topFornecedores.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Distribution Pie Chart */}
        {pieData.length > 0 && (
          <Card className="border-l-2 border-purple-500/60 border border-gray-200/60 dark:border-gray-700/30">
            <CardHeader className="pb-1 px-3 pt-3">
              <CardTitle className="text-xs font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                <PieChartIcon className="h-3.5 w-3.5 text-purple-500" />
                Distribuição
              </CardTitle>
            </CardHeader>
            <CardContent className="px-2 pb-2">
              <ResponsiveContainer width="100%" height={120}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={25}
                    outerRadius={45}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<MobileTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Monthly Trends - Line Chart */}
        {recentTrends.length > 0 && (
          <Card className="border-l-2 border-emerald-500/60 border border-gray-200/60 dark:border-gray-700/30">
            <CardHeader className="pb-1 px-3 pt-3">
              <CardTitle className="text-xs font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
                Tendência Mensal
              </CardTitle>
            </CardHeader>
            <CardContent className="px-2 pb-2">
              <ResponsiveContainer width="100%" height={120}>
                <LineChart data={recentTrends} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                  <XAxis 
                    dataKey="mesAbrev" 
                    tick={{ fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis hide />
                  <Tooltip content={<MobileTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="cotacoes"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={{ fill: '#10b981', r: 3 }}
                    name="Cotações"
                  />
                  <Line
                    type="monotone"
                    dataKey="economia"
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    dot={{ fill: '#8b5cf6', r: 3 }}
                    name="Economia %"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
});

export default MobileCharts;
