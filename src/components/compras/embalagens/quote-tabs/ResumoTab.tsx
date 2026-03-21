import { useState, useMemo, useEffect } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, Award, TrendingDown, Copy, Package, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/utils/formatters";
import type { PackagingQuoteDisplay } from "@/types/packaging";
import { PackagingEconomyBreakdown } from "./PackagingEconomyBreakdown";

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
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 overflow-hidden">
            <Star className="h-3 w-3 flex-shrink-0" /><span className="truncate">Melhor Preço</span>
          </h3>
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1 -mb-1">
            <div className="flex bg-muted/20 border border-border/50 rounded-md p-0.5 flex-shrink-0">
              <Button 
                variant={view === "item" ? "secondary" : "ghost"} 
                size="sm" 
                onClick={() => setView("item")}
                className={cn("h-7 px-3 text-[10px] font-bold uppercase tracking-wider rounded transition-all", 
                  view === "item" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}
              >
                <Package className="h-3 w-3 mr-1.5" />Item
              </Button>
              <Button 
                variant={view === "fornecedor" ? "secondary" : "ghost"} 
                size="sm" 
                onClick={() => setView("fornecedor")}
                className={cn("h-7 px-3 text-[10px] font-bold uppercase tracking-wider rounded transition-all", 
                  view === "fornecedor" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}
              >
                <Building2 className="h-3 w-3 mr-1.5" />Fornecedor
              </Button>
              <Button 
                variant={view === "economia" ? "secondary" : "ghost"} 
                size="sm" 
                onClick={() => setView("economia")}
                className={cn("h-7 px-3 text-[10px] font-bold uppercase tracking-wider rounded transition-all", 
                  view === "economia" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}
              >
                <TrendingDown className="h-3 w-3 mr-1.5" />Economia
              </Button>
            </div>
            <Button variant="outline" size="sm" className="h-7 px-3 text-[10px] font-bold uppercase tracking-wider rounded-md border-border hover:bg-muted flex-shrink-0" onClick={onCopyBestPrices}>
              <Copy className="h-3 w-3 sm:mr-1.5" /><span className="hidden sm:inline">Copiar</span>
            </Button>
          </div>
        </div>
        {view === "economia" ? (
          <PackagingEconomyBreakdown bestPricesData={bestPricesData} />
        ) : view === "item" ? (
          <Card className="overflow-hidden border-border bg-card shadow-sm rounded-xl">
            <div className="divide-y divide-border/50">
              {bestPricesData.map((item) => (
                <div key={item.packagingId} className="px-4 py-3 hover:bg-muted/30 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground text-[13px]">{item.packagingName}</p>
                      {item.allPrices.length > 1 && (
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {item.allPrices.map((price, idx) => (
                            <Badge key={price.supplierId} variant="outline"
                              className={cn("text-[9px] font-bold cursor-pointer border transition-colors", 
                                idx === 0 
                                  ? "bg-muted text-foreground border-border hover:bg-muted/80" 
                                  : "bg-background text-muted-foreground border-border hover:bg-muted")}
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
                            <Award className="h-3.5 w-3.5 text-brand" />
                            <span className="text-base font-bold text-foreground tracking-tight">{formatCurrency(item.bestPrice)}<span className="text-[10px] font-medium text-muted-foreground ml-0.5">/un</span></span>
                          </div>
                          <p className="text-[10px] font-bold text-brand uppercase tracking-wide mt-0.5">{item.bestSupplierName}</p>
                          {item.savings > 0 && (
                            <Badge className="mt-1 bg-brand/10 text-brand border border-brand/20 text-[9px] font-bold">
                              <TrendingDown className="h-2.5 w-2.5 mr-0.5" />
                              -{formatCurrency(item.savings)}/un
                            </Badge>
                          )}
                        </>
                      ) : <Badge variant="outline" className="text-muted-foreground bg-muted text-[9px] font-bold border-border">Sem preço</Badge>}
                    </div>
                  </div>
                </div>
              ))}
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
                  <div className="bg-muted/20 px-4 py-3 border-b border-border/50 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-brand/10 border border-brand/20 flex items-center justify-center text-brand flex-shrink-0">
                        <Building2 className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-[13px] text-foreground">{group.supplierName}</h4>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mt-0.5">
                          {group.items.length} {group.items.length === 1 ? 'item ganho' : 'itens ganhos'}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="divide-y divide-border/50">
                    {group.items.map((item) => (
                      <div 
                        key={item.packagingId} 
                        className="px-4 py-3 flex items-center justify-between gap-3 hover:bg-muted/30 transition-colors cursor-pointer"
                        onClick={() => onEditItem(group.supplierId, item.packagingId)}
                      >
                        <div className="flex items-center gap-3">
                          <Package className="h-4 w-4 text-muted-foreground" />
                          <p className="font-semibold text-foreground text-[13px]">{item.packagingName}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-[13px] text-foreground flex items-center gap-1">
                            {formatCurrency(item.bestPrice)}
                            <span className="text-[10px] text-muted-foreground font-medium">/un</span>
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
