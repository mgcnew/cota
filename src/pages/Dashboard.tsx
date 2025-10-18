import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { TrendingUp, DollarSign, ShoppingCart, Users, BarChart3, Download, Loader2, Target, Award, Clock, CheckCircle, AlertCircle, XCircle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { useDashboard } from '@/hooks/useDashboard';
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
      produtosCotados: 0
    },
    recentQuotes = [],
    topSuppliers = [],
    monthlyData = [],
    dailyData = [],
    isLoading = false
  } = useDashboard() || {};
  const taxaAprovacao = recentQuotes.length > 0 ? Math.round(recentQuotes.filter(q => q.status === 'aprovada' || q.status === 'approved').length / recentQuotes.length * 100) : 0;

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
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };
  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved':
        return 'Aprovada';
      case 'pending':
        return 'Pendente';
      case 'rejected':
        return 'Rejeitada';
      default:
        return 'Desconhecido';
    }
  };
  return <PageWrapper>
      {/* Header - Mesma largura do topbar */}
      <div className="mx-2 md:mx-0 md:ml-2 md:mr-2 mb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-4 md:px-6 pt-6 pb-4 border border-gray-200/60 rounded-lg backdrop-blur-sm hover:border hover:border-gray-300/20 shadow-sm transition-all duration-300">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-1">Visão geral do sistema de cotações</p>
          </div>
        </div>
      </div>

      <div className="page-container px-0">

        {/* Métricas Principais */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <Card className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-blue-100 to-blue-200 border-0 shadow-xl hover:shadow-md hover:brightness-95 transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-blue-700 text-sm font-semibold tracking-wide uppercase">Cotações Ativas</p>
                  <p className="text-3xl font-bold text-blue-900">
                    {isLoading ? <Loader2 className="h-8 w-8 animate-spin" /> : metrics.cotacoesAtivas}
                  </p>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center px-2 py-1 bg-green-100 rounded-full">
                      <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
                      <span className="text-xs font-medium text-green-700">+12%</span>
                    </div>
                    <span className="text-xs text-blue-600">vs mês anterior</span>
                  </div>
                </div>
                <div className="p-3 bg-blue-600 rounded-xl shadow-lg">
                  <ShoppingCart className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="absolute -bottom-2 -right-2 w-20 h-20 bg-blue-300 rounded-full opacity-20"></div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden bg-gradient-to-br from-emerald-50 via-emerald-100 to-emerald-200 border-0 shadow-xl hover:shadow-md hover:brightness-95 transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-emerald-700 text-sm font-semibold tracking-wide uppercase">Economia Gerada</p>
                  <p className="text-3xl font-bold text-emerald-900">
                    {isLoading ? <Loader2 className="h-8 w-8 animate-spin" /> : `R$ ${metrics.economiaGerada?.toLocaleString('pt-BR') || '0'}`}
                  </p>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center px-2 py-1 bg-green-100 rounded-full">
                      <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
                      <span className="text-xs font-medium text-green-700">+18%</span>
                    </div>
                    <span className="text-xs text-emerald-600">vs mês anterior</span>
                  </div>
                </div>
                <div className="p-3 bg-emerald-600 rounded-xl shadow-lg">
                  <DollarSign className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="absolute -bottom-2 -right-2 w-20 h-20 bg-emerald-300 rounded-full opacity-20"></div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden bg-gradient-to-br from-violet-50 via-violet-100 to-violet-200 border-0 shadow-xl hover:shadow-md hover:brightness-95 transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-violet-700 text-sm font-semibold tracking-wide uppercase">Fornecedores</p>
                  <p className="text-3xl font-bold text-violet-900">
                    {isLoading ? <Loader2 className="h-8 w-8 animate-spin" /> : metrics.fornecedores}
                  </p>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center px-2 py-1 bg-green-100 rounded-full">
                      <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
                      <span className="text-xs font-medium text-green-700">+3</span>
                    </div>
                    <span className="text-xs text-violet-600">novos este mês</span>
                  </div>
                </div>
                <div className="p-3 bg-violet-600 rounded-xl shadow-lg">
                  <Users className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="absolute -bottom-2 -right-2 w-20 h-20 bg-violet-300 rounded-full opacity-20"></div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden bg-gradient-to-br from-amber-50 via-amber-100 to-amber-200 border-0 shadow-xl hover:shadow-md hover:brightness-95 transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-amber-700 text-sm font-semibold tracking-wide uppercase">Taxa Aprovação</p>
                  <p className="text-3xl font-bold text-amber-900">
                    {isLoading ? <Loader2 className="h-8 w-8 animate-spin" /> : `${taxaAprovacao}%`}
                  </p>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center px-2 py-1 bg-green-100 rounded-full">
                      <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
                      <span className="text-xs font-medium text-green-700">+5%</span>
                    </div>
                    <span className="text-xs text-amber-600">vs mês anterior</span>
                  </div>
                </div>
                <div className="p-3 bg-amber-600 rounded-xl shadow-lg">
                  <Target className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="absolute -bottom-2 -right-2 w-20 h-20 bg-amber-300 rounded-full opacity-20"></div>
            </CardContent>
          </Card>
        </div>

        {/* Gráficos lado a lado - Gráfico maior, Card menor */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Gráfico de Evolução - 2 colunas */}
          <Card className="lg:col-span-2 bg-gradient-to-br from-purple-50/50 via-white to-blue-50/50 backdrop-blur-xl border border-gray-200/60 hover:border-purple-300/70 hover:border shadow-lg hover:shadow-md rounded-xl transition-all duration-300">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <div className="p-2 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg shadow-md">
                    <BarChart3 className="h-4 w-4 text-white" />
                  </div>
                  <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent font-bold">
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
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorFornecedores" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
                    <XAxis dataKey={evolutionPeriod === '7d' ? 'day' : 'month'} stroke="#6b7280" style={{
                  fontSize: '12px',
                  fontWeight: 500
                }} tickLine={false} />
                    <YAxis stroke="#6b7280" style={{
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
                    <Line type="monotone" dataKey="cotacoes" stroke="#8b5cf6" strokeWidth={3} name="Cotações" dot={{
                  fill: '#8b5cf6',
                  strokeWidth: 2,
                  r: 4
                }} activeDot={{
                  r: 6,
                  strokeWidth: 2
                }} fill="url(#colorCotacoes)" />
                    <Line type="monotone" dataKey="fornecedores" stroke="#06b6d4" strokeWidth={3} name="Fornecedores" dot={{
                  fill: '#06b6d4',
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

          {/* Top Fornecedores - 1 coluna */}
          <Card className="lg:col-span-1 bg-white/80 backdrop-blur-xl border border-gray-200/60 hover:border-gray-300/70 hover:border shadow-lg hover:shadow-md rounded-xl transition-all duration-300">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-lg">
                <div className="p-2 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg">
                  <Award className="h-4 w-4 text-white" />
                </div>
                <span className="bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent font-bold">
                  Top Fornecedores
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {isLoading ? <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-yellow-500" />
                </div> : topSuppliers.length > 0 ? topSuppliers.slice(0, 5).map((supplier, index) => <div key={index} className="group">
                    <div className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm border border-slate-200/60 hover:shadow-md hover:border-slate-300/70 transition-all duration-300">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-md ${index === 0 ? 'bg-gradient-to-r from-yellow-500 to-yellow-600' : index === 1 ? 'bg-gradient-to-r from-gray-400 to-gray-500' : index === 2 ? 'bg-gradient-to-r from-orange-500 to-orange-600' : 'bg-gradient-to-r from-slate-500 to-slate-600'}`}>
                          {index + 1}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900 text-sm truncate group-hover:text-slate-700 transition-colors">{supplier.name}</p>
                          <p className="text-xs text-slate-600">{supplier.quotes} cotações</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-emerald-600 text-sm">R$ {supplier.savings ? String(supplier.savings) : '0'}</p>
                      </div>
                    </div>
                  </div>) : <div className="text-center py-8 text-slate-500">
                  <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Nenhum fornecedor encontrado</p>
                </div>}
            </CardContent>
          </Card>
        </div>

        {/* Economia Mensal e Cotações Recentes - Gráfico maior, Card menor */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Gráfico de Economia - 2 colunas */}
          <Card className="lg:col-span-2 bg-gradient-to-br from-emerald-50/50 via-white to-green-50/50 backdrop-blur-xl border border-gray-200/60 hover:border-emerald-300/70 hover:border shadow-lg hover:shadow-md rounded-xl transition-all duration-300">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <div className="p-2 bg-gradient-to-br from-emerald-500 to-green-600 rounded-lg shadow-md">
                    <DollarSign className="h-4 w-4 text-white" />
                  </div>
                  <span className="bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent font-bold">
                    Economia Mensal
                  </span>
                </CardTitle>
                <Select value={economyPeriod} onValueChange={setEconomyPeriod}>
                  <SelectTrigger className="w-[140px] h-9 text-xs border-gray-200/60 hover:border-emerald-300/70">
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
                  <BarChart data={economyData} margin={{
                top: 5,
                right: 20,
                left: 0,
                bottom: 5
              }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
                    <XAxis dataKey={economyPeriod === '7d' ? 'day' : 'month'} stroke="#6b7280" style={{
                  fontSize: '12px',
                  fontWeight: 500
                }} tickLine={false} />
                    <YAxis stroke="#6b7280" style={{
                  fontSize: '12px',
                  fontWeight: 500
                }} tickLine={false} axisLine={false} />
                    <Tooltip formatter={value => [`R$ ${value?.toLocaleString('pt-BR') || '0'}`, 'Economia']} contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  padding: '8px 12px'
                }} labelStyle={{
                  fontWeight: 600,
                  color: '#374151'
                }} />
                    <Bar dataKey="economia" radius={[8, 8, 0, 0]} maxBarSize={60}>
                      {economyData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer> : <div className="flex items-center justify-center h-[280px] text-slate-500">
                  <div className="text-center">
                    <DollarSign className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Dados insuficientes para gráfico</p>
                  </div>
                </div>}
            </CardContent>
          </Card>

          {/* Cotações Recentes - 1 coluna */}
          <Card className="lg:col-span-1 bg-white/80 backdrop-blur-xl border border-gray-200/60 hover:border-gray-300/70 hover:border shadow-lg hover:shadow-md rounded-xl transition-all duration-300">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-lg">
                <div className="p-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg">
                  <Clock className="h-4 w-4 text-white" />
                </div>
                <span className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent font-bold">
                  Cotações Recentes
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {isLoading ? <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                </div> : recentQuotes.length > 0 ? recentQuotes.slice(0, 5).map((quote, index) => <div key={quote.id || index} className="group">
                    <div className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm border border-slate-200/60 hover:shadow-md hover:border-slate-300/70 transition-all duration-300">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className={`p-1.5 rounded-lg ${quote.status === 'aprovada' || quote.status === 'approved' ? 'bg-green-100' : quote.status === 'pendente' || quote.status === 'pending' ? 'bg-yellow-100' : 'bg-red-100'}`}>
                          {getStatusIcon(quote.status)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-slate-900 text-sm truncate group-hover:text-slate-700 transition-colors">
                            {quote.product}
                          </p>
                          <p className="text-xs text-slate-600 truncate">{quote.supplier}</p>
                        </div>
                      </div>
                      <div className="text-right ml-2">
                        <p className="font-bold text-slate-900 text-sm">R$ {quote.bestPrice || '0'}</p>
                        <Badge className={`text-xs font-medium mt-1 ${quote.status === 'aprovada' || quote.status === 'approved' ? 'bg-green-100 text-green-800' : quote.status === 'pendente' || quote.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                          {getStatusText(quote.status)}
                        </Badge>
                      </div>
                    </div>
                  </div>) : <div className="text-center py-8 text-slate-500">
                  <ShoppingCart className="h-12 w-12 mx-auto mb-2 opacity-50" />
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