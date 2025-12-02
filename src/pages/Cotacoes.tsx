import { useState, useMemo, useEffect, useCallback, startTransition } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useCotacoes } from "@/hooks/useCotacoes";
import { useDebounce } from "@/hooks/useDebounce";
import type { Quote } from "@/hooks/useCotacoes";
import { Badge } from "@/components/ui/badge";
import { ExpandableSearch } from "@/components/ui/expandable-search";
import { FileText, Plus, Trash2, Download, Calendar, DollarSign, Building2, MoreVertical, Package, Clock, CircleDot, ClipboardList, Eye } from "lucide-react";
import { Table, TableCell, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MetricCard } from "@/components/ui/metric-card";
import { ViewToggle } from "@/components/ui/view-toggle";
import { DataPagination } from "@/components/ui/data-pagination";
import { usePagination } from "@/hooks/usePagination";
import { useResponsiveViewMode } from "@/hooks/useResponsiveViewMode";
import { cn } from "@/lib/utils";
import { CapitalizedText } from "@/components/ui/capitalized-text";
import { useToast } from "@/hooks/use-toast";
import { PageHeader } from "@/components/ui/page-header";
import { PageWrapper } from "@/components/layout/PageWrapper";
import AddQuoteDialog from "@/components/forms/AddQuoteDialog";
import DeleteQuoteDialog from "@/components/forms/DeleteQuoteDialog";
import ViewQuoteDialog from "@/components/forms/ViewQuoteDialog";
import GerenciarCotacaoDialog from "@/components/forms/GerenciarCotacaoDialog";

export default function Cotacoes() {
  const [searchParams] = useSearchParams();
  const { viewMode, setViewMode } = useResponsiveViewMode();
  const { paginate } = usePagination<Quote>({ initialItemsPerPage: 10 });
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [statusFilter, setStatusFilter] = useState("all");
  const [supplierFilter, setSupplierFilter] = useState("all");
  const { toast } = useToast();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [gerenciarDialogOpen, setGerenciarDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);

  useEffect(() => {
    const fornecedor = searchParams.get('fornecedor');
    const produto = searchParams.get('produto');
    if (fornecedor) setSupplierFilter(fornecedor);
    if (produto) setSearchTerm(produto);
  }, [searchParams]);

  const { cotacoes, isLoading, refetch, updateSupplierProductValue, deleteQuote, convertToOrder, updateQuote, isUpdating } = useCotacoes();

  useEffect(() => {
    if (selectedQuote && cotacoes.length > 0) {
      const updated = cotacoes.find(q => q.id === selectedQuote.id);
      if (updated) setSelectedQuote(updated);
    }
  }, [cotacoes, selectedQuote]);

  const handleViewQuote = useCallback((quote: Quote) => {
    startTransition(() => { setSelectedQuote(quote); setViewDialogOpen(true); });
  }, []);

  const handleGerenciarQuote = useCallback((quote: Quote) => {
    startTransition(() => { setSelectedQuote(quote); setGerenciarDialogOpen(true); });
  }, []);

  const handleDeleteQuote = useCallback((quote: Quote) => {
    startTransition(() => { setSelectedQuote(quote); setDeleteDialogOpen(true); });
  }, []);

  const getStatusBadge = useCallback((status: string) => {
    const config: Record<string, { className: string; label: string }> = {
      ativa: { className: "border-teal-300 bg-teal-50 text-teal-700", label: "Ativa" },
      pendente: { className: "border-amber-300 bg-amber-50 text-amber-700", label: "Pendente" },
      planejada: { className: "border-blue-300 bg-blue-50 text-blue-700", label: "Planejada" },
      concluida: { className: "border-emerald-300 bg-emerald-50 text-emerald-700", label: "Concluída" },
      finalizada: { className: "border-green-300 bg-green-50 text-green-700", label: "Finalizada" },
      expirada: { className: "border-red-300 bg-red-50 text-red-700", label: "Expirada" }
    };
    const c = config[status] || config.pendente;
    return <Badge variant="outline" className={cn("font-medium text-xs", c.className)}>{c.label}</Badge>;
  }, []);

  const calcularEconomiaCotacao = (cotacao: Quote) => {
    if (!cotacao.fornecedoresParticipantes || cotacao.fornecedoresParticipantes.length < 2) return { economia: 0, percentual: 0 };
    const valores = cotacao.fornecedoresParticipantes.map(f => f.valorOferecido || 0).filter(v => v > 0);
    if (valores.length < 2) return { economia: 0, percentual: 0 };
    const economia = Math.max(...valores) - Math.min(...valores);
    const percentual = Math.max(...valores) > 0 ? (economia / Math.max(...valores)) * 100 : 0;
    return { economia, percentual };
  };

  const filteredCotacoes = useMemo(() => {
    return cotacoes.filter(c => {
      const matchesSearch = c.produto.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) || c.id.toLowerCase().includes(debouncedSearchTerm.toLowerCase());
      const matchesStatus = statusFilter === "all" || c.statusReal === statusFilter;
      const matchesSupplier = supplierFilter === "all" || c.fornecedoresParticipantes?.some(f => f.nome.toLowerCase().includes(supplierFilter.toLowerCase()));
      return matchesSearch && matchesStatus && matchesSupplier;
    });
  }, [cotacoes, debouncedSearchTerm, statusFilter, supplierFilter]);

  const handleExportQuotes = useCallback(() => {
    if (filteredCotacoes.length === 0) { toast({ title: "Nenhuma cotação", variant: "destructive" }); return; }
    const data = filteredCotacoes.map(c => ({ ID: c.id.substring(0, 8), Produto: c.produto, Status: c.statusReal, MelhorPreco: c.melhorPreco }));
    const csv = [Object.keys(data[0]).join(','), ...data.map(r => Object.values(r).join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = `cotacoes_${new Date().toISOString().split('T')[0]}.csv`; link.click();
    toast({ title: "Exportado!" });
  }, [filteredCotacoes, toast]);

  const stats = useMemo(() => {
    const ativas = cotacoes.filter(c => c.statusReal === "ativa").length;
    const pendentes = cotacoes.filter(c => c.status === "pendente").length;
    const percentualAtivas = cotacoes.length > 0 ? Math.round((ativas / cotacoes.length) * 100) : 0;
    let economiaTotal = 0;
    cotacoes.forEach(c => { if (c.fornecedoresParticipantes?.length >= 2) { const vals = c.fornecedoresParticipantes.map(f => f.valorOferecido || 0).filter(v => v > 0); if (vals.length >= 2) economiaTotal += Math.max(...vals) - Math.min(...vals); } });
    const fornecedoresUnicos = new Set<string>(); cotacoes.forEach(c => c.fornecedoresParticipantes?.forEach(f => f.nome && fornecedoresUnicos.add(f.nome)));
    const mediaFornecedores = cotacoes.length > 0 ? Math.round(cotacoes.reduce((a, c) => a + c.fornecedores, 0) / cotacoes.length) : 0;
    return { ativas, pendentes, percentualAtivas, economiaFormatada: economiaTotal > 0 ? `R$ ${economiaTotal.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}` : "R$ 0", totalFornecedoresUnicos: fornecedoresUnicos.size, mediaFornecedores };
  }, [cotacoes]);

  if (isLoading) return <div className="p-6 flex items-center justify-center min-h-screen"><p className="text-muted-foreground">Carregando...</p></div>;
  const paginatedData = paginate(filteredCotacoes);

  return (
    <PageWrapper>
      <div className="page-container">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <MetricCard title="Ativas" value={stats.ativas} icon={FileText} variant="info" trend={{ value: `${stats.percentualAtivas}%`, label: "do total", type: "neutral" }} />
          <MetricCard title="Pendentes" value={stats.pendentes} icon={Calendar} variant="default" trend={{ value: "0", label: "atrasadas", type: "positive" }} />
          <MetricCard title="Economia" value={stats.economiaFormatada} icon={DollarSign} variant="success" trend={{ value: "Total", label: "economizado", type: "positive" }} />
          <MetricCard title="Fornecedores" value={stats.mediaFornecedores} icon={Building2} variant="default" trend={{ value: stats.totalFornecedoresUnicos.toString(), label: "únicos", type: "neutral" }} />
        </div>
        <PageHeader title="Cotações" icon={ClipboardList} actions={<div className="flex items-center gap-2"><ViewToggle view={viewMode} onViewChange={setViewMode} /><DropdownMenu><DropdownMenuTrigger asChild><Button className="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white shadow-lg h-10 rounded-xl"><Plus className="h-4 w-4 mr-2" />Ações</Button></DropdownMenuTrigger><DropdownMenuContent align="end" className="w-48"><DropdownMenuLabel>Gerenciar</DropdownMenuLabel><DropdownMenuSeparator /><DropdownMenuItem onSelect={() => startTransition(() => setAddDialogOpen(true))}><Plus className="h-4 w-4 mr-2" />Nova Cotação</DropdownMenuItem><DropdownMenuItem onSelect={handleExportQuotes}><Download className="h-4 w-4 mr-2" />Exportar</DropdownMenuItem></DropdownMenuContent></DropdownMenu></div>}>
          <div className="flex flex-col sm:flex-row items-stretch gap-3 w-full">
            <ExpandableSearch value={searchTerm} onChange={setSearchTerm} placeholder="Buscar..." accentColor="teal" expandedWidth="w-64" />
            <Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger className="w-full sm:w-[160px] h-10 rounded-xl"><SelectValue placeholder="Status" /></SelectTrigger><SelectContent><SelectItem value="all">Todos</SelectItem><SelectItem value="ativa">Ativas</SelectItem><SelectItem value="planejada">Planejadas</SelectItem><SelectItem value="pendente">Pendentes</SelectItem><SelectItem value="concluida">Concluídas</SelectItem><SelectItem value="expirada">Expiradas</SelectItem></SelectContent></Select>
            <Select value={supplierFilter} onValueChange={setSupplierFilter}><SelectTrigger className="w-full sm:w-[180px] h-10 rounded-xl"><SelectValue placeholder="Fornecedor" /></SelectTrigger><SelectContent><SelectItem value="all">Todos</SelectItem>{Array.from(new Set(cotacoes.flatMap(c => c.fornecedoresParticipantes?.map(f => f.nome) || []).filter(Boolean))).sort().map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent></Select>
          </div>
        </PageHeader>

        {viewMode === "grid" ? (
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {paginatedData.items.map((cotacao, index) => {
              const colors: Record<string, string> = { ativa: "border-teal-300/60 from-white to-teal-50/30", pendente: "border-amber-300/60 from-white to-amber-50/30", concluida: "border-green-300/60 from-white to-green-50/30" };
              const color = colors[cotacao.status] || colors.pendente;
              const cotacaoNumero = paginatedData.pagination.startIndex + index + 1;
              return (
                <Card key={cotacao.id} className={cn("group border bg-gradient-to-br", color, "hover:shadow-xl transition-shadow")}>
                  <CardHeader className="pb-3 p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="p-2 rounded-xl bg-teal-100 dark:bg-teal-900/30"><FileText className="h-5 w-5 text-teal-600" /></div>
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-sm font-bold truncate"><CapitalizedText>{typeof cotacao.produtoResumo === 'string' ? cotacao.produtoResumo : String(cotacao.produtoResumo || '')}</CapitalizedText></CardTitle>
                          <div className="flex items-center gap-2 mt-1">{getStatusBadge(cotacao.status)}</div>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="sm" className="h-8 w-8 rounded-full"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {(cotacao.status === "concluida" || cotacao.status === "finalizada") ? (
                            <DropdownMenuItem onClick={() => handleViewQuote(cotacao)}><Eye className="h-4 w-4 mr-2" />Resumo</DropdownMenuItem>
                          ) : (
                            <>
                              <DropdownMenuItem onClick={() => handleGerenciarQuote(cotacao)}><ClipboardList className="h-4 w-4 mr-2" />Gerenciar</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDeleteQuote(cotacao)} className="text-destructive"><Trash2 className="h-4 w-4 mr-2" />Excluir</DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 p-4 pt-0">
                    <div className="p-3 rounded-xl bg-gray-50/80 border border-gray-200/60">
                      <div className="grid grid-cols-2 gap-3">
                        <div><div className="flex items-center gap-1 mb-1"><FileText className="h-3 w-3 text-gray-500" /><span className="text-xs text-gray-600">Cotação</span></div><p className="text-sm font-bold">#{cotacaoNumero.toString().padStart(4, '0')}</p></div>
                        <div><div className="flex items-center gap-1 mb-1"><Building2 className="h-3 w-3 text-blue-600" /><span className="text-xs text-blue-700">Fornecedores</span></div><p className="text-sm font-bold text-blue-800">{cotacao.fornecedores}</p></div>
                      </div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-primary/10 border border-primary/20">
                      <div className="flex items-center gap-1 mb-1"><Calendar className="h-3 w-3 text-indigo-600" /><span className="text-xs text-indigo-700">Período</span></div>
                      <p className="text-xs font-semibold text-indigo-800">{String(cotacao.dataInicio || '')} - {String(cotacao.dataFim || '')}</p>
                    </div>
                    <div className="pt-2 border-t border-gray-200">
                      <div className="flex justify-between items-center">
                        <div><p className="text-xs text-muted-foreground">Melhor Preço</p><p className="text-lg font-bold text-success">{String(cotacao.melhorPreco || 'R$ 0,00')}</p><p className="text-xs text-muted-foreground truncate max-w-[120px]">{String(cotacao.melhorFornecedor || '-')}</p></div>
                        {(() => { const { percentual } = calcularEconomiaCotacao(cotacao); return percentual > 0 ? <Badge variant="secondary" className="text-success">-{percentual.toFixed(1)}%</Badge> : <Badge variant="secondary" className="text-gray-600">0%</Badge>; })()}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="border-0 bg-transparent">
            <CardContent className="p-0">
              <Table>
                <thead><tr><td colSpan={7} className="px-1 pb-3 pt-0 border-none"><div className="flex items-center bg-white/95 dark:bg-gray-800/70 border border-teal-200/60 rounded-lg shadow-sm px-4 py-3"><div className="w-[18%] flex items-center gap-2"><div className="w-8 h-8 rounded-lg bg-teal-500/15 flex items-center justify-center text-teal-600"><ClipboardList className="h-4 w-4" /></div><span className="uppercase text-[11px] font-semibold text-teal-800">Cotação</span></div><div className="hidden md:flex w-[20%] pl-2 items-center gap-1.5"><Package className="h-3.5 w-3.5 text-teal-600/70" /><span className="uppercase text-[11px] font-semibold text-teal-800">Produto</span></div><div className="hidden lg:flex w-[15%] pl-2 items-center gap-1.5"><Calendar className="h-3.5 w-3.5 text-teal-600/70" /><span className="uppercase text-[11px] font-semibold text-teal-800">Período</span></div><div className="w-[12%] pl-2 flex justify-center items-center gap-1.5"><CircleDot className="h-3.5 w-3.5 text-teal-600/70" /><span className="uppercase text-[11px] font-semibold text-teal-800">Status</span></div><div className="w-[15%] pl-2 flex items-center gap-1.5"><DollarSign className="h-3.5 w-3.5 text-teal-600/70" /><span className="uppercase text-[11px] font-semibold text-teal-800">Melhor Preço</span></div><div className="hidden sm:flex w-[10%] pl-2 justify-center items-center gap-1.5"><Building2 className="h-3.5 w-3.5 text-teal-600/70" /><span className="uppercase text-[11px] font-semibold text-teal-800">Fornec.</span></div><div className="w-[10%] pl-4 flex justify-end items-center gap-1.5"><MoreVertical className="h-3.5 w-3.5 text-teal-600/70" /><span className="uppercase text-[11px] font-semibold text-teal-800">Ações</span></div></div></td></tr></thead>
                <tbody>
                  {paginatedData.items.map((cotacao, index) => {
                    const cotacaoNumero = paginatedData.pagination.startIndex + index + 1;
                    return (
                      <TableRow key={cotacao.id} className="group border-none">
                        <TableCell colSpan={7} className="px-1 py-3">
                          <div className="flex items-center px-1.5 py-2 bg-white/90 dark:bg-gray-800/50 rounded-lg border border-gray-300/70 hover:shadow-md hover:border-teal-300/60 transition-all">
                            <div className="w-[18%] flex items-center gap-3 px-2"><div className="w-8 h-8 rounded-lg bg-teal-500/10 flex items-center justify-center border border-teal-200/50"><ClipboardList className="h-4 w-4 text-teal-600" /></div><div className="min-w-0 flex-1"><div className="font-semibold text-sm">#{cotacaoNumero.toString().padStart(4, '0')}</div><div className="text-xs text-muted-foreground md:hidden truncate"><CapitalizedText>{typeof cotacao.produtoResumo === 'string' ? cotacao.produtoResumo : String(cotacao.produtoResumo || '')}</CapitalizedText></div></div></div>
                            <div className="hidden md:block w-[20%] px-2"><div className="max-w-[150px]" title={cotacao.produto}><CapitalizedText className="font-medium text-sm truncate">{typeof cotacao.produtoResumo === 'string' ? cotacao.produtoResumo : String(cotacao.produtoResumo || '')}</CapitalizedText><div className="text-xs text-muted-foreground mt-1"><span className="inline-flex items-center gap-1 px-2 py-0.5 bg-muted rounded-md"><Package className="h-3 w-3" />{String(cotacao.quantidade || '')}</span></div></div></div>
                            <div className="hidden lg:block w-[15%] px-2"><div className="text-xs space-y-1"><div className="flex items-center gap-1"><Calendar className="h-3 w-3 text-primary" />{String(cotacao.dataInicio || '')}</div><div className="flex items-center gap-1 text-muted-foreground"><Calendar className="h-3 w-3" />{String(cotacao.dataFim || '')}</div></div></div>
                            <div className="w-[12%] px-2 flex flex-col gap-1 items-center">{getStatusBadge(cotacao.statusReal)}{cotacao.statusReal === 'planejada' && cotacao.dataPlanejada && <Badge variant="outline" className="bg-primary/10 text-primary text-xs"><Clock className="h-3 w-3 mr-1" />{new Date(cotacao.dataPlanejada).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}</Badge>}</div>
                            <div className="w-[15%] px-2"><div className="space-y-1"><div className="font-bold text-green-600 text-sm">{String(cotacao.melhorPreco || 'R$ 0,00')}</div><div className="text-xs text-muted-foreground truncate max-w-[100px]">{String(cotacao.melhorFornecedor || '-')}</div>{(() => { const { percentual } = calcularEconomiaCotacao(cotacao); return percentual > 0 ? <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded-md text-xs font-medium"><DollarSign className="h-3 w-3" />-{percentual.toFixed(1)}%</div> : <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-muted text-muted-foreground rounded-md text-xs"><DollarSign className="h-3 w-3" />0%</div>; })()}</div></div>
                            <div className="hidden sm:block w-[10%] px-2"><div className="flex justify-center"><Badge variant="outline" className="bg-primary/10 border-primary/20 text-primary font-medium"><Building2 className="h-3 w-3 mr-1" />{cotacao.fornecedores}</Badge></div></div>
                            <div className="w-[10%] px-2 flex justify-end"><DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-teal-600 hover:bg-teal-50"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end" className="w-40">{(cotacao.status === "concluida" || cotacao.status === "finalizada") ? (<DropdownMenuItem onClick={() => handleViewQuote(cotacao)}><Eye className="h-4 w-4 mr-2" />Resumo</DropdownMenuItem>) : (<><DropdownMenuItem onClick={() => handleGerenciarQuote(cotacao)}><ClipboardList className="h-4 w-4 mr-2" />Gerenciar</DropdownMenuItem><DropdownMenuItem onClick={() => handleDeleteQuote(cotacao)} className="text-destructive"><Trash2 className="h-4 w-4 mr-2" />Excluir</DropdownMenuItem></>)}</DropdownMenuContent></DropdownMenu></div>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </tbody>
              </Table>
              <div className="border-t border-teal-100/80 bg-gradient-to-r from-teal-50/30 to-cyan-50/30 px-6 py-4"><DataPagination currentPage={paginatedData.pagination.currentPage} totalPages={paginatedData.pagination.totalPages} itemsPerPage={paginatedData.pagination.itemsPerPage} totalItems={paginatedData.pagination.totalItems} onPageChange={paginatedData.pagination.goToPage} onItemsPerPageChange={paginatedData.pagination.setItemsPerPage} startIndex={paginatedData.pagination.startIndex} endIndex={paginatedData.pagination.endIndex} /></div>
            </CardContent>
          </Card>
        )}
        {filteredCotacoes.length === 0 && !isLoading && <Card className="bg-white dark:bg-[#1C1F26] border border-gray-200/80"><CardContent className="p-12 text-center"><FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" /><h3 className="text-lg font-semibold mb-2">Nenhuma cotação encontrada</h3><p className="text-gray-600 mb-4">Tente ajustar os filtros ou crie uma nova cotação</p></CardContent></Card>}
        {addDialogOpen && <AddQuoteDialog open={addDialogOpen} onOpenChange={setAddDialogOpen} onAdd={() => { refetch(); setAddDialogOpen(false); }} trigger={<div />} />}
        {viewDialogOpen && selectedQuote && <ViewQuoteDialog open={viewDialogOpen} onOpenChange={setViewDialogOpen} quote={selectedQuote} onUpdateSupplierProductValue={(quoteId, supplierId, productId, newValue) => updateSupplierProductValue({ quoteId, supplierId, productId, newValue })} onConvertToOrder={(quoteId, orders) => convertToOrder({ quoteId, orders })} isUpdating={isUpdating} readOnly />}
        {gerenciarDialogOpen && selectedQuote && <GerenciarCotacaoDialog open={gerenciarDialogOpen} onOpenChange={setGerenciarDialogOpen} quote={selectedQuote} onUpdateSupplierProductValue={(quoteId, supplierId, productId, newValue) => updateSupplierProductValue({ quoteId, supplierId, productId, newValue })} onConvertToOrder={(quoteId, orders) => convertToOrder({ quoteId, orders })} onRefresh={refetch} isUpdating={isUpdating} />}
        {deleteDialogOpen && selectedQuote && <DeleteQuoteDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen} quote={selectedQuote} onDelete={(id) => { deleteQuote(id); setDeleteDialogOpen(false); }} trigger={<div />} />}
      </div>
    </PageWrapper>
  );
}
