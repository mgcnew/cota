import { useState, useEffect } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import ViewHistoricoDialog from "@/components/forms/ViewHistoricoDialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { 
  History, 
  Search,
  Filter,
  Eye,
  Download,
  Calendar,
  TrendingUp,
  TrendingDown,
  FileText,
  ShoppingCart,
  Building2,
  X,
  Loader2
} from "lucide-react";

export default function Historico() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [tipoFilter, setTipoFilter] = useState("all");
  const [usuarioFilter, setUsuarioFilter] = useState("all");
  const [valorMin, setValorMin] = useState("");
  const [valorMax, setValorMax] = useState("");
  const [economiaMin, setEconomiaMin] = useState("");
  const [dataInicio, setDataInicio] = useState<Date>();
  const [dataFim, setDataFim] = useState<Date>();
  
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [historico, setHistorico] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      loadHistorico();
    }
  }, [user]);

  const loadHistorico = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("activity_log")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Transform database data to match UI format
      const formattedData = data.map((item) => ({
        id: item.id,
        tipo: item.tipo,
        acao: item.acao,
        detalhes: item.detalhes,
        data: format(new Date(item.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR }),
        usuario: user?.email || "Usuário",
        valor: item.valor ? `R$ ${item.valor.toFixed(2).replace(".", ",")}` : "",
        economia: item.economia ? `${item.economia}%` : ""
      }));

      setHistorico(formattedData);
    } catch (error) {
      console.error("Erro ao carregar histórico:", error);
      toast({
        title: "Erro ao carregar histórico",
        description: "Não foi possível carregar o histórico de atividades",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getTipoIcon = (tipo: string) => {
    const icons = {
      cotacao: FileText,
      pedido: ShoppingCart,
      fornecedor: Building2,
      produto: TrendingUp
    };
    
    const Icon = icons[tipo as keyof typeof icons] || History;
    return <Icon className="h-4 w-4" />;
  };

  const getTipoBadge = (tipo: string) => {
    const variants = {
      cotacao: "default",
      pedido: "secondary",
      fornecedor: "outline",
      produto: "secondary"
    };
    
    const labels = {
      cotacao: "Cotação",
      pedido: "Pedido", 
      fornecedor: "Fornecedor",
      produto: "Produto"
    };

    return (
      <Badge variant={variants[tipo as keyof typeof variants] as any}>
        {labels[tipo as keyof typeof labels]}
      </Badge>
    );
  };

  const usuarios = [...new Set(historico.map(h => h.usuario))];

  const parseDataHora = (dataString: string) => {
    const [dataPart] = dataString.split(' ');
    const [dia, mes, ano] = dataPart.split('/');
    return new Date(parseInt(ano), parseInt(mes) - 1, parseInt(dia));
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setTipoFilter("all");
    setUsuarioFilter("all");
    setValorMin("");
    setValorMax("");
    setEconomiaMin("");
    setDataInicio(undefined);
    setDataFim(undefined);
  };

  const exportToCSV = () => {
    const headers = ["ID", "Tipo", "Ação", "Detalhes", "Data", "Usuário", "Valor", "Economia"];
    const csvData = filteredHistorico.map(h => [
      h.id,
      h.tipo,
      h.acao,
      h.detalhes,
      h.data,
      h.usuario,
      h.valor,
      h.economia
    ]);

    const csvContent = [
      headers.join(","),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `historico_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Exportação concluída",
      description: "Histórico exportado com sucesso",
    });
  };

  const filteredHistorico = historico.filter(item => {
    const matchesSearch = item.acao.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.detalhes.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTipo = tipoFilter === "all" || item.tipo === tipoFilter;
    const matchesUsuario = usuarioFilter === "all" || item.usuario === usuarioFilter;
    
    const itemValor = item.valor ? parseFloat(item.valor.replace("R$ ", "").replace(".", "").replace(",", ".")) : 0;
    const matchesValorMin = !valorMin || itemValor >= parseFloat(valorMin);
    const matchesValorMax = !valorMax || itemValor <= parseFloat(valorMax);
    
    const itemEconomia = item.economia ? parseFloat(item.economia.replace("%", "")) : 0;
    const matchesEconomia = !economiaMin || itemEconomia >= parseFloat(economiaMin);
    
    const itemData = parseDataHora(item.data);
    const matchesDataInicio = !dataInicio || itemData >= dataInicio;
    const matchesDataFim = !dataFim || itemData <= dataFim;
    
    return matchesSearch && matchesTipo && matchesUsuario && matchesValorMin && 
           matchesValorMax && matchesEconomia && matchesDataInicio && matchesDataFim;
  });

  // Estatísticas do histórico
  const stats = {
    totalAcoes: historico.length,
    cotacoesFinalizadas: historico.filter(h => h.tipo === "cotacao" && h.acao.includes("finalizada")).length,
    pedidosCriados: historico.filter(h => h.tipo === "pedido" && h.acao.includes("criado")).length,
    economiaTotal: historico
      .filter(h => h.economia)
      .reduce((acc, h) => acc + parseFloat(h.economia.replace("%", "")), 0)
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Histórico</h1>
          <p className="text-muted-foreground">
            Acompanhe todas as atividades do sistema
          </p>
        </div>
        <div className="flex gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline">
                <Calendar className="h-4 w-4 mr-2" />
                {dataInicio || dataFim ? "Período Selecionado" : "Filtrar Período"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <div className="p-4 space-y-4">
                <div>
                  <Label className="text-xs text-muted-foreground mb-2 block">Data Início</Label>
                  <CalendarComponent
                    mode="single"
                    selected={dataInicio}
                    onSelect={setDataInicio}
                    locale={ptBR}
                    className="pointer-events-auto"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-2 block">Data Fim</Label>
                  <CalendarComponent
                    mode="single"
                    selected={dataFim}
                    onSelect={setDataFim}
                    locale={ptBR}
                    className="pointer-events-auto"
                  />
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => {
                      setDataInicio(undefined);
                      setDataFim(undefined);
                    }}
                  >
                    Limpar
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
          
          <Button variant="outline" onClick={exportToCSV}>
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4 flex-wrap">
            <div className="relative flex-1 min-w-64">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar no histórico..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <select 
              value={tipoFilter}
              onChange={(e) => setTipoFilter(e.target.value)}
              className="px-3 py-2 border border-border rounded-md bg-background text-foreground"
            >
              <option value="all">Todos os Tipos</option>
              <option value="cotacao">Cotações</option>
              <option value="pedido">Pedidos</option>
              <option value="fornecedor">Fornecedores</option>
              <option value="produto">Produtos</option>
            </select>
            
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline">
                  <Filter className="h-4 w-4 mr-2" />
                  Mais Filtros
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-96" align="end">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold">Filtros Avançados</h4>
                    <Button variant="ghost" size="sm" onClick={handleClearFilters}>
                      <X className="h-4 w-4 mr-1" />
                      Limpar Todos
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <Label>Usuário</Label>
                    <select 
                      value={usuarioFilter}
                      onChange={(e) => setUsuarioFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
                    >
                      <option value="all">Todos os Usuários</option>
                      {usuarios.map(u => (
                        <option key={u} value={u}>{u}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-2">
                      <Label>Valor Mínimo</Label>
                      <Input
                        type="number"
                        placeholder="R$ 0,00"
                        value={valorMin}
                        onChange={(e) => setValorMin(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Valor Máximo</Label>
                      <Input
                        type="number"
                        placeholder="R$ 0,00"
                        value={valorMax}
                        onChange={(e) => setValorMax(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Economia Mínima (%)</Label>
                    <Input
                      type="number"
                      placeholder="0%"
                      value={economiaMin}
                      onChange={(e) => setEconomiaMin(e.target.value)}
                    />
                  </div>

                  {(dataInicio || dataFim) && (
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">Período Selecionado</p>
                      <div className="text-sm">
                        {dataInicio && <div>De: {format(dataInicio, "dd/MM/yyyy", { locale: ptBR })}</div>}
                        {dataFim && <div>Até: {format(dataFim, "dd/MM/yyyy", { locale: ptBR })}</div>}
                      </div>
                    </div>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-foreground">{stats.totalAcoes}</div>
            <p className="text-sm text-muted-foreground">Total de Ações</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-foreground">{stats.cotacoesFinalizadas}</div>
            <p className="text-sm text-muted-foreground">Cotações Finalizadas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-foreground">{stats.pedidosCriados}</div>
            <p className="text-sm text-muted-foreground">Pedidos Criados</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-success">{stats.economiaTotal}%</div>
            <p className="text-sm text-muted-foreground">Economia Acumulada</p>
          </CardContent>
        </Card>
      </div>

      {/* Histórico List */}
      <Card>
        <CardHeader>
          <CardTitle>Atividades Recentes ({filteredHistorico.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredHistorico.map((item) => (
              <div key={item.id} className="flex items-start gap-4 p-4 rounded-lg border border-border hover:bg-muted/30 transition-colors">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mt-0.5">
                  {getTipoIcon(item.tipo)}
                </div>
                
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground">{item.acao}</span>
                    {getTipoBadge(item.tipo)}
                    {item.economia && (
                      <Badge variant="outline" className="text-success border-success">
                        -{item.economia}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {item.detalhes}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>{item.data}</span>
                    <span>por {item.usuario}</span>
                    {item.valor && <span className="font-medium text-foreground">{item.valor}</span>}
                  </div>
                </div>
                
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => {
                    setSelectedItem(item);
                    setViewDialogOpen(true);
                  }}
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </div>
            ))}
            
            {filteredHistorico.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                Nenhuma atividade encontrada com os filtros aplicados.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* View Dialog */}
      {selectedItem && (
        <ViewHistoricoDialog
          open={viewDialogOpen}
          onOpenChange={setViewDialogOpen}
          item={selectedItem}
        />
      )}
    </div>
  );
}