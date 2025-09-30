import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { AuthDialog } from "@/components/auth/AuthDialog";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  FileText, 
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  Download,
  Calendar,
  DollarSign,
  Building2
} from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import AddQuoteDialog from "@/components/forms/AddQuoteDialog";
import EditQuoteDialog from "@/components/forms/EditQuoteDialog";
import DeleteQuoteDialog from "@/components/forms/DeleteQuoteDialog";
import ViewQuoteDialog from "@/components/forms/ViewQuoteDialog";
import { StatusBadge } from "@/components/ui/status-badge";
import { MetricCard } from "@/components/ui/metric-card";
import { ViewToggle } from "@/components/ui/view-toggle";
import { DataPagination } from "@/components/ui/data-pagination";
import { usePagination } from "@/hooks/usePagination";
import { ViewMode } from "@/types/pagination";

interface FornecedorParticipante {
  id: string;
  nome: string;
  valorOferecido: number;
  dataResposta: string | null;
  observacoes: string;
  status: "pendente" | "respondido";
}

interface Quote {
  id: string;
  produto: string;
  quantidade: string;
  status: string;
  dataInicio: string;
  dataFim: string;
  fornecedores: number;
  melhorPreco: string;
  melhorFornecedor: string;
  economia: string;
  fornecedoresParticipantes: FornecedorParticipante[];
}

export default function Cotacoes() {
  const { user } = useAuth();
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const { paginate } = usePagination<Quote>({ initialItemsPerPage: 10 });
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [cotacoes, setCotacoes] = useState<Quote[]>([]);

  // Mock data temporário para EditQuoteDialog
  const mockProducts = [
    { id: "1", name: "Coxa com Sobrecoxa" },
    { id: "2", name: "Filé de Frango" },
    { id: "3", name: "Linguiça Toscana Aurora" },
    { id: "4", name: "Contra Filé" },
    { id: "5", name: "Peito de Frango" },
  ];

  const mockSuppliers = [
    { id: "1", name: "Holambra" },
    { id: "2", name: "Seara" },
    { id: "3", name: "Davi" },
    { id: "4", name: "Adriano/Sidio" },
    { id: "5", name: "Amandinha" },
  ];

  useEffect(() => {
    if (!user) {
      setAuthDialogOpen(true);
    } else {
      loadQuotes();
    }
  }, [user]);

  const loadQuotes = async () => {
    try {
      setLoading(true);
      
      // Buscar cotações
      const { data: quotesData, error: quotesError } = await supabase
        .from("quotes")
        .select(`
          *,
          quote_items (*),
          quote_suppliers (*)
        `)
        .order("created_at", { ascending: false });

      if (quotesError) throw quotesError;

      // Transformar dados para o formato esperado
      const formattedQuotes: Quote[] = (quotesData || []).map((quote: any, index: number) => {
        const items = quote.quote_items || [];
        const suppliers = quote.quote_suppliers || [];
        
        // Formatar produtos
        const produtosTexto = items.length > 0
          ? items.map((item: any) => `${item.product_name} (${item.quantidade}${item.unidade})`).join(", ")
          : "Sem produtos";

        // Calcular melhor preço
        const valoresRespondidos = suppliers
          .filter((s: any) => s.valor_oferecido > 0)
          .map((s: any) => Number(s.valor_oferecido));
        
        const melhorValor = valoresRespondidos.length > 0 ? Math.min(...valoresRespondidos) : 0;
        const fornecedorMelhorPreco = suppliers.find((s: any) => Number(s.valor_oferecido) === melhorValor);

        // Formatar fornecedores participantes
        const fornecedoresParticipantes: FornecedorParticipante[] = suppliers.map((s: any) => ({
          id: s.supplier_id,
          nome: s.supplier_name,
          valorOferecido: Number(s.valor_oferecido) || 0,
          dataResposta: s.data_resposta ? new Date(s.data_resposta).toLocaleDateString("pt-BR") : null,
          observacoes: s.observacoes || "",
          status: s.status as "pendente" | "respondido"
        }));

        return {
          id: `COT-${String(index + 1).padStart(3, '0')}`,
          produto: produtosTexto,
          quantidade: `${items.length} produto(s)`,
          status: quote.status,
          dataInicio: new Date(quote.data_inicio).toLocaleDateString("pt-BR"),
          dataFim: new Date(quote.data_fim).toLocaleDateString("pt-BR"),
          fornecedores: suppliers.length,
          melhorPreco: melhorValor > 0 ? `R$ ${melhorValor.toFixed(2)}` : "R$ 0.00",
          melhorFornecedor: fornecedorMelhorPreco?.supplier_name || "Aguardando",
          economia: "0%",
          fornecedoresParticipantes
        };
      });

      setCotacoes(formattedQuotes);
    } catch (error) {
      console.error("Erro ao carregar cotações:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as cotações",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return <AuthDialog open={authDialogOpen} onOpenChange={setAuthDialogOpen} />;
  }

  const handleAddQuote = async () => {
    // Recarregar cotações após adicionar
    await loadQuotes();
  };

  const handleEditQuote = (id: string, data: any) => {
    // TODO: Implementar edição no banco
    setCotacoes(cotacoes.map(cotacao => 
      cotacao.id === id 
        ? {
            ...cotacao,
            produto: data.produto,
            quantidade: `${data.quantidade}${data.unidade}`,
            status: data.status,
            dataInicio: data.dataInicio.toLocaleDateString("pt-BR"),
            dataFim: data.dataFim.toLocaleDateString("pt-BR"),
            fornecedores: data.fornecedorId && data.fornecedorId !== "all" ? 1 : mockSuppliers.length,
          }
        : cotacao
    ));
  };

  const handleDeleteQuote = (id: string) => {
    // TODO: Implementar exclusão no banco
    setCotacoes(cotacoes.filter(cotacao => cotacao.id !== id));
  };

  const handleUpdateSupplierValue = (quoteId: string, supplierId: string, newValue: number) => {
    // TODO: Implementar atualização no banco
    setCotacoes(cotacoes.map(cotacao => {
      if (cotacao.id === quoteId) {
        const updatedFornecedores = cotacao.fornecedoresParticipantes.map(f => 
          f.id === supplierId 
            ? { 
                ...f, 
                valorOferecido: newValue,
                dataResposta: new Date().toLocaleDateString("pt-BR"),
                status: "respondido" as const
              }
            : f
        );

        // Recalcular melhor preço
        const valoresRespondidos = updatedFornecedores
          .filter(f => f.valorOferecido > 0)
          .map(f => f.valorOferecido);
        
        const melhorValor = valoresRespondidos.length > 0 ? Math.min(...valoresRespondidos) : 0;
        const fornecedorMelhorPreco = updatedFornecedores.find(f => f.valorOferecido === melhorValor);

        return {
          ...cotacao,
          fornecedoresParticipantes: updatedFornecedores,
          melhorPreco: melhorValor > 0 ? `R$ ${melhorValor.toFixed(2)}` : "R$ 0.00",
          melhorFornecedor: fornecedorMelhorPreco?.nome || "Aguardando",
        };
      }
      return cotacao;
    }));
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      ativa: "default",
      concluida: "secondary", 
      pendente: "outline",
      expirada: "destructive"
    };
    
    const labels = {
      ativa: "Ativa",
      concluida: "Concluída",
      pendente: "Pendente", 
      expirada: "Expirada"
    };

    return (
      <Badge variant={variants[status as keyof typeof variants] as any}>
        {labels[status as keyof typeof labels]}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Carregando cotações...</p>
      </div>
    );
  }

  const filteredCotacoes = cotacoes.filter(cotacao => {
    const matchesSearch = cotacao.produto.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         cotacao.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || cotacao.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const paginatedData = paginate(filteredCotacoes);

  return (
    <div className="p-3 md:p-6 space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Cotações</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Gerencie todas as cotações da empresa
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ViewToggle view={viewMode} onViewChange={setViewMode} />
          <AddQuoteDialog onAdd={handleAddQuote} />
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4 flex-wrap">
            <div className="relative flex-1 min-w-64">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por produto ou ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-border rounded-md bg-background text-foreground"
            >
              <option value="all">Todos os Status</option>
              <option value="ativa">Ativas</option>
              <option value="pendente">Pendentes</option>
              <option value="concluida">Concluídas</option>
              <option value="expirada">Expiradas</option>
            </select>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Filtros
            </Button>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      <div className="grid gap-3 md:gap-4 grid-cols-2 md:grid-cols-4">
        <MetricCard
          title="Cotações Ativas"
          value={cotacoes.filter(c => c.status === "ativa").length}
          icon={FileText}
          variant="success"
        />
        <MetricCard
          title="Aguardando Respostas"
          value={cotacoes.filter(c => c.status === "pendente").length}
          icon={Calendar}
          variant="warning"
        />
        <MetricCard
          title="Economia Total"
          value="R$ 47.231"
          icon={DollarSign}
          variant="success"
        />
        <MetricCard
          title="Fornecedores Médio"
          value={Math.round(cotacoes.reduce((acc, c) => acc + c.fornecedores, 0) / cotacoes.length)}
          icon={Building2}
          variant="info"
        />
      </div>

      {/* Cotações View */}
      {viewMode === "grid" ? (
        <div className="grid gap-3 md:gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {paginatedData.items.map((cotacao) => (
            <Card key={cotacao.id} className="card-elevated border-2 hover:border-primary/30 transition-all hover:shadow-lg">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1">
                    <CardTitle className="text-lg">{cotacao.produto}</CardTitle>
                    <div className="flex items-center gap-2 flex-wrap">
                      {getStatusBadge(cotacao.status)}
                      <Badge variant="outline">{cotacao.quantidade}</Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">ID:</span>
                    <span className="font-medium">{cotacao.id}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Fornecedores:</span>
                    <span className="font-medium">{cotacao.fornecedores}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Período:</span>
                    <span className="font-medium text-xs">{cotacao.dataInicio} - {cotacao.dataFim}</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-border">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-muted-foreground">Melhor Preço</p>
                      <p className="text-xl font-bold text-success">{cotacao.melhorPreco}</p>
                      <p className="text-xs text-muted-foreground">{cotacao.melhorFornecedor}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant="secondary" className="text-success">
                        -{cotacao.economia}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="flex gap-1">
                  <ViewQuoteDialog 
                    quote={cotacao}
                    onUpdateSupplierValue={handleUpdateSupplierValue}
                  />
                  <EditQuoteDialog 
                    quote={cotacao}
                    onEdit={handleEditQuote}
                    products={mockProducts}
                    suppliers={mockSuppliers}
                  />
                  <DeleteQuoteDialog 
                    quote={cotacao}
                    onDelete={handleDeleteQuote}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cotação</TableHead>
                    <TableHead className="hidden md:table-cell">Produto</TableHead>
                    <TableHead className="hidden lg:table-cell">Período</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Melhor Preço</TableHead>
                    <TableHead className="hidden sm:table-cell">Fornecedores</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedData.items.map((cotacao) => (
                    <TableRow key={cotacao.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <FileText className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <div className="font-medium">{cotacao.id}</div>
                            <div className="text-xs text-muted-foreground md:hidden">{cotacao.produto}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div>
                          <div className="font-medium">{cotacao.produto}</div>
                          <div className="text-xs text-muted-foreground">{cotacao.quantidade}</div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <div className="text-sm">
                          <div>{cotacao.dataInicio}</div>
                          <div className="text-muted-foreground">{cotacao.dataFim}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(cotacao.status)}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-semibold text-success">{cotacao.melhorPreco}</div>
                          <div className="text-xs text-muted-foreground">{cotacao.melhorFornecedor}</div>
                          <div className="text-xs text-success">-{cotacao.economia}</div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Badge variant="outline">{cotacao.fornecedores}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <ViewQuoteDialog 
                            quote={cotacao}
                            onUpdateSupplierValue={handleUpdateSupplierValue}
                          />
                          <EditQuoteDialog 
                            quote={cotacao}
                            onEdit={handleEditQuote}
                            products={mockProducts}
                            suppliers={mockSuppliers}
                          />
                          <DeleteQuoteDialog 
                            quote={cotacao}
                            onDelete={handleDeleteQuote}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <DataPagination
              currentPage={paginatedData.pagination.currentPage}
              totalPages={paginatedData.pagination.totalPages}
              itemsPerPage={paginatedData.pagination.itemsPerPage}
              totalItems={paginatedData.pagination.totalItems}
              onPageChange={paginatedData.pagination.goToPage}
              onItemsPerPageChange={paginatedData.pagination.setItemsPerPage}
              startIndex={paginatedData.pagination.startIndex}
              endIndex={paginatedData.pagination.endIndex}
            />
          </CardContent>
        </Card>
      )}

      {filteredCotacoes.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma cotação encontrada</h3>
            <p className="text-muted-foreground mb-4">
              Tente ajustar os filtros ou crie uma nova cotação
            </p>
          </CardContent>
        </Card>
      )}

    </div>
  );
}