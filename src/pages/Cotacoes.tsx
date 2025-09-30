import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
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
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const { paginate } = usePagination<Quote>({ initialItemsPerPage: 10 });
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

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

  // Mock data baseado na planilha Excel
  const [cotacoes, setCotacoes] = useState<Quote[]>([
    {
      id: "COT-001",
      produto: "Coxa com Sobrecoxa",
      quantidade: "500kg",
      status: "ativa",
      dataInicio: "22/09/2025",
      dataFim: "29/09/2025",
      fornecedores: 5,
      melhorPreco: "R$ 7.60",
      melhorFornecedor: "Holambra",
      economia: "12%",
      fornecedoresParticipantes: [
        { id: "1", nome: "Holambra", valorOferecido: 7.60, dataResposta: "23/09/2025", observacoes: "", status: "respondido" },
        { id: "2", nome: "Seara", valorOferecido: 8.20, dataResposta: "23/09/2025", observacoes: "", status: "respondido" },
        { id: "3", nome: "Davi", valorOferecido: 7.95, dataResposta: "24/09/2025", observacoes: "", status: "respondido" },
        { id: "4", nome: "Adriano/Sidio", valorOferecido: 8.50, dataResposta: null, observacoes: "", status: "pendente" },
        { id: "5", nome: "Amandinha", valorOferecido: 7.80, dataResposta: "22/09/2025", observacoes: "", status: "respondido" },
      ]
    },
    {
      id: "COT-002", 
      produto: "Filé de Frango",
      quantidade: "500kg",
      status: "concluida",
      dataInicio: "15/09/2025",
      dataFim: "22/09/2025",
      fornecedores: 3,
      melhorPreco: "R$ 15.84",
      melhorFornecedor: "Seara",
      economia: "8%",
      fornecedoresParticipantes: [
        { id: "2", nome: "Seara", valorOferecido: 15.84, dataResposta: "16/09/2025", observacoes: "", status: "respondido" },
        { id: "3", nome: "Davi", valorOferecido: 16.20, dataResposta: "17/09/2025", observacoes: "", status: "respondido" },
        { id: "5", nome: "Amandinha", valorOferecido: 16.50, dataResposta: "16/09/2025", observacoes: "", status: "respondido" },
      ]
    },
    {
      id: "COT-003",
      produto: "Linguiça Toscana Aurora",
      quantidade: "200kg",
      status: "pendente",
      dataInicio: "17/09/2025",
      dataFim: "24/09/2025",
      fornecedores: 3,
      melhorPreco: "R$ 18.49",
      melhorFornecedor: "Davi",
      economia: "15%",
      fornecedoresParticipantes: [
        { id: "3", nome: "Davi", valorOferecido: 18.49, dataResposta: "18/09/2025", observacoes: "", status: "respondido" },
        { id: "1", nome: "Holambra", valorOferecido: 0, dataResposta: null, observacoes: "", status: "pendente" },
        { id: "2", nome: "Seara", valorOferecido: 0, dataResposta: null, observacoes: "", status: "pendente" },
      ]
    },
    {
      id: "COT-004",
      produto: "Contra Filé",
      quantidade: "300kg",
      status: "ativa",
      dataInicio: "18/09/2025",
      dataFim: "25/09/2025",
      fornecedores: 4,
      melhorPreco: "R$ 36.00",
      melhorFornecedor: "Silvia",
      economia: "5%",
      fornecedoresParticipantes: [
        { id: "1", nome: "Holambra", valorOferecido: 37.20, dataResposta: "19/09/2025", observacoes: "", status: "respondido" },
        { id: "3", nome: "Davi", valorOferecido: 36.00, dataResposta: "20/09/2025", observacoes: "", status: "respondido" },
        { id: "4", nome: "Adriano/Sidio", valorOferecido: 0, dataResposta: null, observacoes: "", status: "pendente" },
        { id: "5", nome: "Amandinha", valorOferecido: 36.50, dataResposta: "19/09/2025", observacoes: "", status: "respondido" },
      ]
    },
    {
      id: "COT-005",
      produto: "Peito de Frango",
      quantidade: "400kg",
      status: "expirada",
      dataInicio: "10/09/2025",
      dataFim: "17/09/2025",
      fornecedores: 2,
      melhorPreco: "R$ 12.50",
      melhorFornecedor: "Adriano/Sidio",
      economia: "7%",
      fornecedoresParticipantes: [
        { id: "4", nome: "Adriano/Sidio", valorOferecido: 12.50, dataResposta: "11/09/2025", observacoes: "", status: "respondido" },
        { id: "2", nome: "Seara", valorOferecido: 13.20, dataResposta: "12/09/2025", observacoes: "", status: "respondido" },
      ]
    }
  ]);

  const handleAddQuote = async (data: any) => {
    try {
      // Buscar nomes dos fornecedores
      const { data: suppliersData } = await supabase
        .from("suppliers")
        .select("id, name")
        .in("id", data.fornecedoresIds);

      const fornecedoresParticipantes: FornecedorParticipante[] = data.fornecedoresIds.map((supplierId: string) => {
        const supplier = suppliersData?.find(s => s.id === supplierId);
        return {
          id: supplierId,
          nome: supplier?.name || "Desconhecido",
          valorOferecido: 0,
          dataResposta: null,
          observacoes: "",
          status: "pendente" as const
        };
      });

      // Formatação dos produtos para exibição
      const produtosTexto = data.produtos.map((p: any) => 
        `${p.produtoNome} (${p.quantidade}${p.unidade})`
      ).join(", ");

      const newQuote: Quote = {
        id: `COT-${String(cotacoes.length + 1).padStart(3, '0')}`,
        produto: produtosTexto,
        quantidade: `${data.produtos.length} produto(s)`,
        status: "ativa",
        dataInicio: data.dataInicio.toLocaleDateString("pt-BR"),
        dataFim: data.dataFim.toLocaleDateString("pt-BR"),
        fornecedores: fornecedoresParticipantes.length,
        melhorPreco: "R$ 0.00",
        melhorFornecedor: "Aguardando",
        economia: "0%",
        fornecedoresParticipantes
      };
      setCotacoes([newQuote, ...cotacoes]);
    } catch (error) {
      console.error("Erro ao criar cotação:", error);
    }
  };

  const handleEditQuote = (id: string, data: any) => {
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
    setCotacoes(cotacoes.filter(cotacao => cotacao.id !== id));
  };

  const handleUpdateSupplierValue = (quoteId: string, supplierId: string, newValue: number) => {
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