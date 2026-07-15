import { useState, useMemo, useEffect } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, Award, TrendingDown, Copy, Package, Building2, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/utils/formatters";
import type { PackagingQuoteDisplay } from "@/types/packaging";
import { PackagingEconomyBreakdown } from "./PackagingEconomyBreakdown";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

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
  isCompleted?: boolean;
}

export function ResumoTab({ bestPricesData, onCopyBestPrices, onEditItem, isCompleted }: ResumoTabProps) {
  const [view, setView] = useState<"item" | "fornecedor" | "economia">(isCompleted ? "fornecedor" : "item");

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
      <div className="p-3 space-y-2.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h3 className="text-xs font-semibold text-foreground flex items-center gap-1.5 shrink-0">
            <Star className="h-3.5 w-3.5 text-brand" />
            <span>Resumo de Vencedores</span>
          </h3>
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1 -mb-1">
            <div className="flex bg-muted/20 border border-border dark:border-white/5 rounded-lg p-0.5 shrink-0">
              <Button 
                variant={view === "item" ? "secondary" : "ghost"} 
                size="sm" 
                onClick={() => setView("item")}
                className={cn("h-6 px-2.5 text-[10px] font-bold uppercase tracking-wider rounded transition-all",
                  view === "item" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}
              >
                <Package className="h-3 w-3 mr-1.5" />Item
              </Button>
              <Button 
                variant={view === "fornecedor" ? "secondary" : "ghost"} 
                size="sm" 
                onClick={() => setView("fornecedor")}
                className={cn("h-6 px-2.5 text-[10px] font-bold uppercase tracking-wider rounded transition-all",
                  view === "fornecedor" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}
              >
                <Building2 className="h-3 w-3 mr-1.5" />Fornecedor
              </Button>
              <Button 
                variant={view === "economia" ? "secondary" : "ghost"} 
                size="sm" 
                onClick={() => setView("economia")}
                className={cn("h-6 px-2.5 text-[10px] font-bold uppercase tracking-wider rounded transition-all",
                  view === "economia" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}
              >
                <TrendingDown className="h-3 w-3 mr-1.5" />Economia
              </Button>
            </div>
            <Button variant="outline" size="sm" className="h-6 px-2.5 text-[10px] font-bold uppercase tracking-wider rounded-lg border-border hover:bg-muted shrink-0" onClick={onCopyBestPrices}>
              <Copy className="h-3 w-3 sm:mr-1.5" /><span className="hidden sm:inline">Copiar</span>
            </Button>
          </div>
        </div>
        {view === "economia" ? (
          <PackagingEconomyBreakdown bestPricesData={bestPricesData} />
        ) : view === "item" ? (
          <Card className="overflow-hidden border-border bg-card shadow-sm rounded-xl">
            <div className="divide-y divide-border/50">
              {bestPricesData.map((item) => {
                const sortedPrices = [...item.allPrices].sort((a, b) => a.custoPorUnidade - b.custoPorUnidade);
                return (
                  <div key={item.packagingId} className="px-3 sm:px-4 py-2 flex items-center gap-2 sm:gap-3 hover:bg-muted/30 transition-colors">
                    <p className="flex-1 min-w-0 font-semibold text-foreground text-[13px] truncate" title={item.packagingName}>{item.packagingName}</p>
                    {item.bestPrice > 0 ? (
                      <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
                        <span className="hidden sm:block w-[120px] text-right text-[10px] font-bold text-brand uppercase tracking-wide truncate" title={item.bestSupplierName}>{item.bestSupplierName}</span>
                        <span className="w-[84px] text-right text-sm font-bold text-foreground tracking-tight whitespace-nowrap tabular-nums">
                          {formatCurrency(item.bestPrice)}<span className="text-[10px] font-medium text-muted-foreground ml-0.5">/un</span>
                        </span>
                        <div className="hidden sm:flex w-[64px] justify-end">
                          {item.savings > 0 && (
                            <Badge className="bg-brand/10 text-brand border border-brand/20 text-[10px] font-bold whitespace-nowrap px-1.5">
                              -{formatCurrency(item.savings)}
                            </Badge>
                          )}
                        </div>
                        <div className="w-7 flex justify-end">
                          {sortedPrices.length > 1 && (
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-6 w-6 rounded-md text-brand hover:bg-brand/10 shrink-0" title="Ver todos os fornecedores">
                                  <Award className="h-3.5 w-3.5" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto min-w-[220px] p-2.5 shadow-lg" align="end">
                                <h4 className="font-semibold text-[10px] uppercase tracking-wider text-muted-foreground border-b border-border dark:border-white/5 pb-1.5 mb-1.5 px-1">Fornecedores · menor → maior</h4>
                                <div className="flex flex-col gap-0.5">
                                  {sortedPrices.map((price, idx) => (
                                    <button key={price.supplierId} onClick={() => onEditItem(price.supplierId, item.packagingId)}
                                      className={cn("flex justify-between items-center gap-4 text-xs rounded-md px-2 py-1.5 transition-colors text-left", idx === 0 ? "bg-brand/5 hover:bg-brand/10" : "hover:bg-muted")}>
                                      <span className="flex items-center gap-1.5 min-w-0">
                                        {idx === 0 && <Award className="h-3 w-3 text-brand shrink-0" />}
                                        <span className={cn("truncate max-w-[150px]", idx === 0 ? "font-bold text-foreground" : "text-muted-foreground")} title={price.supplierName}>{price.supplierName}</span>
                                      </span>
                                      <span className={cn("font-bold whitespace-nowrap tabular-nums", idx === 0 ? "text-brand" : "text-foreground")}>
                                        {formatCurrency(price.custoPorUnidade)}<span className="font-normal text-[10px] text-muted-foreground ml-0.5">/un</span>
                                      </span>
                                    </button>
                                  ))}
                                </div>
                              </PopoverContent>
                            </Popover>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
                        <span className="hidden sm:block w-[120px]" />
                        <span className="w-[84px] text-right text-xs font-medium text-muted-foreground">Sem preço</span>
                        <div className="hidden sm:block w-[64px]" />
                        <div className="w-7" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        ) : (
          <div className="space-y-3">
            {bestPricesBySupplier.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-xs">
                Nenhum vencedor atribuído ainda
              </div>
            ) : (
              bestPricesBySupplier.map((group) => (
                <Card key={group.supplierId} className="overflow-hidden border-border bg-card shadow-sm rounded-xl">
                  <div className="bg-muted/20 px-3 sm:px-4 py-2 border-b border-border dark:border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-brand/10 border border-brand/20 flex items-center justify-center text-brand flex-shrink-0">
                        <Building2 className="h-3.5 w-3.5" />
                      </div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-[13px] text-foreground">{group.supplierName}</h4>
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                          · {group.items.length} {group.items.length === 1 ? 'item' : 'itens'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="divide-y divide-border/50">
                    {group.items.map((item) => {
                      const outros = item.allPrices
                        .filter(p => p.supplierId !== group.supplierId)
                        .sort((a, b) => a.custoPorUnidade - b.custoPorUnidade);
                      return (
                        <div
                          key={item.packagingId}
                          className="px-3 sm:px-4 py-1.5 flex items-center justify-between gap-3 hover:bg-muted/30 transition-colors cursor-pointer"
                          onClick={() => onEditItem(group.supplierId, item.packagingId)}
                        >
                          <p className="flex-1 min-w-0 font-semibold text-foreground text-[13px] truncate" title={item.packagingName}>{item.packagingName}</p>
                          <div className="text-right flex items-center justify-end gap-2 shrink-0">
                            <p className="font-bold text-[13px] text-foreground flex items-center gap-1 tabular-nums">
                              {formatCurrency(item.bestPrice)}
                              <span className="text-[10px] text-muted-foreground font-medium">/un</span>
                            </p>
                            {outros.length > 0 && (
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-5 w-5 rounded-full text-muted-foreground hover:text-foreground bg-muted/50"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <Info className="h-3 w-3" />
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto min-w-[200px] p-2.5 shadow-lg" align="end" onClick={(e) => e.stopPropagation()}>
                                  <h4 className="font-semibold text-[10px] uppercase tracking-wider text-muted-foreground border-b border-border dark:border-white/5 pb-1.5 mb-1.5 px-1">Outros fornecedores</h4>
                                  <div className="flex flex-col gap-0.5">
                                    {outros.map((price) => (
                                      <div key={price.supplierId} className="flex justify-between items-center gap-4 text-xs px-1 py-0.5">
                                        <span className="text-muted-foreground truncate max-w-[150px]" title={price.supplierName}>{price.supplierName}</span>
                                        <span className="font-bold text-foreground tabular-nums whitespace-nowrap">{formatCurrency(price.custoPorUnidade)}<span className="font-normal text-[10px] text-muted-foreground ml-0.5">/un</span></span>
                                      </div>
                                    ))}
                                  </div>
                                </PopoverContent>
                              </Popover>
                            )}
                          </div>
                        </div>
                      );
                    })}
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

