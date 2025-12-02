import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Package, Building2, X, DollarSign, Edit2, TrendingDown, FileText, Calendar, Check, ClipboardList, Users, ShoppingCart, AlertCircle, Award, Plus, Trash2, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import type { Quote } from "@/hooks/useCotacoes";

interface GerenciarCotacaoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quote: Quote;
  onUpdateSupplierProductValue: (quoteId: string, supplierId: string, productId: string, newValue: number) => void;
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
  const [activeTab, setActiveTab] = useState("detalhes");
  const [selectedSupplier, setSelectedSupplier] = useState<string>("");
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editedValues, setEditedValues] = useState<Record<string, number>>({});
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

  const products = (quote as any)?._raw?.quote_items || [];
  const fornecedores = quote.fornecedoresParticipantes || [];
  
  // Filtrar produtos e fornecedores que ainda não estão na cotação
  const productsNotInQuote = availableProducts.filter(p => !products.some((item: any) => item.product_id === p.id));
  const suppliersNotInQuote = availableSuppliers.filter(s => !fornecedores.some(f => f.id === s.id));

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

  useEffect(() => {
    if (open) {
      setActiveTab("detalhes");
      if (fornecedores.length > 0) setSelectedSupplier(fornecedores[0].id);
      setDeliveryDate("");
      setObservations("");
    } else {
      setSelectedSupplier("");
      setEditingProductId(null);
      setEditedValues({});
    }
  }, [open, fornecedores]);

  useEffect(() => {
    if (editingProductId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingProductId]);

  const getSupplierProductValue = (supplierId: string, productId: string): number => {
    const raw = quote as any;
    const supplierItems = raw._supplierItems || raw._raw?.quote_supplier_items || [];
    const item = supplierItems.find((i: any) => i?.supplier_id === supplierId && i?.product_id === productId);
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
    fornecedores.forEach(f => {
      const value = getSupplierProductValue(f.id, productId);
      if (value > 0 && value < bestPrice) { bestPrice = value; bestSupplierId = f.id; }
    });
    return { bestPrice: bestPrice === Infinity ? 0 : bestPrice, bestSupplierId };
  };

  const handleStartEdit = (productId: string, currentValue: number) => {
    setEditingProductId(productId);
    setEditedValues(prev => ({ ...prev, [productId]: currentValue }));
  };

  const handleSaveEdit = async (productId: string) => {
    if (selectedSupplier && editedValues[productId] !== undefined) {
      try {
        await onUpdateSupplierProductValue(quote.id, selectedSupplier, productId, editedValues[productId]);
        setEditingProductId(null);
        toast({ title: "✅ Valor atualizado!" });
        onRefresh();
      } catch {
        toast({ title: "❌ Erro ao salvar", variant: "destructive" });
      }
    }
  };

  const handleCancelEdit = () => {
    setEditingProductId(null);
    setEditedValues({});
  };

  const calcularTotalFornecedor = (supplierId: string) => {
    return products.reduce((total: number, product: any) => total + getSupplierProductValue(supplierId, product.product_id), 0);
  };

  const safeStr = (val: any) => (typeof val === 'string' ? val : String(val || ''));

  // Calcular total da seleção atual
  const calcularTotalSelecao = () => {
    return products.reduce((total: number, product: any) => {
      const supplierId = productSelections[product.product_id];
      if (supplierId) {
        return total + getSupplierProductValue(supplierId, product.product_id);
      }
      return total;
    }, 0);
  };

  // Calcular melhor total possível
  const calcularMelhorTotal = () => {
    return products.reduce((total: number, product: any) => {
      const { bestPrice } = getBestPriceInfoForProduct(product.product_id);
      return total + bestPrice;
    }, 0);
  };

  // Agrupar produtos por fornecedor selecionado
  const getSupplierGroups = () => {
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
  };

  // Converter em pedido(s)
  const handleConvertToOrder = () => {
    if (!deliveryDate) {
      toast({ title: "Informe a data de entrega", variant: "destructive" });
      return;
    }

    const groups = getSupplierGroups();
    if (groups.length === 0) {
      toast({ title: "Selecione fornecedores para os produtos", variant: "destructive" });
      return;
    }

    if (onConvertToOrder) {
      const orders = groups.map(group => ({
        supplierId: group.supplierId,
        productIds: group.products.map((p: any) => p.product_id),
        deliveryDate,
        observations: observations || undefined
      }));

      onConvertToOrder(quote.id, orders);
      onOpenChange(false);
    }
  };

  const stats = {
    totalProdutos: products.length,
    totalFornecedores: fornecedores.length,
    fornecedoresRespondidos: fornecedores.filter(f => f.status === "respondido").length,
    melhorValor: Math.min(...fornecedores.filter(f => f.valorOferecido > 0).map(f => f.valorOferecido)) || 0,
    melhorFornecedor: fornecedores.find(f => f.valorOferecido === Math.min(...fornecedores.filter(x => x.valorOferecido > 0).map(x => x.valorOferecido)))?.nome || '-'
  };

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
        <DialogHeader className="flex-shrink-0 px-5 py-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-gray-800 dark:to-gray-800">
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
                                    <p className="font-medium text-sm text-gray-900 dark:text-white truncate" style={{ maxWidth: '180px' }} title={safeStr(product.product_name)}>
                                      {safeStr(product.product_name)}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 sm:hidden mt-0.5">
                                      {safeStr(product.quantidade)} {safeStr(product.unidade)}
                                    </p>
                                  </td>
                                  <td className="px-3 sm:px-4 py-3 hidden sm:table-cell">
                                    <span className="text-sm text-gray-600 dark:text-gray-300">{safeStr(product.quantidade)} {safeStr(product.unidade)}</span>
                                  </td>
                                  <td className="px-3 sm:px-4 py-3">
                                    {isEditing ? (
                                      <div className="flex items-center gap-2">
                                        <Input 
                                          ref={editInputRef} 
                                          type="number" 
                                          step="0.01" 
                                          min="0" 
                                          value={editedValues[product.product_id] || 0}
                                          onChange={(e) => setEditedValues(prev => ({ ...prev, [product.product_id]: Number(e.target.value) }))}
                                          onKeyDown={(e) => { if (e.key === 'Enter') handleSaveEdit(product.product_id); if (e.key === 'Escape') handleCancelEdit(); }}
                                          className="w-24 sm:w-28 h-8 text-sm bg-white dark:bg-gray-900 border-teal-300 dark:border-teal-700 focus:ring-teal-500" 
                                        />
                                        <Button size="sm" onClick={() => handleSaveEdit(product.product_id)} className="h-8 w-8 p-0 bg-teal-600 hover:bg-teal-700 text-white">
                                          <Check className="h-4 w-4" />
                                        </Button>
                                        <Button size="sm" variant="outline" onClick={handleCancelEdit} className="h-8 w-8 p-0 border-red-300 text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-400">
                                          <X className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    ) : (
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <span className={cn("font-semibold text-sm", isBestPrice ? "text-green-700 dark:text-green-300" : "text-gray-900 dark:text-white")}>
                                          R$ {currentValue.toFixed(2)}
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
                                        onClick={() => handleStartEdit(product.product_id, currentValue)} 
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
                    <p className="text-2xl font-bold text-blue-800 dark:text-blue-200">R$ {calcularTotalSelecao().toFixed(2)}</p>
                  </Card>
                  <Card className="p-4 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                    <div className="flex items-center gap-2 mb-1"><Award className="h-4 w-4 text-green-600 dark:text-green-400" /><span className="text-xs text-green-700 dark:text-green-300">Melhor Total Possível</span></div>
                    <p className="text-2xl font-bold text-green-800 dark:text-green-200">R$ {calcularMelhorTotal().toFixed(2)}</p>
                  </Card>
                </div>

                {calcularTotalSelecao() > calcularMelhorTotal() && (
                  <Card className="p-3 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                      <span className="text-sm text-amber-700 dark:text-amber-300">
                        Você pode economizar R$ {(calcularTotalSelecao() - calcularMelhorTotal()).toFixed(2)} selecionando os melhores preços
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
                {getSupplierGroups().length > 0 && (
                  <Card className="border-gray-200 dark:border-gray-700">
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                      <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <ShoppingCart className="h-4 w-4" />
                        {getSupplierGroups().length === 1 ? "Pedido que será gerado" : `${getSupplierGroups().length} pedidos que serão gerados`}
                      </h3>
                    </div>
                    <div className="divide-y divide-gray-100 dark:divide-gray-700">
                      {getSupplierGroups().map((group, index) => (
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
                <Button onClick={handleConvertToOrder} disabled={!deliveryDate || Object.keys(productSelections).length === 0} className="w-full bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white h-12 text-base">
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  {getSupplierGroups().length > 1 ? `Gerar ${getSupplierGroups().length} Pedidos` : "Converter em Pedido"}
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
