import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { usePackagingQuotes } from "@/hooks/usePackagingQuotes";
import { 
  Package, Building2, DollarSign, CheckCircle2, Clock, 
  TrendingDown, Award, Loader2, Save, X, Trophy, Star, Edit2, Plus, Trash2, Settings
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { PackagingQuoteDisplay } from "@/types/packaging";
import type { PackagingItem } from "@/types/packaging";
import type { Supplier } from "@/hooks/useSuppliers";
import { PACKAGING_SALE_UNITS } from "@/types/packaging";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quote: PackagingQuoteDisplay | null;
  availablePackagingItems?: PackagingItem[];
  availableSuppliers?: Supplier[];
}

export function ManagePackagingQuoteDialog({ 
  open, 
  onOpenChange, 
  quote,
  availablePackagingItems = [],
  availableSuppliers = []
}: Props) {
  const { 
    updateSupplierItem, 
    getComparison, 
    updateQuoteStatus,
    addQuoteSupplier,
    removeQuoteSupplier,
    addQuoteItem,
    removeQuoteItem
  } = usePackagingQuotes();
  
  const [activeTab, setActiveTab] = useState("resumo");
  const [selectedSupplier, setSelectedSupplier] = useState<string>("");
  const [editingItem, setEditingItem] = useState<{ supplierId: string; packagingId: string } | null>(null);
  const [formData, setFormData] = useState({
    valorTotal: "", unidadeVenda: "kg", quantidadeVenda: "",
    quantidadeUnidadesEstimada: "", gramatura: "", dimensoes: "",
  });
  
  // Estados para adicionar itens/fornecedores
  const [selectedPackagingToAdd, setSelectedPackagingToAdd] = useState("");
  const [selectedSupplierToAdd, setSelectedSupplierToAdd] = useState("");
  
  const valorTotalInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingItem && open) {
      setTimeout(() => {
        valorTotalInputRef.current?.focus();
        valorTotalInputRef.current?.select();
      }, 100);
    }
  }, [editingItem, open]);

  useEffect(() => {
    if (open && quote && quote.fornecedores.length > 0 && !selectedSupplier) {
      setSelectedSupplier(quote.fornecedores[0].supplierId);
    }
    if (!open) {
      setSelectedSupplier("");
      setEditingItem(null);
      setSelectedPackagingToAdd("");
      setSelectedSupplierToAdd("");
    }
  }, [open, quote]);

  const comparison = useMemo(() => quote ? getComparison(quote) : [], [quote, getComparison]);

  // Embalagens e fornecedores não presentes na cotação
  const packagingNotInQuote = useMemo(() => {
    if (!quote) return availablePackagingItems;
    const idsInQuote = quote.itens.map(i => i.packagingId);
    return availablePackagingItems.filter(p => !idsInQuote.includes(p.id));
  }, [quote, availablePackagingItems]);

  const suppliersNotInQuote = useMemo(() => {
    if (!quote) return availableSuppliers;
    const idsInQuote = quote.fornecedores.map(f => f.supplierId);
    return availableSuppliers.filter(s => !idsInQuote.includes(s.id));
  }, [quote, availableSuppliers]);

  const bestPricesData = useMemo(() => {
    if (!quote) return [];
    return quote.itens.map(item => {
      let bestPrice = Infinity;
      let bestSupplierId: string | null = null;
      let bestSupplierName = "";
      const allPrices: { supplierId: string; supplierName: string; custoPorUnidade: number; valorTotal: number }[] = [];

      quote.fornecedores.forEach(fornecedor => {
        const supplierItem = fornecedor.itens.find(si => si.packagingId === item.packagingId);
        if (supplierItem?.custoPorUnidade && supplierItem.custoPorUnidade > 0) {
          allPrices.push({
            supplierId: fornecedor.supplierId, supplierName: fornecedor.supplierName,
            custoPorUnidade: supplierItem.custoPorUnidade, valorTotal: supplierItem.valorTotal || 0
          });
          if (supplierItem.custoPorUnidade < bestPrice) {
            bestPrice = supplierItem.custoPorUnidade;
            bestSupplierId = fornecedor.supplierId;
            bestSupplierName = fornecedor.supplierName;
          }
        }
      });

      allPrices.sort((a, b) => a.custoPorUnidade - b.custoPorUnidade);
      const worstPrice = allPrices.length > 0 ? allPrices[allPrices.length - 1].custoPorUnidade : 0;
      const savings = worstPrice > 0 && bestPrice < Infinity ? worstPrice - bestPrice : 0;

      return { packagingId: item.packagingId, packagingName: item.packagingName, bestPrice: bestPrice === Infinity ? 0 : bestPrice, bestSupplierId, bestSupplierName, allPrices, savings };
    });
  }, [quote]);

  const handleStatusChange = useCallback((status: string) => {
    if (quote && status !== quote.status) updateQuoteStatus.mutate({ quoteId: quote.id, status });
  }, [quote, updateQuoteStatus]);

  const custoPorUnidadePreview = useMemo(() => {
    const valor = parseFloat(formData.valorTotal) || 0;
    const unidades = parseInt(formData.quantidadeUnidadesEstimada) || 0;
    return valor > 0 && unidades > 0 ? (valor / unidades).toFixed(4) : null;
  }, [formData.valorTotal, formData.quantidadeUnidadesEstimada]);

  const handleEditItem = useCallback((supplierId: string, packagingId: string) => {
    if (!quote) return;
    const fornecedor = quote.fornecedores.find(f => f.supplierId === supplierId);
    const item = fornecedor?.itens.find(i => i.packagingId === packagingId);
    setFormData({
      valorTotal: item?.valorTotal?.toString() || "", unidadeVenda: item?.unidadeVenda || "kg",
      quantidadeVenda: item?.quantidadeVenda?.toString() || "", quantidadeUnidadesEstimada: item?.quantidadeUnidadesEstimada?.toString() || "",
      gramatura: item?.gramatura?.toString() || "", dimensoes: item?.dimensoes || "",
    });
    setEditingItem({ supplierId, packagingId });
    setSelectedSupplier(supplierId);
    setActiveTab("valores");
  }, [quote]);

  const handleSaveItem = useCallback(async () => {
    if (!editingItem || !quote) return;
    await updateSupplierItem.mutateAsync({
      quoteId: quote.id, supplierId: editingItem.supplierId, packagingId: editingItem.packagingId,
      valorTotal: parseFloat(formData.valorTotal) || 0, unidadeVenda: formData.unidadeVenda,
      quantidadeVenda: parseFloat(formData.quantidadeVenda) || 0, quantidadeUnidadesEstimada: parseInt(formData.quantidadeUnidadesEstimada) || 0,
      gramatura: formData.gramatura ? parseFloat(formData.gramatura) : undefined, dimensoes: formData.dimensoes || undefined,
    });
    setEditingItem(null);
  }, [editingItem, quote, formData, updateSupplierItem]);

  const handleAddPackaging = useCallback(() => {
    if (!quote || !selectedPackagingToAdd) return;
    const pkg = availablePackagingItems.find(p => p.id === selectedPackagingToAdd);
    if (!pkg) return;
    addQuoteItem.mutate({ quoteId: quote.id, packagingId: pkg.id, packagingName: pkg.name });
    setSelectedPackagingToAdd("");
  }, [quote, selectedPackagingToAdd, availablePackagingItems, addQuoteItem]);

  const handleRemovePackaging = useCallback((packagingId: string) => {
    if (!quote) return;
    removeQuoteItem.mutate({ quoteId: quote.id, packagingId });
  }, [quote, removeQuoteItem]);

  const handleAddSupplier = useCallback(() => {
    if (!quote || !selectedSupplierToAdd) return;
    const supplier = availableSuppliers.find(s => s.id === selectedSupplierToAdd);
    if (!supplier) return;
    addQuoteSupplier.mutate({ quoteId: quote.id, supplierId: supplier.id, supplierName: supplier.name });
    setSelectedSupplierToAdd("");
  }, [quote, selectedSupplierToAdd, availableSuppliers, addQuoteSupplier]);

  const handleRemoveSupplier = useCallback((supplierId: string) => {
    if (!quote) return;
    removeQuoteSupplier.mutate({ quoteId: quote.id, supplierId });
    if (selectedSupplier === supplierId) setSelectedSupplier("");
  }, [quote, selectedSupplier, removeQuoteSupplier]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey) && editingItem && formData.valorTotal) {
      e.preventDefault(); handleSaveItem();
    } else if (e.key === "Escape" && editingItem) {
      e.preventDefault(); setEditingItem(null);
    }
  }, [editingItem, formData.valorTotal, handleSaveItem]);

  if (!quote) return null;

  const stats = {
    totalEmbalagens: quote.itens.length,
    totalFornecedores: quote.fornecedores.length,
    fornecedoresRespondidos: quote.fornecedores.filter(f => f.status === "respondido").length,
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl w-[95vw] h-[90vh] max-h-[850px] p-0 overflow-hidden bg-white dark:bg-gray-900 flex flex-col">
        {/* Header */}
        <DialogHeader className="flex-shrink-0 px-5 py-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-purple-50 to-violet-50 dark:from-gray-800 dark:to-gray-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-purple-100 dark:bg-purple-900/30">
                <Package className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-gray-900 dark:text-white">Gerenciar Cotação de Embalagens</DialogTitle>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant={quote.status === "ativa" ? "default" : "secondary"} className="text-xs">{quote.status}</Badge>
                  <span className="text-xs text-gray-500">{quote.dataInicio} - {quote.dataFim}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Select value={quote.status} onValueChange={handleStatusChange}>
                <SelectTrigger className="w-32 h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ativa">Ativa</SelectItem>
                  <SelectItem value="concluida">Concluída</SelectItem>
                  <SelectItem value="cancelada">Cancelada</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)} className="h-8 w-8"><X className="h-4 w-4" /></Button>
            </div>
          </div>
        </DialogHeader>

        {/* Stats */}
        <div className="flex-shrink-0 px-5 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <div className="grid grid-cols-3 gap-4">
            <div className="flex items-center gap-2"><Package className="h-4 w-4 text-purple-500" /><span className="text-sm"><strong>{stats.totalEmbalagens}</strong> embalagens</span></div>
            <div className="flex items-center gap-2"><Building2 className="h-4 w-4 text-blue-500" /><span className="text-sm"><strong>{stats.totalFornecedores}</strong> fornecedores</span></div>
            <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500" /><span className="text-sm"><strong>{stats.fornecedoresRespondidos}</strong> responderam</span></div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="flex-shrink-0 w-full justify-start rounded-none border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-0 h-auto">
            <TabsTrigger value="resumo" className="rounded-none border-b-2 border-transparent data-[state=active]:border-purple-500 data-[state=active]:bg-transparent px-4 py-3 text-sm"><Trophy className="h-4 w-4 mr-2" />Resumo</TabsTrigger>
            <TabsTrigger value="editar" className="rounded-none border-b-2 border-transparent data-[state=active]:border-purple-500 data-[state=active]:bg-transparent px-4 py-3 text-sm"><Settings className="h-4 w-4 mr-2" />Editar Cotação</TabsTrigger>
            <TabsTrigger value="valores" className="rounded-none border-b-2 border-transparent data-[state=active]:border-purple-500 data-[state=active]:bg-transparent px-4 py-3 text-sm"><DollarSign className="h-4 w-4 mr-2" />Valores</TabsTrigger>
            <TabsTrigger value="comparativo" className="rounded-none border-b-2 border-transparent data-[state=active]:border-purple-500 data-[state=active]:bg-transparent px-4 py-3 text-sm"><TrendingDown className="h-4 w-4 mr-2" />Comparativo</TabsTrigger>
          </TabsList>

          {/* Tab Resumo */}
          <TabsContent value="resumo" className="flex-1 overflow-hidden m-0 p-0">
            <ScrollArea className="h-full">
              <div className="p-5 space-y-4">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2"><Star className="h-4 w-4 text-amber-500" />Melhor Preço por Embalagem</h3>
                <Card className="overflow-hidden border-gray-200 dark:border-gray-700">
                  <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    {bestPricesData.map((item) => (
                      <div key={item.packagingId} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 dark:text-white">{item.packagingName}</p>
                            {item.allPrices.length > 1 && (
                              <div className="mt-2 flex flex-wrap gap-1.5">
                                {item.allPrices.map((price, idx) => (
                                  <Badge key={price.supplierId} variant={idx === 0 ? "default" : "outline"}
                                    className={cn("text-[10px] cursor-pointer", idx === 0 ? "bg-green-600 hover:bg-green-700" : "text-gray-500 hover:bg-gray-100")}
                                    onClick={() => handleEditItem(price.supplierId, item.packagingId)}>
                                    {price.supplierName}: R$ {price.custoPorUnidade.toFixed(4)}/un
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="text-right flex-shrink-0">
                            {item.bestPrice > 0 ? (
                              <>
                                <div className="flex items-center gap-2 justify-end"><Award className="h-4 w-4 text-amber-500" /><span className="text-lg font-bold text-green-600 dark:text-green-400">R$ {item.bestPrice.toFixed(4)}/un</span></div>
                                <p className="text-xs text-gray-500 mt-0.5">{item.bestSupplierName}</p>
                                {item.savings > 0 && <Badge className="mt-1 bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300 text-[10px]"><TrendingDown className="h-2.5 w-2.5 mr-0.5" />Economia: R$ {item.savings.toFixed(4)}/un</Badge>}
                              </>
                            ) : <Badge variant="outline" className="text-gray-400">Sem preço</Badge>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Tab Editar Cotação */}
          <TabsContent value="editar" className="flex-1 overflow-hidden m-0 p-0">
            <ScrollArea className="h-full">
              <div className="p-5 space-y-6">
                {/* Seção Embalagens */}
                <Card className="border-gray-200 dark:border-gray-700">
                  <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                    <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2"><Package className="h-4 w-4 text-purple-600" />Embalagens da Cotação ({quote.itens.length})</h3>
                  </div>
                  {packagingNotInQuote.length > 0 && (
                    <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-purple-50/50 dark:bg-purple-900/10">
                      <div className="flex gap-3">
                        <Select value={selectedPackagingToAdd} onValueChange={setSelectedPackagingToAdd}>
                          <SelectTrigger className="flex-1 bg-white dark:bg-gray-800"><SelectValue placeholder="Selecione uma embalagem para adicionar..." /></SelectTrigger>
                          <SelectContent>{packagingNotInQuote.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                        </Select>
                        <Button onClick={handleAddPackaging} disabled={!selectedPackagingToAdd || addQuoteItem.isPending} className="bg-purple-600 hover:bg-purple-700">
                          {addQuoteItem.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}Adicionar
                        </Button>
                      </div>
                    </div>
                  )}
                  <div className="divide-y divide-gray-100 dark:divide-gray-700">
                    {quote.itens.length === 0 ? (
                      <div className="p-8 text-center text-gray-500"><Package className="h-12 w-12 mx-auto mb-3 opacity-30" /><p>Nenhuma embalagem na cotação</p></div>
                    ) : quote.itens.map((item, index) => (
                      <div key={item.packagingId} className="p-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-gray-400 w-6">{index + 1}.</span>
                          <Package className="h-4 w-4 text-purple-500" />
                          <span className="font-medium">{item.packagingName}</span>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => handleRemovePackaging(item.packagingId)} disabled={removeQuoteItem.isPending}
                          className="h-8 w-8 p-0 text-gray-400 hover:text-red-500 hover:bg-red-50"><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Seção Fornecedores */}
                <Card className="border-gray-200 dark:border-gray-700">
                  <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                    <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2"><Building2 className="h-4 w-4 text-blue-600" />Fornecedores da Cotação ({quote.fornecedores.length})</h3>
                  </div>
                  {suppliersNotInQuote.length > 0 && (
                    <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-blue-50/50 dark:bg-blue-900/10">
                      <div className="flex gap-3">
                        <Select value={selectedSupplierToAdd} onValueChange={setSelectedSupplierToAdd}>
                          <SelectTrigger className="flex-1 bg-white dark:bg-gray-800"><SelectValue placeholder="Selecione um fornecedor para adicionar..." /></SelectTrigger>
                          <SelectContent>{suppliersNotInQuote.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                        </Select>
                        <Button onClick={handleAddSupplier} disabled={!selectedSupplierToAdd || addQuoteSupplier.isPending} className="bg-blue-600 hover:bg-blue-700">
                          {addQuoteSupplier.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}Adicionar
                        </Button>
                      </div>
                    </div>
                  )}
                  <div className="divide-y divide-gray-100 dark:divide-gray-700">
                    {quote.fornecedores.length === 0 ? (
                      <div className="p-8 text-center text-gray-500"><Building2 className="h-12 w-12 mx-auto mb-3 opacity-30" /><p>Nenhum fornecedor na cotação</p></div>
                    ) : quote.fornecedores.map((fornecedor, index) => (
                      <div key={fornecedor.supplierId} className="p-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-gray-400 w-6">{index + 1}.</span>
                          <Building2 className="h-4 w-4 text-blue-500" />
                          <span className="font-medium">{fornecedor.supplierName}</span>
                          {fornecedor.status === "respondido" ? (
                            <Badge className="text-[10px] bg-green-100 text-green-700"><CheckCircle2 className="h-3 w-3 mr-0.5" />Respondido</Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px]"><Clock className="h-3 w-3 mr-0.5" />Pendente</Badge>
                          )}
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => handleRemoveSupplier(fornecedor.supplierId)} disabled={removeQuoteSupplier.isPending}
                          className="h-8 w-8 p-0 text-gray-400 hover:text-red-500 hover:bg-red-50"><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Tab Valores */}
          <TabsContent value="valores" className="flex-1 overflow-hidden m-0 p-0">
            <div className="h-full flex">
              <div className="w-48 flex-shrink-0 border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                <div className="p-3 border-b border-gray-200 dark:border-gray-700"><h4 className="text-xs font-semibold text-gray-500 uppercase">Fornecedores</h4></div>
                <ScrollArea className="h-[calc(100%-44px)]">
                  <div className="p-2 space-y-1">
                    {quote.fornecedores.map((fornecedor) => (
                      <button key={fornecedor.supplierId} onClick={() => setSelectedSupplier(fornecedor.supplierId)}
                        className={cn("w-full p-2.5 rounded-lg text-left transition-all text-sm",
                          selectedSupplier === fornecedor.supplierId ? "bg-purple-100 dark:bg-purple-900/30 border border-purple-400 text-purple-900 dark:text-purple-100" : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-purple-200")}>
                        <div className="flex items-center gap-2"><Building2 className="h-3.5 w-3.5 flex-shrink-0" /><span className="truncate font-medium">{fornecedor.supplierName}</span></div>
                        <div className="flex items-center gap-1 mt-1">
                          {fornecedor.status === "respondido" ? <Badge className="text-[9px] bg-green-100 text-green-700 px-1.5 py-0"><CheckCircle2 className="h-2.5 w-2.5 mr-0.5" />Respondido</Badge> : <Badge variant="outline" className="text-[9px] px-1.5 py-0"><Clock className="h-2.5 w-2.5 mr-0.5" />Pendente</Badge>}
                        </div>
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              </div>
              <div className="flex-1 overflow-hidden">
                <ScrollArea className="h-full">
                  <div className="p-4 space-y-3" onKeyDown={handleKeyDown}>
                    {selectedSupplier && quote.itens.map((item) => {
                      const fornecedor = quote.fornecedores.find(f => f.supplierId === selectedSupplier);
                      const supplierItem = fornecedor?.itens.find(si => si.packagingId === item.packagingId);
                      const isEditing = editingItem?.supplierId === selectedSupplier && editingItem?.packagingId === item.packagingId;
                      const bestData = bestPricesData.find(b => b.packagingId === item.packagingId);
                      const isBestPrice = bestData?.bestSupplierId === selectedSupplier;

                      return (
                        <Card key={item.packagingId} className={cn("p-4 transition-all", isBestPrice && "ring-2 ring-green-500 bg-green-50/50 dark:bg-green-900/10", isEditing && "ring-2 ring-purple-500")}>
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <Package className="h-4 w-4 text-purple-600" /><span className="font-semibold">{item.packagingName}</span>
                              {isBestPrice && <Badge className="bg-green-600 text-[10px]"><Award className="h-3 w-3 mr-0.5" />Melhor</Badge>}
                            </div>
                            {!isEditing && <Button size="sm" variant="outline" onClick={() => handleEditItem(selectedSupplier, item.packagingId)} className="h-7 text-xs"><Edit2 className="h-3 w-3 mr-1" />Editar</Button>}
                          </div>
                          {isEditing ? (
                            <div className="space-y-3">
                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                <div><Label className="text-xs">Valor Total (R$) *</Label><Input ref={valorTotalInputRef} type="number" step="0.01" value={formData.valorTotal} onChange={(e) => setFormData(prev => ({ ...prev, valorTotal: e.target.value }))} placeholder="0,00" className="h-9" /></div>
                                <div><Label className="text-xs">Unidade de Venda *</Label><Select value={formData.unidadeVenda} onValueChange={(v) => setFormData(prev => ({ ...prev, unidadeVenda: v }))}><SelectTrigger className="h-9"><SelectValue /></SelectTrigger><SelectContent>{PACKAGING_SALE_UNITS.map(u => <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>)}</SelectContent></Select></div>
                                <div><Label className="text-xs">Qtd. na Unidade *</Label><Input type="number" step="0.01" value={formData.quantidadeVenda} onChange={(e) => setFormData(prev => ({ ...prev, quantidadeVenda: e.target.value }))} placeholder="Ex: 5" className="h-9" /></div>
                                <div><Label className="text-xs">Qtd. Unidades Estimada *</Label><Input type="number" value={formData.quantidadeUnidadesEstimada} onChange={(e) => setFormData(prev => ({ ...prev, quantidadeUnidadesEstimada: e.target.value }))} placeholder="Ex: 500" className="h-9" /></div>
                                <div><Label className="text-xs">Gramatura</Label><Input type="number" step="0.01" value={formData.gramatura} onChange={(e) => setFormData(prev => ({ ...prev, gramatura: e.target.value }))} placeholder="Ex: 0.08" className="h-9" /></div>
                                <div><Label className="text-xs">Dimensões</Label><Input value={formData.dimensoes} onChange={(e) => setFormData(prev => ({ ...prev, dimensoes: e.target.value }))} placeholder="Ex: 30x40cm" className="h-9" /></div>
                              </div>
                              {custoPorUnidadePreview && <div className="bg-purple-50 dark:bg-purple-900/20 p-2 rounded-lg"><p className="text-sm text-purple-700 dark:text-purple-300"><strong>Custo por unidade:</strong> R$ {custoPorUnidadePreview}</p></div>}
                              <div className="flex items-center justify-between pt-2 border-t">
                                <p className="text-xs text-muted-foreground"><kbd className="px-1.5 py-0.5 rounded bg-muted font-mono text-[10px]">Ctrl+Enter</kbd> salvar • <kbd className="px-1.5 py-0.5 rounded bg-muted font-mono text-[10px]">Esc</kbd> cancelar</p>
                                <div className="flex gap-2">
                                  <Button size="sm" variant="outline" onClick={() => setEditingItem(null)} className="h-8">Cancelar</Button>
                                  <Button size="sm" onClick={handleSaveItem} disabled={updateSupplierItem.isPending || !formData.valorTotal} className="h-8 bg-purple-600 hover:bg-purple-700">{updateSupplierItem.isPending ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Save className="h-3 w-3 mr-1" />}Salvar</Button>
                                </div>
                              </div>
                            </div>
                          ) : supplierItem?.valorTotal ? (
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                              <div><span className="text-xs text-muted-foreground block">Valor</span><p className="font-semibold">R$ {supplierItem.valorTotal.toFixed(2)}</p></div>
                              <div><span className="text-xs text-muted-foreground block">Venda</span><p className="font-medium">{supplierItem.quantidadeVenda} {supplierItem.unidadeVenda}</p></div>
                              <div><span className="text-xs text-muted-foreground block">Unidades</span><p className="font-medium">{supplierItem.quantidadeUnidadesEstimada}</p></div>
                              <div><span className="text-xs text-muted-foreground block">Custo/un</span><p className={cn("font-bold", isBestPrice ? "text-green-600" : "text-purple-600")}>R$ {supplierItem.custoPorUnidade?.toFixed(4) || '-'}</p></div>
                            </div>
                          ) : <p className="text-sm text-muted-foreground italic">Clique em "Editar" para adicionar valores</p>}
                        </Card>
                      );
                    })}
                  </div>
                </ScrollArea>
              </div>
            </div>
          </TabsContent>

          {/* Tab Comparativo */}
          <TabsContent value="comparativo" className="flex-1 overflow-hidden m-0 p-0">
            <ScrollArea className="h-full">
              <div className="p-5 space-y-4">
                {comparison.length === 0 || comparison.every(c => c.fornecedores.length === 0) ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <TrendingDown className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p className="font-medium">Nenhum fornecedor respondeu ainda</p>
                    <p className="text-sm">Adicione os valores na aba "Valores"</p>
                  </div>
                ) : comparison.map((comp) => (
                  <Card key={comp.packagingId} className="overflow-hidden border-gray-200 dark:border-gray-700">
                    <div className="bg-purple-50 dark:bg-purple-900/20 p-3 border-b border-gray-200 dark:border-gray-700">
                      <h4 className="font-semibold flex items-center gap-2"><Package className="h-4 w-4 text-purple-600" />{comp.packagingName}</h4>
                    </div>
                    {comp.fornecedores.length === 0 ? (
                      <div className="p-4 text-center text-muted-foreground text-sm">Nenhum fornecedor respondeu ainda</div>
                    ) : (
                      <div className="divide-y divide-gray-100 dark:divide-gray-700">
                        {comp.fornecedores.map((f, index) => (
                          <div key={f.supplierId} className={cn("p-3 flex items-center gap-4 transition-colors cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50", f.isMelhorPreco && "bg-green-50 dark:bg-green-900/20")} onClick={() => handleEditItem(f.supplierId, comp.packagingId)}>
                            <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-100 dark:bg-gray-800 font-bold text-sm flex-shrink-0">{f.isMelhorPreco ? <Award className="h-5 w-5 text-amber-500" /> : index + 1}</div>
                            <div className="flex-1 min-w-0"><p className="font-medium">{f.supplierName}</p><p className="text-xs text-muted-foreground">R$ {f.valorTotal.toFixed(2)} por {f.quantidadeVenda} {f.unidadeVenda} ({f.quantidadeUnidades} un)</p></div>
                            <div className="text-right flex-shrink-0">
                              <p className={cn("font-bold text-lg", f.isMelhorPreco ? "text-green-600" : "text-gray-700 dark:text-gray-300")}>R$ {f.custoPorUnidade.toFixed(4)}/un</p>
                              {!f.isMelhorPreco && <p className="text-xs text-red-500">+{f.diferencaPercentual.toFixed(1)}% mais caro</p>}
                              {f.isMelhorPreco && <Badge className="bg-green-600 text-xs">Melhor preço</Badge>}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
