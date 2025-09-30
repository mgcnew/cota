import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DateRangePicker } from "@/components/reports/DateRangePicker";
import { ReportFilters } from "@/components/reports/ReportFilters";
import { useReports } from "@/hooks/useReports";
import { Progress } from "@/components/ui/progress";
import { useState } from "react";
import { 
  BarChart3, 
  TrendingUp,
  TrendingDown,
  Calendar,
  Filter,
  Download,
  DollarSign,
  Package,
  Building2,
  Target
} from "lucide-react";

export default function Analytics() {
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [selectedFornecedores, setSelectedFornecedores] = useState<string[]>([]);
  const [selectedProdutos, setSelectedProdutos] = useState<string[]>([]);
  const [isDateDialogOpen, setIsDateDialogOpen] = useState(false);
  const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false);
  
  const { generateReport, progress, isGenerating } = useReports();

  const handleExportAnalytics = async () => {
    await generateReport(
      'analytics',
      { 
        startDate: startDate || new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), 
        endDate: endDate || new Date(),
        fornecedores: selectedFornecedores,
        produtos: selectedProdutos,
        categorias: []
      },
      'pdf'
    );
  };

  const applyDatePreset = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);
    setStartDate(start);
    setEndDate(end);
    setIsDateDialogOpen(false);
  };

  // Mock data para analytics
  const metricas = [
    {
      titulo: "Taxa de Economia",
      valor: "12.5%",
      variacao: "+2.3%",
      tipo: "positivo",
      descricao: "vs mês anterior"
    },
    {
      titulo: "Tempo Médio de Cotação",
      valor: "3.2 dias",
      variacao: "-0.8 dias",
      tipo: "positivo", 
      descricao: "vs mês anterior"
    },
    {
      titulo: "Taxa de Resposta",
      valor: "87%",
      variacao: "+5%",
      tipo: "positivo",
      descricao: "fornecedores respondendo"
    },
    {
      titulo: "Valor Médio por Pedido",
      valor: "R$ 4.847",
      variacao: "+12%",
      tipo: "positivo",
      descricao: "vs mês anterior"
    }
  ];

  const topProdutos = [
    { produto: "Coxa com Sobrecoxa", cotacoes: 12, economia: "15%", valor: "R$ 18.240" },
    { produto: "Filé de Frango", cotacoes: 8, economia: "8%", valor: "R$ 12.672" },
    { produto: "Contra Filé", cotacoes: 6, economia: "12%", valor: "R$ 21.600" },
    { produto: "Linguiça Toscana", cotacoes: 5, economia: "18%", valor: "R$ 9.245" },
    { produto: "Peito de Frango", cotacoes: 4, economia: "6%", valor: "R$ 7.500" }
  ];

  const performanceFornecedores = [
    { fornecedor: "Holambra", score: 95, cotacoes: 15, economia: "15%", tempo: "2.1 dias" },
    { fornecedor: "Seara", score: 88, cotacoes: 12, economia: "8%", tempo: "3.5 dias" },
    { fornecedor: "Davi", score: 92, cotacoes: 18, economia: "18%", tempo: "2.8 dias" },
    { fornecedor: "Adriano/Sidio", score: 79, cotacoes: 8, economia: "7%", tempo: "4.2 dias" },
    { fornecedor: "Silvia", score: 85, cotacoes: 10, economia: "12%", tempo: "3.1 dias" }
  ];

  const tendenciasMensais = [
    { mes: "Jun", cotacoes: 18, economia: 8.2, valor: 42000 },
    { mes: "Jul", cotacoes: 22, economia: 9.8, valor: 48500 },
    { mes: "Ago", cotacoes: 28, economia: 11.1, valor: 52300 },
    { mes: "Set", cotacoes: 24, economia: 12.5, valor: 47200 }
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Analytics</h1>
          <p className="text-muted-foreground">
            Análises avançadas e insights do sistema
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isDateDialogOpen} onOpenChange={setIsDateDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Calendar className="h-4 w-4 mr-2" />
                {startDate && endDate 
                  ? `${startDate.toLocaleDateString('pt-BR')} - ${endDate.toLocaleDateString('pt-BR')}`
                  : 'Últimos 90 dias'
                }
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Selecionar Período</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex gap-2 flex-wrap">
                  <Button variant="outline" size="sm" onClick={() => applyDatePreset(7)}>
                    Últimos 7 dias
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => applyDatePreset(30)}>
                    Últimos 30 dias
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => applyDatePreset(90)}>
                    Últimos 90 dias
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => applyDatePreset(365)}>
                    Último ano
                  </Button>
                </div>
                <DateRangePicker
                  startDate={startDate}
                  endDate={endDate}
                  onStartDateChange={setStartDate}
                  onEndDateChange={setEndDate}
                />
              </div>
            </DialogContent>
          </Dialog>
          
          <Dialog open={isFilterDialogOpen} onOpenChange={setIsFilterDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Filter className="h-4 w-4 mr-2" />
                Filtros
                {(selectedFornecedores.length > 0 || selectedProdutos.length > 0) && 
                  <span className="ml-1 px-1.5 py-0.5 text-xs bg-primary text-primary-foreground rounded">
                    {selectedFornecedores.length + selectedProdutos.length}
                  </span>
                }
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Filtros Avançados</DialogTitle>
              </DialogHeader>
              <ReportFilters
                selectedFornecedores={selectedFornecedores}
                selectedProdutos={selectedProdutos}
                onFornecedoresChange={setSelectedFornecedores}
                onProdutosChange={setSelectedProdutos}
                onReset={() => {
                  setSelectedFornecedores([]);
                  setSelectedProdutos([]);
                }}
              />
            </DialogContent>
          </Dialog>
          
          <Button 
            variant="outline" 
            onClick={handleExportAnalytics}
            disabled={isGenerating}
          >
            <Download className="h-4 w-4 mr-2" />
            {isGenerating ? 'Exportando...' : 'Exportar'}
          </Button>
        </div>
      </div>

      {/* Progress Bar */}
      {isGenerating && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Gerando relatório...</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="w-full" />
        </div>
      )}

      {/* Métricas Principais */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {metricas.map((metrica) => (
          <Card key={metrica.titulo} className="metrics-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-foreground">{metrica.valor}</div>
                  <div className="text-sm text-muted-foreground">{metrica.titulo}</div>
                </div>
                <div className={`flex items-center gap-1 ${metrica.tipo === 'positivo' ? 'text-success' : 'text-error'}`}>
                  {metrica.tipo === 'positivo' ? (
                    <TrendingUp className="h-4 w-4" />
                  ) : (
                    <TrendingDown className="h-4 w-4" />
                  )}
                  <span className="text-sm font-medium">{metrica.variacao}</span>
                </div>
              </div>
              <div className="text-xs text-muted-foreground mt-1">{metrica.descricao}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Tendência de Economia */}
        <Card className="card-elevated">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Tendência de Economia
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {tendenciasMensais.map((item) => (
                <div key={item.mes} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
                      {item.mes}
                    </div>
                    <div>
                      <div className="font-medium text-foreground">{item.cotacoes} cotações</div>
                      <div className="text-sm text-muted-foreground">
                        R$ {item.valor.toLocaleString('pt-BR')}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-success">{item.economia}%</div>
                    <div className="text-xs text-muted-foreground">economia</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Performance de Fornecedores */}
        <Card className="card-elevated">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              Performance de Fornecedores
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {performanceFornecedores.map((fornecedor) => (
                <div key={fornecedor.fornecedor} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium text-white ${
                      fornecedor.score >= 90 ? 'bg-success' : 
                      fornecedor.score >= 80 ? 'bg-primary' : 'bg-muted-foreground'
                    }`}>
                      {fornecedor.score}
                    </div>
                    <div>
                      <div className="font-medium text-foreground">{fornecedor.fornecedor}</div>
                      <div className="text-sm text-muted-foreground">
                        {fornecedor.cotacoes} cotações • {fornecedor.tempo}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-success">-{fornecedor.economia}</div>
                    <div className="text-xs text-muted-foreground">economia</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Produtos */}
      <Card className="card-elevated">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            Top Produtos por Economia
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {topProdutos.map((produto, index) => (
              <div key={produto.produto} className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-medium text-foreground">{produto.produto}</div>
                    <div className="text-sm text-muted-foreground">{produto.cotacoes} cotações realizadas</div>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <div className="font-semibold text-foreground">{produto.valor}</div>
                    <div className="text-xs text-muted-foreground">valor total</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-success">-{produto.economia}</div>
                    <div className="text-xs text-muted-foreground">economia</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Insights e Recomendações */}
      <Card className="card-elevated">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Insights e Recomendações
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 rounded-lg bg-success/10 border border-success/20">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-success" />
                <span className="font-medium text-success">Oportunidade</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Produtos de frango têm maior potencial de economia. Considere aumentar frequência de cotações.
              </p>
            </div>
            
            <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="h-4 w-4 text-primary" />
                <span className="font-medium text-primary">Tendência</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Tempo médio de resposta melhorou 25% este trimestre. Fornecedores estão mais engajados.
              </p>
            </div>
            
            <div className="p-4 rounded-lg bg-warning/10 border border-warning/20">
              <div className="flex items-center gap-2 mb-2">
                <Target className="h-4 w-4 text-warning" />
                <span className="font-medium text-warning">Ação</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Considere negociar contratos de longo prazo com fornecedores top performers.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}