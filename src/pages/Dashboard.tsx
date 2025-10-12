import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  ShoppingCart, 
  Users, 
  Package,
  BarChart3,
  PieChart,
  Calendar,
  Download,
  Loader2,
  ArrowUpRight,
  ArrowDownRight,
  Target,
  Award,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart as RechartsPieChart, Cell } from 'recharts';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { useDashboard } from '@/hooks/useDashboard';

const COLORS = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];

export default function Dashboard() {
  const [selectedPeriod, setSelectedPeriod] = useState('6m');
  const [showReportModal, setShowReportModal] = useState(false);

  // Dados reais do sistema
  const { metrics, recentQuotes, topSuppliers, monthlyData, isLoading } = useDashboard();

  // Calcular taxa de aprovação baseada nos dados reais
  const taxaAprovacao = recentQuotes.length > 0 
    ? Math.round((recentQuotes.filter(q => q.status === 'aprovada' || q.status === 'approved').length / recentQuotes.length) * 100)
    : 0;

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <PageWrapper>
      <div className="page-container">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-1">Visão geral do sistema de cotações</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1m">Último mês</SelectItem>
                <SelectItem value="3m">Últimos 3 meses</SelectItem>
                <SelectItem value="6m">Últimos 6 meses</SelectItem>
                <SelectItem value="1y">Último ano</SelectItem>
              </SelectContent>
            </Select>
            <Button 
              onClick={() => setShowReportModal(true)}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Download className="h-4 w-4 mr-2" />
              Gerar Relatório
            </Button>
          </div>
        </div>

        {/* Métricas Principais - Otimizadas para 4 Cards Essenciais */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Card 1: Cotações Ativas */}
          <Card className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-blue-100 to-blue-200 border-0 shadow-lg hover:shadow-xl transition-all duration-300">
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

          {/* Card 2: Economia Gerada */}
          <Card className="relative overflow-hidden bg-gradient-to-br from-emerald-50 via-emerald-100 to-emerald-200 border-0 shadow-lg hover:shadow-xl transition-all duration-300">
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

          {/* Card 3: Fornecedores */}
          <Card className="relative overflow-hidden bg-gradient-to-br from-violet-50 via-violet-100 to-violet-200 border-0 shadow-lg hover:shadow-xl transition-all duration-300">
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

          {/* Card 4: Taxa de Aprovação */}
          <Card className="relative overflow-hidden bg-gradient-to-br from-amber-50 via-amber-100 to-amber-200 border-0 shadow-lg hover:shadow-xl transition-all duration-300">
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

        {/* Gráficos e Análises */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Gráfico de Evolução */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-purple-600" />
                Evolução das Cotações
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center h-[300px]">
                  <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
                </div>
              ) : monthlyData && monthlyData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="cotacoes" 
                      stroke="#8b5cf6" 
                      strokeWidth={3}
                      name="Cotações"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="fornecedores" 
                      stroke="#06b6d4" 
                      strokeWidth={3}
                      name="Fornecedores"
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[300px] text-slate-500">
                  <div className="text-center">
                    <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Dados insuficientes para gráfico</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Gráfico de Economia */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-600" />
                Economia Mensal
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center h-[300px]">
                  <Loader2 className="h-8 w-8 animate-spin text-green-500" />
                </div>
              ) : monthlyData && monthlyData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`R$ ${value?.toLocaleString('pt-BR') || '0'}`, 'Economia']} />
                    <Bar dataKey="economia" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[300px] text-slate-500">
                  <div className="text-center">
                    <DollarSign className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Dados insuficientes para gráfico</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Top Fornecedores e Cotações Recentes - Design Diferenciado */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* Top Fornecedores - Design Aprimorado */}
          <Card className="border-0 shadow-lg bg-gradient-to-br from-slate-50 to-slate-100">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="p-2 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg">
                  <Award className="h-5 w-5 text-white" />
                </div>
                <span className="bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent font-bold">
                  Top Fornecedores
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-yellow-500" />
                </div>
              ) : topSuppliers.length > 0 ? (
                topSuppliers.slice(0, 5).map((supplier, index) => (
                  <div key={index} className="group relative">
                    <div className="flex items-center justify-between p-4 bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-md hover:border-slate-300 transition-all duration-300">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg ${
                          index === 0 ? 'bg-gradient-to-r from-yellow-500 to-yellow-600' :
                          index === 1 ? 'bg-gradient-to-r from-gray-400 to-gray-500' :
                          index === 2 ? 'bg-gradient-to-r from-orange-500 to-orange-600' :
                          'bg-gradient-to-r from-slate-500 to-slate-600'
                        }`}>
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 group-hover:text-slate-700 transition-colors">{supplier.name}</p>
                          <p className="text-sm text-slate-600">{supplier.quotes} cotações realizadas</p>
                        </div>
                      </div>
                      <div className="text-right space-y-1">
                        <p className="font-bold text-emerald-600 text-lg">R$ {supplier.savings?.toLocaleString('pt-BR') || '0'}</p>
                        <div className="flex items-center justify-end gap-1">
                          <span className="text-xs text-slate-500">Economia gerada</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Nenhum fornecedor encontrado</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Cotações Recentes - Design Aprimorado */}
          <Card className="border-0 shadow-lg bg-gradient-to-br from-slate-50 to-slate-100">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="p-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg">
                  <Clock className="h-5 w-5 text-white" />
                </div>
                <span className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent font-bold">
                  Cotações Recentes
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                </div>
              ) : recentQuotes.length > 0 ? (
                recentQuotes.slice(0, 5).map((quote, index) => (
                  <div key={quote.id || index} className="group">
                    <div className="flex items-center justify-between p-4 bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-md hover:border-slate-300 transition-all duration-300">
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-lg ${
                          quote.status === 'aprovada' || quote.status === 'approved' ? 'bg-green-100' :
                          quote.status === 'pendente' || quote.status === 'pending' ? 'bg-yellow-100' :
                          'bg-red-100'
                        }`}>
                          {getStatusIcon(quote.status)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-slate-900 text-sm truncate group-hover:text-slate-700 transition-colors">
                            {quote.product}
                          </p>
                          <p className="text-xs text-slate-600 flex items-center gap-2">
                            <span>{quote.supplier}</span>
                            <span className="text-slate-400">•</span>
                            <span>{quote.date ? new Date(quote.date).toLocaleDateString('pt-BR') : 'Data não disponível'}</span>
                          </p>
                        </div>
                      </div>
                      <div className="text-right space-y-1">
                        <p className="font-bold text-slate-900">R$ {quote.value?.toLocaleString ? quote.value.toLocaleString('pt-BR') : quote.value || '0'}</p>
                        <Badge className={`text-xs font-medium ${
                          quote.status === 'aprovada' || quote.status === 'approved' ? 'bg-green-100 text-green-800 hover:bg-green-200' :
                          quote.status === 'pendente' || quote.status === 'pending' ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200' :
                          'bg-red-100 text-red-800 hover:bg-red-200'
                        }`}>
                          {getStatusText(quote.status)}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <ShoppingCart className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Nenhuma cotação encontrada</p>
                </div>
              )}
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
    </PageWrapper>
  );
}