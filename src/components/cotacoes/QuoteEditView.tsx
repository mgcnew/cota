import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, Package, Calendar, DollarSign, TrendingDown, Users, Building2, BarChart3, FileText, ShoppingCart, Edit2, Save, X, Loader2 } from "lucide-react";
import { useState, useRef, useEffect, useMemo } from "react";
import type { Quote, FornecedorParticipante } from "@/hooks/useCotacoes";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { PriceConverter } from "@/components/forms/PriceConverter";
import ConvertToOrderDialog from "@/components/forms/ConvertToOrderDialog";
import ConvertToMultipleOrdersDialog, { SupplierOrder } from "@/components/forms/ConvertToMultipleOrdersDialog";
import { SelectSupplierPerProductDialog } from "@/components/forms/SelectSupplierPerProductDialog";
import { motion } from "framer-motion";
import { toast } from "@/hooks/use-toast";

interface QuoteEditViewProps {
  quote: Quote;
  onBack: () => void;
  onUpdateSupplierProductValue: (quoteId: string, supplierId: string, productId: string, newValue: number) => void;
  onConvertToOrder: (quoteId: string, orders: Array<{
    supplierId: string;
    productIds: string[];
    deliveryDate: string;
    observations?: string;
  }>) => void;
  onEdit?: (quoteId: string, data: any) => void;
  isUpdating?: boolean;
}

export default function QuoteEditView({
  quote,
  onBack,
  onUpdateSupplierProductValue,
  onConvertToOrder,
  isUpdating = false
}: QuoteEditViewProps) {
  const [activeTab, setActiveTab] = useState("detalhes");
  const [selectedSupplier, setSelectedSupplier] = useState<string>("");
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editedValues, setEditedValues] = useState<Record<string, number>>({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [convertDialogOpen, setConvertDialogOpen] = useState(false);
  const [selectedSupplierForConversion, setSelectedSupplierForConversion] = useState<{ id: string; name: string } | null>(null);
  const [showSelectSupplierDialog, setShowSelectSupplierDialog] = useState(false);
  const [selectedSuppliers, setSelectedSuppliers] = useState<Map<string, { supplierId: string; supplierName: string }>>(new Map());
  const [showMultipleOrdersDialog, setShowMultipleOrdersDialog] = useState(false);
  const [supplierOrdersForConversion, setSupplierOrdersForConversion] = useState<SupplierOrder[]>([]);
  const editInputRef = useRef<HTMLInputElement>(null);

  const products = (quote as any)._raw?.quote_items || [];

  const handleStartEdit = (productId: string, currentValue: number) => {
    setEditingProductId(productId);
    setEditedValues(prev => ({ ...prev, [productId]: currentValue }));
    setHasUnsavedChanges(true);
  };

  useEffect(() => {
    if (editingProductId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingProductId]);

  useEffect(() => {
    if (hasUnsavedChanges && editingProductId) {
      toast({
        title: "Valor não salvo",
        description: "Os valores editados não foram salvos. Salve antes de trocar de fornecedor.",
        variant: "destructive",
      });
      return;
    }
    
    setEditedValues({});
    setEditingProductId(null);
    setHasUnsavedChanges(false);
  }, [selectedSupplier]);

  const handleSaveEdit = async (productId: string) => {
    if (selectedSupplier && editedValues[productId] !== undefined) {
      await onUpdateSupplierProductValue(quote.id, selectedSupplier, productId, editedValues[productId]);
      setEditingProductId(null);
      setHasUnsavedChanges(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingProductId(null);
    setEditedValues({});
  };

  const getSupplierProductValue = (supplierId: string, productId: string): number => {
    const supplierItems = (quote as any)._supplierItems || (quote as any)._raw?.quote_supplier_items || [];
    const item = supplierItems.find(
      (item: any) => item.supplier_id === supplierId && item.product_id === productId
    );
    return item?.valor_oferecido || 0;
  };

  const getCurrentProductValue = (supplierId: string, productId: string): number => {
    if (selectedSupplier === supplierId && editedValues[productId] !== undefined) {
      return editedValues[productId];
    }
    return getSupplierProductValue(supplierId, productId);
  };

  const getBestPriceInfoForProduct = (productId: string): { bestPrice: number; bestSupplierId: string | null } => {
    let bestPrice = Infinity;
    let bestSupplierId: string | null = null;

    quote.fornecedoresParticipantes.forEach(f => {
      const value = getSupplierProductValue(f.id, productId);
      if (value > 0 && value < bestPrice) {
        bestPrice = value;
        bestSupplierId = f.id;
      }
    });

    return {
      bestPrice: bestPrice === Infinity ? 0 : bestPrice,
      bestSupplierId
    };
  };

  const getMelhorValor = () => {
    const valores = quote.fornecedoresParticipantes
      .filter(f => f.valorOferecido > 0)
      .map(f => f.valorOferecido);
    return valores.length > 0 ? Math.min(...valores) : 0;
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      ativa: "default",
      concluida: "secondary",
      pendente: "outline",
      expirada: "destructive",
      finalizada: "default",
      planejada: "outline"
    };

    const labels = {
      ativa: "Ativa",
      concluida: "Concluída",
      pendente: "Pendente",
      expirada: "Expirada",
      finalizada: "Finalizada",
      planejada: "Planejada"
    };

    return (
      <Badge variant={variants[status as keyof typeof variants] as any}>
        {labels[status as keyof typeof labels] || status}
      </Badge>
    );
  };

  const getBestSupplier = () => {
    if (quote.fornecedoresParticipantes.length === 0) return null;

    let bestSupplier = null;
    let lowestTotal = Infinity;

    quote.fornecedoresParticipantes.forEach(fornecedor => {
      let total = 0;
      products.forEach((product: any) => {
        const value = getSupplierProductValue(fornecedor.id, product.product_id);
        if (value > 0) {
          total += value;
        }
      });

      if (total > 0 && total < lowestTotal) {
        lowestTotal = total;
        bestSupplier = fornecedor;
      }
    });

    return bestSupplier ? { ...bestSupplier, totalValue: lowestTotal } : null;
  };

  const buildProductSelections = () => {
    if (!products || products.length === 0) {
      return [];
    }

    return products.map((item: any) => {
      const supplierOptions = quote.fornecedoresParticipantes
        .map(fornecedor => {
          const supplierItem = ((quote as any)._supplierItems || (quote as any)._raw?.quote_supplier_items || []).find(
            (si: any) => si.supplier_id === fornecedor.id && si.product_id === item.product_id
          );

          return {
            supplierId: fornecedor.id,
            supplierName: fornecedor.nome,
            price: supplierItem?.valor_oferecido || 0,
            isBest: false
          };
        })
        .filter(s => s.price > 0);

      if (supplierOptions.length > 0) {
        const minPrice = Math.min(...supplierOptions.map(s => s.price));
        supplierOptions.forEach(option => {
          if (option.price === minPrice) {
            option.isBest = true;
          }
        });
      }

      const bestSupplierOption = supplierOptions.find(option => option.isBest);

      return {
        productId: item.product_id,
        productName: item.product_name,
        quantity: item.quantidade,
        unit: item.unidade,
        selectedSupplierId: bestSupplierOption?.supplierId || "",
        selectedSupplierName: bestSupplierOption?.supplierName || "",
        supplierOptions
      };
    });
  };

  const handleConvertToOrder = () => {
    const productSelections = buildProductSelections();

    if (productSelections.length === 0) {
      return;
    }

    const hasMultipleProducts = productSelections.length > 1;
    const hasTiedBestPrices = productSelections.some(selection =>
      selection.supplierOptions.filter(option => option.isBest).length > 1
    );

    if (hasMultipleProducts || hasTiedBestPrices) {
      const initialSelections = new Map<string, { supplierId: string; supplierName: string }>();
      productSelections.forEach(selection => {
        if (selection.selectedSupplierId) {
          initialSelections.set(selection.productId, {
            supplierId: selection.selectedSupplierId,
            supplierName: selection.selectedSupplierName
          });
        } else if (selection.supplierOptions.length > 0) {
          const fallback = selection.supplierOptions[0];
          initialSelections.set(selection.productId, {
            supplierId: fallback.supplierId,
            supplierName: fallback.supplierName
          });
        }
      });

      setSelectedSuppliers(initialSelections);
      setShowSelectSupplierDialog(true);
      return;
    }

    const bestSupplier = getBestSupplier();
    if (bestSupplier) {
      setSelectedSupplierForConversion({
        id: bestSupplier.id,
        name: bestSupplier.nome
      });
      setConvertDialogOpen(true);
    }
  };

  const handleSupplierSelectionConfirm = (selections: Map<string, { supplierId: string; supplierName: string }>) => {
    setSelectedSuppliers(selections);
    setShowSelectSupplierDialog(false);

    const supplierGroups = new Map<string, string[]>();
    selections.forEach((selection, productId) => {
      if (!supplierGroups.has(selection.supplierId)) {
        supplierGroups.set(selection.supplierId, []);
      }
      supplierGroups.get(selection.supplierId)!.push(productId);
    });

    if (supplierGroups.size === 1) {
      const [supplierId, productIds] = Array.from(supplierGroups.entries())[0];
      const selection = selections.get(productIds[0]);
      if (selection) {
        setSelectedSupplierForConversion({
          id: selection.supplierId,
          name: selection.supplierName
        });
        setConvertDialogOpen(true);
      }
    } else {
      if (!quote || !(quote as any)._raw) {
        return;
      }
      
      const supplierOrders: SupplierOrder[] = Array.from(supplierGroups.entries())
        .map(([supplierId, productIds]) => {
          const selection = selections.get(productIds[0]);
          if (!selection) return null;
          const supplierName = selection.supplierName;
          
          const productsData = productIds.map(productId => {
            const product = (quote as any)._raw.quote_items.find((item: any) => item.product_id === productId);
            if (!product) return null;
            const value = getSupplierProductValue(supplierId, productId);
            
            return {
              productId,
              productName: product.product_name,
              quantity: product.quantidade,
              value
            };
          }).filter(Boolean) as Array<{ productId: string; productName: string; quantity: string; value: number }>;
          
          if (productsData.length === 0) return null;
          
          const totalValue = productsData.reduce((sum, p) => sum + p.value, 0);
          
          return {
            supplierId,
            supplierName,
            products: productsData,
            totalValue,
            deliveryDate: '',
            observations: ''
          };
        })
        .filter(Boolean) as SupplierOrder[];

      setSupplierOrdersForConversion(supplierOrders);
      setShowMultipleOrdersDialog(true);
    }
  };

  const handleConfirmConversion = (deliveryDate: string, observations?: string) => {
    if (selectedSupplierForConversion && onConvertToOrder) {
      const allProductIds = products.map((p: any) => p.product_id);
      onConvertToOrder(quote.id, [{
        supplierId: selectedSupplierForConversion.id,
        productIds: allProductIds,
        deliveryDate,
        observations
      }]);
      setConvertDialogOpen(false);
      onBack();
    }
  };

  const handleConfirmMultipleOrders = (supplierOrders: SupplierOrder[]) => {
    if (onConvertToOrder) {
      const orders = supplierOrders.map(order => ({
        supplierId: order.supplierId,
        productIds: order.products.map(p => p.productId),
        deliveryDate: order.deliveryDate,
        observations: order.observations
      }));
      
      onConvertToOrder(quote.id, orders);
      setShowMultipleOrdersDialog(false);
      onBack();
    }
  };

  const bestSupplier = getBestSupplier();

  const getConversionProducts = () => {
    if (!bestSupplier) return [];
    return products.map((product: any) => {
      const value = getSupplierProductValue(bestSupplier.id, product.product_id);
      return {
        id: product.product_id,
        name: product.product_name,
        quantity: product.quantidade,
        value: value
      };
    });
  };

  // Memoizar stats para performance
  const stats = useMemo(() => {
    const totalFornecedores = quote.fornecedoresParticipantes.length;
    const fornecedoresRespondidos = quote.fornecedoresParticipantes.filter(f => f.status === "respondido").length;
    const melhorValor = getMelhorValor();
    const economia = quote.economia;

    return {
      totalFornecedores,
      fornecedoresRespondidos,
      melhorValor,
      economia
    };
  }, [quote]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen bg-gray-50 dark:bg-gray-950"
    >
      {/* Header Fixo */}
      <div className="sticky top-0 z-20 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Button
              onClick={onBack}
              variant="ghost"
              size="sm"
              className="gap-2 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
            <div className="flex items-center gap-3 flex-1">
              <div className="p-2 rounded-lg bg-gradient-to-br from-primary to-primary/80 text-white">
                <Package className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Cotação #{quote.id.substring(0, 8)}
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {quote.produtoResumo}
                </p>
              </div>
            </div>
            {getStatusBadge(quote.status)}
          </div>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="detalhes" className="gap-2">
              <Package className="h-4 w-4" />
              Detalhes
            </TabsTrigger>
            <TabsTrigger value="valores" className="gap-2">
              <DollarSign className="h-4 w-4" />
              Atualizar Valores
            </TabsTrigger>
            <TabsTrigger value="converter" className="gap-2">
              <ShoppingCart className="h-4 w-4" />
              Converter
            </TabsTrigger>
          </TabsList>

          {/* Tab Detalhes */}
          <TabsContent value="detalhes" className="space-y-6">
            {/* Resumo Executivo */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                    <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Fornecedores</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {stats.fornecedoresRespondidos}/{stats.totalFornecedores}
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                    <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Melhor Preço</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      R$ {stats.melhorValor.toFixed(2)}
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                    <TrendingDown className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Economia</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {stats.economia}
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/30">
                    <Package className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Produtos</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {products.length}
                    </p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Informações Gerais */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                Informações da Cotação
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Período</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {quote.dataInicio} - {quote.dataFim}
                    </p>
                  </div>
                </div>
                {quote.dataPlanejada && (
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Data Planejada</p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {new Date(quote.dataPlanejada).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <Building2 className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Melhor Fornecedor</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {quote.melhorFornecedor}
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Lista de Produtos */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                Produtos da Cotação
              </h3>
              <div className="space-y-3">
                {products.map((product: any, index: number) => (
                  <div
                    key={product.product_id}
                    className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-semibold text-primary">
                          {index + 1}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {product.product_name}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {product.quantidade} {product.unidade}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline">
                      {(() => {
                        const { bestPrice } = getBestPriceInfoForProduct(product.product_id);
                        return bestPrice > 0 ? `R$ ${bestPrice.toFixed(2)}` : "Sem preço";
                      })()}
                    </Badge>
                  </div>
                ))}
              </div>
            </Card>

            {/* Fornecedores Participantes */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                Fornecedores Participantes
              </h3>
              <div className="space-y-3">
                {quote.fornecedoresParticipantes.map((fornecedor) => (
                  <div
                    key={fornecedor.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700"
                  >
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {fornecedor.nome}
                      </p>
                      {fornecedor.dataResposta && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Respondido em: {fornecedor.dataResposta}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      {fornecedor.valorOferecido > 0 && (
                        <p className="text-lg font-semibold text-gray-900 dark:text-white">
                          R$ {fornecedor.valorOferecido.toFixed(2)}
                        </p>
                      )}
                      <Badge variant={fornecedor.status === "respondido" ? "default" : "outline"}>
                        {fornecedor.status === "respondido" ? "Respondido" : "Pendente"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>

          {/* Tab Atualizar Valores */}
          <TabsContent value="valores" className="space-y-6">
            <Card className="p-6">
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Selecionar Fornecedor
                </label>
                <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
                  <SelectTrigger className="w-full md:w-[300px]">
                    <SelectValue placeholder="Escolha um fornecedor" />
                  </SelectTrigger>
                  <SelectContent>
                    {quote.fornecedoresParticipantes.map((f) => (
                      <SelectItem key={f.id} value={f.id}>
                        {f.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedSupplier && (
                <div className="space-y-3">
                  <div className="grid grid-cols-12 gap-4 px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg font-medium text-sm text-gray-700 dark:text-gray-300">
                    <div className="col-span-5">Produto</div>
                    <div className="col-span-2 text-center">Quantidade</div>
                    <div className="col-span-2 text-center">Melhor Preço</div>
                    <div className="col-span-3 text-center">Valor Oferecido</div>
                  </div>

                  {products.map((product: any) => {
                    const currentValue = getCurrentProductValue(selectedSupplier, product.product_id);
                    const { bestPrice, bestSupplierId } = getBestPriceInfoForProduct(product.product_id);
                    const isEditing = editingProductId === product.product_id;
                    const isBestSupplier = bestSupplierId === selectedSupplier;

                    return (
                      <div
                        key={product.product_id}
                        className={cn(
                          "grid grid-cols-12 gap-4 p-4 rounded-lg border transition-all",
                          isBestSupplier
                            ? "bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700"
                            : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                        )}
                      >
                        <div className="col-span-5 flex items-center">
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {product.product_name}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {product.quantidade} {product.unidade}
                            </p>
                          </div>
                        </div>

                        <div className="col-span-2 flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {product.quantidade}
                          </span>
                        </div>

                        <div className="col-span-2 flex items-center justify-center">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <Badge variant={isBestSupplier ? "default" : "outline"}>
                                  {bestPrice > 0 ? `R$ ${bestPrice.toFixed(2)}` : "-"}
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent>
                                {isBestSupplier ? "Você tem o melhor preço!" : "Menor preço entre fornecedores"}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>

                        <div className="col-span-3 flex items-center justify-center gap-2">
                          {isEditing ? (
                            <>
                              <Input
                                ref={editInputRef}
                                type="number"
                                step="0.01"
                                value={editedValues[product.product_id] || 0}
                                onChange={(e) => 
                                  setEditedValues(prev => ({
                                    ...prev,
                                    [product.product_id]: parseFloat(e.target.value) || 0
                                  }))
                                }
                                className="w-28 h-9"
                              />
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleSaveEdit(product.product_id)}
                                disabled={isUpdating}
                                className="h-9 w-9 p-0 text-green-600 hover:text-green-700 hover:bg-green-100"
                              >
                                {isUpdating ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Save className="h-4 w-4" />
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={handleCancelEdit}
                                className="h-9 w-9 p-0 text-red-600 hover:text-red-700 hover:bg-red-100"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </>
                          ) : (
                            <>
                              <span className="text-lg font-semibold text-gray-900 dark:text-white">
                                {currentValue > 0 ? `R$ ${currentValue.toFixed(2)}` : "-"}
                              </span>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleStartEdit(product.product_id, currentValue)}
                                className="h-9 w-9 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-100"
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {!selectedSupplier && (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  Selecione um fornecedor para atualizar os valores
                </div>
              )}
            </Card>

            {/* <PriceConverter /> */}
          </TabsContent>

          {/* Tab Converter */}
          <TabsContent value="converter" className="space-y-6">
            <Card className="p-6">
              <div className="text-center space-y-4">
                <div className="inline-flex p-4 rounded-full bg-primary/10">
                  <ShoppingCart className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    Converter em Pedido
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Transforme esta cotação em um ou mais pedidos de compra
                  </p>
                </div>

                {bestSupplier && (
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 max-w-md mx-auto">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      Melhor fornecedor
                    </p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {bestSupplier.nome}
                    </p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-2">
                      R$ {bestSupplier.totalValue.toFixed(2)}
                    </p>
                  </div>
                )}

                <Button
                  onClick={handleConvertToOrder}
                  disabled={!bestSupplier || quote.status === "finalizada"}
                  size="lg"
                  className="mt-6"
                >
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  Converter para Pedido
                </Button>

                {quote.status === "finalizada" && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
                    Esta cotação já foi convertida em pedido
                  </p>
                )}
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialogs */}
      {convertDialogOpen && selectedSupplierForConversion && bestSupplier && (
        <ConvertToOrderDialog
          open={convertDialogOpen}
          onOpenChange={setConvertDialogOpen}
          quote={{
            id: quote.id,
            produto: quote.produto,
            quantidade: quote.quantidade
          }}
          supplier={{
            id: selectedSupplierForConversion.id,
            name: selectedSupplierForConversion.name
          }}
          products={getConversionProducts()}
          totalValue={bestSupplier.totalValue}
          onConfirm={handleConfirmConversion}
        />
      )}

      {showSelectSupplierDialog && (
        <SelectSupplierPerProductDialog
          open={showSelectSupplierDialog}
          onOpenChange={setShowSelectSupplierDialog}
          products={buildProductSelections()}
          onConfirm={handleSupplierSelectionConfirm}
        />
      )}

      {showMultipleOrdersDialog && (
        <ConvertToMultipleOrdersDialog
          open={showMultipleOrdersDialog}
          onOpenChange={setShowMultipleOrdersDialog}
          supplierOrders={supplierOrdersForConversion}
          onConfirm={handleConfirmMultipleOrders}
        />
      )}
    </motion.div>
  );
}
