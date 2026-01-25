import { useState, useMemo } from "react";
import { Package, Building2, TrendingDown, Trophy, Search, ArrowUpDown, Inbox } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { designSystem } from "@/styles/design-system";

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

  // Calcular Top Fornecedores
  const topSuppliers = useMemo(() => {
    const wins: Record<string, { name: string; count: number; total: number }> = {};
    productPricesData.forEach(item => {
      if (item.bestPrice > 0 && item.bestSupplierName) {
        if (!wins[item.bestSupplierName]) {
          wins[item.bestSupplierName] = { name: item.bestSupplierName, count: 0, total: 0 };
        }
        wins[item.bestSupplierName].count++;
        wins[item.bestSupplierName].total += item.bestPrice;
      }
    });
    return Object.values(wins)
      .sort((a, b) => b.count - a.count || a.total - b.total)
      .slice(0, 3);
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
    <div className="flex flex-col h-full bg-transparent">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-5">
        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 rounded-lg bg-[#83E509]/10">
              <Package className="h-4 w-4 text-[#83E509]" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Produtos</span>
          </div>
          <p className="text-2xl font-black text-zinc-900 dark:text-zinc-50">{stats.totalProdutos}</p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 rounded-lg bg-[#83E509]/10">
              <Building2 className="h-4 w-4 text-[#83E509]" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Fornecedores</span>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-black text-zinc-900 dark:text-zinc-50">{stats.fornecedoresRespondidos}</p>
            <span className="text-xs font-bold text-zinc-500">/ {stats.totalFornecedores}</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-zinc-900 dark:bg-zinc-50 border border-zinc-800 dark:border-zinc-200 shadow-xl">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 rounded-lg bg-[#83E509]/20">
              <TrendingDown className="h-4 w-4 text-[#83E509]" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Melhor Total</span>
          </div>
          <p className="text-2xl font-black text-white dark:text-zinc-950">
            R$ {melhorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 rounded-lg bg-emerald-500/10">
              <Trophy className="h-4 w-4 text-emerald-500" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Ganhadores</span>
          </div>
          <p className="text-2xl font-black text-zinc-900 dark:text-zinc-50">{topSuppliers.length}</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex items-center gap-3 px-5 pb-5">
        <div className="relative flex-1 group">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 group-focus-within:text-[#83E509] transition-colors" />
          <Input
            placeholder="Buscar nos resultados..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={cn("pl-11 h-11 rounded-2xl", designSystem.components.input.root)}
          />
        </div>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className={cn("w-44 h-11 rounded-2xl", designSystem.components.input.root)}>
            <ArrowUpDown className="h-4 w-4 mr-2 text-zinc-400" />
            <SelectValue placeholder="Ordenar" />
          </SelectTrigger>
          <SelectContent className="rounded-2xl border-zinc-800">
            <SelectItem value="default">Ordenação Padrão</SelectItem>
            <SelectItem value="price-asc">Menor Preço</SelectItem>
            <SelectItem value="price-desc">Maior Preço</SelectItem>
            <SelectItem value="savings">Melhor Economia</SelectItem>
            <SelectItem value="name">Alfabeto (A-Z)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Lista de Produtos */}
      <ScrollArea className="flex-1 px-5">
        <div className="space-y-3 pb-6">
          {filteredAndSortedData.length > 0 ? (
            filteredAndSortedData.map((item) => (
              <div
                key={item.productId}
                className={cn(
                  "flex items-center justify-between p-2.5 rounded-xl border transition-all duration-200",
                  item.bestPrice > 0
                    ? "bg-white dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 hover:border-[#83E509]/30"
                    : "bg-zinc-50 dark:bg-zinc-900/20 border-zinc-100 dark:border-zinc-800/50 opacity-60"
                )}
              >
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-xs text-zinc-900 dark:text-zinc-100 truncate leading-tight">{safeStr(item.productName)}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Badge variant="outline" className="h-4 px-1 text-[8px] font-black uppercase text-zinc-500 border-zinc-200 dark:border-zinc-800">
                      {safeStr(item.quantidade)} {safeStr(item.unidade)}
                    </Badge>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-right">
                  {item.bestPrice > 0 ? (
                    <>
                      <div>
                        <p className="text-sm font-black text-[#83E509] leading-none">
                          R$ {item.bestPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                        <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-tight truncate max-w-[100px] mt-0.5">
                          {safeStr(item.bestSupplierName)}
                        </p>
                      </div>
                      {item.savings > 0 && (
                        <div className="px-1.5 py-0.5 bg-[#83E509] text-zinc-950 text-[9px] font-black rounded-md">
                          -{((item.savings / (item.bestPrice + item.savings)) * 100).toFixed(0)}%
                        </div>
                      )}
                    </>
                  ) : (
                    <Badge variant="outline" className="text-[8px] h-4 text-zinc-500 font-bold border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-800/50">
                      PENDENTE
                    </Badge>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="py-12 text-center">
              <div className="inline-flex p-3 rounded-full bg-zinc-100 dark:bg-zinc-900 mb-3">
                <Inbox className="h-6 w-6 text-zinc-400" />
              </div>
              <h3 className="text-zinc-900 dark:text-zinc-100 font-bold text-xs">Nenhum resultado</h3>
              <p className="text-zinc-500 text-[10px] mt-1">{searchQuery ? "Ajuste os filtros." : "Aguardando respostas."}</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
