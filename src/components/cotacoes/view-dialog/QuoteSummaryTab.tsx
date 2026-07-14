import { useState, useMemo, useRef } from "react";
import { Package, Building2, Trophy, Search, ArrowUpDown, Inbox, DollarSign, ListFilter, EyeOff, Eye, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { designSystem } from "@/styles/design-system";
import { MetricCard } from "@/components/ui/metric-card";
import { CurrentPricesTooltip } from "./CurrentPricesTooltip";
import { LastPaidPricesTooltip } from "./LastPaidPricesTooltip";

interface QuoteSummaryTabProps {
  stats: {
    totalProdutos: number;
    totalFornecedores: number;
    fornecedoresRespondidos: number;
    melhorValor: number;
    melhorFornecedor: string;
  };
  melhorTotal: number;
  productPricesData: any[];
  safeStr: (val: any) => string;
}

export function QuoteSummaryTab({ stats, melhorTotal, productPricesData, safeStr }: QuoteSummaryTabProps) {

  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("default");
  const [groupBySupplier, setGroupBySupplier] = useState(false);
  const [hiddenSuppliers, setHiddenSuppliers] = useState<Set<string>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);

  const hideSupplier = (name: string) =>
    setHiddenSuppliers(prev => new Set([...prev, name]));

  const restoreAll = () => setHiddenSuppliers(new Set());

  const topSuppliersCount = useMemo(() => {
    const wins = new Set();
    productPricesData.forEach(item => {
      if (item.bestPrice > 0 && item.bestSupplierName) {
        wins.add(item.bestSupplierName);
      }
    });
    return wins.size;
  }, [productPricesData]);

  const filteredAndSortedData = useMemo(() => {
    let data = [...productPricesData];
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      data = data.filter(item =>
        safeStr(item.productName).toLowerCase().includes(query) ||
        safeStr(item.bestSupplierName).toLowerCase().includes(query)
      );
    }
    switch (sortBy) {
      case "price-asc": data.sort((a, b) => a.bestPrice - b.bestPrice); break;
      case "price-desc": data.sort((a, b) => b.bestPrice - a.bestPrice); break;
      case "savings": data.sort((a, b) => b.savings - a.savings); break;
      case "name": data.sort((a, b) => safeStr(a.productName).localeCompare(safeStr(b.productName))); break;
    }
    return data;
  }, [productPricesData, searchQuery, sortBy, safeStr]);

  const groupedData = useMemo(() => {
    if (!groupBySupplier || filteredAndSortedData.length === 0) return null;
    
    const groups: Record<string, { name: string, items: any[], total: number }> = {};
    
    filteredAndSortedData.forEach(item => {
      const supplierName = item.bestSupplierName || "Pendente / Sem Vencedor";
      if (!groups[supplierName]) {
        groups[supplierName] = { name: supplierName, items: [], total: 0 };
      }
      groups[supplierName].items.push(item);
      groups[supplierName].total += (item.bestPrice > 0 ? item.bestPrice : 0);
    });
    
    return Object.values(groups).sort((a, b) => {
      if (a.name === "Pendente / Sem Vencedor") return 1;
      if (b.name === "Pendente / Sem Vencedor") return -1;
      return a.name.localeCompare(b.name);
    });
  }, [filteredAndSortedData, groupBySupplier]);

  const renderItem = (item: any) => (
    <div
      key={item.productId}
      className={cn(
        "grid grid-cols-[1fr_auto] md:grid-cols-[minmax(0,1.5fr)_44px_48px_120px_150px_minmax(0,1.1fr)] gap-x-2 md:gap-2 items-center px-3 py-1.5 rounded-lg border transition-all duration-200",
        item.bestPrice > 0
          ? "bg-muted/20 border-border dark:border-white/5 hover:border-brand/30"
          : "bg-muted/20 border-border dark:border-white/5 opacity-60 grayscale-[0.5]"
      )}
    >
      {/* Produto — col 1 */}
      <div className="min-w-0 pr-2">
        <div className="flex items-baseline gap-2 min-w-0">
          <p className="font-bold text-xs text-zinc-900 dark:text-zinc-50 truncate leading-tight uppercase tracking-tight" title={item.productName}>
            {safeStr(item.productName)}
          </p>
          {/* qtd/unid inline no mobile (no desktop há colunas próprias) */}
          <span className="md:hidden shrink-0 text-[10px] font-semibold text-muted-foreground uppercase tabular-nums">
            {safeStr(item.quantidade)} {safeStr(item.unidade)}
          </span>
        </div>
      </div>

      {/* Unid. — col 2 (desktop) */}
      <div className="hidden md:flex justify-center">
        <div className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-[8px] font-black text-zinc-500 uppercase">
          {safeStr(item.unidade)}
        </div>
      </div>

      {/* Quant. — col 3 (desktop) */}
      <div className="hidden md:flex justify-center">
        <span className="text-[11px] font-bold text-zinc-500 tabular-nums">
          {safeStr(item.quantidade)}
        </span>
      </div>

      {/* Preço unitário — col 4 (linha única) */}
      <div className="flex items-center justify-end gap-1.5">
        {item.bestPrice > 0 ? (
          <>
            {item.savings > 0 && (
              <span className="hidden sm:inline px-1 py-0.5 bg-brand/10 text-brand text-[8px] font-black rounded border border-brand/20 shrink-0">
                -{((item.savings / (item.bestPrice + item.savings)) * 100).toFixed(0)}%
              </span>
            )}
            <span className="text-[13px] font-black text-brand tracking-tight tabular-nums whitespace-nowrap shrink-0">
              R$ {(item.bestUnitPrice ?? item.bestPrice).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
            {/* /unidade só no mobile (no desktop há coluna Unid. própria) */}
            <span className="md:hidden text-[9px] font-bold text-muted-foreground shrink-0">/{safeStr(item.unidade)}</span>
            {/* Subtotal só aparece aqui no mobile (no desktop tem coluna própria) */}
            <span className="md:hidden shrink-0 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 tabular-nums">
              · R$ {item.bestPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </>
        ) : (
          <span className="text-[9px] font-bold text-zinc-400 uppercase italic">Pendente</span>
        )}
      </div>

      {/* Subtotal — col 5 (desktop) */}
      <div className="hidden md:flex items-center justify-end gap-2.5">
        {item.bestPrice > 0 ? (
          <>
            <span className="text-[13px] font-black text-zinc-700 dark:text-zinc-200 tabular-nums whitespace-nowrap shrink-0">
              R$ {item.bestPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
            <div className="flex items-center justify-start gap-2 w-[48px] shrink-0">
              <CurrentPricesTooltip prices={item.allPrices} />
              <LastPaidPricesTooltip productId={item.productId} currentPrice={item.bestUnitPrice ?? item.bestPrice} variant="icon" />
            </div>
          </>
        ) : (
          <span className="text-[10px] font-bold text-zinc-300 dark:text-zinc-700">—</span>
        )}
      </div>

      {/* Fornecedor — col-span no mobile (linha 2), col 6 no desktop — linha única com "i" p/ obs */}
      <div className="col-span-2 md:col-span-1 flex items-center justify-start md:justify-end md:pr-2 min-w-0 gap-1.5">
        {item.bestSupplierName ? (
          <>
            <div className="w-4 h-4 md:w-5 md:h-5 rounded bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center flex-shrink-0">
              <Building2 className="h-2.5 w-2.5 md:h-3 md:w-3 text-zinc-400" />
            </div>
            <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase truncate min-w-0" title={item.bestSupplierName}>
              {safeStr(item.bestSupplierName)}
            </span>
            {item.bestObservacoes && (
              <TooltipProvider delayDuration={100}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span
                      aria-label="Ver observação do fornecedor"
                      className="shrink-0 text-amber-500/70 hover:text-amber-500 transition-colors cursor-help"
                    >
                      <Info className="h-3 w-3" />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="top" align="end" className="max-w-[220px] bg-zinc-900 border-zinc-800 text-white shadow-xl px-2.5 py-1.5">
                    <p className="text-[11px] italic leading-snug">"{item.bestObservacoes}"</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </>
        ) : (
          <span className="text-[10px] font-bold text-zinc-300 dark:text-zinc-700">—</span>
        )}
      </div>
    </div>
  );

  return (
    <div ref={containerRef} data-capture-id="quote-summary" className="flex flex-col w-full h-auto bg-transparent">
      {/* 1. SEÇÃƒO DE STATS COMPACTA */}
      <div className="bg-card/50 border-b border-border dark:border-white/5/40 px-4 py-3 flex items-center justify-between overflow-x-auto custom-scrollbar">
        <div className="flex items-center gap-6 min-w-max">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-zinc-400" />
            <div className="flex flex-col">
              <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400 leading-none mb-0.5">Produtos</span>
              <span className="text-xs font-black text-zinc-700 dark:text-zinc-300 leading-none">{stats.totalProdutos} itens</span>
            </div>
          </div>
          <div className="w-px h-6 bg-zinc-200 dark:bg-zinc-800" />
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-blue-500" />
            <div className="flex flex-col">
              <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400 leading-none mb-0.5">Respostas</span>
              <span className="text-xs font-black text-blue-600 dark:text-blue-400 leading-none">{stats.fornecedoresRespondidos} de {stats.totalFornecedores}</span>
            </div>
          </div>
          <div className="w-px h-6 bg-zinc-200 dark:bg-zinc-800" />
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-amber-500" />
            <div className="flex flex-col">
              <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400 leading-none mb-0.5">Ganhadores</span>
              <span className="text-xs font-black text-amber-600 dark:text-amber-400 leading-none">{topSuppliersCount}</span>
            </div>
          </div>
          <div className="w-px h-6 bg-zinc-200 dark:bg-zinc-800" />
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-green-500" />
            <div className="flex flex-col">
              <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400 leading-none mb-0.5">Melhor Total</span>
              <span className="text-xs font-black text-green-600 dark:text-green-400 leading-none">R$ {melhorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>
        
      </div>

      {/* 2. TOOLBAR & FILTROS */}
      <div className="bg-background/80 backdrop-blur-md px-4 py-3 border-b border-border dark:border-white/5/40 flex flex-col sm:flex-row items-center gap-2 sticky top-0 z-20">
        <div className="relative w-full sm:flex-1 group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-brand transition-colors z-20 pointer-events-none" />
          <Input
            placeholder="Pesquisar por item ou empresa..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-xs rounded-xl bg-card border-border/50 focus:border-brand/50 focus:ring-1 focus:ring-brand shadow-sm transition-all"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            onClick={() => setGroupBySupplier(!groupBySupplier)}
            className={cn(
              "h-9 px-3 rounded-xl transition-all shadow-sm",
              groupBySupplier 
                ? "bg-brand/10 border-brand/30 text-brand hover:bg-brand/20" 
                : "bg-card border-border/50 text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
          >
            <ListFilter className="h-3.5 w-3.5 mr-2" />
            <span className="text-[10px] font-black uppercase tracking-widest">
              <span className="hidden sm:inline">{groupBySupplier ? "Desagrupar" : "Agrupar por Fornecedor"}</span>
              <span className="sm:hidden">{groupBySupplier ? "Desagrupar" : "Agrupar"}</span>
            </span>
          </Button>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="flex-1 sm:w-48 h-9 text-xs rounded-xl bg-card border-border/50 shadow-sm">
              <div className="flex items-center gap-2">
                <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
                <SelectValue placeholder="Ordenar" />
              </div>
            </SelectTrigger>
            <SelectContent className="rounded-xl border-border/50">
              <SelectItem value="default" className="text-xs">Ordenação Padrão</SelectItem>
              <SelectItem value="price-asc" className="text-xs">Menor Preço</SelectItem>
              <SelectItem value="price-desc" className="text-xs">Maior Preço</SelectItem>
              <SelectItem value="savings" className="text-xs">Melhor Economia</SelectItem>
              <SelectItem value="name" className="text-xs">Alfabética (A-Z)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 3. TABELA (Corpo sem scroll interno) */}
      <div className="flex flex-col bg-transparent">
        <div className="hidden md:grid grid-cols-[minmax(0,1.5fr)_44px_48px_120px_150px_minmax(0,1.1fr)] gap-2 px-6 py-2 bg-muted/30 border-b border-border dark:border-white/5/40">
          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Item Adquirido</span>
          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground text-center">Unid.</span>
          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground text-center">Quant.</span>
          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground text-right">Preço Unit.</span>
          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground text-right">Subtotal</span>
          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground text-right pr-2">Melhor Fornecedor</span>
        </div>

        <div className="p-4 space-y-2 pb-4">
          {filteredAndSortedData.length > 0 ? (
            groupBySupplier && groupedData ? (
              <>
                {groupedData.filter(g => !hiddenSuppliers.has(g.name)).map(group => (
                  <div key={group.name} className="mt-4 first:mt-0 mb-4 bg-card rounded-2xl p-3 border border-border dark:border-white/5/40 shadow-sm">
                    <div className="flex items-center justify-between mb-3 px-1">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                          {group.name === "Pendente / Sem Vencedor" ? <Package className="h-3 w-3 text-zinc-400" /> : <Building2 className="h-3 w-3 text-brand" />}
                        </div>
                        <span className="text-[11px] font-black text-zinc-700 dark:text-zinc-300 uppercase tracking-widest">{safeStr(group.name)}</span>
                        <span className="text-[9px] bg-zinc-100 dark:bg-zinc-800 text-zinc-500 px-1.5 py-0.5 rounded-md font-bold">{group.items.length} itens</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {group.name !== "Pendente / Sem Vencedor" && (
                          <div className="flex items-baseline gap-1 bg-green-500/10 px-2 py-1 rounded-lg border border-green-500/20">
                            <span className="text-[9px] font-black text-green-600 dark:text-green-500 uppercase">Subtotal</span>
                            <span className="text-xs font-black text-green-600 dark:text-green-500">
                              R$ {group.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                        )}
                        <button
                          onClick={() => hideSupplier(group.name)}
                          className="flex items-center gap-1 px-2 py-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                          title="Ocultar fornecedor"
                        >
                          <EyeOff className="h-3 w-3" />
                          <span className="text-[9px] font-bold uppercase">Ocultar</span>
                        </button>
                      </div>
                    </div>
                    <div className="space-y-1">
                      {group.items.map(renderItem)}
                    </div>
                  </div>
                ))}
                {hiddenSuppliers.size > 0 && (
                  <div className="flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-border dark:border-white/10 bg-muted/20 mt-2">
                    <EyeOff className="h-3.5 w-3.5 text-muted-foreground/50" />
                    <span className="text-[11px] text-muted-foreground">
                      {hiddenSuppliers.size} fornecedor{hiddenSuppliers.size > 1 ? 'es' : ''} oculto{hiddenSuppliers.size > 1 ? 's' : ''}
                    </span>
                    <button
                      onClick={restoreAll}
                      className="flex items-center gap-1 text-[11px] font-semibold text-brand hover:underline"
                    >
                      <Eye className="h-3 w-3" />
                      Restaurar
                    </button>
                  </div>
                )}
              </>
            ) : (
              filteredAndSortedData.map(renderItem)
            )
          ) : (
            <div className="py-20 text-center border border-dashed border-border dark:border-white/5 rounded-2xl">
              <div className="inline-flex p-4 rounded-full bg-zinc-100 dark:bg-zinc-900 mb-4 opacity-50">
                <Inbox className="h-8 w-8 text-zinc-400" />
              </div>
              <h3 className="text-zinc-900 dark:text-zinc-100 font-bold text-sm">Nenhum registro encontrado</h3>
              <p className="text-zinc-500 text-xs mt-1">Refine seus termos de busca e filtros.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

