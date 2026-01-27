import { useState, useEffect, useMemo, useRef } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Package, Calendar, DollarSign, Building2, FileText, X, Loader2, ClipboardList, Users, TrendingDown, Edit2, Check, ShoppingCart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { Quote } from "@/hooks/useCotacoes";
import ConvertToOrderDialog from "./ConvertToOrderDialog";
import ConvertToMultipleOrdersDialog, { SupplierOrder } from "./ConvertToMultipleOrdersDialog";
import { SelectSupplierPerProductDialog } from "./SelectSupplierPerProductDialog";

interface CotacaoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cotacao: Quote | null;
  onUpdateSupplierProductValue?: (quoteId: string, supplierId: string, productId: string, newValue: number) => void;
  onConvertToOrder?: (quoteId: string, orders: Array<{ supplierId: string; productIds: string[]; deliveryDate: string; observations?: string; }>) => void;
  onEdit?: () => void;
  isUpdating?: boolean;
}

// Safe string converter
const safeStr = (val: unknown): string => {
  if (val === null || val === undefined) return '';
  if (typeof val === 'string') return val;
  if (typeof val === 'number' || typeof val === 'boolean') return String(val);
  if (typeof val === 'object') {
    try { return JSON.stringify(val); } catch { return ''; }
  }
  return '';
};

export default function CotacaoDialog({ open, onOpenChange, cotacao, onUpdateSupplierProductValue, onConvertToOrder, onEdit, isUpdating = false }: CotacaoDialogProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("detalhes");
  const [selectedSupplier, setSelectedSupplier] = useState<string>("");
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editedValues, setEditedValues] = useState<Record<string, number>>({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const editInputRef = useRef<HTMLInputElement>(null);
  const [convertDialogOpen, setConvertDialogOpen] = useState(false);
  const [selectedSupplierForConversion, setSelectedSupplierForConversion] = useState<{ id: string; name: string } | null>(null);
  const [showSelectSupplierDialog, setShowSelectSupplierDialog] = useState(false);
  const [selectedSuppliers, setSelectedSuppliers] = useState<Map<string, { supplierId: string; supplierName: string }>>(new Map());
  const [showMultipleOrdersDialog, setShowMultipleOrdersDialog] = useState(false);
  const [supplierOrdersForConversion, setSupplierOrdersForConversion] = useState<SupplierOrder[]>([]);

  const statusOptions = [
    { value: "ativa", label: "Ativa", color: "bg-teal-100 text-teal-700 border-teal-200" },
    { value: "pendente", label: "Pendente", color: "bg-amber-100 text-amber-700 border-amber-200" },
    { value: "planejada", label: "Planejada", color: "bg-blue-100 text-blue-700 border-blue-200" },
    { value: "concluida", label: "Concluída", color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
    { value: "finalizada", label: "Finalizada", color: "bg-green-100 text-green-700 border-green-200" },
    { value: "expirada", label: "Expirada", color: "bg-red-100 text-red-700 border-red-200" }
  ];

  const products = useMemo(() => {
    if (!cotacao) return [];
    const raw = cotacao as unknown as Record<string, unknown>;
    const rawData = raw?._raw as Record<string, unknown> | undefined;
    return (rawData?.quote_items as unknown[]) || [];
  }, [cotacao]);

  const fornecedores = useMemo(() => {
    if (!cotacao) return [];
    return cotacao.fornecedoresParticipantes || [];
  }, [cotacao]);

  useEffect(() => {
    if (open && cotacao) {
      setActiveTab("detalhes");
      setSelectedSupplier("");
      setEditingProductId(null);
      setEditedValues({});
      setHasUnsavedChanges(false);
    }
  }, [open, cotacao]);

  useEffect(() => {
    if (editingProductId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingProductId]);

  const getSupplierProductValue = (supplierId: string, productId: string): number => {
    if (!cotacao) return 0;
    const raw = cotacao as unknown as Record<string, unknown>;
    const rawData = raw._raw as Record<string, unknown> | undefined;
    const supplierItems = (raw._supplierItems || rawData?.quote_supplier_items || []) as Array<Record<string, unknown>>;
    const item = supplierItems.find((i) => i?.supplier_id === supplierId && i?.product_id === productId);
    return (item?.valor_oferecido as number) || 0;
  };

  const getCurrentProductValue = (supplierId: string, productId: string): number => {
    if (selectedSupplier === supplierId && editedValues[productId] !== undefined) {
      return editedValues[productId];
    }
    return getSupplierProductValue(supplierId, productId);
  };

  const getBestPriceInfoForProduct = (productId: string): { bestPrice: number; bestSupplierId: string | null } => {
    if (!cotacao) return { bestPrice: 0, bestSupplierId: null };
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
    setHasUnsavedChanges(true);
  };

  const handleSaveEdit = async (productId: string) => {
    if (selectedSupplier && onUpdateSupplierProductValue && editedValues[productId] !== undefined && cotacao) {
      await onUpdateSupplierProductValue(cotacao.id, selectedSupplier, productId, editedValues[productId]);
      setEditingProductId(null);
      setHasUnsavedChanges(false);
      toast({ title: "Valor atualizado!" });
    }
  };

  const handleCancelEdit = () => { setEditingProductId(null); setEditedValues({}); setHasUnsavedChanges(false); };

  const getStatusBadge = (statusValue: string) => {
    const config = statusOptions.find(s => s.value === statusValue) || statusOptions[0];
    return <Badge variant="outline" className={cn("font-medium text-xs", config.color)}>{config.label}</Badge>;
  };

  const stats = useMemo(() => {
    if (!cotacao) return { totalFornecedores: 0, fornecedoresRespondidos: 0, melhorValor: 0, economia: "0%" };
    const totalFornecedores = fornecedores.length;
    const fornecedoresRespondidos = fornecedores.filter(f => f.status === "respondido").length;
    const valores = fornecedores.filter(f => f.valorOferecido > 0).map(f => f.valorOferecido);
    const melhorValor = valores.length > 0 ? Math.min(...valores) : 0;
    const economiaStr = typeof cotacao.economia === 'string' ? cotacao.economia : "0%";
    return { totalFornecedores, fornecedoresRespondidos, melhorValor, economia: economiaStr };
  }, [cotacao, fornecedores]);

  const getBestSupplier = () => {
    if (!cotacao || fornecedores.length === 0) return null;
    let bestSupplier: (typeof fornecedores)[0] | null = null;
    let lowestTotal = Infinity;
    fornecedores.forEach(fornecedor => {
      let total = 0;
      products.forEach((product) => {
        const p = product as Record<string, unknown>;
        const value = getSupplierProductValue(fornecedor.id, safeStr(p.product_id));
        if (value > 0) total += value;
      });
      if (total > 0 && total < lowestTotal) { lowestTotal = total; bestSupplier = fornecedor; }
    });
    return bestSupplier ? { ...bestSupplier, totalValue: lowestTotal } : null;
  };

  const bestSupplier = getBestSupplier();

  const buildProductSelections = () => {
    if (!products || products.length === 0 || !cotacao) return [];
    const raw = cotacao as unknown as Record<string, unknown>;
    const rawData = raw._raw as Record<string, unknown> | undefined;
    return products.map((item) => {
      const p = item as Record<string, unknown>;
      const supplierOptions = fornecedores.map(fornecedor => {
        const supplierItems = (raw._supplierItems || rawData?.quote_supplier_items || []) as Array<Record<string, unknown>>;
        const supplierItem = supplierItems.find((si) => si?.supplier_id === fornecedor.id && si?.product_id === p.product_id);
        return { supplierId: fornecedor.id, supplierName: safeStr(fornecedor.nome), price: (supplierItem?.valor_oferecido as number) || 0, isBest: false };
      }).filter(s => s.price > 0);
      if (supplierOptions.length > 0) {
        const minPrice = Math.min(...supplierOptions.map(s => s.price));
        supplierOptions.forEach(option => { if (option.price === minPrice) option.isBest = true; });
      }
      const bestSupplierOption = supplierOptions.find(option => option.isBest);
      return { productId: safeStr(p.product_id), productName: safeStr(p.product_name), quantity: safeStr(p.quantidade), unit: safeStr(p.unidade), selectedSupplierId: bestSupplierOption?.supplierId || "", selectedSupplierName: bestSupplierOption?.supplierName || "", supplierOptions };
    });
  };

  const handleConvertToOrder = () => {
    const productSelections = buildProductSelections();
    if (productSelections.length === 0) return;
    const hasMultipleProducts = productSelections.length > 1;
    const hasTiedBestPrices = productSelections.some(selection => selection.supplierOptions.filter(option => option.isBest).length > 1);
    if (hasMultipleProducts || hasTiedBestPrices) {
      const initialSelections = new Map<string, { supplierId: string; supplierName: string }>();
      productSelections.forEach(selection => {
        if (selection.selectedSupplierId) { initialSelections.set(selection.productId, { supplierId: selection.selectedSupplierId, supplierName: selection.selectedSupplierName }); }
        else if (selection.supplierOptions.length > 0) { const fallback = selection.supplierOptions[0]; initialSelections.set(selection.productId, { supplierId: fallback.supplierId, supplierName: fallback.supplierName }); }
      });
      setSelectedSuppliers(initialSelections);
      setShowSelectSupplierDialog(true);
      return;
    }
    if (bestSupplier) { setSelectedSupplierForConversion({ id: bestSupplier.id, name: safeStr(bestSupplier.nome) }); setConvertDialogOpen(true); }
  };

  const handleSupplierSelectionConfirm = (selections: Map<string, { supplierId: string; supplierName: string }>) => {
    setSelectedSuppliers(selections);
    setShowSelectSupplierDialog(false);
    const supplierGroups = new Map<string, string[]>();
    selections.forEach((selection, productId) => { if (!supplierGroups.has(selection.supplierId)) { supplierGroups.set(selection.supplierId, []); } supplierGroups.get(selection.supplierId)!.push(productId); });
    if (supplierGroups.size === 1) {
      const [, productIds] = Array.from(supplierGroups.entries())[0];
      const selection = selections.get(productIds[0]);
      if (selection) { setSelectedSupplierForConversion({ id: selection.supplierId, name: selection.supplierName }); setConvertDialogOpen(true); }
    } else {
      if (!cotacao) return;
      const raw = cotacao as unknown as Record<string, unknown>;
      const rawData = raw._raw as Record<string, unknown> | undefined;
      const quoteItems = (rawData?.quote_items || []) as Array<Record<string, unknown>>;
      const supplierOrders: SupplierOrder[] = Array.from(supplierGroups.entries()).map(([supplierId, productIds]) => {
        const selection = selections.get(productIds[0]);
        if (!selection) return null;
        const productsData = productIds.map(productId => {
          const product = quoteItems.find((i) => i.product_id === productId);
          if (!product) return null;
          const value = getSupplierProductValue(supplierId, productId);
          return { productId, productName: safeStr(product.product_name), quantity: safeStr(product.quantidade), value };
        }).filter(Boolean) as Array<{ productId: string; productName: string; quantity: string; value: number }>;
        if (productsData.length === 0) return null;
        const totalValue = productsData.reduce((sum, p) => sum + p.value, 0);
        return { supplierId, supplierName: selection.supplierName, products: productsData, totalValue, deliveryDate: '', observations: '' };
      }).filter(Boolean) as SupplierOrder[];
      setSupplierOrdersForConversion(supplierOrders);
      setShowMultipleOrdersDialog(true);
    }
  };

  const handleConfirmConversion = (deliveryDate: string, observations?: string) => {
    if (selectedSupplierForConversion && onConvertToOrder && cotacao) {
      const allProductIds = products.map((p) => safeStr((p as Record<string, unknown>).product_id));
      onConvertToOrder(cotacao.id, [{ supplierId: selectedSupplierForConversion.id, productIds: allProductIds, deliveryDate, observations }]);
      setConvertDialogOpen(false);
      onOpenChange(false);
      if (onEdit) onEdit();
    }
  };

  const handleConfirmMultipleOrders = (supplierOrders: SupplierOrder[]) => {
    if (onConvertToOrder && cotacao) {
      const orders = supplierOrders.map(order => ({ supplierId: order.supplierId, productIds: order.products.map(p => p.productId), deliveryDate: order.deliveryDate, observations: order.observations }));
      onConvertToOrder(cotacao.id, orders);
      setShowMultipleOrdersDialog(false);
      onOpenChange(false);
      if (onEdit) onEdit();
    }
  };

  const getConversionProducts = () => {
    if (!bestSupplier) return [];
    return products.map((product) => {
      const p = product as Record<string, unknown>;
      const value = getSupplierProductValue(bestSupplier.id, safeStr(p.product_id));
      return { id: safeStr(p.product_id), name: safeStr(p.product_name), quantity: safeStr(p.quantidade), value };
    });
  };

  if (!cotacao) return null;

  const cotacaoId = safeStr(cotacao.id).substring(0, 8);
  const cotacaoStatus = safeStr(cotacao.statusReal || cotacao.status);
  const cotacaoDataInicio = safeStr(cotacao.dataInicio);
  const cotacaoDataFim = safeStr(cotacao.dataFim);
  const cotacaoMelhorFornecedor = safeStr(cotacao.melhorFornecedor) || '-';
  const cotacaoQuantidade = safeStr(cotacao.quantidade);
  const cotacaoProduto = safeStr(cotacao.produto);


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent hideClose className="max-w-4xl max-h-[90vh] p-0 overflow-hidden [&>button]:hidden">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b bg-background">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-teal-500/10"><ClipboardList className="h-5 w-5 text-teal-600 dark:text-teal-400" /></div>
              <div>
                <DialogTitle className="text-lg font-bold">Cotação #{cotacaoId}</DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground">{cotacaoProduto}</DialogDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {getStatusBadge(cotacaoStatus)}
              <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => onOpenChange(false)} 
              className="h-6 w-6 text-muted-foreground hover:text-foreground !bg-transparent p-0 border-0 shadow-none ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Fechar</span>
            </Button>
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0">
              <TabsTrigger value="detalhes" className="rounded-none border-b-2 border-transparent data-[state=active]:border-teal-500 data-[state=active]:bg-transparent"><FileText className="h-4 w-4 mr-2" />Detalhes</TabsTrigger>
              <TabsTrigger value="valores" className="rounded-none border-b-2 border-transparent data-[state=active]:border-teal-500 data-[state=active]:bg-transparent"><DollarSign className="h-4 w-4 mr-2" />Valores</TabsTrigger>
              <TabsTrigger value="converter" className="rounded-none border-b-2 border-transparent data-[state=active]:border-teal-500 data-[state=active]:bg-transparent"><ShoppingCart className="h-4 w-4 mr-2" />Converter</TabsTrigger>
            </TabsList>

            <ScrollArea className="flex-1">
              {/* Tab Detalhes */}
              <TabsContent value="detalhes" className="p-4 m-0 space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-3 rounded-xl bg-teal-500/10 border border-teal-200/50">
                    <div className="flex items-center gap-2 mb-1"><Users className="h-4 w-4 text-teal-600 dark:text-teal-400" /><span className="text-xs text-teal-700 dark:text-teal-300">Fornecedores</span></div>
                    <p className="text-xl font-bold text-teal-800 dark:text-teal-200">{stats.totalFornecedores}</p>
                    <p className="text-xs text-teal-600 dark:text-teal-400">{stats.fornecedoresRespondidos} responderam</p>
                  </div>
                  <div className="p-3 rounded-xl bg-green-500/10 border border-green-200/50">
                    <div className="flex items-center gap-2 mb-1"><DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" /><span className="text-xs text-green-700 dark:text-green-300">Melhor Valor</span></div>
                    <p className="text-xl font-bold text-green-800 dark:text-green-200">R$ {stats.melhorValor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    <p className="text-xs text-green-600 dark:text-green-400">{cotacaoMelhorFornecedor}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-200/50">
                    <div className="flex items-center gap-2 mb-1"><TrendingDown className="h-4 w-4 text-blue-600 dark:text-blue-400" /><span className="text-xs text-blue-700 dark:text-blue-300">Economia</span></div>
                    <p className="text-xl font-bold text-blue-800 dark:text-blue-200">{stats.economia}</p>
                    <p className="text-xs text-blue-600 dark:text-blue-400">vs maior preço</p>
                  </div>
                  <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-200/50">
                    <div className="flex items-center gap-2 mb-1"><Package className="h-4 w-4 text-purple-600 dark:text-purple-400" /><span className="text-xs text-purple-700 dark:text-purple-300">Quantidade</span></div>
                    <p className="text-xl font-bold text-purple-800 dark:text-purple-200">{cotacaoQuantidade}</p>
                    <p className="text-xs text-purple-600 dark:text-purple-400">itens</p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-muted/30 border">
                  <h4 className="font-semibold mb-3 flex items-center gap-2"><Calendar className="h-4 w-4 text-muted-foreground" />Período da Cotação</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div><p className="text-xs text-muted-foreground">Data Início</p><p className="font-medium">{cotacaoDataInicio}</p></div>
                    <div><p className="text-xs text-muted-foreground">Data Fim</p><p className="font-medium">{cotacaoDataFim}</p></div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-muted/30 border">
                  <h4 className="font-semibold mb-3 flex items-center gap-2"><Building2 className="h-4 w-4 text-muted-foreground" />Fornecedores Participantes</h4>
                  <div className="space-y-2">
                    {fornecedores.map(f => (
                      <div key={f.id} className="flex items-center justify-between p-2 rounded-lg bg-card border">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-teal-500/10 flex items-center justify-center text-teal-700 dark:text-teal-300 font-semibold text-sm">{safeStr(f.nome).charAt(0)}</div>
                          <span className="font-medium">{safeStr(f.nome)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {f.valorOferecido > 0 && <span className="text-sm font-semibold text-green-600 dark:text-green-400">R$ {f.valorOferecido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>}
                          <Badge variant="outline" className={cn("text-xs", f.status === "respondido" ? "bg-green-500/10 text-green-700 dark:text-green-300 border-green-200/50" : "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-200/50")}>{f.status === "respondido" ? "Respondido" : "Pendente"}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>

              {/* Tab Valores */}
              <TabsContent value="valores" className="p-4 m-0 space-y-4">
                <div className="flex items-center gap-4 mb-4">
                  <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
                    <SelectTrigger className="w-[250px]"><SelectValue placeholder="Selecione um fornecedor" /></SelectTrigger>
                    <SelectContent>
                      {fornecedores.map(f => <SelectItem key={f.id} value={f.id}>{safeStr(f.nome)}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  {isUpdating && <Loader2 className="h-4 w-4 animate-spin text-teal-600" />}
                </div>

                {selectedSupplier ? (
                  <div className="space-y-2">
                    {products.map((product) => {
                      const p = product as Record<string, unknown>;
                      const productId = safeStr(p.product_id);
                      const productName = safeStr(p.product_name);
                      const quantidade = safeStr(p.quantidade);
                      const currentValue = getCurrentProductValue(selectedSupplier, productId);
                      const { bestPrice, bestSupplierId } = getBestPriceInfoForProduct(productId);
                      const isBest = bestSupplierId === selectedSupplier && currentValue > 0;
                      return (
                        <div key={productId} className={cn("flex items-center justify-between p-3 rounded-lg border", isBest ? "bg-green-500/10 border-green-200/50" : "bg-card")}>
                          <div className="flex-1">
                            <p className="font-medium">{productName}</p>
                            <p className="text-xs text-muted-foreground">Qtd: {quantidade}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            {editingProductId === productId ? (
                              <>
                                <Input ref={editInputRef} type="number" step="0.01" value={editedValues[productId] || 0} onChange={(e) => setEditedValues(prev => ({ ...prev, [productId]: parseFloat(e.target.value) || 0 }))} className="w-32 h-8" />
                                <TooltipProvider><Tooltip><TooltipTrigger asChild><Button size="icon" variant="ghost" className="h-8 w-8 text-green-600" onClick={() => handleSaveEdit(productId)}><Check className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent>Salvar</TooltipContent></Tooltip></TooltipProvider>
                                <TooltipProvider><Tooltip><TooltipTrigger asChild><Button size="icon" variant="ghost" className="h-8 w-8 text-red-600" onClick={handleCancelEdit}><X className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent>Cancelar</TooltipContent></Tooltip></TooltipProvider>
                              </>
                            ) : (
                              <>
                                <span className={cn("font-semibold", isBest ? "text-green-600 dark:text-green-400" : "text-foreground")}>R$ {currentValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                {isBest && <Badge className="bg-green-500/10 text-green-700 dark:text-green-300 border-green-200/50">Melhor</Badge>}
                                <TooltipProvider><Tooltip><TooltipTrigger asChild><Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleStartEdit(productId, currentValue)}><Edit2 className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent>Editar valor</TooltipContent></Tooltip></TooltipProvider>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground"><Building2 className="h-12 w-12 mx-auto mb-2 opacity-50" /><p>Selecione um fornecedor para ver/editar valores</p></div>
                )}
              </TabsContent>

              {/* Tab Converter */}
              <TabsContent value="converter" className="p-4 m-0 space-y-4">
                {bestSupplier ? (
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-green-500/10 border border-green-200/50">
                      <h4 className="font-semibold text-green-800 dark:text-green-200 mb-2 flex items-center gap-2"><Building2 className="h-4 w-4" />Melhor Fornecedor</h4>
                      <p className="text-2xl font-bold text-green-700 dark:text-green-300">{safeStr(bestSupplier.nome)}</p>
                      <p className="text-sm text-green-600 dark:text-green-400">Total: R$ {bestSupplier.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-muted/30 border">
                      <h4 className="font-semibold mb-3">Produtos incluídos</h4>
                      <div className="space-y-2">
                        {getConversionProducts().map(p => (
                          <div key={p.id} className="flex justify-between items-center p-2 bg-card rounded border">
                            <span>{p.name} (x{p.quantity})</span>
                            <span className="font-semibold text-green-600 dark:text-green-400">R$ {p.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <Button onClick={handleConvertToOrder} className="w-full bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700"><ShoppingCart className="h-4 w-4 mr-2" />Converter em Pedido</Button>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground"><ShoppingCart className="h-12 w-12 mx-auto mb-2 opacity-50" /><p>Nenhum fornecedor com valores para converter</p></div>
                )}
              </TabsContent>
            </ScrollArea>
          </Tabs>
        </div>

        {/* Dialogs */}
        {convertDialogOpen && selectedSupplierForConversion && (
          <ConvertToOrderDialog 
            open={convertDialogOpen} 
            onOpenChange={setConvertDialogOpen} 
            quote={{ id: cotacao.id, produto: cotacaoProduto, quantidade: cotacaoQuantidade }}
            supplier={{ id: selectedSupplierForConversion.id, name: selectedSupplierForConversion.name }}
            products={getConversionProducts()} 
            totalValue={getConversionProducts().reduce((sum, p) => sum + p.value, 0)}
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
          <ConvertToMultipleOrdersDialog open={showMultipleOrdersDialog} onOpenChange={setShowMultipleOrdersDialog} supplierOrders={supplierOrdersForConversion} onConfirm={handleConfirmMultipleOrders} />
        )}
      </DialogContent>
    </Dialog>
  );
}
