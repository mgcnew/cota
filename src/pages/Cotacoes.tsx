import { useState, useMemo, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useCotacoes } from "@/hooks/useCotacoes";
import { useDebounce } from "@/hooks/useDebounce";
import type { Quote, FornecedorParticipante } from "@/hooks/useCotacoes";
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
  Building2,
  MoreVertical,
  ChevronDown
} from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { cn } from "@/lib/utils";

export default function Cotacoes() {
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const { paginate } = usePagination<Quote>({ initialItemsPerPage: 10 });
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [statusFilter, setStatusFilter] = useState("all");
  
  const addQuoteRef = useRef<HTMLButtonElement>(null);

  // OPTIMIZED: Use React Query with single optimized query (no N+1)
  const { cotacoes, isLoading, refetch } = useCotacoes();

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

  // OPTIMIZED: Memoize filtered results
  const filteredCotacoes = useMemo(() => {
    return cotacoes.filter(cotacao => {
      const matchesSearch = cotacao.produto.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
                           cotacao.id.toLowerCase().includes(debouncedSearchTerm.toLowerCase());
      const matchesStatus = statusFilter === "all" || cotacao.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [cotacoes, debouncedSearchTerm, statusFilter]);

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Carregando cotações...</p>
      </div>
    );
  }

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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button>
                Ações
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => addQuoteRef.current?.click()}>
                <Plus className="h-4 w-4 mr-2" />
                Nova Cotação
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 min-w-64">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por produto ou ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="ativa">Ativas</SelectItem>
                <SelectItem value="pendente">Pendentes</SelectItem>
                <SelectItem value="concluida">Concluídas</SelectItem>
                <SelectItem value="expirada">Expiradas</SelectItem>
              </SelectContent>
            </Select>
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
          {paginatedData.items.map((cotacao) => {
            const cardClass = cotacao.status === "ativa" ? "card-status-active" : 
                            cotacao.status === "pendente" ? "card-status-pending" :
                            cotacao.status === "concluida" ? "card-status-completed" : "card-status-error";
            
            return (
            <Card key={cotacao.id} className={cn("group", cardClass)}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <div className={cn(
                      "p-2.5 rounded-xl transition-all duration-300 group-hover:scale-110",
                      cotacao.status === "ativa" ? "bg-success/10" : 
                      cotacao.status === "pendente" ? "bg-warning/10" :
                      cotacao.status === "concluida" ? "bg-info/10" : "bg-error/10"
                    )}>
                      <FileText className={cn(
                        "h-5 w-5",
                        cotacao.status === "ativa" ? "text-success" : 
                        cotacao.status === "pendente" ? "text-warning" :
                        cotacao.status === "concluida" ? "text-info" : "text-error"
                      )} />
                    </div>
                    <div className="space-y-1 flex-1">
                      <CardTitle className="text-lg leading-tight">{cotacao.produto}</CardTitle>
                      <div className="flex items-center gap-2 flex-wrap">
                        {getStatusBadge(cotacao.status)}
                        <Badge variant="outline" className="text-xs">{cotacao.quantidade}</Badge>
                      </div>
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

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="ml-auto">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <ViewQuoteDialog 
                      quote={cotacao}
                      onUpdateSupplierValue={() => {}}
                      trigger={
                        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                          <Eye className="h-4 w-4 mr-2" />
                          Visualizar
                        </DropdownMenuItem>
                      }
                    />
                    <EditQuoteDialog 
                      quote={cotacao}
                      onEdit={() => {}}
                      products={[]}
                      suppliers={mockSuppliers}
                      trigger={
                        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                          <Edit className="h-4 w-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                      }
                    />
                    <DeleteQuoteDialog 
                      quote={cotacao}
                      onDelete={() => {}}
                      trigger={
                        <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Excluir
                        </DropdownMenuItem>
                      }
                    />
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardContent>
            </Card>
            );
          })}
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
                        <div className="flex justify-end">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <ViewQuoteDialog 
                                quote={cotacao}
                                onUpdateSupplierValue={() => {}}
                                trigger={
                                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                    <Eye className="h-4 w-4 mr-2" />
                                    Visualizar
                                  </DropdownMenuItem>
                                }
                              />
                              <EditQuoteDialog 
                                quote={cotacao}
                                onEdit={() => {}}
                                products={[]}
                                suppliers={mockSuppliers}
                                trigger={
                                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Editar
                                  </DropdownMenuItem>
                                }
                              />
                              <DeleteQuoteDialog 
                                quote={cotacao}
                                onDelete={() => {}}
                                trigger={
                                  <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive">
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Excluir
                                  </DropdownMenuItem>
                                }
                              />
                            </DropdownMenuContent>
                          </DropdownMenu>
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

      {filteredCotacoes.length === 0 && !isLoading && (
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

      {/* Hidden trigger for dialog */}
      <div className="hidden">
        <AddQuoteDialog 
          onAdd={refetch}
          trigger={<button ref={addQuoteRef} />}
        />
      </div>
    </div>
  );
}