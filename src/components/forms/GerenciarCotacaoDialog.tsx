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
      <DialogContent className="max-w-5xl w-[95vw] sm:w-[90vw] h-[90vh] max-h-[850px] p-0 overflow-hidden bg-background flex flex-col">
        {/* Header */}
        <DialogHeader className="flex-shrink-0 px-5 py-4 border-b border-border bg-card">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                <ClipboardList className="h-5 w-5 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-lg font-semibold text-foreground">
                  Gerenciar Cotação
                </DialogTitle>
                <p className="text-sm text-muted-foreground truncate max-w-[350px]">
                  #{safeStr(quote.id).substring(0, 8)} • {safeStr(quote.produto)}
                </p>
              </div>
            </div>
            <Button type="button" variant="ghost" size="icon" onClick={() => onOpenChange(false)} className="h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-accent">
              <X className="h-5 w-5" />
            </Button>
          </div>
        </DialogHeader>

        {/* Tabs - Ordem por produtividade */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="flex-shrink-0 mx-4 mt-3 bg-muted p-1 rounded-lg grid grid-cols-6 h-10">
            <TabsTrigger value="resumo" className="text-xs font-medium text-muted-foreground data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm rounded-md px-2 py-1.5">
              <Trophy className="h-4 w-4 mr-1.5" />Resumo
            </TabsTrigger>
            <TabsTrigger value="valores" className="text-xs font-medium text-muted-foreground data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm rounded-md px-2 py-1.5">
              <DollarSign className="h-4 w-4 mr-1.5" />Valores
            </TabsTrigger>
            <TabsTrigger value="converter" className="text-xs font-medium text-muted-foreground data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm rounded-md px-2 py-1.5">
              <ShoppingCart className="h-4 w-4 mr-1.5" />Pedido
            </TabsTrigger>
            <TabsTrigger value="exportar" className="text-xs font-medium text-muted-foreground data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm rounded-md px-2 py-1.5">
              <Download className="h-4 w-4 mr-1.5" />Export
            </TabsTrigger>
            <TabsTrigger value="editar" className="text-xs font-medium text-muted-foreground data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm rounded-md px-2 py-1.5">
              <Settings className="h-4 w-4 mr-1.5" />Editar
            </TabsTrigger>
            <TabsTrigger value="detalhes" className="text-xs font-medium text-muted-foreground data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm rounded-md px-2 py-1.5">
              <FileText className="h-4 w-4 mr-1.5" />Info
            </TabsTrigger>
          </TabsList>

          {/* Tab Resumo Geral */}
          <TabsContent value="resumo" className="flex-1 overflow-auto m-0 p-0">
            <ScrollArea className="h-full">
              <div className="p-5 space-y-5">
                {/* Tabela de Preços por Produto */}
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                    <Package className="h-4 w-4 text-primary" />
                    Melhor Preço por Produto
                  </h3>
                  <Card className="overflow-hidden border-border">
                    <div className="divide-y divide-border">
                      {productPricesData.map((item) => (
                        <div key={item.productId} className="p-4 hover:bg-accent/50 transition-colors">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm text-foreground truncate">
                                {safeStr(item.productName)}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {safeStr(item.quantidade)} {safeStr(item.unidade)}
                              </p>
                            </div>
                            <div className="text-right flex-shrink-0">
                              {item.bestPrice > 0 ? (
                                <>
                                  <div className="flex items-center gap-2 justify-end">
                                    <Star className="h-4 w-4 text-warning fill-warning" />
                                    <span className="text-lg font-bold text-success">
                                      R$ {item.bestPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </span>
                                  </div>
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {safeStr(item.bestSupplierName)}
                                  </p>
                                  {item.savings > 0 && (
                                    <Badge className="mt-2 bg-success/10 text-success border-success/20">
                                      <TrendingDown className="h-3 w-3 mr-1" />
                                      Economia: R$ {item.savings.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </Badge>
                                  )}
                                </>
                              ) : (
                                <Badge variant="outline" className="text-muted-foreground">Sem preço</Badge>
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
                                      "text-xs",
                                      idx === 0
                                        ? "bg-success text-white"
                                        : "text-muted-foreground border-border"
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
                <Card className="border-border">
                  <div className="p-4 border-b border-border bg-muted/50">
                    <h3 className="font-semibold text-foreground flex items-center gap-2">
                      <Package className="h-4 w-4 text-primary" />
                      Produtos ({products.length})
                    </h3>
                  </div>
                  
                  {/* Adicionar Produto */}
                  {productsNotInQuote.length > 0 && onAddQuoteItem && (
                    <div className="p-4 border-b border-border bg-primary/5">
                      <div className="flex flex-col sm:flex-row gap-3">
                        <Select value={selectedProductToAdd} onValueChange={setSelectedProductToAdd}>
                          <SelectTrigger className="flex-1 bg-card">
                            <SelectValue placeholder="Selecione um produto..." />
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
                          className="w-20 bg-card"
                        />
                        <Select value={productUnit} onValueChange={setProductUnit}>
                          <SelectTrigger className="w-[100px] bg-card">
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
                          className="bg-primary hover:bg-primary/90 text-primary-foreground"
                        >
                          <Plus className="h-4 w-4 mr-2" />Adicionar
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  {/* Lista de Produtos */}
                  <div className="divide-y divide-border">
                    {products.length === 0 ? (
                      <div className="p-8 text-center text-muted-foreground">
                        <Package className="h-12 w-12 mx-auto mb-3 opacity-30" />
                        <p>Nenhum produto na cotação</p>
                      </div>
                    ) : (
                      products.map((product: any, index: number) => (
                        <div key={product.product_id} className="p-3 flex items-center justify-between hover:bg-accent/50 transition-colors">
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <span className="text-xs text-muted-foreground w-6 flex-shrink-0">{index + 1}.</span>
                            <div className="min-w-0 flex-1">
                              <span className="font-medium text-sm text-foreground truncate block" title={safeStr(product.product_name)}>
                                {safeStr(product.product_name)}
                              </span>
                              <span className="text-xs text-muted-foreground">{safeStr(product.quantidade)} {safeStr(product.unidade)}</span>
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
                <Card className="border-border">
                  <div className="p-4 border-b border-border bg-muted/50">
                    <h3 className="font-semibold text-foreground flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-info" />
                      Fornecedores ({fornecedores.length})
                    </h3>
                  </div>
                  
                  {/* Adicionar Fornecedor */}
                  {suppliersNotInQuote.length > 0 && onAddQuoteSupplier && (
                    <div className="p-4 border-b border-border bg-info/5">
                      <div className="flex flex-col sm:flex-row gap-3">
                        <Select value={selectedSupplierToAdd} onValueChange={setSelectedSupplierToAdd}>
                          <SelectTrigger className="flex-1 bg-card">
                            <SelectValue placeholder="Selecione um fornecedor..." />
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
                          className="bg-info hover:bg-info/90 text-white"
                        >
                          <Plus className="h-4 w-4 mr-2" />Adicionar
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  {/* Lista de Fornecedores */}
                  <div className="divide-y divide-border">
                    {fornecedores.length === 0 ? (
                      <div className="p-8 text-center text-muted-foreground">
                        <Building2 className="h-12 w-12 mx-auto mb-3 opacity-30" />
                        <p>Nenhum fornecedor na cotação</p>
                      </div>
                    ) : (
                      fornecedores.map((fornecedor) => (
                        <div key={fornecedor.id} className="p-3 flex items-center justify-between hover:bg-accent/50 transition-colors">
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className={cn("w-2.5 h-2.5 rounded-full flex-shrink-0", fornecedor.status === 'respondido' ? "bg-success" : "bg-warning")} />
                            <div className="min-w-0 flex-1">
                              <span className="font-medium text-sm text-foreground truncate block" title={safeStr(fornecedor.nome)}>
                                {safeStr(fornecedor.nome)}
                              </span>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className={cn("text-xs", 
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
                      <p className="text-sm text-muted-foreground mt-1">
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
                  <Card className="p-4 bg-primary/10 border-primary/20">
                    <div className="flex items-center gap-2 mb-2"><Package className="h-4 w-4 text-primary" /><span className="text-xs font-medium text-muted-foreground uppercase">Produtos</span></div>
                    <p className="text-2xl font-bold text-foreground">{stats.totalProdutos}</p>
                  </Card>
                  <Card className="p-4 bg-info/10 border-info/20">
                    <div className="flex items-center gap-2 mb-2"><Users className="h-4 w-4 text-info" /><span className="text-xs font-medium text-muted-foreground uppercase">Fornecedores</span></div>
                    <p className="text-2xl font-bold text-foreground">{stats.fornecedoresRespondidos}/{stats.totalFornecedores}</p>
                  </Card>
                  <Card className="p-4 bg-success/10 border-success/20">
                    <div className="flex items-center gap-2 mb-2"><DollarSign className="h-4 w-4 text-success" /><span className="text-xs font-medium text-muted-foreground uppercase">Melhor Valor</span></div>
                    <p className="text-2xl font-bold text-success">R$ {stats.melhorValor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                  </Card>
                  <Card className="p-4 bg-warning/10 border-warning/20">
                    <div className="flex items-center gap-2 mb-2"><Calendar className="h-4 w-4 text-warning" /><span className="text-xs font-medium text-muted-foreground uppercase">Período</span></div>
                    <p className="text-sm font-bold text-foreground">{safeStr(quote.dataInicio)}</p>
                    <p className="text-xs text-muted-foreground">até {safeStr(quote.dataFim)}</p>
                  </Card>
                </div>

                <Card className="border-border">
                  <div className="p-4 border-b border-border bg-muted/50">
                    <h3 className="font-semibold text-foreground flex items-center gap-2"><Package className="h-4 w-4 text-primary" />Produtos</h3>
                  </div>
                  <div className="divide-y divide-border">
                    {products.map((product: any, index: number) => (
                      <div key={product.product_id} className="p-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-muted-foreground w-6">{index + 1}.</span>
                          <span className="font-medium text-sm text-foreground">{safeStr(product.product_name)}</span>
                        </div>
                        <Badge variant="outline" className="text-muted-foreground">{safeStr(product.quantidade)} {safeStr(product.unidade)}</Badge>
                      </div>
                    ))}
                  </div>
                </Card>

                <Card className="border-border">
                  <div className="p-4 border-b border-border bg-muted/50">
                    <h3 className="font-semibold text-foreground flex items-center gap-2"><Building2 className="h-4 w-4 text-info" />Fornecedores</h3>
                  </div>
                  <div className="divide-y divide-border">
                    {fornecedores.map((fornecedor) => (
                      <div key={fornecedor.id} className="p-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={cn("w-2.5 h-2.5 rounded-full", fornecedor.status === 'respondido' ? "bg-success" : "bg-warning")} />
                          <span className="font-medium text-sm text-foreground">{safeStr(fornecedor.nome)}</span>
                          <Badge variant="outline" className={cn("text-xs", fornecedor.status === 'respondido' ? "bg-success/10 text-success border-success/20" : "bg-warning/10 text-warning border-warning/20")}>
                            {fornecedor.status === 'respondido' ? 'Respondido' : 'Pendente'}
                          </Badge>
                        </div>
                        {fornecedor.valorOferecido > 0 && <span className="font-semibold text-success">R$ {fornecedor.valorOferecido.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>}
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
              <div className="w-full lg:w-56 xl:w-64 flex-shrink-0 border-b lg:border-b-0 lg:border-r border-border bg-muted/50 flex flex-col">
                <div className="p-3 border-b border-border">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-primary" />
                    <span className="text-sm font-semibold text-foreground">Fornecedores</span>
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
                              ? "bg-primary/10 border border-primary/30 shadow-sm" 
                              : "hover:bg-accent border border-transparent"
                          )}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <div className={cn("w-2.5 h-2.5 rounded-full flex-shrink-0", fornecedor.status === 'respondido' ? "bg-success" : "bg-warning")} />
                            <span 
                              className={cn(
                                "text-sm font-medium truncate block",
                                isSelected ? "text-primary" : "text-foreground"
                              )} 
                              title={safeStr(fornecedor.nome)}
                              style={{ maxWidth: '140px' }}
                            >
                              {safeStr(fornecedor.nome)}
                            </span>
                          </div>
                          <div className="mt-1.5 ml-4.5 flex items-center gap-2">
                            <span className={cn("text-xs font-medium", isSelected ? "text-primary" : "text-muted-foreground")}>
                              R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                            {fornecedor.status === 'respondido' && (
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 bg-success/10 text-success border-success/20">
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
              <div className="flex-1 flex flex-col overflow-hidden min-w-0">
                {selectedSupplier ? (
                  <>
                    {/* Header do Fornecedor Selecionado */}
                    <div className="flex-shrink-0 px-4 py-3 border-b border-border bg-card flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <DollarSign className="h-4 w-4 text-primary flex-shrink-0" />
                        <span 
                          className="font-semibold text-foreground truncate text-sm sm:text-base" 
                          title={fornecedores.find(f => f.id === selectedSupplier)?.nome}
                          style={{ maxWidth: '200px' }}
                        >
                          {fornecedores.find(f => f.id === selectedSupplier)?.nome}
                        </span>
                      </div>
                      <Badge className="bg-success/10 text-success border-success/20 flex-shrink-0 text-sm font-semibold">
                        Total: R$ {calcularTotalFornecedor(selectedSupplier).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </Badge>
                    </div>
                    
                    {/* Tabela de Produtos */}
                    <ScrollArea className="flex-1">
                      <div className="min-w-[350px]">
                        <table className="w-full">
                          <thead className="bg-muted/50 border-b border-border sticky top-0 z-10">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Produto</th>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden sm:table-cell">Qtd</th>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Valor (R$)</th>
                              <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wide w-16">Ação</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border">
                            {products.map((product: any) => {
                              const currentValue = getCurrentProductValue(selectedSupplier, product.product_id);
                              const isEditing = editingProductId === product.product_id;
                              const { bestSupplierId } = getBestPriceInfoForProduct(product.product_id);
                              const isBestPrice = currentValue > 0 && selectedSupplier === bestSupplierId;
                              return (
                                <tr key={product.product_id} className={cn("hover:bg-accent/50 transition-colors", isBestPrice && "bg-success/5")}>
                                  <td className="px-4 py-3">
                                    <div className="flex items-center gap-1">
                                      <p className="font-medium text-sm text-foreground truncate" style={{ maxWidth: '160px' }} title={safeStr(product.product_name)}>
                                        {safeStr(product.product_name)}
                                      </p>
                                      <ProductPriceInfoTooltip 
                                        productId={product.product_id} 
                                        productName={safeStr(product.product_name)} 
                                      />
                                    </div>
                                    <p className="text-xs text-muted-foreground sm:hidden mt-0.5">
                                      {safeStr(product.quantidade)} {safeStr(product.unidade)}
                                    </p>
                                  </td>
                                  <td className="px-4 py-3 hidden sm:table-cell">
                                    <span className="text-sm text-muted-foreground">{safeStr(product.quantidade)} {safeStr(product.unidade)}</span>
                                  </td>
                                  <td className="px-4 py-3">
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
                                            className="w-20 sm:w-24 h-8 text-sm bg-card border-primary/30 focus:ring-primary" 
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
                                            <SelectTrigger className="w-[90px] h-8 text-xs border-primary/30">
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
                                              className="h-8 w-8 p-0 bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-50"
                                            >
                                              <Check className="h-4 w-4" />
                                            </Button>
                                            <Button size="sm" variant="outline" onClick={handleCancelEdit} className="h-8 w-8 p-0 border-destructive/30 text-destructive hover:bg-destructive/10">
                                              <X className="h-4 w-4" />
                                            </Button>
                                          </div>
                                        </div>
                                        {/* Row 2: Conversion factor input (conditional) - Requirements: 1.2, 1.5 */}
                                        {isConversionFactorRequired(product.product_id) && (
                                          <div className="flex items-center gap-1.5 pl-0.5">
                                            <span className="text-[10px] text-muted-foreground">Qtd por embalagem:</span>
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
                                                !editedPricingMetadata[product.product_id]?.fatorConversao ? "border-destructive/50" : "border-border"
                                              )}
                                              step="1"
                                              min="1"
                                              placeholder="Ex: 12"
                                            />
                                            <span className="text-[10px] text-muted-foreground">
                                              {editedPricingMetadata[product.product_id]?.unidadePreco === "cx" ? "un/cx" : "un/pct"}
                                            </span>
                                            {!editedPricingMetadata[product.product_id]?.fatorConversao && (
                                              <span className="text-[10px] text-destructive">* obrigatório</span>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    ) : (
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <span className={cn("font-semibold text-sm", isBestPrice ? "text-success" : "text-foreground")}>
                                          {formatPriceWithUnit(currentValue, product.product_id)}
                                        </span>
                                        {isBestPrice && (
                                          <Badge className="bg-success/10 text-success border-success/20 text-[10px] px-1.5 py-0 h-5">
                                            <TrendingDown className="h-3 w-3 mr-0.5" />Melhor
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
                                        className="h-8 w-8 p-0 text-primary hover:bg-primary/10"
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
                  <div className="flex-1 flex items-center justify-center text-muted-foreground p-8">
                    <div className="text-center">
                      <Building2 className="h-16 w-16 mx-auto mb-4 opacity-30" />
                      <p className="text-lg font-medium text-foreground">Selecione um fornecedor</p>
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
              <div className="p-5 space-y-5">
                {/* Resumo */}
                <div className="grid grid-cols-2 gap-3">
                  <Card className="p-4 bg-info/10 border-info/20">
                    <div className="flex items-center gap-2 mb-2"><DollarSign className="h-4 w-4 text-info" /><span className="text-xs font-medium text-muted-foreground uppercase">Total Selecionado</span></div>
                    <p className="text-2xl font-bold text-foreground">R$ {totalSelecao.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                  </Card>
                  <Card className="p-4 bg-success/10 border-success/20">
                    <div className="flex items-center gap-2 mb-2"><Award className="h-4 w-4 text-success" /><span className="text-xs font-medium text-muted-foreground uppercase">Melhor Total</span></div>
                    <p className="text-2xl font-bold text-success">R$ {melhorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
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
                      toast({ title: "✅ Melhores preços selecionados!", description: `Total: R$ ${melhorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` });
                    }}
                    className="flex-1 border-success/30 text-success hover:bg-success/10"
                  >
                    <Award className="h-4 w-4 mr-2" />
                    Melhores Preços
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
                      className="flex-1 border-info/30 text-info hover:bg-info/10"
                    >
                      <Building2 className="h-4 w-4 mr-2" />
                      Fornecedor Único
                    </Button>
                  )}
                </div>

                {totalSelecao > melhorTotal && (
                  <Card className="p-3 bg-warning/10 border-warning/20">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-warning" />
                      <span className="text-sm text-foreground">
                        Economize R$ {(totalSelecao - melhorTotal).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} selecionando os melhores preços
                      </span>
                    </div>
                  </Card>
                )}

                {/* Tabela de seleção */}
                <Card className="border-border overflow-hidden">
                  <div className="p-3 border-b border-border bg-muted/50">
                    <h3 className="font-semibold text-foreground flex items-center gap-2 text-sm">
                      <Package className="h-4 w-4 text-primary" />Selecione o fornecedor para cada produto
                    </h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[450px]">
                      <thead className="bg-muted/50 border-b border-border">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground uppercase">Produto</th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground uppercase">Qtd</th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground uppercase">Fornecedor</th>
                          <th className="px-3 py-2 text-right text-xs font-semibold text-muted-foreground uppercase">Valor</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {products.map((product: any) => {
                          const { bestSupplierId } = getBestPriceInfoForProduct(product.product_id);
                          const selectedSupplierId = productSelections[product.product_id];
                          const selectedValue = selectedSupplierId ? getSupplierProductValue(selectedSupplierId, product.product_id) : 0;
                          const isBest = selectedSupplierId === bestSupplierId;

                          return (
                            <tr key={product.product_id} className={cn("hover:bg-accent/50", isBest && "bg-success/5")}>
                              <td className="px-3 py-2">
                                <p className="font-medium text-sm text-foreground truncate max-w-[100px] sm:max-w-[150px]" title={safeStr(product.product_name)}>{safeStr(product.product_name)}</p>
                              </td>
                              <td className="px-3 py-2">
                                <span className="text-sm text-muted-foreground">{safeStr(product.quantidade)} {safeStr(product.unidade)}</span>
                              </td>
                              <td className="px-3 py-2">
                                <Select value={selectedSupplierId || ""} onValueChange={(value) => setProductSelections(prev => ({ ...prev, [product.product_id]: value }))}>
                                  <SelectTrigger className="w-[160px] sm:w-[200px] h-9 bg-card text-sm">
                                    <SelectValue placeholder="Selecione..." />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {fornecedores.filter(f => getSupplierProductValue(f.id, product.product_id) > 0).map(f => {
                                      const value = getSupplierProductValue(f.id, product.product_id);
                                      const isBestOption = f.id === bestSupplierId;
                                      return (
                                        <SelectItem key={f.id} value={f.id}>
                                          <div className="flex items-center gap-2">
                                            <span className="truncate text-sm" style={{ maxWidth: '100px' }} title={safeStr(f.nome)}>{safeStr(f.nome)}</span>
                                            <span className="text-muted-foreground text-sm flex-shrink-0">R$ {value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                            {isBestOption && <Badge className="bg-success/10 text-success border-success/20 text-xs px-1.5 flex-shrink-0">Melhor</Badge>}
                                          </div>
                                      </SelectItem>
                                    );
                                  })}
                                </SelectContent>
                              </Select>
                            </td>
                              <td className="px-3 py-2 text-right">
                                <span className={cn("font-semibold text-sm", isBest ? "text-success" : "text-foreground")}>
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
                  <Card className="border-border">
                    <div className="p-3 border-b border-border bg-muted/50">
                      <h3 className="font-semibold text-foreground flex items-center gap-2 text-sm">
                        <ShoppingCart className="h-4 w-4 text-primary" />
                        {supplierGroups.length === 1 ? "Pedido que será gerado" : `${supplierGroups.length} pedidos`}
                      </h3>
                    </div>
                    <div className="divide-y divide-border">
                      {supplierGroups.map((group, index) => (
                        <div key={group.supplierId} className="p-3">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              <Badge variant="outline" className="bg-info/10 text-info border-info/20 flex-shrink-0 text-xs px-2">#{index + 1}</Badge>
                              <span className="font-semibold text-foreground truncate text-sm" style={{ maxWidth: '180px' }} title={group.supplierName}>{group.supplierName}</span>
                            </div>
                            <span className="font-bold text-success flex-shrink-0 text-base">
                              R$ {group.products.reduce((sum: number, p: any) => sum + p.value, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground line-clamp-1">
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
                    <Input type="date" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} className="bg-card" min={new Date().toISOString().split('T')[0]} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Observações</label>
                    <Input value={observations} onChange={(e) => setObservations(e.target.value)} placeholder="Opcional..." className="bg-card" />
                  </div>
                </div>

                {/* Botão de converter */}
                <Button onClick={handleConvertToOrder} disabled={!deliveryDate || Object.keys(productSelections).length === 0} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-11 text-base font-semibold">
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  {supplierGroups.length > 1 ? `Gerar ${supplierGroups.length} Pedidos` : "Converter em Pedido"}
                </Button>
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <div className="flex-shrink-0 px-5 py-3 border-t border-border bg-muted/50 flex justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="text-muted-foreground">Fechar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
