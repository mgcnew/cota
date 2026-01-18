import { Package, Building2, TrendingDown, Trophy, CheckCircle, Star, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

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
  return (
    <div className="p-3 space-y-3">
      {/* Cards de Stats Rápidos */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        <div className="bg-teal-500/5 dark:bg-teal-900/10 rounded-2xl p-2.5 border border-teal-500/20 dark:border-teal-800/30 backdrop-blur-md shadow-sm">
          <div className="flex items-center gap-2 text-teal-600 dark:text-teal-400 mb-1">
            <div className="w-5 h-5 rounded-lg bg-teal-500/10 flex items-center justify-center">
              <Package className="h-2.5 w-2.5" />
            </div>
            <span className="text-[9px] font-black uppercase tracking-widest opacity-70">Produtos</span>
          </div>
          <p className="font-black text-lg text-gray-900 dark:text-white">{stats.totalProdutos}</p>
        </div>
        <div className="bg-amber-500/5 dark:bg-amber-900/10 rounded-2xl p-2.5 border border-amber-500/20 dark:border-amber-800/30 backdrop-blur-md shadow-sm">
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 mb-1">
            <div className="w-5 h-5 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <Building2 className="h-2.5 w-2.5" />
            </div>
            <span className="text-[9px] font-black uppercase tracking-widest opacity-70">Fornecedores</span>
          </div>
          <p className="font-black text-lg text-gray-900 dark:text-white">{stats.totalFornecedores}</p>
        </div>
        <div className="bg-emerald-500/5 dark:bg-emerald-900/10 rounded-2xl p-2.5 border border-emerald-500/20 dark:border-emerald-800/30 backdrop-blur-md shadow-sm">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 mb-1">
            <div className="w-5 h-5 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <Trophy className="h-2.5 w-2.5" />
            </div>
            <span className="text-[9px] font-black uppercase tracking-widest opacity-70">Melhor Total</span>
          </div>
          <p className="font-black text-lg text-emerald-700 dark:text-emerald-400 flex items-baseline gap-1">
            <span className="text-[10px]">R$</span> {melhorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div className="bg-purple-500/5 dark:bg-purple-900/10 rounded-2xl p-2.5 border border-purple-500/20 dark:border-purple-800/30 backdrop-blur-md shadow-sm">
          <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 mb-1">
            <div className="w-5 h-5 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <TrendingDown className="h-2.5 w-2.5" />
            </div>
            <span className="text-[9px] font-black uppercase tracking-widest opacity-70">Potencial</span>
          </div>
          <p className="font-black text-lg text-purple-700 dark:text-purple-400 flex items-baseline gap-1">
            <span className="text-[10px]">R$</span> {(productPricesData.reduce((acc, curr) => acc + curr.savings, 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      {/* Tabela de Preços por Produto */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <Trophy className="h-3 w-3 text-amber-500" />
            <span className="text-[9px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em]">Melhor Preço por Produto</span>
          </div>
          <Badge variant="outline" className="text-[8px] font-bold uppercase tracking-widest border-white/20 h-5">Análise Competitiva</Badge>
        </div>
        
        <div className="grid grid-cols-1 gap-2">
          {productPricesData.map((item) => (
            <div key={item.productId} className="group relative">
              <div className="p-3 bg-white/40 dark:bg-gray-900/40 rounded-xl border border-white/30 dark:border-white/10 backdrop-blur-xl shadow-sm hover:border-teal-500/40 transition-all duration-300">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-teal-500/10 flex items-center justify-center text-teal-600 border border-teal-500/20 flex-shrink-0">
                      <Package className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-black text-xs text-gray-900 dark:text-white truncate tracking-tight">
                        {safeStr(item.productName)}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest bg-white/50 dark:bg-black/20 px-1.5 py-0.5 rounded border border-white/20">
                          {safeStr(item.quantidade)} {safeStr(item.unidade)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col lg:items-end gap-1 flex-shrink-0">
                    {item.bestPrice > 0 ? (
                      <div className="flex flex-col lg:items-end gap-0.5">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500 shadow-sm ring-1 ring-amber-500/20">
                            <Star className="h-2.5 w-2.5 fill-amber-500" />
                          </div>
                          <span className="text-base font-black text-emerald-600 dark:text-emerald-400 tracking-tighter">
                            R$ {item.bestPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[8px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">Fornecedor:</span>
                          <span className="text-[8px] font-black text-gray-900 dark:text-white uppercase tracking-widest px-1.5 py-0.5 bg-white/50 dark:bg-white/5 rounded border border-white/20">
                            {safeStr(item.bestSupplierName)}
                          </span>
                        </div>
                        {item.savings > 0 && (
                          <div className="mt-1 px-2 py-0.5 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 rounded-full border border-emerald-500/20 flex items-center gap-1.5 shadow-sm">
                            <TrendingDown className="h-2.5 w-2.5" />
                            <span className="text-[8px] font-black uppercase tracking-widest">Economia: R$ {item.savings.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <Badge variant="outline" className="h-7 px-3 text-[8px] font-black text-gray-400 uppercase tracking-[0.2em] border-dashed border rounded-lg">Sem Cotação</Badge>
                    )}
                  </div>
                </div>

                {/* Comparativo de Preços */}
                {item.allPrices.length > 1 && (
                  <div className="mt-2 pt-2 border-t border-white/10 dark:border-white/5">
                    <div className="flex flex-wrap gap-1.5">
                      {item.allPrices.map((price: any, idx: number) => (
                        <div
                          key={idx}
                          className={cn(
                            "px-1.5 py-0.5 rounded-md text-[7px] font-black uppercase tracking-widest border transition-all flex items-center gap-1",
                            idx === 0
                              ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30 shadow-sm"
                              : "bg-white/40 dark:bg-white/5 text-gray-400 dark:text-gray-500 border-white/20 dark:border-white/10"
                          )}
                        >
                          {idx === 0 && <CheckCircle className="h-2 w-2" />}
                          {safeStr(price.nome)}: R$ {price.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
