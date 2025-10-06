import { useState, useEffect, useMemo, useRef } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useSuppliers } from "@/hooks/useSuppliers";
import { AuthDialog } from "@/components/auth/AuthDialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Building2, Search, Plus, Phone, Mail, MapPin, TrendingUp, DollarSign, FileText, MoreVertical, Edit, Trash2, Star, Upload, Eye, ChevronDown } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import AddSupplierDialog from "@/components/forms/AddSupplierDialog";
import EditSupplierDialog from "@/components/forms/EditSupplierDialog";
import DeleteSupplierDialog from "@/components/forms/DeleteSupplierDialog";
import AddQuoteDialog from "@/components/forms/AddQuoteDialog";
import { ImportSuppliersDialog } from "@/components/forms/ImportSuppliersDialog";
import { toast } from "@/hooks/use-toast";
import { MetricCard } from "@/components/ui/metric-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { ViewToggle } from "@/components/ui/view-toggle";
import { DataPagination } from "@/components/ui/data-pagination";
import { usePagination } from "@/hooks/usePagination";
import { useResponsiveViewMode } from "@/hooks/useResponsiveViewMode";
import { ViewMode } from "@/types/pagination";
interface Supplier {
  id: string;
  name: string;
  contact: string;
  limit: string;
  activeQuotes: number;
  totalQuotes: number;
  avgPrice: string;
  lastOrder: string;
  rating: number;
  status: "active" | "inactive" | "pending";
  phone?: string;
  email?: string;
  address?: string;
}
type SupplierFormData = {
  name: string;
  contact: string;
  phone?: string;
  email?: string;
  address?: string;
  limit: string;
  status: "active" | "inactive" | "pending";
};
export default function Fornecedores() {
  const {
    user,
    loading
  } = useAuth();
  const {
    suppliers,
    isLoading: suppliersLoading,
    refetch
  } = useSuppliers();
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const { viewMode, setViewMode } = useResponsiveViewMode();
  const {
    paginate
  } = usePagination<Supplier>({
    initialItemsPerPage: 10
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive" | "pending">("all");
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [deletingSupplier, setDeletingSupplier] = useState<Supplier | null>(null);
  const addSupplierRef = useRef<HTMLButtonElement>(null);
  const importSuppliersRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!loading && !user) {
      setAuthDialogOpen(true);
    }
  }, [loading, user]);
  const handleAddSupplier = () => {
    refetch();
  };
  const handleEditSupplier = (id: string, data: SupplierFormData) => {
    refetch();
  };
  const handleDeleteSupplier = (id: string) => {
    refetch();
  };
  const handleSuppliersImported = (importedSuppliers: Supplier[]) => {
    refetch();
  };

  // Mock data de produtos para cotações
  const mockProducts = [{
    id: "1",
    name: "Coxa com Sobrecoxa"
  }, {
    id: "2",
    name: "Filé de Frango"
  }, {
    id: "3",
    name: "Linguiça Toscana Aurora"
  }, {
    id: "4",
    name: "Contra Filé"
  }, {
    id: "5",
    name: "Peito de Frango"
  }];
  const handleAddQuote = (data: any) => {
    toast({
      title: "Cotação criada",
      description: "A cotação foi criada e enviada aos fornecedores."
    });
  };
  const filteredSuppliers = suppliers.filter(supplier => {
    const matchesSearch = supplier.name.toLowerCase().includes(searchQuery.toLowerCase()) || supplier.contact.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || supplier.status === statusFilter;
    return matchesSearch && matchesStatus;
  });
  const paginatedData = paginate(filteredSuppliers);
  const getStatusBadge = (status: string) => {
    const variants = {
      active: "default",
      inactive: "secondary",
      pending: "outline"
    } as const;
    const labels = {
      active: "Ativo",
      inactive: "Inativo",
      pending: "Pendente"
    };
    return <Badge variant={variants[status as keyof typeof variants]}>
        {labels[status as keyof typeof labels]}
      </Badge>;
  };
  const renderStarRating = (rating: number) => {
    return <div className="flex items-center gap-1">
        {Array.from({
        length: 5
      }, (_, i) => <Star key={i} className={`h-3 w-3 ${i < Math.floor(rating) ? "fill-warning text-warning" : "text-muted-foreground"}`} />)}
        <span className="text-xs text-muted-foreground ml-1">{rating}</span>
      </div>;
  };

  // Calculate real stats
  const stats = useMemo(() => {
    const totalLimit = suppliers.reduce((sum, s) => {
      const limitValue = parseFloat(s.limit.replace(/[^\d,]/g, '').replace(',', '.'));
      return sum + (isNaN(limitValue) ? 0 : limitValue);
    }, 0);
    const activeQuotesTotal = suppliers.reduce((sum, s) => sum + s.activeQuotes, 0);
    return {
      total: suppliers.length,
      active: suppliers.filter(s => s.status === "active").length,
      totalLimit: totalLimit > 0 ? `R$ ${totalLimit.toFixed(0)}k` : "R$ 0",
      activeQuotes: activeQuotesTotal
    };
  }, [suppliers]);
  if (loading || suppliersLoading) {
    return <div className="flex items-center justify-center h-screen">
        <div className="text-center">Carregando...</div>
      </div>;
  }
  return <>
      <AuthDialog open={authDialogOpen} onOpenChange={setAuthDialogOpen} />
      <div className="page-container">
      {/* Header Fornecedores com Tema Índigo */}
      <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-2xl p-6 border border-indigo-100 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-r from-indigo-600 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Building2 className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="font-bold text-3xl bg-gradient-to-r from-indigo-900 to-blue-700 bg-clip-text text-transparent">
                    Fornecedores
                  </h1>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700 border border-indigo-200 shadow-sm">
                      <Star className="h-3 w-3" />
                      Rede de Fornecedores
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 text-sm">
              <div className="flex items-center gap-2 text-gray-700 bg-white/60 px-3 py-2 rounded-lg backdrop-blur-sm">
                <TrendingUp className="h-4 w-4 text-indigo-600" />
                <span className="font-medium">Gerencie fornecedores e acompanhe performance</span>
              </div>
              
              <div className="flex items-center gap-2 text-gray-600 bg-white/40 px-3 py-2 rounded-lg backdrop-blur-sm">
                <Building2 className="h-4 w-4 text-blue-500" />
                <span>{filteredSuppliers.length} fornecedores ativos</span>
              </div>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <ViewToggle view={viewMode} onViewChange={setViewMode} />
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 border-0">
                  Ações
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => addSupplierRef.current?.click()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Fornecedor
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => importSuppliersRef.current?.click()}>
                  <Upload className="h-4 w-4 mr-2" />
                  Importar Fornecedores
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input placeholder="Buscar fornecedores..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10" />
            </div>
            
            <Select value={statusFilter} onValueChange={value => setStatusFilter(value as any)}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Ativos</SelectItem>
                <SelectItem value="inactive">Inativos</SelectItem>
                <SelectItem value="pending">Pendentes</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards Melhorados */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-indigo-500 bg-gradient-to-br from-indigo-50/50 to-blue-50/30">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500/10 to-blue-500/10 relative">
                    <Building2 className="h-5 w-5 text-indigo-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-600">Total de Fornecedores</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
              </div>
              <div className="flex items-center gap-1 text-indigo-600 bg-indigo-100 px-2 py-1 rounded-full">
                <TrendingUp className="h-3 w-3" />
                <span className="text-xs font-medium">+{Math.floor(stats.total * 0.15)}</span>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-indigo-600 h-2 rounded-full transition-all duration-500" style={{ width: '90%' }}></div>
              </div>
              <span className="text-xs text-gray-500">90%</span>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-green-500 bg-gradient-to-br from-green-50/50 to-emerald-50/30">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="p-2.5 rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 relative">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-600">Fornecedores Ativos</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">{stats.active}</div>
              </div>
              <div className="flex items-center gap-1 text-green-600 bg-green-100 px-2 py-1 rounded-full">
                <TrendingUp className="h-3 w-3" />
                <span className="text-xs font-medium">+{Math.floor(stats.active * 0.1)}</span>
              </div>
            </div>
            <div className="mt-4 text-xs text-gray-500">
              {Math.floor((stats.active / stats.total) * 100)}% da base ativa • {stats.total - stats.active} inativos
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-blue-500 bg-gradient-to-br from-blue-50/50 to-cyan-50/30">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 relative">
                    <DollarSign className="h-5 w-5 text-blue-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-600">Limite Total</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">{stats.totalLimit}</div>
              </div>
              <div className="flex items-center gap-1 text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                <TrendingUp className="h-3 w-3" />
                <span className="text-xs font-medium">+12%</span>
              </div>
            </div>
            <div className="mt-4 text-xs text-gray-500">
              Capacidade total de crédito disponível
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-orange-500 bg-gradient-to-br from-orange-50/50 to-amber-50/30">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="p-2.5 rounded-xl bg-gradient-to-br from-orange-500/10 to-amber-500/10 relative">
                    <FileText className="h-5 w-5 text-orange-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-600">Cotações Ativas</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">{stats.activeQuotes}</div>
              </div>
              <div className="flex items-center gap-1 text-orange-600 bg-orange-100 px-2 py-1 rounded-full">
                <TrendingUp className="h-3 w-3" />
                <span className="text-xs font-medium">+25%</span>
              </div>
            </div>
            <div className="mt-4 text-xs text-gray-500">
              {Math.floor(stats.activeQuotes * 0.7)} aguardando • {Math.floor(stats.activeQuotes * 0.3)} em análise
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Suppliers View */}
      {viewMode === "grid" ? <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {paginatedData.items.map(supplier => <Card key={supplier.id} className="group hover:shadow-xl transition-all duration-300 border border-gray-200/60 hover:border-indigo-300/60 bg-gradient-to-br from-white to-indigo-50/30 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-3 flex-1">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500/10 to-blue-500/10 group-hover:from-indigo-500/20 group-hover:to-blue-500/20 transition-all duration-300">
                        <Building2 className="h-5 w-5 text-indigo-600 group-hover:scale-110 transition-transform duration-300" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg font-semibold text-gray-900 group-hover:text-indigo-700 transition-colors duration-300 truncate">
                          {supplier.name}
                        </CardTitle>
                        <p className="text-sm text-gray-600 truncate mt-1">{supplier.contact}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <StatusBadge status={supplier.status} />
                      {renderStarRating(supplier.rating)}
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-indigo-100">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Eye className="h-4 w-4 mr-2" />
                        Ver Cotações
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setEditingSupplier(supplier)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive" onClick={() => setDeletingSupplier(supplier)}>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="p-4 rounded-xl bg-gradient-to-r from-blue-50/80 to-cyan-50/80 border border-blue-200/60">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <DollarSign className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-700">Limite</span>
                      </div>
                      <p className="text-lg font-bold text-blue-800">{supplier.limit}</p>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium text-green-700">Preço Médio</span>
                      </div>
                      <p className="text-lg font-bold text-green-800">{supplier.avgPrice}</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-indigo-50/80 border border-indigo-200/60 text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <FileText className="h-4 w-4 text-indigo-600" />
                      <span className="text-xs font-medium text-indigo-600">Cotações Ativas</span>
                    </div>
                    <span className="text-lg font-bold text-indigo-800">{supplier.activeQuotes}</span>
                  </div>
                  
                  <div className="p-3 rounded-lg bg-purple-50/80 border border-purple-200/60 text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Star className="h-4 w-4 text-purple-600" />
                      <span className="text-xs font-medium text-purple-600">Total</span>
                    </div>
                    <span className="text-lg font-bold text-purple-800">{supplier.totalQuotes}</span>
                  </div>
                </div>

                <div className="space-y-3 p-4 rounded-xl bg-gray-50/80 border border-gray-200/60">
                  {supplier.phone && <div className="flex items-center gap-3">
                      <div className="p-1.5 rounded-lg bg-green-100">
                        <Phone className="h-3 w-3 text-green-600" />
                      </div>
                      <span className="text-sm font-medium text-gray-700">{supplier.phone}</span>
                    </div>}
                  {supplier.email && <div className="flex items-center gap-3">
                      <div className="p-1.5 rounded-lg bg-blue-100">
                        <Mail className="h-3 w-3 text-blue-600" />
                      </div>
                      <span className="text-sm font-medium text-gray-700 truncate">{supplier.email}</span>
                    </div>}
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded-lg bg-orange-100">
                      <FileText className="h-3 w-3 text-orange-600" />
                    </div>
                    <span className="text-sm font-medium text-gray-700">Último: {supplier.lastOrder}</span>
                  </div>
                </div>

                <AddQuoteDialog onAdd={handleAddQuote} trigger={
                  <Button 
                    size="sm" 
                    className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Nova Cotação
                  </Button>
                } />
              </CardContent>
            </Card>)}
        </div> : <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fornecedor</TableHead>
                    <TableHead className="hidden md:table-cell">Status</TableHead>
                    <TableHead className="hidden lg:table-cell">Limite</TableHead>
                    <TableHead>Preço Médio</TableHead>
                    <TableHead className="hidden sm:table-cell">Cotações</TableHead>
                    <TableHead className="hidden lg:table-cell">Avaliação</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedData.items.map(supplier => <TableRow key={supplier.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <Building2 className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <div className="font-medium">{supplier.name}</div>
                            <div className="text-xs text-muted-foreground">{supplier.contact}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <StatusBadge status={supplier.status} />
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">{supplier.limit}</TableCell>
                      <TableCell>
                        <span className="font-semibold text-success">{supplier.avgPrice}</span>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <div className="text-sm">
                          <div className="font-medium text-primary">{supplier.activeQuotes} ativas</div>
                          <div className="text-muted-foreground">{supplier.totalQuotes} total</div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {renderStarRating(supplier.rating)}
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
                              <DropdownMenuItem>
                                <Eye className="h-4 w-4 mr-2" />
                                Ver Cotações
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setEditingSupplier(supplier)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive" onClick={() => setDeletingSupplier(supplier)}>
                                <Trash2 className="h-4 w-4 mr-2" />
                                Excluir
                              </DropdownMenuItem>
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

      {filteredSuppliers.length === 0 && <Card>
          <CardContent className="p-12 text-center">
            <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum fornecedor encontrado</h3>
            <p className="text-muted-foreground mb-4">
              Tente ajustar os filtros ou adicione novos fornecedores
            </p>
            <AddSupplierDialog onAdd={handleAddSupplier} trigger={<Button>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Fornecedor
              </Button>} />
          </CardContent>
        </Card>}

      <EditSupplierDialog supplier={editingSupplier} open={!!editingSupplier} onOpenChange={open => !open && setEditingSupplier(null)} onEdit={handleEditSupplier} />

      <DeleteSupplierDialog supplier={deletingSupplier} open={!!deletingSupplier} onOpenChange={open => !open && setDeletingSupplier(null)} onDelete={handleDeleteSupplier} />

      {/* Hidden triggers for dialogs */}
      <div className="hidden">
        <AddSupplierDialog onAdd={handleAddSupplier} trigger={<button ref={addSupplierRef} />} />
        <ImportSuppliersDialog onSuppliersImported={handleSuppliersImported} trigger={<button ref={importSuppliersRef} />} />
      </div>
    </div>
    </>;
}