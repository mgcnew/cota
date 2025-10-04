import { useState, useMemo, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useCotacoes } from "@/hooks/useCotacoes";
import { useDebounce } from "@/hooks/useDebounce";
import type { Quote, FornecedorParticipante } from "@/hooks/useCotacoes";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { FileText, Plus, Search, Filter, Eye, Edit, Trash2, Download, Calendar, DollarSign, Building2, MoreVertical, ChevronDown } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  const {
    paginate
  } = usePagination<Quote>({
    initialItemsPerPage: 10
  });
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [statusFilter, setStatusFilter] = useState("all");
  const addQuoteRef = useRef<HTMLButtonElement>(null);

  // OPTIMIZED: Use React Query with single optimized query (no N+1)
  const {
    cotacoes,
    isLoading,
    refetch,
    updateSupplierProductValue,
    deleteQuote,
    updateQuote,
    isUpdating
  } = useCotacoes();
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
    return <Badge variant={variants[status as keyof typeof variants] as any}>
        {labels[status as keyof typeof labels]}
      </Badge>;
  };

  // OPTIMIZED: Memoize filtered results
  const filteredCotacoes = useMemo(() => {
    return cotacoes.filter(cotacao => {
      const matchesSearch = cotacao.produto.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) || cotacao.id.toLowerCase().includes(debouncedSearchTerm.toLowerCase());
      const matchesStatus = statusFilter === "all" || cotacao.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [cotacoes, debouncedSearchTerm, statusFilter]);
  if (isLoading) {
    return <div className="p-6 flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Carregando cotações...</p>
      </div>;
  }
  const paginatedData = paginate(filteredCotacoes);
  return <div className="p-3 md:p-6 space-y-4 md:space-y-6">
      {/* Header Cotações com Tema Teal */}
      <div className="bg-gradient-to-r from-teal-50 to-cyan-50 rounded-2xl p-6 border border-teal-100 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-r from-teal-600 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg">
                  <FileText className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="font-bold text-3xl bg-gradient-to-r from-teal-900 to-cyan-700 bg-clip-text text-transparent">
                    Cotações
                  </h1>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-teal-100 text-teal-700 border border-teal-200 shadow-sm">
                      <DollarSign className="h-3 w-3" />
                      Sistema de Cotações
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 text-sm">
              <div className="flex items-center gap-2 text-gray-700 bg-white/60 px-3 py-2 rounded-lg backdrop-blur-sm">
                <FileText className="h-4 w-4 text-teal-600" />
                <span className="font-medium">Gerencie todas as cotações da empresa</span>
              </div>
              
              <div className="flex items-center gap-2 text-gray-600 bg-white/40 px-3 py-2 rounded-lg backdrop-blur-sm">
                <Calendar className="h-4 w-4 text-cyan-500" />
                <span>{filteredCotacoes.length} cotações no sistema</span>
              </div>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <ViewToggle view={viewMode} onViewChange={setViewMode} />
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 border-0">
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
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 min-w-64">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar por produto ou ID..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-9" />
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

      {/* Statistics Cards Melhorados */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-teal-500 bg-gradient-to-br from-teal-50/50 to-cyan-50/30">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="p-2.5 rounded-xl bg-gradient-to-br from-teal-500/10 to-cyan-500/10 relative">
                    <FileText className="h-5 w-5 text-teal-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-600">Cotações Ativas</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">{cotacoes.filter(c => c.status === "ativa").length}</div>
              </div>
              <div className="flex items-center gap-1 text-teal-600 bg-teal-100 px-2 py-1 rounded-full">
                <FileText className="h-3 w-3" />
                <span className="text-xs font-medium">Ativas</span>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-teal-600 h-2 rounded-full transition-all duration-500" style={{ width: '75%' }}></div>
              </div>
              <span className="text-xs text-gray-500">75%</span>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-amber-500 bg-gradient-to-br from-amber-50/50 to-yellow-50/30">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500/10 to-yellow-500/10 relative">
                    <Calendar className="h-5 w-5 text-amber-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-600">Aguardando Respostas</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">{cotacoes.filter(c => c.status === "pendente").length}</div>
              </div>
              <div className="flex items-center gap-1 text-amber-600 bg-amber-100 px-2 py-1 rounded-full">
                <Calendar className="h-3 w-3" />
                <span className="text-xs font-medium">Pendente</span>
              </div>
            </div>
            <div className="mt-4 text-xs text-gray-500">
              {Math.floor(cotacoes.filter(c => c.status === "pendente").length * 0.6)} há mais de 24h
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-green-500 bg-gradient-to-br from-green-50/50 to-emerald-50/30">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="p-2.5 rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 relative">
                    <DollarSign className="h-5 w-5 text-green-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-600">Economia Total</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">R$ 47.231</div>
              </div>
              <div className="flex items-center gap-1 text-green-600 bg-green-100 px-2 py-1 rounded-full">
                <DollarSign className="h-3 w-3" />
                <span className="text-xs font-medium">+18%</span>
              </div>
            </div>
            <div className="mt-4 text-xs text-gray-500">
              Meta mensal: R$ 50.000 • Restam R$ 2.769
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-blue-500 bg-gradient-to-br from-blue-50/50 to-indigo-50/30">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500/10 to-indigo-500/10 relative">
                    <Building2 className="h-5 w-5 text-blue-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-600">Fornecedores Médio</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">{cotacoes.length > 0 ? Math.round(cotacoes.reduce((acc, c) => acc + c.fornecedores, 0) / cotacoes.length) : 0}</div>
              </div>
              <div className="flex items-center gap-1 text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                <Building2 className="h-3 w-3" />
                <span className="text-xs font-medium">Por cotação</span>
              </div>
            </div>
            <div className="mt-4 text-xs text-gray-500">
              Média de participantes por cotação
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cotações View */}
      {viewMode === "grid" ? <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {paginatedData.items.map(cotacao => {
        const getStatusColors = (status: string) => {
          switch (status) {
            case "ativa":
              return {
                border: "border-teal-300/60",
                bg: "from-white to-teal-50/30",
                iconBg: "from-teal-500/10 to-cyan-500/10 group-hover:from-teal-500/20 group-hover:to-cyan-500/20",
                iconColor: "text-teal-600"
              };
            case "pendente":
              return {
                border: "border-amber-300/60",
                bg: "from-white to-amber-50/30",
                iconBg: "from-amber-500/10 to-yellow-500/10 group-hover:from-amber-500/20 group-hover:to-yellow-500/20",
                iconColor: "text-amber-600"
              };
            case "concluida":
              return {
                border: "border-green-300/60",
                bg: "from-white to-green-50/30",
                iconBg: "from-green-500/10 to-emerald-500/10 group-hover:from-green-500/20 group-hover:to-emerald-500/20",
                iconColor: "text-green-600"
              };
            default:
              return {
                border: "border-red-300/60",
                bg: "from-white to-red-50/30",
                iconBg: "from-red-500/10 to-pink-500/10 group-hover:from-red-500/20 group-hover:to-pink-500/20",
                iconColor: "text-red-600"
              };
          }
        };
        
        const colors = getStatusColors(cotacao.status);
        
        return <Card key={cotacao.id} className={cn("group hover:shadow-xl transition-all duration-300 border border-gray-200/60 hover:", colors.border, "bg-gradient-to-br", colors.bg, "backdrop-blur-sm")}>
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <div className={cn("p-2.5 rounded-xl transition-all duration-300", colors.iconBg)}>
                      <FileText className={cn("h-5 w-5 group-hover:scale-110 transition-transform duration-300", colors.iconColor)} />
                    </div>
                    <div className="space-y-2 flex-1 min-w-0">
                      <CardTitle className="text-lg font-semibold text-gray-900 group-hover:text-teal-700 transition-colors duration-300 truncate">
                        {cotacao.produto}
                      </CardTitle>
                      <div className="flex items-center gap-2 flex-wrap">
                        {getStatusBadge(cotacao.status)}
                        <Badge variant="outline" className="bg-gray-50/80 border-gray-200/60 text-gray-700 font-medium text-xs">
                          {cotacao.quantidade}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-teal-100">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Eye className="h-4 w-4 mr-2" />
                        Ver Detalhes
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Edit className="h-4 w-4 mr-2" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="p-4 rounded-xl bg-gray-50/80 border border-gray-200/60">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="h-4 w-4 text-gray-500" />
                        <span className="text-sm font-medium text-gray-600">ID</span>
                      </div>
                      <p className="text-sm font-bold text-gray-800">{cotacao.id}</p>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Building2 className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-700">Fornecedores</span>
                      </div>
                      <p className="text-sm font-bold text-blue-800">{cotacao.fornecedores}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="p-3 rounded-lg bg-indigo-50/80 border border-indigo-200/60">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="h-4 w-4 text-indigo-600" />
                      <span className="text-sm font-medium text-indigo-700">Período</span>
                    </div>
                    <p className="text-xs font-semibold text-indigo-800">{cotacao.dataInicio} - {cotacao.dataFim}</p>
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-200">
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
                  <ViewQuoteDialog quote={cotacao} onUpdateSupplierProductValue={(quoteId, supplierId, productId, newValue) => updateSupplierProductValue({
                  quoteId,
                  supplierId,
                  productId,
                  newValue
                })} trigger={<DropdownMenuItem onSelect={e => e.preventDefault()}>
                        <Eye className="h-4 w-4 mr-2" />
                        Visualizar
                      </DropdownMenuItem>} />
                    <EditQuoteDialog quote={cotacao} onEdit={(quoteId, data) => updateQuote({
                  quoteId,
                  data
                })} trigger={<DropdownMenuItem onSelect={e => e.preventDefault()}>
                        <Edit className="h-4 w-4 mr-2" />
                        Editar
                      </DropdownMenuItem>} />
                    <DeleteQuoteDialog quote={cotacao} onDelete={id => deleteQuote(id)} trigger={<DropdownMenuItem onSelect={e => e.preventDefault()} className="text-destructive">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Excluir
                      </DropdownMenuItem>} />
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardContent>
            </Card>;
      })}
        </div> : <Card>
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
                  {paginatedData.items.map(cotacao => <TableRow key={cotacao.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <FileText className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            
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
                              <ViewQuoteDialog quote={cotacao} onUpdateSupplierProductValue={(quoteId, supplierId, productId, newValue) => updateSupplierProductValue({
                          quoteId,
                          supplierId,
                          productId,
                          newValue
                        })} trigger={<DropdownMenuItem onSelect={e => e.preventDefault()}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  Visualizar
                                </DropdownMenuItem>} />
                              <EditQuoteDialog quote={cotacao} onEdit={(quoteId, data) => updateQuote({
                          quoteId,
                          data
                        })} trigger={<DropdownMenuItem onSelect={e => e.preventDefault()}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Editar
                                </DropdownMenuItem>} />
                              <DeleteQuoteDialog quote={cotacao} onDelete={id => deleteQuote(id)} trigger={<DropdownMenuItem onSelect={e => e.preventDefault()} className="text-destructive">
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Excluir
                                </DropdownMenuItem>} />
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>)}
                </TableBody>
              </Table>
            </div>
            <DataPagination currentPage={paginatedData.pagination.currentPage} totalPages={paginatedData.pagination.totalPages} itemsPerPage={paginatedData.pagination.itemsPerPage} totalItems={paginatedData.pagination.totalItems} onPageChange={paginatedData.pagination.goToPage} onItemsPerPageChange={paginatedData.pagination.setItemsPerPage} startIndex={paginatedData.pagination.startIndex} endIndex={paginatedData.pagination.endIndex} />
          </CardContent>
        </Card>}

      {filteredCotacoes.length === 0 && !isLoading && <Card>
          <CardContent className="p-12 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma cotação encontrada</h3>
            <p className="text-muted-foreground mb-4">
              Tente ajustar os filtros ou crie uma nova cotação
            </p>
          </CardContent>
        </Card>}

      {/* Hidden trigger for dialog */}
      <div className="hidden">
        <AddQuoteDialog onAdd={refetch} trigger={<button ref={addQuoteRef} />} />
      </div>
    </div>;
}