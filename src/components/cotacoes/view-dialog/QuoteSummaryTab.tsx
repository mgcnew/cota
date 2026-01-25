import { useState, useMemo } from "react";
import { Package, Building2, Trophy, Search, ArrowUpDown, Inbox, DollarSign } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { designSystem } from "@/styles/design-system";
import { MetricCard } from "@/components/ui/metric-card";

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

  return (
    <div className="flex flex-col w-full h-auto bg-transparent">
      {/* 1. SEÇÃO DE STATS */}
      <div className="bg-zinc-50/50 dark:bg-zinc-900/10 border-b border-zinc-100 dark:border-zinc-800">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-6">
          <MetricCard
            title="Produtos"
            value={stats.totalProdutos}
            icon={Package}
            className="h-28 shadow-sm"
          />
          <MetricCard
            title="Respostas"
            value={`${stats.fornecedoresRespondidos}/${stats.totalFornecedores}`}
            icon={Building2}
            variant="info"
            className="h-28 shadow-sm"
          />
          <MetricCard
            title="Melhor Total"
            value={`R$ ${melhorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
            icon={DollarSign}
            variant="success"
            className="h-28 shadow-sm"
          />
          <MetricCard
            title="Ganhadores"
            value={topSuppliersCount}
            icon={Trophy}
            variant="warning"
            className="h-28 shadow-sm"
          />
        </div>
      </div>

      {/* 2. TOOLBAR & FILTROS */}
      <div className="bg-white dark:bg-zinc-950 px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 flex flex-col sm:flex-row items-center gap-3 sticky top-0 z-20">
        <div className="relative w-full sm:flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 group-focus-within:text-[#83E509] transition-colors z-20 pointer-events-none" />
          <Input
            placeholder="Pesquisar por item ou empresa..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={cn(
              designSystem.components.input.root,
              "pl-12 h-11 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 focus:ring-1 focus:ring-[#83E509] transition-all"
            )}
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className={cn(designSystem.components.input.root, "flex-1 sm:w-48 h-11 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800")}>
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
        <div className="hidden md:grid grid-cols-[1.5fr_80px_80px_140px_1.5fr] gap-4 px-10 py-3 bg-zinc-50/50 dark:bg-zinc-900/40 border-b border-zinc-100 dark:border-zinc-800">
          <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Item Adquirido</span>
          <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 text-center">Unid.</span>
          <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 text-center">Quant.</span>
          <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 text-right">Custo Vencedor</span>
          <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 text-right pr-4">Melhor Proposta</span>
        </div>

        <div className="p-6 space-y-1 pb-20">
          {filteredAndSortedData.length > 0 ? (
            filteredAndSortedData.map((item) => (
              <div
                key={item.productId}
                className={cn(
                  "grid md:grid-cols-[1.5fr_80px_80px_140px_1.5fr] gap-4 items-center p-3 rounded-xl border transition-all duration-200",
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

                <div className="text-right">
                  {item.bestPrice > 0 ? (
                    <div className="flex flex-col items-end">
                      <div className="flex items-center gap-1.5">
                        {item.savings > 0 && (
                          <span className="px-1 py-0.5 bg-[#83E509]/10 text-[#83E509] text-[8px] font-black rounded border border-[#83E509]/20">
                            -{((item.savings / (item.bestPrice + item.savings)) * 100).toFixed(0)}%
                          </span>
                        )}
                        <span className="text-sm font-black text-[#83E509] tracking-tight">
                          R$ {item.bestPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <span className="text-[9px] font-bold text-zinc-400 uppercase italic">Pendente</span>
                  )}
                </div>

                <div className="flex justify-end items-center pr-2 min-w-0">
                  {item.bestSupplierName ? (
                    <div className="flex items-center gap-2 max-w-full">
                      <div className="w-6 h-6 rounded-md bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center flex-shrink-0">
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
            ))
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
