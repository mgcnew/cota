import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingDown, Package, ArrowUpDown, Building2 } from "lucide-react";
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
    <div className="space-y-4">
      {/* Total Economy Summary */}
      <Card className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800/50 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-lg">
              <TrendingDown className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
                Economia Potencial (por un)
              </p>
              <p className="text-lg font-bold text-green-600 dark:text-green-400">
                {formatCurrency(totalEconomy)}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
              {economies.length} produto{economies.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
      </Card>

      {/* Sorting Controls */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
            Ordenar por:
          </span>
          <div className="flex gap-2">
            <Button
              variant={sortBy === "economy" ? "default" : "outline"}
              size="sm"
              onClick={() => setSortBy("economy")}
              className="text-[10px] uppercase font-bold tracking-wider h-7"
            >
              <ArrowUpDown className="h-3 w-3 mr-1" />
              Economia
            </Button>
            <Button
              variant={sortBy === "name" ? "default" : "outline"}
              size="sm"
              onClick={() => setSortBy("name")}
              className="text-[10px] uppercase font-bold tracking-wider h-7"
            >
              <ArrowUpDown className="h-3 w-3 mr-1" />
              Nome
            </Button>
          </div>
        </div>
      </div>

      {/* Products List */}
      <div className="space-y-3">
        {sortedEconomies.map((item) => (
          <Card
            key={item.productId}
            className="border border-border/50 bg-card shadow-sm"
          >
            <div className="p-4 space-y-3">
              {/* Product Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 flex items-center gap-2">
                  <Package className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <h4 className="font-semibold text-foreground text-[13px] truncate">
                    {item.productName}
                  </h4>
                </div>
                {item.hasMultipleSuppliers && item.economiaReal > 0 ? (
                  <Badge className="bg-brand/10 text-brand border border-brand/20 flex-shrink-0 text-[10px] font-bold">
                    -{formatCurrency(item.economiaReal)}/un
                  </Badge>
                ) : (
                  <Badge variant="outline" className="flex-shrink-0 text-[10px] font-bold">
                    N/A
                  </Badge>
                )}
              </div>

              {/* Prices Comparison */}
              {item.hasMultipleSuppliers ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Best Price */}
                  <div className="bg-green-50/50 dark:bg-green-900/10 rounded-lg p-3 border border-green-200/50 dark:border-green-800/30">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-green-600 dark:text-green-400 mb-1">
                      Melhor Oferta
                    </p>
                    <p className="text-sm font-bold text-foreground">
                      {formatCurrency(item.bestPrice.valorUnitario)}/un
                    </p>
                    <div className="flex items-center gap-1.5 mt-1.5 text-muted-foreground">
                      <Building2 className="h-3 w-3 flex-shrink-0" />
                      <p className="text-[10px] font-medium truncate">
                        {item.bestPrice.supplierName}
                      </p>
                    </div>
                  </div>

                  {/* Worst Price */}
                  <div className="bg-red-50/50 dark:bg-red-900/10 rounded-lg p-3 border border-red-200/50 dark:border-red-800/30">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-red-600 dark:text-red-400 mb-1">
                      Pior Oferta
                    </p>
                    <p className="text-sm font-bold text-foreground opacity-80">
                      {formatCurrency(item.worstPrice.valorUnitario)}/un
                    </p>
                    <div className="flex items-center gap-1.5 mt-1.5 text-muted-foreground">
                      <Building2 className="h-3 w-3 flex-shrink-0" />
                      <p className="text-[10px] font-medium truncate opacity-80">
                        {item.worstPrice.supplierName}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-muted/20 rounded-lg p-3 border border-border/50">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                    Única Oferta
                  </p>
                  <p className="text-sm font-bold text-foreground">
                    {formatCurrency(item.bestPrice.valorUnitario)}/un
                  </p>
                  <div className="flex items-center gap-1.5 mt-1.5 text-muted-foreground">
                    <Building2 className="h-3 w-3 flex-shrink-0" />
                    <p className="text-[10px] font-medium truncate">
                      {item.bestPrice.supplierName}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
