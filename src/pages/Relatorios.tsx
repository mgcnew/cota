import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, FileText, Download, Calendar, BarChart3, PieChart, DollarSign, Users, Package, Building2, Eye, Settings, Loader2 } from "lucide-react";
import { DateRangePicker } from "@/components/reports/DateRangePicker";
import { ReportFilters } from "@/components/reports/ReportFilters";
import { ReportPreview } from "@/components/reports/ReportPreview";
import { useReports } from "@/hooks/useReports";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/auth/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
export default function Relatorios() {
  const {
    toast
  } = useToast();
  const { user } = useAuth();
  const {
    isGenerating,
    progress,
    generateReport,
    generateAllReports,
    getReportData
  } = useReports();

  // Estado para filtros e dialogs
  const [startDate, setStartDate] = React.useState<Date | undefined>(new Date(2025, 8, 1)); // 1º de setembro
  const [endDate, setEndDate] = React.useState<Date | undefined>(new Date(2025, 8, 30)); // 30 de setembro
  const [selectedFornecedores, setSelectedFornecedores] = React.useState<string[]>([]);
  const [selectedProdutos, setSelectedProdutos] = React.useState<string[]>([]);
  const [isPeriodDialogOpen, setIsPeriodDialogOpen] = React.useState(false);
  const [previewReport, setPreviewReport] = React.useState<{
    isOpen: boolean;
    type: string;
  }>({
    isOpen: false,
    type: ''
  });
  const [previewData, setPreviewData] = React.useState<any>(null);

  // Estado para dados reais
  const [loading, setLoading] = React.useState(true);
  const [estatisticasGerais, setEstatisticasGerais] = React.useState({
    economiaTotal: "R$ 0,00",
    economiaPercentual: "0%",
    cotacoesRealizadas: 0,
    fornecedoresAtivos: 0,
    produtosCotados: 0,
    pedidosGerados: 0
  });

  React.useEffect(() => {
    if (user) {
      loadStatistics();
    }
  }, [user, startDate, endDate]);

  const loadStatistics = async () => {
    try {
      setLoading(true);

      // Buscar cotações no período
      const { data: quotes, error: quotesError } = await supabase
        .from("quotes")
        .select("*, quote_suppliers(*)")
        .gte("data_inicio", startDate?.toISOString().split('T')[0])
        .lte("data_fim", endDate?.toISOString().split('T')[0]);

      if (quotesError) throw quotesError;

      // Buscar pedidos no período
      const { data: orders, error: ordersError } = await supabase
        .from("orders")
        .select("*")
        .gte("order_date", startDate?.toISOString().split('T')[0])
        .lte("order_date", endDate?.toISOString().split('T')[0]);

      if (ordersError) throw ordersError;

      // Buscar fornecedores ativos
      const { data: suppliers, error: suppliersError } = await supabase
        .from("suppliers")
        .select("id");

      if (suppliersError) throw suppliersError;

      // Buscar produtos
      const { data: products, error: productsError } = await supabase
        .from("products")
        .select("id");

      if (productsError) throw productsError;

      // Calcular economia total das cotações
      let economiaTotal = 0;
      let totalCotacoes = 0;
      
      if (quotes) {
        quotes.forEach((quote: any) => {
          if (quote.quote_suppliers && quote.quote_suppliers.length > 0) {
            // Encontrar o melhor e pior preço
            const valores = quote.quote_suppliers
              .filter((qs: any) => qs.valor_oferecido > 0)
              .map((qs: any) => qs.valor_oferecido);
            
            if (valores.length >= 2) {
              const melhorPreco = Math.min(...valores);
              const piorPreco = Math.max(...valores);
              economiaTotal += (piorPreco - melhorPreco);
              totalCotacoes++;
            }
          }
        });
      }

      // Calcular percentual de economia (assumindo economia sobre o valor total de pedidos)
      const totalPedidos = orders?.reduce((acc, order) => acc + Number(order.total_value), 0) || 0;
      const economiaPercentual = totalPedidos > 0 ? (economiaTotal / totalPedidos) * 100 : 0;

      setEstatisticasGerais({
        economiaTotal: `R$ ${economiaTotal.toFixed(2).replace('.', ',')}`,
        economiaPercentual: `${economiaPercentual.toFixed(1)}%`,
        cotacoesRealizadas: quotes?.length || 0,
        fornecedoresAtivos: suppliers?.length || 0,
        produtosCotados: products?.length || 0,
        pedidosGerados: orders?.length || 0
      });

    } catch (error) {
      console.error("Erro ao carregar estatísticas:", error);
      toast({
        title: "Erro ao carregar estatísticas",
        description: "Não foi possível carregar os dados dos relatórios",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Mock data para relatórios
  const relatoriosDisponiveis = [{
    titulo: "Relatório de Economia",
    descricao: "Análise detalhada da economia gerada pelas cotações",
    tipo: "economia",
    icone: DollarSign,
    formato: ["PDF", "Excel"],
    periodo: "Mensal",
    ultimaAtualizacao: new Date().toLocaleDateString('pt-BR')
  }, {
    titulo: "Performance de Fornecedores",
    descricao: "Avaliação de desempenho e preços dos fornecedores",
    tipo: "fornecedores",
    icone: Building2,
    formato: ["PDF", "Excel"],
    periodo: "Trimestral",
    ultimaAtualizacao: new Date().toLocaleDateString('pt-BR')
  }, {
    titulo: "Análise de Produtos",
    descricao: "Histórico de preços e variações por produto",
    tipo: "produtos",
    icone: Package,
    formato: ["PDF", "Excel", "CSV"],
    periodo: "Semanal",
    ultimaAtualizacao: new Date().toLocaleDateString('pt-BR')
  }, {
    titulo: "Cotações por Período",
    descricao: "Resumo de todas as cotações realizadas",
    tipo: "cotacoes",
    icone: FileText,
    formato: ["PDF", "Excel"],
    periodo: "Mensal",
    ultimaAtualizacao: new Date().toLocaleDateString('pt-BR')
  }, {
    titulo: "Dashboard Executivo",
    descricao: "Visão geral com métricas principais",
    tipo: "dashboard",
    icone: BarChart3,
    formato: ["PDF"],
    periodo: "Mensal",
    ultimaAtualizacao: new Date().toLocaleDateString('pt-BR')
  }, {
    titulo: "Análise de Gastos",
    descricao: "Controle de gastos e orçamento por categoria",
    tipo: "gastos",
    icone: PieChart,
    formato: ["PDF", "Excel"],
    periodo: "Mensal",
    ultimaAtualizacao: new Date().toLocaleDateString('pt-BR')
  }];

  // Funções para gerenciar filtros e ações
  const currentFilters = {
    startDate: startDate || new Date(),
    endDate: endDate || new Date(),
    fornecedores: selectedFornecedores,
    produtos: selectedProdutos,
    categorias: []
  };
  const handleDownloadReport = async (reportType: string, format: 'pdf' | 'excel') => {
    if (!startDate || !endDate) {
      toast({
        title: "Erro",
        description: "Por favor, selecione um período válido.",
        variant: "destructive"
      });
      return;
    }
    await generateReport(reportType, currentFilters, format);
  };
  const handleExportAll = async () => {
    if (!startDate || !endDate) {
      toast({
        title: "Erro",
        description: "Por favor, selecione um período válido.",
        variant: "destructive"
      });
      return;
    }
    await generateAllReports(currentFilters);
  };
  const handlePreviewReport = async (reportType: string) => {
    // Open dialog first with loading state
    setPreviewReport({
      isOpen: true,
      type: reportType
    });
    setPreviewData(null); // Reset data to show loading

    // Then load data
    const data = await getReportData(currentFilters);
    setPreviewData(data);
  };
  const handleResetFilters = () => {
    setSelectedFornecedores([]);
    setSelectedProdutos([]);
    setStartDate(new Date(2025, 8, 1));
    setEndDate(new Date(2025, 8, 30));
  };
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Relatórios</h1>
          <p className="text-muted-foreground">
            Análises e relatórios detalhados do sistema
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isPeriodDialogOpen} onOpenChange={setIsPeriodDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Calendar className="h-4 w-4 mr-2" />
                Período Personalizado
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md px-[6px]">
              <DialogHeader>
                <DialogTitle>Selecionar Período</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <DateRangePicker startDate={startDate} endDate={endDate} onStartDateChange={setStartDate} onEndDateChange={setEndDate} />
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsPeriodDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={() => setIsPeriodDialogOpen(false)}>
                    Aplicar
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          
          <Button className="gradient-primary" onClick={handleExportAll} disabled={isGenerating}>
            <Download className="h-4 w-4 mr-2" />
            {isGenerating ? 'Gerando...' : 'Exportar Todos'}
          </Button>
        </div>
      </div>

      {/* Resumo Executivo */}
      <Card className="card-elevated">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Resumo Executivo - Setembro 2025
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="space-y-4">
              <div>
                <div className="text-2xl font-bold text-success">{estatisticasGerais.economiaTotal}</div>
                <div className="text-sm text-muted-foreground">Economia Total Gerada</div>
                <div className="text-xs text-success">+{estatisticasGerais.economiaPercentual} vs mês anterior</div>
              </div>
              <div>
                <div className="text-xl font-semibold text-foreground">{estatisticasGerais.cotacoesRealizadas}</div>
                <div className="text-sm text-muted-foreground">Cotações Realizadas</div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <div className="text-xl font-semibold text-foreground">{estatisticasGerais.fornecedoresAtivos}</div>
                <div className="text-sm text-muted-foreground">Fornecedores Ativos</div>
              </div>
              <div>
                <div className="text-xl font-semibold text-foreground">{estatisticasGerais.produtosCotados}</div>
                <div className="text-sm text-muted-foreground">Produtos Cotados</div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <div className="text-xl font-semibold text-foreground">{estatisticasGerais.pedidosGerados}</div>
                <div className="text-sm text-muted-foreground">Pedidos Gerados</div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline">
                  <Download className="h-3 w-3 mr-1" />
                  PDF
                </Button>
                <Button size="sm" variant="outline">
                  <Download className="h-3 w-3 mr-1" />
                  Excel
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Progress Bar */}
      {isGenerating && <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Gerando relatórios...</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          </CardContent>
        </Card>}

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Filtros e Configurações
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">
                  Período Selecionado
                </label>
                <div className="text-sm">
                  {startDate && endDate ? `${startDate.toLocaleDateString('pt-BR')} - ${endDate.toLocaleDateString('pt-BR')}` : 'Nenhum período selecionado'}
                </div>
              </div>
            </div>
            
            <ReportFilters selectedFornecedores={selectedFornecedores} selectedProdutos={selectedProdutos} onFornecedoresChange={setSelectedFornecedores} onProdutosChange={setSelectedProdutos} onReset={handleResetFilters} />
          </div>
        </CardContent>
      </Card>

      {/* Relatórios Disponíveis */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {relatoriosDisponiveis.map(relatorio => <Card key={relatorio.tipo} className="card-elevated hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <relatorio.icone className="h-5 w-5 text-primary" />
                </div>
                <div className="text-xs text-muted-foreground">{relatorio.periodo}</div>
              </div>
              <CardTitle className="text-lg">{relatorio.titulo}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {relatorio.descricao}
              </p>
              
              <div className="space-y-2">
                <div className="text-xs text-muted-foreground">
                  Última atualização: {relatorio.ultimaAtualizacao}
                </div>
                <div className="flex gap-1">
                  {relatorio.formato.map(formato => <span key={formato} className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-secondary text-secondary-foreground">
                      {formato}
                    </span>)}
                </div>
              </div>
              
              <div className="flex gap-2 pt-2">
                <Button size="sm" className="flex-1" onClick={() => handleDownloadReport(relatorio.tipo, 'pdf')} disabled={isGenerating}>
                  <Download className="h-3 w-3 mr-1" />
                  Baixar PDF
                </Button>
                <Button size="sm" variant="outline" onClick={() => handlePreviewReport(relatorio.tipo)}>
                  <Eye className="h-3 w-3 mr-1" />
                  Visualizar
                </Button>
              </div>
            </CardContent>
          </Card>)}
      </div>

      {/* Relatórios Personalizados */}
      <Card>
        <CardHeader>
          <CardTitle>Relatórios Personalizados</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Crie relatórios personalizados selecionando os dados e períodos específicos que você precisa.
            </p>
            
            <div className="flex gap-4 flex-wrap">
              <Button variant="outline">
                <Calendar className="h-4 w-4 mr-2" />
                Selecionar Período
              </Button>
              <Button variant="outline">
                <Users className="h-4 w-4 mr-2" />
                Escolher Fornecedores
              </Button>
              <Button variant="outline">
                <Package className="h-4 w-4 mr-2" />
                Filtrar Produtos
              </Button>
              <Button className="gradient-primary">
                <FileText className="h-4 w-4 mr-2" />
                Gerar Relatório
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      <ReportPreview isOpen={previewReport.isOpen} onClose={() => setPreviewReport({
      isOpen: false,
      type: ''
    })} reportType={previewReport.type} reportData={previewData} onDownload={format => {
      handleDownloadReport(previewReport.type, format);
      setPreviewReport({
        isOpen: false,
        type: ''
      });
    }} />
    </div>;
}