import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DollarSign, Package, Edit2, Save, X, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { PriceConverter, ConversionMetadata } from "@/components/forms/PriceConverter";
import { Quote } from "./types";
import { PricingUnit } from "@/utils/priceNormalization";

// Pricing unit options for the selector - Requirements: 1.1
const PRICING_UNIT_OPTIONS: { value: PricingUnit; label: string }[] = [
  { value: "kg", label: "por kg" },
  { value: "un", label: "por unidade" },
  { value: "cx", label: "por caixa" },
  { value: "pct", label: "por pacote" },
];

interface QuoteValuesTabProps {
  products: any[];
  currentQuote: Quote;
  selectedSupplier: string;
  setSelectedSupplier: (id: string) => void;
  getCurrentProductValue: (supplierId: string, productId: string) => number;
  getSupplierItemPricingMetadata?: (
    supplierId: string,
    productId: string
  ) => { unidadePreco: PricingUnit | null; fatorConversao: number | null };
  editingProductId: string | null;
  editedValues: Record<string, number>;
  setEditedValues: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  editedPricingMetadata?: Record<
    string,
    { unidadePreco: PricingUnit; fatorConversao?: number }
  >;
  setEditedPricingMetadata?: React.Dispatch<
    React.SetStateAction<
      Record<string, { unidadePreco: PricingUnit; fatorConversao?: number }>
    >
  >;
  handleStartEdit: (
    productId: string,
    currentValue: number,
    currentMetadata?: {
      unidadePreco: PricingUnit | null;
      fatorConversao: number | null;
    }
  ) => void;
  handleSaveEdit: (productId: string) => void;
  handleCancelEdit: () => void;
  editInputRef: React.RefObject<HTMLInputElement>;
  getBestPriceInfoForProduct: (productId: string) => {
    bestPrice: number;
    bestSupplierId: string | null;
  };
  readOnly?: boolean;
}

export function QuoteValuesTab({
  products,
  currentQuote,
  selectedSupplier,
  setSelectedSupplier,
  getCurrentProductValue,
  getSupplierItemPricingMetadata,
  editingProductId,
  editedValues,
  setEditedValues,
  editedPricingMetadata = {},
  setEditedPricingMetadata,
  handleStartEdit,
  handleSaveEdit,
  handleCancelEdit,
  editInputRef,
  getBestPriceInfoForProduct,
  readOnly = false,
}: QuoteValuesTabProps) {
  // Helper to get current pricing unit for display - Requirements: 1.4
  const getCurrentPricingUnit = (productId: string): PricingUnit => {
    if (editedPricingMetadata[productId]?.unidadePreco) {
      return editedPricingMetadata[productId].unidadePreco;
    }
    if (getSupplierItemPricingMetadata && selectedSupplier) {
      const metadata = getSupplierItemPricingMetadata(selectedSupplier, productId);
      if (metadata?.unidadePreco) {
        return metadata.unidadePreco;
      }
    }
    return "un";
  };

  // Helper to format price with unit label - Requirements: 1.4, 3.4
  const formatPriceWithUnit = (value: number, productId: string): string => {
    const unit = getCurrentPricingUnit(productId);
    const unitLabel =
      PRICING_UNIT_OPTIONS.find((o) => o.value === unit)?.label.replace(
        "por ",
        "/"
      ) || "/un";
    return `R$ ${value.toFixed(2)}${unitLabel}`;
  };

  // Check if conversion factor is required (for cx or pct) - Requirements: 1.5
  const isConversionFactorRequired = (productId: string): boolean => {
    const unit =
      editedPricingMetadata[productId]?.unidadePreco ||
      getCurrentPricingUnit(productId);
    return unit === "cx" || unit === "pct";
  };
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
                            <div className="flex flex-col gap-2">
                              {/* Row 1: Value input, pricing unit selector, and PriceConverter */}
                              <div className="flex items-center gap-1.5">
                                <Input
                                  ref={editInputRef}
                                  type="number"
                                  value={editedValues[product.product_id] || 0}
                                  onChange={(e) =>
                                    setEditedValues((prev) => ({
                                      ...prev,
                                      [product.product_id]: Number(e.target.value),
                                    }))
                                  }
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      handleSaveEdit(product.product_id);
                                    } else if (e.key === "Escape") {
                                      handleCancelEdit();
                                    }
                                  }}
                                  className="w-24 h-8 rounded-md border-2 border-emerald-300 dark:border-emerald-700 dark:bg-gray-900 dark:text-white focus:border-emerald-500 dark:focus:border-emerald-400 focus:ring-1 focus:ring-emerald-200 dark:focus:ring-emerald-800 text-xs font-semibold transition-all"
                                  step="0.01"
                                  min="0"
                                  placeholder="0.00"
                                />
                                {/* Pricing Unit Selector - Requirements: 1.1 */}
                                {setEditedPricingMetadata && (
                                  <Select
                                    value={
                                      editedPricingMetadata[product.product_id]
                                        ?.unidadePreco ||
                                      getCurrentPricingUnit(product.product_id)
                                    }
                                    onValueChange={(value: PricingUnit) => {
                                      setEditedPricingMetadata((prev) => ({
                                        ...prev,
                                        [product.product_id]: {
                                          ...prev[product.product_id],
                                          unidadePreco: value,
                                          fatorConversao:
                                            value === "cx" || value === "pct"
                                              ? prev[product.product_id]?.fatorConversao
                                              : undefined,
                                        },
                                      }));
                                    }}
                                  >
                                    <SelectTrigger className="w-[100px] h-8 text-xs border-emerald-300 dark:border-emerald-700">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {PRICING_UNIT_OPTIONS.map((option) => (
                                        <SelectItem
                                          key={option.value}
                                          value={option.value}
                                          className="text-xs"
                                        >
                                          {option.label}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                )}
                                <PriceConverter
                                  currentValue={
                                    editedValues[product.product_id] || currentValue
                                  }
                                  productQuantity={product.quantidade}
                                  productUnit={product.unidade}
                                  onConvert={(metadata) => {
                                    // Auto-set pricing unit from PriceConverter result - Requirements: 4.1, 4.3
                                    // Auto-set conversion factor from PriceConverter result - Requirements: 4.1, 4.2, 4.3
                                    setEditedValues((prev) => ({
                                      ...prev,
                                      [product.product_id]: metadata.convertedValue,
                                    }));
                                    if (setEditedPricingMetadata) {
                                      setEditedPricingMetadata((prev) => ({
                                        ...prev,
                                        [product.product_id]: {
                                          unidadePreco: metadata.targetUnit,
                                          fatorConversao: metadata.conversionFactor,
                                        },
                                      }));
                                    }
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
                                    disabled={
                                      isConversionFactorRequired(product.product_id) &&
                                      !editedPricingMetadata[product.product_id]
                                        ?.fatorConversao
                                    }
                                    className="bg-emerald-600 dark:bg-gray-700 hover:bg-emerald-700 dark:hover:bg-emerald-600 text-white h-8 w-8 p-0 shadow-sm disabled:opacity-50"
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
                              {/* Row 2: Conversion factor input (conditional) - Requirements: 1.2, 1.5 */}
                              {isConversionFactorRequired(product.product_id) &&
                                setEditedPricingMetadata && (
                                  <div className="flex items-center gap-1.5 pl-0.5">
                                    <span className="text-[10px] text-gray-500 dark:text-gray-400">
                                      Qtd por embalagem:
                                    </span>
                                    <Input
                                      type="number"
                                      value={
                                        editedPricingMetadata[product.product_id]
                                          ?.fatorConversao || ""
                                      }
                                      onChange={(e) => {
                                        const value = Number(e.target.value);
                                        setEditedPricingMetadata((prev) => ({
                                          ...prev,
                                          [product.product_id]: {
                                            ...prev[product.product_id],
                                            unidadePreco:
                                              prev[product.product_id]?.unidadePreco ||
                                              getCurrentPricingUnit(product.product_id),
                                            fatorConversao:
                                              value > 0 ? value : undefined,
                                          },
                                        }));
                                      }}
                                      className={cn(
                                        "w-20 h-7 text-xs rounded-md",
                                        !editedPricingMetadata[product.product_id]
                                          ?.fatorConversao
                                          ? "border-red-300 dark:border-red-700"
                                          : "border-gray-300 dark:border-gray-600"
                                      )}
                                      step="1"
                                      min="1"
                                      placeholder="Ex: 12"
                                    />
                                    <span className="text-[10px] text-gray-400">
                                      {editedPricingMetadata[product.product_id]
                                        ?.unidadePreco === "cx"
                                        ? "un/cx"
                                        : "un/pct"}
                                    </span>
                                    {!editedPricingMetadata[product.product_id]
                                      ?.fatorConversao && (
                                      <span className="text-[10px] text-red-500">
                                        * obrigatório
                                      </span>
                                    )}
                                  </div>
                                )}
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5">
                              {/* Price display with unit label - Requirements: 1.4, 3.4 */}
                              <span
                                className={cn(
                                  "font-bold text-xs px-2 py-1 rounded-md",
                                  isBestPrice
                                    ? "text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800"
                                    : "text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600"
                                )}
                              >
                                {currentValue > 0
                                  ? formatPriceWithUnit(currentValue, product.product_id)
                                  : "R$ 0.00"}
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
                              onClick={() => {
                                const currentMetadata = getSupplierItemPricingMetadata
                                  ? getSupplierItemPricingMetadata(
                                      selectedSupplier,
                                      product.product_id
                                    )
                                  : { unidadePreco: null, fatorConversao: null };
                                handleStartEdit(
                                  product.product_id,
                                  currentValue,
                                  currentMetadata
                                );
                              }}
                              disabled={
                                currentQuote.status === "concluida" || readOnly
                              }
                              className={cn(
                                "h-9 w-9 p-0 rounded-lg transition-all",
                                currentQuote.status === "concluida" || readOnly
                                  ? "text-gray-400 dark:text-gray-600 cursor-not-allowed"
                                  : "text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 hover:scale-110"
                              )}
                              title={
                                currentQuote.status === "concluida"
                                  ? "Cotação finalizada"
                                  : "Editar valor"
                              }
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
