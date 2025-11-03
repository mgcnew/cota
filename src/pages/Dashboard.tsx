import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tooltip as UiTooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, DollarSign, ShoppingCart, Users, BarChart3, Download, Loader2, Target, Award, Clock, CheckCircle, AlertCircle, XCircle, Info, ArrowUp, ArrowDown, MoreHorizontal, ChevronLeft, ChevronRight } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, BarChart, Bar, Cell, ComposedChart, Area, ReferenceLine } from 'recharts';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { useDashboard } from '@/hooks/useDashboard';
import { capitalize } from '@/lib/text-utils';
import { CapitalizedText } from '@/components/ui/capitalized-text';
import { useMobile } from '@/contexts/MobileProvider';

const DEFAULT_METRICS = {
  cotacoesAtivas: 0,
  fornecedores: 0,
  economiaGerada: 0,
  economiaPotencial: 0,
  eficienciaEconomia: 0,
  competitividadeMedia: 0,
  mediaFornecedoresParticipantes: 0,
  produtosCotados: 0,
  taxaAtividade: 0,
  taxaAprovacao: 0,
  taxaAprovacaoAnterior: 0,
  variacaoTaxaAprovacao: 0,
  aprovacoesTotal: 0,
  pendenciasTotal: 0,
  rejeicoesTotal: 0,
  aprovacoesMesAtual: 0,
  aprovacoesMesAnterior: 0,
  pendenciasAtrasadas: 0,
  taxaAprovacaoMeta: 0,
  ultimasRejeicoes: [] as Array<{ id: string; product: string; supplier: string; status: string; date: string }>,
  approvalHistory: [] as Array<{ label: string; taxa: number; aprovadas: number; total: number }>,
  crescimentoCotacoes: 0,
  crescimentoEconomia: 0,
  economiaPotencialCrescimento: 0,
  ultimos7DiasCotacoes: [0, 0, 0, 0, 0, 0, 0],
  economiaPorPeriodo: [] as Array<{ key: string; label: string; economiaRealizada: number; economiaPotencial: number; eficienciaEconomia: number; }>,
};

export default function Dashboard() {
  const [selectedPeriod, setSelectedPeriod] = useState('6m');
  const [evolutionPeriod, setEvolutionPeriod] = useState('7d');
  const [economyPeriod, setEconomyPeriod] = useState('7d');
  const [showReportModal, setShowReportModal] = useState(false);
  const [showEconomyModal, setShowEconomyModal] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showCotacoesModal, setShowCotacoesModal] = useState(false);
  const [approvalModalTab, setApprovalModalTab] = useState('resumo');
  const [showFullApprovalHistory, setShowFullApprovalHistory] = useState(false);
  const [economyModalPeriod, setEconomyModalPeriod] = useState('current');
  const [activeCardIndex, setActiveCardIndex] = useState(0);

  const navigate = useNavigate();
  const isMobile = useMobile();

  const dashboardData = useDashboard();
  const metrics = dashboardData?.metrics ?? DEFAULT_METRICS;
  const recentQuotes = dashboardData?.recentQuotes ?? [];
  const topSuppliers = dashboardData?.topSuppliers ?? [];
  const monthlyData = dashboardData?.monthlyData ?? [];
  const dailyData = dashboardData?.dailyData ?? [];
  const isLoading = dashboardData?.isLoading ?? false;

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

  const formatCurrency = (value?: number) => {
    const safeValue = Number.isFinite(value) ? Number(value) : 0;
    return `R$ ${safeValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatPercent = (value?: number) => {
    if (!Number.isFinite(value)) return '0%';
    return `${Math.round(value || 0)}%`;
  };

  // Dados filtrados por período
  const evolutionData = filterDataByPeriod(evolutionPeriod);
  const economyData = filterDataByPeriod(economyPeriod).map((item, index) => ({
    ...item,
    fill: ['#10b981', '#34d399', '#06b6d4', '#8b5cf6', '#f59e0b', '#ef4444'][index % 6]
  }));

  const economyBreakdowns = useMemo(() => {
    if (metrics.economiaPorPeriodo && metrics.economiaPorPeriodo.length > 0) {
      return metrics.economiaPorPeriodo;
    }

    return [
      {
        key: 'current',
        label: 'Mês atual',
        economiaRealizada: metrics.economiaGerada || 0,
        economiaPotencial: metrics.economiaPotencial || 0,
        eficienciaEconomia: metrics.eficienciaEconomia || 0,
      },
    ];
  }, [
    metrics.economiaPorPeriodo,
    metrics.economiaGerada,
    metrics.economiaPotencial,
    metrics.eficienciaEconomia,
  ]);

  useEffect(() => {
    if (!showEconomyModal) {
      setEconomyModalPeriod('current');
    } else if (!economyModalPeriod && economyBreakdowns.length > 0) {
      setEconomyModalPeriod(economyBreakdowns[0].key);
    }
  }, [showEconomyModal, economyBreakdowns, economyModalPeriod]);

  useEffect(() => {
    if (!showApprovalModal) {
      setApprovalModalTab('resumo');
      setShowFullApprovalHistory(false);
    }
  }, [showApprovalModal]);

  const selectedEconomyBreakdown = useMemo(() => {
    const found = economyBreakdowns.find((item) => item.key === economyModalPeriod);
    return found || economyBreakdowns[0];
  }, [economyBreakdowns, economyModalPeriod]);

  const selectedEconomyLabel = selectedEconomyBreakdown?.label || 'Mês atual';
  const approvalTarget = metrics.taxaAprovacaoMeta ?? 0;
  const isApprovalOnTarget = metrics.taxaAprovacao >= approvalTarget;
  const totalStatusCount = (metrics.aprovacoesTotal || 0) + (metrics.pendenciasTotal || 0) + (metrics.rejeicoesTotal || 0);
  const approvalHistory = metrics.approvalHistory || [];
  const approvalHistoryVisible = useMemo(() => {
    if (!approvalHistory || approvalHistory.length === 0) return [];
    if (showFullApprovalHistory) return approvalHistory;
    const start = Math.max(approvalHistory.length - 3, 0);
    return approvalHistory.slice(start);
  }, [approvalHistory, showFullApprovalHistory]);
  const approvalHistoryHasMore = approvalHistory.length > approvalHistoryVisible.length;
  const dailyCotacoesTarget = 20;
  const totalCotacoesSemana = useMemo(() => {
    if (!metrics.ultimos7DiasCotacoes || metrics.ultimos7DiasCotacoes.length === 0) return 0;
    return metrics.ultimos7DiasCotacoes.reduce((acc, value) => acc + value, 0);
  }, [metrics.ultimos7DiasCotacoes]);
  const mediaCotacoesDiaria = metrics.ultimos7DiasCotacoes && metrics.ultimos7DiasCotacoes.length > 0
    ? Math.round(totalCotacoesSemana / metrics.ultimos7DiasCotacoes.length)
    : 0;
  const metaCotacoesAtingida = mediaCotacoesDiaria >= dailyCotacoesTarget;
  const cotacoesLabels = useMemo(() => {
    const values = metrics.ultimos7DiasCotacoes || [];
    const hoje = new Date();
    return values.map((_, index) => {
      const dia = new Date(hoje.getTime() - (6 - index) * 24 * 60 * 60 * 1000);
      return dia.toLocaleDateString('pt-BR', { weekday: 'short' });
    });
  }, [metrics.ultimos7DiasCotacoes]);
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
  // Helper function para renderizar Card 1 - Cotações Ativas
  const renderCard1 = () => (
    <Card className="group relative overflow-hidden bg-purple-600 dark:bg-[#1C1F26] border-0 shadow-lg dark:shadow-xl sm:hover:shadow-xl sm:dark:hover:shadow-2xl rounded-xl sm:transition-all sm:duration-300">
      <svg
        className="absolute right-0 top-0 h-full w-2/3 pointer-events-none opacity-10 dark:opacity-5"
        viewBox="0 0 300 200"
        fill="none"
        style={{ zIndex: 0 }}
      >
        <circle cx="220" cy="100" r="90" fill="#fff" fillOpacity="0.08" />
        <circle cx="260" cy="60" r="60" fill="#fff" fillOpacity="0.10" />
        <circle cx="200" cy="160" r="50" fill="#fff" fillOpacity="0.07" />
        <circle cx="270" cy="150" r="30" fill="#fff" fillOpacity="0.12" />
      </svg>
      <CardHeader className="border-0 z-10 relative pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-white/70 dark:text-gray-400" />
            <CardTitle className="text-white/90 dark:text-gray-300 text-sm font-medium">
              Cotações Ativas
            </CardTitle>
                    </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-white/80 hover:text-white dark:text-gray-400 dark:hover:text-white">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" side="bottom">
              <DropdownMenuItem onClick={() => setShowCotacoesModal(true)}>
                <Info className="h-4 w-4 mr-2" /> Ver Detalhes
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
                      </div>
      </CardHeader>
      <CardContent className="space-y-2.5 z-10 relative">
        <div className="flex items-center gap-2.5">
          <span className="text-2xl font-semibold tracking-tight text-white dark:text-white">
            {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : metrics.cotacoesAtivas}
          </span>
          {metrics.crescimentoCotacoes !== 0 && (
                    <TooltipProvider>
                      <UiTooltip>
                        <TooltipTrigger asChild>
                  <Badge className="bg-white/20 text-white font-semibold border-0 cursor-help">
                    {metrics.crescimentoCotacoes > 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                    {Math.abs(metrics.crescimentoCotacoes)}%
                  </Badge>
                        </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Crescimento comparado ao mês anterior</p>
                        </TooltipContent>
                      </UiTooltip>
                    </TooltipProvider>
          )}
                </div>
        <div className="text-xs text-white/80 dark:text-gray-400 mt-2 border-t border-white/20 dark:border-gray-700/30 pt-2.5">
          <div className="flex items-center justify-between">
            <span>Vs mês anterior:</span>
            <span className="font-medium text-white dark:text-gray-300">
              {Math.round(metrics.cotacoesAtivas / (1 + metrics.crescimentoCotacoes / 100))}
            </span>
                  </div>
          {metrics.produtosCotados > 0 && (
            <div className="flex items-center justify-between mt-1.5 text-white/70 dark:text-gray-500">
              <span>Produtos cotados:</span>
              <span className="font-medium">{metrics.produtosCotados}</span>
                  </div>
          )}
                </div>
              </CardContent>
          </Card>
  );

  // Helper function para renderizar Card 2 - Economia Gerada
  const renderCard2 = () => (
    <Card className="group relative overflow-hidden bg-emerald-600 dark:bg-[#1C1F26] border-0 shadow-lg dark:shadow-xl sm:hover:shadow-xl sm:dark:hover:shadow-2xl rounded-xl sm:transition-all sm:duration-300">
      <svg
        className="absolute right-0 top-0 w-48 h-48 pointer-events-none opacity-10 dark:opacity-5"
        viewBox="0 0 200 200"
        fill="none"
        style={{ zIndex: 0 }}
      >
        <defs>
          <filter id="blur2" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="10" />
          </filter>
        </defs>
        <ellipse cx="170" cy="60" rx="40" ry="18" fill="#fff" fillOpacity="0.13" filter="url(#blur2)" />
        <rect x="120" y="20" width="60" height="20" rx="8" fill="#fff" fillOpacity="0.10" />
        <polygon points="150,0 200,0 200,50" fill="#fff" fillOpacity="0.07" />
        <circle cx="180" cy="100" r="14" fill="#fff" fillOpacity="0.16" />
      </svg>
      <CardHeader className="border-0 z-10 relative pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-white/70 dark:text-gray-400" />
            <CardTitle className="text-white/90 dark:text-gray-300 text-sm font-medium">
              Economia Gerada
            </CardTitle>
                    </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-white/80 hover:text-white dark:text-gray-400 dark:hover:text-white">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" side="bottom">
              <DropdownMenuItem onClick={() => setShowEconomyModal(true)}>
                <Info className="h-4 w-4 mr-2" /> Ver Detalhes
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
                      </div>
      </CardHeader>
      <CardContent className="space-y-2.5 z-10 relative">
        <div className="flex items-center gap-2.5">
          <span className="text-2xl font-semibold tracking-tight text-white dark:text-white">
            {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : formatCurrency(selectedEconomyBreakdown?.economiaRealizada)}
          </span>
          {metrics.crescimentoEconomia !== 0 && (
                    <TooltipProvider>
                      <UiTooltip>
                        <TooltipTrigger asChild>
                  <Badge className="bg-white/20 text-white font-semibold border-0 cursor-help">
                    {metrics.crescimentoEconomia > 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                    {Math.abs(metrics.crescimentoEconomia)}%
                  </Badge>
                        </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Crescimento comparado ao mês anterior</p>
                        </TooltipContent>
                      </UiTooltip>
                    </TooltipProvider>
          )}
                </div>
        <div className="text-xs text-white/80 dark:text-gray-400 mt-2 border-t border-white/20 dark:border-gray-700/30 pt-2.5">
          <div className="flex items-center justify-between">
            <span>Vs mês anterior:</span>
            <span className="font-medium text-white dark:text-gray-300">
              {formatCurrency((selectedEconomyBreakdown?.economiaRealizada || 0) / (1 + (metrics.crescimentoEconomia || 0) / 100))}
            </span>
                  </div>
          {metrics.eficienciaEconomia > 0 && (
            <div className="flex items-center justify-between mt-1.5 text-white/70 dark:text-gray-500">
              <span>Eficiência:</span>
              <span className="font-medium">{formatPercent(metrics.eficienciaEconomia)}</span>
                  </div>
          )}
                </div>
      </CardContent>
    </Card>
  );

  // Helper function para renderizar Card 3 - Fornecedores
  const renderCard3 = () => (
    <Card className="group relative overflow-hidden bg-indigo-600 dark:bg-[#1C1F26] border-0 shadow-lg dark:shadow-xl sm:hover:shadow-xl sm:dark:hover:shadow-2xl rounded-xl sm:transition-all sm:duration-300">
      <svg
        className="absolute right-0 top-0 w-48 h-48 pointer-events-none opacity-10 dark:opacity-5"
        viewBox="0 0 200 200"
        fill="none"
        style={{ zIndex: 0 }}
      >
        <defs>
          <filter id="blur3" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="12" />
          </filter>
        </defs>
        <rect x="120" y="0" width="70" height="70" rx="35" fill="#fff" fillOpacity="0.09" filter="url(#blur3)" />
        <ellipse cx="170" cy="80" rx="28" ry="12" fill="#fff" fillOpacity="0.12" />
        <polygon points="200,0 200,60 140,0" fill="#fff" fillOpacity="0.07" />
        <circle cx="150" cy="30" r="10" fill="#fff" fillOpacity="0.15" />
      </svg>
      <CardHeader className="border-0 z-10 relative pb-3">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-white/70 dark:text-gray-400" />
          <CardTitle className="text-white/90 dark:text-gray-300 text-sm font-medium">
            Fornecedores
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-2.5 z-10 relative">
        <div className="flex items-center gap-2.5">
          <span className="text-2xl font-semibold tracking-tight text-white dark:text-white">
            {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : metrics.fornecedores}
          </span>
                  <TooltipProvider>
                    <UiTooltip>
                      <TooltipTrigger asChild>
                <Badge className="bg-white/20 text-white font-semibold border-0 cursor-help">
                  <ArrowUp className="w-3 h-3" />
                  +{isLoading ? '-' : metrics.taxaAtividade}%
                </Badge>
                      </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">Taxa de atividade dos fornecedores</p>
                      </TooltipContent>
                    </UiTooltip>
                  </TooltipProvider>
                </div>
        <div className="text-xs text-white/80 dark:text-gray-400 mt-2 border-t border-white/20 dark:border-gray-700/30 pt-2.5">
          <div className="flex items-center justify-between">
            <span>Taxa de atividade:</span>
            <span className="font-medium text-white dark:text-gray-300">
              {isLoading ? '-' : `${metrics.taxaAtividade}%`}
            </span>
                    </div>
          {metrics.mediaFornecedoresParticipantes > 0 && (
            <div className="flex items-center justify-between mt-1.5 text-white/70 dark:text-gray-500">
              <span>Média participantes:</span>
              <span className="font-medium">{metrics.mediaFornecedoresParticipantes.toFixed(1)}</span>
                  </div>
          )}
                  </div>
      </CardContent>
    </Card>
  );

  // Helper function para renderizar Card 4 - Taxa de Aprovação
  const renderCard4 = () => (
    <Card className="group relative overflow-hidden bg-yellow-600 dark:bg-[#1C1F26] border-0 shadow-lg dark:shadow-xl sm:hover:shadow-xl sm:dark:hover:shadow-2xl rounded-xl sm:transition-all sm:duration-300">
      <svg
        className="absolute right-0 top-0 w-48 h-48 pointer-events-none opacity-10 dark:opacity-5"
        viewBox="0 0 200 200"
        fill="none"
        style={{ zIndex: 0 }}
      >
        <defs>
          <filter id="blur4" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="16" />
          </filter>
        </defs>
        <polygon points="200,0 200,100 100,0" fill="#fff" fillOpacity="0.09" />
        <ellipse cx="170" cy="40" rx="30" ry="18" fill="#fff" fillOpacity="0.13" filter="url(#blur4)" />
        <rect x="140" y="60" width="40" height="18" rx="8" fill="#fff" fillOpacity="0.10" />
        <circle cx="150" cy="30" r="14" fill="#fff" fillOpacity="0.18" />
        <line x1="120" y1="0" x2="200" y2="80" stroke="#fff" strokeOpacity="0.08" strokeWidth="6" />
      </svg>
      <CardHeader className="border-0 z-10 relative pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-white/70 dark:text-gray-400" />
            <CardTitle className="text-white/90 dark:text-gray-300 text-sm font-medium">
              Taxa de Aprovação
            </CardTitle>
                  </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-white/80 hover:text-white dark:text-gray-400 dark:hover:text-white">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" side="bottom">
              <DropdownMenuItem onClick={() => setShowApprovalModal(true)}>
                <Info className="h-4 w-4 mr-2" /> Ver Detalhes
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
                  </div>
      </CardHeader>
      <CardContent className="space-y-2.5 z-10 relative">
        <div className="flex items-center gap-2.5">
          <span className="text-2xl font-semibold tracking-tight text-white dark:text-white">
            {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : `${metrics.taxaAprovacao || 0}%`}
          </span>
          {metrics.variacaoTaxaAprovacao !== 0 && (
                  <TooltipProvider>
                    <UiTooltip>
                      <TooltipTrigger asChild>
                  <Badge className="bg-white/20 text-white font-semibold border-0 cursor-help">
                    {metrics.variacaoTaxaAprovacao > 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                    {metrics.variacaoTaxaAprovacao > 0 ? '+' : ''}{Math.abs(metrics.variacaoTaxaAprovacao || 0)}%
                  </Badge>
                      </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Variação comparada ao mês anterior</p>
                      </TooltipContent>
                    </UiTooltip>
                  </TooltipProvider>
          )}
                </div>
        <div className="text-xs text-white/80 dark:text-gray-400 mt-2 border-t border-white/20 dark:border-gray-700/30 pt-2.5">
          <div className="flex items-center justify-between">
            <span>Vs mês anterior:</span>
            <span className="font-medium text-white dark:text-gray-300">
              {metrics.taxaAprovacaoAnterior || 0}%
            </span>
                    </div>
          {(metrics.aprovacoesTotal > 0 || metrics.pendenciasTotal > 0 || metrics.rejeicoesTotal > 0) && (
            <div className="flex items-center gap-2 mt-1.5 text-white/70 dark:text-gray-500">
              {metrics.aprovacoesTotal > 0 && (
                <span className="flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  <span>{metrics.aprovacoesTotal}</span>
                </span>
              )}
              {metrics.pendenciasTotal > 0 && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>{metrics.pendenciasTotal}</span>
                </span>
              )}
              {metrics.rejeicoesTotal > 0 && (
                <span className="flex items-center gap-1">
                  <XCircle className="w-3 h-3" />
                  <span>{metrics.rejeicoesTotal}</span>
                </span>
              )}
                      </div>
                    )}
                </div>
      </CardContent>
    </Card>
  );

  return <PageWrapper>
      <div className="page-container">
        {/* Métricas Principais - Inspiração 21st.dev Statistics Card 2 */}
        {/* Desktop: Grid 2x2 ou 4 colunas | Mobile: Carousel com navegação integrada */}
        {isMobile ? (
          <div className="mb-8">
            {/* Card wrapper com navegação integrada no topo */}
            <div className="relative">
              {/* Navegação integrada no topo do card (parece ser parte do card) */}
              <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-center gap-2 pt-3 pb-2 px-4">
                      <Button
                        variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveCardIndex((prev) => (prev === 0 ? 3 : prev - 1));
                  }}
                  className="h-8 w-8 p-0 rounded-full bg-white/20 dark:bg-gray-900/40 hover:bg-white/30 dark:hover:bg-gray-900/60 text-white dark:text-gray-200 backdrop-blur-sm border border-white/30 dark:border-gray-700/50 shadow-lg"
                >
                  <ChevronLeft className="h-4 w-4" />
                      </Button>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/20 dark:bg-gray-900/40 backdrop-blur-sm border border-white/30 dark:border-gray-700/50 shadow-lg">
                  <span className="text-xs font-semibold text-white dark:text-gray-200">
                    {activeCardIndex + 1} / 4
                  </span>
              </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveCardIndex((prev) => (prev === 3 ? 0 : prev + 1));
                  }}
                  className="h-8 w-8 p-0 rounded-full bg-white/20 dark:bg-gray-900/40 hover:bg-white/30 dark:hover:bg-gray-900/60 text-white dark:text-gray-200 backdrop-blur-sm border border-white/30 dark:border-gray-700/50 shadow-lg"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              {/* Container do carousel */}
              <div className="relative overflow-hidden rounded-xl" style={{ minHeight: '180px' }}>
                <div 
                  className="flex transition-transform duration-300 ease-in-out"
                  style={{ 
                    transform: `translateX(-${activeCardIndex * 100}%)`,
                  }}
                >
                  <div className="w-full flex-shrink-0">
                    {renderCard1()}
                        </div>
                  <div className="w-full flex-shrink-0">
                    {renderCard2()}
                      </div>
                  <div className="w-full flex-shrink-0">
                    {renderCard3()}
                        </div>
                  <div className="w-full flex-shrink-0">
                    {renderCard4()}
                          </div>
                        </div>
                      </div>
              </div>
        </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 lg:gap-6 mb-8 overflow-visible">
            {renderCard1()}
            {renderCard2()}
            {renderCard3()}
            {renderCard4()}
          </div>
        )}

        {/* Gráficos lado a lado - Gráfico maior, Card menor */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Gráfico de Evolução - 2 colunas */}
          <Card className="lg:col-span-2 bg-white dark:bg-[#1C1F26] border border-gray-200 dark:border-gray-700/30 shadow-sm dark:shadow-lg hover:shadow-md dark:hover:shadow-xl rounded-xl hover:border-gray-300 dark:hover:border-gray-600/50 transition-all duration-300">
            <CardHeader className="pb-4 border-b border-gray-100 dark:border-gray-700/30">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-3 text-base">
                  <div className="p-2 bg-gradient-to-br from-purple-600 to-purple-500 rounded-lg shadow-sm">
                    <BarChart3 className="h-4 w-4 text-white" />
                  </div>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    Evolução das Cotações
                  </span>
                </CardTitle>
                <Select value={evolutionPeriod} onValueChange={setEvolutionPeriod}>
                  <SelectTrigger className="w-[140px] h-9 text-xs border-gray-200 dark:border-gray-700/60 hover:border-purple-400 dark:hover:border-purple-500">
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
              {isLoading ? <div className="flex items-center justify-center h-[320px]">
                  <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
                </div> : isMobile ? <div className="flex items-center justify-center h-[320px] text-slate-500">
                  <div className="text-center">
                    <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">Gráficos não disponíveis no mobile</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Use o desktop para visualizar os gráficos</p>
                  </div>
                </div> : evolutionData && evolutionData.length > 0 ? <ResponsiveContainer width="100%" height={320}>
                  <ComposedChart data={evolutionData} margin={{
                top: 10,
                right: 30,
                left: 0,
                bottom: 10
              }}>
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
                      dataKey={evolutionPeriod === '7d' ? 'day' : 'month'} 
                      stroke="#6b7280" 
                      className="dark:stroke-gray-500" 
                      style={{
                        fontSize: '12px',
                        fontWeight: 500
                      }} 
                      tickLine={false}
                      axisLine={{ stroke: '#e5e7eb', className: 'dark:stroke-gray-700/30' }}
                    />
                    <YAxis 
                      yAxisId="left"
                      stroke="#6b7280" 
                      className="dark:stroke-gray-500" 
                      style={{
                        fontSize: '12px',
                        fontWeight: 500
                      }} 
                      tickLine={false} 
                      axisLine={false}
                    />
                    <YAxis 
                      yAxisId="right"
                      orientation="right"
                      stroke="#22C55E"
                      className="dark:stroke-green-400"
                      style={{
                        fontSize: '12px',
                        fontWeight: 500
                      }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <RechartsTooltip 
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          const cotacoesItem = payload.find(p => p.dataKey === 'cotacoes');
                          const fornecedoresItem = payload.find(p => p.dataKey === 'fornecedores');
                          
                          return (
                            <div className="bg-white dark:bg-[#1C1F26] p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700/30 backdrop-blur-sm">
                              <p className="font-semibold text-gray-900 dark:text-white mb-2.5 text-sm">{label}</p>
                              <div className="space-y-1.5">
                                {cotacoesItem && (
                                  <div className="flex items-center justify-between gap-4">
                                    <span className="text-sm text-purple-600 dark:text-purple-400 flex items-center gap-1.5">
                                      <div className="w-2.5 h-2.5 rounded-full bg-purple-500 shadow-sm"></div>
                                      Cotações
                                    </span>
                                    <span className="font-bold text-purple-600 dark:text-purple-400">
                                      {cotacoesItem.value || 0}
                                    </span>
                                  </div>
                                )}
                                {fornecedoresItem && (
                                  <div className="flex items-center justify-between gap-4">
                                    <span className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1.5">
                                      <div className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-sm"></div>
                                      Fornecedores
                                    </span>
                                    <span className="font-bold text-green-600 dark:text-green-400">
                                      {fornecedoresItem.value || 0}
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
                      iconSize={8}
                    />
                    {/* Área de Cotações com gradiente */}
                    <Area 
                      type="monotone" 
                      dataKey="cotacoes" 
                      fill="url(#colorCotacoes)" 
                      stroke="none"
                      yAxisId="left"
                      name="Cotações"
                      isAnimationActive={true}
                      animationDuration={800}
                    />
                    {/* Linha de Cotações */}
                    <Line 
                      type="monotone" 
                      dataKey="cotacoes" 
                      stroke="#7C3AED" 
                      strokeWidth={3} 
                      name="Cotações"
                      yAxisId="left"
                      dot={{ 
                        fill: '#7C3AED', 
                        strokeWidth: 2, 
                        r: 4,
                        stroke: '#fff',
                        className: 'drop-shadow-sm'
                      }} 
                      activeDot={{ 
                        r: 7,
                        strokeWidth: 3,
                        stroke: '#fff',
                        fill: '#7C3AED',
                        className: 'drop-shadow-md'
                      }}
                      isAnimationActive={true}
                      animationDuration={800}
                    />
                    {/* Área de Fornecedores com gradiente */}
                    <Area 
                      type="monotone" 
                      dataKey="fornecedores" 
                      fill="url(#colorFornecedores)" 
                      stroke="none"
                      yAxisId="right"
                      name="Fornecedores"
                      isAnimationActive={true}
                      animationDuration={1000}
                    />
                    {/* Linha de Fornecedores */}
                    <Line 
                      type="monotone" 
                      dataKey="fornecedores" 
                      stroke="#22C55E" 
                      strokeWidth={3} 
                      name="Fornecedores"
                      yAxisId="right"
                      dot={{ 
                        fill: '#22C55E', 
                        strokeWidth: 2, 
                        r: 4,
                        stroke: '#fff',
                        className: 'drop-shadow-sm'
                      }} 
                      activeDot={{ 
                        r: 7,
                        strokeWidth: 3,
                        stroke: '#fff',
                        fill: '#22C55E',
                        className: 'drop-shadow-md'
                      }}
                      isAnimationActive={true}
                      animationDuration={1000}
                    />
                  </ComposedChart>
                </ResponsiveContainer> : <div className="flex items-center justify-center h-[320px] text-slate-500">
                  <div className="text-center">
                    <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">Dados insuficientes para gráfico</p>
                  </div>
                </div>}
            </CardContent>
          </Card>

          {/* Top Fornecedores - 1 coluna - Estilo Refinado */}
          <Card className="lg:col-span-1 bg-white dark:bg-[#1C1F26] border border-gray-200 dark:border-gray-700/30 shadow-sm dark:shadow-lg hover:shadow-md dark:hover:shadow-xl rounded-xl hover:border-gray-300 dark:hover:border-gray-600/50 transition-all duration-300">
            <CardHeader className="pb-3 border-b border-gray-100 dark:border-gray-700/30">
              <CardTitle className="flex items-center gap-3 text-base">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-purple-500 rounded-lg flex items-center justify-center shadow-sm">
                  <Award className="h-4 w-4 text-white" />
                </div>
                <span className="font-semibold text-gray-900 dark:text-white">Top Fornecedores</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5 pt-4">
              {isLoading ? <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-purple-500" />
                </div> : topSuppliers.length > 0 ? topSuppliers.slice(0, 5).map((supplier, index) => <div key={index} className="group">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50/50 dark:bg-gray-800/30 hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-all duration-200 border border-transparent hover:border-gray-200 dark:hover:border-gray-700/30">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className={`w-7 h-7 rounded-md flex items-center justify-center font-semibold text-xs flex-shrink-0 ${index === 0 ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30' : index === 1 ? 'bg-slate-100 text-slate-700 dark:bg-slate-500/20 dark:text-slate-400 border border-slate-200 dark:border-slate-500/30' : index === 2 ? 'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400 border border-orange-200 dark:border-orange-500/30' : 'bg-gray-100 text-gray-700 dark:bg-gray-700/50 dark:text-gray-400 border border-gray-200 dark:border-gray-600/50'}`}>
                          {index + 1}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-gray-900 dark:text-white text-sm truncate">{capitalize(supplier.name)}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{supplier.quotes} {supplier.quotes === 1 ? 'vitória' : 'vitórias'}</p>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0 ml-3">
                        <p className="font-semibold text-green-600 dark:text-green-400 text-sm whitespace-nowrap">{supplier.savings ? String(supplier.savings) : '0%'}</p>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">economia</p>
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
          <Card className="lg:col-span-2 bg-white dark:bg-[#1C1F26] border border-gray-200 dark:border-gray-700/30 shadow-sm dark:shadow-lg hover:shadow-md dark:hover:shadow-xl rounded-xl hover:border-gray-300 dark:hover:border-gray-600/50 transition-all duration-300">
            <CardHeader className="pb-4 border-b border-gray-100 dark:border-gray-700/30">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-3 text-base">
                  <div className="p-2 bg-gradient-to-br from-green-600 to-green-500 rounded-lg shadow-sm">
                    <DollarSign className="h-4 w-4 text-white" />
                  </div>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    Economia Mensal
                  </span>
                </CardTitle>
                <Select value={economyPeriod} onValueChange={setEconomyPeriod}>
                  <SelectTrigger className="w-[140px] h-9 text-xs border-gray-200 dark:border-gray-700/60 hover:border-green-400 dark:hover:border-green-500">
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
                </div> : isMobile ? <div className="flex items-center justify-center h-[280px] text-slate-500">
                  <div className="text-center">
                    <DollarSign className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">Gráficos não disponíveis no mobile</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Use o desktop para visualizar os gráficos</p>
                  </div>
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
                    <RechartsTooltip 
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          // Encontrar os valores corretos de economia e cotações
                          const economiaItem = payload.find(p => p.dataKey === 'economia');
                          const cotacoesItem = payload.find(p => p.dataKey === 'cotacoes');
                          
                          return (
                            <div className="bg-white dark:bg-[#1e293b] p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-800">
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

          {/* Cotações Recentes - 1 coluna - Estilo Refinado */}
          <Card className="lg:col-span-1 bg-white dark:bg-[#1C1F26] border border-gray-200 dark:border-gray-700/30 shadow-sm dark:shadow-lg hover:shadow-md dark:hover:shadow-xl rounded-xl hover:border-gray-300 dark:hover:border-gray-600/50 transition-all duration-300">
            <CardHeader className="pb-3 border-b border-gray-100 dark:border-gray-700/30">
              <CardTitle className="flex items-center gap-3 text-base">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-purple-500 rounded-lg flex items-center justify-center shadow-sm">
                  <Clock className="h-4 w-4 text-white" />
                </div>
                <span className="font-semibold text-gray-900 dark:text-white">Cotações Recentes</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5 pt-4">
              {isLoading ? <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-purple-500" />
                </div> : recentQuotes.length > 0 ? recentQuotes.slice(0, 5).map((quote, index) => <div key={quote.id || index} className="group">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50/50 dark:bg-gray-800/30 hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-all duration-200 border border-transparent hover:border-gray-200 dark:hover:border-gray-700/30">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 border ${quote.status === 'aprovada' || quote.status === 'approved' ? 'bg-emerald-100 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400' : quote.status === 'pendente' || quote.status === 'pending' ? 'bg-amber-100 dark:bg-amber-900/20 border-amber-200 dark:border-amber-500/30 text-amber-700 dark:text-amber-400' : 'bg-red-100 dark:bg-red-900/20 border-red-200 dark:border-red-500/30 text-red-700 dark:text-red-400'}`}>
                          {getStatusIcon(quote.status)}
                        </div>
                        <div className="min-w-0 flex-1 space-y-0.5">
                          <div title={quote.productFull}>
                            <CapitalizedText className="font-medium text-gray-900 dark:text-white text-sm leading-tight truncate">
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
                      <div className="text-right flex-shrink-0 ml-3">
                        <p className="font-semibold text-gray-900 dark:text-white text-sm whitespace-nowrap">R$ {quote.bestPrice || '0'}</p>
                        <span className={`inline-block text-[10px] font-medium px-2 py-0.5 rounded-full mt-1 ${quote.status === 'aprovada' || quote.status === 'approved' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30' : quote.status === 'pendente' || quote.status === 'pending' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-500/30'}`}>
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

        {/* Modal de Detalhes da Economia */}
        <Dialog open={showEconomyModal} onOpenChange={setShowEconomyModal}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-lg">
                <div className="p-2 bg-green-500/15 rounded-lg">
                  <DollarSign className="h-5 w-5 text-green-600" />
                </div>
                Detalhes da Economia
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              <Tabs
                value={selectedEconomyBreakdown?.key || economyBreakdowns[0]?.key}
                onValueChange={(value) => setEconomyModalPeriod(value)}
                className="w-full"
              >
                <TabsList className="grid grid-cols-3 gap-2 bg-muted/40 dark:bg-muted/20">
                  {economyBreakdowns.map((period) => (
                    <TabsTrigger key={period.key} value={period.key} className="text-xs">
                      {period.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-xl border border-green-100 dark:border-green-900/30 bg-green-50/40 dark:bg-green-900/15 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-green-600">Economia Realizada</p>
                  <p className="text-xl font-bold text-green-700 dark:text-green-300 mt-2">{formatCurrency(selectedEconomyBreakdown?.economiaRealizada)}</p>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-2">Total economizado nas cotações finalizadas do período selecionado.</p>
                </div>
                <div className="rounded-xl border border-emerald-100 dark:border-emerald-900/30 bg-emerald-50/40 dark:bg-emerald-900/10 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">Economia Potencial</p>
                  <p className="text-xl font-bold text-emerald-700 dark:text-emerald-300 mt-2">{formatCurrency(selectedEconomyBreakdown?.economiaPotencial)}</p>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-2">Diferença acumulada entre o fornecedor vencedor e as demais ofertas do período.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="rounded-xl bg-white dark:bg-[#1C1F26] border border-gray-200 dark:border-gray-700/30 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Eficiência da Economia</p>
                  <p className="text-lg font-bold text-green-600 dark:text-green-400 mt-2">{formatPercent(selectedEconomyBreakdown?.eficienciaEconomia)}</p>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-2">Percentual da economia potencial convertida em economia real no período.</p>
                </div>
                <div className="rounded-xl bg-white dark:bg-[#1C1F26] border border-gray-200 dark:border-gray-700/30 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Competitividade Média</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white mt-2">{formatPercent(metrics.competitividadeMedia)}</p>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-2">Participantes que ficaram até 5% do preço vencedor.</p>
                </div>
                <div className="rounded-xl bg-white dark:bg-[#1C1F26] border border-gray-200 dark:border-gray-700/30 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Fornecedores por Cotação</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white mt-2">{metrics.mediaFornecedoresParticipantes || 0}</p>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-2">Média de participantes válidos nas cotações finalizadas.</p>
                </div>
              </div>

              <div className="rounded-xl bg-white dark:bg-[#1C1F26] border border-gray-200 dark:border-gray-700/40 p-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Crescimento Potencial</p>
                    <p className={`text-lg font-bold mt-2 ${metrics.economiaPotencialCrescimento >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {formatPercent(metrics.economiaPotencialCrescimento)}
                    </p>
                  </div>
                  <Badge className="w-fit" variant="outline">Comparação mês atual vs anterior</Badge>
                </div>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-3">
                  Indica o quanto a economia potencial evoluiu em relação ao mês anterior. Valores positivos sinalizam aumento de oportunidade; negativos indicam queda na concorrência.
                </p>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowEconomyModal(false)}>
                  Fechar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Modal de Detalhes de Aprovação */}
        <Dialog open={showApprovalModal} onOpenChange={setShowApprovalModal}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-lg">
                <div className="p-2 bg-yellow-500/15 rounded-lg">
                  <Target className="h-5 w-5 text-yellow-600" />
                </div>
                Detalhes da Aprovação
              </DialogTitle>
            </DialogHeader>
            <Tabs value={approvalModalTab} onValueChange={setApprovalModalTab} className="w-full">
              <TabsList className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <TabsTrigger value="resumo">Resumo</TabsTrigger>
                <TabsTrigger value="funnel">Funil</TabsTrigger>
                <TabsTrigger value="rejeicoes">Rejeições</TabsTrigger>
                <TabsTrigger value="historico">Histórico</TabsTrigger>
              </TabsList>
              <div className="mt-4 max-h-[60vh] overflow-y-auto pr-1">
                <TabsContent value="resumo" className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="rounded-xl border border-yellow-200 dark:border-yellow-900/30 bg-yellow-50/60 dark:bg-yellow-900/15 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-yellow-600">Taxa atual</p>
                      <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-300 mt-2">{metrics.taxaAprovacao || 0}%</p>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">{metrics.aprovacoesTotal || 0} aprovadas de {totalStatusCount} cotações analisadas.</p>
                    </div>
                    <div className="rounded-xl border border-emerald-200 dark:border-emerald-900/30 bg-emerald-50/50 dark:bg-emerald-900/10 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">Variação mensal</p>
                      <p className={`text-xl font-bold mt-2 ${metrics.variacaoTaxaAprovacao >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                        {metrics.variacaoTaxaAprovacao > 0 ? '+' : ''}{metrics.variacaoTaxaAprovacao || 0} p.p
                      </p>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">Taxa anterior: {metrics.taxaAprovacaoAnterior || 0}%</p>
                    </div>
                  </div>
                  <div className="rounded-xl border border-gray-200 dark:border-gray-700/30 p-4 bg-white dark:bg-[#1C1F26]">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Meta interna</p>
                        <p className="text-xl font-bold text-gray-800 dark:text-white mt-1">{approvalTarget}%</p>
                      </div>
                      <div className={`rounded-lg px-3 py-2 text-sm font-semibold ${isApprovalOnTarget ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300' : 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300'}`}>
                        {isApprovalOnTarget ? 'Dentro da meta' : 'Abaixo da meta'}
                      </div>
                    </div>
                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-600 dark:text-gray-300">
                      <div className="flex items-center justify-between">
                        <span>Mês atual</span>
                        <span className="font-semibold text-gray-900 dark:text-white">{metrics.aprovacoesMesAtual || 0}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Mês anterior</span>
                        <span className="font-semibold text-gray-900 dark:text-white">{metrics.aprovacoesMesAnterior || 0}</span>
                      </div>
                    </div>
                    <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <Button variant="outline" size="sm" className="text-xs" onClick={() => navigate('/quotes/pending')}>
                        Ver cotações pendentes
                      </Button>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px]">
                          Meta interna: {approvalTarget}%
                        </Badge>
                        <Button size="sm" className="text-xs" onClick={() => setShowReportModal(true)}>
                          Gerar relatório de aprovação
                        </Button>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="funnel" className="space-y-4">
                  <div className="rounded-xl bg-white dark:bg-[#1C1F26] border border-gray-200 dark:border-gray-700/30 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-3">Distribuição de status</p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
                      <div className="rounded-lg bg-yellow-500/10 dark:bg-yellow-500/20 py-3">
                        <p className="text-xs font-semibold text-yellow-600">Aprovadas</p>
                        <p className="text-lg font-bold text-yellow-700 dark:text-yellow-400">{metrics.aprovacoesTotal || 0}</p>
                      </div>
                      <div className="rounded-lg bg-amber-500/10 dark:bg-amber-500/20 py-3">
                        <p className="text-xs font-semibold text-amber-600">Pendentes</p>
                        <p className="text-lg font-bold text-amber-700 dark:text-amber-400">{metrics.pendenciasTotal || 0}</p>
                      </div>
                      <div className="rounded-lg bg-red-500/10 dark:bg-red-500/20 py-3">
                        <p className="text-xs font-semibold text-red-600">Rejeitadas</p>
                        <p className="text-lg font-bold text-red-700 dark:text-red-400">{metrics.rejeicoesTotal || 0}</p>
                      </div>
                    </div>
                    <div className="mt-4 rounded-lg bg-amber-500/10 dark:bg-amber-500/20 py-3 px-4 text-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <span className="font-semibold text-amber-600">Pendências fora do SLA</span>
                      <span className="text-lg font-bold text-amber-700 dark:text-amber-300">{metrics.pendenciasAtrasadas || 0}</span>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="rejeicoes" className="space-y-4">
                  <div className="rounded-xl bg-white dark:bg-[#1C1F26] border border-gray-200 dark:border-gray-700/30 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-3">Últimas rejeições</p>
                    {metrics.ultimasRejeicoes && metrics.ultimasRejeicoes.length > 0 ? (
                      <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                        {metrics.ultimasRejeicoes.map((item: any) => (
                          <div key={item.id} className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 dark:border-gray-700/30 px-3 py-2">
                            <div className="min-w-0">
                              <p className="font-medium text-gray-800 dark:text-gray-100 truncate">{item.product}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{item.supplier}</p>
                            </div>
                            <span className="text-xs text-gray-400" title={item.date}>{item.date}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500 dark:text-gray-400">Nenhuma rejeição recente.</p>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="historico" className="space-y-4">
                  <div className="rounded-xl bg-white dark:bg-[#1C1F26] border border-gray-200 dark:border-gray-700/30 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-3">Histórico de aprovações</p>
                    {approvalHistoryVisible && approvalHistoryVisible.length > 0 ? (
                      <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                        {approvalHistoryVisible.map((item) => (
                          <div key={item.label} className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 dark:border-gray-700/30 px-3 py-2">
                            <div className="min-w-0">
                              <p className="font-medium text-gray-800 dark:text-gray-100 truncate">{item.label}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{item.aprovadas}/{item.total} aprovadas</p>
                            </div>
                            <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">{item.taxa}%</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500 dark:text-gray-400">Nenhum histórico disponível.</p>
                    )}
                    {approvalHistoryHasMore && (
                      <div className="mt-3 text-right">
                        <Button variant="ghost" size="sm" className="text-xs" onClick={() => setShowFullApprovalHistory((prev) => !prev)}>
                          {showFullApprovalHistory ? 'Ver menos meses' : 'Ver histórico completo'}
                        </Button>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </div>
            </Tabs>
          </DialogContent>
        </Dialog>

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