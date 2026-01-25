import { useState, useEffect, useMemo, useRef, useCallback, lazy, Suspense, memo } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "@/components/auth/AuthProvider";
import { useSuppliers } from "@/hooks/useSuppliers";
import { useUserRole } from "@/hooks/useUserRole";
import { useDebounce } from "@/hooks/useDebounce";
import { useBreakpoint } from "@/hooks/useBreakpoint";
import { AuthDialog } from "@/components/auth/AuthDialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExpandableSearch } from "@/components/ui/expandable-search";
import { EmptyState } from "@/components/ui/empty-state";
import { Building2, Plus, TrendingUp, DollarSign, FileText, MoreVertical, Edit, Trash2, Upload, Eye } from "lucide-react";
import { capitalize } from "@/lib/text-utils";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { MetricCard } from "@/components/ui/metric-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { ViewToggle } from "@/components/ui/view-toggle";
import { DataPagination } from "@/components/ui/data-pagination";
import { usePagination } from "@/hooks/usePagination";

import { PageWrapper } from "@/components/layout/PageWrapper";
import { ResponsiveGrid } from "@/components/responsive/ResponsiveGrid";
import { VirtualList } from "@/components/responsive/VirtualList";
import { FornecedoresSkeleton, ExpandableSupplierCard } from "@/components/suppliers";
import { SupplierListDesktop } from "@/components/suppliers/SupplierListDesktop";
import { useSupplierStats } from "@/hooks/useSupplierStats";
import { designSystem } from "@/styles/design-system";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

// Lazy load dialogs for better initial load performance
const AddSupplierDialog = lazy(() => import("@/components/forms/AddSupplierDialog"));
const EditSupplierDialog = lazy(() => import("@/components/forms/EditSupplierDialog"));
const DeleteSupplierDialog = lazy(() => import("@/components/forms/DeleteSupplierDialog"));
const AddQuoteDialog = lazy(() => import("@/components/forms/AddQuoteDialog"));
const ImportSuppliersDialog = lazy(() => import("@/components/forms/ImportSuppliersDialog").then(m => ({ default: m.ImportSuppliersDialog })));
const SupplierQuoteHistoryDialog = lazy(() => import("@/components/forms/SupplierQuoteHistoryDialog").then(m => ({ default: m.SupplierQuoteHistoryDialog })));

// Dialog loading fallback
const DialogLoader = () => (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <Loader2 className="h-8 w-8 animate-spin text-white" />
  </div>
);

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

// Virtualization threshold for supplier list
const VIRTUALIZATION_THRESHOLD = 15;

function Fornecedores() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, loading } = useAuth();
  const { canViewSensitiveData } = useUserRole();
  const { isMobile } = useBreakpoint();
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');

  const { suppliers, isLoading: suppliersLoading, deleteSupplier, updateSupplier, refetch: invalidateCache } = useSuppliers();

  const { paginate } = usePagination<Supplier>({
    initialItemsPerPage: isMobile ? 8 : 10
  });

  // Initialize filters from URL params for persistence (Requirement 4.4)
  const [searchQuery, setSearchQuery] = useState(() => searchParams.get('search') || "");
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive" | "pending">(() => {
    const status = searchParams.get('status');
    return (status === 'active' || status === 'inactive' || status === 'pending') ? status : 'all';
  });
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [deletingSupplier, setDeletingSupplier] = useState<Supplier | null>(null);
  const [historySupplier, setHistorySupplier] = useState<Supplier | null>(null);
  const addSupplierRef = useRef<HTMLButtonElement>(null);
  const importSuppliersRef = useRef<HTMLButtonElement>(null);

  // Persist filters to URL (Requirement 4.4)
  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedSearchQuery) params.set('search', debouncedSearchQuery);
    if (statusFilter !== 'all') params.set('status', statusFilter);
    setSearchParams(params, { replace: true });
  }, [debouncedSearchQuery, statusFilter, setSearchParams]);

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

  const handleSuppliersImported = () => {
    invalidateCache();
  };

  // Optimized WhatsApp message generator (memoized) - Requirement 4.3
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

  // Optimized WhatsApp handler with < 100ms response (Requirement 4.3)
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

    // Remove non-numeric characters from phone
    const cleanPhone = supplier.phone.replace(/\D/g, '');
    const message = generateWhatsAppMessage(supplier.name, supplier.contact);
    const whatsappUrl = `https://wa.me/55${cleanPhone}?text=${message}`;
    window.open(whatsappUrl, '_blank');
  }, [canViewSensitiveData, generateWhatsAppMessage]);

  const handleAddQuote = () => {
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

  const renderNumericRating = useCallback((rating: number) => (
    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800">
      {rating.toFixed(1)} / 10
    </span>
  ), []);

  const stats = useSupplierStats(suppliers);

  // Show skeleton during initial load (Requirement 4.1)
  if (loading || suppliersLoading) {
    return (
      <PageWrapper>
        <div className="page-container">
          <FornecedoresSkeleton />
        </div>
      </PageWrapper>
    );
  }

  // Render mobile card with VirtualList for lists > 15 items (Requirement 4.5)
  const renderMobileSupplierCard = (supplier: Supplier, index: number, style: React.CSSProperties) => (
    <div style={style} className="pb-3">
      <ExpandableSupplierCard
        supplier={supplier}
        onEdit={setEditingSupplier}
        onDelete={setDeletingSupplier}
        onWhatsApp={openWhatsApp}
        renderRating={renderNumericRating}
      />
    </div>
  );

  return (
    <>
      <AuthDialog open={authDialogOpen} onOpenChange={setAuthDialogOpen} />
      <PageWrapper>
        <div className={designSystem.layout.container.page}>
          {/* Page Title */}
          <div className="flex items-center gap-3 mb-6">
            <div className={cn("p-2.5 rounded-xl border transition-all", designSystem.components.card.root)}>
              <Building2 className="h-6 w-6 text-[#83E509]" />
            </div>
            <h1 className={cn(designSystem.typography.size["2xl"], designSystem.typography.weight.bold, designSystem.colors.text.primary)}>
              Fornecedores
            </h1>
          </div>

          {/* Metrics Grid */}
          <ResponsiveGrid gap="sm" config={{ mobile: 2, tablet: 2, desktop: 4 }} className="mb-4">
            <MetricCard
              title="Fornecedores"
              value={stats.total}
              icon={Building2}
              trend={{ value: "+15", label: "novos este mês", type: "positive" }}
              variant="info"
              className="hover:scale-[1.02] transition-transform"
            />
            <MetricCard
              title="Ativos"
              value={stats.active}
              icon={TrendingUp}
              trend={{ value: `${stats.percentualAtivos}%`, label: "da base", type: "positive" }}
              variant="success"
              className="hover:scale-[1.02] transition-transform"
            />
            <MetricCard
              title="Limite Total"
              value={stats.totalLimit}
              icon={DollarSign}
              trend={{ value: `R$ ${stats.limiteMedioPorAtivo}k`, label: "média por ativo", type: "neutral" }}
              variant="default"
              className="hover:scale-[1.02] transition-transform"
            />
            <MetricCard
              title="Cotações"
              value={stats.activeQuotes}
              icon={FileText}
              trend={{ value: stats.mediaCotacoesPorFornecedor, label: "por fornecedor", type: "neutral" }}
              variant="warning"
              className="hover:scale-[1.02] transition-transform"
            />
          </ResponsiveGrid>

          {/* Filters & Actions */}
          <div className={designSystem.layout.container.section}>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
              <div className="flex-1 sm:flex-shrink-0">
                <ExpandableSearch
                  value={searchQuery}
                  onChange={setSearchQuery}
                  placeholder="Buscar fornecedores..."
                  accentColor="gray"
                  expandedWidth="w-full sm:w-64"
                />
              </div>
              <div className="flex gap-2">
                <Select value={statusFilter} onValueChange={value => setStatusFilter(value as any)}>
                  <SelectTrigger className={cn(designSystem.components.input.root, "w-[150px]")}>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="active">Ativos</SelectItem>
                    <SelectItem value="inactive">Inativos</SelectItem>
                    <SelectItem value="pending">Pendentes</SelectItem>
                  </SelectContent>
                </Select>
                <ViewToggle view={viewMode} onViewChange={setViewMode} className="md:hidden" />
              </div>
              <div className="flex gap-2 ml-auto">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => importSuppliersRef.current?.click()}
                  className={cn(designSystem.components.button.secondary, "h-10 hidden sm:flex")}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Importar
                </Button>
                <Button
                  size="sm"
                  onClick={() => addSupplierRef.current?.click()}
                  className={cn(designSystem.components.button.primary, "h-11 sm:h-10")}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Fornecedor
                </Button>
              </div>
            </div>
          </div>

          {viewMode === "grid" ? (
            <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {paginatedData.items.map(supplier => (
                <Card key={supplier.id} className="group transition-smooth hover:shadow-md hover:-translate-y-1">
                  <CardHeader className="pb-3 sm:pb-4 p-3 sm:p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2 sm:space-y-3 flex-1">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <div className="p-2 rounded-lg bg-primary/10 md:group-hover:bg-primary/20 md:transition-colors">
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
                          <Button size="sm" variant="outline" className="w-full h-9 transition-smooth hover:bg-muted">
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
                {/* Mobile Cards View with Expandable Details and Virtualization (Requirements 4.2, 4.5) */}
                <div className="md:hidden">
                  {paginatedData.items.length > VIRTUALIZATION_THRESHOLD ? (
                    <VirtualList
                      items={paginatedData.items}
                      itemHeight={180}
                      threshold={VIRTUALIZATION_THRESHOLD}
                      height={600}
                      renderItem={renderMobileSupplierCard}
                      className="p-2"
                    />
                  ) : (
                    <div className="space-y-3 p-2">
                      {paginatedData.items.map(supplier => (
                        <ExpandableSupplierCard
                          key={supplier.id}
                          supplier={supplier}
                          onEdit={setEditingSupplier}
                          onDelete={setDeletingSupplier}
                          onWhatsApp={openWhatsApp}
                          onViewHistory={setHistorySupplier}
                          renderRating={renderNumericRating}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Desktop Table View */}
                <SupplierListDesktop
                  suppliers={paginatedData.items}
                  onEdit={setEditingSupplier}
                  onDelete={setDeletingSupplier}
                  onHistory={setHistorySupplier}
                  onWhatsApp={openWhatsApp}
                  renderRating={renderNumericRating}
                />

                {/* Pagination */}
                <div className="border-t border-gray-200 dark:border-gray-700 px-3 sm:px-4 py-3">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                    <span className="text-xs text-muted-foreground order-2 sm:order-1">
                      {paginatedData.pagination.startIndex + 1}-{paginatedData.pagination.endIndex} de {paginatedData.pagination.totalItems}
                    </span>
                    <div className="order-1 sm:order-2">
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
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {filteredSuppliers.length === 0 && (
            <EmptyState
              icon={Building2}
              title="Nenhum fornecedor encontrado"
              description="Tente ajustar os filtros ou adicione novos fornecedores"
              actionLabel="Adicionar Fornecedor"
              actionIcon={Plus}
              onAction={() => addSupplierRef.current?.click()}
            />
          )}

          {/* Lazy loaded dialogs with Suspense for better performance */}
          {editingSupplier && (
            <Suspense fallback={<DialogLoader />}>
              <EditSupplierDialog
                supplier={editingSupplier}
                open={!!editingSupplier}
                onOpenChange={open => { if (!open) setEditingSupplier(null); }}
                onEdit={handleEditSupplier}
              />
            </Suspense>
          )}

          {deletingSupplier && (
            <Suspense fallback={<DialogLoader />}>
              <DeleteSupplierDialog
                supplier={deletingSupplier}
                open={!!deletingSupplier}
                onOpenChange={open => { if (!open) setDeletingSupplier(null); }}
                onDelete={handleDeleteSupplier}
              />
            </Suspense>
          )}

          {/* Supplier History Dialog */}
          {historySupplier && (
            <Suspense fallback={<DialogLoader />}>
              <SupplierQuoteHistoryDialog
                supplierName={historySupplier.name}
                supplierId={historySupplier.id}
                open={!!historySupplier}
                onOpenChange={open => { if (!open) setHistorySupplier(null); }}
              />
            </Suspense>
          )}

          {/* Hidden triggers for dialogs - lazy loaded */}
          <div className="hidden">
            <Suspense fallback={null}>
              <AddSupplierDialog onAdd={handleAddSupplier} trigger={<button ref={addSupplierRef} />} />
            </Suspense>
            <Suspense fallback={null}>
              <ImportSuppliersDialog onSuppliersImported={handleSuppliersImported} trigger={<button ref={importSuppliersRef} />} />
            </Suspense>
          </div>
        </div>
      </PageWrapper>
    </>
  );
}

// Memoize component to prevent unnecessary re-renders
export default memo(Fornecedores);
