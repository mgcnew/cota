import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/components/auth/AuthProvider";
import { useSuppliers } from "@/hooks/useSuppliers";
import { useUserRole } from "@/hooks/useUserRole";
import { useDebounce } from "@/hooks/useDebounce";
import { AuthDialog } from "@/components/auth/AuthDialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Building2, Search, Plus, Phone, Mail, TrendingUp, DollarSign, FileText, MoreVertical, Edit, Trash2, Upload, Eye, History, MessageCircle, Award, Star, Clock, CircleDot, CreditCard, ShoppingCart, ClipboardList, Filter } from "lucide-react";
import { capitalize } from "@/lib/text-utils";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import AddSupplierDialog from "@/components/forms/AddSupplierDialog";
import EditSupplierDialog from "@/components/forms/EditSupplierDialog";
import DeleteSupplierDialog from "@/components/forms/DeleteSupplierDialog";
import AddQuoteDialog from "@/components/forms/AddQuoteDialog";
import { ImportSuppliersDialog } from "@/components/forms/ImportSuppliersDialog";
import { SupplierQuoteHistoryDialog } from "@/components/forms/SupplierQuoteHistoryDialog";
import { toast } from "@/hooks/use-toast";
import { MetricCard } from "@/components/ui/metric-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { ViewToggle } from "@/components/ui/view-toggle";
import { DataPagination } from "@/components/ui/data-pagination";
import { usePagination } from "@/hooks/usePagination";
import { useResponsiveViewMode } from "@/hooks/useResponsiveViewMode";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { PageHeader } from "@/components/ui/page-header";

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
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { canViewSensitiveData } = useUserRole();
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const { viewMode, setViewMode } = useResponsiveViewMode();

  const { suppliers, isLoading: suppliersLoading, error: suppliersError, deleteSupplier, updateSupplier, refetch: invalidateCache } = useSuppliers();

  const { paginate } = usePagination<Supplier>({
    initialItemsPerPage: 10
  });

  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
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
    invalidateCache();
  };

  const handleEditSupplier = (id: string, data: SupplierFormData) => {
    updateSupplier({
      supplierId: id,
      data
    });
  };

  const handleDeleteSupplier = (id: string) => {
    deleteSupplier(id);
  };

  const handleSuppliersImported = (importedSuppliers: Supplier[]) => {
    invalidateCache();
  };

  // Função para gerar mensagem personalizada do WhatsApp (memoizada)
  const generateWhatsAppMessage = useCallback((supplierName: string, contactName: string) => {
    const currentHour = new Date().getHours();
    let greeting = "";
    if (currentHour >= 5 && currentHour < 12) {
      greeting = "Bom dia";
    } else if (currentHour >= 12 && currentHour < 18) {
      greeting = "Boa tarde";
    } else {
      greeting = "Boa noite";
    }
    const message = `${greeting}, ${contactName}! Sou da equipe de compras da empresa. Gostaria de conversar sobre uma oportunidade de negócio com ${supplierName}. Podemos conversar?`;
    return encodeURIComponent(message);
  }, []);

  // Função para abrir WhatsApp (memoizada)
  const openWhatsApp = useCallback((supplier: Supplier) => {
    if (!canViewSensitiveData) {
      toast({
        title: "Acesso restrito",
        description: "Apenas administradores podem visualizar e usar os contatos dos fornecedores.",
        variant: "destructive"
      });
      return;
    }

    if (!supplier.phone) {
      toast({
        title: "Telefone não encontrado",
        description: "Este fornecedor não possui telefone cadastrado.",
        variant: "destructive"
      });
      return;
    }

    // Remove caracteres não numéricos do telefone
    const cleanPhone = supplier.phone.replace(/\D/g, '');
    const message = generateWhatsAppMessage(supplier.name, supplier.contact);
    const whatsappUrl = `https://wa.me/55${cleanPhone}?text=${message}`;
    window.open(whatsappUrl, '_blank');
  }, [canViewSensitiveData, generateWhatsAppMessage]);

  const handleAddQuote = (data: any) => {
    toast({
      title: "Cotação criada",
      description: "A cotação foi criada e enviada aos fornecedores."
    });
  };

  const filteredSuppliers = useMemo(() => {
    if (!suppliers) return [];

    return suppliers.filter(supplier => {
      const matchesSearch = supplier.name.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) || supplier.contact?.toLowerCase().includes(debouncedSearchQuery.toLowerCase());
      const matchesStatus = statusFilter === "all" || supplier.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [suppliers, debouncedSearchQuery, statusFilter]);

  const paginatedData = paginate(filteredSuppliers);

  const getStatusBadge = useCallback((status: string) => {
    const statusConfig = {
      active: {
        variant: "default" as const,
        label: "Ativo",
        className: "bg-green-100 text-green-800 border-green-200 hover:bg-green-200 font-semibold shadow-sm"
      },
      inactive: {
        variant: "secondary" as const,
        label: "Inativo",
        className: "bg-red-100 text-red-800 border-red-200 hover:bg-red-200 font-semibold shadow-sm"
      },
      pending: {
        variant: "outline" as const,
        label: "Pendente",
        className: "bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200 font-semibold shadow-sm"
      }
    };
    const config = statusConfig[status as keyof typeof statusConfig];
    if (!config) return null;
    return <Badge variant={config.variant} className={config.className}>
      {config.label}
    </Badge>;
  }, []);

  const renderNumericRating = useCallback((rating: number) => (
    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800">
      {rating.toFixed(1)} / 10
    </span>
  ), []);

  // Calculate real stats
  const stats = useMemo(() => {
    if (!suppliers) return {
      total: 0,
      active: 0,
      inactive: 0,
      pending: 0,
      percentualAtivos: 0,
      totalLimit: "R$ 0",
      limiteMedioPorAtivo: "0.0",
      activeQuotes: 0,
      mediaCotacoesPorFornecedor: "0.0",
      distribuicaoCotacoes: [0, 0, 0, 0, 0, 0, 0]
    };

    const totalLimit = suppliers.reduce((sum, s) => {
      const limitValue = parseFloat((s as any).limit?.replace(/[^\d,]/g, '').replace(',', '.') || '0');
      return sum + (isNaN(limitValue) ? 0 : limitValue);
    }, 0);
    const activeQuotesTotal = suppliers.reduce((sum, s) => sum + ((s as any).activeQuotes || 0), 0);

    // Distribuição por status
    const porStatus = {
      active: suppliers.filter(s => s.status === "active").length,
      inactive: suppliers.filter(s => s.status === "inactive").length,
      pending: suppliers.filter(s => s.status === "pending").length
    };

    // Percentual de fornecedores ativos
    const percentualAtivos = suppliers.length > 0
      ? Math.round((porStatus.active / suppliers.length) * 100)
      : 0;

    // Limite médio por fornecedor ativo
    const limiteMedioPorAtivo = porStatus.active > 0
      ? (totalLimit / porStatus.active).toFixed(1)
      : "0.0";

    // Média de cotações por fornecedor
    const fornecedoresComCotacoes = suppliers.filter(s => ((s as any).activeQuotes || 0) > 0 || ((s as any).totalQuotes || 0) > 0);
    const totalQuotes = suppliers.reduce((sum, s) => sum + ((s as any).totalQuotes || 0), 0);
    const mediaCotacoesPorFornecedor = fornecedoresComCotacoes.length > 0
      ? (totalQuotes / fornecedoresComCotacoes.length).toFixed(1)
      : "0.0";

    // Distribuição de cotações por fornecedor (para o mini gráfico)
    const distribuicaoCotacoes = [0, 0, 0, 0, 0, 0, 0]; // 7 barras
    suppliers.forEach(s => {
      const quotes = s.activeQuotes;
      if (quotes === 0) distribuicaoCotacoes[0]++;
      else if (quotes <= 2) distribuicaoCotacoes[1]++;
      else if (quotes <= 5) distribuicaoCotacoes[2]++;
      else if (quotes <= 8) distribuicaoCotacoes[3]++;
      else if (quotes <= 12) distribuicaoCotacoes[4]++;
      else if (quotes <= 20) distribuicaoCotacoes[5]++;
      else distribuicaoCotacoes[6]++;
    });

    return {
      total: suppliers.length,
      active: porStatus.active,
      inactive: porStatus.inactive,
      pending: porStatus.pending,
      percentualAtivos,
      totalLimit: totalLimit > 0 ? `R$ ${totalLimit.toFixed(0)}k` : "R$ 0",
      limiteMedioPorAtivo,
      activeQuotes: activeQuotesTotal,
      mediaCotacoesPorFornecedor,
      distribuicaoCotacoes
    };
  }, [suppliers]);

  if (loading || suppliersLoading) {
    return <div className="flex items-center justify-center h-screen">
      <div className="text-center">Carregando...</div>
    </div>;
  }

  return (
    <>
      <AuthDialog open={authDialogOpen} onOpenChange={setAuthDialogOpen} />
      <PageWrapper>
        <div className="page-container">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <MetricCard
              title="Fornecedores"
              value={stats.total}
              icon={Building2}
              trend={{ value: "+15", label: "novos este mês", type: "positive" }}
              variant="info"
            />
            <MetricCard
              title="Ativos"
              value={stats.active}
              icon={TrendingUp}
              trend={{ value: `${stats.percentualAtivos}%`, label: "da base", type: "positive" }}
              variant="success"
            />
            <MetricCard
              title="Limite Total"
              value={stats.totalLimit}
              icon={DollarSign}
              trend={{ value: `R$ ${stats.limiteMedioPorAtivo}k`, label: "média por ativo", type: "neutral" }}
              variant="default"
            />
            <MetricCard
              title="Cotações"
              value={stats.activeQuotes}
              icon={FileText}
              trend={{ value: stats.mediaCotacoesPorFornecedor, label: "por fornecedor", type: "neutral" }}
              variant="warning"
            />
          </div>

          <PageHeader
            title="Fornecedores"
            description="Gerencie seus fornecedores e cotações"
            icon={Building2}
            actions={
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => importSuppliersRef.current?.click()}
                  className="hidden sm:flex"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Importar
                </Button>
                <Button
                  onClick={() => addSupplierRef.current?.click()}
                  className="bg-primary hover:bg-primary/90"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Fornecedor
                </Button>
              </div>
            }
          >
            <div className="flex flex-col sm:flex-row gap-4 mt-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar fornecedores..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                <Select value={statusFilter} onValueChange={value => setStatusFilter(value as any)}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="active">Ativos</SelectItem>
                    <SelectItem value="inactive">Inativos</SelectItem>
                    <SelectItem value="pending">Pendentes</SelectItem>
                  </SelectContent>
                </Select>
                <ViewToggle view={viewMode} onViewChange={setViewMode} />
              </div>
            </div>
          </PageHeader>

          {viewMode === "grid" ? (
            <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {paginatedData.items.map(supplier => (
                <Card key={supplier.id} className="group hover:shadow-lg transition-all duration-200">
                  <CardHeader className="pb-3 sm:pb-4 p-3 sm:p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2 sm:space-y-3 flex-1">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                            <Building2 className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-base font-semibold truncate">
                              {capitalize(supplier.name)}
                            </CardTitle>
                            <p className="text-sm text-muted-foreground truncate mt-0.5">
                              {capitalize(supplier.contact)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <StatusBadge status={supplier.status} />
                          {renderNumericRating(supplier.rating)}
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <SupplierQuoteHistoryDialog
                            supplierName={supplier.name}
                            supplierId={supplier.id}
                            trigger={
                              <DropdownMenuItem onSelect={e => e.preventDefault()}>
                                <Eye className="h-4 w-4 mr-2" />
                                Ver Histórico
                              </DropdownMenuItem>
                            }
                          />
                          <DropdownMenuItem onClick={() => setEditingSupplier(supplier)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => setDeletingSupplier(supplier)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-3 p-3 sm:p-4 pt-0">
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between py-2 border-b border-border/50">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <DollarSign className="h-3.5 w-3.5" />
                          <span className="text-xs">Limite</span>
                        </div>
                        <span className="text-sm font-medium">{supplier.limit}</span>
                      </div>
                      <div className="flex items-center justify-between py-2 border-b border-border/50">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <TrendingUp className="h-3.5 w-3.5" />
                          <span className="text-xs">Preço Médio</span>
                        </div>
                        <span className="text-sm font-medium">{supplier.avgPrice}</span>
                      </div>
                      <div className="flex items-center justify-between py-2 border-b border-border/50">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <FileText className="h-3.5 w-3.5" />
                          <span className="text-xs">Cotações</span>
                        </div>
                        <span className="text-sm font-medium">{supplier.activeQuotes}</span>
                      </div>

                      <div className="pt-2.5">
                        <AddQuoteDialog onAdd={handleAddQuote} trigger={
                          <Button size="sm" variant="outline" className="w-full h-9">
                            <Plus className="h-3.5 w-3.5 mr-1.5" />
                            Nova Cotação
                          </Button>
                        } />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border-0 bg-transparent">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead colSpan={7} className="px-1 pb-3 pt-0 border-none">
                          <div className="flex items-center bg-white/95 dark:bg-gray-800/70 border border-purple-200/60 dark:border-purple-900/40 rounded-lg shadow-sm px-4 py-3">
                            <div className="w-[30%] flex items-center gap-3 pr-4 min-w-0">
                              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                                <Building2 className="h-4 w-4" />
                              </div>
                              <span className="uppercase tracking-wide text-[11px] font-semibold text-purple-900 dark:text-purple-100">Fornecedor</span>
                            </div>
                            <div className="hidden sm:flex w-[15%] px-2 justify-center items-center gap-1.5">
                              <CircleDot className="h-3.5 w-3.5 text-purple-600/70 dark:text-purple-400/70" />
                              <span className="uppercase tracking-wide text-[11px] font-semibold text-purple-900 dark:text-purple-100">Status</span>
                            </div>
                            <div className="hidden sm:flex w-[15%] px-2 justify-center items-center gap-1.5">
                              <DollarSign className="h-3.5 w-3.5 text-purple-600/70 dark:text-purple-400/70" />
                              <span className="uppercase tracking-wide text-[11px] font-semibold text-purple-900 dark:text-purple-100">Limite</span>
                            </div>
                            <div className="hidden md:flex w-[15%] px-2 justify-center items-center gap-1.5">
                              <TrendingUp className="h-3.5 w-3.5 text-purple-600/70 dark:text-purple-400/70" />
                              <span className="uppercase tracking-wide text-[11px] font-semibold text-purple-900 dark:text-purple-100">Preço Médio</span>
                            </div>
                            <div className="hidden lg:flex w-[10%] px-2 justify-center items-center gap-1.5">
                              <FileText className="h-3.5 w-3.5 text-purple-600/70 dark:text-purple-400/70" />
                              <span className="uppercase tracking-wide text-[11px] font-semibold text-purple-900 dark:text-purple-100">Cotações</span>
                            </div>
                            <div className="hidden lg:flex w-[10%] px-2 justify-center items-center gap-1.5">
                              <Star className="h-3.5 w-3.5 text-purple-600/70 dark:text-purple-400/70" />
                              <span className="uppercase tracking-wide text-[11px] font-semibold text-purple-900 dark:text-purple-100">Avaliação</span>
                            </div>
                            <div className="w-[5%] flex justify-end items-center gap-1.5 px-2">
                              <MoreVertical className="h-3.5 w-3.5 text-purple-600/70 dark:text-purple-400/70" />
                            </div>
                          </div>
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedData.items.map(supplier => (
                        <TableRow key={supplier.id} className="group border-none">
                          <TableCell colSpan={7} className="px-1 py-3">
                            <div className="flex items-center p-3 bg-white/90 dark:bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-300/70 dark:border-gray-700/30 hover:shadow-md dark:hover:shadow-lg dark:hover:shadow-black/20 hover:border-purple-300/60 dark:hover:border-purple-700/50 transition-[box-shadow,border-color] duration-200 [&_*]:!transition-none">
                              <div className="w-[30%] flex items-center gap-3 pr-4 min-w-0">
                                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                                  <Building2 className="h-4 w-4 text-primary" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="font-medium text-sm text-gray-900 dark:text-white truncate">{capitalize(supplier.name)}</div>
                                  <div className="text-xs text-muted-foreground truncate">{capitalize(supplier.contact)}</div>
                                </div>
                              </div>

                              <div className="hidden sm:flex w-[15%] px-2 justify-center items-center">
                                <StatusBadge status={supplier.status} />
                              </div>

                              <div className="hidden sm:flex w-[15%] px-2 justify-center items-center">
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{supplier.limit}</span>
                              </div>

                              <div className="hidden md:flex w-[15%] px-2 justify-center items-center">
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{supplier.avgPrice}</span>
                              </div>

                              <div className="hidden lg:flex w-[10%] px-2 justify-center items-center">
                                <div className="flex items-center gap-1">
                                  <span className="font-medium text-sm">{supplier.activeQuotes}</span>
                                  <span className="text-xs text-muted-foreground">/ {supplier.totalQuotes}</span>
                                </div>
                              </div>

                              <div className="hidden lg:flex w-[10%] px-2 justify-center items-center">
                                {renderNumericRating(supplier.rating)}
                              </div>

                              <div className="w-[5%] flex justify-end items-center gap-2 px-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openWhatsApp(supplier)}
                                  className="text-green-600 hover:text-green-700 hover:bg-green-50 h-8 w-8 p-0"
                                >
                                  <MessageCircle className="h-4 w-4" />
                                </Button>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                      <MoreVertical className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <SupplierQuoteHistoryDialog
                                      supplierName={supplier.name}
                                      supplierId={supplier.id}
                                      trigger={
                                        <DropdownMenuItem onSelect={e => e.preventDefault()}>
                                          <Eye className="h-4 w-4 mr-2" />
                                          Ver Histórico
                                        </DropdownMenuItem>
                                      }
                                    />
                                    <DropdownMenuItem onClick={() => setEditingSupplier(supplier)}>
                                      <Edit className="h-4 w-4 mr-2" />
                                      Editar
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      className="text-destructive"
                                      onClick={() => setDeletingSupplier(supplier)}
                                    >
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Excluir
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <div className="border-t px-4 py-4">
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
                </div>
              </CardContent>
            </Card>
          )}

          {filteredSuppliers.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhum fornecedor encontrado</h3>
                <p className="text-muted-foreground mb-4">
                  Tente ajustar os filtros ou adicione novos fornecedores
                </p>
                <Button onClick={() => addSupplierRef.current?.click()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Fornecedor
                </Button>
              </CardContent>
            </Card>
          )}

          <EditSupplierDialog
            supplier={editingSupplier}
            open={!!editingSupplier}
            onOpenChange={open => !open && setEditingSupplier(null)}
            onEdit={handleEditSupplier}
          />

          <DeleteSupplierDialog
            supplier={deletingSupplier}
            open={!!deletingSupplier}
            onOpenChange={open => !open && setDeletingSupplier(null)}
            onDelete={handleDeleteSupplier}
          />

          {/* Hidden triggers for dialogs */}
          <div className="hidden">
            <AddSupplierDialog onAdd={handleAddSupplier} trigger={<button ref={addSupplierRef} />} />
            <ImportSuppliersDialog onSuppliersImported={handleSuppliersImported} trigger={<button ref={importSuppliersRef} />} />
          </div>
        </div>
      </PageWrapper>
    </>
  );
}
