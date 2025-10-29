import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { TrendingUp, DollarSign, ShoppingCart, Users, BarChart3, Download, Loader2, Target, Award, Clock, CheckCircle, AlertCircle, XCircle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, Cell, ComposedChart, Area, ReferenceLine } from 'recharts';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { useDashboard } from '@/hooks/useDashboard';
import { capitalize } from '@/lib/text-utils';
import { CapitalizedText } from '@/components/ui/capitalized-text';

export default function Dashboard() {
  const [selectedPeriod, setSelectedPeriod] = useState('6m');
  const [evolutionPeriod, setEvolutionPeriod] = useState('7d');
  const [economyPeriod, setEconomyPeriod] = useState('7d');
  const [showReportModal, setShowReportModal] = useState(false);
  const {
    metrics = {
      cotacoesAtivas: 0,
      fornecedores: 0,
      economiaGerada: 0,
      produtosCotados: 0,
      taxaAtividade: 0,
      taxaAprovacao: 0,
      crescimentoCotacoes: 0,
      crescimentoEconomia: 0,
      ultimos7DiasCotacoes: [0, 0, 0, 0, 0, 0, 0]
    },
    recentQuotes = [],
    topSuppliers = [],
    monthlyData = [],
    dailyData = [],
    isLoading = false
  } = useDashboard() || {};

  // Função para filtrar dados por período
  const filterDataByPeriod = (period: string) => {
    if (period === '7d') {
      return dailyData;
    }
    const monthsMap: Record<string, number> = {
      '1m': 1,
      '3m': 3,
      '6m': 6,
      '1y': 12
    };
    const months = monthsMap[period] || 6;
    let filteredData = monthlyData.slice(-months);
    // For larger periods, filter to October onwards
    if (period === '1y') {
      filteredData = filteredData.filter((item: any) => {
        const monthIndex = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'].indexOf(item.month);
        return monthIndex >= 9; // October is index 9
      });
    }
    return filteredData;
  };

  // Dados filtrados por período
  const evolutionData = filterDataByPeriod(evolutionPeriod);
  const economyData = filterDataByPeriod(economyPeriod).map((item, index) => ({
    ...item,
    fill: ['#10b981', '#34d399', '#06b6d4', '#8b5cf6', '#f59e0b', '#ef4444'][index % 6]
  }));
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
      case 'aprovada':
      case 'finalizada':
      case 'concluida':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'pending':
      case 'pendente':
      case 'ativa':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'rejected':
      case 'cancelada':
      case 'expirada':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };
  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved':
      case 'aprovada':
        return 'Aprovada';
      case 'pending':
      case 'pendente':
        return 'Pendente';
      case 'ativa':
        return 'Ativa';
      case 'rejected':
        return 'Rejeitada';
      case 'cancelada':
        return 'Cancelada';
      case 'finalizada':
      case 'concluida':
        return 'Finalizada';
      case 'expirada':
        return 'Expirada';
      default:
        return status || 'Pendente';
    }
  };
  return <PageWrapper>
      <div className="page-container">
        {/* Métricas Principais - Estilo Apple */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 overflow-visible">
          {/* Card 1: Cotações Ativas */}
          <Card accent accentColor="bg-purple-500/15" className="group relative overflow-visible bg-white dark:bg-[#1C1F26] border border-sidebar-border shadow-sm dark:shadow-none hover:shadow-lg dark:hover:shadow-lg dark:hover:shadow-black/20 transition-all duration-300 hover:scale-[1.01] hover:border-gray-300 dark:hover:border-gray-600/50">
              <CardContent className="p-4">
                {/* Header com ícone minimalista */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-purple-500/10 flex items-center justify-center">
                      <ShoppingCart className="h-3.5 w-3.5 text-purple-600" />
                    </div>
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Cotações</span>
                  </div>
                  {metrics.crescimentoCotacoes !== 0 && (
                    <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full ${metrics.crescimentoCotacoes > 0 ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
                      <TrendingUp className={`h-2.5 w-2.5 ${metrics.crescimentoCotacoes > 0 ? 'text-green-600' : 'text-red-600 rotate-180'}`} />
                      <span className={`text-xs font-semibold ${metrics.crescimentoCotacoes > 0 ? 'text-green-600' : 'text-red-600'}`}>{Math.abs(metrics.crescimentoCotacoes)}%</span>
                    </div>
                  )}
                </div>

                {/* Valor principal */}
                <div className="mb-3">
                  <p className="metric-value">
                    {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : metrics.cotacoesAtivas}
                  </p>
                  <p className="metric-description mt-0.5">Ativas no Momento</p>
                </div>

                {/* Mini gráfico de barras - Últimos 7 dias */}
                <div className="flex items-end gap-0.5 h-8">
                  {(metrics.ultimos7DiasCotacoes || []).map((cotacoes, i) => {
                    const maxValue = Math.max(...(metrics.ultimos7DiasCotacoes || [0]), 1);
                    const heightPercent = maxValue > 0 ? (cotacoes / maxValue) * 100 : 20;
                    const cores = [
                      'from-purple-500 to-purple-400',
                      'from-violet-500 to-violet-400',
                      'from-purple-600 to-purple-500',
                      'from-indigo-500 to-indigo-400',
                      'from-purple-400 to-purple-300',
                      'from-violet-600 to-violet-500',
                      'from-purple-700 to-purple-600'
                    ];
                    const hoje = new Date();
                    const dia = new Date(hoje.getTime() - (6 - i) * 24 * 60 * 60 * 1000);
                    const diaNome = dia.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' });
                    
                    return (
                      <div 
                        key={i} 
                        className={`flex-1 bg-gradient-to-t ${cores[i]} rounded-t-lg opacity-60 hover:opacity-100 transition-opacity relative group cursor-pointer`} 
                        style={{ height: `${heightPercent}%`, minHeight: '8px' }}
                      >
                        <div className="absolute -top-14 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-[100]">
                          <div className="bg-white dark:bg-gray-800 px-2 py-1.5 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 whitespace-nowrap">
                            <div className="text-center">
                              <div className="text-[10px] text-gray-500 dark:text-gray-400">{diaNome}</div>
                              <div className="text-xs font-bold text-purple-600 dark:text-purple-400">{cotacoes} {cotacoes === 1 ? 'cotação' : 'cotações'}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
          </Card>

          {/* Card 2: Economia Gerada */}
          <Card accent accentColor="bg-green-500/15" className="group relative overflow-visible bg-white dark:bg-[#1C1F26] border border-sidebar-border shadow-sm dark:shadow-none hover:shadow-lg dark:hover:shadow-lg dark:hover:shadow-black/20 transition-all duration-300 hover:scale-[1.01] hover:border-gray-300 dark:hover:border-gray-600/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-green-500/10 flex items-center justify-center">
                      <DollarSign className="h-3.5 w-3.5 text-green-600" />
                    </div>
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Economia</span>
                  </div>
                  {metrics.crescimentoEconomia !== 0 && (
                    <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full ${metrics.crescimentoEconomia > 0 ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
                      <TrendingUp className={`h-2.5 w-2.5 ${metrics.crescimentoEconomia > 0 ? 'text-green-600' : 'text-red-600 rotate-180'}`} />
                      <span className={`text-xs font-semibold ${metrics.crescimentoEconomia > 0 ? 'text-green-600' : 'text-red-600'}`}>{Math.abs(metrics.crescimentoEconomia)}%</span>
                    </div>
                  )}
                </div>

                <div className="mb-3">
                  <p className="metric-value text-2xl">
                    {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : `R$ ${metrics.economiaGerada?.toLocaleString('pt-BR') || '0'}`}
                  </p>
                  <p className="metric-description mt-0.5">Economizados</p>
                </div>

                {/* Indicador de progresso */}
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-green-100 dark:bg-green-900/20 rounded-full overflow-hidden">
                    <div className="h-full w-[75%] bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"></div>
                  </div>
                  <span className="text-xs font-semibold text-green-600">+{metrics.crescimentoEconomia}%</span>
                </div>
              </CardContent>
          </Card>

          {/* Card 3: Fornecedores */}
          <Card accent accentColor="bg-blue-500/15" className="group relative overflow-visible bg-white dark:bg-[#1C1F26] border border-sidebar-border shadow-sm dark:shadow-none hover:shadow-lg dark:hover:shadow-lg dark:hover:shadow-black/20 transition-all duration-300 hover:scale-[1.01] hover:border-gray-300 dark:hover:border-gray-600/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-purple-500/10 flex items-center justify-center">
                      <Users className="h-3.5 w-3.5 text-purple-600" />
                    </div>
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Fornecedores</span>
                  </div>
                  <div className="flex items-center gap-1 px-1.5 py-0.5 bg-purple-50 dark:bg-purple-900/20 rounded-full">
                    <span className="text-xs font-semibold text-purple-600">+3</span>
                  </div>
                </div>

                <div className="mb-3">
                  <p className="metric-value">
                    {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : metrics.fornecedores}
                  </p>
                  <p className="metric-description mt-0.5">Parceiros</p>
                </div>

                {/* Mini indicador circular */}
                  <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-purple-600 to-purple-500 rounded-full transition-all duration-500" style={{ width: `${metrics.taxaAtividade}%` }}></div>
                  </div>
                  <span className="text-xs font-bold text-purple-600">{isLoading ? '-' : `${metrics.taxaAtividade}%`}</span>
                </div>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">taxa de atividade</p>
              </CardContent>
          </Card>

          {/* Card 4: Taxa de Aprovação */}
          <Card accent accentColor="bg-yellow-500/15" className="group relative overflow-visible bg-white dark:bg-[#1C1F26] border border-sidebar-border shadow-sm dark:shadow-none hover:shadow-lg dark:hover:shadow-lg dark:hover:shadow-black/20 transition-all duration-300 hover:scale-[1.01] hover:border-gray-300 dark:hover:border-gray-600/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-yellow-400/10 flex items-center justify-center">
                      <Target className="h-3.5 w-3.5 text-yellow-600" />
                    </div>
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Aprovação</span>
                  </div>
                  <div className="flex items-center gap-1 px-1.5 py-0.5 bg-green-50 dark:bg-green-900/20 rounded-full">
                    <TrendingUp className="h-2.5 w-2.5 text-green-600" />
                    <span className="text-xs font-semibold text-green-600">5%</span>
                  </div>
                </div>

                <div className="mb-3">
                  <p className="metric-value">
                    {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : `${metrics.taxaAprovacao}%`}
                  </p>
                  <p className="metric-description mt-0.5">De Aprovação</p>
                </div>

                {/* Barra de progresso */}
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-yellow-500 to-yellow-400 rounded-full transition-all duration-500" style={{ width: `${metrics.taxaAprovacao}%` }}></div>
                  </div>
                  <span className="text-xs font-semibold text-yellow-600">{metrics.taxaAprovacao}%</span>
                </div>
              </CardContent>
          </Card>
        </div>

        {/* Gráficos lado a lado - Gráfico maior, Card menor */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Gráfico de Evolução - 2 colunas */}
          <Card className="lg:col-span-2 bg-white dark:bg-[#1C1F26] border border-sidebar-border shadow-sm dark:shadow-none hover:shadow-md dark:hover:shadow-lg dark:hover:shadow-black/20 rounded-xl transition-all duration-300">
            <CardHeader className="pb-4 border-b border-gray-100 dark:border-gray-700/30">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <div className="p-2 bg-gradient-to-br from-purple-600 to-purple-500 rounded-lg shadow-md">
                    <BarChart3 className="h-4 w-4 text-white" />
                  </div>
                  <span className="font-bold text-gray-900 dark:text-white">
                    Evolução das Cotações
                  </span>
                </CardTitle>
                <Select value={evolutionPeriod} onValueChange={setEvolutionPeriod}>
                  <SelectTrigger className="w-[140px] h-9 text-xs border-gray-200/60 hover:border-purple-300/70">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7d">Últimos 7 dias</SelectItem>
                    <SelectItem value="1m">Último mês</SelectItem>
                    <SelectItem value="3m">3 meses</SelectItem>
                    <SelectItem value="6m">6 meses</SelectItem>
                    <SelectItem value="1y">1 ano</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? <div className="flex items-center justify-center h-[280px]">
                  <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
                </div> : evolutionData && evolutionData.length > 0 ? <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={evolutionData} margin={{
                top: 5,
                right: 20,
                left: 0,
                bottom: 5
              }}>
                    <defs>
                      <linearGradient id="colorCotacoes" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#7C3AED" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorFornecedores" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22C55E" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#22C55E" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-700/20" opacity={0.5} />
                    <XAxis dataKey={evolutionPeriod === '7d' ? 'day' : 'month'} stroke="#6b7280" className="dark:stroke-gray-500" style={{
                  fontSize: '12px',
                  fontWeight: 500
                }} tickLine={false} />
                    <YAxis stroke="#6b7280" className="dark:stroke-gray-500" style={{
                  fontSize: '12px',
                  fontWeight: 500
                }} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  padding: '8px 12px'
                }} labelStyle={{
                  fontWeight: 600,
                  color: '#374151'
                }} />
                    <Legend wrapperStyle={{
                  paddingTop: '10px'
                }} iconType="circle" />
                    <Line type="monotone" dataKey="cotacoes" stroke="#7C3AED" strokeWidth={3} name="Cotações" dot={{
                  fill: '#7C3AED',
                  strokeWidth: 2,
                  r: 4
                }} activeDot={{
                  r: 6,
                  strokeWidth: 2
                }} fill="url(#colorCotacoes)" />
                    <Line type="monotone" dataKey="fornecedores" stroke="#22C55E" strokeWidth={3} name="Fornecedores" dot={{
                  fill: '#22C55E',
                  strokeWidth: 2,
                  r: 4
                }} activeDot={{
                  r: 6,
                  strokeWidth: 2
                }} fill="url(#colorFornecedores)" />
                  </LineChart>
                </ResponsiveContainer> : <div className="flex items-center justify-center h-[280px] text-slate-500">
                  <div className="text-center">
                    <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p className="rounded-sm bg-white">Dados insuficientes para gráfico</p>
                  </div>
                </div>}
            </CardContent>
          </Card>

          {/* Top Fornecedores - 1 coluna - Estilo Apple */}
          <Card className="lg:col-span-1 bg-white dark:bg-[#1C1F26] border border-sidebar-border shadow-sm dark:shadow-none hover:shadow-md dark:hover:shadow-lg dark:hover:shadow-black/20 rounded-xl transition-all duration-300">
            <CardHeader className="pb-3 border-b border-gray-100 dark:border-gray-700/30">
              <CardTitle className="flex items-center gap-2 text-base">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-purple-500 rounded-lg flex items-center justify-center shadow-sm">
                  <Award className="h-4 w-4 text-white" />
                </div>
                <span className="font-bold text-gray-900 dark:text-white">Top Fornecedores</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {isLoading ? <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-amber-500" />
                </div> : topSuppliers.length > 0 ? topSuppliers.slice(0, 5).map((supplier, index) => <div key={index} className="group relative">
                    <div className="flex items-center justify-between p-3 bg-gradient-to-br from-gray-50 to-gray-100/50 dark:from-gray-800/30 dark:to-gray-800/20 rounded-lg hover:from-gray-100 hover:to-gray-200/50 dark:hover:from-gray-800/50 dark:hover:to-gray-800/30 transition-all duration-300 border border-gray-200 dark:border-gray-700/30 hover:border-gray-300 dark:hover:border-gray-600/50 hover:shadow-md">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className={`w-6 h-6 rounded-md flex items-center justify-center font-medium text-xs flex-shrink-0 transition-all ${index === 0 ? 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400' : index === 1 ? 'bg-slate-50 text-slate-600 dark:bg-slate-500/10 dark:text-slate-400' : index === 2 ? 'bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400' : 'bg-gray-50 text-gray-600 dark:bg-gray-500/10 dark:text-gray-400'}`}>
                          {index + 1}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="table-cell-primary truncate">{capitalize(supplier.name)}</p>
                          <p className="table-cell-secondary">{supplier.quotes} {supplier.quotes === 1 ? 'vitória' : 'vitórias'}</p>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0 ml-2">
                        <p className="font-bold text-green-600 dark:text-green-400 text-sm whitespace-nowrap">{supplier.savings ? String(supplier.savings) : '0%'}</p>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400">economia</p>
                      </div>
                    </div>
                  </div>) : <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <Users className="h-10 w-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Nenhum fornecedor encontrado</p>
                </div>}
            </CardContent>
          </Card>
        </div>

        {/* Economia Mensal e Cotações Recentes - Gráfico maior, Card menor */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Gráfico de Economia - 2 colunas */}
          <Card className="lg:col-span-2 bg-white dark:bg-[#1C1F26] border border-sidebar-border shadow-sm dark:shadow-none hover:shadow-md dark:hover:shadow-lg dark:hover:shadow-black/20 rounded-xl transition-all duration-300">
            <CardHeader className="pb-4 border-b border-gray-100 dark:border-gray-700/30">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <div className="p-2 bg-gradient-to-br from-green-600 to-green-500 rounded-lg shadow-md">
                    <DollarSign className="h-4 w-4 text-white" />
                  </div>
                  <span className="font-bold text-gray-900 dark:text-white">
                    Economia Mensal
                  </span>
                </CardTitle>
                <Select value={economyPeriod} onValueChange={setEconomyPeriod}>
                  <SelectTrigger className="w-[140px] h-9 text-xs border-gray-200/60 hover:border-green-300/70">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7d">Últimos 7 dias</SelectItem>
                    <SelectItem value="1m">Último mês</SelectItem>
                    <SelectItem value="3m">3 meses</SelectItem>
                    <SelectItem value="6m">6 meses</SelectItem>
                    <SelectItem value="1y">1 ano</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? <div className="flex items-center justify-center h-[280px]">
                  <Loader2 className="h-8 w-8 animate-spin text-green-500" />
                </div> : economyData && economyData.length > 0 ? <ResponsiveContainer width="100%" height={280}>
                  <ComposedChart data={economyData} margin={{
                top: 5,
                right: 20,
                left: 10,
                bottom: 5
              }}>
                    <defs>
                      <linearGradient id="economyGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22C55E" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#22C55E" stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-700/20" opacity={0.3} vertical={false} />
                    <XAxis 
                      dataKey={economyPeriod === '7d' ? 'day' : 'month'} 
                      stroke="#6b7280"
                      className="dark:stroke-gray-500"
                      style={{
                        fontSize: '12px',
                        fontWeight: 500
                      }} 
                      tickLine={false}
                      axisLine={{ stroke: '#e5e7eb' }}
                    />
                    <YAxis 
                      stroke="#6b7280"
                      className="dark:stroke-gray-500"
                      style={{
                        fontSize: '12px',
                        fontWeight: 500
                      }} 
                      tickLine={false} 
                      axisLine={false}
                      tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
                    />
                    <Tooltip 
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          // Encontrar os valores corretos de economia e cotações
                          const economiaItem = payload.find(p => p.dataKey === 'economia');
                          const cotacoesItem = payload.find(p => p.dataKey === 'cotacoes');
                          
                          return (
                            <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
                              <p className="font-semibold text-gray-900 dark:text-white mb-2">{label}</p>
                              <div className="space-y-1">
                                {economiaItem && (
                                  <div className="flex items-center justify-between gap-4">
                                    <span className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
                                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                      Economia
                                    </span>
                                    <span className="font-bold text-green-600 dark:text-green-400">
                                      R$ {economiaItem.value?.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0,00'}
                                    </span>
                                  </div>
                                )}
                                {cotacoesItem && (
                                  <div className="flex items-center justify-between gap-4">
                                    <span className="text-sm text-purple-600 dark:text-purple-400 flex items-center gap-1">
                                      <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                                      Cotações finalizadas
                                    </span>
                                    <span className="font-semibold text-purple-600 dark:text-purple-400">
                                      {cotacoesItem.value || 0}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend 
                      wrapperStyle={{
                        paddingTop: '15px'
                      }}
                      iconType="circle"
                    />
                    {/* Linha de meta (opcional) */}
                    <ReferenceLine 
                      y={5000} 
                      stroke="#FACC15" 
                      strokeDasharray="5 5" 
                      strokeWidth={2}
                      label={{ 
                        value: 'Meta: R$ 5k', 
                        position: 'right',
                        fill: '#FACC15',
                        fontSize: 11,
                        fontWeight: 600
                      }}
                    />
                    {/* Área com gradiente */}
                    <Area 
                      type="monotone" 
                      dataKey="economia" 
                      fill="url(#economyGradient)" 
                      stroke="none"
                      name="Economia"
                    />
                    {/* Linha de economia */}
                    <Line 
                      type="monotone" 
                      dataKey="economia" 
                      stroke="#22C55E" 
                      strokeWidth={3} 
                      name="Economia"
                      dot={{ 
                        fill: '#22C55E', 
                        strokeWidth: 2, 
                        r: 4,
                        stroke: '#fff'
                      }} 
                      activeDot={{ 
                        r: 6,
                        strokeWidth: 2,
                        stroke: '#fff'
                      }}
                    />
                    {/* Linha de cotações (contexto) */}
                    <Line 
                      type="monotone" 
                      dataKey="cotacoes" 
                      stroke="#7C3AED" 
                      strokeWidth={2} 
                      name="Cotações"
                      dot={{ 
                        fill: '#7C3AED', 
                        strokeWidth: 2, 
                        r: 3,
                        stroke: '#fff'
                      }}
                      yAxisId="right"
                      strokeDasharray="5 5"
                    />
                    <YAxis 
                      yAxisId="right" 
                      orientation="right"
                      stroke="#7C3AED"
                      style={{
                        fontSize: '12px',
                        fontWeight: 500
                      }}
                      tickLine={false}
                      axisLine={false}
                    />
                  </ComposedChart>
                </ResponsiveContainer> : <div className="flex items-center justify-center h-[280px] text-slate-500">
                  <div className="text-center">
                    <DollarSign className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Dados insuficientes para gráfico</p>
                  </div>
                </div>}
            </CardContent>
          </Card>

          {/* Cotações Recentes - 1 coluna - Estilo Apple */}
          <Card className="lg:col-span-1 bg-white dark:bg-[#1C1F26] border border-sidebar-border shadow-sm dark:shadow-none hover:shadow-md dark:hover:shadow-lg dark:hover:shadow-black/20 rounded-xl transition-all duration-300">
            <CardHeader className="pb-3 border-b border-gray-100 dark:border-gray-700/30">
              <CardTitle className="flex items-center gap-2 text-base">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-purple-500 rounded-lg flex items-center justify-center shadow-sm">
                  <Clock className="h-4 w-4 text-white" />
                </div>
                <span className="font-bold text-gray-900 dark:text-white">Cotações Recentes</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {isLoading ? <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                </div> : recentQuotes.length > 0 ? recentQuotes.slice(0, 5).map((quote, index) => <div key={quote.id || index} className="group relative">
                    <div className="flex items-center justify-between p-3 bg-gradient-to-br from-gray-50 to-gray-100/50 dark:from-gray-800/30 dark:to-gray-800/20 rounded-lg hover:from-gray-100 hover:to-gray-200/50 dark:hover:from-gray-800/50 dark:hover:to-gray-800/30 transition-all duration-300 border border-gray-200 dark:border-gray-700/30 hover:border-gray-300 dark:hover:border-gray-600/50 hover:shadow-md">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${quote.status === 'aprovada' || quote.status === 'approved' ? 'bg-emerald-100 dark:bg-emerald-900/30' : quote.status === 'pendente' || quote.status === 'pending' ? 'bg-amber-100 dark:bg-amber-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
                          {getStatusIcon(quote.status)}
                        </div>
                        <div className="min-w-0 flex-1 space-y-1">
                          <div title={quote.productFull}>
                            <CapitalizedText className="font-semibold text-gray-900 dark:text-white text-sm leading-tight truncate">
                              {quote.product}
                            </CapitalizedText>
                          </div>
                          <div title={quote.supplierFull}>
                            <CapitalizedText className="text-xs text-gray-500 dark:text-gray-400 leading-snug truncate">
                              {quote.supplier}
                            </CapitalizedText>
                          </div>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0 ml-2">
                        <p className="font-bold text-gray-900 dark:text-white text-sm whitespace-nowrap">R$ {quote.bestPrice || '0'}</p>
                        <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full mt-1 ${quote.status === 'aprovada' || quote.status === 'approved' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : quote.status === 'pendente' || quote.status === 'pending' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'}`}>
                          {getStatusText(quote.status)}
                        </span>
                      </div>
                    </div>
                  </div>) : <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <ShoppingCart className="h-10 w-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Nenhuma cotação encontrada</p>
                </div>}
            </CardContent>
          </Card>
        </div>

        {/* Modal de Relatório */}
        <Dialog open={showReportModal} onOpenChange={setShowReportModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Gerar Relatório
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Tipo de Relatório</label>
                <Select defaultValue="mensal">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mensal">Relatório Mensal</SelectItem>
                    <SelectItem value="trimestral">Relatório Trimestral</SelectItem>
                    <SelectItem value="anual">Relatório Anual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Formato</label>
                <Select defaultValue="pdf">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pdf">PDF</SelectItem>
                    <SelectItem value="excel">Excel</SelectItem>
                    <SelectItem value="csv">CSV</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2 pt-4">
                <Button variant="outline" onClick={() => setShowReportModal(false)} className="flex-1">
                  Cancelar
                </Button>
                <Button onClick={() => setShowReportModal(false)} className="flex-1">
                  Gerar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </PageWrapper>;
}