/**
 * Tipos compartilhados para o módulo de relatórios
 * Consolidados de Relatorios.tsx, ReportGenerator.tsx e componentes relacionados
 * 
 * @module types/reports
 */

import type { LucideIcon } from "lucide-react";

// ============================================================================
// Date Range Types
// ============================================================================

/**
 * Representa um intervalo de datas para filtros de relatórios
 */
export interface DateRange {
  startDate: Date | undefined;
  endDate: Date | undefined;
}

// ============================================================================
// Filter Types
// ============================================================================

/**
 * Filtros disponíveis para geração de relatórios
 */
export interface ReportFilters {
  dateRange: DateRange;
  fornecedores: string[];
  produtos: string[];
  categorias: string[];
}

// ============================================================================
// Report Types
// ============================================================================

/**
 * Categorias de relatórios disponíveis
 */
export type ReportCategory = 'financeiro' | 'operacional' | 'estrategico';

/**
 * Prioridade do relatório
 */
export type ReportPriority = 'alta' | 'media' | 'baixa';

/**
 * Formatos de exportação suportados
 */
export type ReportFormat = 'pdf' | 'excel';

/**
 * Tipo de relatório disponível no sistema
 */
export interface ReportType {
  id: string;
  titulo: string;
  descricao: string;
  icone: LucideIcon;
  categoria: ReportCategory;
  formato?: ReportFormat[];
  periodo?: string;
  ultimaAtualizacao?: string;
  prioridade?: ReportPriority;
  tempoEstimado?: string;
}

/**
 * Dados de um relatório gerado
 */
export interface ReportData {
  type: string;
  period: DateRange;
  generatedAt: Date;
  data: Record<string, unknown>[];
  summary?: {
    totalRecords: number;
    highlights: string[];
  };
}

// ============================================================================
// Activity/History Types
// ============================================================================

/**
 * Tipos de atividade no histórico
 */
export type ActivityType = 'cotacao' | 'pedido' | 'produto' | 'fornecedor';

/**
 * Item de atividade no histórico
 */
export interface ActivityItem {
  id: string;
  tipo: ActivityType | string;
  acao: string;
  detalhes: string;
  data: string;
  usuario: string;
  valor?: string;
  economia?: string;
  created_at: string;
}

// ============================================================================
// Statistics Types
// ============================================================================

/**
 * Estatísticas gerais do sistema
 */
export interface Estatisticas {
  economiaTotal: string;
  economiaPercentual: string;
  cotacoesRealizadas: number;
  fornecedoresAtivos: number;
  produtosCotados: number;
  pedidosGerados: number;
}

// ============================================================================
// Metric Types
// ============================================================================

/**
 * Tipo de variação da métrica
 */
export type MetricTrend = 'positivo' | 'negativo' | 'neutro';

/**
 * Cores disponíveis para métricas
 */
export type MetricColor = 'emerald' | 'blue' | 'purple' | 'orange';

/**
 * Métrica individual para exibição em cards
 */
export interface Metric {
  id?: string;
  titulo: string;
  valor: string;
  descricao: string;
  variacao?: string;
  tipo: MetricTrend;
  icon?: LucideIcon;
  color?: MetricColor;
}

// ============================================================================
// Analytics Types
// ============================================================================

/**
 * Produto com melhor performance
 */
export interface TopProduto {
  produto: string;
  economia: string;
  cotacoes: number;
  economiaTotal?: number;
  valorTotal?: number;
}

/**
 * Performance de um fornecedor
 */
export interface FornecedorPerformance {
  fornecedor: string;
  score: number;
  cotacoes: number;
  economia: string;
  taxaResposta?: string;
  tempo: string;
}

/**
 * Tendência mensal para gráficos
 */
export interface TendenciaMensal {
  mes: string;
  cotacoes: number;
  economia: number;
  valor: number;
}

/**
 * Dados completos de analytics
 */
export interface AnalyticsData {
  metricas: Metric[];
  topProdutos: TopProduto[];
  performanceFornecedores: FornecedorPerformance[];
  tendenciasMensais: TendenciaMensal[];
}

// ============================================================================
// Column Mapping Types
// ============================================================================

/**
 * Mapeamento de nomes de colunas para exibição
 */
export type ColumnNameMap = Record<string, string>;

/**
 * Mapeamento padrão de nomes de colunas para relatórios
 */
export const COLUMN_NAMES: ColumnNameMap = {
  // Campos gerais
  periodo: 'Período',
  nome: 'Nome',
  categoria: 'Categoria',
  status: 'Status',
  
  // Campos de cotações
  totalCotacoes: 'Total de Cotações',
  cotacoes: 'Cotações',
  cotacoesVencidas: 'Cotações Vencidas',
  cotacoesIniciadas: 'Cotações Iniciadas',
  cotacoesFinalizadas: 'Cotações Finalizadas',
  
  // Campos de economia
  economiaGerada: 'Economia Gerada',
  economiaPercentual: 'Economia (%)',
  economiaTotal: 'Economia Total',
  economiaMedia: 'Economia Média',
  economiaPotencial: 'Economia Potencial',
  maiorEconomia: 'Maior Economia',
  
  // Campos de fornecedores
  melhorFornecedor: 'Melhor Fornecedor',
  fornecedor: 'Fornecedor',
  fornecedorMaisBarato: 'Fornecedor Mais Barato',
  fornecedorFrequente: 'Fornecedor Mais Frequente',
  fornecedoresPorCotacao: 'Fornecedores/Cotação',
  
  // Campos de valores
  valorMedioOfertas: 'Valor Médio',
  valorTotal: 'Valor Total',
  valorMedio: 'Valor Médio',
  valorMinimo: 'Valor Mínimo',
  valorMaximo: 'Valor Máximo',
  valorCotacoes: 'Valor das Cotações',
  valorPedidos: 'Valor dos Pedidos',
  
  // Campos de preços
  menorPreco: 'Menor Preço',
  maiorPreco: 'Maior Preço',
  precoMedio: 'Preço Médio',
  variacao: 'Variação (%)',
  variacaoPreco: 'Variação de Preço (%)',
  
  // Campos de taxas
  taxaVitoria: 'Taxa de Vitória',
  taxaConversao: 'Taxa de Conversão (%)',
  taxaEntrega: 'Taxa de Entrega (%)',
  taxaResposta: 'Taxa de Resposta (%)',
  
  // Campos de tempo
  tempoMedioResposta: 'Tempo Médio Resposta',
  tempoMedioCotacao: 'Tempo Médio (dias)',
  tempoMinimo: 'Tempo Mínimo (dias)',
  tempoMaximo: 'Tempo Máximo (dias)',
  
  // Campos de pedidos
  totalPedidos: 'Total de Pedidos',
  pedidosGerados: 'Pedidos Gerados',
  pedidosEntregues: 'Pedidos Entregues',
  pedidosPendentes: 'Pedidos Pendentes',
  pedidosCancelados: 'Pedidos Cancelados',
  
  // Campos de produtos
  produto: 'Produto',
  
  // Campos de performance
  score: 'Score',
  roi: 'ROI (%)',
  respostasRecebidas: 'Respostas Recebidas',
  tendencia: 'Tendência',
};

// ============================================================================
// Error Handling Types
// ============================================================================

/**
 * Estado de erro para componentes
 */
export interface ErrorState {
  hasError: boolean;
  message: string;
  retryAction?: () => void;
}

// ============================================================================
// Component Props Types
// ============================================================================

/**
 * Props para o componente ReportsHeader
 */
export interface ReportsHeaderProps {
  dateRangeText: string;
  onOpenPeriodDialog: () => void;
  onRefresh: () => void;
  onExportAll: () => void;
  isRefreshing: boolean;
  isExporting: boolean;
}

/**
 * Props para o componente ReportsTabs
 */
export interface ReportsTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  children: React.ReactNode;
}

/**
 * Props para o componente PeriodDialog
 */
export interface PeriodDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  startDate: Date | undefined;
  endDate: Date | undefined;
  onStartDateChange: (date: Date | undefined) => void;
  onEndDateChange: (date: Date | undefined) => void;
  onApplyPreset: (days: number) => void;
}

/**
 * Props para o componente FiltersDialog
 */
export interface FiltersDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedFornecedores: string[];
  selectedProdutos: string[];
  onFornecedoresChange: (fornecedores: string[]) => void;
  onProdutosChange: (produtos: string[]) => void;
  onReset: () => void;
}

/**
 * Props para o componente AnalyticsTab
 */
export interface AnalyticsTabProps {
  startDate: Date | undefined;
  endDate: Date | undefined;
  selectedFornecedores: string[];
  selectedProdutos: string[];
}

/**
 * Props para o componente ReportsTab
 */
export interface ReportsTabProps {
  startDate: Date | undefined;
  endDate: Date | undefined;
  onOpenPeriodDialog: () => void;
}

/**
 * Props para o componente HistoryTab
 */
export interface HistoryTabProps {
  isActive: boolean;
}

/**
 * Props para o componente MetricsGrid
 */
export interface MetricsGridProps {
  metrics: Metric[];
  isLoading: boolean;
}

/**
 * Props para o componente MetricsCarousel
 */
export interface MetricsCarouselProps {
  metrics: Metric[];
  isLoading: boolean;
}

/**
 * Props para o componente ReportGenerator
 */
export interface ReportGeneratorProps {
  startDate?: Date;
  endDate?: Date;
  onOpenPeriodDialog: () => void;
}

/**
 * Props para o componente ActivityHistory
 */
export interface ActivityHistoryProps {
  isActive: boolean;
}
