import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingDown, Package, ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/utils/formatters";

interface PackagingEconomyBreakdownProps {
  bestPricesData: {
    packagingId: string;
    packagingName: string;
    bestPrice: number;
    bestSupplierId: string | null;
    bestSupplierName: string;
    allPrices: {
      supplierId: string;
      supplierName: string;
      custoPorUnidade: number;
      valorTotal: number;
    }[];
    savings: number; // Worst price - Best price
  }[];
}

export function PackagingEconomyBreakdown({
  bestPricesData,
}: PackagingEconomyBreakdownProps) {
  const [sortBy, setSortBy] = useState<"name" | "economy">("economy");

  const validItems = bestPricesData.filter(
    (item) => item.allPrices && item.allPrices.length > 0
  );

  const economies = validItems.map((item) => {
    // allPrices is sorted ascending in bestPricesData
    const best = item.allPrices[0];
    const worst = item.allPrices[item.allPrices.length - 1];
    return {
      productId: item.packagingId,
      productName: item.packagingName,
      bestPrice: {
        supplierId: best.supplierId,
        supplierName: best.supplierName,
        valorUnitario: best.custoPorUnidade,
        valorTotal: best.valorTotal,
      },
      worstPrice: {
        supplierId: worst.supplierId,
        supplierName: worst.supplierName,
        valorUnitario: worst.custoPorUnidade,
        valorTotal: worst.valorTotal,
      },
      economiaReal: item.savings || 0, // Economy per unit
      hasMultipleSuppliers: item.allPrices.length > 1,
    };
  });

  const sortedEconomies = [...economies].sort((a, b) => {
    if (sortBy === "economy") {
      return b.economiaReal - a.economiaReal;
    }
    return a.productName.localeCompare(b.productName);
  });

  const totalEconomy = economies.reduce(
    (sum, item) => sum + item.economiaReal,
    0
  );

  if (economies.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-4">
        <Package className="h-12 w-12 text-gray-300 dark:text-gray-600" />
        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
          Nenhum item com ofertas para analisar economia.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {/* Total Economy Summary */}
      <Card className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800/50 px-3 py-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-green-100 dark:bg-green-900/50 rounded-lg">
              <TrendingDown className="h-4 w-4 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-[10px] font-medium text-gray-600 dark:text-gray-400">
                Economia Potencial (por un)
              </p>
              <p className="text-base font-bold text-green-600 dark:text-green-400 leading-tight">
                {formatCurrency(totalEconomy)}
              </p>
            </div>
          </div>
          <p className="text-[10px] font-medium text-gray-600 dark:text-gray-400">
            {economies.length} produto{economies.length !== 1 ? "s" : ""}
          </p>
        </div>
      </Card>

      {/* Sorting Controls */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-medium text-gray-600 dark:text-gray-400">Ordenar por:</span>
        <Button
          variant={sortBy === "economy" ? "default" : "outline"}
          size="sm"
          onClick={() => setSortBy("economy")}
          className="text-[10px] uppercase font-bold tracking-wider h-6 px-2.5"
        >
          <ArrowUpDown className="h-3 w-3 mr-1" />
          Economia
        </Button>
        <Button
          variant={sortBy === "name" ? "default" : "outline"}
          size="sm"
          onClick={() => setSortBy("name")}
          className="text-[10px] uppercase font-bold tracking-wider h-6 px-2.5"
        >
          <ArrowUpDown className="h-3 w-3 mr-1" />
          Nome
        </Button>
      </div>

      {/* Products List */}
      <Card className="overflow-hidden border border-border dark:border-white/5 bg-card shadow-sm rounded-xl">
        {/* Header */}
        <div className="px-3 sm:px-4 py-1.5 flex items-center gap-2 sm:gap-3 bg-muted/40 border-b border-border dark:border-white/5">
          <span className="flex-1 text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Embalagem</span>
          <span className="w-[100px] sm:w-[168px] text-right text-[9px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Melhor</span>
          <span className="hidden sm:block w-[168px] text-right text-[9px] font-bold uppercase tracking-widest text-red-500 dark:text-red-400">Pior</span>
          <span className="w-[68px] text-right text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Econ.</span>
        </div>

        <div className="divide-y divide-border/50">
          {sortedEconomies.map((item) => (
            <div key={item.productId} className="px-3 sm:px-4 py-2 flex items-center gap-2 sm:gap-3 hover:bg-muted/30 transition-colors">
              <p className="flex-1 min-w-0 font-semibold text-foreground text-[13px] truncate" title={item.productName}>
                {item.productName}
              </p>

              {/* Melhor */}
              <div className="w-[100px] sm:w-[168px] shrink-0 flex items-baseline justify-end gap-1.5">
                <span className="hidden sm:block flex-1 min-w-0 text-[9px] text-muted-foreground truncate text-right" title={item.bestPrice.supplierName}>
                  {item.bestPrice.supplierName}
                </span>
                <span className="text-[13px] font-bold text-emerald-600 dark:text-emerald-400 tabular-nums whitespace-nowrap">
                  {formatCurrency(item.bestPrice.valorUnitario)}<span className="text-[9px] font-medium text-muted-foreground ml-0.5">/un</span>
                </span>
              </div>

              {/* Pior */}
              <div className="hidden sm:flex w-[168px] shrink-0 items-baseline justify-end gap-1.5">
                {item.hasMultipleSuppliers ? (
                  <>
                    <span className="flex-1 min-w-0 text-[9px] text-muted-foreground truncate text-right" title={item.worstPrice.supplierName}>
                      {item.worstPrice.supplierName}
                    </span>
                    <span className="text-[13px] font-bold text-red-500 dark:text-red-400 tabular-nums whitespace-nowrap">
                      {formatCurrency(item.worstPrice.valorUnitario)}<span className="text-[9px] font-medium text-muted-foreground ml-0.5">/un</span>
                    </span>
                  </>
                ) : (
                  <span className="text-xs text-muted-foreground">—</span>
                )}
              </div>

              {/* Economia */}
              <div className="w-[68px] shrink-0 flex justify-end">
                {item.hasMultipleSuppliers && item.economiaReal > 0 ? (
                  <Badge className="bg-brand/10 text-brand border border-brand/20 text-[10px] font-bold px-1.5 whitespace-nowrap">
                    -{formatCurrency(item.economiaReal)}
                  </Badge>
                ) : (
                  <span className="text-[10px] text-muted-foreground">—</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

