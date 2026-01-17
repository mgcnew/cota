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
  const [pedidoSubTab, setPedidoSubTab] = useState("melhores");
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
      <DialogContent className="max-w-5xl w-[95vw] sm:w-[90vw] h-[90vh] max-h-[850px] p-0 overflow-hidden !bg-white/80 dark:!bg-gray-950/80 backdrop-blur-xl border-white/20 dark:border-white/10 flex flex-col shadow-2xl">
        {/* Header */}
        <DialogHeader className="flex-shrink-0 px-5 py-4 border-b border-white/10 dark:border-white/5 bg-white/20 dark:bg-white/5 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                <ClipboardList className="h-5 w-5 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-foreground">
                  Gerenciar Cotação
                </DialogTitle>
                <p className="text-sm text-muted-foreground truncate max-w-[350px] font-medium opacity-80">
                  #{safeStr(quote.id).substring(0, 8)} • {safeStr(quote.produto)}
                </p>
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* Tabs - Ordem por produtividade */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-shrink-0 mx-4 mt-3">
            <TabsList className="w-full h-11 p-1 bg-white/40 dark:bg-gray-950/40 backdrop-blur-md rounded-xl border border-white/20 dark:border-white/10 grid grid-cols-5 gap-1">
              <TabsTrigger 
                value="resumo" 
                className="h-9 px-2 uppercase tracking-wide text-[11px] font-medium rounded-lg transition-all data-[state=active]:bg-white/90 dark:data-[state=active]:bg-gray-700/90 data-[state=active]:backdrop-blur-sm data-[state=active]:shadow-sm text-teal-900/70 dark:text-teal-100/70 data-[state=active]:text-teal-900 dark:data-[state=active]:text-teal-100 hover:bg-white/30 dark:hover:bg-gray-800/30"
              >
                <Trophy className="h-3.5 w-3.5 mr-1.5" />Resumo
              </TabsTrigger>
              <TabsTrigger 
                value="valores" 
                className="h-9 px-2 uppercase tracking-wide text-[11px] font-medium rounded-lg transition-all data-[state=active]:bg-white/90 dark:data-[state=active]:bg-gray-700/90 data-[state=active]:backdrop-blur-sm data-[state=active]:shadow-sm text-teal-900/70 dark:text-teal-100/70 data-[state=active]:text-teal-900 dark:data-[state=active]:text-teal-100 hover:bg-white/30 dark:hover:bg-gray-800/30"
              >
                <DollarSign className="h-3.5 w-3.5 mr-1.5" />Valores
              </TabsTrigger>
              <TabsTrigger 
                value="converter" 
                className="h-9 px-2 uppercase tracking-wide text-[11px] font-medium rounded-lg transition-all data-[state=active]:bg-white/90 dark:data-[state=active]:bg-gray-700/90 data-[state=active]:backdrop-blur-sm data-[state=active]:shadow-sm text-teal-900/70 dark:text-teal-100/70 data-[state=active]:text-teal-900 dark:data-[state=active]:text-teal-100 hover:bg-white/30 dark:hover:bg-gray-800/30"
              >
                <ShoppingCart className="h-3.5 w-3.5 mr-1.5" />Pedido
              </TabsTrigger>
              <TabsTrigger 
                value="editar" 
                className="h-9 px-2 uppercase tracking-wide text-[11px] font-medium rounded-lg transition-all data-[state=active]:bg-white/90 dark:data-[state=active]:bg-gray-700/90 data-[state=active]:backdrop-blur-sm data-[state=active]:shadow-sm text-teal-900/70 dark:text-teal-100/70 data-[state=active]:text-teal-900 dark:data-[state=active]:text-teal-100 hover:bg-white/30 dark:hover:bg-gray-800/30"
              >
                <Settings className="h-3.5 w-3.5 mr-1.5" />Editar
              </TabsTrigger>
              <TabsTrigger 
                value="detalhes" 
                className="h-9 px-2 uppercase tracking-wide text-[11px] font-medium rounded-lg transition-all data-[state=active]:bg-white/90 dark:data-[state=active]:bg-gray-700/90 data-[state=active]:backdrop-blur-sm data-[state=active]:shadow-sm text-teal-900/70 dark:text-teal-100/70 data-[state=active]:text-teal-900 dark:data-[state=active]:text-teal-100 hover:bg-white/30 dark:hover:bg-gray-800/30"
              >
                <FileText className="h-3.5 w-3.5 mr-1.5" />Info
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Tab Resumo Geral */}
          <TabsContent value="resumo" className="flex-1 overflow-auto m-0 p-0">
            <ScrollArea className="h-full">
              <div className="p-5 space-y-5">
                {/* Tabela de Preços por Produto */}
                <div>
                  <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                    <Package className="h-4 w-4 text-primary" />
                    Melhor Preço por Produto
                  </h3>
                  <Card className="overflow-hidden border-white/20 dark:border-white/10 bg-white/40 dark:bg-gray-950/40 backdrop-blur-md shadow-sm">
                    <div className="divide-y divide-white/10 dark:divide-white/5">
                      {productPricesData.map((item) => (
                        <div key={item.productId} className="p-4 hover:bg-white/10 dark:hover:bg-white/5 transition-colors">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-sm text-foreground truncate">
                                {safeStr(item.productName)}
                              </p>
                              <p className="text-xs text-foreground/70 mt-1 font-medium">
                                {safeStr(item.quantidade)} {safeStr(item.unidade)}
                              </p>
                            </div>
                            <div className="text-right flex-shrink-0">
                              {item.bestPrice > 0 ? (
                                <>
                                  <div className="flex items-center gap-2 justify-end">
                                    <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                                    <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                                      R$ {item.bestPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </span>
                                  </div>
                                  <p className="text-sm text-foreground mt-1 font-bold">
                                    {safeStr(item.bestSupplierName)}
                                  </p>
                                  {item.savings > 0 && (
                                    <Badge className="mt-2 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20 font-bold uppercase tracking-tighter text-[10px]">
                                      <TrendingDown className="h-3 w-3 mr-1" />
                                      Economia: R$ {item.savings.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </Badge>
                                  )}
                                </>
                              ) : (
                                <Badge variant="outline" className="text-foreground/50 font-bold border-foreground/20 uppercase tracking-tighter text-[10px]">Sem preço</Badge>
                                )}
                              </div>
                            </div>
                            {item.allPrices.length > 1 && (
                              <div className="mt-3 flex flex-wrap gap-2">
                                {item.allPrices.map((price, idx) => (
                                  <Badge
                                    key={idx}
                                    variant={idx === 0 ? "default" : "outline"}
                                    className={cn(
                                      "text-[10px] font-bold uppercase tracking-tighter",
                                      idx === 0
                                        ? "bg-emerald-600 dark:bg-emerald-500 text-white border-none shadow-sm"
                                        : "text-foreground/60 border-white/20 dark:border-white/10 bg-white/5 dark:bg-white/5"
                                    )}
                                  >
                                    {safeStr(price.nome)}: R$ {price.value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
              <div className="p-5 space-y-5">
                {/* Seção Produtos */}
                <Card className="border-white/20 dark:border-gray-800/50 bg-white/40 dark:bg-gray-900/40 backdrop-blur-md overflow-hidden">
                  <div className="p-4 border-b border-white/10 dark:border-gray-800/30 bg-white/20 dark:bg-gray-800/20">
                    <h3 className="font-medium text-foreground flex items-center gap-2">
                      <Package className="h-4 w-4 text-primary" />
                      Produtos ({products.length})
                    </h3>
                  </div>
                  
                  {/* Adicionar Produto */}
                  {productsNotInQuote.length > 0 && onAddQuoteItem && (
                    <div className="p-4 border-b border-white/10 dark:border-gray-800/30 bg-primary/5 backdrop-blur-sm">
                      <div className="flex flex-col sm:flex-row gap-3">
                        <Select value={selectedProductToAdd} onValueChange={setSelectedProductToAdd}>
                          <SelectTrigger className="flex-1 bg-white/40 dark:bg-gray-800/40 border-white/20 dark:border-gray-700/50 backdrop-blur-sm font-normal">
                            <SelectValue placeholder="Selecione um produto..." />
                          </SelectTrigger>
                          <SelectContent className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl">
                            {productsNotInQuote.map(p => (
                              <SelectItem key={p.id} value={p.id} className="font-normal">{p.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Input 
                          type="number" 
                          min="1" 
                          value={productQuantity} 
                          onChange={(e) => setProductQuantity(e.target.value)}
                          placeholder="Qtd"
                          className="w-20 bg-white/40 dark:bg-gray-800/40 border-white/20 dark:border-gray-700/50 backdrop-blur-sm font-normal"
                        />
                        <Select value={productUnit} onValueChange={setProductUnit}>
                          <SelectTrigger className="w-[100px] bg-white/40 dark:bg-gray-800/40 border-white/20 dark:border-gray-700/50 backdrop-blur-sm font-normal">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl">
                            {unidadesMedida.map(u => (
                              <SelectItem key={u.value} value={u.value} className="font-normal">{u.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button 
                          onClick={handleAddProduct} 
                          disabled={!selectedProductToAdd}
                          className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
                        >
                          <Plus className="h-4 w-4 mr-2" />Adicionar
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  {/* Lista de Produtos */}
                  <div className="divide-y divide-white/10 dark:divide-gray-800/30">
                    {products.length === 0 ? (
                      <div className="p-8 text-center text-muted-foreground">
                        <Package className="h-12 w-12 mx-auto mb-3 opacity-30" />
                        <p className="font-normal">Nenhum produto na cotação</p>
                      </div>
                    ) : (
                      products.map((product: any, index: number) => (
                        <div key={product.product_id} className="p-3 flex items-center justify-between hover:bg-white/20 dark:hover:bg-gray-800/20 transition-colors">
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <span className="text-xs text-muted-foreground w-6 flex-shrink-0 font-normal">{index + 1}.</span>
                            <div className="min-w-0 flex-1">
                              <span className="font-medium text-sm text-foreground truncate block" title={safeStr(product.product_name)}>
                                {safeStr(product.product_name)}
                              </span>
                              <span className="text-xs text-muted-foreground font-normal">{safeStr(product.quantidade)} {safeStr(product.unidade)}</span>
                            </div>
                          </div>
                          {onRemoveQuoteItem && products.length > 1 && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleRemoveProduct(product.product_id)}
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
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
                <Card className="border-white/20 dark:border-gray-800/50 bg-white/40 dark:bg-gray-900/40 backdrop-blur-md overflow-hidden">
                  <div className="p-4 border-b border-white/10 dark:border-gray-800/30 bg-white/20 dark:bg-gray-800/20">
                    <h3 className="font-medium text-foreground flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-info" />
                      Fornecedores ({fornecedores.length})
                    </h3>
                  </div>
                  
                  {/* Adicionar Fornecedor */}
                  {suppliersNotInQuote.length > 0 && onAddQuoteSupplier && (
                    <div className="p-4 border-b border-white/10 dark:border-gray-800/30 bg-info/5 backdrop-blur-sm">
                      <div className="flex flex-col sm:flex-row gap-3">
                        <Select value={selectedSupplierToAdd} onValueChange={setSelectedSupplierToAdd}>
                          <SelectTrigger className="flex-1 bg-white/40 dark:bg-gray-800/40 border-white/20 dark:border-gray-700/50 backdrop-blur-sm font-normal">
                            <SelectValue placeholder="Selecione um fornecedor..." />
                          </SelectTrigger>
                          <SelectContent className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl">
                            {suppliersNotInQuote.map(s => (
                              <SelectItem key={s.id} value={s.id} className="font-normal">{s.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button 
                          onClick={handleAddSupplier} 
                          disabled={!selectedSupplierToAdd}
                          className="bg-info hover:bg-info/90 text-white font-medium"
                        >
                          <Plus className="h-4 w-4 mr-2" />Adicionar
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  {/* Lista de Fornecedores */}
                  <div className="divide-y divide-white/10 dark:divide-gray-800/30">
                    {fornecedores.length === 0 ? (
                      <div className="p-8 text-center text-muted-foreground">
                        <Building2 className="h-12 w-12 mx-auto mb-3 opacity-30" />
                        <p className="font-normal">Nenhum fornecedor na cotação</p>
                      </div>
                    ) : (
                      fornecedores.map((fornecedor) => (
                        <div key={fornecedor.id} className="p-3 flex items-center justify-between hover:bg-white/20 dark:hover:bg-gray-800/20 transition-colors">
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className={cn("w-2.5 h-2.5 rounded-full flex-shrink-0", fornecedor.status === 'respondido' ? "bg-success" : "bg-warning")} />
                            <div className="min-w-0 flex-1">
                              <span className="font-medium text-sm text-foreground truncate block" title={safeStr(fornecedor.nome)}>
                                {safeStr(fornecedor.nome)}
                              </span>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className={cn("text-xs font-normal", 
                                  fornecedor.status === 'respondido' 
                                    ? "bg-success/10 text-success border-success/20" 
                                    : "bg-warning/10 text-warning border-warning/20"
                                )}>
                                  {fornecedor.status === 'respondido' ? 'Respondido' : 'Pendente'}
                                </Badge>
                                {fornecedor.valorOferecido > 0 && (
                                  <span className="text-sm text-success font-medium">R$ {fornecedor.valorOferecido.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                )}
                              </div>
                            </div>
                          </div>
                          {onRemoveQuoteSupplier && fornecedores.length > 1 && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleRemoveSupplier(fornecedor.id)}
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
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
                <Card className="p-4 bg-warning/10 border-warning/20">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Atenção</p>
                      <p className="text-sm text-muted-foreground mt-1 font-normal">
                        Ao remover um produto ou fornecedor, os valores já cadastrados serão perdidos.
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
              <div className="p-5 space-y-5">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <Card className="p-4 bg-primary/10 border-white/20 dark:border-white/10 backdrop-blur-md shadow-sm">
                    <div className="flex items-center gap-2 mb-2"><Package className="h-4 w-4 text-primary" /><span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider opacity-70">Produtos</span></div>
                    <p className="text-2xl font-bold text-foreground">{stats.totalProdutos}</p>
                  </Card>
                  <Card className="p-4 bg-info/10 border-white/20 dark:border-white/10 backdrop-blur-md shadow-sm">
                    <div className="flex items-center gap-2 mb-2"><Users className="h-4 w-4 text-info" /><span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider opacity-70">Fornecedores</span></div>
                    <p className="text-2xl font-bold text-foreground">{stats.fornecedoresRespondidos}/{stats.totalFornecedores}</p>
                  </Card>
                  <Card className="p-4 bg-success/10 border-white/20 dark:border-white/10 backdrop-blur-md shadow-sm">
                    <div className="flex items-center gap-2 mb-2"><DollarSign className="h-4 w-4 text-success" /><span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider opacity-70">Melhor Valor</span></div>
                    <p className="text-2xl font-bold text-success">R$ {stats.melhorValor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                  </Card>
                  <Card className="p-4 bg-warning/10 border-white/20 dark:border-white/10 backdrop-blur-md relative overflow-hidden group cursor-pointer hover:bg-warning/20 transition-colors shadow-sm" onClick={() => setActiveTab("exportar")}>
                    <div className="flex items-center gap-2 mb-2"><Download className="h-4 w-4 text-warning" /><span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider opacity-70">Exportar</span></div>
                    <div className="flex flex-col">
                        <span className="text-sm font-bold text-foreground">Relatório</span>
                        <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-tighter">Clique para baixar</span>
                    </div>
                    <div className="absolute right-[-10px] bottom-[-10px] opacity-10 group-hover:opacity-20 transition-opacity">
                        <Download className="h-16 w-16 text-warning" />
                    </div>
                  </Card>
                </div>

                <Card className="border-white/20 dark:border-white/10 bg-white/40 dark:bg-gray-900/40 backdrop-blur-md shadow-sm overflow-hidden">
                  <div className="p-3 border-b border-white/10 dark:border-white/5 bg-white/10 dark:bg-white/5">
                    <h3 className="font-bold text-foreground flex items-center gap-2 text-sm"><Package className="h-4 w-4 text-primary" />Produtos</h3>
                  </div>
                  <div className="divide-y divide-white/5 dark:divide-white/5">
                    {products.map((product: any, index: number) => (
                      <div key={product.product_id} className="p-3 flex items-center justify-between hover:bg-white/10 dark:hover:bg-white/5 transition-colors">
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] font-bold text-muted-foreground w-6 tracking-tighter">{String(index + 1).padStart(2, '0')}</span>
                          <span className="font-semibold text-sm text-foreground">{safeStr(product.product_name)}</span>
                        </div>
                        <Badge variant="outline" className="text-muted-foreground border-white/20 dark:border-white/10 bg-white/5 dark:bg-white/5 font-bold uppercase tracking-tighter text-[9px]">{safeStr(product.quantidade)} {safeStr(product.unidade)}</Badge>
                      </div>
                    ))}
                  </div>
                </Card>

                <Card className="border-white/20 dark:border-white/10 bg-white/40 dark:bg-gray-900/40 backdrop-blur-md shadow-sm overflow-hidden">
                  <div className="p-3 border-b border-white/10 dark:border-white/5 bg-white/10 dark:bg-white/5">
                    <h3 className="font-bold text-foreground flex items-center gap-2 text-sm"><Building2 className="h-4 w-4 text-info" />Fornecedores</h3>
                  </div>
                  <div className="divide-y divide-white/5 dark:divide-white/5">
                    {fornecedores.map((fornecedor) => (
                      <div key={fornecedor.id} className="p-3 flex items-center justify-between hover:bg-white/10 dark:hover:bg-white/5 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className={cn("w-2 h-2 rounded-full", fornecedor.status === 'respondido' ? "bg-green-500" : "bg-amber-500")} />
                          <span className="font-semibold text-sm text-foreground">{safeStr(fornecedor.nome)}</span>
                          <Badge variant="outline" className={cn("text-[9px] h-4 font-bold uppercase tracking-tighter", fornecedor.status === 'respondido' ? "bg-green-500/10 text-green-600 border-green-500/20" : "bg-amber-500/10 text-amber-600 border-amber-500/20")}>
                            {fornecedor.status === 'respondido' ? 'Respondido' : 'Pendente'}
                          </Badge>
                        </div>
                        {fornecedor.valorOferecido > 0 && <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">R$ {fornecedor.valorOferecido.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>}
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
              <div className="w-full lg:w-56 xl:w-64 flex-shrink-0 border-b lg:border-b-0 lg:border-r border-white/10 dark:border-white/5 bg-white/20 dark:bg-gray-950/20 backdrop-blur-md flex flex-col">
                <div className="p-3 border-b border-white/10 dark:border-white/5">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-primary" />
                    <span className="text-xs font-bold text-foreground uppercase tracking-wider opacity-70">Fornecedores</span>
                  </div>
                </div>
                <ScrollArea className="flex-1 max-h-[100px] lg:max-h-none">
                  <div className="p-2 flex lg:flex-col gap-1.5 overflow-x-auto lg:overflow-x-visible">
                    {fornecedores.map((fornecedor) => {
                      const total = calcularTotalFornecedor(fornecedor.id);
                      const isSelected = selectedSupplier === fornecedor.id;
                      return (
                        <button 
                          key={fornecedor.id} 
                          onClick={() => { setSelectedSupplier(fornecedor.id); setEditingProductId(null); setEditedValues({}); }}
                          className={cn(
                            "flex-shrink-0 lg:w-full text-left px-3 py-2.5 rounded-xl transition-all",
                            "min-w-[140px] lg:min-w-0",
                            isSelected 
                              ? "bg-primary/10 border border-primary/20 shadow-sm backdrop-blur-md" 
                              : "hover:bg-white/10 dark:hover:bg-white/5 border border-transparent"
                          )}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <div className={cn("w-2 h-2 rounded-full flex-shrink-0", fornecedor.status === 'respondido' ? "bg-green-500" : "bg-amber-500")} />
                            <span 
                              className={cn(
                                "text-sm truncate block",
                                isSelected ? "text-primary font-bold" : "text-foreground font-semibold"
                              )} 
                              title={safeStr(fornecedor.nome)}
                              style={{ maxWidth: '140px' }}
                            >
                              {safeStr(fornecedor.nome)}
                            </span>
                          </div>
                          <div className="mt-1 ml-4 flex items-center gap-2">
                            <span className={cn("text-[11px]", isSelected ? "text-primary font-bold" : "text-muted-foreground font-medium")}>
                              R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                            {fornecedor.status === 'respondido' && (
                              <Badge variant="outline" className="text-[8px] px-1 py-0 h-3.5 bg-green-500/10 text-green-600 border-green-500/20 font-bold uppercase tracking-tighter">
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
              <div className="flex-1 flex flex-col overflow-hidden min-w-0 bg-white/5 dark:bg-black/5">
                {selectedSupplier ? (
                  <>
                    {/* Header do Fornecedor Selecionado */}
                    <div className="flex-shrink-0 px-4 py-3 border-b border-white/10 dark:border-white/5 bg-white/30 dark:bg-white/5 backdrop-blur-md flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
                          <DollarSign className="h-4 w-4 text-primary" />
                        </div>
                        <span 
                          className="font-bold text-foreground truncate text-sm" 
                          title={fornecedores.find(f => f.id === selectedSupplier)?.nome}
                          style={{ maxWidth: '200px' }}
                        >
                          {fornecedores.find(f => f.id === selectedSupplier)?.nome}
                        </span>
                      </div>
                      <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 flex-shrink-0 text-sm font-bold shadow-sm">
                        Total: R$ {calcularTotalFornecedor(selectedSupplier).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </Badge>
                    </div>
                    
                    {/* Tabela de Produtos */}
                    <ScrollArea className="flex-1">
                      <div className="min-w-[350px] p-4">
                        <Card className="border-white/20 dark:border-white/10 bg-white/40 dark:bg-gray-950/40 backdrop-blur-md shadow-sm overflow-hidden">
                          <table className="w-full border-collapse">
                            <thead className="bg-white/10 dark:bg-white/5 backdrop-blur-md border-b border-white/10 dark:border-white/5 sticky top-0 z-10">
                              <tr>
                                <th className="px-4 py-3 text-left text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Produto</th>
                                <th className="px-4 py-3 text-left text-[10px] font-bold text-muted-foreground uppercase tracking-widest hidden sm:table-cell">Qtd</th>
                                <th className="px-4 py-3 text-left text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Valor (R$)</th>
                                <th className="px-4 py-3 text-center text-[10px] font-bold text-muted-foreground uppercase tracking-widest w-16">Ação</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5 dark:divide-white/5">
                              {products.map((product: any) => {
                                const currentValue = getCurrentProductValue(selectedSupplier, product.product_id);
                                const isEditing = editingProductId === product.product_id;
                                const { bestSupplierId } = getBestPriceInfoForProduct(product.product_id);
                                const isBestPrice = currentValue > 0 && selectedSupplier === bestSupplierId;
                                return (
                                  <tr key={product.product_id} className={cn("hover:bg-white/10 dark:hover:bg-white/5 transition-colors", isBestPrice && "bg-emerald-500/5 dark:bg-emerald-500/10")}>
                                    <td className="px-4 py-3">
                                      <div className="flex items-center gap-1">
                                        <p className="font-bold text-sm text-foreground truncate" style={{ maxWidth: '160px' }} title={safeStr(product.product_name)}>
                                          {safeStr(product.product_name)}
                                        </p>
                                        <ProductPriceInfoTooltip 
                                          productId={product.product_id} 
                                          productName={safeStr(product.product_name)} 
                                        />
                                      </div>
                                      <p className="text-[10px] text-muted-foreground sm:hidden mt-0.5 font-bold uppercase tracking-tighter">
                                        {safeStr(product.quantidade)} {safeStr(product.unidade)}
                                      </p>
                                    </td>
                                    <td className="px-4 py-3 hidden sm:table-cell">
                                      <span className="text-xs text-muted-foreground font-bold uppercase tracking-tighter">{safeStr(product.quantidade)} {safeStr(product.unidade)}</span>
                                    </td>
                                    <td className="px-4 py-3">
                                      {isEditing ? (
                                        <div className="flex flex-col gap-2 py-1">
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
                                              className="w-20 sm:w-24 h-8 text-sm bg-white/20 dark:bg-white/5 border-primary/30 focus:ring-primary font-bold" 
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
                                              <SelectTrigger className="w-[90px] h-8 text-xs border-primary/30 bg-white/20 dark:bg-white/5 font-bold">
                                                <SelectValue />
                                              </SelectTrigger>
                                              <SelectContent className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl">
                                                {PRICING_UNIT_OPTIONS.map((option) => (
                                                  <SelectItem key={option.value} value={option.value} className="text-xs font-bold">
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
                                            <div className="flex gap-1">
                                              <Button 
                                                size="sm" 
                                                onClick={() => handleSaveEdit(product.product_id)} 
                                                disabled={isConversionFactorRequired(product.product_id) && !editedPricingMetadata[product.product_id]?.fatorConversao}
                                                className="h-8 w-8 p-0 bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-50 shadow-sm"
                                              >
                                                <Check className="h-4 w-4" />
                                              </Button>
                                              <Button size="sm" variant="outline" onClick={handleCancelEdit} className="h-8 w-8 p-0 border-destructive/30 text-destructive hover:bg-destructive/10 font-bold">
                                                <X className="h-4 w-4" />
                                              </Button>
                                            </div>
                                          </div>
                                          {/* Row 2: Conversion factor input (conditional) - Requirements: 1.2, 1.5 */}
                                          {isConversionFactorRequired(product.product_id) && (
                                            <div className="flex items-center gap-1.5 pl-0.5 animate-in fade-in slide-in-from-left-1">
                                              <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-tighter">Qtd por embalagem:</span>
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
                                                  "w-16 h-7 text-xs rounded-md bg-white/20 dark:bg-white/5 font-bold",
                                                  !editedPricingMetadata[product.product_id]?.fatorConversao ? "border-destructive/50" : "border-border"
                                                )}
                                                step="1"
                                                min="1"
                                                placeholder="Ex: 12"
                                              />
                                              <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-tighter">
                                                {editedPricingMetadata[product.product_id]?.unidadePreco === "cx" ? "un/cx" : "un/pct"}
                                              </span>
                                              {!editedPricingMetadata[product.product_id]?.fatorConversao && (
                                                <span className="text-[9px] text-destructive font-bold uppercase tracking-tighter animate-pulse">* obrigatório</span>
                                              )}
                                            </div>
                                          )}
                                        </div>
                                      ) : (
                                        <div className="flex items-center gap-2 flex-wrap">
                                          <span className={cn("font-bold text-sm", isBestPrice ? "text-emerald-600 dark:text-emerald-400" : "text-foreground")}>
                                            {formatPriceWithUnit(currentValue, product.product_id)}
                                          </span>
                                          {isBestPrice && (
                                            <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[9px] px-1.5 py-0 h-4.5 font-bold uppercase tracking-tighter">
                                              <TrendingDown className="h-2.5 w-2.5 mr-0.5" />Melhor
                                            </Badge>
                                          )}
                                        </div>
                                      )}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                      {!isEditing && (
                                        <Button 
                                          size="sm" 
                                          variant="ghost" 
                                          onClick={() => {
                                            const currentMetadata = getSupplierItemPricingMetadata(selectedSupplier, product.product_id);
                                            handleStartEdit(product.product_id, currentValue, currentMetadata);
                                          }} 
                                          className="h-8 w-8 p-0 text-primary hover:bg-primary/10 rounded-full"
                                        >
                                          <Edit2 className="h-3.5 w-3.5" />
                                        </Button>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </Card>
                      </div>
                    </ScrollArea>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-muted-foreground p-8">
                    <div className="text-center animate-in fade-in zoom-in-95 duration-500">
                      <div className="w-20 h-20 rounded-full bg-white/10 dark:bg-white/5 border border-white/10 dark:border-white/5 flex items-center justify-center mx-auto mb-4 backdrop-blur-md shadow-xl">
                        <Building2 className="h-10 w-10 text-primary/40" />
                      </div>
                      <p className="text-lg font-bold text-foreground uppercase tracking-widest opacity-80">Selecione um fornecedor</p>
                      <p className="text-sm mt-2 font-medium opacity-60">Escolha um fornecedor na lista lateral para visualizar e editar os valores oferecidos</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Tab Converter em Pedido */}
          <TabsContent value="converter" className="flex-1 overflow-hidden m-0 p-0">
            <ScrollArea className="h-full">
              <div className="p-5 space-y-5">
                {/* Resumo */}
                <div className="grid grid-cols-2 gap-3">
                  <Card className="p-4 bg-white/40 dark:bg-gray-900/40 border-white/20 dark:border-white/10 backdrop-blur-md shadow-sm">
                    <div className="flex items-center gap-2 mb-2"><DollarSign className="h-4 w-4 text-info" /><span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider opacity-70">Total Selecionado</span></div>
                    <p className="text-2xl font-bold text-foreground">R$ {totalSelecao.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                  </Card>
                  <Card className="p-4 bg-white/40 dark:bg-gray-900/40 border-white/20 dark:border-white/10 backdrop-blur-md shadow-sm">
                    <div className="flex items-center gap-2 mb-2"><Award className="h-4 w-4 text-success" /><span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider opacity-70">Melhor Total</span></div>
                    <p className="text-2xl font-bold text-success">R$ {melhorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                  </Card>
                </div>

                {/* Sub-abas de seleção */}
                <div className="flex justify-end">
                  <Tabs value={pedidoSubTab} onValueChange={(val) => {
                    setPedidoSubTab(val);
                    if (val === "melhores") {
                      const bestSelections: Record<string, string> = {};
                      products.forEach((product: any) => {
                        const { bestSupplierId } = getBestPriceInfoForProduct(product.product_id);
                        if (bestSupplierId) bestSelections[product.product_id] = bestSupplierId;
                      });
                      setProductSelections(bestSelections);
                    } else if (val === "unico") {
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
                      }
                    }
                  }}>
                    <TabsList className="h-10 p-1 bg-white/40 dark:bg-gray-950/40 backdrop-blur-md rounded-xl border border-white/20 dark:border-white/10 gap-1">
                      <TabsTrigger value="melhores" className="h-8 px-3 text-[10px] uppercase tracking-wide font-bold rounded-lg data-[state=active]:bg-white/90 dark:data-[state=active]:bg-gray-700/90 text-success/80 data-[state=active]:text-success hover:bg-white/30 dark:hover:bg-gray-800/30 transition-all">
                        <Award className="h-3.5 w-3.5 mr-1.5" /> Melhores Preços
                      </TabsTrigger>
                      <TabsTrigger value="unico" className="h-8 px-3 text-[10px] uppercase tracking-wide font-bold rounded-lg data-[state=active]:bg-white/90 dark:data-[state=active]:bg-gray-700/90 text-info/80 data-[state=active]:text-info hover:bg-white/30 dark:hover:bg-gray-800/30 transition-all">
                        <Building2 className="h-3.5 w-3.5 mr-1.5" /> Fornecedor Único
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>

                {totalSelecao > melhorTotal && (
                  <Card className="p-3 bg-white/40 dark:bg-gray-900/40 border-white/20 dark:border-gray-800/50 backdrop-blur-md">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-warning" />
                      <span className="text-sm text-foreground font-normal">
                        Economize R$ {(totalSelecao - melhorTotal).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} selecionando os melhores preços
                      </span>
                    </div>
                  </Card>
                )}

                {/* Tabela de seleção */}
                <Card className="border-white/20 dark:border-gray-800/50 bg-white/40 dark:bg-gray-900/40 backdrop-blur-md overflow-hidden">
                  <div className="p-3 border-b border-white/10 dark:border-gray-800/30 bg-white/20 dark:bg-gray-800/20">
                    <h3 className="font-medium text-foreground flex items-center gap-2 text-sm">
                      <Package className="h-4 w-4 text-primary" />Selecione o fornecedor para cada produto
                    </h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[450px] border-collapse bg-transparent">
                      <thead className="bg-white/10 dark:bg-gray-800/10 backdrop-blur-md border-b border-white/10 dark:border-gray-800/30 sticky top-0 z-10">
                        <tr>
                          <th className="px-3 py-3 text-left text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Produto</th>
                          <th className="px-3 py-3 text-left text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Qtd</th>
                          <th className="px-3 py-3 text-left text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Fornecedor</th>
                          <th className="px-3 py-3 text-right text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Valor</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/10 dark:divide-gray-800/30">
                        {products.map((product: any) => {
                          const { bestPrice } = getBestPriceInfoForProduct(product.product_id);
                          const selectedSupplierId = productSelections[product.product_id];
                          const selectedValue = selectedSupplierId ? getSupplierProductValue(selectedSupplierId, product.product_id) : 0;
                          const isBest = selectedValue > 0 && Math.abs(selectedValue - bestPrice) < 0.01;

                          return (
                            <tr key={product.product_id} className={cn("hover:bg-white/10 dark:hover:bg-gray-800/10 transition-colors", isBest && "bg-success/5 dark:bg-success/10")}>
                              <td className="px-3 py-3">
                                <p className="font-normal text-sm text-foreground truncate max-w-[100px] sm:max-w-[150px]" title={safeStr(product.product_name)}>{safeStr(product.product_name)}</p>
                              </td>
                              <td className="px-3 py-3">
                                <span className="text-sm text-muted-foreground font-normal">{safeStr(product.quantidade)} {safeStr(product.unidade)}</span>
                              </td>
                              <td className="px-3 py-3">
                                <Select value={selectedSupplierId || ""} onValueChange={(value) => setProductSelections(prev => ({ ...prev, [product.product_id]: value }))}>
                                  <SelectTrigger className="w-[160px] sm:w-[200px] h-8 bg-white/20 dark:bg-gray-800/20 border-white/20 dark:border-gray-700/50 backdrop-blur-sm text-sm font-normal">
                                    <SelectValue placeholder="Selecione..." />
                                  </SelectTrigger>
                                  <SelectContent className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-white/20 dark:border-gray-800/50">
                                    {fornecedores.filter(f => getSupplierProductValue(f.id, product.product_id) > 0).map(f => {
                                      return (
                                        <SelectItem key={f.id} value={f.id} className="text-sm font-normal">
                                          <span className="truncate font-normal" title={safeStr(f.nome)}>{safeStr(f.nome)}</span>
                                      </SelectItem>
                                    );
                                  })}
                                </SelectContent>
                              </Select>
                            </td>
                              <td className="px-3 py-3 text-right">
                                <span className={cn("font-medium text-sm", isBest ? "text-success" : "text-foreground")}>
                                  R$ {selectedValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                  <Card className="border-white/20 dark:border-gray-800/50 bg-white/40 dark:bg-gray-900/40 backdrop-blur-md overflow-hidden">
                    <div className="p-3 border-b border-white/10 dark:border-gray-800/30 bg-white/20 dark:bg-gray-800/20">
                      <h3 className="font-medium text-foreground flex items-center gap-2 text-sm">
                        <ShoppingCart className="h-4 w-4 text-primary" />
                        {supplierGroups.length === 1 ? "Pedido que será gerado" : `${supplierGroups.length} pedidos`}
                      </h3>
                    </div>
                    <div className="divide-y divide-white/10 dark:divide-gray-800/30">
                      {supplierGroups.map((group, index) => (
                        <div key={group.supplierId} className="p-3 hover:bg-white/20 dark:hover:bg-gray-800/20 transition-colors backdrop-blur-sm">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              <Badge variant="outline" className="bg-info/10 text-info border-white/20 dark:border-gray-800/50 backdrop-blur-sm flex-shrink-0 text-[10px] px-1.5 font-normal">#{index + 1}</Badge>
                              <span className="font-medium text-foreground truncate text-sm" style={{ maxWidth: '180px' }} title={group.supplierName}>{group.supplierName}</span>
                            </div>
                            <span className="font-medium text-success flex-shrink-0 text-base">
                              R$ {group.products.reduce((sum: number, p: any) => sum + p.value, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </div>
                          <div className="text-[11px] text-muted-foreground font-normal line-clamp-1">
                            {group.products.map((p: any) => safeStr(p.product_name)).join(", ")}
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}

                {/* Data de entrega e observações */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Data de Entrega *</label>
                    <Input 
                      type="date" 
                      value={deliveryDate} 
                      onChange={(e) => setDeliveryDate(e.target.value)} 
                      className="bg-white/40 dark:bg-gray-900/40 border-white/20 dark:border-gray-800/50 backdrop-blur-md focus:bg-white/60 transition-all shadow-inner font-normal" 
                      min={new Date().toISOString().split('T')[0]} 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Observações</label>
                    <Input 
                      value={observations} 
                      onChange={(e) => setObservations(e.target.value)} 
                      placeholder="Opcional..." 
                      className="bg-white/40 dark:bg-gray-900/40 border-white/20 dark:border-gray-800/50 backdrop-blur-md focus:bg-white/60 transition-all shadow-inner font-normal" 
                    />
                  </div>
                </div>

                {/* Botão de converter */}
                <Button 
                  onClick={handleConvertToOrder} 
                  disabled={!deliveryDate || Object.keys(productSelections).length === 0} 
                  className="w-full bg-primary/90 hover:bg-primary text-primary-foreground h-11 text-base font-medium shadow-lg backdrop-blur-md transition-all"
                >
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  {supplierGroups.length > 1 ? `Gerar ${supplierGroups.length} Pedidos` : "Converter em Pedido"}
                </Button>
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <div className="flex-shrink-0 px-5 py-3 border-t border-white/20 dark:border-gray-800/50 bg-white/40 dark:bg-gray-900/40 backdrop-blur-md flex justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="text-muted-foreground border-white/20 dark:border-gray-800/50 bg-white/20 dark:bg-gray-800/20 hover:bg-white/40 dark:hover:bg-gray-800/40">Fechar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
