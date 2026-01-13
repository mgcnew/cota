import { useState, useMemo, useCallback, startTransition, memo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePackagingQuotes } from "@/hooks/usePackagingQuotes";
import { usePackagingItems } from "@/hooks/usePackagingItems";
import { usePackagingOrders } from "@/hooks/usePackagingOrders";
import { useSuppliers } from "@/hooks/useSuppliers";
import { useDebounce } from "@/hooks/useDebounce";
import { useBreakpoint } from "@/hooks/useBreakpoint";
import { usePagination } from "@/hooks/usePagination";
import { ExpandableSearch } from "@/components/ui/expandable-search";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DataPagination } from "@/components/ui/data-pagination";
import { MetricCard } from "@/components/ui/metric-card";
import { ResponsiveGrid } from "@/components/responsive/ResponsiveGrid";
import { CapitalizedText } from "@/components/ui/capitalized-text";
import { 
  Package, Plus, Trash2, DollarSign, 
  Building2, MoreVertical, Eye, CheckCircle2,
  PackageOpen, Loader2, ClipboardList, ShoppingCart, BarChart3
} from "lucide-react";
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, 
  DropdownMenuSeparator, DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import type { PackagingQuoteDisplay } from "@/types/packaging";

// Dialogs e componentes
import { 
  AddPackagingQuoteDialog, 
  ManagePackagingQuoteDialog, 
  DeletePackagingQuoteDialog, 
  PackagingItemsDialog,
  ConvertToPackagingOrderDialog,
  PackagingQuotesTable,
  PackagingOrdersTab,
  PackagingAnalysisTab
} from "./embalagens";

function EmbalagensTab() {
  const { isMobile } = useBreakpoint();
  const { paginate } = usePagination<PackagingQuoteDisplay>({ initialItemsPerPage: isMobile ? 8 : 10 });
  const [activeSubTab, setActiveSubTab] = useState("cotacoes");
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [statusFilter, setStatusFilter] = useState("all");

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [manageDialogOpen, setManageDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemsDialogOpen, setItemsDialogOpen] = useState(false);
  const [convertDialogOpen, setConvertDialogOpen] = useState(false);
  const [selectedQuoteId, setSelectedQuoteId] = useState<string | null>(null);

  const { quotes, isLoading: quotesLoading, deleteQuote } = usePackagingQuotes();
  const { orders } = usePackagingOrders();
  const { items: packagingItems } = usePackagingItems();
  const { suppliers } = useSuppliers();

  // Derive selectedQuote from quotes
  const selectedQuote = useMemo(() => {
    if (!selectedQuoteId) return null;
    return quotes.find(q => q.id === selectedQuoteId) || null;
  }, [quotes, selectedQuoteId]);

  // Ouvir evento de atalho de teclado
  useEffect(() => {
    const handleNovaEvent = (e: CustomEvent) => {
      if (e.detail?.tab === 'embalagens') {
        setAddDialogOpen(true);
      }
    };
    window.addEventListener('compras:nova', handleNovaEvent as EventListener);
    return () => window.removeEventListener('compras:nova', handleNovaEvent as EventListener);
  }, []);

  const handleManageQuote = useCallback((quote: PackagingQuoteDisplay) => {
    startTransition(() => { 
      setSelectedQuoteId(quote.id); 
      setManageDialogOpen(true); 
    });
  }, []);

  const handleDeleteQuote = useCallback((quote: PackagingQuoteDisplay) => {
    startTransition(() => { 
      setSelectedQuoteId(quote.id); 
      setDeleteDialogOpen(true); 
    });
  }, []);

  const handleConvertToOrder = useCallback((quote: PackagingQuoteDisplay) => {
    startTransition(() => { 
      setSelectedQuoteId(quote.id); 
      setConvertDialogOpen(true); 
    });
  }, []);

  // IDs de cotações que já foram convertidas em pedidos
  const convertedQuoteIds = useMemo(() => {
    return new Set(orders.filter(o => o.quoteId).map(o => o.quoteId));
  }, [orders]);

  // Filtrar cotações (excluindo as que já foram convertidas em pedidos)
  const filteredQuotes = useMemo(() => {
    return quotes.filter(q => {
      // Excluir cotações já convertidas em pedidos
      if (convertedQuoteIds.has(q.id)) return false;
      
      const itemNames = q.itens.map(i => i.packagingName.toLowerCase()).join(' ');
      const matchesSearch = itemNames.includes(debouncedSearchTerm.toLowerCase()) || 
                           q.id.toLowerCase().includes(debouncedSearchTerm.toLowerCase());
      
      if (statusFilter === "all") return matchesSearch;
      if (statusFilter === "prontas") {
        const respondidos = q.fornecedores.filter(f => f.status === "respondido").length;
        return matchesSearch && q.status === "ativa" && respondidos === q.fornecedores.length && q.fornecedores.length > 0;
      }
      return matchesSearch && q.status === statusFilter;
    });
  }, [quotes, debouncedSearchTerm, statusFilter, convertedQuoteIds]);

  const paginatedData = paginate(filteredQuotes);

  // Estatísticas (excluindo cotações já convertidas)
  const stats = useMemo(() => {
    const quotesNaoConvertidas = quotes.filter(q => !convertedQuoteIds.has(q.id));
    const ativas = quotesNaoConvertidas.filter(q => q.status === "ativa").length;
    const concluidas = quotesNaoConvertidas.filter(q => q.status === "concluida").length;
    const prontasParaDecisao = quotesNaoConvertidas.filter(q => {
      const respondidos = q.fornecedores.filter(f => f.status === "respondido").length;
      return q.status === "ativa" && respondidos === q.fornecedores.length && q.fornecedores.length > 0;
    }).length;
    const totalPedidos = orders.length;
    
    return { total: quotesNaoConvertidas.length, ativas, concluidas, prontasParaDecisao, totalPedidos };
  }, [quotes, orders, convertedQuoteIds]);

  const getQuoteStatus = (quote: PackagingQuoteDisplay) => {
    const respondidos = quote.fornecedores.filter(f => f.status === "respondido").length;
    const total = quote.fornecedores.length;
    const isPronta = quote.status === "ativa" && respondidos === total && total > 0;
    return { respondidos, total, isPronta };
  };

  if (quotesLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Sub-tabs: Cotações | Pedidos */}
      <Tabs value={activeSubTab} onValueChange={setActiveSubTab} className="w-full">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <TabsList className="h-10">
            <TabsTrigger value="cotacoes" className="gap-2">
              <ClipboardList className="h-4 w-4" />
              Cotações
              {stats.prontasParaDecisao > 0 && (
                <Badge className="ml-1 bg-emerald-500 text-white text-[10px] px-1.5 py-0">
                  {stats.prontasParaDecisao}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="pedidos" className="gap-2">
              <ShoppingCart className="h-4 w-4" />
              Pedidos
              {stats.totalPedidos > 0 && (
                <Badge variant="secondary" className="ml-1 text-[10px] px-1.5 py-0">
                  {stats.totalPedidos}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="analise" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Análise
            </TabsTrigger>
          </TabsList>

          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setItemsDialogOpen(true)} 
            className="h-10"
          >
            <Package className="h-4 w-4 mr-1" />
            Cadastrar Embalagens
          </Button>
        </div>

        {/* Tab: Cotações */}
        <TabsContent value="cotacoes" className="mt-4 space-y-4">
          {/* Métricas */}
          <ResponsiveGrid config={{ mobile: 2, tablet: 2, desktop: 4 }} gap="sm">
            <MetricCard title="Total" value={stats.total.toString()} icon={Package} variant="default" />
            <MetricCard title="Ativas" value={stats.ativas.toString()} icon={PackageOpen} variant="info" />
            <MetricCard 
              title="Prontas" 
              value={stats.prontasParaDecisao.toString()} 
              icon={CheckCircle2} 
              variant="success"
              onClick={() => setStatusFilter("prontas")}
              className="cursor-pointer hover:ring-2 hover:ring-emerald-300"
            />
            <MetricCard title="Concluídas" value={stats.concluidas.toString()} icon={DollarSign} variant="success" />
          </ResponsiveGrid>

          {/* Filtros e ações */}
          <div className="flex flex-col sm:flex-row items-stretch gap-2">
            <ExpandableSearch 
              value={searchTerm} 
              onChange={setSearchTerm} 
              placeholder="Buscar..." 
              accentColor="purple" 
              expandedWidth="w-full sm:w-48" 
            />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px] h-10 rounded-xl">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="ativa">Ativas</SelectItem>
                <SelectItem value="prontas">✅ Prontas p/ Decisão</SelectItem>
                <SelectItem value="concluida">Concluídas</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex gap-2 ml-auto">
              <Button onClick={() => setAddDialogOpen(true)} className="h-10 bg-purple-600 hover:bg-purple-700">
                <Plus className="h-4 w-4 mr-1" />Nova Cotação
              </Button>
            </div>
          </div>

          {/* Alerta de prontas */}
          {stats.prontasParaDecisao > 0 && (
            <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-3 flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-emerald-800 dark:text-emerald-200">
                  {stats.prontasParaDecisao} cotação(ões) pronta(s) para decisão
                </p>
                <p className="text-xs text-emerald-600 dark:text-emerald-400">Todos os fornecedores já responderam</p>
              </div>
              <Button 
                size="sm" 
                variant="outline" 
                className="border-emerald-300 text-emerald-700 hover:bg-emerald-100"
                onClick={() => setStatusFilter("prontas")}
              >
                Ver
              </Button>
            </div>
          )}

          {/* Lista de cotações */}
          {paginatedData.items.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-gray-800/50 rounded-xl border">
              <Package className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">Nenhuma cotação de embalagem encontrada</p>
              <Button variant="outline" className="mt-4" onClick={() => setAddDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-1" />Criar primeira cotação
              </Button>
            </div>
          ) : isMobile ? (
            /* Mobile: Cards */
            <div className="space-y-2">
              {paginatedData.items.map((quote, index) => {
                const { respondidos, total, isPronta } = getQuoteStatus(quote);
                const numero = paginatedData.pagination.startIndex + index + 1;

                return (
                  <div 
                    key={quote.id}
                    className={`bg-white dark:bg-gray-800/50 rounded-xl border p-4 shadow-sm ${
                      isPronta 
                        ? 'border-emerald-300 dark:border-emerald-700 ring-1 ring-emerald-200' 
                        : 'border-gray-200 dark:border-gray-700/30'
                    }`}
                  >
                    {isPronta && (
                      <div className="flex items-center gap-1.5 mb-2 text-emerald-600">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span className="text-[10px] font-semibold uppercase">Pronta para decisão</span>
                      </div>
                    )}

                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                          isPronta ? 'bg-emerald-100' : 'bg-purple-100 dark:bg-purple-900/30'
                        }`}>
                          {isPronta ? (
                            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                          ) : (
                            <Package className="h-5 w-5 text-purple-600" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-sm truncate">
                            <CapitalizedText>
                              {quote.itens.map(i => i.packagingName).join(', ') || 'Sem itens'}
                            </CapitalizedText>
                          </p>
                          <p className="text-xs text-muted-foreground">
                            #{numero.toString().padStart(4, '0')} • {quote.dataInicio} - {quote.dataFim}
                          </p>
                        </div>
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleManageQuote(quote)}>
                            <Eye className="h-4 w-4 mr-2" />Gerenciar
                          </DropdownMenuItem>
                          {isPronta && (
                            <DropdownMenuItem onClick={() => handleConvertToOrder(quote)} className="text-emerald-600">
                              <ShoppingCart className="h-4 w-4 mr-2" />Converter em Pedido
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleDeleteQuote(quote)} className="text-red-600">
                            <Trash2 className="h-4 w-4 mr-2" />Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className="flex items-center gap-2 mt-3 flex-wrap">
                      <Badge variant={quote.status === "ativa" ? "default" : "secondary"}>
                        {quote.status}
                      </Badge>
                      <Badge variant="outline" className={
                        respondidos === total && total > 0
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : ''
                      }>
                        <Building2 className="h-3 w-3 mr-1" />
                        {respondidos}/{total}
                      </Badge>
                      {quote.melhorPreco !== '-' && (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          <DollarSign className="h-3 w-3 mr-1" />
                          {quote.melhorPreco}
                        </Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Desktop: Tabela */
            <div className="bg-white dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700/30 shadow-sm overflow-hidden">
              <PackagingQuotesTable
                quotes={paginatedData.items}
                startIndex={paginatedData.pagination.startIndex}
                onManage={handleManageQuote}
                onDelete={handleDeleteQuote}
                onConvertToOrder={handleConvertToOrder}
              />
            </div>
          )}

          {/* Paginação */}
          {paginatedData.pagination.totalPages > 1 && (
            <DataPagination
              currentPage={paginatedData.pagination.currentPage}
              totalPages={paginatedData.pagination.totalPages}
              onPageChange={paginatedData.pagination.goToPage}
              totalItems={paginatedData.pagination.totalItems}
              itemsPerPage={paginatedData.pagination.itemsPerPage}
              onItemsPerPageChange={paginatedData.pagination.setItemsPerPage}
              startIndex={paginatedData.pagination.startIndex}
              endIndex={paginatedData.pagination.endIndex}
            />
          )}
        </TabsContent>

        {/* Tab: Pedidos - forceMount evita re-mount ao trocar de tab ou minimizar/maximizar */}
        <TabsContent value="pedidos" className="mt-4" forceMount>
          <div className={activeSubTab !== "pedidos" ? "hidden" : ""}>
            <PackagingOrdersTab onCreateOrder={() => setAddDialogOpen(true)} />
          </div>
        </TabsContent>

        {/* Tab: Análise */}
        <TabsContent value="analise" className="mt-4" forceMount>
          <div className={activeSubTab !== "analise" ? "hidden" : ""}>
            <PackagingAnalysisTab />
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <AddPackagingQuoteDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        packagingItems={packagingItems}
        suppliers={suppliers}
      />

      <ManagePackagingQuoteDialog
        open={manageDialogOpen}
        onOpenChange={setManageDialogOpen}
        quote={selectedQuote}
      />

      <DeletePackagingQuoteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        quote={selectedQuote}
        onConfirm={() => {
          if (selectedQuote) {
            deleteQuote.mutate(selectedQuote.id);
            setDeleteDialogOpen(false);
          }
        }}
      />

      <ConvertToPackagingOrderDialog
        open={convertDialogOpen}
        onOpenChange={setConvertDialogOpen}
        quote={selectedQuote}
      />

      <PackagingItemsDialog
        open={itemsDialogOpen}
        onOpenChange={setItemsDialogOpen}
      />
    </div>
  );
}

export default memo(EmbalagensTab);
