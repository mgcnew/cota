import { Package, Building2, TrendingDown, Trophy, CheckCircle, Star, AlertCircle, Search, Filter, ArrowUpDown, Inbox } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState, useMemo } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState } from "@/components/ui/empty-state";

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

    // Filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      data = data.filter(item => 
        safeStr(item.productName).toLowerCase().includes(query) ||
        safeStr(item.bestSupplierName).toLowerCase().includes(query)
      );
    }

    // Sort
    switch (sortBy) {
      case "price-asc":
        data.sort((a, b) => a.bestPrice - b.bestPrice);
        break;
      case "price-desc":
        data.sort((a, b) => b.bestPrice - a.bestPrice);
        break;
      case "savings":
        data.sort((a, b) => b.savings - a.savings);
        break;
      case "name":
        data.sort((a, b) => safeStr(a.productName).localeCompare(safeStr(b.productName)));
        break;
      default:
        // Keep original order or default logic
        break;
    }

    return data;
  }, [productPricesData, searchQuery, sortBy, safeStr]);

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Top 3 Fornecedores Destaque */}
      {topSuppliers.length > 0 && (
        <div className="p-3 bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-2 mb-2">
            <Trophy className="h-3 w-3 text-emerald-600" />
            <span className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em]">Ranking de Economia</span>
          </div>
          <div className="flex gap-2">
            {topSuppliers.map((s, idx) => (
              <div 
                key={s.name} 
                className={cn(
                  "flex-1 p-2 rounded-xl border relative overflow-hidden group/top transition-all duration-300",
                  idx === 0 
                    ? "bg-emerald-50 dark:bg-emerald-950 border-emerald-500/20 ring-1 ring-emerald-500/10 shadow-lg shadow-emerald-500/5" 
                    : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800"
                )}
              >
                <div className="absolute top-0 right-0 p-1">
                  {idx === 0 && <Star className="h-3 w-3 text-emerald-500 fill-emerald-500 animate-pulse" />}
                </div>
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "w-6 h-6 rounded-lg flex items-center justify-center font-black text-[10px] shadow-sm",
                    idx === 0 ? "bg-emerald-600 text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-500"
                  )}>
                    {idx + 1}º
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-black text-gray-900 dark:text-white truncate uppercase tracking-tight">{s.name}</p>
                    <p className="text-[8px] font-bold text-gray-500 uppercase">{s.count} {s.count === 1 ? 'item' : 'itens'} ganhos</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Header com Filtros */}
      <div className="flex-shrink-0 p-3 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 z-10">
        <div className="flex flex-col sm:flex-row gap-2 sm:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            <Input 
              placeholder="Buscar produtos ou fornecedores..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 pl-8 text-xs bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-lg focus:ring-1 focus:ring-gray-300 dark:focus:ring-gray-600"
            />
          </div>
          <div className="flex items-center gap-2">
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="h-8 w-[140px] text-xs bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-lg">
                <div className="flex items-center gap-2">
                  <ArrowUpDown className="h-3 w-3 text-gray-400" />
                  <span className="truncate">Ordenar por</span>
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default" className="text-xs">Padrão</SelectItem>
                <SelectItem value="price-asc" className="text-xs">Menor Preço</SelectItem>
                <SelectItem value="price-desc" className="text-xs">Maior Preço</SelectItem>
                <SelectItem value="savings" className="text-xs">Maior Economia</SelectItem>
                <SelectItem value="name" className="text-xs">Nome (A-Z)</SelectItem>
              </SelectContent>
            </Select>
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Total Itens:</span>
              <span className="text-[10px] font-black text-gray-900 dark:text-white">{filteredAndSortedData.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Lista Compacta - Estilo Grid (Igual ao Valores/Pedido) */}
      <div className="flex-1 overflow-auto custom-scrollbar">
        {/* Header da Tabela (Fixo) */}
        <div className="grid grid-cols-[1.5fr_0.8fr_1.5fr_auto] gap-2 px-3 py-1.5 border-b border-gray-200 dark:border-gray-800 text-[8px] font-black uppercase text-gray-500 tracking-[0.2em] bg-gray-50 dark:bg-gray-800 sticky top-0 z-10">
           <div>Produto</div>
           <div className="hidden sm:block">Qtd</div>
           <div>Melhor Fornecedor</div>
           <div className="text-right">Melhor Preço</div>
        </div>

        <div className="flex flex-col bg-white dark:bg-gray-900">
          {filteredAndSortedData.length > 0 ? (
            filteredAndSortedData.map((item) => {
              const hasSavings = item.savings > 0;
              
              return (
                <div 
                  key={item.productId} 
                  className="px-2 py-1"
                >
                  <div className={cn(
                    "flex flex-col rounded-xl border transition-all duration-300 group/row bg-white dark:bg-gray-900 shadow-sm hover:shadow-md hover:border-gray-300 dark:hover:border-gray-700",
                    item.bestPrice > 0 ? "border-emerald-100 dark:border-emerald-900/30" : "border-gray-100 dark:border-gray-800"
                  )}>
                    <div className="flex items-center px-3" style={{ height: '52px' }}>
                    <div className="grid grid-cols-[1.5fr_0.8fr_1.5fr_auto] gap-2 w-full items-center">
                      {/* Produto */}
                      <div className="min-w-0">
                        <p className="font-bold text-[11px] text-gray-900 dark:text-white truncate tracking-tight" title={safeStr(item.productName)}>
                          {safeStr(item.productName)}
                        </p>
                        <span className="sm:hidden text-[7px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider bg-gray-100 dark:bg-gray-800 px-1 py-0 rounded border border-gray-200 dark:border-gray-700 w-fit mt-0.5 block">
                          {safeStr(item.quantidade)} {safeStr(item.unidade)}
                        </span>
                      </div>

                      {/* Qtd Desktop */}
                      <div className="hidden sm:block">
                        <span className="text-[9px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-1.5 py-0.5 bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700">
                          {safeStr(item.quantidade)} {safeStr(item.unidade)}
                        </span>
                      </div>

                      {/* Melhor Fornecedor */}
                      <div className="min-w-0">
                        {item.bestPrice > 0 ? (
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-md bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500 flex-shrink-0">
                              <Building2 className="h-3 w-3" />
                            </div>
                            <span className="text-[10px] font-bold text-gray-700 dark:text-gray-300 uppercase tracking-tight truncate">
                              {safeStr(item.bestSupplierName)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[9px] font-medium text-gray-400 italic">Aguardando...</span>
                        )}
                      </div>

                      {/* Melhor Preço */}
                      <div className="text-right">
                        {item.bestPrice > 0 ? (
                          <div className="flex flex-col items-end">
                            <span className="font-bold text-[11px] text-emerald-600 dark:text-emerald-400 tracking-tight">
                              R$ {item.bestPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </span>
                            {hasSavings && (
                              <div className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 px-1 py-0 rounded text-[6px] font-black uppercase tracking-wider shadow-sm flex items-center gap-0.5 mt-0.5 transition-all duration-200">
                                <TrendingDown className="h-2 w-2" />
                                -{((item.savings / (item.bestPrice + item.savings)) * 100).toFixed(0)}%
                              </div>
                            )}
                          </div>
                        ) : (
                          <Badge variant="outline" className="text-[7px] text-gray-400 border-gray-200">SEM PREÇO</Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Lista de Outros Preços (Horizontal e discreta) */}
                  {item.allPrices.length > 1 && (
                    <div className="px-3 pb-2 flex items-center gap-2 overflow-x-auto no-scrollbar">
                      <span className="text-[7px] font-black text-gray-400 uppercase tracking-widest flex-shrink-0">Outras cotações:</span>
                      {item.allPrices.slice(1).map((price: any, idx: number) => (
                        <div key={idx} className="flex items-center gap-1.5 px-2 py-0.5 bg-gray-50/50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 rounded text-[8px] text-gray-500 dark:text-gray-400 whitespace-nowrap">
                          <span className="font-bold">{safeStr(price.nome)}</span>
                          <span className="opacity-30">|</span>
                          <span>R$ {price.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })
          ) : (
            <div className="py-20 px-4">
              <EmptyState 
                icon={Inbox}
                title="Nenhum resultado encontrado"
                description={searchQuery ? "Tente ajustar sua busca ou filtros." : "Aguardando o recebimento de cotações dos fornecedores."}
                variant="inline"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
