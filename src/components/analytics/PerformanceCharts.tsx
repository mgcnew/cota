import { memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, BarChart3 } from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  ComposedChart,
  Area,
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

interface PerformanceChartsProps {
  performanceFornecedores: Fornecedor[];
  tendenciasMensais: TendenciaMensal[];
  isLoading?: boolean;
}

/**
 * ChartSkeleton - Skeleton loader for individual chart cards
 * Requirements: 2.3, 6.3
 */
function ChartSkeleton({ title }: { title: string }) {
  return (
    <Card className="bg-white dark:bg-[#1C1F26] border border-gray-200/60 dark:border-gray-700/30 shadow-sm">
      <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-4 pt-3 sm:pt-4">
        <Skeleton className="h-5 w-48" />
      </CardHeader>
      <CardContent className="px-3 sm:px-4 pb-3 sm:pb-4">
        <div className="h-[250px] sm:h-[300px] flex flex-col justify-between">
          <div className="flex-1 flex items-center justify-center">
            <div className="w-full space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * PerformanceCharts - Componente memoizado para gráficos de performance
 * 
 * Usa React.memo para evitar re-renders desnecessários.
 * Requirements: 6.5
 */
export const PerformanceCharts = memo(function PerformanceCharts({
  performanceFornecedores,
  tendenciasMensais,
  isLoading = false,
}: PerformanceChartsProps) {
  const isMobile = false; // Removida dependência mobile
  
  // Componente para mensagem quando gráficos não estão disponíveis no mobile
  const MobilePlaceholder = ({ title }: { title: string }) => (
    <div className="flex items-center justify-center h-[250px] sm:h-[300px] text-slate-500">
      <div className="text-center">
        <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
        <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Use o desktop para visualizar os gráficos</p>
      </div>
    </div>
  );

  // Top 5 fornecedores
  const topFornecedores = performanceFornecedores.slice(0, 5);

  // Cores para os gráficos
  const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];

  // Dados para pizza chart - distribuição de scores
  const pieData = topFornecedores.map((f, index) => ({
    name: f.fornecedor.substring(0, 20) + (f.fornecedor.length > 20 ? '...' : ''),
    value: f.score,
    color: COLORS[index % COLORS.length],
    fullName: f.fornecedor,
  }));

  // Dados para economia total por fornecedor - extrair de "R$ X,XX"
  const economiaData = topFornecedores.map(f => {
    // Extrair valor numérico de "R$ X,XX" (formato brasileiro: R$ 1.234,56)
    let economiaNum = 0;
    if (f.economia) {
      if (f.economia.includes('R$')) {
        // Remove "R$" e espaços, depois trata separador decimal brasileiro
        let economiaStr = f.economia.replace(/[R$\s]/g, '').trim();
        // Se tem vírgula, é separador decimal brasileiro
        if (economiaStr.includes(',')) {
          // Remove pontos (milhares) e troca vírgula por ponto (decimal)
          economiaStr = economiaStr.replace(/\./g, '').replace(',', '.');
        }
        economiaNum = parseFloat(economiaStr) || 0;
      } else if (f.economia.includes('%')) {
        // Se for porcentagem (fallback)
        const economiaStr = f.economia.replace(/[%\s]/g, '').replace(',', '.');
        economiaNum = parseFloat(economiaStr) || 0;
      }
    }
    return {
      fornecedor: f.fornecedor.substring(0, 15) + (f.fornecedor.length > 15 ? '...' : ''),
      economia: economiaNum,
      fullName: f.fornecedor,
      score: f.score,
    };
  });

  // Dados para taxa de resposta por fornecedor - extrair de taxaResposta
  const taxaRespostaData = topFornecedores.map(f => {
    // Extrair taxa de resposta de taxaResposta (formato "XX%")
    let taxaResposta = 0;
    if (f.taxaResposta) {
      const taxaStr = f.taxaResposta.replace(/[%\s]/g, '').replace(',', '.');
      taxaResposta = parseFloat(taxaStr) || 0;
    } else {
      // Fallback: calcular a partir de cotacoes e respondidas se disponível
      // Isso não está disponível nos dados, então deixamos como 0
      taxaResposta = 0;
    }
    return {
      fornecedor: f.fornecedor.substring(0, 15) + (f.fornecedor.length > 15 ? '...' : ''),
      taxaResposta: taxaResposta,
      fullName: f.fornecedor,
      score: f.score,
    };
  });

  // Custom Tooltip Component
  const CustomTooltip = ({ active, payload, label, formatter }: any) => {
    if (!active || !payload || !Array.isArray(payload) || payload.length === 0) {
      return null;
    }

    return (
      <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 backdrop-blur-sm">
        {label && <p className="font-semibold text-gray-900 dark:text-white mb-2 text-sm">{label}</p>}
        <div className="space-y-1.5">
          {payload
            .filter((entry: any) => entry && entry.value !== undefined && entry.value !== null)
            .map((entry: any, index: number) => {
              const value = entry.value ?? 0;
              const name = entry.name || entry.dataKey || '';
              const color = entry.color || entry.fill || COLORS[index % COLORS.length];
              
              return (
                <div key={index} className="flex items-center justify-between gap-4">
                  <span className="text-sm flex items-center gap-1.5" style={{ color }}>
                    <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: color }}></div>
                    {name}
                  </span>
                  <span className="font-bold" style={{ color }}>
                    {formatter ? formatter(value, name, entry) : String(value)}
                  </span>
                </div>
              );
            })}
        </div>
      </div>
    );
  };

  // Verificar se há dados
  const hasData = topFornecedores.length > 0 || tendenciasMensais.length > 0;

  // Loading state with skeleton loaders
  if (isLoading) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <div>
          <Skeleton className="h-8 w-48 mb-1" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 lg:gap-4">
          <ChartSkeleton title="Top 5 Fornecedores" />
          <ChartSkeleton title="Distribuição de Performance" />
          <ChartSkeleton title="Evolução Mensal - Cotações" />
          <ChartSkeleton title="Evolução Mensal - Economia" />
          <ChartSkeleton title="Taxa de Resposta" />
          <ChartSkeleton title="Economia por Fornecedor" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-1">
          Análise de Performance
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Visualizações detalhadas de métricas e tendências
        </p>
      </div>

      {!hasData ? (
        <Card className="bg-white dark:bg-[#1C1F26] border border-gray-200/60 dark:border-gray-700/30 shadow-sm">
          <CardContent className="p-12 text-center">
            <BarChart3 className="h-16 w-16 mx-auto mb-4 text-gray-400 dark:text-gray-500" />
            <p className="text-base text-gray-600 dark:text-gray-400 mb-2">Nenhum dado disponível</p>
            <p className="text-sm text-gray-500 dark:text-gray-500">Não há dados para exibir nos gráficos no período selecionado</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 lg:gap-4">
        {/* Comparativo de Fornecedores */}
        <Card className="bg-white dark:bg-[#1C1F26] border-l-2 border-blue-500/60 dark:border-blue-400/60 border border-gray-200/60 dark:border-gray-700/30 shadow-sm dark:shadow-none sm:hover:shadow-md sm:dark:hover:shadow-lg transition-all duration-200">
          <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-4 pt-3 sm:pt-4">
            <CardTitle className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white">
              Top 5 Fornecedores - Score de Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 sm:px-4 pb-3 sm:pb-4">
            {topFornecedores.length === 0 ? (
              <div className="flex items-center justify-center h-[250px] sm:h-[300px]">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
              </div>
            ) : isMobile ? (
              <MobilePlaceholder title="Gráficos não disponíveis no mobile" />
            ) : (
              <ResponsiveContainer width="100%" height={250} className="sm:h-[300px]">
                <BarChart data={topFornecedores} layout="vertical" margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-700/20" opacity={0.3} />
                  <XAxis 
                    type="number" 
                    domain={[0, 100]} 
                    stroke="#6b7280"
                    className="dark:stroke-gray-500"
                    style={{ fontSize: '11px', fontWeight: 500 }}
                    tickLine={false}
                    axisLine={false}
                  />
                <YAxis 
                  type="category" 
                  dataKey="fornecedor" 
                    width={80}
                    stroke="#6b7280"
                    className="dark:stroke-gray-500"
                    tick={{ fontSize: '11px', fontWeight: 500 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                <Bar 
                  dataKey="score" 
                    radius={[0, 6, 6, 0]}
                    name="Score de Performance"
                    isAnimationActive={true}
                    animationDuration={800}
                >
                  {topFornecedores.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Pizza Chart - Distribuição de Performance */}
        <Card className="bg-white dark:bg-[#1C1F26] border-l-2 border-purple-500/60 dark:border-purple-400/60 border border-gray-200/60 dark:border-gray-700/30 shadow-sm dark:shadow-none sm:hover:shadow-md sm:dark:hover:shadow-lg transition-all duration-200">
          <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-4 pt-3 sm:pt-4">
            <CardTitle className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white">
              Distribuição de Performance - Top 5
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 sm:px-4 pb-3 sm:pb-4">
            {pieData.length === 0 ? (
              <div className="flex items-center justify-center h-[250px] sm:h-[300px]">
                <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
              </div>
            ) : isMobile ? (
              <MobilePlaceholder title="Gráficos não disponíveis no mobile" />
            ) : (
              <ResponsiveContainer width="100%" height={250} className="sm:h-[300px]">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                    label={({ name, percent }) => {
                      const label = name.length > 12 ? name.substring(0, 12) + '...' : name;
                      return `${label} (${(percent * 100).toFixed(0)}%)`;
                    }}
                    outerRadius={70}
                    innerRadius={25}
                  fill="#8884d8"
                  dataKey="value"
                    isAnimationActive={true}
                    animationDuration={800}
                >
                  {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="#fff" strokeWidth={2} />
                  ))}
                </Pie>
                  <Tooltip 
                    content={<CustomTooltip formatter={(value: number, name: string, entry: any) => {
                      // Para o gráfico de pizza, tentar obter nome completo
                      let fullName = name;
                      try {
                        if (entry?.payload?.fullName) {
                          fullName = entry.payload.fullName;
                        } else if (entry?.payload?.name) {
                          fullName = entry.payload.name;
                        }
                      } catch (e) {
                        // Ignorar erro e usar o nome padrão
                      }
                      return `Score: ${value.toFixed(1)}${fullName !== name ? ` (${fullName})` : ''}`;
                    }} />}
                  />
              </PieChart>
            </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Tendência Mensal - Cotações */}
        <Card className="bg-white dark:bg-[#1C1F26] border-l-2 border-emerald-500/60 dark:border-emerald-400/60 border border-gray-200/60 dark:border-gray-700/30 shadow-sm dark:shadow-none sm:hover:shadow-md sm:dark:hover:shadow-lg transition-all duration-200">
          <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-4 pt-3 sm:pt-4">
            <CardTitle className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white">
              Evolução Mensal - Número de Cotações
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 sm:px-4 pb-3 sm:pb-4">
            {tendenciasMensais.length === 0 ? (
              <div className="flex items-center justify-center h-[250px] sm:h-[300px]">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
              </div>
            ) : isMobile ? (
              <MobilePlaceholder title="Gráficos não disponíveis no mobile" />
            ) : (
              <ResponsiveContainer width="100%" height={250} className="sm:h-[300px]">
                <ComposedChart data={tendenciasMensais} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
                  <defs>
                    <linearGradient id="colorCotacoes" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-700/20" opacity={0.3} vertical={false} />
                <XAxis 
                  dataKey="mes" 
                    stroke="#6b7280"
                    className="dark:stroke-gray-500"
                    style={{ fontSize: '11px', fontWeight: 500 }}
                    tickLine={false}
                    axisLine={{ stroke: '#e5e7eb', className: 'dark:stroke-gray-700' }}
                  />
                  <YAxis 
                    stroke="#6b7280"
                    className="dark:stroke-gray-500"
                    style={{ fontSize: '11px', fontWeight: 500 }}
                    tickLine={false}
                    axisLine={false}
                  />
                <Tooltip 
                    content={<CustomTooltip formatter={(value: number) => `${value} cotações`} />}
                  />
                  <Legend 
                    wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }}
                    iconType="circle"
                    iconSize={8}
                  />
                  <Area
                    type="monotone"
                    dataKey="cotacoes"
                    fill="url(#colorCotacoes)"
                    stroke="none"
                    name="Cotações"
                    isAnimationActive={true}
                    animationDuration={800}
                  />
                <Line
                  type="monotone"
                  dataKey="cotacoes"
                    stroke="#10b981"
                    strokeWidth={3}
                  name="Cotações"
                    dot={{ 
                      fill: '#10b981', 
                      strokeWidth: 2, 
                      r: 4, 
                      stroke: '#fff',
                      className: 'drop-shadow-sm'
                    }}
                    activeDot={{ 
                      r: 7, 
                      strokeWidth: 3, 
                      stroke: '#fff', 
                      fill: '#10b981',
                      className: 'drop-shadow-md'
                    }}
                    isAnimationActive={true}
                    animationDuration={800}
                  />
                </ComposedChart>
            </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Tendência Mensal - Economia */}
        <Card className="bg-white dark:bg-[#1C1F26] border-l-2 border-green-500/60 dark:border-green-400/60 border border-gray-200/60 dark:border-gray-700/30 shadow-sm dark:shadow-none sm:hover:shadow-md sm:dark:hover:shadow-lg transition-all duration-200">
          <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-4 pt-3 sm:pt-4">
            <CardTitle className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white">
              Evolução Mensal - Taxa de Economia
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 sm:px-4 pb-3 sm:pb-4">
            {tendenciasMensais.length === 0 ? (
              <div className="flex items-center justify-center h-[250px] sm:h-[300px]">
                <Loader2 className="h-8 w-8 animate-spin text-green-500" />
              </div>
            ) : isMobile ? (
              <MobilePlaceholder title="Gráficos não disponíveis no mobile" />
            ) : (
              <ResponsiveContainer width="100%" height={250} className="sm:h-[300px]">
                <ComposedChart data={tendenciasMensais} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
                  <defs>
                    <linearGradient id="colorEconomia" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-700/20" opacity={0.3} vertical={false} />
                <XAxis 
                  dataKey="mes" 
                    stroke="#6b7280"
                    className="dark:stroke-gray-500"
                    style={{ fontSize: '11px', fontWeight: 500 }}
                    tickLine={false}
                    axisLine={{ stroke: '#e5e7eb', className: 'dark:stroke-gray-700' }}
                  />
                  <YAxis 
                    stroke="#6b7280"
                    className="dark:stroke-gray-500"
                    style={{ fontSize: '11px', fontWeight: 500 }}
                    tickLine={false}
                    axisLine={false}
                  />
                <Tooltip 
                    content={<CustomTooltip formatter={(value: number) => `${value.toFixed(1)}%`} />}
                  />
                  <Legend 
                    wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }}
                    iconType="circle"
                    iconSize={8}
                  />
                  <Area
                    type="monotone"
                    dataKey="economia"
                    fill="url(#colorEconomia)"
                    stroke="none"
                    name="Taxa de Economia (%)"
                    isAnimationActive={true}
                    animationDuration={800}
                  />
                <Line
                  type="monotone"
                  dataKey="economia"
                    stroke="#22c55e"
                    strokeWidth={3}
                  name="Taxa de Economia (%)"
                    dot={{ 
                      fill: '#22c55e', 
                      strokeWidth: 2, 
                      r: 4, 
                      stroke: '#fff',
                      className: 'drop-shadow-sm'
                    }}
                    activeDot={{ 
                      r: 7, 
                      strokeWidth: 3, 
                      stroke: '#fff', 
                      fill: '#22c55e',
                      className: 'drop-shadow-md'
                    }}
                    isAnimationActive={true}
                    animationDuration={800}
                  />
                </ComposedChart>
            </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Gráfico de Barras - Taxa de Resposta */}
        <Card className="bg-white dark:bg-[#1C1F26] border-l-2 border-indigo-500/60 dark:border-indigo-400/60 border border-gray-200/60 dark:border-gray-700/30 shadow-sm dark:shadow-none sm:hover:shadow-md sm:dark:hover:shadow-lg transition-all duration-200">
          <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-4 pt-3 sm:pt-4">
            <CardTitle className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white">
              Taxa de Resposta por Fornecedor
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 sm:px-4 pb-3 sm:pb-4">
            {taxaRespostaData.length === 0 ? (
              <div className="flex items-center justify-center h-[250px] sm:h-[300px]">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
              </div>
            ) : isMobile ? (
              <MobilePlaceholder title="Gráficos não disponíveis no mobile" />
            ) : (
              <ResponsiveContainer width="100%" height={250} className="sm:h-[300px]">
                <BarChart data={taxaRespostaData} margin={{ top: 10, right: 10, left: 0, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-700/20" opacity={0.3} vertical={false} />
                <XAxis 
                  dataKey="fornecedor" 
                    stroke="#6b7280"
                    className="dark:stroke-gray-500"
                    style={{ fontSize: '10px', fontWeight: 500 }}
                  angle={-45}
                  textAnchor="end"
                    height={80}
                    tickLine={false}
                    axisLine={{ stroke: '#e5e7eb', className: 'dark:stroke-gray-700' }}
                  />
                  <YAxis 
                    domain={[0, 100]} 
                    stroke="#6b7280"
                    className="dark:stroke-gray-500"
                    style={{ fontSize: '11px', fontWeight: 500 }}
                    tickLine={false}
                    axisLine={false}
                  />
                <Tooltip 
                    content={<CustomTooltip formatter={(value: number) => `${value.toFixed(1)}%`} />}
                  />
                  <Legend 
                    wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }}
                    iconType="circle"
                    iconSize={8}
                  />
                  <Bar 
                    dataKey="taxaResposta" 
                    radius={[6, 6, 0, 0]}
                    name="Taxa de Resposta (%)"
                    isAnimationActive={true}
                    animationDuration={800}
                  >
                    {taxaRespostaData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Novo Gráfico - Economia Total por Fornecedor */}
        <Card className="bg-white dark:bg-[#1C1F26] border-l-2 border-orange-500/60 dark:border-orange-400/60 border border-gray-200/60 dark:border-gray-700/30 shadow-sm dark:shadow-none sm:hover:shadow-md sm:dark:hover:shadow-lg transition-all duration-200">
          <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-4 pt-3 sm:pt-4">
            <CardTitle className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white">
              Economia Alcançada por Fornecedor
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 sm:px-4 pb-3 sm:pb-4">
            {economiaData.length === 0 ? (
              <div className="flex items-center justify-center h-[250px] sm:h-[300px]">
                <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
              </div>
            ) : isMobile ? (
              <MobilePlaceholder title="Gráficos não disponíveis no mobile" />
            ) : (
              <ResponsiveContainer width="100%" height={250} className="sm:h-[300px]">
                <BarChart data={economiaData} margin={{ top: 10, right: 10, left: 0, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-700/20" opacity={0.3} vertical={false} />
                <XAxis 
                  dataKey="fornecedor" 
                    stroke="#6b7280"
                    className="dark:stroke-gray-500"
                    style={{ fontSize: '10px', fontWeight: 500 }}
                  angle={-45}
                  textAnchor="end"
                    height={80}
                    tickLine={false}
                    axisLine={{ stroke: '#e5e7eb', className: 'dark:stroke-gray-700' }}
                  />
                  <YAxis 
                    stroke="#6b7280"
                    className="dark:stroke-gray-500"
                    style={{ fontSize: '11px', fontWeight: 500 }}
                    tickLine={false}
                    axisLine={false}
                  />
                <Tooltip 
                    content={<CustomTooltip formatter={(value: number) => {
                      // Economia sempre em reais
                      return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                    }} />}
                  />
                  <Legend 
                    wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }}
                    iconType="circle"
                    iconSize={8}
                  />
                <Bar 
                  dataKey="economia" 
                    radius={[6, 6, 0, 0]}
                    name="Economia Gerada"
                    isAnimationActive={true}
                    animationDuration={800}
                >
                  {economiaData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
      )}
    </div>
  );
});
