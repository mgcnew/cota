import { useState, useMemo } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, Award, TrendingDown, Copy, Package, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/utils/formatters";
import type { PackagingQuoteDisplay } from "@/types/packaging";

interface BestPriceItem {
  packagingId: string;
  packagingName: string;
  bestPrice: number;
  bestSupplierId: string | null;
  bestSupplierName: string;
  allPrices: { supplierId: string; supplierName: string; custoPorUnidade: number; valorTotal: number }[];
  savings: number;
}

interface ResumoTabProps {
  bestPricesData: BestPriceItem[];
  onCopyBestPrices: () => void;
  onEditItem: (supplierId: string, packagingId: string) => void;
}

export function ResumoTab({ bestPricesData, onCopyBestPrices, onEditItem }: ResumoTabProps) {
  const [view, setView] = useState<"item" | "fornecedor">("item");

  const bestPricesBySupplier = useMemo(() => {
    const grouped = bestPricesData.reduce((acc, curr) => {
      // Agrupar apenas itens que têm preço
      if (curr.bestPrice > 0 && curr.bestSupplierId) {
        if (!acc[curr.bestSupplierId]) {
          acc[curr.bestSupplierId] = {
            supplierId: curr.bestSupplierId,
            supplierName: curr.bestSupplierName,
            items: []
          };
        }
        acc[curr.bestSupplierId].items.push(curr);
      }
      return acc;
    }, {} as Record<string, { supplierId: string; supplierName: string; items: BestPriceItem[] }>);

    return Object.values(grouped).sort((a, b) => b.items.length - a.items.length); // Ordenar por mais itens ganhos
  }, [bestPricesData]);

  return (
    <ScrollArea className="flex-1 h-full">
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
            <Star className="h-3 w-3" />Melhor Preço por Embalagem
          </h3>
          <div className="flex items-center gap-2">
            <div className="flex bg-zinc-100 dark:bg-zinc-800/40 border border-zinc-200/50 dark:border-zinc-700/30 rounded-md p-0.5">
              <Button 
                variant={view === "item" ? "secondary" : "ghost"} 
                size="sm" 
                onClick={() => setView("item")}
                className={cn("h-6 px-2 text-[9px] font-bold uppercase tracking-wider rounded transition-all", 
                  view === "item" ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-50 shadow-sm" : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100")}
              >
                <Package className="h-2.5 w-2.5 mr-1" />Item
              </Button>
              <Button 
                variant={view === "fornecedor" ? "secondary" : "ghost"} 
                size="sm" 
                onClick={() => setView("fornecedor")}
                className={cn("h-6 px-2 text-[9px] font-bold uppercase tracking-wider rounded transition-all", 
                  view === "fornecedor" ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-50 shadow-sm" : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100")}
              >
                <Building2 className="h-2.5 w-2.5 mr-1" />Fornecedor
              </Button>
            </div>
            <Button variant="outline" size="sm" className="h-6 px-2 text-[9px] font-bold uppercase tracking-wider rounded-md border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800" onClick={onCopyBestPrices}>
              <Copy className="h-2.5 w-2.5 mr-1" />Copiar Geral
            </Button>
          </div>
        </div>
        {view === "item" ? (
          <Card className="overflow-hidden border-zinc-200 dark:border-zinc-800 bg-white dark:bg-card/80 shadow-sm rounded-xl">
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {bestPricesData.map((item) => (
                <div key={item.packagingId} className="px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-zinc-900 dark:text-zinc-50 text-[13px]">{item.packagingName}</p>
                      {item.allPrices.length > 1 && (
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {item.allPrices.map((price, idx) => (
                            <Badge key={price.supplierId} variant="outline"
                              className={cn("text-[9px] font-medium cursor-pointer", 
                                idx === 0 
                                  ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-700" 
                                  : "bg-white dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800")}
                              onClick={() => onEditItem(price.supplierId, item.packagingId)}>
                              {price.supplierName}: {formatCurrency(price.custoPorUnidade)}/un
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0">
                      {item.bestPrice > 0 ? (
                        <>
                          <div className="flex items-center gap-1.5 justify-end">
                            <Award className="h-3.5 w-3.5 text-zinc-400" />
                            <span className="text-base font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">{formatCurrency(item.bestPrice)}<span className="text-[10px] font-medium text-zinc-400 ml-0.5">/un</span></span>
                          </div>
                          <p className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mt-0.5">{item.bestSupplierName}</p>
                          {item.savings > 0 && (
                            <Badge className="mt-1 bg-primary text-primary-foreground border-0 text-[9px] font-bold">
                              <TrendingDown className="h-2.5 w-2.5 mr-0.5" />
                              -{formatCurrency(item.savings)}/un
                            </Badge>
                          )}
                        </>
                      ) : <Badge variant="outline" className="text-zinc-400 bg-zinc-50 dark:bg-zinc-900 text-[9px] border-zinc-200 dark:border-zinc-800">Sem preço</Badge>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        ) : (
          <div className="space-y-3">
            {bestPricesBySupplier.length === 0 ? (
              <div className="text-center py-8 text-zinc-500 text-xs">
                Nenhum vencedor atribuído ainda
              </div>
            ) : (
              bestPricesBySupplier.map((group) => (
                <Card key={group.supplierId} className="overflow-hidden border-zinc-200 dark:border-zinc-800 bg-white dark:bg-card/80 shadow-sm rounded-xl">
                  <div className="bg-zinc-50 dark:bg-zinc-800/50 px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-zinc-600 dark:text-zinc-300 flex-shrink-0">
                        <Building2 className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-[13px] text-zinc-900 dark:text-zinc-50">{group.supplierName}</h4>
                        <p className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mt-0.5">
                          {group.items.length} itens ganhos
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {group.items.map((item) => (
                      <div 
                        key={item.packagingId} 
                        className="px-4 py-3 flex items-center justify-between gap-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer"
                        onClick={() => onEditItem(group.supplierId, item.packagingId)}
                      >
                        <div className="flex items-center gap-3">
                          <Package className="h-4 w-4 text-zinc-400" />
                          <p className="font-semibold text-zinc-900 dark:text-zinc-50 text-[13px]">{item.packagingName}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-[13px] text-zinc-900 dark:text-zinc-50 flex items-center gap-1">
                            {formatCurrency(item.bestPrice)}
                            <span className="text-[10px] text-zinc-400 font-medium">/un</span>
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              ))
            )}
          </div>
        )}
      </div>
    </ScrollArea>
  );
}
