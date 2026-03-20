import { useState, useMemo } from "react";
import { Package, Building2, Trophy, Search, ArrowUpDown, Inbox, DollarSign, ListFilter, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { designSystem } from "@/styles/design-system";
import { MetricCard } from "@/components/ui/metric-card";
import { CurrentPricesTooltip } from "./CurrentPricesTooltip";
import { analyzeQuoteOptions } from "@/lib/gemini";

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
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);

  const handleAnalyzeQuote = async () => {
    setIsAnalyzing(true);
    try {
      const result = await analyzeQuoteOptions(productPricesData);
      setAnalysisResult(result);
    } catch (error) {
      console.error(error);
      setAnalysisResult("Ocorreu um erro ao gerar a análise.");
    } finally {
      setIsAnalyzing(false);
    }
  };

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
      groups[supplierName].total += (item.bestPrice > 0 ? item.bestPrice * item.quantidade : 0);
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
        "grid md:grid-cols-[1.5fr_80px_80px_140px_1.5fr] gap-2 md:gap-4 items-center px-3 py-2 rounded-xl border transition-all duration-200",
        item.bestPrice > 0
          ? "bg-white dark:bg-zinc-900/30 border-zinc-100 dark:border-zinc-800 hover:border-zinc-200 dark:hover:border-zinc-700 hover:shadow-sm"
          : "bg-zinc-50/50 dark:bg-zinc-950/20 border-zinc-100 dark:border-zinc-800/50 opacity-40"
      )}
    >
      <div className="min-w-0 pr-2">
        <p className="font-bold text-xs text-zinc-900 dark:text-zinc-50 truncate leading-tight uppercase tracking-tight" title={item.productName}>
          {safeStr(item.productName)}
        </p>
      </div>

      <div className="hidden md:flex justify-center">
        <div className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-[8px] font-black text-zinc-500 uppercase">
          {safeStr(item.unidade)}
        </div>
      </div>

      <div className="hidden md:flex justify-center">
        <span className="text-[11px] font-bold text-zinc-500">
          {safeStr(item.quantidade)}
        </span>
      </div>

      <div className="text-right flex items-center justify-end gap-2">
        {item.bestPrice > 0 ? (
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-1.5">
              {item.savings > 0 && (
                <span className="px-1 py-0.5 bg-brand/10 text-brand text-[8px] font-black rounded border border-brand/20">
                  -{((item.savings / (item.bestPrice + item.savings)) * 100).toFixed(0)}%
                </span>
              )}
              <span className="text-sm font-black text-brand tracking-tight">
                R$ {item.bestPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
              <CurrentPricesTooltip prices={item.allPrices} />
            </div>
          </div>
        ) : (
          <span className="text-[9px] font-bold text-zinc-400 uppercase italic">Pendente</span>
        )}
      </div>

      <div className="flex justify-end items-center pr-2 min-w-0">
        {item.bestSupplierName ? (
          <div className="flex items-center justify-end gap-1.5 max-w-full">
            <div className="w-5 h-5 rounded bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center flex-shrink-0">
              <Building2 className="h-3 w-3 text-zinc-400" />
            </div>
            <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase truncate" title={item.bestSupplierName}>
              {safeStr(item.bestSupplierName)}
            </span>
          </div>
        ) : (
          <span className="text-[10px] font-bold text-zinc-300 dark:text-zinc-700">—</span>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col w-full h-auto bg-transparent">
      {/* 1. SEÇÃO DE STATS COMPACTA */}
      <div className="bg-zinc-50/80 dark:bg-zinc-900/40 border-b border-zinc-100 dark:border-zinc-800 px-4 py-2 flex items-center justify-between overflow-x-auto custom-scrollbar">
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
        
        <Button 
          onClick={handleAnalyzeQuote} 
          disabled={isAnalyzing}
          className="ml-4 h-8 bg-brand hover:bg-brand/90 text-black font-black text-[10px] uppercase tracking-wider rounded-lg shadow-sm shadow-brand/20 border-none transition-all hover:scale-[1.02] flex-shrink-0"
        >
          {isAnalyzing ? <Loader2 className="h-3 w-3 mr-1.5 animate-spin" /> : <Sparkles className="h-3 w-3 mr-1.5" />}
          Otimizar Compra
        </Button>
      </div>

      {/* RESULTADO DA IA (condicional) */}
      {analysisResult && (
        <div className="bg-amber-50 dark:bg-amber-950/20 border-b border-amber-200 dark:border-amber-900/30 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-4 w-4 text-amber-500" />
            <h3 className="font-black text-amber-800 dark:text-amber-500 uppercase tracking-widest text-xs">Análise Inteligente de Cotação</h3>
          </div>
          <div className="text-sm text-amber-900 dark:text-amber-100/80 whitespace-pre-wrap leading-relaxed">
            {analysisResult}
          </div>
        </div>
      )}

      {/* 2. TOOLBAR & FILTROS */}
      <div className="bg-white dark:bg-zinc-950 px-4 py-3 border-b border-zinc-100 dark:border-zinc-800 flex flex-col sm:flex-row items-center gap-2 sticky top-0 z-20">
        <div className="relative w-full sm:flex-1 group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 group-focus-within:text-brand transition-colors z-20 pointer-events-none" />
          <Input
            placeholder="Pesquisar por item ou empresa..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={cn(
              designSystem.components.input.root,
              "pl-9 h-9 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 focus:ring-1 focus:ring-brand transition-all"
            )}
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            onClick={() => setGroupBySupplier(!groupBySupplier)}
            className={cn(
              "h-9 px-3 rounded-xl border-zinc-200 dark:border-zinc-800 transition-all",
              groupBySupplier 
                ? "bg-brand/10 border-brand/30 text-brand hover:bg-brand/20" 
                : "bg-zinc-50 dark:bg-zinc-900/50 text-zinc-500 hover:bg-zinc-100"
            )}
          >
            <ListFilter className="h-3.5 w-3.5 mr-2" />
            <span className="text-[10px] font-black uppercase tracking-widest">{groupBySupplier ? "Desagrupar" : "Agrupar por Fornecedor"}</span>
          </Button>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className={cn(designSystem.components.input.root, "flex-1 sm:w-48 h-9 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800")}>
              <div className="flex items-center gap-2">
                <ArrowUpDown className="h-3.5 w-3.5 text-zinc-400" />
                <SelectValue placeholder="Ordenar" />
              </div>
            </SelectTrigger>
            <SelectContent className="rounded-xl border-zinc-200 dark:border-zinc-800">
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
      <div className="flex flex-col bg-white dark:bg-zinc-950">
        <div className="hidden md:grid grid-cols-[1.5fr_80px_80px_140px_1.5fr] gap-4 px-6 py-2 bg-zinc-50/50 dark:bg-zinc-900/40 border-b border-zinc-100 dark:border-zinc-800">
          <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Item Adquirido</span>
          <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 text-center">Unid.</span>
          <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 text-center">Quant.</span>
          <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 text-right">Custo Vencedor</span>
          <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 text-right pr-4">Melhor Proposta</span>
        </div>

        <div className="p-4 space-y-1 pb-16">
          {filteredAndSortedData.length > 0 ? (
            groupBySupplier && groupedData ? (
              groupedData.map(group => (
                <div key={group.name} className="mt-6 first:mt-0 mb-4 bg-zinc-50/30 dark:bg-zinc-900/20 rounded-2xl p-3 border border-zinc-100/50 dark:border-zinc-800/50">
                  <div className="flex items-center justify-between mb-3 px-1">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                        {group.name === "Pendente / Sem Vencedor" ? <Package className="h-3 w-3 text-zinc-400" /> : <Building2 className="h-3 w-3 text-brand" />}
                      </div>
                      <span className="text-[11px] font-black text-zinc-700 dark:text-zinc-300 uppercase tracking-widest">{safeStr(group.name)}</span>
                      <span className="text-[9px] bg-zinc-100 dark:bg-zinc-800 text-zinc-500 px-1.5 py-0.5 rounded-md font-bold">{group.items.length} itens</span>
                    </div>
                    {group.name !== "Pendente / Sem Vencedor" && (
                      <div className="flex items-baseline gap-1 bg-green-500/10 px-2 py-1 rounded-lg border border-green-500/20">
                        <span className="text-[9px] font-black text-green-600 dark:text-green-500 uppercase">Subtotal</span>
                        <span className="text-xs font-black text-green-600 dark:text-green-500">
                          R$ {group.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="space-y-1">
                    {group.items.map(renderItem)}
                  </div>
                </div>
              ))
            ) : (
              filteredAndSortedData.map(renderItem)
            )
          ) : (
            <div className="py-20 text-center border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl">
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
