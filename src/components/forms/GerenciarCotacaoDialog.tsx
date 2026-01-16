import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Package, Building2, X, DollarSign, Edit2, TrendingDown, FileText, Calendar, Check, ClipboardList, Users, ShoppingCart, AlertCircle, Award, Plus, Trash2, Settings, Trophy, Star, Download } from "lucide-react";
import { ProductPriceInfoTooltip } from "@/components/forms/ProductPriceInfoTooltip";
import { QuoteExportTab } from "@/components/cotacoes/view-dialog/QuoteExportTab";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import type { Quote } from "@/hooks/useCotacoes";
import { PricingUnit, normalizePrice, PriceMetadata } from "@/utils/priceNormalization";
import { PriceConverter } from "@/components/forms/PriceConverter";

// Pricing unit options for the selector - Requirements: 1.1
const PRICING_UNIT_OPTIONS: { value: PricingUnit; label: string }[] = [
  { value: "kg", label: "por kg" },
  { value: "un", label: "por unidade" },
  { value: "cx", label: "por caixa" },
  { value: "pct", label: "por pacote" },
];

interface GerenciarCotacaoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quote: Quote;
  onUpdateSupplierProductValue: (params: { quoteId: string; supplierId: string; productId: string; newValue: number; unidadePreco?: PricingUnit; fatorConversao?: number; quantidadePorEmbalagem?: number }) => void;
  onConvertToOrder?: (quoteId: string, orders: Array<{ supplierId: string; productIds: string[]; deliveryDate: string; observations?: string }>) => void;
  onAddQuoteItem?: (data: { quoteId: string; productId: string; productName: string; quantidade: number; unidade: string }) => void;
  onRemoveQuoteItem?: (data: { quoteId: string; productId: string }) => void;
  onAddQuoteSupplier?: (data: { quoteId: string; supplierId: string; supplierName: string }) => void;
  onRemoveQuoteSupplier?: (data: { quoteId: string; supplierId: string }) => void;
  availableProducts?: Array<{ id: string; name: string; unit: string }>;
  availableSuppliers?: Array<{ id: string; name: string }>;
  onRefresh: () => void;
  isUpdating?: boolean;
}

export default function GerenciarCotacaoDialog({ open, onOpenChange, quote, onUpdateSupplierProductValue, onConvertToOrder, onAddQuoteItem, onRemoveQuoteItem, onAddQuoteSupplier, onRemoveQuoteSupplier, availableProducts = [], availableSuppliers = [], onRefresh }: GerenciarCotacaoDialogProps) {
  const [activeTab, setActiveTab] = useState("resumo");
  const [selectedSupplier, setSelectedSupplier] = useState<string>("");
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editedValues, setEditedValues] = useState<Record<string, number>>({});
  const [editedPricingMetadata, setEditedPricingMetadata] = useState<Record<string, { unidadePreco: PricingUnit; fatorConversao?: number }>>({});
  const editInputRef = useRef<HTMLInputElement>(null);
  
  // Estado para conversão
  const [productSelections, setProductSelections] = useState<Record<string, string>>({});
  const [deliveryDate, setDeliveryDate] = useState("");
  const [observations, setObservations] = useState("");
  
  // Estado para edição de produtos/fornecedores
  const [selectedProductToAdd, setSelectedProductToAdd] = useState("");
  const [productQuantity, setProductQuantity] = useState("1");
  const [productUnit, setProductUnit] = useState("un");
  const [selectedSupplierToAdd, setSelectedSupplierToAdd] = useState("");
  
  const unidadesMedida = [
    { value: "un", label: "Unidade (un)" },
    { value: "kg", label: "Quilograma (kg)" },
    { value: "g", label: "Grama (g)" },
    { value: "cx", label: "Caixa (cx)" },
    { value: "pct", label: "Pacote (pct)" },
    { value: "lt", label: "Litro (lt)" },
    { value: "ml", label: "Mililitro (ml)" },
    { value: "dz", label: "Dúzia (dz)" },
    { value: "fd", label: "Fardo (fd)" },
    { value: "sc", label: "Saco (sc)" },
  ];

  // Memoizar dados base
  const products = useMemo(() => (quote as any)?._raw?.quote_items || [], [quote]);
  const fornecedores = useMemo(() => quote.fornecedoresParticipantes || [], [quote.fornecedoresParticipantes]);
  
  // Memoizar filtros de produtos e fornecedores
  const productsNotInQuote = useMemo(() => 
    availableProducts.filter(p => !products.some((item: any) => item.product_id === p.id)),
    [availableProducts, products]
  );
  const suppliersNotInQuote = useMemo(() => 
    availableSuppliers.filter(s => !fornecedores.some(f => f.id === s.id)),
    [availableSuppliers, fornecedores]
  );

  // Inicializar seleções com melhor preço
  useEffect(() => {
    if (open && products.length > 0) {
      const initialSelections: Record<string, string> = {};
      products.forEach((product: any) => {
        const { bestSupplierId } = getBestPriceInfoForProduct(product.product_id);
        if (bestSupplierId) initialSelections[product.product_id] = bestSupplierId;
      });
      setProductSelections(initialSelections);
    }
  }, [open, products.length]);

  // Ref para controlar se é a primeira abertura do modal
  const isFirstOpen = useRef(true);

  useEffect(() => {
    if (open) {
      // Só reseta a tab na primeira abertura
      if (isFirstOpen.current) {
        setActiveTab("resumo");
        isFirstOpen.current = false;
      }
      if (fornecedores.length > 0 && !selectedSupplier) {
        setSelectedSupplier(fornecedores[0].id);
      }
      setDeliveryDate("");
      setObservations("");
    } else {
      setSelectedSupplier("");
      setEditingProductId(null);
      setEditedValues({});
      isFirstOpen.current = true; // Reset para próxima abertura
    }
  }, [open]);

  useEffect(() => {
    if (editingProductId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingProductId]);

  // Memoizar supplierItems para evitar recálculos
  const supplierItems = useMemo(() => {
    const raw = quote as any;
    return raw._supplierItems || raw._raw?.quote_supplier_items || [];
  }, [quote]);

  const getSupplierProductValue = useCallback((supplierId: string, productId: string): number => {
    const item = supplierItems.find((i: any) => i?.supplier_id === supplierId && i?.product_id === productId);
    return item?.valor_oferecido || 0;
  }, [supplierItems]);

  const getCurrentProductValue = useCallback((supplierId: string, productId: string): number => {
    if (selectedSupplier === supplierId && editedValues[productId] !== undefined) {
      return editedValues[productId];
    }
    return getSupplierProductValue(supplierId, productId);
  }, [selectedSupplier, editedValues, getSupplierProductValue]);

  // Memoizar mapa de melhores preços por produto
  const bestPricesMap = useMemo(() => {
    const map = new Map<string, { bestPrice: number; bestSupplierId: string | null }>();
    products.forEach((product: any) => {
      let bestPrice = Infinity;
      let bestSupplierId: string | null = null;
      fornecedores.forEach(f => {
        const value = getSupplierProductValue(f.id, product.product_id);
        if (value > 0 && value < bestPrice) { bestPrice = value; bestSupplierId = f.id; }
      });
      map.set(product.product_id, { bestPrice: bestPrice === Infinity ? 0 : bestPrice, bestSupplierId });
    });
    return map;
  }, [products, fornecedores, getSupplierProductValue]);

  const getBestPriceInfoForProduct = useCallback((productId: string): { bestPrice: number; bestSupplierId: string | null } => {
    return bestPricesMap.get(productId) || { bestPrice: 0, bestSupplierId: null };
  }, [bestPricesMap]);

  // Helper to get pricing metadata for a supplier item
  const getSupplierItemPricingMetadata = useCallback((supplierId: string, productId: string): { unidadePreco: PricingUnit | null; fatorConversao: number | null } => {
    const item = supplierItems.find((i: any) => i?.supplier_id === supplierId && i?.product_id === productId);
    return {
      unidadePreco: item?.unidade_preco || null,
      fatorConversao: item?.fator_conversao || null
    };
  }, [supplierItems]);

  // Helper to get current pricing unit for display
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

  // Check if conversion factor is required (for cx or pct)
  const isConversionFactorRequired = useCallback((productId: string): boolean => {
    const unit = editedPricingMetadata[productId]?.unidadePreco || getCurrentPricingUnit(productId);
    return unit === "cx" || unit === "pct";
  }, [editedPricingMetadata, getCurrentPricingUnit]);

  // Format price with unit label
  const formatPriceWithUnit = useCallback((value: number, productId: string): string => {
    const unit = getCurrentPricingUnit(productId);
    const unitLabel = PRICING_UNIT_OPTIONS.find((o) => o.value === unit)?.label.replace("por ", "/") || "/un";
    return `R$ ${value.toFixed(2)}${unitLabel}`;
  }, [getCurrentPricingUnit]);

  const handleStartEdit = useCallback((productId: string, currentValue: number, currentMetadata?: { unidadePreco: PricingUnit | null; fatorConversao: number | null }) => {
    setEditingProductId(productId);
    setEditedValues(prev => ({ ...prev, [productId]: currentValue }));
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
        await onUpdateSupplierProductValue({
          quoteId: quote.id,
          supplierId: selectedSupplier,
          productId,
          newValue: editedValues[productId],
          unidadePreco: metadata?.unidadePreco,
          fatorConversao: metadata?.fatorConversao,
          quantidadePorEmbalagem: metadata?.fatorConversao // Same as fatorConversao for now
        });
        setEditingProductId(null);
        setEditedPricingMetadata({});
        toast({ title: "✅ Valor atualizado!" });
        onRefresh();
      } catch {
        toast({ title: "❌ Erro ao salvar", variant: "destructive" });
      }
    }
  }, [selectedSupplier, editedValues, editedPricingMetadata, quote.id, onUpdateSupplierProductValue, onRefresh]);

  const handleCancelEdit = useCallback(() => {
    setEditingProductId(null);
    setEditedValues({});
    setEditedPricingMetadata({});
  }, []);

  // Get normalized unit price for comparison
  const getNormalizedUnitPrice = useCallback((supplierId: string, productId: string): number => {
    const supplierItem = supplierItems.find((i: any) => i?.supplier_id === supplierId && i?.product_id === productId);
    if (!supplierItem || !supplierItem.valor_oferecido || supplierItem.valor_oferecido <= 0) return 0;

    const product = products.find((p: any) => p.product_id === productId);
    if (!product) return 0;

    try {
      const priceMetadata: PriceMetadata = {
        valorOferecido: supplierItem.valor_oferecido,
        unidadePreco: supplierItem.unidade_preco || 'un',
        fatorConversao: supplierItem.fator_conversao || undefined,
        quantidadePorEmbalagem: supplierItem.quantidade_por_embalagem || undefined,
      };

      const normalized = normalizePrice(priceMetadata, product.quantidade, product.unidade);
      return normalized.valorUnitario;
    } catch (error) {
      console.error('Error normalizing price:', error);
      return supplierItem.valor_oferecido;
    }
  }, [supplierItems, products]);

  // Memoizar totais por fornecedor
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

  const safeStr = (val: any) => (typeof val === 'string' ? val : String(val || ''));

  // Memoizar total da seleção atual
  const totalSelecao = useMemo(() => {
    return products.reduce((total: number, product: any) => {
      const supplierId = productSelections[product.product_id];
      if (supplierId) {
        return total + getSupplierProductValue(supplierId, product.product_id);
      }
      return total;
    }, 0);
  }, [products, productSelections, getSupplierProductValue]);

  // Memoizar melhor total possível
  const melhorTotal = useMemo(() => {
    return products.reduce((total: number, product: any) => {
      const { bestPrice } = getBestPriceInfoForProduct(product.product_id);
      return total + bestPrice;
    }, 0);
  }, [products, getBestPriceInfoForProduct]);

  // Memoizar grupos de fornecedores
  const supplierGroups = useMemo(() => {
    const groups = new Map<string, { supplierId: string; supplierName: string; products: any[] }>();
    
    Object.entries(productSelections).forEach(([productId, supplierId]) => {
      const product = products.find((p: any) => p.product_id === productId);
      const fornecedor = fornecedores.find(f => f.id === supplierId);
      
      if (product && fornecedor) {
        if (!groups.has(supplierId)) {
          groups.set(supplierId, { supplierId, supplierName: safeStr(fornecedor.nome), products: [] });
        }
        groups.get(supplierId)!.products.push({
          ...product,
          value: getSupplierProductValue(supplierId, productId)
        });
      }
    });
    
    return Array.from(groups.values());
  }, [productSelections, products, fornecedores, getSupplierProductValue]);

  // Converter em pedido(s)
  const handleConvertToOrder = () => {
    if (!deliveryDate) {
      toast({ title: "Informe a data de entrega", variant: "destructive" });
      return;
    }

    if (supplierGroups.length === 0) {
      toast({ title: "Selecione fornecedores para os produtos", variant: "destructive" });
      return;
    }

    if (onConvertToOrder) {
      const orders = supplierGroups.map(group => ({
        supplierId: group.supplierId,
        productIds: group.products.map((p: any) => p.product_id),
        deliveryDate,
        observations: observations || undefined
      }));

      onConvertToOrder(quote.id, orders);
      onOpenChange(false);
    }
  };

  // Memoizar stats
  const stats = useMemo(() => {
    const fornecedoresComValor = fornecedores.filter(f => f.valorOferecido > 0);
    const valores = fornecedoresComValor.map(f => f.valorOferecido);
    const melhorValor = valores.length > 0 ? Math.min(...valores) : 0;
    
    return {
      totalProdutos: products.length,
      totalFornecedores: fornecedores.length,
      fornecedoresRespondidos: fornecedores.filter(f => f.status === "respondido").length,
      melhorValor,
      melhorFornecedor: fornecedoresComValor.find(f => f.valorOferecido === melhorValor)?.nome || '-'
    };
  }, [products.length, fornecedores]);

  // Memoizar dados de preços por produto para a tab de resumo
  const productPricesData = useMemo(() => {
    return products.map((product: any) => {
      const { bestPrice, bestSupplierId } = getBestPriceInfoForProduct(product.product_id);
      const bestSupplierName = fornecedores.find(f => f.id === bestSupplierId)?.nome || "-";
      
      const allPrices = fornecedores
        .map(f => ({
          nome: f.nome,
          value: getSupplierProductValue(f.id, product.product_id)
        }))
        .filter(p => p.value > 0)
        .sort((a, b) => a.value - b.value);
      
      const worstPrice = allPrices.length > 0 ? allPrices[allPrices.length - 1].value : 0;
      const savings = worstPrice > 0 && bestPrice > 0 ? worstPrice - bestPrice : 0;
      
      return {
        productId: product.product_id,
        productName: product.product_name,
        quantidade: product.quantidade,
        unidade: product.unidade,
        bestPrice,
        bestSupplierName,
        allPrices,
        savings
      };
    });
  }, [products, fornecedores, getBestPriceInfoForProduct, getSupplierProductValue]);



  // Handlers para edição
  const handleAddProduct = () => {
    if (!selectedProductToAdd || !onAddQuoteItem) return;
    const product = availableProducts.find(p => p.id === selectedProductToAdd);
    if (!product) return;
    
    onAddQuoteItem({
      quoteId: quote.id,
      productId: product.id,
      productName: product.name,
      quantidade: Number(productQuantity) || 1,
      unidade: productUnit
    });
    setSelectedProductToAdd("");
    setProductQuantity("1");
    setProductUnit("un");
  };

  const handleRemoveProduct = (productId: string) => {
    if (!onRemoveQuoteItem) return;
    onRemoveQuoteItem({ quoteId: quote.id, productId });
  };

  const handleAddSupplier = () => {
    if (!selectedSupplierToAdd || !onAddQuoteSupplier) return;
    const supplier = availableSuppliers.find(s => s.id === selectedSupplierToAdd);
    if (!supplier) return;
    
    onAddQuoteSupplier({
      quoteId: quote.id,
      supplierId: supplier.id,
      supplierName: supplier.name
    });
    setSelectedSupplierToAdd("");
  };

  const handleRemoveSupplier = (supplierId: string) => {
    if (!onRemoveQuoteSupplier) return;
    onRemoveQuoteSupplier({ quoteId: quote.id, supplierId });
  };


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl w-[95vw] sm:w-[90vw] h-[90vh] max-h-[850px] p-0 overflow-hidden bg-white dark:bg-gray-900 flex flex-col">
        {/* Header */}
        <DialogHeader className="flex-shrink-0 px-5 py-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-teal-100 dark:bg-teal-900/30">
                <ClipboardList className="h-5 w-5 text-teal-600 dark:text-teal-400" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-gray-900 dark:text-white">
                  Gerenciar Cotação #{safeStr(quote.id).substring(0, 8)}
                </DialogTitle>
                <p className="text-sm text-gray-600 dark:text-gray-400 truncate max-w-[400px]">{safeStr(quote.produto)}</p>
              </div>
            </div>
            <Button type="button" variant="ghost" size="icon" onClick={() => onOpenChange(false)} className="text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="flex-shrink-0 w-full justify-start rounded-none border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-0 h-auto overflow-x-auto">
            <TabsTrigger value="resumo" className="rounded-none border-b-2 border-transparent data-[state=active]:border-teal-500 data-[state=active]:bg-transparent px-2 sm:px-4 py-3 text-xs sm:text-sm whitespace-nowrap">
              <Trophy className="h-4 w-4 mr-1 sm:mr-2" /><span className="hidden sm:inline">Resumo Geral</span><span className="sm:hidden">Resumo</span>
            </TabsTrigger>
            <TabsTrigger value="exportar" className="rounded-none border-b-2 border-transparent data-[state=active]:border-orange-500 data-[state=active]:bg-transparent px-2 sm:px-4 py-3 text-xs sm:text-sm whitespace-nowrap">
              <Download className="h-4 w-4 mr-1 sm:mr-2" /><span className="hidden sm:inline">Exportar HTML</span><span className="sm:hidden">Exportar</span>
            </TabsTrigger>
            <TabsTrigger value="editar" className="rounded-none border-b-2 border-transparent data-[state=active]:border-teal-500 data-[state=active]:bg-transparent px-2 sm:px-4 py-3 text-xs sm:text-sm whitespace-nowrap">
              <Settings className="h-4 w-4 mr-1 sm:mr-2" /><span className="hidden sm:inline">Editar Cotação</span><span className="sm:hidden">Editar</span>
            </TabsTrigger>
            <TabsTrigger value="detalhes" className="rounded-none border-b-2 border-transparent data-[state=active]:border-teal-500 data-[state=active]:bg-transparent px-2 sm:px-4 py-3 text-xs sm:text-sm whitespace-nowrap">
              <FileText className="h-4 w-4 mr-1 sm:mr-2" /><span className="hidden xs:inline">Detalhes</span><span className="xs:hidden">Info</span>
            </TabsTrigger>
            <TabsTrigger value="valores" className="rounded-none border-b-2 border-transparent data-[state=active]:border-teal-500 data-[state=active]:bg-transparent px-2 sm:px-4 py-3 text-xs sm:text-sm whitespace-nowrap">
              <DollarSign className="h-4 w-4 mr-1 sm:mr-2" /><span className="hidden sm:inline">Editar Valores</span><span className="sm:hidden">Valores</span>
            </TabsTrigger>
            <TabsTrigger value="converter" className="rounded-none border-b-2 border-transparent data-[state=active]:border-teal-500 data-[state=active]:bg-transparent px-2 sm:px-4 py-3 text-xs sm:text-sm whitespace-nowrap">
              <ShoppingCart className="h-4 w-4 mr-1 sm:mr-2" /><span className="hidden sm:inline">Converter em Pedido</span><span className="sm:hidden">Pedido</span>
            </TabsTrigger>
          </TabsList>

          {/* Tab Resumo Geral */}
          <TabsContent value="resumo" className="flex-1 overflow-auto m-0 p-0">
            <ScrollArea className="h-full">
              <div className="p-4 sm:p-6 space-y-6">
                {/* Tabela de Preços por Produto */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Melhor Preço por Produto
                  </h3>
                  <Card className="overflow-hidden">
                    <div className="divide-y divide-gray-200 dark:divide-gray-700">
                      {productPricesData.map((item) => (
                        <div key={item.productId} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-900 dark:text-white truncate">
                                {safeStr(item.productName)}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                {safeStr(item.quantidade)} {safeStr(item.unidade)}
                              </p>
                            </div>
                            <div className="text-right flex-shrink-0">
                              {item.bestPrice > 0 ? (
                                <>
                                  <div className="flex items-center gap-2 justify-end">
                                    <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                                    <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                                      R$ {item.bestPrice.toFixed(2)}
                                    </span>
                                  </div>
                                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                                    {safeStr(item.bestSupplierName)}
                                  </p>
                                  {item.savings > 0 && (
                                    <Badge className="mt-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300 text-[10px]">
                                      <TrendingDown className="h-2.5 w-2.5 mr-0.5" />
                                      Economia: R$ {item.savings.toFixed(2)}
                                    </Badge>
                                  )}
                                </>
                              ) : (
                                <Badge variant="outline" className="text-gray-400">Sem preço</Badge>
                                )}
                              </div>
                            </div>
                            {item.allPrices.length > 1 && (
                              <div className="mt-2 flex flex-wrap gap-1.5">
                                {item.allPrices.map((price, idx) => (
                                  <Badge
                                    key={idx}
                                    variant={idx === 0 ? "default" : "outline"}
                                    className={cn(
                                      "text-[10px]",
                                      idx === 0
                                        ? "bg-emerald-600 hover:bg-emerald-600"
                                        : "text-gray-500 dark:text-gray-400"
                                    )}
                                  >
                                    {safeStr(price.nome)}: R$ {price.value.toFixed(2)}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                    </div>
                  </Card>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Tab Exportar HTML */}
          <TabsContent value="exportar" className="flex-1 overflow-hidden m-0 p-0">
            <QuoteExportTab
              quote={quote}
              products={products}
              getSupplierProductValue={getSupplierProductValue}
              getNormalizedUnitPrice={getNormalizedUnitPrice}
            />
          </TabsContent>

          {/* Tab Editar Cotação */}
          <TabsContent value="editar" className="flex-1 overflow-auto m-0 p-0">
            <ScrollArea className="h-full">
              <div className="p-6 space-y-6">
                {/* Seção Produtos */}
                <Card className="border-gray-200 dark:border-gray-700">
                  <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                    <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                      <Package className="h-4 w-4 text-teal-600" />
                      Produtos da Cotação ({products.length})
                    </h3>
                  </div>
                  
                  {/* Adicionar Produto */}
                  {productsNotInQuote.length > 0 && onAddQuoteItem && (
                    <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-teal-50/50 dark:bg-teal-900/10">
                      <div className="flex flex-col sm:flex-row gap-3">
                        <Select value={selectedProductToAdd} onValueChange={setSelectedProductToAdd}>
                          <SelectTrigger className="flex-1 bg-white dark:bg-gray-800">
                            <SelectValue placeholder="Selecione um produto para adicionar..." />
                          </SelectTrigger>
                          <SelectContent>
                            {productsNotInQuote.map(p => (
                              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Input 
                          type="number" 
                          min="1" 
                          value={productQuantity} 
                          onChange={(e) => setProductQuantity(e.target.value)}
                          placeholder="Qtd"
                          className="w-20 bg-white dark:bg-gray-800"
                        />
                        <Select value={productUnit} onValueChange={setProductUnit}>
                          <SelectTrigger className="w-[100px] bg-white dark:bg-gray-800">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {unidadesMedida.map(u => (
                              <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button 
                          onClick={handleAddProduct} 
                          disabled={!selectedProductToAdd}
                          className="bg-teal-600 hover:bg-teal-700 text-white"
                        >
                          <Plus className="h-4 w-4 mr-2" />Adicionar
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  {/* Lista de Produtos */}
                  <div className="divide-y divide-gray-100 dark:divide-gray-700">
                    {products.length === 0 ? (
                      <div className="p-8 text-center text-gray-500">
                        <Package className="h-12 w-12 mx-auto mb-3 opacity-30" />
                        <p>Nenhum produto na cotação</p>
                      </div>
                    ) : (
                      products.map((product: any, index: number) => (
                        <div key={product.product_id} className="p-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <span className="text-xs text-gray-400 w-6 flex-shrink-0">{index + 1}.</span>
                            <div className="min-w-0 flex-1">
                              <span className="font-medium text-gray-900 dark:text-white truncate block" title={safeStr(product.product_name)}>
                                {safeStr(product.product_name)}
                              </span>
                              <span className="text-xs text-gray-500">{safeStr(product.quantidade)} {safeStr(product.unidade)}</span>
                            </div>
                          </div>
                          {onRemoveQuoteItem && products.length > 1 && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleRemoveProduct(product.product_id)}
                              className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </Card>

                {/* Seção Fornecedores */}
                <Card className="border-gray-200 dark:border-gray-700">
                  <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                    <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-blue-600" />
                      Fornecedores da Cotação ({fornecedores.length})
                    </h3>
                  </div>
                  
                  {/* Adicionar Fornecedor */}
                  {suppliersNotInQuote.length > 0 && onAddQuoteSupplier && (
                    <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-blue-50/50 dark:bg-blue-900/10">
                      <div className="flex flex-col sm:flex-row gap-3">
                        <Select value={selectedSupplierToAdd} onValueChange={setSelectedSupplierToAdd}>
                          <SelectTrigger className="flex-1 bg-white dark:bg-gray-800">
                            <SelectValue placeholder="Selecione um fornecedor para adicionar..." />
                          </SelectTrigger>
                          <SelectContent>
                            {suppliersNotInQuote.map(s => (
                              <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button 
                          onClick={handleAddSupplier} 
                          disabled={!selectedSupplierToAdd}
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          <Plus className="h-4 w-4 mr-2" />Adicionar
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  {/* Lista de Fornecedores */}
                  <div className="divide-y divide-gray-100 dark:divide-gray-700">
                    {fornecedores.length === 0 ? (
                      <div className="p-8 text-center text-gray-500">
                        <Building2 className="h-12 w-12 mx-auto mb-3 opacity-30" />
                        <p>Nenhum fornecedor na cotação</p>
                      </div>
                    ) : (
                      fornecedores.map((fornecedor) => (
                        <div key={fornecedor.id} className="p-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className={cn("w-2.5 h-2.5 rounded-full flex-shrink-0", fornecedor.status === 'respondido' ? "bg-green-500" : "bg-amber-500")} />
                            <div className="min-w-0 flex-1">
                              <span className="font-medium text-gray-900 dark:text-white truncate block" title={safeStr(fornecedor.nome)}>
                                {safeStr(fornecedor.nome)}
                              </span>
                              <div className="flex items-center gap-2 mt-0.5">
                                <Badge variant="outline" className={cn("text-xs", 
                                  fornecedor.status === 'respondido' 
                                    ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300" 
                                    : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300"
                                )}>
                                  {fornecedor.status === 'respondido' ? 'Respondido' : 'Pendente'}
                                </Badge>
                                {fornecedor.valorOferecido > 0 && (
                                  <span className="text-xs text-green-600 font-medium">R$ {fornecedor.valorOferecido.toFixed(2)}</span>
                                )}
                              </div>
                            </div>
                          </div>
                          {onRemoveQuoteSupplier && fornecedores.length > 1 && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleRemoveSupplier(fornecedor.id)}
                              className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </Card>

                {/* Aviso */}
                <Card className="p-4 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-amber-800 dark:text-amber-200">Atenção</p>
                      <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                        Ao remover um produto ou fornecedor, os valores já cadastrados para eles serão perdidos.
                      </p>
                    </div>
                  </div>
                </Card>
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Tab Detalhes */}
          <TabsContent value="detalhes" className="flex-1 overflow-auto m-0 p-0">
            <ScrollArea className="h-full">
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                  <Card className="p-4 bg-teal-50 dark:bg-teal-900/20 border-teal-200 dark:border-teal-800">
                    <div className="flex items-center gap-2 mb-1"><Package className="h-4 w-4 text-teal-600 dark:text-teal-400" /><span className="text-xs text-teal-700 dark:text-teal-300">Produtos</span></div>
                    <p className="text-2xl font-bold text-teal-800 dark:text-teal-200">{stats.totalProdutos}</p>
                  </Card>
                  <Card className="p-4 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                    <div className="flex items-center gap-2 mb-1"><Users className="h-4 w-4 text-blue-600 dark:text-blue-400" /><span className="text-xs text-blue-700 dark:text-blue-300">Fornecedores</span></div>
                    <p className="text-2xl font-bold text-blue-800 dark:text-blue-200">{stats.fornecedoresRespondidos}/{stats.totalFornecedores}</p>
                  </Card>
                  <Card className="p-4 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                    <div className="flex items-center gap-2 mb-1"><DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" /><span className="text-xs text-green-700 dark:text-green-300">Melhor Valor</span></div>
                    <p className="text-2xl font-bold text-green-800 dark:text-green-200">R$ {stats.melhorValor.toFixed(2)}</p>
                  </Card>
                  <Card className="p-4 bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800">
                    <div className="flex items-center gap-2 mb-1"><Calendar className="h-4 w-4 text-purple-600 dark:text-purple-400" /><span className="text-xs text-purple-700 dark:text-purple-300">Período</span></div>
                    <p className="text-sm font-bold text-purple-800 dark:text-purple-200">{safeStr(quote.dataInicio)}</p>
                    <p className="text-xs text-purple-600 dark:text-purple-400">até {safeStr(quote.dataFim)}</p>
                  </Card>
                </div>

                <Card className="border-gray-200 dark:border-gray-700">
                  <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                    <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2"><Package className="h-4 w-4" />Produtos</h3>
                  </div>
                  <div className="divide-y divide-gray-100 dark:divide-gray-700">
                    {products.map((product: any, index: number) => (
                      <div key={product.product_id} className="p-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-gray-400 w-6">{index + 1}.</span>
                          <span className="font-medium text-gray-900 dark:text-white">{safeStr(product.product_name)}</span>
                        </div>
                        <Badge variant="outline" className="text-gray-600 dark:text-gray-300">{safeStr(product.quantidade)} {safeStr(product.unidade)}</Badge>
                      </div>
                    ))}
                  </div>
                </Card>

                <Card className="border-gray-200 dark:border-gray-700">
                  <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                    <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2"><Building2 className="h-4 w-4" />Fornecedores</h3>
                  </div>
                  <div className="divide-y divide-gray-100 dark:divide-gray-700">
                    {fornecedores.map((fornecedor) => (
                      <div key={fornecedor.id} className="p-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={cn("w-2 h-2 rounded-full", fornecedor.status === 'respondido' ? "bg-green-500" : "bg-amber-500")} />
                          <span className="font-medium text-gray-900 dark:text-white">{safeStr(fornecedor.nome)}</span>
                          <Badge variant="outline" className={cn("text-xs", fornecedor.status === 'respondido' ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300" : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300")}>
                            {fornecedor.status === 'respondido' ? 'Respondido' : 'Pendente'}
                          </Badge>
                        </div>
                        {fornecedor.valorOferecido > 0 && <span className="font-semibold text-green-600 dark:text-green-400">R$ {fornecedor.valorOferecido.toFixed(2)}</span>}
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Tab Editar Valores */}
          <TabsContent value="valores" className="flex-1 overflow-hidden m-0 p-0">
            <div className="flex flex-col lg:flex-row h-full">
              {/* Lista de Fornecedores - Sidebar */}
              <div className="w-full lg:w-56 xl:w-64 flex-shrink-0 border-b lg:border-b-0 lg:border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex flex-col">
                <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">Fornecedores</span>
                  </div>
                </div>
                <ScrollArea className="flex-1 max-h-[100px] lg:max-h-none">
                  <div className="p-2 flex lg:flex-col gap-2 overflow-x-auto lg:overflow-x-visible">
                    {fornecedores.map((fornecedor) => {
                      const total = calcularTotalFornecedor(fornecedor.id);
                      const isSelected = selectedSupplier === fornecedor.id;
                      return (
                        <button 
                          key={fornecedor.id} 
                          onClick={() => { setSelectedSupplier(fornecedor.id); setEditingProductId(null); setEditedValues({}); }}
                          className={cn(
                            "flex-shrink-0 lg:w-full text-left px-3 py-2.5 rounded-lg transition-all",
                            "min-w-[140px] lg:min-w-0",
                            isSelected 
                              ? "bg-teal-100 dark:bg-teal-900/40 border border-teal-300 dark:border-teal-700 shadow-sm" 
                              : "hover:bg-gray-100 dark:hover:bg-gray-700 border border-transparent"
                          )}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <div className={cn("w-2.5 h-2.5 rounded-full flex-shrink-0", fornecedor.status === 'respondido' ? "bg-green-500" : "bg-amber-500")} />
                            <span 
                              className={cn(
                                "text-sm font-medium truncate block",
                                isSelected ? "text-teal-800 dark:text-teal-200" : "text-gray-700 dark:text-gray-300"
                              )} 
                              title={safeStr(fornecedor.nome)}
                              style={{ maxWidth: '140px' }}
                            >
                              {safeStr(fornecedor.nome)}
                            </span>
                          </div>
                          <div className="mt-1.5 ml-4.5 flex items-center gap-2">
                            <span className={cn("text-xs font-medium", isSelected ? "text-teal-600 dark:text-teal-400" : "text-gray-500 dark:text-gray-400")}>
                              R$ {total.toFixed(2)}
                            </span>
                            {fornecedor.status === 'respondido' && (
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 bg-green-50 text-green-600 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800">
                                Respondido
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
              <div className="flex-1 flex flex-col overflow-hidden min-w-0">
                {selectedSupplier ? (
                  <>
                    {/* Header do Fornecedor Selecionado */}
                    <div className="flex-shrink-0 px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <DollarSign className="h-4 w-4 text-teal-600 dark:text-teal-400 flex-shrink-0" />
                        <span 
                          className="font-semibold text-gray-900 dark:text-white truncate text-sm sm:text-base" 
                          title={fornecedores.find(f => f.id === selectedSupplier)?.nome}
                          style={{ maxWidth: '200px' }}
                        >
                          {fornecedores.find(f => f.id === selectedSupplier)?.nome}
                        </span>
                      </div>
                      <Badge className="bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-700 flex-shrink-0 text-sm font-semibold">
                        Total: R$ {calcularTotalFornecedor(selectedSupplier).toFixed(2)}
                      </Badge>
                    </div>
                    
                    {/* Tabela de Produtos */}
                    <ScrollArea className="flex-1">
                      <div className="min-w-[350px]">
                        <table className="w-full">
                          <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
                            <tr>
                              <th className="px-3 sm:px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Produto</th>
                              <th className="px-3 sm:px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide hidden sm:table-cell">Qtd</th>
                              <th className="px-3 sm:px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Valor (R$)</th>
                              <th className="px-3 sm:px-4 py-3 text-center text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide w-16">Ação</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {products.map((product: any) => {
                              const currentValue = getCurrentProductValue(selectedSupplier, product.product_id);
                              const isEditing = editingProductId === product.product_id;
                              const { bestSupplierId } = getBestPriceInfoForProduct(product.product_id);
                              const isBestPrice = currentValue > 0 && selectedSupplier === bestSupplierId;
                              return (
                                <tr key={product.product_id} className={cn("hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors", isBestPrice && "bg-green-50/50 dark:bg-green-900/10")}>
                                  <td className="px-3 sm:px-4 py-3">
                                    <div className="flex items-center gap-1">
                                      <p className="font-medium text-sm text-gray-900 dark:text-white truncate" style={{ maxWidth: '160px' }} title={safeStr(product.product_name)}>
                                        {safeStr(product.product_name)}
                                      </p>
                                      <ProductPriceInfoTooltip 
                                        productId={product.product_id} 
                                        productName={safeStr(product.product_name)} 
                                      />
                                    </div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 sm:hidden mt-0.5">
                                      {safeStr(product.quantidade)} {safeStr(product.unidade)}
                                    </p>
                                  </td>
                                  <td className="px-3 sm:px-4 py-3 hidden sm:table-cell">
                                    <span className="text-sm text-gray-600 dark:text-gray-300">{safeStr(product.quantidade)} {safeStr(product.unidade)}</span>
                                  </td>
                                  <td className="px-3 sm:px-4 py-3">
                                    {isEditing ? (
                                      <div className="flex flex-col gap-2">
                                        {/* Row 1: Value input, pricing unit selector, PriceConverter, and action buttons */}
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                          <Input 
                                            ref={editInputRef} 
                                            type="number" 
                                            step="0.01" 
                                            min="0" 
                                            value={editedValues[product.product_id] || 0}
                                            onChange={(e) => setEditedValues(prev => ({ ...prev, [product.product_id]: Number(e.target.value) }))}
                                            onKeyDown={(e) => { if (e.key === 'Enter') handleSaveEdit(product.product_id); if (e.key === 'Escape') handleCancelEdit(); }}
                                            className="w-20 sm:w-24 h-8 text-sm bg-white dark:bg-gray-900 border-teal-300 dark:border-teal-700 focus:ring-teal-500" 
                                          />
                                          {/* Pricing Unit Selector - Requirements: 1.1 */}
                                          <Select
                                            value={editedPricingMetadata[product.product_id]?.unidadePreco || getCurrentPricingUnit(product.product_id)}
                                            onValueChange={(value: PricingUnit) => {
                                              setEditedPricingMetadata(prev => ({
                                                ...prev,
                                                [product.product_id]: {
                                                  ...prev[product.product_id],
                                                  unidadePreco: value,
                                                  fatorConversao: value === "cx" || value === "pct" ? prev[product.product_id]?.fatorConversao : undefined
                                                }
                                              }));
                                            }}
                                          >
                                            <SelectTrigger className="w-[90px] h-8 text-xs border-teal-300 dark:border-teal-700">
                                              <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                              {PRICING_UNIT_OPTIONS.map((option) => (
                                                <SelectItem key={option.value} value={option.value} className="text-xs">
                                                  {option.label}
                                                </SelectItem>
                                              ))}
                                            </SelectContent>
                                          </Select>
                                          <PriceConverter
                                            currentValue={editedValues[product.product_id] || currentValue}
                                            productQuantity={product.quantidade}
                                            productUnit={product.unidade}
                                            onConvert={(metadata) => {
                                              setEditedValues(prev => ({ ...prev, [product.product_id]: metadata.convertedValue }));
                                              setEditedPricingMetadata(prev => ({
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
                                              size="sm" 
                                              onClick={() => handleSaveEdit(product.product_id)} 
                                              disabled={isConversionFactorRequired(product.product_id) && !editedPricingMetadata[product.product_id]?.fatorConversao}
                                              className="h-8 w-8 p-0 bg-teal-600 hover:bg-teal-700 text-white disabled:opacity-50"
                                            >
                                              <Check className="h-4 w-4" />
                                            </Button>
                                            <Button size="sm" variant="outline" onClick={handleCancelEdit} className="h-8 w-8 p-0 border-red-300 text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-400">
                                              <X className="h-4 w-4" />
                                            </Button>
                                          </div>
                                        </div>
                                        {/* Row 2: Conversion factor input (conditional) - Requirements: 1.2, 1.5 */}
                                        {isConversionFactorRequired(product.product_id) && (
                                          <div className="flex items-center gap-1.5 pl-0.5">
                                            <span className="text-[10px] text-gray-500 dark:text-gray-400">Qtd por embalagem:</span>
                                            <Input
                                              type="number"
                                              value={editedPricingMetadata[product.product_id]?.fatorConversao || ""}
                                              onChange={(e) => {
                                                const value = Number(e.target.value);
                                                setEditedPricingMetadata(prev => ({
                                                  ...prev,
                                                  [product.product_id]: {
                                                    ...prev[product.product_id],
                                                    unidadePreco: prev[product.product_id]?.unidadePreco || getCurrentPricingUnit(product.product_id),
                                                    fatorConversao: value > 0 ? value : undefined
                                                  }
                                                }));
                                              }}
                                              className={cn(
                                                "w-16 h-7 text-xs rounded-md",
                                                !editedPricingMetadata[product.product_id]?.fatorConversao ? "border-red-300 dark:border-red-700" : "border-gray-300 dark:border-gray-600"
                                              )}
                                              step="1"
                                              min="1"
                                              placeholder="Ex: 12"
                                            />
                                            <span className="text-[10px] text-gray-400">
                                              {editedPricingMetadata[product.product_id]?.unidadePreco === "cx" ? "un/cx" : "un/pct"}
                                            </span>
                                            {!editedPricingMetadata[product.product_id]?.fatorConversao && (
                                              <span className="text-[10px] text-red-500">* obrigatório</span>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    ) : (
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <span className={cn("font-semibold text-sm", isBestPrice ? "text-green-700 dark:text-green-300" : "text-gray-900 dark:text-white")}>
                                          {formatPriceWithUnit(currentValue, product.product_id)}
                                        </span>
                                        {isBestPrice && (
                                          <Badge className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-[10px] px-1.5 py-0 h-5">
                                            <TrendingDown className="h-3 w-3 mr-0.5" />Melhor
                                          </Badge>
                                        )}
                                      </div>
                                    )}
                                  </td>
                                  <td className="px-3 sm:px-4 py-3 text-center">
                                    {!isEditing && (
                                      <Button 
                                        size="sm" 
                                        variant="ghost" 
                                        onClick={() => {
                                          const currentMetadata = getSupplierItemPricingMetadata(selectedSupplier, product.product_id);
                                          handleStartEdit(product.product_id, currentValue, currentMetadata);
                                        }} 
                                        className="h-8 w-8 p-0 text-teal-600 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/30"
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
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400 p-8">
                    <div className="text-center">
                      <Building2 className="h-16 w-16 mx-auto mb-4 opacity-30" />
                      <p className="text-lg font-medium">Selecione um fornecedor</p>
                      <p className="text-sm mt-1">Escolha um fornecedor na lista para editar os valores</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Tab Converter em Pedido */}
          <TabsContent value="converter" className="flex-1 overflow-hidden m-0 p-0">
            <ScrollArea className="h-full">
              <div className="p-6 space-y-6">
                {/* Resumo */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <Card className="p-4 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                    <div className="flex items-center gap-2 mb-1"><DollarSign className="h-4 w-4 text-blue-600 dark:text-blue-400" /><span className="text-xs text-blue-700 dark:text-blue-300">Total Selecionado</span></div>
                    <p className="text-2xl font-bold text-blue-800 dark:text-blue-200">R$ {totalSelecao.toFixed(2)}</p>
                  </Card>
                  <Card className="p-4 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                    <div className="flex items-center gap-2 mb-1"><Award className="h-4 w-4 text-green-600 dark:text-green-400" /><span className="text-xs text-green-700 dark:text-green-300">Melhor Total Possível</span></div>
                    <p className="text-2xl font-bold text-green-800 dark:text-green-200">R$ {melhorTotal.toFixed(2)}</p>
                  </Card>
                </div>

                {/* Botões de ação rápida */}
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      // Auto-selecionar melhor fornecedor para cada produto
                      const bestSelections: Record<string, string> = {};
                      products.forEach((product: any) => {
                        const { bestSupplierId } = getBestPriceInfoForProduct(product.product_id);
                        if (bestSupplierId) bestSelections[product.product_id] = bestSupplierId;
                      });
                      setProductSelections(bestSelections);
                      toast({ title: "✅ Melhores preços selecionados!", description: `Total: R$ ${melhorTotal.toFixed(2)}` });
                    }}
                    className="flex-1 border-green-300 text-green-700 hover:bg-green-50 dark:border-green-700 dark:text-green-400 dark:hover:bg-green-900/20"
                  >
                    <Award className="h-4 w-4 mr-2" />
                    Selecionar Melhores Preços
                  </Button>
                  {supplierGroups.length > 1 && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        // Selecionar fornecedor com menor total geral
                        const supplierTotalsArray = fornecedores.map(f => {
                          const total = products.reduce((sum: number, p: any) => {
                            const value = getSupplierProductValue(f.id, p.product_id);
                            return sum + (value > 0 ? value : Infinity);
                          }, 0);
                          return { id: f.id, total, hasAllProducts: !products.some((p: any) => getSupplierProductValue(f.id, p.product_id) === 0) };
                        }).filter(s => s.hasAllProducts).sort((a, b) => a.total - b.total);
                        
                        if (supplierTotalsArray.length > 0) {
                          const bestSingleSupplier = supplierTotalsArray[0].id;
                          const singleSelections: Record<string, string> = {};
                          products.forEach((product: any) => {
                            singleSelections[product.product_id] = bestSingleSupplier;
                          });
                          setProductSelections(singleSelections);
                          toast({ title: "✅ Fornecedor único selecionado!", description: "Todos os produtos com o mesmo fornecedor" });
                        } else {
                          toast({ title: "⚠️ Nenhum fornecedor tem todos os produtos", variant: "destructive" });
                        }
                      }}
                      className="flex-1 border-blue-300 text-blue-700 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-400 dark:hover:bg-blue-900/20"
                    >
                      <Building2 className="h-4 w-4 mr-2" />
                      Fornecedor Único
                    </Button>
                  )}
                </div>

                {totalSelecao > melhorTotal && (
                  <Card className="p-3 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                      <span className="text-sm text-amber-700 dark:text-amber-300">
                        Você pode economizar R$ {(totalSelecao - melhorTotal).toFixed(2)} selecionando os melhores preços
                      </span>
                    </div>
                  </Card>
                )}

                {/* Tabela de seleção */}
                <Card className="border-gray-200 dark:border-gray-700 overflow-hidden">
                  <div className="p-3 sm:p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                    <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2 text-sm sm:text-base">
                      <Package className="h-4 w-4" />Selecione o fornecedor para cada produto
                    </h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[500px]">
                      <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                        <tr>
                          <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">Produto</th>
                          <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">Qtd</th>
                          <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">Fornecedor</th>
                          <th className="px-2 sm:px-4 py-2 sm:py-3 text-right text-xs font-semibold text-gray-700 dark:text-gray-300">Valor</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                        {products.map((product: any) => {
                          const { bestSupplierId } = getBestPriceInfoForProduct(product.product_id);
                          const selectedSupplierId = productSelections[product.product_id];
                          const selectedValue = selectedSupplierId ? getSupplierProductValue(selectedSupplierId, product.product_id) : 0;
                          const isBest = selectedSupplierId === bestSupplierId;

                          return (
                            <tr key={product.product_id} className={cn("hover:bg-gray-50 dark:hover:bg-gray-800/50", isBest && "bg-green-50/50 dark:bg-green-900/10")}>
                              <td className="px-2 sm:px-4 py-2 sm:py-3">
                                <p className="font-medium text-xs sm:text-sm text-gray-900 dark:text-white truncate max-w-[100px] sm:max-w-[150px]" title={safeStr(product.product_name)}>{safeStr(product.product_name)}</p>
                              </td>
                              <td className="px-2 sm:px-4 py-2 sm:py-3">
                                <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">{safeStr(product.quantidade)} {safeStr(product.unidade)}</span>
                              </td>
                              <td className="px-2 sm:px-4 py-2 sm:py-3">
                                <Select value={selectedSupplierId || ""} onValueChange={(value) => setProductSelections(prev => ({ ...prev, [product.product_id]: value }))}>
                                  <SelectTrigger className="w-[160px] sm:w-[220px] h-9 bg-white dark:bg-gray-800 text-sm">
                                    <SelectValue placeholder="Selecione..." />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {fornecedores.filter(f => getSupplierProductValue(f.id, product.product_id) > 0).map(f => {
                                      const value = getSupplierProductValue(f.id, product.product_id);
                                      const isBestOption = f.id === bestSupplierId;
                                      return (
                                        <SelectItem key={f.id} value={f.id}>
                                          <div className="flex items-center gap-2">
                                            <span className="truncate" style={{ maxWidth: '100px' }} title={safeStr(f.nome)}>{safeStr(f.nome)}</span>
                                            <span className="text-gray-500 text-sm flex-shrink-0">R$ {value.toFixed(2)}</span>
                                            {isBestOption && <Badge className="bg-green-100 text-green-700 text-[10px] px-1.5 flex-shrink-0">Melhor</Badge>}
                                          </div>
                                      </SelectItem>
                                    );
                                  })}
                                </SelectContent>
                              </Select>
                            </td>
                              <td className="px-2 sm:px-4 py-2 sm:py-3 text-right">
                                <span className={cn("font-semibold text-xs sm:text-sm", isBest ? "text-green-600 dark:text-green-400" : "text-gray-900 dark:text-white")}>
                                  R$ {selectedValue.toFixed(2)}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </Card>

                {/* Pedidos que serão gerados */}
                {supplierGroups.length > 0 && (
                  <Card className="border-gray-200 dark:border-gray-700">
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                      <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <ShoppingCart className="h-4 w-4" />
                        {supplierGroups.length === 1 ? "Pedido que será gerado" : `${supplierGroups.length} pedidos que serão gerados`}
                      </h3>
                    </div>
                    <div className="divide-y divide-gray-100 dark:divide-gray-700">
                      {supplierGroups.map((group, index) => (
                        <div key={group.supplierId} className="p-4">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 flex-shrink-0">Pedido {index + 1}</Badge>
                              <span className="font-semibold text-gray-900 dark:text-white truncate" style={{ maxWidth: '200px' }} title={group.supplierName}>{group.supplierName}</span>
                            </div>
                            <span className="font-bold text-green-600 dark:text-green-400 flex-shrink-0">
                              R$ {group.products.reduce((sum: number, p: any) => sum + p.value, 0).toFixed(2)}
                            </span>
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                            {group.products.map((p: any) => safeStr(p.product_name)).join(", ")}
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}

                {/* Data de entrega e observações */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Data de Entrega *</label>
                    <Input type="date" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} className="bg-white dark:bg-gray-800" min={new Date().toISOString().split('T')[0]} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Observações</label>
                    <Input value={observations} onChange={(e) => setObservations(e.target.value)} placeholder="Opcional..." className="bg-white dark:bg-gray-800" />
                  </div>
                </div>

                {/* Botão de converter */}
                <Button onClick={handleConvertToOrder} disabled={!deliveryDate || Object.keys(productSelections).length === 0} className="w-full bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white h-12 text-base">
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  {supplierGroups.length > 1 ? `Gerar ${supplierGroups.length} Pedidos` : "Converter em Pedido"}
                </Button>
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <div className="flex-shrink-0 px-5 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="border-gray-300 dark:border-gray-600">Fechar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
