import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Package, Building2, X, DollarSign, Edit2, TrendingDown, FileText, Calendar, Check, ClipboardList, Users, ShoppingCart, AlertCircle, Award, Plus, Trash2, Settings, Trophy, Star, Download, CheckCircle } from "lucide-react";
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
      <DialogContent className="max-w-[1100px] w-[95vw] h-[95vh] max-h-[850px] p-0 overflow-hidden !bg-white/70 dark:!bg-gray-950/70 backdrop-blur-2xl border border-white/20 dark:border-white/10 flex flex-col shadow-2xl rounded-[2.5rem] animate-in fade-in zoom-in-95 duration-300">
        {/* Header com design semiglass */}
        <div className="flex-shrink-0 px-8 py-6 border-b border-white/10 dark:border-white/5 bg-white/30 dark:bg-white/5 backdrop-blur-md relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-teal-500/5 to-transparent pointer-events-none"></div>
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-white shadow-xl shadow-teal-500/20 ring-1 ring-white/20">
                <ClipboardList className="h-7 w-7" />
              </div>
              <div className="space-y-1">
                <DialogTitle className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                  Gerenciar Cotação
                </DialogTitle>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-gray-500 dark:text-gray-400 font-black uppercase tracking-[0.2em] bg-white/50 dark:bg-black/20 px-2.5 py-1 rounded-lg border border-white/20 shadow-sm">
                    #{safeStr(quote.id).substring(0, 8)}
                  </span>
                  <div className="h-1 w-1 rounded-full bg-gray-300 dark:bg-gray-700"></div>
                  <span className="text-xs text-teal-600 dark:text-teal-400 font-bold truncate max-w-[250px]">
                    {safeStr(quote.produto)}
                  </span>
                </div>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => onOpenChange(false)} 
              className="h-12 w-12 text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/20 dark:hover:bg-white/10 rounded-2xl transition-all border border-transparent hover:border-white/20 shadow-sm"
            >
              <X className="h-6 w-6" />
            </Button>
          </div>
        </div>

        {/* Tabs - Ordem por produtividade com design refinado */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-shrink-0 px-8 pt-6 bg-white/20 dark:bg-black/5">
            <TabsList className="w-full h-14 p-1.5 bg-white/40 dark:bg-gray-950/40 backdrop-blur-2xl rounded-2xl border border-white/30 dark:border-white/10 grid grid-cols-5 gap-2 shadow-inner">
              <TabsTrigger 
                value="resumo" 
                className="h-full px-2 uppercase tracking-[0.15em] font-black text-[10px] rounded-xl transition-all duration-300 data-[state=active]:bg-white/90 dark:data-[state=active]:bg-gray-800/90 data-[state=active]:text-teal-600 dark:data-[state=active]:text-teal-300 data-[state=active]:shadow-lg data-[state=active]:ring-1 data-[state=active]:ring-white/20"
              >
                <Trophy className="h-4 w-4 mr-2" />Resumo
              </TabsTrigger>
              <TabsTrigger 
                value="valores" 
                className="h-full px-2 uppercase tracking-[0.15em] font-black text-[10px] rounded-xl transition-all duration-300 data-[state=active]:bg-white/90 dark:data-[state=active]:bg-gray-800/90 data-[state=active]:text-teal-600 dark:data-[state=active]:text-teal-300 data-[state=active]:shadow-lg data-[state=active]:ring-1 data-[state=active]:ring-white/20"
              >
                <DollarSign className="h-4 w-4 mr-2" />Valores
              </TabsTrigger>
              <TabsTrigger 
                value="converter" 
                className="h-full px-2 uppercase tracking-[0.15em] font-black text-[10px] rounded-xl transition-all duration-300 data-[state=active]:bg-white/90 dark:data-[state=active]:bg-gray-800/90 data-[state=active]:text-teal-600 dark:data-[state=active]:text-teal-300 data-[state=active]:shadow-lg data-[state=active]:ring-1 data-[state=active]:ring-white/20"
              >
                <ShoppingCart className="h-4 w-4 mr-2" />Pedido
              </TabsTrigger>
              <TabsTrigger 
                value="editar" 
                className="h-full px-2 uppercase tracking-[0.15em] font-black text-[10px] rounded-xl transition-all duration-300 data-[state=active]:bg-white/90 dark:data-[state=active]:bg-gray-800/90 data-[state=active]:text-teal-600 dark:data-[state=active]:text-teal-300 data-[state=active]:shadow-lg data-[state=active]:ring-1 data-[state=active]:ring-white/20"
              >
                <Settings className="h-4 w-4 mr-2" />Editar
              </TabsTrigger>
              <TabsTrigger 
                value="detalhes" 
                className="h-full px-2 uppercase tracking-[0.15em] font-black text-[10px] rounded-xl transition-all duration-300 data-[state=active]:bg-white/90 dark:data-[state=active]:bg-gray-800/90 data-[state=active]:text-teal-600 dark:data-[state=active]:text-teal-300 data-[state=active]:shadow-lg data-[state=active]:ring-1 data-[state=active]:ring-white/20"
              >
                <FileText className="h-4 w-4 mr-2" />Info
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Tab Resumo Geral com design semiglass */}
          <TabsContent value="resumo" className="flex-1 overflow-auto m-0 p-0 custom-scrollbar">
            <div className="p-8 space-y-8">
              {/* Cards de Stats Rápidos */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-teal-500/5 dark:bg-teal-900/10 rounded-3xl p-5 border border-teal-500/20 dark:border-teal-800/30 backdrop-blur-md shadow-sm group/card hover:shadow-lg transition-all">
                  <div className="flex items-center gap-3 text-teal-600 dark:text-teal-400 mb-3">
                    <div className="w-8 h-8 rounded-xl bg-teal-500/10 flex items-center justify-center group-hover/card:scale-110 transition-transform">
                      <Package className="h-4 w-4" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-70">Produtos</span>
                  </div>
                  <p className="font-black text-2xl text-gray-900 dark:text-white">{stats.totalProdutos}</p>
                </div>
                <div className="bg-amber-500/5 dark:bg-amber-900/10 rounded-3xl p-5 border border-amber-500/20 dark:border-amber-800/30 backdrop-blur-md shadow-sm group/card hover:shadow-lg transition-all">
                  <div className="flex items-center gap-3 text-amber-600 dark:text-amber-400 mb-3">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center group-hover/card:scale-110 transition-transform">
                      <Building2 className="h-4 w-4" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-70">Fornecedores</span>
                  </div>
                  <p className="font-black text-2xl text-gray-900 dark:text-white">{stats.totalFornecedores}</p>
                </div>
                <div className="bg-emerald-500/5 dark:bg-emerald-900/10 rounded-3xl p-5 border border-emerald-500/20 dark:border-emerald-800/30 backdrop-blur-md shadow-sm group/card hover:shadow-lg transition-all">
                  <div className="flex items-center gap-3 text-emerald-600 dark:text-emerald-400 mb-3">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center group-hover/card:scale-110 transition-transform">
                      <Trophy className="h-4 w-4" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-70">Melhor Total</span>
                  </div>
                  <p className="font-black text-2xl text-emerald-700 dark:text-emerald-400 flex items-baseline gap-1">
                    <span className="text-sm">R$</span> {melhorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="bg-purple-500/5 dark:bg-purple-900/10 rounded-3xl p-5 border border-purple-500/20 dark:border-purple-800/30 backdrop-blur-md shadow-sm group/card hover:shadow-lg transition-all">
                  <div className="flex items-center gap-3 text-purple-600 dark:text-purple-400 mb-3">
                    <div className="w-8 h-8 rounded-xl bg-purple-500/10 flex items-center justify-center group-hover/card:scale-110 transition-transform">
                      <TrendingDown className="h-4 w-4" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-70">Potencial</span>
                  </div>
                  <p className="font-black text-2xl text-purple-700 dark:text-purple-400 flex items-baseline gap-1">
                    <span className="text-sm">R$</span> {(productPricesData.reduce((acc, curr) => acc + curr.savings, 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>

              {/* Tabela de Preços por Produto */}
              <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                  <div className="flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-amber-500" />
                    <span className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em]">Melhor Preço por Produto</span>
                  </div>
                  <Badge variant="outline" className="text-[9px] font-bold uppercase tracking-widest border-white/20">Análise Competitiva</Badge>
                </div>
                
                <div className="grid grid-cols-1 gap-4">
                  {productPricesData.map((item) => (
                    <div key={item.productId} className="group relative">
                      <div className="p-6 bg-white/40 dark:bg-gray-900/40 rounded-[2rem] border border-white/30 dark:border-white/10 backdrop-blur-xl shadow-sm group-hover:border-teal-500/40 transition-all duration-300 hover:shadow-xl hover:shadow-teal-500/5 ring-1 ring-transparent hover:ring-white/20">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                          <div className="flex items-center gap-5 flex-1 min-w-0">
                            <div className="w-12 h-12 rounded-2xl bg-teal-500/10 flex items-center justify-center text-teal-600 border border-teal-500/20 group-hover:scale-110 transition-transform flex-shrink-0">
                              <Package className="h-6 w-6" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-black text-base text-gray-900 dark:text-white truncate tracking-tight">
                                {safeStr(item.productName)}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest bg-white/50 dark:bg-black/20 px-2 py-0.5 rounded-md border border-white/20 shadow-sm">
                                  {safeStr(item.quantidade)} {safeStr(item.unidade)}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col lg:items-end gap-2 flex-shrink-0">
                            {item.bestPrice > 0 ? (
                              <div className="flex flex-col lg:items-end gap-1">
                                <div className="flex items-center gap-3">
                                  <div className="w-6 h-6 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500 shadow-sm ring-1 ring-amber-500/20">
                                    <Star className="h-3.5 w-3.5 fill-amber-500" />
                                  </div>
                                  <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 tracking-tighter">
                                    R$ {item.bestPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">Fornecedor:</span>
                                  <span className="text-[10px] font-black text-gray-900 dark:text-white uppercase tracking-widest px-2 py-0.5 bg-white/50 dark:bg-white/5 rounded-md border border-white/20">
                                    {safeStr(item.bestSupplierName)}
                                  </span>
                                </div>
                                {item.savings > 0 && (
                                  <div className="mt-2 px-3 py-1 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 rounded-full border border-emerald-500/20 flex items-center gap-2 shadow-sm animate-pulse">
                                    <TrendingDown className="h-3 w-3" />
                                    <span className="text-[9px] font-black uppercase tracking-widest">Economia: R$ {item.savings.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <Badge variant="outline" className="h-8 px-4 text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] border-dashed border-2 rounded-xl">Sem Cotação</Badge>
                            )}
                          </div>
                        </div>

                        {/* Comparativo de Preços com design semiglass */}
                        {item.allPrices.length > 1 && (
                          <div className="mt-6 pt-4 border-t border-white/10 dark:border-white/5">
                            <div className="flex flex-wrap gap-2">
                              {item.allPrices.map((price, idx) => (
                                <div
                                  key={idx}
                                  className={cn(
                                    "px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all flex items-center gap-2",
                                    idx === 0
                                      ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30 shadow-sm ring-1 ring-emerald-500/20"
                                      : "bg-white/40 dark:bg-white/5 text-gray-400 dark:text-gray-500 border-white/20 dark:border-white/10"
                                  )}
                                >
                                  {idx === 0 && <CheckCircle className="h-3 w-3" />}
                                  {safeStr(price.nome)}: R$ {price.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
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
          {/* Tab Editar com design semiglass */}
          <TabsContent value="editar" className="flex-1 overflow-auto m-0 p-0 custom-scrollbar">
            <div className="p-8 space-y-8">
              {/* Seção Produtos Semiglass */}
              <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-teal-500" />
                    <span className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em]">Produtos na Cotação</span>
                    <Badge variant="secondary" className="h-5 px-2 text-[9px] font-black bg-teal-500/10 text-teal-600 dark:text-teal-400 border-none rounded-md ring-1 ring-teal-500/20">
                      {products.length} {products.length === 1 ? 'item' : 'itens'}
                    </Badge>
                  </div>
                </div>

                <Card className="border-white/30 dark:border-white/10 bg-white/40 dark:bg-gray-950/40 backdrop-blur-2xl shadow-xl rounded-[2rem] overflow-hidden ring-1 ring-white/20">
                  {/* Adicionar Produto Semiglass */}
                  {productsNotInQuote.length > 0 && onAddQuoteItem && (
                    <div className="p-6 border-b border-white/10 dark:border-white/5 bg-teal-500/5 backdrop-blur-md">
                      <div className="flex flex-col sm:flex-row gap-4">
                        <Select value={selectedProductToAdd} onValueChange={setSelectedProductToAdd}>
                          <SelectTrigger className="flex-1 h-12 bg-white/60 dark:bg-gray-800/60 border-white/30 dark:border-white/10 font-bold rounded-2xl focus:ring-teal-500/20 transition-all shadow-sm">
                            <SelectValue placeholder="Buscar produto para adicionar..." />
                          </SelectTrigger>
                          <SelectContent className="bg-white/95 dark:bg-gray-950/95 backdrop-blur-2xl border-white/30 rounded-2xl shadow-2xl">
                            {productsNotInQuote.map(p => (
                              <SelectItem key={p.id} value={p.id} className="font-bold py-3 px-4 focus:bg-teal-500/10 focus:text-teal-600 transition-colors">{p.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <div className="flex gap-3">
                          <Input 
                            type="number" 
                            min="1" 
                            value={productQuantity} 
                            onChange={(e) => setProductQuantity(e.target.value)}
                            placeholder="Qtd"
                            className="w-24 h-12 bg-white/60 dark:bg-gray-800/60 border-white/30 dark:border-white/10 font-black rounded-2xl text-center focus:ring-teal-500/20 shadow-sm"
                          />
                          <Select value={productUnit} onValueChange={setProductUnit}>
                            <SelectTrigger className="w-24 h-12 bg-white/60 dark:bg-gray-800/60 border-white/30 dark:border-white/10 font-black rounded-2xl focus:ring-teal-500/20 shadow-sm uppercase">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-white/95 dark:bg-gray-950/95 backdrop-blur-2xl border-white/30 rounded-2xl shadow-2xl">
                              {unidadesMedida.map(u => (
                                <SelectItem key={u.value} value={u.value} className="font-black uppercase text-[10px] tracking-widest focus:bg-teal-500/10 focus:text-teal-600 transition-colors">{u.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <Button 
                          onClick={handleAddProduct} 
                          disabled={!selectedProductToAdd}
                          className="h-12 px-6 bg-gradient-to-br from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white font-black uppercase tracking-wider text-[10px] shadow-lg shadow-teal-500/20 rounded-2xl transition-all active:scale-95 ring-1 ring-white/20"
                        >
                          <Plus className="h-4 w-4 mr-2" />Adicionar
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  {/* Lista de Produtos Semiglass */}
                  <div className="divide-y divide-white/10 dark:divide-white/5 max-h-[400px] overflow-auto custom-scrollbar">
                    {products.length === 0 ? (
                      <div className="p-16 text-center text-gray-400 dark:text-gray-500">
                        <div className="w-20 h-20 rounded-3xl bg-gray-500/5 flex items-center justify-center mx-auto mb-4 border border-white/5">
                          <Package className="h-10 w-10 opacity-20" />
                        </div>
                        <p className="text-xs font-black uppercase tracking-[0.2em] opacity-50">Nenhum produto</p>
                      </div>
                    ) : (
                      products.map((product: any, index: number) => (
                        <div key={product.product_id} className="p-4 flex items-center justify-between hover:bg-white/10 dark:hover:bg-white/5 transition-all group/item">
                          <div className="flex items-center gap-5 min-w-0 flex-1">
                            <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 w-6 flex-shrink-0 tracking-widest">{String(index + 1).padStart(2, '0')}</span>
                            <div className="w-10 h-10 rounded-xl bg-teal-500/10 flex items-center justify-center text-teal-600 border border-teal-500/20 group-hover/item:scale-110 transition-transform flex-shrink-0">
                              <Package className="h-5 w-5" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <span className="font-bold text-sm text-gray-900 dark:text-white truncate block tracking-tight" title={safeStr(product.product_name)}>
                                {safeStr(product.product_name)}
                              </span>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest bg-white/50 dark:bg-black/20 px-2 py-0.5 rounded-md border border-white/20">
                                  {safeStr(product.quantidade)} {safeStr(product.unidade)}
                                </span>
                              </div>
                            </div>
                          </div>
                          {onRemoveQuoteItem && products.length > 1 && (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => handleRemoveProduct(product.product_id)}
                              className="h-10 w-10 text-gray-400 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all border border-transparent hover:border-red-500/20 shadow-sm"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </Card>
              </div>

              {/* Seção Fornecedores Semiglass */}
              <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-teal-500" />
                    <span className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em]">Fornecedores na Cotação</span>
                    <Badge variant="secondary" className="h-5 px-2 text-[9px] font-black bg-teal-500/10 text-teal-600 dark:text-teal-400 border-none rounded-md ring-1 ring-teal-500/20">
                      {fornecedores.length} {fornecedores.length === 1 ? 'fornecedor' : 'fornecedores'}
                    </Badge>
                  </div>
                </div>

                <Card className="border-white/30 dark:border-white/10 bg-white/40 dark:bg-gray-950/40 backdrop-blur-2xl shadow-xl rounded-[2rem] overflow-hidden ring-1 ring-white/20">
                  {/* Adicionar Fornecedor Semiglass */}
                  {suppliersNotInQuote.length > 0 && onAddQuoteSupplier && (
                    <div className="p-6 border-b border-white/10 dark:border-white/5 bg-teal-500/5 backdrop-blur-md">
                      <div className="flex flex-col sm:flex-row gap-4">
                        <Select value={selectedSupplierToAdd} onValueChange={setSelectedSupplierToAdd}>
                          <SelectTrigger className="flex-1 h-12 bg-white/60 dark:bg-gray-800/60 border-white/30 dark:border-white/10 font-bold rounded-2xl focus:ring-teal-500/20 transition-all shadow-sm">
                            <SelectValue placeholder="Buscar fornecedor para adicionar..." />
                          </SelectTrigger>
                          <SelectContent className="bg-white/95 dark:bg-gray-950/95 backdrop-blur-2xl border-white/30 rounded-2xl shadow-2xl">
                            {suppliersNotInQuote.map(s => (
                              <SelectItem key={s.id} value={s.id} className="font-bold py-3 px-4 focus:bg-teal-500/10 focus:text-teal-600 transition-colors">{s.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button 
                          onClick={handleAddSupplier} 
                          disabled={!selectedSupplierToAdd}
                          className="h-12 px-8 bg-gradient-to-br from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white font-black uppercase tracking-wider text-[10px] shadow-lg shadow-teal-500/20 rounded-2xl transition-all active:scale-95 ring-1 ring-white/20"
                        >
                          <Plus className="h-4 w-4 mr-2" />Adicionar Fornecedor
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  {/* Lista de Fornecedores Semiglass */}
                  <div className="divide-y divide-white/10 dark:divide-white/5 max-h-[400px] overflow-auto custom-scrollbar">
                    {fornecedores.length === 0 ? (
                      <div className="p-16 text-center text-gray-400 dark:text-gray-500">
                        <div className="w-20 h-20 rounded-3xl bg-gray-500/5 flex items-center justify-center mx-auto mb-4 border border-white/5">
                          <Building2 className="h-10 w-10 opacity-20" />
                        </div>
                        <p className="text-xs font-black uppercase tracking-[0.2em] opacity-50">Nenhum fornecedor</p>
                      </div>
                    ) : (
                      fornecedores.map((fornecedor) => (
                        <div key={fornecedor.id} className="p-4 flex items-center justify-between hover:bg-white/10 dark:hover:bg-white/5 transition-all group/item">
                          <div className="flex items-center gap-5 min-w-0 flex-1">
                            <div className={cn("w-3 h-3 rounded-full flex-shrink-0 shadow-sm ring-2 ring-white/20", 
                              fornecedor.status === 'respondido' ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
                            )} />
                            <div className="w-10 h-10 rounded-xl bg-teal-500/10 flex items-center justify-center text-teal-600 border border-teal-500/20 group-hover/item:scale-110 transition-transform flex-shrink-0">
                              <Building2 className="h-5 w-5" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <span className="font-bold text-sm text-gray-900 dark:text-white truncate block tracking-tight" title={safeStr(fornecedor.nome)}>
                                {safeStr(fornecedor.nome)}
                              </span>
                              <div className="flex items-center gap-3 mt-1">
                                <Badge variant="outline" className={cn("text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md", 
                                  fornecedor.status === 'respondido' 
                                    ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" 
                                    : "bg-amber-500/10 text-amber-600 border-amber-500/20"
                                )}>
                                  {fornecedor.status === 'respondido' ? 'Respondido' : 'Pendente'}
                                </Badge>
                                {fornecedor.valorOferecido > 0 && (
                                  <span className="text-xs text-emerald-600 dark:text-emerald-400 font-black">
                                    R$ {fornecedor.valorOferecido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          {onRemoveQuoteSupplier && fornecedores.length > 1 && (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => handleRemoveSupplier(fornecedor.id)}
                              className="h-10 w-10 text-gray-400 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all border border-transparent hover:border-red-500/20 shadow-sm"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </Card>
              </div>

              {/* Aviso Semiglass */}
              <div className="relative group overflow-hidden rounded-[2rem] p-0.5">
                <div className="absolute inset-0 bg-amber-500/20 opacity-40"></div>
                <div className="relative flex items-start gap-4 p-6 bg-amber-500/5 dark:bg-amber-950/10 border border-amber-500/30 dark:border-amber-500/10 backdrop-blur-2xl rounded-[1.9rem]">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-600 flex-shrink-0 shadow-sm">
                    <AlertCircle className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-amber-700 dark:text-amber-400 uppercase tracking-widest mb-1">Atenção Crítica</p>
                    <p className="text-xs text-amber-600 dark:text-amber-500/70 font-bold leading-relaxed uppercase tracking-tighter">
                      Ao remover um produto ou fornecedor, todos os valores de cotação associados serão excluídos permanentemente.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Tab Detalhes com design semiglass */}
          <TabsContent value="detalhes" className="flex-1 overflow-auto m-0 p-0 custom-scrollbar">
            <div className="p-8 space-y-8">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-teal-500/5 dark:bg-teal-900/10 rounded-3xl p-5 border border-teal-500/20 dark:border-teal-800/30 backdrop-blur-md shadow-sm group/card hover:shadow-lg transition-all">
                  <div className="flex items-center gap-3 text-teal-600 dark:text-teal-400 mb-3">
                    <div className="w-8 h-8 rounded-xl bg-teal-500/10 flex items-center justify-center group-hover/card:scale-110 transition-transform">
                      <Package className="h-4 w-4" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-70">Produtos</span>
                  </div>
                  <p className="font-black text-2xl text-gray-900 dark:text-white">{stats.totalProdutos}</p>
                </div>
                <div className="bg-blue-500/5 dark:bg-blue-900/10 rounded-3xl p-5 border border-blue-500/20 dark:border-blue-800/30 backdrop-blur-md shadow-sm group/card hover:shadow-lg transition-all">
                  <div className="flex items-center gap-3 text-blue-600 dark:text-blue-400 mb-3">
                    <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center group-hover/card:scale-110 transition-transform">
                      <Users className="h-4 w-4" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-70">Respostas</span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <p className="font-black text-2xl text-gray-900 dark:text-white">{stats.fornecedoresRespondidos}</p>
                    <span className="text-xs font-bold text-gray-400">/ {stats.totalFornecedores}</span>
                  </div>
                </div>
                <div className="bg-emerald-500/5 dark:bg-emerald-900/10 rounded-3xl p-5 border border-emerald-500/20 dark:border-emerald-800/30 backdrop-blur-md shadow-sm group/card hover:shadow-lg transition-all">
                  <div className="flex items-center gap-3 text-emerald-600 dark:text-emerald-400 mb-3">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center group-hover/card:scale-110 transition-transform">
                      <DollarSign className="h-4 w-4" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-70">Melhor Valor</span>
                  </div>
                  <p className="font-black text-2xl text-emerald-700 dark:text-emerald-400 flex items-baseline gap-1">
                    <span className="text-sm">R$</span> {stats.melhorValor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <button 
                  onClick={() => setActiveTab("exportar")}
                  className="bg-amber-500/5 dark:bg-amber-900/10 rounded-3xl p-5 border border-amber-500/20 dark:border-amber-800/30 backdrop-blur-md shadow-sm group/card hover:bg-amber-500/10 transition-all text-left relative overflow-hidden"
                >
                  <div className="flex items-center gap-3 text-amber-600 dark:text-amber-400 mb-3 relative z-10">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center group-hover/card:scale-110 transition-transform">
                      <Download className="h-4 w-4" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-70">Exportar</span>
                  </div>
                  <div className="relative z-10">
                    <p className="font-black text-sm text-gray-900 dark:text-white uppercase tracking-tight">Baixar Relatório</p>
                    <p className="text-[9px] text-amber-600/60 font-black uppercase tracking-widest mt-1">Gerar PDF/Excel</p>
                  </div>
                  <div className="absolute right-[-10px] bottom-[-10px] opacity-5 group-hover:opacity-10 transition-opacity">
                    <Download className="h-20 w-20 text-amber-600" />
                  </div>
                </button>
              </div>

              {/* Listagem de Resumo Semiglass */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card className="border-white/30 dark:border-white/10 bg-white/40 dark:bg-gray-950/40 backdrop-blur-2xl shadow-xl rounded-[2rem] overflow-hidden ring-1 ring-white/20">
                  <div className="p-5 border-b border-white/10 dark:border-white/5 bg-white/20 dark:bg-white/5 backdrop-blur-md flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-teal-500/10 flex items-center justify-center text-teal-600 border border-teal-500/20 shadow-sm">
                      <Package className="h-4 w-4" />
                    </div>
                    <h3 className="font-black text-gray-900 dark:text-white uppercase tracking-[0.2em] text-[10px]">Lista de Produtos</h3>
                  </div>
                  <div className="divide-y divide-white/10 dark:divide-white/5 max-h-[300px] overflow-auto custom-scrollbar">
                    {products.map((product: any, index: number) => (
                      <div key={product.product_id} className="p-4 flex items-center justify-between hover:bg-white/10 dark:hover:bg-white/5 transition-all">
                        <div className="flex items-center gap-4">
                          <span className="text-[10px] font-black text-gray-400 w-6 tracking-widest">{String(index + 1).padStart(2, '0')}</span>
                          <span className="font-bold text-sm text-gray-900 dark:text-white tracking-tight">{safeStr(product.product_name)}</span>
                        </div>
                        <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest border-white/20 bg-white/10 dark:bg-white/5 text-gray-500 dark:text-gray-400">{safeStr(product.quantidade)} {safeStr(product.unidade)}</Badge>
                      </div>
                    ))}
                  </div>
                </Card>

                <Card className="border-white/30 dark:border-white/10 bg-white/40 dark:bg-gray-950/40 backdrop-blur-2xl shadow-xl rounded-[2rem] overflow-hidden ring-1 ring-white/20">
                  <div className="p-5 border-b border-white/10 dark:border-white/5 bg-white/20 dark:bg-white/5 backdrop-blur-md flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-600 border border-blue-500/20 shadow-sm">
                      <Building2 className="h-4 w-4" />
                    </div>
                    <h3 className="font-black text-gray-900 dark:text-white uppercase tracking-[0.2em] text-[10px]">Status de Fornecedores</h3>
                  </div>
                  <div className="divide-y divide-white/10 dark:divide-white/5 max-h-[300px] overflow-auto custom-scrollbar">
                    {fornecedores.map((fornecedor) => (
                      <div key={fornecedor.id} className="p-4 flex items-center justify-between hover:bg-white/10 dark:hover:bg-white/5 transition-all">
                        <div className="flex items-center gap-4">
                          <div className={cn("w-2.5 h-2.5 rounded-full flex-shrink-0 shadow-sm", fornecedor.status === 'respondido' ? "bg-emerald-500 animate-pulse" : "bg-amber-500")} />
                          <span className="font-bold text-sm text-gray-900 dark:text-white tracking-tight">{safeStr(fornecedor.nome)}</span>
                          <Badge variant="outline" className={cn("text-[8px] h-4 font-black uppercase tracking-tighter px-1.5", 
                            fornecedor.status === 'respondido' ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : "bg-amber-500/10 text-amber-600 border-amber-500/20"
                          )}>
                            {fornecedor.status === 'respondido' ? 'Respondido' : 'Pendente'}
                          </Badge>
                        </div>
                        {fornecedor.valorOferecido > 0 && (
                          <span className="font-black text-emerald-600 dark:text-emerald-400 text-sm">
                            R$ {fornecedor.valorOferecido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Tab Editar Valores */}
          {/* Tab Valores com design semiglass e sidebar refinada */}
          <TabsContent value="valores" className="flex-1 overflow-hidden m-0 p-0">
            <div className="flex flex-col lg:flex-row h-full">
              {/* Lista de Fornecedores - Sidebar Semiglass */}
              <div className="w-full lg:w-64 xl:w-72 flex-shrink-0 border-b lg:border-b-0 lg:border-r border-white/10 dark:border-white/5 bg-white/30 dark:bg-black/20 backdrop-blur-2xl flex flex-col relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-teal-500/5 to-transparent pointer-events-none"></div>
                <div className="p-5 border-b border-white/10 dark:border-white/5 relative z-10">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-teal-500/10 flex items-center justify-center text-teal-600 border border-teal-500/20 shadow-sm">
                      <Building2 className="h-4 w-4" />
                    </div>
                    <span className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em]">Fornecedores</span>
                  </div>
                </div>
                <ScrollArea className="flex-1 max-h-[150px] lg:max-h-none relative z-10 custom-scrollbar">
                  <div className="p-3 flex lg:flex-col gap-2 overflow-x-auto lg:overflow-x-visible">
                    {fornecedores.map((fornecedor) => {
                      const total = calcularTotalFornecedor(fornecedor.id);
                      const isSelected = selectedSupplier === fornecedor.id;
                      return (
                        <button 
                          key={fornecedor.id} 
                          onClick={() => { setSelectedSupplier(fornecedor.id); setEditingProductId(null); setEditedValues({}); }}
                          className={cn(
                            "flex-shrink-0 lg:w-full text-left p-4 rounded-2xl transition-all duration-300 relative overflow-hidden group/supplier",
                            "min-w-[160px] lg:min-w-0",
                            isSelected 
                              ? "bg-white/60 dark:bg-gray-800/60 border border-white/40 dark:border-white/10 shadow-xl shadow-teal-500/5 ring-1 ring-white/20" 
                              : "hover:bg-white/30 dark:hover:bg-white/5 border border-transparent"
                          )}
                        >
                          {isSelected && (
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-teal-500 rounded-r-full"></div>
                          )}
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={cn("w-2.5 h-2.5 rounded-full flex-shrink-0 shadow-sm", 
                              fornecedor.status === 'respondido' ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
                            )} />
                            <span 
                              className={cn(
                                "text-sm truncate block tracking-tight",
                                isSelected ? "text-teal-600 dark:text-teal-300 font-black" : "text-gray-600 dark:text-gray-400 font-bold group-hover/supplier:text-gray-900 dark:group-hover/supplier:text-white"
                              )} 
                              title={safeStr(fornecedor.nome)}
                            >
                              {safeStr(fornecedor.nome)}
                            </span>
                          </div>
                          <div className="mt-2 ml-5.5 flex items-center justify-between">
                            <span className={cn("text-[11px] font-black tracking-tight", isSelected ? "text-gray-900 dark:text-white" : "text-gray-400 dark:text-gray-500")}>
                              R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </span>
                            {fornecedor.status === 'respondido' && (
                              <Badge variant="outline" className="text-[8px] px-1.5 py-0 h-4 bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-black uppercase tracking-tighter">
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

              {/* Área de Edição de Valores com design semiglass */}
              <div className="flex-1 flex flex-col overflow-hidden min-w-0 bg-white/10 dark:bg-black/10 relative">
                <div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 via-transparent to-emerald-500/5 pointer-events-none"></div>
                {selectedSupplier ? (
                  <>
                    {/* Header do Fornecedor Selecionado Semiglass */}
                    <div className="flex-shrink-0 px-8 py-5 border-b border-white/10 dark:border-white/5 bg-white/40 dark:bg-white/5 backdrop-blur-md flex items-center justify-between gap-4 relative z-10">
                      <div className="flex items-center gap-4 min-w-0 flex-1">
                        <div className="w-10 h-10 rounded-xl bg-teal-500/10 flex items-center justify-center border border-teal-500/20 shadow-sm">
                          <DollarSign className="h-5 w-5 text-teal-600" />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Valores de:</span>
                          <span 
                            className="font-black text-gray-900 dark:text-white truncate text-base tracking-tight" 
                            title={fornecedores.find(f => f.id === selectedSupplier)?.nome}
                          >
                            {fornecedores.find(f => f.id === selectedSupplier)?.nome}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">Total do Fornecedor</span>
                        <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 px-4 py-1.5 h-auto text-base font-black shadow-lg shadow-emerald-500/5 rounded-xl ring-1 ring-white/20">
                          <span className="text-xs mr-1 opacity-70">R$</span>
                          {calcularTotalFornecedor(selectedSupplier).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </Badge>
                      </div>
                    </div>
                    
                    {/* Tabela de Produtos Semiglass */}
                    <ScrollArea className="flex-1 relative z-10 custom-scrollbar">
                      <div className="min-w-[450px] p-8">
                        <Card className="border-white/30 dark:border-white/10 bg-white/40 dark:bg-gray-950/40 backdrop-blur-2xl shadow-2xl rounded-[2rem] overflow-hidden ring-1 ring-white/20">
                          <table className="w-full border-collapse">
                            <thead className="bg-white/30 dark:bg-white/5 backdrop-blur-md border-b border-white/10 dark:border-white/5 sticky top-0 z-10">
                              <tr>
                                <th className="px-6 py-4 text-left text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em]">Produto</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em] hidden sm:table-cell">Quantidade</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em]">Valor Oferecido</th>
                                <th className="px-6 py-4 text-center text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em] w-20">Ações</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-white/10 dark:divide-white/5">
                              {products.map((product: any) => {
                                const currentValue = getCurrentProductValue(selectedSupplier, product.product_id);
                                const isEditing = editingProductId === product.product_id;
                                const { bestSupplierId } = getBestPriceInfoForProduct(product.product_id);
                                const isBestPrice = currentValue > 0 && selectedSupplier === bestSupplierId;
                                return (
                                  <tr key={product.product_id} className={cn("hover:bg-white/20 dark:hover:bg-white/5 transition-all duration-300 group/row", isBestPrice && "bg-emerald-500/5 dark:bg-emerald-500/10")}>
                                    <td className="px-6 py-5">
                                      <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-teal-500/5 flex items-center justify-center text-teal-600 border border-teal-500/10 group-hover/row:scale-110 transition-transform">
                                          <Package className="h-5 w-5" />
                                        </div>
                                        <div className="min-w-0">
                                          <div className="flex items-center gap-2">
                                            <p className="font-black text-sm text-gray-900 dark:text-white truncate tracking-tight" title={safeStr(product.product_name)}>
                                              {safeStr(product.product_name)}
                                            </p>
                                            <ProductPriceInfoTooltip 
                                              productId={product.product_id} 
                                              productName={safeStr(product.product_name)} 
                                            />
                                          </div>
                                          <p className="text-[9px] text-gray-400 sm:hidden mt-1 font-black uppercase tracking-widest bg-white/50 dark:bg-black/20 px-2 py-0.5 rounded-md border border-white/20 w-fit">
                                            {safeStr(product.quantidade)} {safeStr(product.unidade)}
                                          </p>
                                        </div>
                                      </div>
                                    </td>
                                    <td className="px-6 py-5 hidden sm:table-cell">
                                      <span className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.15em] px-3 py-1 bg-white/40 dark:bg-white/5 rounded-full border border-white/20 shadow-sm">
                                        {safeStr(product.quantidade)} {safeStr(product.unidade)}
                                      </span>
                                    </td>
                                    <td className="px-6 py-5">
                                      {isEditing ? (
                                        <div className="flex flex-col gap-3 py-2 animate-in fade-in slide-in-from-top-1">
                                          <div className="flex items-center gap-2 flex-wrap">
                                            <div className="relative group/val">
                                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-teal-500/50">R$</span>
                                              <Input 
                                                ref={editInputRef} 
                                                type="number" 
                                                step="0.01" 
                                                min="0" 
                                                value={editedValues[product.product_id] || 0}
                                                onChange={(e) => setEditedValues(prev => ({ ...prev, [product.product_id]: Number(e.target.value) }))}
                                                onKeyDown={(e) => { if (e.key === 'Enter') handleSaveEdit(product.product_id); if (e.key === 'Escape') handleCancelEdit(); }}
                                                className="w-24 sm:w-28 h-10 text-sm pl-8 bg-white/60 dark:bg-white/5 border-teal-500/30 focus:ring-teal-500/20 font-black rounded-xl shadow-inner" 
                                              />
                                            </div>
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
                                              <SelectTrigger className="w-[100px] h-10 text-xs border-teal-500/30 bg-white/60 dark:bg-white/5 font-black rounded-xl shadow-inner uppercase">
                                                <SelectValue />
                                              </SelectTrigger>
                                              <SelectContent className="bg-white/95 dark:bg-gray-950/95 backdrop-blur-2xl border-white/30 rounded-2xl shadow-2xl">
                                                {PRICING_UNIT_OPTIONS.map((option) => (
                                                  <SelectItem key={option.value} value={option.value} className="text-[10px] font-black uppercase tracking-widest focus:bg-teal-500/10 focus:text-teal-600 transition-colors">
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
                                            <div className="flex gap-2">
                                              <Button 
                                                size="icon" 
                                                onClick={() => handleSaveEdit(product.product_id)} 
                                                disabled={isConversionFactorRequired(product.product_id) && !editedPricingMetadata[product.product_id]?.fatorConversao}
                                                className="h-10 w-10 bg-gradient-to-br from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white shadow-lg shadow-teal-500/20 rounded-xl transition-all active:scale-95 ring-1 ring-white/20"
                                              >
                                                <Check className="h-5 w-5" />
                                              </Button>
                                              <Button size="icon" variant="ghost" onClick={handleCancelEdit} className="h-10 w-10 text-gray-400 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all border border-transparent hover:border-red-500/20">
                                                <X className="h-5 w-5" />
                                              </Button>
                                            </div>
                                          </div>
                                          {isConversionFactorRequired(product.product_id) && (
                                            <div className="flex items-center gap-3 pl-1 animate-in fade-in slide-in-from-left-2">
                                              <span className="text-[9px] text-gray-400 dark:text-gray-500 font-black uppercase tracking-[0.15em]">Qtd por emb:</span>
                                              <div className="relative">
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
                                                    "w-20 h-8 text-xs rounded-lg bg-white/60 dark:bg-white/5 font-black shadow-inner",
                                                    !editedPricingMetadata[product.product_id]?.fatorConversao ? "border-red-500/50 focus:ring-red-500/20" : "border-teal-500/20 focus:ring-teal-500/20"
                                                  )}
                                                  step="1"
                                                  min="1"
                                                  placeholder="Ex: 12"
                                                />
                                              </div>
                                              <span className="text-[9px] text-gray-400 font-black uppercase tracking-widest">
                                                {editedPricingMetadata[product.product_id]?.unidadePreco === "cx" ? "un/cx" : "un/pct"}
                                              </span>
                                              {!editedPricingMetadata[product.product_id]?.fatorConversao && (
                                                <span className="text-[8px] text-red-500 font-black uppercase tracking-[0.2em] animate-pulse">obrigatório</span>
                                              )}
                                            </div>
                                          )}
                                        </div>
                                      ) : (
                                        <div className="flex items-center gap-3 flex-wrap">
                                          <div className="flex flex-col">
                                            <span className={cn("font-black text-base tracking-tight", isBestPrice ? "text-emerald-600 dark:text-emerald-400" : "text-gray-900 dark:text-white")}>
                                              {formatPriceWithUnit(currentValue, product.product_id)}
                                            </span>
                                          </div>
                                          {isBestPrice && (
                                            <div className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full flex items-center gap-1.5 shadow-sm">
                                              <TrendingDown className="h-3 w-3" />
                                              <span className="text-[8px] font-black uppercase tracking-widest">Melhor Preço</span>
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </td>
                                    <td className="px-6 py-5 text-center">
                                      {!isEditing && (
                                        <Button 
                                          size="icon" 
                                          variant="ghost" 
                                          onClick={() => {
                                            const currentMetadata = getSupplierItemPricingMetadata(selectedSupplier, product.product_id);
                                            handleStartEdit(product.product_id, currentValue, currentMetadata);
                                          }} 
                                          className="h-10 w-10 text-teal-600 hover:text-teal-700 hover:bg-teal-500/10 rounded-xl transition-all border border-transparent hover:border-teal-500/20"
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
                        </Card>
                      </div>
                    </ScrollArea>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center p-8">
                    <div className="text-center animate-in fade-in zoom-in-95 duration-700 max-w-sm">
                      <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-teal-500/10 to-emerald-500/10 border border-teal-500/20 flex items-center justify-center mx-auto mb-6 backdrop-blur-md shadow-2xl group hover:scale-110 transition-transform">
                        <Building2 className="h-12 w-12 text-teal-600 opacity-40 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <p className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-[0.2em]">Selecione um fornecedor</p>
                      <p className="text-xs mt-3 font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest leading-relaxed">Escolha um parceiro na lista lateral para visualizar e gerenciar os valores da cotação.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Tab Converter em Pedido com design semiglass */}
          <TabsContent value="converter" className="flex-1 overflow-auto m-0 p-0 custom-scrollbar">
            <div className="p-8 space-y-8">
              {/* Resumo Financeiro da Seleção */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="bg-teal-500/5 dark:bg-teal-900/10 rounded-[2rem] p-6 border border-teal-500/20 dark:border-teal-800/30 backdrop-blur-md shadow-sm relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-br from-teal-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="flex items-center gap-4 mb-4 relative z-10">
                    <div className="w-10 h-10 rounded-xl bg-teal-500/10 flex items-center justify-center text-teal-600 border border-teal-500/20 shadow-sm">
                      <DollarSign className="h-5 w-5" />
                    </div>
                    <span className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em]">Total Selecionado</span>
                  </div>
                  <p className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter relative z-10">
                    <span className="text-lg mr-1 text-teal-500/50">R$</span>
                    {totalSelecao.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="bg-emerald-500/5 dark:bg-emerald-900/10 rounded-[2rem] p-6 border border-emerald-500/20 dark:border-emerald-800/30 backdrop-blur-md shadow-sm relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="flex items-center gap-4 mb-4 relative z-10">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 border border-emerald-500/20 shadow-sm">
                      <Trophy className="h-5 w-5" />
                    </div>
                    <span className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em]">Melhor Total Possível</span>
                  </div>
                  <p className="text-3xl font-black text-emerald-700 dark:text-emerald-400 tracking-tighter relative z-10">
                    <span className="text-lg mr-1 text-emerald-500/50">R$</span>
                    {melhorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>

              {/* Estratégias de Seleção Rápidas */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white/30 dark:bg-black/20 p-4 rounded-[1.5rem] border border-white/20">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-teal-500 animate-pulse"></div>
                  <span className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">Estratégia de Seleção</span>
                </div>
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
                  <TabsList className="h-12 p-1 bg-white/40 dark:bg-gray-950/40 backdrop-blur-xl rounded-xl border border-white/20 shadow-inner gap-1">
                    <TabsTrigger value="melhores" className="h-full px-4 text-[9px] font-black uppercase tracking-widest rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:text-emerald-600 data-[state=active]:shadow-md transition-all">
                      <Trophy className="h-3.5 w-3.5 mr-2" /> Melhores Preços
                    </TabsTrigger>
                    <TabsTrigger value="unico" className="h-full px-4 text-[9px] font-black uppercase tracking-widest rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:text-blue-600 data-[state=active]:shadow-md transition-all">
                      <Building2 className="h-3.5 w-3.5 mr-2" /> Fornecedor Único
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              {totalSelecao > melhorTotal && (
                <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl flex items-center gap-3 animate-bounce-subtle">
                  <TrendingDown className="h-5 w-5 text-amber-600" />
                  <span className="text-[11px] font-black text-amber-700 dark:text-amber-400 uppercase tracking-tight">
                    Economia Pendente: R$ {(totalSelecao - melhorTotal).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (Selecione os melhores preços para maximizar)
                  </span>
                </div>
              )}

              {/* Tabela de Seleção Semiglass */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 px-2">
                  <ShoppingCart className="h-4 w-4 text-teal-500" />
                  <span className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em]">Configuração do Pedido</span>
                </div>
                <Card className="border-white/30 dark:border-white/10 bg-white/40 dark:bg-gray-950/40 backdrop-blur-2xl shadow-2xl rounded-[2rem] overflow-hidden ring-1 ring-white/20">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[600px] border-collapse">
                      <thead className="bg-white/30 dark:bg-white/5 border-b border-white/10">
                        <tr>
                          <th className="px-6 py-4 text-left text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em]">Produto</th>
                          <th className="px-6 py-4 text-left text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em]">Quantidade</th>
                          <th className="px-6 py-4 text-left text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em]">Fornecedor Selecionado</th>
                          <th className="px-6 py-4 text-right text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em]">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/10 dark:divide-white/5">
                        {products.map((product: any) => {
                          const { bestPrice } = getBestPriceInfoForProduct(product.product_id);
                          const selectedSupplierId = productSelections[product.product_id];
                          const selectedValue = selectedSupplierId ? getSupplierProductValue(selectedSupplierId, product.product_id) : 0;
                          const isBest = selectedValue > 0 && Math.abs(selectedValue - bestPrice) < 0.01;

                          return (
                            <tr key={product.product_id} className={cn("hover:bg-white/20 dark:hover:bg-white/5 transition-all group/row", isBest && "bg-emerald-500/5")}>
                              <td className="px-6 py-4">
                                <p className="font-bold text-sm text-gray-900 dark:text-white truncate max-w-[200px]" title={safeStr(product.product_name)}>{safeStr(product.product_name)}</p>
                              </td>
                              <td className="px-6 py-4">
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest bg-white/50 dark:bg-black/20 px-2 py-0.5 rounded-md border border-white/20">{safeStr(product.quantidade)} {safeStr(product.unidade)}</span>
                              </td>
                              <td className="px-6 py-4">
                                <Select value={selectedSupplierId || ""} onValueChange={(value) => setProductSelections(prev => ({ ...prev, [product.product_id]: value }))}>
                                  <SelectTrigger className="w-full h-10 bg-white/60 dark:bg-white/5 border-white/30 dark:border-white/10 font-bold rounded-xl focus:ring-teal-500/20 shadow-sm transition-all">
                                    <SelectValue placeholder="Escolha um fornecedor..." />
                                  </SelectTrigger>
                                  <SelectContent className="bg-white/95 dark:bg-gray-950/95 backdrop-blur-2xl border-white/30 rounded-2xl shadow-2xl">
                                    {fornecedores.filter(f => getSupplierProductValue(f.id, product.product_id) > 0).map(f => (
                                      <SelectItem key={f.id} value={f.id} className="font-bold py-2.5 px-4 focus:bg-teal-500/10 focus:text-teal-600 transition-colors">
                                        {safeStr(f.nome)}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <div className="flex flex-col items-end">
                                  <span className={cn("font-black text-sm tracking-tight", isBest ? "text-emerald-600 dark:text-emerald-400" : "text-gray-900 dark:text-white")}>
                                    R$ {selectedValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                  </span>
                                  {isBest && (
                                    <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest mt-0.5">Melhor Preço</span>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </div>

              {/* Pedidos Gerados Preview Semiglass */}
              {supplierGroups.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 px-2">
                    <Package className="h-4 w-4 text-blue-500" />
                    <span className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em]">Preview de Envio</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {supplierGroups.map((group, index) => (
                      <Card key={group.supplierId} className="p-5 bg-white/40 dark:bg-gray-900/40 border-white/30 dark:border-white/10 backdrop-blur-2xl rounded-[1.5rem] shadow-lg group/order hover:border-blue-500/40 transition-all duration-300">
                        <div className="flex items-center justify-between mb-4">
                          <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/20 font-black text-[9px] uppercase tracking-widest px-2 py-0.5 rounded-lg shadow-sm">Pedido #{index + 1}</Badge>
                          <span className="font-black text-sm text-emerald-600 dark:text-emerald-400">R$ {group.products.reduce((sum: number, p: any) => sum + p.value, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        </div>
                        <p className="font-black text-sm text-gray-900 dark:text-white truncate mb-2 group-hover/order:text-blue-600 transition-colors" title={group.supplierName}>{group.supplierName}</p>
                        <div className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter line-clamp-2 leading-relaxed opacity-60">
                          {group.products.map((p: any) => safeStr(p.product_name)).join(", ")}
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Dados de Entrega Semiglass */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 bg-white/20 dark:bg-black/10 p-8 rounded-[2rem] border border-white/20">
                <div className="space-y-3">
                  <label className="block text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em] pl-1">Data de Entrega *</label>
                  <div className="relative group">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-hover:text-teal-500 transition-colors pointer-events-none" />
                    <Input 
                      type="date" 
                      value={deliveryDate} 
                      onChange={(e) => setDeliveryDate(e.target.value)} 
                      className="h-12 bg-white/60 dark:bg-gray-950/60 border-white/30 dark:border-white/10 font-bold rounded-2xl pl-12 focus:ring-teal-500/20 shadow-sm" 
                      min={new Date().toISOString().split('T')[0]} 
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="block text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em] pl-1">Observações do Pedido</label>
                  <div className="relative group">
                    <FileText className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-hover:text-teal-500 transition-colors pointer-events-none" />
                    <Input 
                      value={observations} 
                      onChange={(e) => setObservations(e.target.value)} 
                      placeholder="Instruções para o fornecedor..." 
                      className="h-12 bg-white/60 dark:bg-gray-950/60 border-white/30 dark:border-white/10 font-medium rounded-2xl pl-12 focus:ring-teal-500/20 shadow-sm" 
                    />
                  </div>
                </div>
              </div>

              {/* Botão de Ação Impactante */}
              <div className="pt-4 pb-8">
                <Button 
                  onClick={handleConvertToOrder} 
                  disabled={!deliveryDate || Object.keys(productSelections).length === 0} 
                  className="w-full h-16 bg-gradient-to-r from-teal-600 via-emerald-600 to-teal-600 hover:from-teal-700 hover:to-emerald-700 text-white font-black text-sm uppercase tracking-[0.3em] shadow-2xl shadow-emerald-500/20 rounded-[1.5rem] transition-all active:scale-[0.98] ring-2 ring-white/20 relative overflow-hidden group"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:animate-shimmer pointer-events-none"></div>
                  <ShoppingCart className="h-6 w-6 mr-4" />
                  {supplierGroups.length > 1 ? `Confirmar ${supplierGroups.length} Pedidos de Compra` : "Converter Cotação em Pedido"}
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Footer com design semiglass */}
        <div className="flex-shrink-0 px-8 py-5 border-t border-white/20 dark:border-white/10 bg-white/40 dark:bg-gray-950/40 backdrop-blur-2xl flex justify-between items-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-t from-teal-500/5 to-transparent pointer-events-none"></div>
          <div className="flex items-center gap-4 relative z-10">
            <div className="h-2 w-2 rounded-full bg-teal-500 animate-pulse"></div>
            <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Modo de Gerenciamento Ativo</span>
          </div>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)} 
            className="border-white/30 dark:border-white/10 bg-white/5 dark:bg-white/5 font-black text-[10px] uppercase tracking-[0.2em] h-11 px-8 hover:bg-white/10 transition-all rounded-xl backdrop-blur-md shadow-sm relative z-10"
          >
            Fechar Painel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
