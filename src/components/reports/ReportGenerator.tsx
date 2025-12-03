import { useState, useCallback, useMemo, memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { DollarSign, Building2, BarChart3, TrendingUp, ShoppingCart, Package, Timer, Target, Calendar, Download, Eye, Loader2, FileText, ChevronDown, X, FileSearch, CalendarDays } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useReportEconomia } from "@/hooks/useReportEconomia";
import { useReportFornecedores } from "@/hooks/useReportFornecedores";
import { useReportComparativo } from "@/hooks/useReportComparativo";
import { useReportEficiencia } from "@/hooks/useReportEficiencia";
import { useReportPedidos } from "@/hooks/useReportPedidos";
import { useReportProdutos } from "@/hooks/useReportProdutos";
import { useReportTempoResposta } from "@/hooks/useReportTempoResposta";
import { useReportConversao } from "@/hooks/useReportConversao";
import { cn } from "@/lib/utils";

interface ReportGeneratorProps {
  startDate?: Date;
  endDate?: Date;
  onOpenPeriodDialog: () => void;
}

interface ReportType {
  id: string;
  titulo: string;
  descricao: string;
  icone: typeof DollarSign;
  categoria: 'financeiro' | 'operacional' | 'estrategico';
}

const REPORT_TYPES: ReportType[] = [
  { id: "economia", titulo: "Análise de Economia", descricao: "Economia gerada por período", icone: DollarSign, categoria: 'financeiro' },
  { id: "fornecedores", titulo: "Performance Fornecedores", descricao: "Taxa de vitória e score", icone: Building2, categoria: 'estrategico' },
  { id: "comparativo", titulo: "Comparativo de Preços", descricao: "Variação de preços por produto", icone: BarChart3, categoria: 'operacional' },
  { id: "eficiencia", titulo: "Eficiência do Processo", descricao: "Taxa de conversão e ROI", icone: TrendingUp, categoria: 'estrategico' },
  { id: "pedidos", titulo: "Análise de Pedidos", descricao: "Volume e valores de pedidos", icone: ShoppingCart, categoria: 'operacional' },
  { id: "produtos", titulo: "Análise de Produtos", descricao: "Produtos mais cotados", icone: Package, categoria: 'operacional' },
  { id: "tempo-resposta", titulo: "Tempo de Resposta", descricao: "Performance de resposta", icone: Timer, categoria: 'operacional' },
  { id: "conversao", titulo: "Taxa de Conversão", descricao: "Conversão cotações em pedidos", icone: Target, categoria: 'estrategico' },
];

/**
 * ReportTableSkeleton - Skeleton loader for report table
 * Displays while report data is being generated
 * Requirements: 2.3, 6.3
 */
function ReportTableSkeleton() {
  return (
    <Card className="border-gray-200 dark:border-gray-700/30">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-5 w-20 ml-2" />
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <TableHead key={i}>
                    <Skeleton className="h-4 w-20" />
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {[1, 2, 3, 4, 5].map((row) => (
                <TableRow key={row}>
                  {[1, 2, 3, 4, 5, 6].map((cell) => (
                    <TableCell key={cell}>
                      <Skeleton className="h-4 w-16" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

const COLUMN_NAMES: Record<string, string> = {
  periodo: 'Período', totalCotacoes: 'Total Cotações', economiaGerada: 'Economia',
  economiaPercentual: 'Economia (%)', melhorFornecedor: 'Melhor Fornecedor',
  nome: 'Nome', cotacoesVencidas: 'Cotações Vencidas', taxaVitoria: 'Taxa Vitória',
  valorMedioOfertas: 'Valor Médio', tempoMedioResposta: 'Tempo Resposta', score: 'Score',
  produto: 'Produto', categoria: 'Categoria', cotacoes: 'Cotações',
  menorPreco: 'Menor Preço', maiorPreco: 'Maior Preço', precoMedio: 'Preço Médio',
  variacao: 'Variação (%)', fornecedorMaisBarato: 'Melhor Fornecedor',
  cotacoesIniciadas: 'Iniciadas', cotacoesFinalizadas: 'Finalizadas',
  taxaConversao: 'Conversão (%)', tempoMedioCotacao: 'Tempo Médio',
  fornecedoresPorCotacao: 'Fornec./Cotação', economiaTotal: 'Economia Total', roi: 'ROI (%)',
  totalPedidos: 'Total Pedidos', valorTotal: 'Valor Total', valorMedio: 'Valor Médio',
  pedidosEntregues: 'Entregues', pedidosPendentes: 'Pendentes', pedidosCancelados: 'Cancelados',
  taxaEntrega: 'Taxa Entrega (%)', fornecedorFrequente: 'Fornecedor Frequente',
  valorMinimo: 'Valor Mín.', valorMaximo: 'Valor Máx.', variacaoPreco: 'Variação (%)',
  economiaPotencial: 'Economia Potencial', tendencia: 'Tendência',
  fornecedor: 'Fornecedor', respostasRecebidas: 'Respostas', tempoMinimo: 'Tempo Mín.',
  tempoMaximo: 'Tempo Máx.', taxaResposta: 'Taxa Resposta (%)', status: 'Status',
  pedidosGerados: 'Pedidos Gerados', valorCotacoes: 'Valor Cotações', valorPedidos: 'Valor Pedidos'
};

/**
 * ReportGenerator - Componente memoizado para geração de relatórios
 * 
 * Usa React.memo para evitar re-renders desnecessários.
 * Requirements: 6.5
 */
export const ReportGenerator = memo(function ReportGenerator({ startDate, endDate, onOpenPeriodDialog }: ReportGeneratorProps) {
  const { toast } = useToast();
  const [selectedType, setSelectedType] = useState("economia");
  const [reportData, setReportData] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasAttemptedGeneration, setHasAttemptedGeneration] = useState(false);

  // Hooks de relatórios
  const reportEconomia = useReportEconomia();
  const reportFornecedores = useReportFornecedores();
  const reportComparativo = useReportComparativo();
  const reportEficiencia = useReportEficiencia();
  const reportPedidos = useReportPedidos();
  const reportProdutos = useReportProdutos();
  const reportTempoResposta = useReportTempoResposta();
  const reportConversao = useReportConversao();

  const selectedReport = useMemo(() => 
    REPORT_TYPES.find(r => r.id === selectedType) || REPORT_TYPES[0],
  [selectedType]);

  const dateRangeText = useMemo(() => {
    if (!startDate || !endDate) return 'Selecionar período';
    return `${startDate.toLocaleDateString('pt-BR')} - ${endDate.toLocaleDateString('pt-BR')}`;
  }, [startDate, endDate]);

  const generateReport = useCallback(async () => {
    if (!startDate || !endDate) {
      toast({ title: "Selecione um período", variant: "destructive" });
      return;
    }

    setLoading(true);
    setHasAttemptedGeneration(true);
    try {
      let data: any[] = [];
      switch (selectedType) {
        case 'economia': data = await reportEconomia.generateReport(startDate, endDate); break;
        case 'fornecedores': data = await reportFornecedores.generateReport(startDate, endDate); break;
        case 'comparativo': data = await reportComparativo.generateReport(startDate, endDate); break;
        case 'eficiencia': data = await reportEficiencia.generateReport(startDate, endDate); break;
        case 'pedidos': data = await reportPedidos.generateReport(startDate, endDate); break;
        case 'produtos': data = await reportProdutos.generateReport(startDate, endDate); break;
        case 'tempo-resposta': data = await reportTempoResposta.generateReport(startDate, endDate); break;
        case 'conversao': data = await reportConversao.generateReport(startDate, endDate); break;
      }
      setReportData(data);
    } catch (error) {
      toast({ title: "Erro ao gerar relatório", variant: "destructive" });
      setReportData([]);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, selectedType, reportEconomia, reportFornecedores, reportComparativo, reportEficiencia, reportPedidos, reportProdutos, reportTempoResposta, reportConversao, toast]);

  const downloadReport = useCallback(async (format: 'pdf' | 'excel') => {
    if (!reportData || reportData.length === 0) {
      toast({ title: "Gere o relatório primeiro", variant: "destructive" });
      return;
    }

    const headers = Object.keys(reportData[0]);
    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = `relatorio_${selectedType}_${timestamp}`;

    if (format === 'excel') {
      const XLSX = await import('xlsx');
      const { saveAs } = await import('file-saver');
      const worksheetData = [
        headers.map(h => COLUMN_NAMES[h] || h),
        ...reportData.map(row => headers.map(h => row[h] ?? '-'))
      ];
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
      XLSX.utils.book_append_sheet(workbook, worksheet, selectedReport.titulo.substring(0, 31));
      const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      saveAs(new Blob([buffer]), `${filename}.xlsx`);
    } else {
      const jsPDF = (await import('jspdf')).default;
      const doc = new jsPDF();
      doc.setFontSize(16);
      doc.text(selectedReport.titulo, 20, 20);
      doc.setFontSize(10);
      doc.text(`Período: ${dateRangeText}`, 20, 30);
      let y = 45;
      reportData.slice(0, 20).forEach((row, i) => {
        if (y > 270) { doc.addPage(); y = 20; }
        const text = headers.slice(0, 4).map(h => `${COLUMN_NAMES[h] || h}: ${row[h] ?? '-'}`).join(' | ');
        doc.text(text.substring(0, 100), 20, y);
        y += 8;
      });
      doc.save(`${filename}.pdf`);
    }
    toast({ title: "Download concluído" });
  }, [reportData, selectedType, selectedReport, dateRangeText, toast]);

  const formatCellValue = (key: string, value: any) => {
    if (value === null || value === undefined) return '-';
    if (key.includes('valor') || key.includes('preco') || key.includes('economia')) {
      if (typeof value === 'number') return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
    }
    if (key.includes('taxa') || key.includes('percentual') || key.includes('roi')) {
      if (typeof value === 'number') return `${value.toFixed(1)}%`;
    }
    return String(value);
  };

  return (
    <div className="space-y-6">
      {/* Seleção de Relatório */}
      <Card className="card-standard">
        <CardHeader className="card-header-standard px-4 sm:px-6 pt-4 sm:pt-6">
          <CardTitle className="text-base flex items-center gap-2">
            <div className="card-icon-container icon-bg-purple">
              <FileText className="h-4 w-4" />
            </div>
            Gerar Relatório
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <Label className="text-sm">Tipo de Relatório</Label>
              <Select value={selectedType} onValueChange={(v) => { setSelectedType(v); setReportData(null); setHasAttemptedGeneration(false); }}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {REPORT_TYPES.map(r => (
                    <SelectItem key={r.id} value={r.id}>
                      <div className="flex items-center gap-2">
                        <r.icone className="h-4 w-4" />
                        {r.titulo}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm">Período</Label>
              <Button variant="outline" onClick={onOpenPeriodDialog} className="w-full justify-start">
                <Calendar className="h-4 w-4 mr-2" />
                {dateRangeText}
              </Button>
            </div>

            <div className="space-y-2 sm:col-span-2 lg:col-span-1">
              <Label className="text-sm">Ações</Label>
              <div className="flex gap-2">
                <Button 
                  onClick={generateReport} 
                  disabled={loading || !startDate || !endDate} 
                  className={`flex-1 btn-primary-enhanced ${loading ? 'btn-loading' : ''}`}
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Eye className="h-4 w-4 mr-2 transition-transform duration-200 group-hover:scale-110" />}
                  Visualizar
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="outline" 
                      disabled={!reportData || reportData.length === 0}
                      className="btn-outline-enhanced"
                    >
                      <Download className="h-4 w-4 mr-2 transition-transform duration-200 group-hover:translate-y-0.5" />
                      <ChevronDown className="h-3 w-3 transition-transform duration-200 group-hover:rotate-180" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuLabel>Formato</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => downloadReport('pdf')} className="cursor-pointer transition-colors duration-200">PDF</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => downloadReport('excel')} className="cursor-pointer transition-colors duration-200">Excel</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>

          {/* Info do relatório selecionado */}
          <div className="panel-highlight flex items-center gap-3">
            <div className="card-icon-container icon-bg-purple">
              <selectedReport.icone className="h-5 w-5" />
            </div>
            <div>
              <p className="font-medium text-sm">{selectedReport.titulo}</p>
              <p className="text-xs text-gray-500">{selectedReport.descricao}</p>
            </div>
            <Badge variant="outline" className="ml-auto capitalize transition-colors duration-200">{selectedReport.categoria}</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Loading Skeleton */}
      {loading && <ReportTableSkeleton />}

      {/* Resultado do Relatório */}
      {!loading && reportData && reportData.length > 0 && (
        <Card className="card-standard overflow-hidden">
          <CardHeader className="card-header-standard px-4 sm:px-6 pt-4 sm:pt-6">
            <CardTitle className="text-base flex items-center gap-2">
              <div className="card-icon-container icon-bg-purple">
                <selectedReport.icone className="h-4 w-4" />
              </div>
              {selectedReport.titulo}
              <Badge variant="secondary" className="transition-all duration-200">{reportData.length} registros</Badge>
            </CardTitle>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => { setReportData(null); setHasAttemptedGeneration(false); }}
              className="transition-all duration-200 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
            >
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {Object.keys(reportData[0]).slice(0, 6).map(key => (
                      <TableHead key={key} className="text-xs whitespace-nowrap">
                        {COLUMN_NAMES[key] || key}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportData.slice(0, 10).map((row, rowIndex) => (
                    <TableRow key={rowIndex}>
                      {Object.entries(row).slice(0, 6).map(([key, value]) => (
                        <TableCell key={key} className="text-sm whitespace-nowrap">
                          {formatCellValue(key, value)}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {reportData.length > 10 && (
              <div className="p-3 text-center text-xs text-gray-500 border-t">
                Mostrando 10 de {reportData.length} registros. Baixe o relatório para ver todos.
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Empty State - Nenhum dado encontrado */}
      {hasAttemptedGeneration && reportData !== null && reportData.length === 0 && (
        <Card className="card-standard border-dashed">
          <CardContent className="py-12">
            <div className="empty-state">
              <div className="empty-state-icon">
                <FileSearch />
              </div>
              <h3 className="empty-state-title">
                Nenhum dado encontrado
              </h3>
              <p className="empty-state-description">
                Não foram encontrados dados para o relatório "{selectedReport.titulo}" no período selecionado.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Button 
                  variant="outline" 
                  onClick={onOpenPeriodDialog}
                  className="flex items-center gap-2 btn-enhanced"
                >
                  <CalendarDays className="h-4 w-4" />
                  Alterar período
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => { setHasAttemptedGeneration(false); setReportData(null); }}
                  className="flex items-center gap-2 btn-enhanced"
                >
                  <X className="h-4 w-4" />
                  Limpar
                </Button>
              </div>
              <p className="text-xs text-gray-400 dark:text-gray-500 pt-2">
                Dica: Tente expandir o período de datas ou selecionar outro tipo de relatório.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista de Relatórios Disponíveis */}
      <Card className="card-standard overflow-hidden">
        <CardHeader className="card-header-standard px-4 sm:px-6 pt-4 sm:pt-6">
          <CardTitle className="text-base">Relatórios Disponíveis</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="grid gap-px bg-gray-100 dark:bg-gray-800 sm:grid-cols-2">
            {REPORT_TYPES.map(report => (
              <div
                key={report.id}
                onClick={() => { setSelectedType(report.id); setReportData(null); setHasAttemptedGeneration(false); }}
                className={cn(
                  "flex items-center gap-3 p-4 bg-white dark:bg-gray-900 cursor-pointer",
                  "hover:bg-gray-50 dark:hover:bg-gray-800/50",
                  "transition-all duration-200 ease-out",
                  "group",
                  selectedType === report.id && "ring-2 ring-purple-500 ring-inset bg-purple-50/50 dark:bg-purple-900/10"
                )}
              >
                <div className={cn(
                  "card-icon-container transition-transform duration-200 group-hover:scale-110",
                  report.categoria === 'financeiro' && "icon-bg-green",
                  report.categoria === 'operacional' && "icon-bg-blue",
                  report.categoria === 'estrategico' && "icon-bg-purple"
                )}>
                  <report.icone className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{report.titulo}</p>
                  <p className="text-xs text-gray-500 truncate">{report.descricao}</p>
                </div>
                <Badge variant="outline" className="text-xs capitalize hidden sm:inline-flex transition-colors duration-200">
                  {report.categoria}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
});
