import { useState, useMemo, useCallback, startTransition, memo } from "react";
import { Button } from "@/components/ui/button";
import { useCotacoes } from "@/hooks/useCotacoes";
import { useProducts } from "@/hooks/useProducts";
import { useSuppliers } from "@/hooks/useSuppliers";
import { useDebounce } from "@/hooks/useDebounce";
import { useBreakpoint } from "@/hooks/useBreakpoint";
import type { Quote } from "@/hooks/useCotacoes";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { ExpandableSearch } from "@/components/ui/expandable-search";
import { FileText, Plus, Trash2, Download, Calendar, DollarSign, Building2, MoreVertical, ClipboardList, Eye, Package, CircleDot } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MetricCard } from "@/components/ui/metric-card";
import { ResponsiveGrid } from "@/components/responsive/ResponsiveGrid";
import { Table, TableCell, TableRow } from "@/components/ui/table";
import { DataPagination } from "@/components/ui/data-pagination";
import { usePagination } from "@/hooks/usePagination";
import { useExportCSV } from "@/hooks/useExportCSV";
import { CapitalizedText } from "@/components/ui/capitalized-text";
import { useToast } from "@/hooks/use-toast";

import {
  AddQuoteDialogLazy,
  DeleteQuoteDialogLazy,
  ResumoCotacaoDialogLazy,
  GerenciarCotacaoDialogLazy
} from "@/components/forms/LazyDialogs";

function CotacoesTab() {
  const { isMobile } = useBreakpoint();
  const { paginate } = usePagination<Quote>({ initialItemsPerPage: isMobile ? 8 : 10 });
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [statusFilter, setStatusFilter] = useState("all");
  const { toast } = useToast();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [gerenciarDialogOpen, setGerenciarDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);

  const { cotacoes, isLoading, refetch, updateSupplierProductValue, deleteQuote, convertToOrder, addQuoteItem, removeQuoteItem, addQuoteSupplier, removeQuoteSupplier, isUpdating } = useCotacoes();
  const { products: allProducts } = useProducts();
  const { suppliers: allSuppliers } = useSuppliers();
  
  const availableProducts = useMemo(() => allProducts.map(p => ({ id: p.id, name: p.name, unit: p.unit || 'un' })), [allProducts]);
  const availableSuppliers = useMemo(() => allSuppliers.map(s => ({ id: s.id, name: s.name })), [allSuppliers]);

  const handleViewQuote = useCallback((quote: Quote) => {
    startTransition(() => { setSelectedQuote(quote); setViewDialogOpen(true); });
  }, []);

  const handleGerenciarQuote = useCallback((quote: Quote) => {
    startTransition(() => { setSelectedQuote(quote); setGerenciarDialogOpen(true); });
  }, []);

  const handleDeleteQuote = useCallback((quote: Quote) => {
    startTransition(() => { setSelectedQuote(quote); setDeleteDialogOpen(true); });
  }, []);

  const filteredCotacoes = useMemo(() => {
    return cotacoes.filter(c => {
      const matchesSearch = c.produto.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) || c.id.toLowerCase().includes(debouncedSearchTerm.toLowerCase());
      const matchesStatus = statusFilter === "all" || c.statusReal === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [cotacoes, debouncedSearchTerm, statusFilter]);

  const { exportToCSV } = useExportCSV();

  const handleExportQuotes = useCallback(() => {
    if (filteredCotacoes.length === 0) { 
      toast({ title: "Nenhuma cotação", variant: "destructive" }); 
      return; 
    }
    const data = filteredCotacoes.map(c => ({ 
      id: c.id.substring(0, 8), 
      produto: c.produto, 
      status: c.statusReal, 
      melhorPreco: c.melhorPreco 
    }));
    exportToCSV({
      filename: 'cotacoes',
      data,
      columns: { id: 'ID', produto: 'Produto', status: 'Status', melhorPreco: 'Melhor Preço' }
    });
    toast({ title: "Exportado!" });
  }, [filteredCotacoes, toast, exportToCSV]);

  const stats = useMemo(() => {
    const ativas = cotacoes.filter(c => c.statusReal === "ativa").length;
    const pendentes = cotacoes.filter(c => c.status === "pendente").length;
    let economiaTotal = 0;
    cotacoes.forEach(c => { 
      if (c.fornecedoresParticipantes?.length >= 2) { 
        const vals = c.fornecedoresParticipantes.map(f => f.valorOferecido || 0).filter(v => v > 0); 
        if (vals.length >= 2) economiaTotal += Math.max(...vals) - Math.min(...vals); 
      } 
    });
    return { 
      ativas, 
      pendentes, 
      economiaFormatada: economiaTotal > 0 ? `R$ ${economiaTotal.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}` : "R$ 0"
    };
  }, [cotacoes]);

  if (isLoading) return <div className="flex items-center justify-center py-12"><p className="text-muted-foreground">Carregando...</p></div>;
  
  const paginatedData = paginate(filteredCotacoes);

  return (
    <div className="space-y-4">
      {/* Metrics */}
      <ResponsiveGrid gap="sm" config={{ mobile: 2, tablet: 2, desktop: 3 }}>
        <MetricCard title="Ativas" value={stats.ativas} icon={FileText} variant="info" />
        <MetricCard title="Pendentes" value={stats.pendentes} icon={Calendar} variant="warning" />
        <MetricCard title="Economia" value={stats.economiaFormatada} icon={DollarSign} variant="success" className="hidden md:block" />
      </ResponsiveGrid>

      {/* Filters & Actions */}
      <div className="flex flex-col sm:flex-row items-stretch gap-2">
        <ExpandableSearch value={searchTerm} onChange={setSearchTerm} placeholder="Buscar..." accentColor="teal" expandedWidth="w-full sm:w-48" />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[140px] h-10 rounded-xl">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="ativa">Ativas</SelectItem>
            <SelectItem value="pendente">Pendentes</SelectItem>
            <SelectItem value="concluida">Concluídas</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex gap-2 ml-auto">
          <Button variant="outline" size="sm" onClick={handleExportQuotes} className="h-10">
            <Download className="h-4 w-4" />
          </Button>
          <Button onClick={() => setAddDialogOpen(true)} className="h-10 bg-teal-600 hover:bg-teal-700">
            <Plus className="h-4 w-4 mr-1" />Nova
          </Button>
        </div>
      </div>

      {/* Mobile Cards View */}
      <div className="md:hidden space-y-2">
        {paginatedData.items.map((cotacao, index) => {
          const cotacaoNumero = paginatedData.pagination.startIndex + index + 1;
          return (
            <div key={cotacao.id} className="bg-white dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700/30 p-3 shadow-sm">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-10 h-10 rounded-xl bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center flex-shrink-0">
                    <ClipboardList className="h-5 w-5 text-teal-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm truncate"><CapitalizedText>{cotacao.produtoResumo || cotacao.produto}</CapitalizedText></p>
                    <p className="text-xs text-muted-foreground">#{cotacaoNumero.toString().padStart(4, '0')}</p>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {(cotacao.status === "concluida" || cotacao.status === "finalizada") ? (
                      <DropdownMenuItem onClick={() => handleViewQuote(cotacao)}><Eye className="h-4 w-4 mr-2" />Resumo</DropdownMenuItem>
                    ) : (
                      <>
                        <DropdownMenuItem onClick={() => handleGerenciarQuote(cotacao)}><ClipboardList className="h-4 w-4 mr-2" />Gerenciar</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleDeleteQuote(cotacao)} className="text-red-600"><Trash2 className="h-4 w-4 mr-2" />Excluir</DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="flex items-center gap-2 mb-2">
                <StatusBadge status={cotacao.statusReal} />
                <Badge variant="outline" className="text-xs"><Building2 className="h-3 w-3 mr-1" />{cotacao.fornecedores}</Badge>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Melhor: <span className="font-semibold text-green-600">{cotacao.melhorPreco || 'R$ 0,00'}</span></span>
                <span className="text-muted-foreground">Fim: {cotacao.dataFim || '-'}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block">
        <Table>
          <thead>
            <tr>
              <td colSpan={7} className="px-1 pb-3 pt-0 border-none">
                <div className="flex items-center bg-card/95 border border-teal-200/60 dark:border-teal-900/40 rounded-lg shadow-sm px-4 py-3">
                  <div className="w-[20%] flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-teal-500/10 flex items-center justify-center text-teal-600">
                      <ClipboardList className="h-4 w-4" />
                    </div>
                    <span className="uppercase text-[11px] font-semibold text-teal-900 dark:text-teal-100">Cotação</span>
                  </div>
                  <div className="w-[20%] pl-2 flex items-center gap-1.5">
                    <Package className="h-3.5 w-3.5 text-teal-600/70" />
                    <span className="uppercase text-[11px] font-semibold text-teal-900 dark:text-teal-100">Produto</span>
                  </div>
                  <div className="w-[12%] pl-2 flex justify-center items-center gap-1.5">
                    <CircleDot className="h-3.5 w-3.5 text-teal-600/70" />
                    <span className="uppercase text-[11px] font-semibold text-teal-900 dark:text-teal-100">Status</span>
                  </div>
                  <div className="w-[15%] pl-2 flex items-center gap-1.5">
                    <DollarSign className="h-3.5 w-3.5 text-teal-600/70" />
                    <span className="uppercase text-[11px] font-semibold text-teal-900 dark:text-teal-100">Melhor Preço</span>
                  </div>
                  <div className="w-[15%] pl-2 flex items-center gap-1.5">
                    <Building2 className="h-3.5 w-3.5 text-teal-600/70" />
                    <span className="uppercase text-[11px] font-semibold text-teal-900 dark:text-teal-100">Fornecedores</span>
                  </div>
                  <div className="w-[10%] pl-2 flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-teal-600/70" />
                    <span className="uppercase text-[11px] font-semibold text-teal-900 dark:text-teal-100">Prazo</span>
                  </div>
                  <div className="w-[8%] pl-2 flex justify-end items-center gap-1.5">
                    <MoreVertical className="h-3.5 w-3.5 text-teal-600/70" />
                    <span className="uppercase text-[11px] font-semibold text-teal-900 dark:text-teal-100">Ações</span>
                  </div>
                </div>
              </td>
            </tr>
          </thead>
          <tbody>
            {paginatedData.items.map((cotacao, index) => {
              const cotacaoNumero = paginatedData.pagination.startIndex + index + 1;
              return (
                <TableRow key={cotacao.id} className="group border-none">
                  <TableCell colSpan={7} className="px-1 py-2">
                    <div className="flex items-center px-3 py-2.5 bg-card/90 rounded-lg border border-border hover:border-teal-300/50 transition-colors">
                      <div className="w-[20%] flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-teal-500/10 flex items-center justify-center border border-teal-200/50">
                          <ClipboardList className="h-4 w-4 text-teal-600" />
                        </div>
                        <span className="font-semibold text-sm">#{cotacaoNumero.toString().padStart(4, '0')}</span>
                      </div>
                      <div className="w-[20%] pl-2">
                        <CapitalizedText className="font-medium text-sm truncate block max-w-[150px]">
                          {cotacao.produtoResumo || cotacao.produto}
                        </CapitalizedText>
                      </div>
                      <div className="w-[12%] pl-2 flex justify-center">
                        <StatusBadge status={cotacao.statusReal} />
                      </div>
                      <div className="w-[15%] pl-2">
                        <span className="font-bold text-green-600">{cotacao.melhorPreco || 'R$ 0,00'}</span>
                        <p className="text-xs text-muted-foreground truncate max-w-[100px]">{cotacao.melhorFornecedor || '-'}</p>
                      </div>
                      <div className="w-[15%] pl-2">
                        <Badge variant="outline" className="bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-300 border-teal-200">
                          <Building2 className="h-3 w-3 mr-1" />{cotacao.fornecedores}
                        </Badge>
                      </div>
                      <div className="w-[10%] pl-2 text-sm text-muted-foreground">
                        {cotacao.dataFim || '-'}
                      </div>
                      <div className="w-[8%] pl-2 flex justify-end">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-teal-50 dark:hover:bg-teal-900/20">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {(cotacao.status === "concluida" || cotacao.status === "finalizada") ? (
                              <DropdownMenuItem onClick={() => handleViewQuote(cotacao)}><Eye className="h-4 w-4 mr-2" />Resumo</DropdownMenuItem>
                            ) : (
                              <>
                                <DropdownMenuItem onClick={() => handleGerenciarQuote(cotacao)}><ClipboardList className="h-4 w-4 mr-2" />Gerenciar</DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => handleDeleteQuote(cotacao)} className="text-red-600"><Trash2 className="h-4 w-4 mr-2" />Excluir</DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </tbody>
        </Table>
      </div>

      {/* Pagination */}
      {paginatedData.pagination.totalPages > 1 && (
        <div className="border-t border-gray-200 dark:border-gray-700 px-3 py-3">
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
      )}

      {/* Dialogs */}
      <AddQuoteDialogLazy open={addDialogOpen} onOpenChange={setAddDialogOpen} onAdd={() => { refetch(); setAddDialogOpen(false); }} trigger={<div />} />
      <ResumoCotacaoDialogLazy open={viewDialogOpen} onOpenChange={setViewDialogOpen} quote={selectedQuote} />
      <GerenciarCotacaoDialogLazy open={gerenciarDialogOpen} onOpenChange={setGerenciarDialogOpen} quote={selectedQuote} onUpdateSupplierProductValue={updateSupplierProductValue} onConvertToOrder={(quoteId, orders) => convertToOrder({ quoteId, orders })} onAddQuoteItem={addQuoteItem} onRemoveQuoteItem={removeQuoteItem} onAddQuoteSupplier={addQuoteSupplier} onRemoveQuoteSupplier={removeQuoteSupplier} availableProducts={availableProducts} availableSuppliers={availableSuppliers} onRefresh={refetch} isUpdating={isUpdating} />
      <DeleteQuoteDialogLazy open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen} quote={selectedQuote} onDelete={(id) => { deleteQuote(id); setDeleteDialogOpen(false); }} trigger={<div />} />
    </div>
  );
}

export default memo(CotacoesTab);
