import { useState, useRef, useMemo, useEffect, useCallback, memo } from "react";
import { Building2, Search, ArrowLeft, DollarSign, Package, TrendingDown, Edit2, Check, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { List } from "react-window";
import { PricingUnit, PriceMetadata } from "@/utils/priceNormalization";
import { PriceConverter } from "@/components/forms/PriceConverter";
import { ProductPriceInfoTooltip } from "@/components/forms/ProductPriceInfoTooltip";

const parseNumber = (val: string | number | undefined): number => {
  if (val === undefined || val === null || val === "") return 0;
  if (typeof val === 'number') return val;
  // Substitui vírgula por ponto para conversão
  return parseFloat(val.replace(',', '.'));
};

const areEqual = (prevProps: any, nextProps: any) => {
  if (!prevProps || !nextProps) return false;
  const { style: prevStyle, ...prevRest } = prevProps;
  const { style: nextStyle, ...nextRest } = nextProps;
  
  if (!prevStyle || !nextStyle) return false;

  return (
    prevStyle.height === nextStyle.height &&
    prevStyle.width === nextStyle.width &&
    prevStyle.top === nextStyle.top &&
    prevStyle.left === nextStyle.left &&
    prevRest.data === nextRest.data &&
    prevRest.index === nextRest.index
  );
};


const PRICING_UNIT_OPTIONS: { value: PricingUnit; label: string }[] = [
  { value: "kg", label: "por kg" },
  { value: "un", label: "por unidade" },
  { value: "cx", label: "por caixa" },
  { value: "pct", label: "por pacote" },
];

// ProductRow Component
const ProductRow = memo(({ index, style, data }: any) => {
  const { 
    products, 
    selectedSupplier, 
    getCurrentProductValue, 
    editingProductId, 
    getBestPriceInfoForProduct, 
    editedValues, 
    setEditedValues, 
    handleSaveEdit, 
    handleCancelEdit, 
    handleStartEdit, 
    getSupplierItemPricingMetadata,
    editedPricingMetadata,
    setEditedPricingMetadata,
    getCurrentPricingUnit,
    isConversionFactorRequired,
    formatPriceWithUnit,
    editInputRef,
    safeStr
  } = data;

  const product = products[index];
  const currentValue = getCurrentProductValue(selectedSupplier, product.product_id);
  const isEditing = editingProductId === product.product_id;
  const { bestSupplierId } = getBestPriceInfoForProduct(product.product_id);
  const isBestPrice = currentValue > 0 && selectedSupplier === bestSupplierId;

  return (
    <div style={style} className={cn("flex items-center px-2 border-b border-white/5 hover:bg-white/5 transition-colors group/row", isBestPrice && "bg-emerald-500/5")}>
      <div className="grid grid-cols-[1.5fr_0.8fr_1.2fr_auto] gap-2 w-full items-center">
        {/* Product Name */}
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="font-black text-[11px] text-gray-900 dark:text-white truncate tracking-tight" title={safeStr(product.product_name)}>
              {safeStr(product.product_name)}
            </p>
            <ProductPriceInfoTooltip 
              productId={product.product_id} 
              productName={safeStr(product.product_name)} 
            />
          </div>
          <p className="text-[7px] text-gray-400 sm:hidden mt-0.5 font-black uppercase tracking-widest bg-white/50 dark:bg-black/20 px-1 py-0 rounded border border-white/20 w-fit">
            {safeStr(product.quantidade)} {safeStr(product.unidade)}
          </p>
        </div>

        {/* Quantity (Desktop) */}
        <div className="hidden sm:block">
          <span className="text-[8px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.15em] px-1.5 py-0.5 bg-white/40 dark:bg-white/5 rounded-md border border-white/20">
            {safeStr(product.quantidade)} {safeStr(product.unidade)}
          </span>
        </div>

        {/* Value / Edit Form */}
        <div>
          {isEditing ? (
            <div className="flex flex-col gap-1 py-0.5 animate-in fade-in slide-in-from-top-1">
              <div className="flex items-center gap-1 flex-wrap">
                <div className="relative group/val">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[9px] font-black text-teal-500/50">R$</span>
                  <Input 
                    ref={editInputRef} 
                    type="text" 
                    inputMode="decimal"
                    value={editedValues[product.product_id] !== undefined ? editedValues[product.product_id] : ""}
                    onChange={(e) => {
                      // Permite digitar números e vírgula/ponto
                      const val = e.target.value;
                      if (/^[\d.,]*$/.test(val)) {
                        setEditedValues((prev: any) => ({ ...prev, [product.product_id]: val }));
                      }
                    }}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleSaveEdit(product.product_id); if (e.key === 'Escape') handleCancelEdit(); }}
                    className="w-16 h-7 text-[10px] pl-5 bg-white/60 dark:bg-white/5 border-teal-500/30 focus:ring-teal-500/20 font-black rounded-md shadow-inner" 
                  />
                </div>
                <Select
                  value={editedPricingMetadata[product.product_id]?.unidadePreco || getCurrentPricingUnit(product.product_id)}
                  onValueChange={(value: PricingUnit) => {
                    setEditedPricingMetadata((prev: any) => ({
                      ...prev,
                      [product.product_id]: {
                        ...prev[product.product_id],
                        unidadePreco: value,
                        fatorConversao: value === "cx" || value === "pct" ? prev[product.product_id]?.fatorConversao : undefined
                      }
                    }));
                  }}
                >
                  <SelectTrigger className="w-[70px] h-7 text-[9px] border-teal-500/30 bg-white/60 dark:bg-white/5 font-black rounded-md shadow-inner uppercase px-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white/95 dark:bg-gray-950/95 backdrop-blur-2xl border-white/30 rounded-xl shadow-2xl">
                    {PRICING_UNIT_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value} className="text-[10px] font-black uppercase tracking-widest">
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <PriceConverter
                  currentValue={parseNumber(editedValues[product.product_id]) || currentValue}
                  productQuantity={product.quantidade}
                  productUnit={product.unidade}
                  onConvert={(metadata) => {
                    setEditedValues((prev: any) => ({ ...prev, [product.product_id]: metadata.convertedValue.toString() }));
                    setEditedPricingMetadata((prev: any) => ({
                      ...prev,
                      [product.product_id]: {
                        unidadePreco: metadata.targetUnit,
                        fatorConversao: metadata.conversionFactor
                      }
                    }));
                    setTimeout(() => { editInputRef.current?.focus(); editInputRef.current?.select(); }, 100);
                  }}
                />
                <div className="flex gap-0.5">
                  <Button 
                    size="icon" 
                    onClick={() => handleSaveEdit(product.product_id)} 
                    disabled={isConversionFactorRequired(product.product_id) && !editedPricingMetadata[product.product_id]?.fatorConversao}
                    className="h-7 w-7 bg-gradient-to-br from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white shadow-md rounded-md transition-all active:scale-95"
                  >
                    <Check className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={handleCancelEdit} className="h-7 w-7 text-gray-400 hover:text-red-500 hover:bg-red-500/10 rounded-md transition-all">
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              {isConversionFactorRequired(product.product_id) && (
                <div className="flex items-center gap-2 pl-1 animate-in fade-in slide-in-from-left-2">
                  <span className="text-[8px] text-gray-400 dark:text-gray-500 font-black uppercase tracking-[0.1em]">Qtd emb:</span>
                  <Input
                    type="number"
                    value={editedPricingMetadata[product.product_id]?.fatorConversao || ""}
                    onChange={(e) => {
                      const value = Number(e.target.value);
                      setEditedPricingMetadata((prev: any) => ({
                        ...prev,
                        [product.product_id]: {
                          ...prev[product.product_id],
                          unidadePreco: prev[product.product_id]?.unidadePreco || getCurrentPricingUnit(product.product_id),
                          fatorConversao: value > 0 ? value : undefined
                        }
                      }));
                    }}
                    className={cn(
                      "w-14 h-6 text-[9px] rounded bg-white/60 dark:bg-white/5 font-black shadow-inner p-1",
                      !editedPricingMetadata[product.product_id]?.fatorConversao ? "border-red-500/50" : "border-teal-500/20"
                    )}
                    step="1"
                    min="1"
                    placeholder="Ex: 12"
                  />
                  <span className="text-[7px] text-gray-400 font-black uppercase tracking-widest">
                    {editedPricingMetadata[product.product_id]?.unidadePreco === "cx" ? "un/cx" : "un/pct"}
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex flex-col">
                <span className={cn("font-black text-xs tracking-tight", isBestPrice ? "text-emerald-600 dark:text-emerald-400" : "text-gray-900 dark:text-white")}>
                  {formatPriceWithUnit(currentValue, product.product_id)}
                </span>
              </div>
              {isBestPrice && (
                <div className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 px-1 py-0 rounded-full flex items-center gap-0.5 shadow-sm">
                  <TrendingDown className="h-2 w-2" />
                  <span className="text-[6px] font-black uppercase tracking-widest">Melhor</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action Button */}
        <div className="text-center w-14">
          {!isEditing && (
            <Button 
              size="icon" 
              variant="ghost" 
              onClick={() => {
                const currentMetadata = getSupplierItemPricingMetadata(selectedSupplier, product.product_id);
                handleStartEdit(product.product_id, currentValue, currentMetadata);
              }} 
              className="h-7 w-7 text-teal-600 hover:text-teal-700 hover:bg-teal-500/10 rounded-md transition-all"
            >
              <Edit2 className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}, areEqual);

interface QuoteValuesTabProps {
  products: any[];
  fornecedores: any[];
  quoteId: string;
  supplierItems: any[];
  onUpdateSupplierProductValue: (params: any) => void;
  onRefresh: () => void;
  isMobile: boolean;
  safeStr: (val: any) => string;
  getBestPriceInfoForProduct: (productId: string) => { bestPrice: number; bestSupplierId: string | null };
}

export function QuoteValuesTab({
  products,
  fornecedores,
  quoteId,
  supplierItems,
  onUpdateSupplierProductValue,
  onRefresh,
  isMobile,
  safeStr,
  getBestPriceInfoForProduct
}: QuoteValuesTabProps) {
  const [selectedSupplier, setSelectedSupplier] = useState<string>("");
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editedValues, setEditedValues] = useState<Record<string, string | number>>({});
  const [editedPricingMetadata, setEditedPricingMetadata] = useState<Record<string, { unidadePreco: PricingUnit; fatorConversao?: number }>>({});
  const editInputRef = useRef<HTMLInputElement>(null);
  const [supplierSearch, setSupplierSearch] = useState("");
  const [showMobileValues, setShowMobileValues] = useState(false);
  const [listDimensions, setListDimensions] = useState({ width: 0, height: 0 });
  const observerRef = useRef<ResizeObserver | null>(null);

  const measureRef = useCallback((node: HTMLDivElement | null) => {
    if (node !== null) {
      if (observerRef.current) observerRef.current.disconnect();
      
      observerRef.current = new ResizeObserver((entries) => {
        for (let entry of entries) {
          setListDimensions({
            width: entry.contentRect.width,
            height: entry.contentRect.height
          });
        }
      });
      observerRef.current.observe(node);
    } else {
      if (observerRef.current) observerRef.current.disconnect();
      observerRef.current = null;
    }
  }, []);

  // Initialize selectedSupplier
  useEffect(() => {
    if (fornecedores.length > 0 && !selectedSupplier) {
      setSelectedSupplier(fornecedores[0].id);
    }
  }, [fornecedores]);

  // Observer for list dimensions is handled by measureRef callback


  useEffect(() => {
    if (editingProductId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingProductId]);

  const getSupplierProductValue = useCallback((supplierId: string, productId: string): number => {
    // Busca o valor no array de supplierItems (que contém todos os itens de todos os fornecedores)
    const item = supplierItems.find((i: any) => i?.supplier_id === supplierId && i?.product_id === productId);
    return item?.valor_oferecido || 0;
  }, [supplierItems]);

  const getCurrentProductValue = useCallback((supplierId: string, productId: string): number => {
    // Se estiver editando este item, retorna o valor editado
    if (selectedSupplier === supplierId && editedValues[productId] !== undefined) {
      return editedValues[productId];
    }
    return getSupplierProductValue(supplierId, productId);
  }, [selectedSupplier, editedValues, getSupplierProductValue]);

  const getSupplierItemPricingMetadata = useCallback((supplierId: string, productId: string): { unidadePreco: PricingUnit | null; fatorConversao: number | null } => {
    const item = supplierItems.find((i: any) => i?.supplier_id === supplierId && i?.product_id === productId);
    return {
      unidadePreco: item?.unidade_preco || null,
      fatorConversao: item?.fator_conversao || null
    };
  }, [supplierItems]);

  const getCurrentPricingUnit = useCallback((productId: string): PricingUnit => {
    if (editedPricingMetadata[productId]?.unidadePreco) {
      return editedPricingMetadata[productId].unidadePreco;
    }
    if (selectedSupplier) {
      const metadata = getSupplierItemPricingMetadata(selectedSupplier, productId);
      if (metadata?.unidadePreco) {
        return metadata.unidadePreco;
      }
    }
    return "un";
  }, [editedPricingMetadata, selectedSupplier, getSupplierItemPricingMetadata]);

  const isConversionFactorRequired = useCallback((productId: string): boolean => {
    const unit = editedPricingMetadata[productId]?.unidadePreco || getCurrentPricingUnit(productId);
    return unit === "cx" || unit === "pct";
  }, [editedPricingMetadata, getCurrentPricingUnit]);

  const formatPriceWithUnit = useCallback((value: number, productId: string): string => {
    const unit = getCurrentPricingUnit(productId);
    const unitLabel = PRICING_UNIT_OPTIONS.find((o) => o.value === unit)?.label.replace("por ", "/") || "/un";
    const safeValue = typeof value === 'number' ? value : 0;
    return `R$ ${safeValue.toFixed(2)}${unitLabel}`;
  }, [getCurrentPricingUnit]);

  const handleStartEdit = useCallback((productId: string, currentValue: number, currentMetadata?: { unidadePreco: PricingUnit | null; fatorConversao: number | null }) => {
    setEditingProductId(productId);
    setEditedValues(prev => ({ ...prev, [productId]: currentValue ? currentValue.toString() : "" }));
    if (currentMetadata?.unidadePreco) {
      setEditedPricingMetadata(prev => ({
        ...prev,
        [productId]: {
          unidadePreco: currentMetadata.unidadePreco!,
          fatorConversao: currentMetadata.fatorConversao || undefined
        }
      }));
    }
  }, []);

  const handleSaveEdit = useCallback(async (productId: string) => {
    if (selectedSupplier && editedValues[productId] !== undefined) {
      try {
        const metadata = editedPricingMetadata[productId];
        const newValue = parseNumber(editedValues[productId]);
        
        console.log('💾 Saving value:', {
          productId,
          rawValue: editedValues[productId],
          parsedValue: newValue,
          metadata
        });

        await onUpdateSupplierProductValue({
          quoteId: quoteId,
          supplierId: selectedSupplier,
          productId,
          newValue: newValue,
          unidadePreco: metadata?.unidadePreco,
          fatorConversao: metadata?.fatorConversao,
          quantidadePorEmbalagem: metadata?.fatorConversao
        });
        
        // Clear edited values after successful save to force refresh from backend data
        setEditedValues(prev => {
          const next = { ...prev };
          delete next[productId];
          return next;
        });
        
        setEditingProductId(null);
        setEditedPricingMetadata({});
        toast({ title: "✅ Valor atualizado!" });
        onRefresh();
      } catch {
        toast({ title: "❌ Erro ao salvar", variant: "destructive" });
      }
    }
  }, [selectedSupplier, editedValues, editedPricingMetadata, quoteId, onUpdateSupplierProductValue, onRefresh]);

  const handleCancelEdit = useCallback(() => {
    setEditingProductId(null);
    setEditedValues({});
    setEditedPricingMetadata({});
  }, []);

  const supplierTotals = useMemo(() => {
    const totals = new Map<string, number>();
    fornecedores.forEach(f => {
      const total = products.reduce((sum: number, product: any) => sum + getSupplierProductValue(f.id, product.product_id), 0);
      totals.set(f.id, total);
    });
    return totals;
  }, [fornecedores, products, getSupplierProductValue]);

  const calcularTotalFornecedor = useCallback((supplierId: string) => {
    return supplierTotals.get(supplierId) || 0;
  }, [supplierTotals]);

  const filteredSuppliers = useMemo(() => {
    if (!supplierSearch) return fornecedores;
    return fornecedores.filter(f => f.nome.toLowerCase().includes(supplierSearch.toLowerCase()));
  }, [fornecedores, supplierSearch]);

  const itemData = useMemo(() => ({
    products, 
    selectedSupplier, 
    getCurrentProductValue, 
    editingProductId, 
    getBestPriceInfoForProduct, 
    editedValues, 
    setEditedValues, 
    handleSaveEdit, 
    handleCancelEdit, 
    handleStartEdit, 
    getSupplierItemPricingMetadata,
    editedPricingMetadata,
    setEditedPricingMetadata,
    getCurrentPricingUnit,
    isConversionFactorRequired,
    formatPriceWithUnit,
    editInputRef,
    safeStr
  }), [products, selectedSupplier, getCurrentProductValue, editingProductId, getBestPriceInfoForProduct, editedValues, editedPricingMetadata, getCurrentPricingUnit, isConversionFactorRequired, formatPriceWithUnit, getSupplierItemPricingMetadata]);

  return (
    <div className="flex flex-col md:flex-row h-full relative">
      {/* Lista de Fornecedores - Sidebar */}
      <div className={cn(
        "w-full md:w-48 xl:w-56 flex-col border-r border-white/10 dark:border-white/5 bg-white/30 dark:bg-black/20 backdrop-blur-2xl transition-all duration-300 z-20",
        isMobile && showMobileValues ? "hidden" : "flex"
      )}>
        <div className="absolute inset-0 bg-gradient-to-b from-teal-500/5 to-transparent pointer-events-none"></div>
        
        {/* Header da Sidebar com Busca */}
        <div className="p-2 border-b border-white/10 dark:border-white/5 relative z-10 space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-lg bg-teal-500/10 flex items-center justify-center text-teal-600 border border-teal-500/20 shadow-sm">
              <Building2 className="h-2.5 w-2.5" />
            </div>
            <span className="text-[9px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em]">Fornecedores</span>
          </div>
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-500 pointer-events-none" />
            <Input 
              placeholder="Buscar..." 
              value={supplierSearch}
              onChange={e => setSupplierSearch(e.target.value)}
              className="h-7 pl-7 text-[10px] bg-white/50 dark:bg-black/20 border-white/20 rounded-lg focus-visible:ring-1 focus-visible:ring-teal-500/50" 
            />
          </div>
        </div>

        <ScrollArea className="flex-1 relative z-10 custom-scrollbar">
          <div className="p-1.5 flex flex-col gap-1">
            {filteredSuppliers.map((fornecedor) => {
              const total = calcularTotalFornecedor(fornecedor.id);
              const isSelected = selectedSupplier === fornecedor.id;
              return (
                <button 
                  key={fornecedor.id} 
                  onClick={() => { 
                    setSelectedSupplier(fornecedor.id); 
                    setEditingProductId(null); 
                    setEditedValues({});
                    if (isMobile) setShowMobileValues(true);
                  }}
                  className={cn(
                    "w-full text-left p-2 rounded-lg transition-all duration-300 relative overflow-hidden group/supplier",
                    isSelected 
                      ? "bg-white/60 dark:bg-gray-800/60 border border-white/40 dark:border-white/10 shadow-lg shadow-teal-500/5 ring-1 ring-white/20" 
                      : "hover:bg-white/30 dark:hover:bg-white/5 border border-transparent"
                  )}
                >
                  {isSelected && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-teal-500 rounded-r-full"></div>
                  )}
                  <div className="flex items-center gap-2 min-w-0">
                    <div className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0 shadow-sm", 
                      fornecedor.status === 'respondido' ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
                    )} />
                    <span 
                      className={cn(
                        "text-[11px] truncate block tracking-tight",
                        isSelected ? "text-teal-600 dark:text-teal-300 font-black" : "text-gray-600 dark:text-gray-400 font-bold group-hover/supplier:text-gray-900 dark:group-hover/supplier:text-white"
                      )} 
                      title={safeStr(fornecedor.nome)}
                    >
                      {safeStr(fornecedor.nome)}
                    </span>
                  </div>
                  <div className="mt-1 ml-3.5 flex items-center justify-between">
                    <span className={cn("text-[9px] font-black tracking-tight", isSelected ? "text-gray-900 dark:text-white" : "text-gray-400 dark:text-gray-500")}>
                      R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                    {fornecedor.status === 'respondido' && (
                      <Badge variant="outline" className="text-[7px] px-1 py-0 h-3 bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-black uppercase tracking-tighter">
                        OK
                      </Badge>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </ScrollArea>
      </div>

      {/* Área de Edição de Valores */}
      <div className={cn(
        "flex-1 flex-col bg-white/10 dark:bg-black/10 relative overflow-hidden z-10",
        isMobile && !showMobileValues ? "hidden" : "flex"
      )}>
        <div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 via-transparent to-emerald-500/5 pointer-events-none"></div>
        
        {/* Mobile Back Header */}
        {isMobile && (
          <div className="flex items-center gap-2 p-2 border-b border-white/10 bg-white/40 dark:bg-gray-900/40 backdrop-blur-md">
             <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowMobileValues(false)}>
               <ArrowLeft className="h-4 w-4" />
             </Button>
             <span className="text-xs font-black uppercase tracking-widest text-gray-500">Voltar para lista</span>
          </div>
        )}

        {selectedSupplier ? (
          <>
            {/* Header do Fornecedor */}
            <div className="flex-shrink-0 px-3 py-2 border-b border-white/10 dark:border-white/5 bg-white/40 dark:bg-white/5 backdrop-blur-md flex items-center justify-between gap-3 relative z-10">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <div className="w-7 h-7 rounded-lg bg-teal-500/10 flex items-center justify-center border border-teal-500/20 shadow-sm">
                  <DollarSign className="h-3.5 w-3.5 text-teal-600" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-[8px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Valores de:</span>
                  <span 
                    className="font-black text-gray-900 dark:text-white truncate text-xs tracking-tight" 
                    title={fornecedores.find(f => f.id === selectedSupplier)?.nome}
                  >
                    {fornecedores.find(f => f.id === selectedSupplier)?.nome}
                  </span>
                </div>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[8px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-0.5">Total</span>
                <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 px-2 py-0.5 h-auto text-xs font-black shadow-sm rounded-md">
                  <span className="text-[9px] mr-1 opacity-70">R$</span>
                  {calcularTotalFornecedor(selectedSupplier).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </Badge>
              </div>
            </div>
            
            {/* Lista Virtualizada de Produtos */}
            <div className="flex-1 flex flex-col relative z-10 overflow-hidden">
              <div className="grid grid-cols-[1.5fr_0.8fr_1.2fr_auto] gap-2 px-2 py-1.5 border-b border-white/10 text-[8px] font-black uppercase text-gray-500 tracking-[0.2em] bg-white/20 backdrop-blur-sm flex-shrink-0">
                 <div>Produto</div>
                 <div className="hidden sm:block">Qtd</div>
                 <div>Valor</div>
                 <div className="text-center w-14">Ação</div>
              </div>
              
              <div className="flex-1 w-full" ref={measureRef}>
                {products.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-xs text-gray-500 font-medium">Nenhum produto nesta cotação.</p>
                  </div>
                ) : listDimensions.height > 0 && (
                  <List
                    style={{ height: listDimensions.height, width: listDimensions.width }}
                    rowCount={products.length}
                    rowHeight={64} // Altura estimada da linha
                    rowProps={{ data: itemData }}
                    rowComponent={ProductRow}
                    className="custom-scrollbar"
                  />
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="text-center animate-in fade-in zoom-in-95 duration-700 max-w-sm">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-500/10 to-emerald-500/10 border border-teal-500/20 flex items-center justify-center mx-auto mb-3 backdrop-blur-md shadow-xl group hover:scale-110 transition-transform">
                <Building2 className="h-8 w-8 text-teal-600 opacity-40 group-hover:opacity-100 transition-opacity" />
              </div>
              <p className="text-base font-black text-gray-900 dark:text-white uppercase tracking-[0.2em]">Selecione um fornecedor</p>
              <p className="text-[9px] mt-1 font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest leading-relaxed">Escolha um parceiro na lista lateral.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
