import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingDown, Package, ArrowUpDown, AlertCircle, CheckCircle2 } from "lucide-react";
import { normalizePrice, calculateEconomy, PriceMetadata } from "@/utils/priceNormalization";
import { Quote } from "./types";
import { useState } from "react";

interface ProductEconomyItem {
  productId: string;
  productName: string;
  purchaseQuantity: number;
  purchaseUnit: string;
  quantidadePorCaixa: number | null;
  bestPrice: {
    supplierId: string;
    supplierName: string;
    valorUnitario: number;
    valorTotal: number;
  };
  worstPrice: {
    supplierId: string;
    supplierName: string;
    valorUnitario: number;
    valorTotal: number;
  };
  economiaReal: number;
  hasMultipleSuppliers: boolean;
  isBoxUnit: boolean;
}

interface ProductEconomyBreakdownProps {
  currentQuote: Quote;
  products: any[];
  getSupplierProductValue: (supplierId: string, productId: string) => number;
  getSupplierItemPricingMetadata: (
    supplierId: string,
    productId: string
  ) => {
    unidadePreco: import("@/utils/priceNormalization").PricingUnit | null;
    fatorConversao: number | null;
    quantidadePorEmbalagem?: number | null;
  };
}

/**
 * ProductEconomyBreakdown Component
 * 
 * Displays economy per product in finalized quotes
 * Shows product name, best price, worst price, and savings amount
 * Handles single-supplier case with "N/A"
 * Allows sorting by product name or economy amount (highest to lowest)
 * 
 * When the product is quoted by box (CX):
 * - If quantidade_por_caixa is known: shows total economy (unit × qty/box × boxes)
 * - If NOT known: shows "R$ X,XX /un na cx" with a warning indicator
 * 
 * Requirements: 6.1, 6.2, 6.3, 6.4
 */
export function ProductEconomyBreakdown({
  currentQuote,
  products,
  getSupplierProductValue,
  getSupplierItemPricingMetadata,
}: ProductEconomyBreakdownProps) {
  const [sortBy, setSortBy] = useState<"name" | "economy">("economy");

  // Helper to detect if a unit is a box type
  const isBoxType = (unit: string): boolean => {
    return unit?.toUpperCase().startsWith('CX');
  };

  // Helper to get the best quantidade_por_embalagem value from all suppliers
  const getBestQuantidadePorCaixa = (productId: string): number | null => {
    let bestQtd: number | null = null;
    
    for (const supplier of currentQuote.fornecedoresParticipantes) {
      const metadata = getSupplierItemPricingMetadata(supplier.id, productId);
      const qtd = metadata.quantidadePorEmbalagem;
      if (qtd && qtd > 0) {
        // Take the first valid value found (manual entry takes priority in the data layer)
        if (bestQtd === null) bestQtd = qtd;
      }
    }
    
    return bestQtd;
  };

  // Calculate economy for each product
  const calculateProductEconomies = (): ProductEconomyItem[] => {
    return products
      .map((product) => {
        const productId = product.product_id;
        const productName = product.product_name;
        const purchaseQuantity = product.quantidade;
        const purchaseUnit = product.unidade;
        const isBox = isBoxType(purchaseUnit);
        const quantidadePorCaixa = isBox ? getBestQuantidadePorCaixa(productId) : null;

        // Get all supplier prices for this product
        const supplierPrices: Array<{
          supplierId: string;
          supplierName: string;
          priceMetadata: PriceMetadata;
        }> = currentQuote.fornecedoresParticipantes
          .map((supplier) => {
            const valor = getSupplierProductValue(supplier.id, productId);
            const metadata = getSupplierItemPricingMetadata(supplier.id, productId);

            if (!valor || valor <= 0) {
              return null;
            }

            return {
              supplierId: supplier.id,
              supplierName: supplier.nome,
              priceMetadata: {
                valorOferecido: valor,
                unidadePreco: metadata.unidadePreco || "un",
                fatorConversao: metadata.fatorConversao || undefined,
                quantidadePorEmbalagem: metadata.quantidadePorEmbalagem || undefined,
              },
            };
          })
          .filter(Boolean) as Array<{
            supplierId: string;
            supplierName: string;
            priceMetadata: PriceMetadata;
          }>;

        // If less than 2 suppliers, return N/A
        if (supplierPrices.length < 2) {
          const singleSupplier = supplierPrices[0];
          if (singleSupplier) {
            const normalized = normalizePrice(
              singleSupplier.priceMetadata,
              purchaseQuantity,
              purchaseUnit
            );
            return {
              productId,
              productName,
              purchaseQuantity,
              purchaseUnit,
              quantidadePorCaixa,
              bestPrice: {
                supplierId: singleSupplier.supplierId,
                supplierName: singleSupplier.supplierName,
                valorUnitario: normalized.valorUnitario,
                valorTotal: normalized.valorTotal,
              },
              worstPrice: {
                supplierId: singleSupplier.supplierId,
                supplierName: singleSupplier.supplierName,
                valorUnitario: normalized.valorUnitario,
                valorTotal: normalized.valorTotal,
              },
              economiaReal: 0,
              hasMultipleSuppliers: false,
              isBoxUnit: isBox,
            };
          }
          return null;
        }

        // Calculate economy
        const economy = calculateEconomy(
          supplierPrices.map((sp) => sp.priceMetadata),
          purchaseQuantity,
          purchaseUnit
        );

        // Find best and worst price suppliers
        const normalizedPrices = supplierPrices.map((sp) => ({
          ...sp,
          normalized: normalizePrice(
            sp.priceMetadata,
            purchaseQuantity,
            purchaseUnit
          ),
        }));

        const bestSupplier = normalizedPrices.reduce((prev, current) =>
          current.normalized.valorUnitario < prev.normalized.valorUnitario
            ? current
            : prev
        );

        const worstSupplier = normalizedPrices.reduce((prev, current) =>
          current.normalized.valorUnitario > prev.normalized.valorUnitario
            ? current
            : prev
        );

        return {
          productId,
          productName,
          purchaseQuantity,
          purchaseUnit,
          quantidadePorCaixa,
          bestPrice: {
            supplierId: bestSupplier.supplierId,
            supplierName: bestSupplier.supplierName,
            valorUnitario: bestSupplier.normalized.valorUnitario,
            valorTotal: bestSupplier.normalized.valorTotal,
          },
          worstPrice: {
            supplierId: worstSupplier.supplierId,
            supplierName: worstSupplier.supplierName,
            valorUnitario: worstSupplier.normalized.valorUnitario,
            valorTotal: worstSupplier.normalized.valorTotal,
          },
          economiaReal: economy.economiaReal,
          hasMultipleSuppliers: true,
          isBoxUnit: isBox,
        };
      })
      .filter(Boolean) as ProductEconomyItem[];
  };

  const economies = calculateProductEconomies();

  // Sort products
  const sortedEconomies = [...economies].sort((a, b) => {
    if (sortBy === "economy") {
      return b.economiaReal - a.economiaReal;
    }
    return a.productName.localeCompare(b.productName);
  });

  // Calculate total economy - only count items where we can calculate the real total
  const totalEconomy = economies.reduce((sum, item) => sum + item.economiaReal, 0);
  const hasPartialEconomies = economies.some(item => item.isBoxUnit && !item.quantidadePorCaixa && item.economiaReal > 0);

  if (economies.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[300px] space-y-4">
        <Package className="h-12 w-12 text-gray-300 dark:text-gray-600" />
        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
          Nenhum produto com múltiplos fornecedores
        </p>
      </div>
    );
  }

  /**
   * Renders the economy badge for a product.
   * - If box unit WITHOUT qty/box: shows "R$ X,XX /un na cx" with yellow indicator
   * - If box unit WITH qty/box: shows total economy with green indicator
   * - If regular unit: shows economy normally
   */
  const renderEconomyBadge = (item: ProductEconomyItem) => {
    if (!item.hasMultipleSuppliers) {
      return (
        <Badge variant="outline" className="flex-shrink-0">
          N/A
        </Badge>
      );
    }

    // Box unit without quantity info - show unit economy + warning
    if (item.isBoxUnit && !item.quantidadePorCaixa) {
      const unitEconomy = item.worstPrice.valorUnitario - item.bestPrice.valorUnitario;
      const baseUnit = item.purchaseUnit?.toLowerCase().includes('kg') ? 'kg' : 'un';
      return (
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <Badge className="bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-700">
            R$ {unitEconomy.toFixed(2)} /{baseUnit} na cx
          </Badge>
          <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" title="Qtd/cx não informada" />
        </div>
      );
    }

    // Box unit WITH quantity info - show total economy (already adjusted in economiaReal)
    if (item.isBoxUnit && item.quantidadePorCaixa) {
      return (
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <Badge className="bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300">
            R$ {item.economiaReal.toFixed(2)}
          </Badge>
          <div className="w-2 h-2 rounded-full bg-green-500" title="Economia total confirmada" />
        </div>
      );
    }

    // Regular unit - show as-is
    return (
      <Badge className="bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 flex-shrink-0">
        R$ {item.economiaReal.toFixed(2)}
      </Badge>
    );
  };

  /**
   * Renders the detailed economy breakdown for box items
   */
  const renderBoxEconomyDetail = (item: ProductEconomyItem) => {
    if (!item.isBoxUnit || !item.hasMultipleSuppliers) return null;

    const unitEconomy = item.worstPrice.valorUnitario - item.bestPrice.valorUnitario;
    const baseUnit = item.purchaseUnit?.toLowerCase().includes('kg') ? 'kg' : 'un';

    if (item.quantidadePorCaixa) {
      return (
        <div className="mt-2 p-2.5 bg-green-50/50 dark:bg-green-900/10 rounded-lg border border-green-200/50 dark:border-green-800/30 flex items-center gap-2">
          <CheckCircle2 className="h-3.5 w-3.5 text-green-600 dark:text-green-400 flex-shrink-0" />
          <p className="text-[10px] font-bold text-green-700 dark:text-green-400 leading-tight">
            Economia: R$ {unitEconomy.toFixed(2)}/{baseUnit} × {item.quantidadePorCaixa} {baseUnit}/cx × {item.purchaseQuantity} cx = <span className="font-black">R$ {item.economiaReal.toFixed(2)}</span>
          </p>
        </div>
      );
    }

    return (
      <div className="mt-2 p-2.5 bg-amber-50/50 dark:bg-amber-900/10 rounded-lg border border-amber-200/50 dark:border-amber-800/30 flex items-center gap-2">
        <AlertCircle className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
        <p className="text-[10px] font-bold text-amber-700 dark:text-amber-400 leading-tight">
          Economia de R$ {unitEconomy.toFixed(2)} /{baseUnit} na cx — <span className="italic font-medium">Qtd por caixa não informada</span>
        </p>
      </div>
    );
  };

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
                Economia Total
              </p>
              <p className="text-lg font-bold text-green-600 dark:text-green-400">
                R$ {totalEconomy.toFixed(2)}
              </p>
              {hasPartialEconomies && (
                <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1 mt-0.5">
                  <AlertCircle className="h-3 w-3" />
                  Alguns itens estão com economia parcial (qtd/cx não informada)
                </p>
              )}
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
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
          Ordenar por:
        </span>
        <div className="flex gap-2">
          <Button
            variant={sortBy === "economy" ? "default" : "outline"}
            size="sm"
            onClick={() => setSortBy("economy")}
            className="text-xs h-8"
          >
            <ArrowUpDown className="h-3 w-3 mr-1" />
            Economia
          </Button>
          <Button
            variant={sortBy === "name" ? "default" : "outline"}
            size="sm"
            onClick={() => setSortBy("name")}
            className="text-xs h-8"
          >
            <ArrowUpDown className="h-3 w-3 mr-1" />
            Nome
          </Button>
        </div>
      </div>

      {/* Products List */}
      <div className="space-y-3">
        {sortedEconomies.map((item) => (
          <Card
            key={item.productId}
            className="border border-gray-200 dark:border-gray-700"
          >
            <div className="p-4 space-y-3">
              {/* Product Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-gray-900 dark:text-white truncate">
                    {item.productName}
                  </h4>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Quantidade: {item.purchaseQuantity} {item.purchaseUnit}
                    </p>
                    {item.isBoxUnit && item.quantidadePorCaixa && (
                      <Badge variant="outline" className="h-4 text-[9px] font-bold px-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700">
                        {item.quantidadePorCaixa} un/cx
                      </Badge>
                    )}
                  </div>
                </div>
                {renderEconomyBadge(item)}
              </div>

              {/* Prices Comparison */}
              {item.hasMultipleSuppliers ? (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    {/* Best Price */}
                    <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 border border-green-200 dark:border-green-800/50">
                      <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                        Melhor Preço
                      </p>
                      <p className="text-sm font-bold text-green-600 dark:text-green-400">
                        R$ {item.bestPrice.valorUnitario.toFixed(2)}/un
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {item.bestPrice.supplierName}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Total: R$ {item.bestPrice.valorTotal.toFixed(2)}
                      </p>
                    </div>

                    {/* Worst Price */}
                    <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3 border border-red-200 dark:border-red-800/50">
                      <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                        Pior Preço
                      </p>
                      <p className="text-sm font-bold text-red-600 dark:text-red-400">
                        R$ {item.worstPrice.valorUnitario.toFixed(2)}/un
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {item.worstPrice.supplierName}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Total: R$ {item.worstPrice.valorTotal.toFixed(2)}
                      </p>
                    </div>
                  </div>

                  {/* Box economy detail */}
                  {renderBoxEconomyDetail(item)}
                </>
              ) : (
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Preço Único
                  </p>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">
                    R$ {item.bestPrice.valorUnitario.toFixed(2)}/un
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {item.bestPrice.supplierName}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Total: R$ {item.bestPrice.valorTotal.toFixed(2)}
                  </p>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
