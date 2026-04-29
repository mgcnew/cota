import { useState, useEffect, useMemo, useRef, useCallback, lazy, Suspense, memo } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "@/components/auth/AuthProvider";
import { useSuppliers } from "@/hooks/useSuppliers";
import { useUserRole } from "@/hooks/useUserRole";
import { useDebounce } from "@/hooks/useDebounce";
import { useIsMobile } from "@/hooks/use-mobile";
import { AuthDialog } from "@/components/auth/AuthDialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/ui/search-input";
import { EmptyState } from "@/components/ui/empty-state";
import { Building2, Plus, TrendingUp, DollarSign, FileText, MoreVertical, MoreHorizontal, Edit, Trash2, Upload, Eye } from "lucide-react";
import { PullToRefresh } from "@/components/ui/pull-to-refresh";
import { capitalize } from "@/lib/text-utils";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { MetricCard } from "@/components/ui/metric-card";
import { MobileMetricRibbon } from "@/components/dashboard/MobileMetricRibbon";
import { MobileMetricCard } from "@/components/dashboard/MobileMetricCard";
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
import { supabase } from "@/integrations/supabase/client";
import { generateWhatsAppMessage } from "@/lib/gemini";
import type { Quote } from "@/hooks/useCotacoes";
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
  updated_at?: string;
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

function Fornecedores() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, loading } = useAuth();
  const { canViewSensitiveData } = useUserRole();
  const isMobile = useIsMobile();
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');

  const { suppliers, isLoading: suppliersLoading, deleteSupplier, updateSupplierAsync, refetch: invalidateCache } = useSuppliers();

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
  const [selectedSupplierForQuote, setSelectedSupplierForQuote] = useState<string | null>(null);
  const [isAddQuoteOpen, setIsAddQuoteOpen] = useState(false);
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

  const handleEditSupplier = async (id: string, data: SupplierFormData) => {
    await updateSupplierAsync({
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

  /**
   * Helper to generate or retrieve a short link
   */
  async function getShortLink(tokens: string): Promise<string | null> {
    try {
      const slug = Math.random().toString(36).substring(2, 8).toUpperCase();
      const { data: existing } = await supabase
        .from('short_links')
        .select('id')
        .eq('original_tokens', tokens)
        .maybeSingle();
      
      if (existing) return existing.id;

      const { error } = await supabase
        .from('short_links')
        .insert([{ id: slug, original_tokens: tokens }]);

      if (error) throw error;
      return slug;
    } catch (err) {
      console.error("Erro ao encurtar link:", err);
      return null;
    }
  }

  const openWhatsApp = useCallback(async (supplier: Supplier) => {
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

    // Busca se existe alguma cotação ativa para este fornecedor para mandar o link
    const activeQuote = (supplier as any).activeQuotes?.[0];
    const accessToken = activeQuote?.token || activeQuote?.accessToken || activeQuote?.access_token;
    
    // Gerar mensagem persuasiva (Requirement 4.3)
    let msg = await generateWhatsAppMessage(supplier.contact || supplier.name, [], !!accessToken);

    if (accessToken) {
      const baseUrl = "https://cotaja.vercel.app";
      const shortId = await getShortLink(accessToken);
      
      if (shortId) {
        msg += `\n${baseUrl}/r/${shortId}\n\n`;
      } else {
        msg += `\n${baseUrl}/responder/${accessToken}\n\n`;
      }
      msg += `🛡️ *Link Seguro:* Acesso exclusivo para o Mercadão Novo Boi João Dias.\n\n`;
    }
    
    msg += `Equipe de Compras`;

    // Tenta enviar via API de serviço padronizada
    try {
      const { sendWhatsApp } = await import("@/lib/whatsapp-service");
      toast({ title: "Iniciando conversa via WhatsApp..." });
      
      const res = await sendWhatsApp(supplier.phone, msg) as any;
      
      if (res.success) {
        toast({ title: "Mensagem enviada com sucesso!" });
        return;
      }
    } catch (error) {
      console.error("Erro ao enviar via API, tentando manual...", error);
    }

    // Fallback manual original
    const cleanPhone = supplier.phone.replace(/\D/g, '');
    const whatsappUrl = `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(msg)}`;
    window.open(whatsappUrl, '_blank');
  }, [canViewSensitiveData]);

  const handleAddQuote = () => {
    invalidateCache();
    setIsAddQuoteOpen(false);
    setSelectedSupplierForQuote(null);
  };

  const handleOpenAddQuote = useCallback((supplier: Supplier) => {
    setSelectedSupplierForQuote(supplier.id);
    setIsAddQuoteOpen(true);
  }, []);

  const filteredSuppliers = useMemo(() => {
    if (!suppliers) return [];

    return suppliers.filter(supplier => {
      const matchesSearch = supplier.name.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) || supplier.contact?.toLowerCase().includes(debouncedSearchQuery.toLowerCase());
      const matchesStatus = statusFilter === "all" || supplier.status === statusFilter;
      return matchesSearch && matchesStatus;
    }).sort((a, b) => {
      const aDate = new Date(a.updated_at || 0).getTime();
      const bDate = new Date(b.updated_at || 0).getTime();
      return bDate - aDate;
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

  return (
    <>
      <AuthDialog open={authDialogOpen} onOpenChange={setAuthDialogOpen} />
      <PageWrapper>
        <PullToRefresh onRefresh={invalidateCache} className="h-screen w-full">
          <div className={cn(designSystem.layout.container.page, "animate-in fade-in zoom-in-95 duration-500")}>
          {/* Page Header - Standardized with Dashboard Style */}
          <div className="flex flex-col gap-4 md:gap-6 mb-4 md:mb-8">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="hidden sm:flex p-3 rounded-xl bg-brand/10 dark:bg-brand/20 border border-brand/20">
                <Building2 className="h-6 w-6 text-brand" />
              </div>
              <div>
                <h1 className={cn(designSystem.typography.size.xl, "md:text-[22px] font-bold text-foreground")}>
                  Fornecedores
                </h1>
                <p className={cn(designSystem.colors.text.secondary, "text-xs md:text-sm mt-0.5")}>
                  Gerencie sua base de parceiros e contatos
                </p>
              </div>
            </div>
          </div>

          {/* Metrics Grid */}
          {isMobile ? (
            <MobileMetricRibbon className="mb-6 mt-2">
              <MobileMetricCard
                title="Fornecedores"
                value={stats.total}
                icon={Building2}
                trend={{ value: "+15", label: "novos este mês", type: "positive" }}
                variant="info"
              />
              <MobileMetricCard
                title="Ativos"
                value={stats.active}
                icon={TrendingUp}
                trend={{ value: `${stats.percentualAtivos}%`, label: "da base", type: "positive" }}
                variant="success"
              />
              <MobileMetricCard
                title="Limite Total"
                value={stats.totalLimit}
                icon={DollarSign}
                trend={{ value: stats.limiteMedioPorAtivo, label: "média por ativo", type: "neutral" }}
                variant="default"
              />
              <MobileMetricCard
                title="Cotações"
                value={stats.activeQuotes}
                icon={FileText}
                trend={{ value: stats.mediaCotacoesPorFornecedor, label: "por fornecedor", type: "neutral" }}
                variant="warning"
              />
            </MobileMetricRibbon>
          ) : (
            <ResponsiveGrid gap="sm" config={{ mobile: 2, tablet: 2, desktop: 4 }} className="mb-6">
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
                trend={{ value: stats.limiteMedioPorAtivo, label: "média por ativo", type: "neutral" }}
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
          )}

          {/* Unified Container for Search, Table and Mobile Cards */}
          <div className="w-full bg-white dark:bg-card border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm mb-8">
            {/* Header / Actions Bar */}
            <div className="p-4 md:p-5 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
              <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                <div className="flex-1 max-w-xl">
                  <SearchInput
                    value={searchQuery}
                    onChange={setSearchQuery}
                    placeholder="Pesquisar fornecedores..."
                  />
                </div>
                <div className="flex flex-wrap items-center gap-3 lg:ml-auto">
                  <Select value={statusFilter} onValueChange={value => setStatusFilter(value as any)}>
                    <SelectTrigger className="w-[150px] h-11 bg-white dark:bg-background border border-zinc-200 dark:border-zinc-800 focus:ring-2 focus:ring-brand/20 dark:focus:ring-brand/10 rounded-lg shadow-sm text-zinc-900 dark:text-zinc-100 transition-all">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="active">Ativos</SelectItem>
                      <SelectItem value="inactive">Inativos</SelectItem>
                      <SelectItem value="pending">Pendentes</SelectItem>
                    </SelectContent>
                  </Select>

                  <div className="flex items-center gap-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className={cn(designSystem.components.button.secondary, "h-11 px-4 flex items-center justify-center hidden sm:flex")}
                        >
                          <MoreHorizontal className="h-5 w-5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-[200px]">
                        <DropdownMenuItem onSelect={(e) => { e.preventDefault(); importSuppliersRef.current?.click(); }} className="min-h-[44px]">
                          <Upload className="h-4 w-4 mr-2" /> Importar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <Button
                      onClick={() => addSupplierRef.current?.click()}
                      className={cn(designSystem.components.button.primary, "h-11 px-6 w-full sm:w-auto")}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      <span>Novo Fornecedor</span>
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <div className="w-full">
              {paginatedData.items.length === 0 && !suppliersLoading ? (
                <div className="p-8">
                  <EmptyState
                    icon={Building2}
                    title="Nenhum fornecedor encontrado"
                    description="Tente ajustar os filtros ou adicione novos fornecedores"
                    actionLabel="Adicionar Fornecedor"
                    actionIcon={Plus}
                    onAction={() => addSupplierRef.current?.click()}
                    variant="inline"
                  />
                </div>
              ) : (
                <>
                  {/* Mobile Cards View */}
                  <div className="md:hidden">
                    <div className="space-y-3 p-2 pb-24">
                      {paginatedData.items.map(supplier => (
                        <ExpandableSupplierCard
                          key={supplier.id}
                          supplier={supplier}
                          onEdit={setEditingSupplier}
                          onDelete={setDeletingSupplier}
                          onWhatsApp={openWhatsApp}
                          onViewHistory={setHistorySupplier}
                          onAddQuote={handleOpenAddQuote}
                          renderRating={renderNumericRating}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Desktop Table View */}
                  <div className="hidden md:block">
                    <SupplierListDesktop
                      suppliers={paginatedData.items}
                      onEdit={setEditingSupplier}
                      onDelete={setDeletingSupplier}
                      onHistory={setHistorySupplier}
                      onWhatsApp={openWhatsApp}
                      renderRating={renderNumericRating}
                    />
                  </div>

                  {/* Pagination */}
                  <div className="p-4 bg-white dark:bg-card">
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
                </>
              )}
            </div>
          </div>

          {/* Lazy loaded dialogs with Suspense - Render permanently to avoid jank */}
          <Suspense fallback={null}>
            <EditSupplierDialog
              supplier={editingSupplier}
              open={!!editingSupplier}
              onOpenChange={open => { if (!open) setEditingSupplier(null); }}
              onEdit={handleEditSupplier}
            />
          </Suspense>

          <Suspense fallback={null}>
            <DeleteSupplierDialog
              supplier={deletingSupplier}
              open={!!deletingSupplier}
              onOpenChange={open => { if (!open) setDeletingSupplier(null); }}
              onDelete={handleDeleteSupplier}
            />
          </Suspense>

          {/* Supplier History Dialog */}
          <Suspense fallback={null}>
            <SupplierQuoteHistoryDialog
              supplierName={historySupplier?.name || ""}
              supplierId={historySupplier?.id || ""}
              open={!!historySupplier}
              onOpenChange={open => { if (!open) setHistorySupplier(null); }}
            />
          </Suspense>

          {/* Add Quote Dialog */}
          <Suspense fallback={null}>
            <AddQuoteDialog
              open={isAddQuoteOpen}
              onOpenChange={setIsAddQuoteOpen}
              onAdd={handleAddQuote}
              defaultSupplierId={selectedSupplierForQuote}
            />
          </Suspense>

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
        </PullToRefresh>
      </PageWrapper>
    </>
  );
}

// Memoize component to prevent unnecessary re-renders
export default memo(Fornecedores);
