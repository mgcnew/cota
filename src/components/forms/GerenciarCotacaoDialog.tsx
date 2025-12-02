import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Package, Building2, X, Save, DollarSign, Edit2, TrendingDown, FileText, Calendar, Check, ClipboardList, Users, ShoppingCart, AlertCircle, Award } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import type { Quote } from "@/hooks/useCotacoes";

interface GerenciarCotacaoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quote: Quote;
  onUpdateSupplierProductValue: (quoteId: string, supplierId: string, productId: string, newValue: number) => void;
  onConvertToOrder?: (quoteId: string, orders: Array<{ supplierId: string; productIds: string[]; deliveryDate: string; observations?: string }>) => void;
  onRefresh: () => void;
  isUpdating?: boolean;
}

export default function GerenciarCotacaoDialog({ open, onOpenChange, quote, onUpdateSupplierProductValue, onConvertToOrder, onRefresh }: GerenciarCotacaoDialogProps) {
  const [activeTab, setActiveTab] = useState("detalhes");
  const [selectedSupplier, setSelectedSupplier] = useState<string>("");
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editedValues, setEditedValues] = useState<Record<string, number>>({});
  const editInputRef = useRef<HTMLInputElement>(null);
  
  // Estado para conversão
  const [productSelections, setProductSelections] = useState<Record<string, string>>({});
  const [deliveryDate, setDeliveryDate] = useState("");
  const [observations, setObservations] = useState("");

  const products = (quote as any)?._raw?.quote_items || [];
  const fornecedores = quote.fornecedoresParticipantes || [];

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


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl w-[95vw] h-[90vh] max-h-[850px] p-0 overflow-hidden bg-white dark:bg-gray-900 flex flex-col">
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
          <TabsList className="flex-shrink-0 w-full justify-start rounded-none border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-0 h-auto">
            <TabsTrigger value="detalhes" className="rounded-none border-b-2 border-transparent data-[state=active]:border-teal-500 data-[state=active]:bg-transparent px-4 py-3">
              <FileText className="h-4 w-4 mr-2" />Detalhes
            </TabsTrigger>
            <TabsTrigger value="valores" className="rounded-none border-b-2 border-transparent data-[state=active]:border-teal-500 data-[state=active]:bg-transparent px-4 py-3">
              <DollarSign className="h-4 w-4 mr-2" />Editar Valores
            </TabsTrigger>
            <TabsTrigger value="converter" className="rounded-none border-b-2 border-transparent data-[state=active]:border-teal-500 data-[state=active]:bg-transparent px-4 py-3">
              <ShoppingCart className="h-4 w-4 mr-2" />Converter em Pedido
            </TabsTrigger>
          </TabsList>

          {/* Tab Detalhes */}
          <TabsContent value="detalhes" className="flex-1 overflow-auto m-0 p-0">
            <ScrollArea className="h-full">
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
            <div className="flex h-full">
              <div className="w-56 flex-shrink-0 border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex flex-col">
                <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-2"><Building2 className="h-4 w-4 text-teal-600 dark:text-teal-400" /><span className="text-sm font-semibold text-gray-700 dark:text-gray-200">Fornecedores</span></div>
                </div>
                <ScrollArea className="flex-1">
                  <div className="p-2 space-y-1">
                    {fornecedores.map((fornecedor) => {
                      const total = calcularTotalFornecedor(fornecedor.id);
                      const isSelected = selectedSupplier === fornecedor.id;
                      return (
                        <button key={fornecedor.id} onClick={() => { setSelectedSupplier(fornecedor.id); setEditingProductId(null); setEditedValues({}); }}
                          className={cn("w-full text-left px-3 py-2.5 rounded-lg transition-all", isSelected ? "bg-teal-100 dark:bg-teal-900/40 border border-teal-300 dark:border-teal-700" : "hover:bg-gray-100 dark:hover:bg-gray-700 border border-transparent")}>
                          <div className="flex items-center gap-2">
                            <div className={cn("w-2 h-2 rounded-full flex-shrink-0", fornecedor.status === 'respondido' ? "bg-green-500" : "bg-amber-500")} />
                            <span className={cn("text-sm font-medium truncate", isSelected ? "text-teal-800 dark:text-teal-200" : "text-gray-700 dark:text-gray-300")} title={safeStr(fornecedor.nome)}>{safeStr(fornecedor.nome)}</span>
                          </div>
                          <div className="mt-1 ml-4"><span className={cn("text-xs", isSelected ? "text-teal-600 dark:text-teal-400" : "text-gray-500 dark:text-gray-400")}>Total: R$ {total.toFixed(2)}</span></div>
                        </button>
                      );
                    })}
                  </div>
                </ScrollArea>
              </div>

              <div className="flex-1 flex flex-col overflow-hidden min-w-0">
                {selectedSupplier ? (
                  <>
                    <div className="flex-shrink-0 px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 flex items-center justify-between">
                      <div className="flex items-center gap-2"><DollarSign className="h-4 w-4 text-teal-600 dark:text-teal-400" /><span className="font-semibold text-gray-900 dark:text-white">{fornecedores.find(f => f.id === selectedSupplier)?.nome}</span></div>
                      <Badge className="bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-700">Total: R$ {calcularTotalFornecedor(selectedSupplier).toFixed(2)}</Badge>
                    </div>
                    <ScrollArea className="flex-1">
                      <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700 sticky top-0">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 w-[40%]">Produto</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 w-[15%]">Qtd</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 w-[30%]">Valor (R$)</th>
                            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 dark:text-gray-300 w-[15%]">Ação</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                          {products.map((product: any) => {
                            const currentValue = getCurrentProductValue(selectedSupplier, product.product_id);
                            const isEditing = editingProductId === product.product_id;
                            const { bestSupplierId } = getBestPriceInfoForProduct(product.product_id);
                            const isBestPrice = currentValue > 0 && selectedSupplier === bestSupplierId;
                            return (
                              <tr key={product.product_id} className={cn("hover:bg-gray-50 dark:hover:bg-gray-800/50", isBestPrice && "bg-green-50/50 dark:bg-green-900/10")}>
                                <td className="px-4 py-3"><p className="font-medium text-sm text-gray-900 dark:text-white truncate">{safeStr(product.product_name)}</p></td>
                                <td className="px-4 py-3"><span className="text-sm text-gray-600 dark:text-gray-300">{safeStr(product.quantidade)} {safeStr(product.unidade)}</span></td>
                                <td className="px-4 py-3">
                                  {isEditing ? (
                                    <div className="flex items-center gap-2">
                                      <Input ref={editInputRef} type="number" step="0.01" min="0" value={editedValues[product.product_id] || 0}
                                        onChange={(e) => setEditedValues(prev => ({ ...prev, [product.product_id]: Number(e.target.value) }))}
                                        onKeyDown={(e) => { if (e.key === 'Enter') handleSaveEdit(product.product_id); if (e.key === 'Escape') handleCancelEdit(); }}
                                        className="w-28 h-8 text-sm bg-white dark:bg-gray-900 border-teal-300 dark:border-teal-700" />
                                      <Button size="sm" onClick={() => handleSaveEdit(product.product_id)} className="h-8 w-8 p-0 bg-teal-600 hover:bg-teal-700 text-white"><Check className="h-4 w-4" /></Button>
                                      <Button size="sm" variant="outline" onClick={handleCancelEdit} className="h-8 w-8 p-0 border-red-300 text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-400"><X className="h-4 w-4" /></Button>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-2">
                                      <span className={cn("font-semibold text-sm", isBestPrice ? "text-green-700 dark:text-green-300" : "text-gray-900 dark:text-white")}>R$ {currentValue.toFixed(2)}</span>
                                      {isBestPrice && <Badge className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-[10px] px-1.5 py-0"><TrendingDown className="h-3 w-3 mr-0.5" />Melhor</Badge>}
                                    </div>
                                  )}
                                </td>
                                <td className="px-4 py-3 text-center">
                                  {!isEditing && <Button size="sm" variant="ghost" onClick={() => handleStartEdit(product.product_id, currentValue)} className="h-8 w-8 p-0 text-teal-600 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/30"><Edit2 className="h-4 w-4" /></Button>}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </ScrollArea>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400">
                    <div className="text-center"><Building2 className="h-12 w-12 mx-auto mb-3 opacity-50" /><p>Selecione um fornecedor</p></div>
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
                <div className="grid grid-cols-2 gap-4">
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
                  <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                    <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                      <Package className="h-4 w-4" />Selecione o fornecedor para cada produto
                    </h3>
                  </div>
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">Produto</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">Qtd</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">Fornecedor</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 dark:text-gray-300">Valor</th>
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
                            <td className="px-4 py-3">
                              <p className="font-medium text-sm text-gray-900 dark:text-white">{safeStr(product.product_name)}</p>
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-sm text-gray-600 dark:text-gray-300">{safeStr(product.quantidade)} {safeStr(product.unidade)}</span>
                            </td>
                            <td className="px-4 py-3">
                              <Select value={selectedSupplierId || ""} onValueChange={(value) => setProductSelections(prev => ({ ...prev, [product.product_id]: value }))}>
                                <SelectTrigger className="w-[200px] h-9 bg-white dark:bg-gray-800">
                                  <SelectValue placeholder="Selecione..." />
                                </SelectTrigger>
                                <SelectContent>
                                  {fornecedores.filter(f => getSupplierProductValue(f.id, product.product_id) > 0).map(f => {
                                    const value = getSupplierProductValue(f.id, product.product_id);
                                    const isBestOption = f.id === bestSupplierId;
                                    return (
                                      <SelectItem key={f.id} value={f.id}>
                                        <div className="flex items-center gap-2">
                                          <span>{safeStr(f.nome)}</span>
                                          <span className="text-gray-500">R$ {value.toFixed(2)}</span>
                                          {isBestOption && <Badge className="bg-green-100 text-green-700 text-[10px] px-1">Melhor</Badge>}
                                        </div>
                                      </SelectItem>
                                    );
                                  })}
                                </SelectContent>
                              </Select>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <span className={cn("font-semibold", isBest ? "text-green-600 dark:text-green-400" : "text-gray-900 dark:text-white")}>
                                R$ {selectedValue.toFixed(2)}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
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
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300">Pedido {index + 1}</Badge>
                              <span className="font-semibold text-gray-900 dark:text-white">{group.supplierName}</span>
                            </div>
                            <span className="font-bold text-green-600 dark:text-green-400">
                              R$ {group.products.reduce((sum: number, p: any) => sum + p.value, 0).toFixed(2)}
                            </span>
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {group.products.map((p: any) => safeStr(p.product_name)).join(", ")}
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}

                {/* Data de entrega e observações */}
                <div className="grid grid-cols-2 gap-4">
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
