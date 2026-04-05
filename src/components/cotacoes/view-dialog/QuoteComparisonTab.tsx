import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Package, Star, ShoppingCart, BarChart3, Building2, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Quote } from "./types";
import { normalizePrice, PriceMetadata } from "@/utils/priceNormalization";

interface QuoteComparisonTabProps {
    products: any[];
    currentQuote: Quote;
    bestSupplier: { id: string; nome: string; totalValue: number } | null;
    getSupplierProductValue: (supplierId: string, productId: string) => number;
    getBestPriceInfoForProduct: (productId: string) => { bestPrice: number; bestSupplierId: string | null };
    handleConvertToOrder: () => void;
    isUpdating: boolean;
    readOnly?: boolean;
    getNormalizedUnitPrice?: (supplierId: string, productId: string) => number;
    getNormalizedTotalPrice?: (supplierId: string, productId: string) => number;
    getSupplierItemPricingMetadata?: (supplierId: string, productId: string) => { unidadePreco: any; fatorConversao: number | null };
}

export function QuoteComparisonTab({
    products,
    currentQuote,
    bestSupplier,
    getSupplierProductValue,
    getBestPriceInfoForProduct,
    handleConvertToOrder,
    isUpdating,
    readOnly = false,
    getNormalizedUnitPrice,
    getNormalizedTotalPrice,
    getSupplierItemPricingMetadata
}: QuoteComparisonTabProps) {
    // Helper function to get normalized unit price with fallback
    const getNormalizedPrice = (supplierId: string, productId: string): number => {
        if (getNormalizedUnitPrice) {
            return getNormalizedUnitPrice(supplierId, productId);
        }
        // Fallback: return original value if normalized price function not provided
        return getSupplierProductValue(supplierId, productId);
    };

    // Helper function to get normalized total price with fallback
    const getNormalizedTotal = (supplierId: string, productId: string, quantity: number): number => {
        if (getNormalizedTotalPrice) {
            return getNormalizedTotalPrice(supplierId, productId);
        }
        // Fallback: value * quantity
        return getSupplierProductValue(supplierId, productId) * quantity;
    };

    // Helper function to get pricing metadata with fallback
    const getPricingMetadata = (supplierId: string, productId: string) => {
        if (getSupplierItemPricingMetadata) {
            return getSupplierItemPricingMetadata(supplierId, productId);
        }
        return { unidadePreco: null, fatorConversao: null };
    };

    // Helper to check if original unit differs from base unit
    const shouldShowOriginalUnit = (supplierId: string, productId: string): boolean => {
        const metadata = getPricingMetadata(supplierId, productId);
        if (!metadata.unidadePreco) return false;
        // Show original unit if it's not the base unit (kg or un)
        return metadata.unidadePreco === 'cx' || metadata.unidadePreco === 'pct';
    };
    return (
        <ScrollArea className="h-full">
            <div className="h-full flex flex-col p-2.5 sm:p-3">

                {/* Resumo Comparativo Superior */}
                {bestSupplier && (
                    <Card className="mb-2.5 border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950/50 rounded-lg shadow-sm dark:shadow-none">
                        <div className="p-2.5 sm:p-3">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
                                <div className="flex items-center gap-2">
                                    <div className="p-2 rounded-lg bg-gray-900 dark:bg-white text-white dark:text-gray-950 shadow-sm">
                                        <BarChart3 className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <h3 className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase mb-0.5">
                                            Melhor Opção
                                        </h3>
                                        <p className="font-bold text-sm text-gray-900 dark:text-white">
                                            {bestSupplier.nome}
                                        </p>
                                        <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
                                            Economia: <span className="font-semibold text-emerald-600 dark:text-emerald-400">{currentQuote?.economia || 'N/A'}</span>
                                        </p>
                                    </div>
                                </div>
                                <div className="text-center sm:text-right">
                                    <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium mb-0.5">Total</p>
                                    <p className="text-base font-bold text-gray-900 dark:text-white">
                                        R$ {bestSupplier.totalValue.toFixed(2)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </Card>
                )}

                {/* Tabela Comparativa - Foco Total */}
                <Card className="flex-1 overflow-hidden border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1C1F26] rounded-lg shadow-sm dark:shadow-none flex flex-col">
                    <ScrollArea className="flex-1">
                        <table className="w-full border-collapse min-w-max">
                            <thead className="sticky top-0 z-10 bg-gray-50/80 dark:bg-gray-900/95 backdrop-blur-sm">
                                <tr className="border-b border-gray-200 dark:border-gray-800">
                                    <th className="px-3 py-2 text-left bg-gray-50/80 dark:bg-gray-800/95 backdrop-blur-sm sticky left-0 z-20 shadow-sm">
                                        <div className="flex items-center gap-1.5">
                                            <Package className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500" />
                                            <span className="font-bold text-xs text-gray-900 dark:text-white">Produto</span>
                                        </div>
                                    </th>
                                    {currentQuote?.fornecedoresParticipantes.map(fornecedor => {
                                        const totalValue = products.reduce((sum: number, product: any) => {
                                            return sum + getNormalizedTotal(fornecedor.id, product.product_id, product.quantidade);
                                        }, 0);
                                        const isWinning = bestSupplier?.id === fornecedor.id;

                                        return (
                                            <th
                                                key={fornecedor.id}
                                                className={cn(
                                                    "px-2 py-2 text-center group relative",
                                                    currentQuote.fornecedoresParticipantes.length > 5 ? "min-w-[100px] max-w-[120px]" : "min-w-[120px]",
                                                    isWinning
                                                        ? "bg-emerald-50/50 dark:bg-emerald-900/20 border-l border-r border-emerald-100 dark:border-emerald-800"
                                                        : "bg-gray-50/80 dark:bg-gray-900"
                                                )}
                                                title={`Total: R$ ${totalValue.toFixed(2)}`}
                                            >
                                                <div className="flex items-center justify-center gap-1 mb-0.5">
                                                    <Building2 className={cn(
                                                        "h-3 w-3 flex-shrink-0",
                                                        isWinning ? "text-emerald-600 dark:text-emerald-400" : "text-gray-400 dark:text-gray-500"
                                                    )} />
                                                    {isWinning && <Star className="h-2.5 w-2.5 text-emerald-600 dark:text-emerald-400 fill-current flex-shrink-0" />}
                                                </div>
                                                <p className={cn(
                                                    "font-bold truncate",
                                                    currentQuote.fornecedoresParticipantes.length > 5 ? "text-[10px]" : "text-xs",
                                                    isWinning ? "text-emerald-700 dark:text-emerald-300" : "text-gray-900 dark:text-white"
                                                )} title={fornecedor.nome}>
                                                    {fornecedor.nome}
                                                </p>
                                                <div className={cn(
                                                    "mt-0.5 text-[9px] font-medium",
                                                    isWinning ? "text-emerald-600 dark:text-emerald-400" : "text-gray-500 dark:text-gray-400"
                                                )}>
                                                    R$ {totalValue.toFixed(2)}
                                                </div>
                                            </th>
                                        );
                                    })}
                                </tr>
                            </thead>
                            <tbody>
                                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                {products.map((product: any, index: number) => {
                                    const { bestPrice, bestSupplierId } = getBestPriceInfoForProduct(product.product_id);

                                    return (
                                        <tr key={product.product_id} className={cn(
                                            "border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors",
                                            index % 2 === 0 ? "bg-white dark:bg-gray-900" : "bg-gray-50/30 dark:bg-gray-800/30"
                                        )}>
                                            <td className="px-3 py-2 bg-gray-50/30 dark:bg-gray-800/80 sticky left-0 z-10 shadow-sm border-r border-gray-100 dark:border-gray-800">
                                                <p className="font-bold text-xs text-gray-900 dark:text-white truncate max-w-[200px]" title={product.product_name}>
                                                    {product.product_name}
                                                </p>
                                                <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 font-medium">
                                                    {product.quantidade} {product.unidade}
                                                </p>
                                            </td>
                                            {currentQuote.fornecedoresParticipantes.map(fornecedor => {
                                                const originalValue = getSupplierProductValue(fornecedor.id, product.product_id);
                                                const normalizedUnitPrice = getNormalizedPrice(fornecedor.id, product.product_id);
                                                const isBestPrice = fornecedor.id === bestSupplierId;
                                                const isWinning = bestSupplier?.id === fornecedor.id;
                                                const showOriginalUnit = shouldShowOriginalUnit(fornecedor.id, product.product_id);
                                                const metadata = getPricingMetadata(fornecedor.id, product.product_id);

                                                // Calcular economia usando preços normalizados
                                                const allNormalizedPrices = currentQuote.fornecedoresParticipantes
                                                    .map(f => getNormalizedPrice(f.id, product.product_id))
                                                    .filter(v => v > 0);
                                                const maxNormalizedPrice = allNormalizedPrices.length > 0 ? Math.max(...allNormalizedPrices) : 0;
                                                const economia = maxNormalizedPrice > 0 && normalizedUnitPrice > 0 
                                                    ? (maxNormalizedPrice - normalizedUnitPrice) * product.quantidade 
                                                    : 0;

                                                return (
                                                    <td key={fornecedor.id} className={cn(
                                                        "py-2 text-center",
                                                        (currentQuote?.fornecedoresParticipantes.length ?? 0) > 5 ? "px-1.5" : "px-2",
                                                        isBestPrice && "bg-emerald-50/30 dark:bg-emerald-900/20",
                                                        isWinning && "border-l border-r border-emerald-100/50 dark:border-emerald-800/50"
                                                    )}>
                                                        {originalValue > 0 ? (
                                                            <div className="flex flex-col items-center gap-0.5">
                                                                <TooltipProvider>
                                                                    <Tooltip>
                                                                        <TooltipTrigger asChild>
                                                                            <div className={cn(
                                                                                "rounded-md font-bold inline-flex items-center justify-center gap-0.5 px-2 py-1 shadow-sm transition-all cursor-help",
                                                                                (currentQuote?.fornecedoresParticipantes.length ?? 0) > 5
                                                                                    ? "text-[10px] min-w-[75px]"
                                                                                    : "text-xs min-w-[85px]",
                                                                                isBestPrice
                                                                                    ? "bg-emerald-600 dark:bg-emerald-600 text-white ring-1 ring-emerald-200 dark:ring-emerald-800"
                                                                                    : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700"
                                                            )}>
                                                                                {isBestPrice && <TrendingDown className="h-2.5 w-2.5 flex-shrink-0" />}
                                                                                <span className="whitespace-nowrap">R$ {normalizedUnitPrice.toFixed(2)}</span>
                                                                            </div>
                                                                        </TooltipTrigger>
                                                                        <TooltipContent>
                                                                            <div className="text-xs space-y-1">
                                                                                <p><strong>Preço normalizado:</strong> R$ {normalizedUnitPrice.toFixed(2)}/un</p>
                                                                                {showOriginalUnit && (
                                                                                    <p><strong>Preço original:</strong> R$ {originalValue.toFixed(2)}/{metadata.unidadePreco}</p>
                                                                                )}
                                                                                <p><strong>Total:</strong> R$ {(normalizedUnitPrice * product.quantidade).toFixed(2)}</p>
                                                                            </div>
                                                                        </TooltipContent>
                                                                    </Tooltip>
                                                                </TooltipProvider>
                                                                {showOriginalUnit && (
                                                                    <span className="text-[8px] text-gray-400 dark:text-gray-500">
                                                                        orig: R$ {originalValue.toFixed(2)}/{metadata.unidadePreco}
                                                                    </span>
                                                                )}
                                                                {isBestPrice && economia > 0 && (
                                                                    <Badge className="bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 text-[9px] h-4 px-1 font-semibold">
                                                                        Eco: R$ {economia.toFixed(2)}
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <div className="text-gray-300 dark:text-gray-800">
                                                                <Minus className="h-3 w-3 mx-auto" />
                                                            </div>
                                                        )}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </ScrollArea>

                    {/* Rodapé com Ação de Converter */}
                    {bestSupplier && currentQuote.status !== 'finalizada' && !readOnly && (
                        <div className="flex-shrink-0 p-2.5 sm:p-3 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
                                <div className="flex items-center gap-2">
                                    <div className="p-2 rounded-lg bg-gray-900 dark:bg-white text-white dark:text-gray-950 shadow-sm">
                                        <Star className="h-3.5 w-3.5 fill-current" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-gray-900 dark:text-white">
                                            Melhor: <span className="text-emerald-600 dark:text-emerald-400">{bestSupplier.nome}</span>
                                        </p>
                                        <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
                                            R$ {bestSupplier.totalValue.toFixed(2)} • Eco: <span className="font-semibold text-emerald-600 dark:text-emerald-400">{currentQuote?.economia || 'N/A'}</span>
                                        </p>
                                    </div>
                                </div>
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                onClick={handleConvertToOrder}
                                                disabled={isUpdating}
                                                size="sm"
                                                className="w-full sm:w-auto bg-gray-900 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-200 text-white dark:text-gray-950 font-semibold text-xs shadow-sm transition-all h-8"
                                            >
                                                <ShoppingCart className="h-3.5 w-3.5 mr-1.5" />
                                                Converter
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>Converter cotação em pedido</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </div>
                        </div>
                    )}
                </Card>
            </div>
        </ScrollArea>
    );
}
