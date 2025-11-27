import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DollarSign, Package, Edit2, Save, X, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { PriceConverter } from "@/components/forms/PriceConverter";
import { Quote } from "./types";

interface QuoteValuesTabProps {
    products: any[];
    currentQuote: Quote;
    selectedSupplier: string;
    setSelectedSupplier: (id: string) => void;
    getCurrentProductValue: (supplierId: string, productId: string) => number;
    editingProductId: string | null;
    editedValues: Record<string, number>;
    setEditedValues: React.Dispatch<React.SetStateAction<Record<string, number>>>;
    handleStartEdit: (productId: string, currentValue: number) => void;
    handleSaveEdit: (productId: string) => void;
    handleCancelEdit: () => void;
    editInputRef: React.RefObject<HTMLInputElement>;
    getBestPriceInfoForProduct: (productId: string) => { bestPrice: number; bestSupplierId: string | null };
    readOnly?: boolean;
}

export function QuoteValuesTab({
    products,
    currentQuote,
    selectedSupplier,
    setSelectedSupplier,
    getCurrentProductValue,
    editingProductId,
    editedValues,
    setEditedValues,
    handleStartEdit,
    handleSaveEdit,
    handleCancelEdit,
    editInputRef,
    getBestPriceInfoForProduct,
    readOnly = false
}: QuoteValuesTabProps) {
    return (
        <div className="h-full flex flex-col">
            {/* Seletor de Fornecedor */}
            <div className="p-2.5 border-b border-gray-200/60 dark:border-gray-700/50 bg-gray-50/50 dark:bg-[#1C1F26] flex-shrink-0">
                <ScrollArea className="w-full whitespace-nowrap pb-2">
                    <div className="flex gap-2 px-1">
                        {currentQuote.fornecedoresParticipantes.map((fornecedor) => (
                            <button
                                key={fornecedor.id}
                                onClick={() => setSelectedSupplier(fornecedor.id)}
                                className={cn(
                                    "flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all text-xs font-medium",
                                    selectedSupplier === fornecedor.id
                                        ? "bg-emerald-100 border-emerald-200 text-emerald-800 dark:bg-emerald-900/30 dark:border-emerald-800 dark:text-emerald-300 shadow-sm"
                                        : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700"
                                )}
                            >
                                <div className={cn(
                                    "w-2 h-2 rounded-full",
                                    fornecedor.status === 'respondido' ? "bg-emerald-500" : "bg-amber-500"
                                )} />
                                {fornecedor.nome}
                            </button>
                        ))}
                    </div>
                </ScrollArea>
            </div>

            {/* Tabela de Produtos */}
            <div className="flex-1 overflow-hidden flex flex-col min-h-0 bg-gray-50/30 dark:bg-[#151820]">
                {selectedSupplier && (
                    <ScrollArea className="flex-1">
                        <div className="p-2.5 sm:p-3">
                            <div className="max-w-4xl mx-auto">
                                <Card className="border border-gray-200/80 dark:border-gray-700/60 bg-white dark:bg-[#1C1F26] shadow-sm dark:shadow-none overflow-hidden rounded-lg">
                                    <div className="p-2.5 border-b border-gray-200/60 dark:border-gray-700/50 bg-success/5 dark:bg-[#1C1F26] flex items-center justify-between flex-shrink-0">
                                        <div className="flex items-center gap-2">
                                            <div className="p-1.5 rounded-lg bg-emerald-600 dark:bg-gray-700 text-white">
                                                <DollarSign className="h-3.5 w-3.5" />
                                            </div>
                                            <div>
                                                <h3 className="text-xs font-bold text-gray-900 dark:text-white truncate max-w-[180px]">
                                                    {currentQuote.fornecedoresParticipantes.find(f => f.id === selectedSupplier)?.nome}
                                                </h3>
                                                <p className="text-[10px] text-gray-600 dark:text-gray-400">Valores dos produtos</p>
                                            </div>
                                        </div>
                                        <Badge className="bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 text-[10px] font-semibold">
                                            {products.length}
                                        </Badge>
                                    </div>
                                    <ScrollArea className="flex-1">
                                        <div>
                                            <table className="w-full">
                                                <thead className="bg-slate-50 dark:bg-gray-800/50 border-b border-slate-200 dark:border-gray-700">
                                                    <tr>
                                                        <th className="px-3 py-2 text-left text-xs font-semibold text-slate-700 dark:text-gray-300">
                                                            <div className="flex items-center gap-1">
                                                                <Package className="h-3 w-3" />
                                                                <span className="hidden sm:inline">Produto</span>
                                                            </div>
                                                        </th>
                                                        <th className="px-3 py-2 text-left text-xs font-semibold text-slate-700 dark:text-gray-300">
                                                            <div className="flex items-center gap-1">
                                                                <Package className="h-3 w-3" />
                                                                <span className="hidden sm:inline">Qtd</span>
                                                            </div>
                                                        </th>
                                                        <th className="px-3 py-2 text-left text-xs font-semibold text-slate-700 dark:text-gray-300">
                                                            <div className="flex items-center gap-1">
                                                                <DollarSign className="h-3 w-3" />
                                                                <span className="hidden sm:inline">Valor</span>
                                                            </div>
                                                        </th>
                                                        <th className="px-3 py-2 text-center text-xs font-semibold text-slate-700 dark:text-gray-300">
                                                            <Edit2 className="h-3 w-3 mx-auto" />
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100 dark:divide-gray-700">
                                                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                                    {products.map((product: any) => {
                                                        const currentValue = getCurrentProductValue(selectedSupplier, product.product_id);
                                                        const isEditing = editingProductId === product.product_id;
                                                        const { bestPrice, bestSupplierId } = getBestPriceInfoForProduct(product.product_id);
                                                        const isBestPrice = currentValue > 0 && selectedSupplier === bestSupplierId;

                                                        return (
                                                            <tr key={product.product_id} className={cn(
                                                                "hover:bg-slate-50 dark:hover:bg-gray-700/50 transition-colors",
                                                                isBestPrice && "bg-emerald-50 dark:bg-emerald-900/20"
                                                            )}>
                                                                <td className="px-2 py-1.5">
                                                                    <p className="font-semibold text-xs text-slate-900 dark:text-white truncate" title={product.product_name}>
                                                                        {product.product_name}
                                                                    </p>
                                                                </td>
                                                                <td className="px-2 py-1.5">
                                                                    <div className="flex items-center gap-1">
                                                                        <span className="font-medium text-xs text-slate-700 dark:text-gray-300">{product.quantidade}</span>
                                                                        <span className="text-[10px] text-slate-500 dark:text-gray-400">{product.unidade}</span>
                                                                    </div>
                                                                </td>
                                                                <td className="px-2 py-2">
                                                                    {isEditing ? (
                                                                        <div className="flex items-center gap-1.5">
                                                                            <Input
                                                                                ref={editInputRef}
                                                                                type="number"
                                                                                value={editedValues[product.product_id] || 0}
                                                                                onChange={(e) => setEditedValues(prev => ({
                                                                                    ...prev,
                                                                                    [product.product_id]: Number(e.target.value)
                                                                                }))}
                                                                                onKeyDown={(e) => {
                                                                                    if (e.key === 'Enter') {
                                                                                        handleSaveEdit(product.product_id);
                                                                                    } else if (e.key === 'Escape') {
                                                                                        handleCancelEdit();
                                                                                    }
                                                                                }}
                                                                                className="w-28 h-8 rounded-md border-2 border-emerald-300 dark:border-emerald-700 dark:bg-gray-900 dark:text-white focus:border-emerald-500 dark:focus:border-emerald-400 focus:ring-1 focus:ring-emerald-200 dark:focus:ring-emerald-800 text-xs font-semibold transition-all"
                                                                                step="0.01"
                                                                                min="0"
                                                                                placeholder="0.00"
                                                                            />
                                                                            <PriceConverter
                                                                                currentValue={editedValues[product.product_id] || currentValue}
                                                                                productQuantity={product.quantidade}
                                                                                productUnit={product.unidade}
                                                                                onConvert={(convertedValue) => {
                                                                                    setEditedValues(prev => ({
                                                                                        ...prev,
                                                                                        [product.product_id]: convertedValue
                                                                                    }));
                                                                                    // Focar no input após converter
                                                                                    setTimeout(() => {
                                                                                        editInputRef.current?.focus();
                                                                                        editInputRef.current?.select();
                                                                                    }, 100);
                                                                                }}
                                                                            />
                                                                            <div className="flex gap-0.5">
                                                                                <Button
                                                                                    size="sm"
                                                                                    onClick={() => handleSaveEdit(product.product_id)}
                                                                                    className="bg-emerald-600 dark:bg-gray-700 hover:bg-emerald-700 dark:hover:bg-emerald-600 text-white h-8 w-8 p-0 shadow-sm"
                                                                                >
                                                                                    <Save className="h-3.5 w-3.5" />
                                                                                </Button>
                                                                                <Button
                                                                                    size="sm"
                                                                                    variant="outline"
                                                                                    onClick={handleCancelEdit}
                                                                                    className="border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 h-8 w-8 p-0"
                                                                                >
                                                                                    <X className="h-3.5 w-3.5" />
                                                                                </Button>
                                                                            </div>
                                                                        </div>
                                                                    ) : (
                                                                        <div className="flex items-center gap-1.5">
                                                                            <span className={cn(
                                                                                "font-bold text-xs px-2 py-1 rounded-md",
                                                                                isBestPrice
                                                                                    ? "text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800"
                                                                                    : "text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600"
                                                                            )}>
                                                                                R$ {currentValue.toFixed(2)}
                                                                            </span>
                                                                            {isBestPrice && (
                                                                                <Badge className="bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 text-[9px] font-semibold h-4 px-1">
                                                                                    <TrendingDown className="h-2.5 w-2.5 mr-0.5" />
                                                                                    Melhor
                                                                                </Badge>
                                                                            )}
                                                                        </div>
                                                                    )}
                                                                </td>
                                                                <td className="px-3 py-2.5 text-center">
                                                                    {!isEditing && (
                                                                        <Button
                                                                            size="sm"
                                                                            variant="ghost"
                                                                            onClick={() => handleStartEdit(product.product_id, currentValue)}
                                                                            disabled={currentQuote.status === "concluida" || readOnly}
                                                                            className={cn(
                                                                                "h-9 w-9 p-0 rounded-lg transition-all",
                                                                                currentQuote.status === "concluida" || readOnly
                                                                                    ? "text-gray-400 dark:text-gray-600 cursor-not-allowed"
                                                                                    : "text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 hover:scale-110"
                                                                            )}
                                                                            title={currentQuote.status === "concluida" ? "Cotação finalizada" : "Editar valor"}
                                                                        >
                                                                            <Edit2 className="h-4 w-4" />
                                                                        </Button>
                                                                    )}
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    </ScrollArea>
                                </Card>
                            </div>
                        </div>
                    </ScrollArea>
                )}
            </div>
        </div>
    );
}
