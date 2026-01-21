import { useState, useMemo, useEffect, useCallback } from "react";
import { ResponsiveDialog, ResponsiveDialogContent, ResponsiveDialogHeader, ResponsiveDialogTitle } from "@/components/ui/responsive-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Download, Share2, MapPin, Loader2, Plus, Package, CheckCircle2, FileText, Edit2, Trash2, ClipboardList, Search, WifiOff, RefreshCw } from "lucide-react";
import jsPDF from "jspdf";
import { useStockCounts } from "@/hooks/useStockCounts";
import { useStockCountItems } from "@/hooks/useStockCountItems";
import { useStockSectors } from "@/hooks/useStockSectors";
import { useOfflineQueue } from "@/hooks/useOfflineQueue";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useDebounce } from "@/hooks/useDebounce";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stockCountId: string | null;
}

interface OrderProduct {
  id: string;
  product_id: string | null;
  product_name: string;
  quantity: number;
  unit: string;
}

export function ViewStockCountDialog({ open, onOpenChange, stockCountId }: Props) {
  const { stockCounts } = useStockCounts();
  const { items, updateItem, isLoading: loadingItems } = useStockCountItems(stockCountId || "");
  const { sectors, activeSectors, createSector } = useStockSectors();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  // Offline queue for unstable connections - Requirements: 15.4
  const { online, pendingCount, isSyncing, queueAdd, syncPendingOperations } = useOfflineQueue();

  const [orderProducts, setOrderProducts] = useState<OrderProduct[]>([]);
  const [searchResults, setSearchResults] = useState<OrderProduct[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<OrderProduct | null>(null);
  const [selectedSector, setSelectedSector] = useState("");
  const [quantity, setQuantity] = useState(0);
  const [productSearch, setProductSearch] = useState("");
  const [showSummary, setShowSummary] = useState(false);
  const [showAddSector, setShowAddSector] = useState(false);
  const [newSectorName, setNewSectorName] = useState("");
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editQty, setEditQty] = useState(0);
  // Loading states for immediate visual feedback - Requirements: 15.3
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const count = stockCountId ? stockCounts.find((c) => c.id === stockCountId) : null;
  const canEdit = count?.status === "pendente" || count?.status === "em_andamento";
  const isFromOrder = !!count?.order_id;
  const debouncedSearch = useDebounce(productSearch, 300);

  // Carregar produtos do pedido (apenas para contagem de pedido)
  useEffect(() => {
    if (!open || !count?.order_id) return;
    setLoadingProducts(true);
    const loadProducts = async () => {
      const { data } = await supabase
        .from("order_items")
        .select("id, product_id, product_name, quantity, unit")
        .eq("order_id", count.order_id)
        .order("product_name");
      setOrderProducts(data || []);
      setLoadingProducts(false);
    };
    loadProducts();
  }, [count?.order_id, open]);

  // Buscar produtos do catálogo (contagem livre) - busca sob demanda
  const searchCatalogProducts = useCallback(async (searchTerm: string) => {
    if (!searchTerm || searchTerm.length < 2) {
      setSearchResults([]);
      return;
    }
    setLoadingSearch(true);
    try {
      const { data } = await supabase
        .from("products")
        .select("id, name, unit")
        .ilike("name", `%${searchTerm}%`)
        .order("name")
        .limit(20);
      
      const results: OrderProduct[] = (data || []).map(p => ({
        id: p.id,
        product_id: p.id,
        product_name: p.name,
        quantity: 0,
        unit: p.unit || "un"
      }));
      setSearchResults(results);
    } catch (error) {
      console.error("Erro ao buscar produtos:", error);
    } finally {
      setLoadingSearch(false);
    }
  }, []);

  // Executar busca quando o termo mudar (contagem livre)
  useEffect(() => {
    if (!isFromOrder && open) {
      searchCatalogProducts(debouncedSearch);
    }
  }, [debouncedSearch, isFromOrder, open, searchCatalogProducts]);

  // Reset ao fechar
  useEffect(() => {
    if (!open) {
      setOrderProducts([]);
      setSearchResults([]);
      setSelectedProduct(null);
      setSelectedSector("");
      setQuantity(0);
      setProductSearch("");
      setShowSummary(false);
      setShowAddSector(false);
    }
  }, [open]);

  // Produtos filtrados
  const filteredProducts = useMemo(() => {
    if (!productSearch.trim()) return orderProducts;
    return orderProducts.filter((p) =>
      p.product_name.toLowerCase().includes(productSearch.toLowerCase())
    );
  }, [orderProducts, productSearch]);

  // Quantidades por setor do produto selecionado
  const productSectorQtys = useMemo(() => {
    if (!selectedProduct) return [];
    return items
      .filter(
        (i) =>
          (i.order_item_id === selectedProduct.id ||
            i.product_id === selectedProduct.product_id) &&
          i.quantity_counted > 0
      )
      .map((i) => ({
        id: i.id,
        sectorId: i.sector_id,
        sectorName: sectors.find((s) => s.id === i.sector_id)?.name || "Desconhecido",
        qty: i.quantity_counted,
      }));
  }, [selectedProduct, items, sectors]);

  const totalProductQty = productSectorQtys.reduce((sum, s) => sum + s.qty, 0);

  // Resumo geral
  const summaryData = useMemo(() => {
    const map = new Map<
      string,
      {
        name: string;
        sectors: { sectorName: string; qty: number }[];
        total: number;
        items: { id: string; sectorId: string; qty: number }[];
      }
    >();
    items.forEach((item) => {
      if (item.quantity_counted > 0) {
        const key = item.order_item_id || item.product_id || item.product_name;
        if (!map.has(key)) {
          map.set(key, { name: item.product_name, sectors: [], total: 0, items: [] });
        }
        const p = map.get(key)!;
        const sectorName = sectors.find((s) => s.id === item.sector_id)?.name || "Desconhecido";
        const existing = p.sectors.find((s) => s.sectorName === sectorName);
        if (existing) {
          existing.qty += item.quantity_counted;
        } else {
          p.sectors.push({ sectorName, qty: item.quantity_counted });
        }
        p.total += item.quantity_counted;
        p.items.push({
          id: item.id,
          sectorId: item.sector_id || "",
          qty: item.quantity_counted,
        });
      }
    });
    return Array.from(map.values());
  }, [items, sectors]);

  const grandTotal = summaryData.reduce((sum, p) => sum + p.total, 0);

  // Quantidade contada de um produto
  const getCountedQty = (productId: string) =>
    items
      .filter(
        (i) =>
          (i.order_item_id === productId || i.product_id === productId) &&
          i.quantity_counted > 0
      )
      .reduce((s, i) => s + i.quantity_counted, 0);

  // Adicionar quantidade
  const handleAddQty = async () => {
    if (!selectedProduct || !selectedSector || !stockCountId || quantity <= 0) {
      toast({ title: "Preencha todos os campos", variant: "destructive" });
      return;
    }
    const savedQuantity = quantity; // Save for toast message
    setIsSaving(true);
    
    const itemData = {
      stock_count_id: stockCountId,
      order_item_id: selectedProduct.id,
      product_id: selectedProduct.product_id,
      product_name: selectedProduct.product_name,
      sector_id: selectedSector,
      quantity_ordered: selectedProduct.quantity,
      quantity_existing: 0,
      quantity_counted: quantity,
    };
    
    try {
      const existing = items.find(
        (i) =>
          (i.order_item_id === selectedProduct.id ||
            i.product_id === selectedProduct.product_id) &&
          i.sector_id === selectedSector
      );
      
      // If offline, queue the operation - Requirements: 15.4
      if (!online) {
        if (existing) {
          queueAdd("stock_count_items", {
            ...itemData,
            id: existing.id,
            quantity_counted: (existing.quantity_counted || 0) + quantity,
          });
        } else {
          queueAdd("stock_count_items", itemData);
        }
        setQuantity(0);
        setSelectedSector("");
        toast({ 
          title: "📱 Salvo localmente", 
          description: `${savedQuantity} unidades serão sincronizadas quando online`,
        });
        return;
      }
      
      // Online - save directly
      if (existing) {
        await updateItem.mutateAsync({
          id: existing.id,
          quantity_counted: (existing.quantity_counted || 0) + quantity,
        });
      } else {
        await supabase.from("stock_count_items").insert(itemData);
        queryClient.invalidateQueries({ queryKey: ["stock-count-items", stockCountId] });
      }
      setQuantity(0);
      setSelectedSector("");
      // Immediate visual feedback - Requirements: 15.3
      toast({ 
        title: "✓ Quantidade adicionada", 
        description: `${savedQuantity} unidades registradas com sucesso`,
      });
    } catch (e: any) {
      // If network error, queue for later - Requirements: 15.4
      if (e.message?.includes('network') || e.message?.includes('fetch')) {
        queueAdd("stock_count_items", itemData);
        setQuantity(0);
        setSelectedSector("");
        toast({ 
          title: "📱 Salvo localmente", 
          description: "Conexão instável. Dados serão sincronizados automaticamente.",
        });
      } else {
        toast({ title: "Erro ao salvar", description: e.message, variant: "destructive" });
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Confirmar produto
  const handleConfirmProduct = () => {
    queryClient.invalidateQueries({ queryKey: ["stock-count-items", stockCountId] });
    setSelectedProduct(null);
    setSelectedSector("");
    setQuantity(0);
    // Immediate visual feedback - Requirements: 15.3
    toast({ 
      title: "✓ Produto confirmado", 
      description: "Contagem do produto salva com sucesso",
    });
  };

  // Criar setor
  const handleCreateSector = async () => {
    if (!newSectorName.trim()) return;
    try {
      await createSector.mutateAsync({ name: newSectorName.trim() });
      setNewSectorName("");
      setShowAddSector(false);
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    }
  };

  // Editar item
  const handleSaveEdit = async () => {
    if (!editingItemId) return;
    try {
      await updateItem.mutateAsync({ id: editingItemId, quantity_counted: editQty });
      queryClient.invalidateQueries({ queryKey: ["stock-count-items", stockCountId] });
      setEditingItemId(null);
      // Immediate visual feedback - Requirements: 15.3
      toast({ 
        title: "✓ Quantidade atualizada", 
        description: `Alterado para ${editQty} unidades`,
      });
    } catch (e: any) {
      toast({ title: "Erro ao atualizar", description: e.message, variant: "destructive" });
    }
  };

  // Excluir item
  const handleDeleteItem = async (id: string) => {
    if (!confirm("Excluir esta quantidade?")) return;
    try {
      await supabase.from("stock_count_items").delete().eq("id", id);
      queryClient.invalidateQueries({ queryKey: ["stock-count-items", stockCountId] });
      // Immediate visual feedback - Requirements: 15.3
      toast({ 
        title: "✓ Item removido", 
        description: "Quantidade excluída da contagem",
      });
    } catch (e: any) {
      toast({ title: "Erro ao remover", description: e.message, variant: "destructive" });
    }
  };

  // Gerar PDF
  const handlePDF = () => {
    if (summaryData.length === 0) return;
    const doc = new jsPDF();
    let y = 20;
    doc.setFontSize(18);
    doc.text("Contagem de Estoque", 20, y);
    y += 10;
    doc.setFontSize(12);
    doc.text(`Fornecedor: ${(count as any)?.order?.supplier_name || "Contagem Livre"}`, 20, y);
    y += 7;
    doc.text(`Data: ${count ? format(new Date(count.created_at), "dd/MM/yyyy", { locale: ptBR }) : ""}`, 20, y);
    y += 15;
    summaryData.forEach((p) => {
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text(p.name, 20, y);
      y += 6;
      doc.setFont("helvetica", "normal");
      p.sectors.forEach((s) => {
        doc.text(`  ${s.sectorName}: ${s.qty} un`, 25, y);
        y += 5;
      });
      doc.text(`  Total: ${p.total} un`, 25, y);
      y += 8;
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
    });
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(`TOTAL GERAL: ${grandTotal} unidades`, 20, y + 5);
    doc.save(`contagem_${stockCountId?.slice(0, 8)}.pdf`);
  };

  // WhatsApp
  const handleWhatsApp = () => {
    if (summaryData.length === 0) return;
    let msg = `*CONTAGEM DE ESTOQUE*\n`;
    msg += `Fornecedor: ${(count as any)?.order?.supplier_name || "Contagem Livre"}\n\n`;
    summaryData.forEach((p) => {
      msg += `*${p.name}*\n`;
      p.sectors.forEach((s) => {
        msg += `  • ${s.sectorName}: ${s.qty} un\n`;
      });
      msg += `  Total: ${p.total} un\n\n`;
    });
    msg += `*TOTAL GERAL: ${grandTotal} unidades*`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
  };

  if (!count) {
    return (
      <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
        <ResponsiveDialogContent>
          <p className="text-center py-8 text-muted-foreground">Contagem não encontrada</p>
        </ResponsiveDialogContent>
      </ResponsiveDialog>
    );
  }

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className="max-w-5xl max-h-[90vh] p-0 overflow-hidden rounded-t-xl sm:rounded-xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-amber-600 p-4 text-white">
          <ResponsiveDialogHeader className="p-0 space-y-0 text-left">
            <ResponsiveDialogTitle className="text-white text-lg flex items-center gap-2">
              <ClipboardList className="w-5 h-5" />
              {(count as any)?.order?.supplier_name || "Contagem Livre"}
              {/* Offline indicator - Requirements: 15.4 */}
              {!online && (
                <Badge variant="secondary" className="ml-2 bg-yellow-500/20 text-yellow-100 border-yellow-400/50">
                  <WifiOff className="w-3 h-3 mr-1" />
                  Offline
                </Badge>
              )}
            </ResponsiveDialogTitle>
          </ResponsiveDialogHeader>
          <p className="text-sm text-orange-100 mt-1">
            {format(new Date(count.created_at), "dd/MM/yyyy", { locale: ptBR })}
            {count.notes && ` • ${count.notes}`}
          </p>
          <div className="flex flex-wrap gap-2 mt-3">
            <Button size="sm" variant="secondary" onClick={() => setShowSummary(true)} disabled={summaryData.length === 0}>
              <FileText className="w-4 h-4 mr-1" /> Resumo
            </Button>
            <Button size="sm" variant="secondary" onClick={handlePDF} disabled={summaryData.length === 0}>
              <Download className="w-4 h-4 mr-1" /> PDF
            </Button>
            <Button size="sm" variant="secondary" onClick={handleWhatsApp} disabled={summaryData.length === 0}>
              <Share2 className="w-4 h-4 mr-1" /> WhatsApp
            </Button>
            {/* Sync button when there are pending operations - Requirements: 15.4 */}
            {pendingCount > 0 && online && (
              <Button 
                size="sm" 
                variant="secondary" 
                onClick={syncPendingOperations}
                disabled={isSyncing}
                className="bg-green-500/20 hover:bg-green-500/30 text-green-100"
              >
                {isSyncing ? (
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4 mr-1" />
                )}
                Sincronizar ({pendingCount})
              </Button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {loadingItems || loadingProducts ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 h-full">
              {/* Lista de Produtos */}
              <div className="border-r p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Package className="w-4 h-4 text-orange-500" />
                  <span className="font-medium">
                    {isFromOrder ? `Produtos do Pedido (${orderProducts.length})` : "Buscar Produtos"}
                  </span>
                </div>
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder={isFromOrder ? "Filtrar produtos..." : "Digite para buscar produtos..."}
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className="pl-9"
                  />
                  {loadingSearch && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-orange-500" />
                  )}
                </div>
                <ScrollArea className="h-[400px]">
                  <div className="space-y-2 pr-2">
                    {isFromOrder ? (
                      // Contagem de pedido - mostrar produtos filtrados
                      filteredProducts.length === 0 ? (
                        <div className="text-center py-8">
                          <Package className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                          <p className="text-muted-foreground text-sm">
                            {productSearch ? "Nenhum produto encontrado" : "Nenhum produto no pedido"}
                          </p>
                        </div>
                      ) : (
                        filteredProducts.map((product) => {
                          const counted = getCountedQty(product.id);
                          const isSelected = selectedProduct?.id === product.id;
                          return (
                            <div
                              key={product.id}
                              onClick={() => setSelectedProduct(product)}
                              className={cn(
                                "p-3 rounded-lg border cursor-pointer transition-all",
                                isSelected
                                  ? "border-orange-500 bg-orange-50 dark:bg-orange-950/30"
                                  : "hover:bg-gray-50 dark:hover:bg-gray-800"
                              )}
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-medium text-sm">{product.product_name}</span>
                                {counted > 0 && (
                                  <Badge variant="secondary" className="bg-green-100 text-green-700">
                                    {counted} un
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">
                                Pedido: {product.quantity} {product.unit || "un"}
                              </p>
                            </div>
                          );
                        })
                      )
                    ) : (
                      // Contagem livre - busca sob demanda
                      !productSearch || productSearch.length < 2 ? (
                        <div className="text-center py-8">
                          <Search className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                          <p className="text-muted-foreground text-sm">
                            Digite pelo menos 2 caracteres para buscar
                          </p>
                        </div>
                      ) : loadingSearch ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="w-5 h-5 animate-spin text-orange-500 mr-2" />
                          <span className="text-sm text-muted-foreground">Buscando...</span>
                        </div>
                      ) : searchResults.length === 0 ? (
                        <div className="text-center py-8">
                          <Package className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                          <p className="text-muted-foreground text-sm">Nenhum produto encontrado</p>
                        </div>
                      ) : (
                        searchResults.map((product) => {
                          const counted = getCountedQty(product.id);
                          const isSelected = selectedProduct?.id === product.id;
                          return (
                            <div
                              key={product.id}
                              onClick={() => setSelectedProduct(product)}
                              className={cn(
                                "p-3 rounded-lg border cursor-pointer transition-all",
                                isSelected
                                  ? "border-orange-500 bg-orange-50 dark:bg-orange-950/30"
                                  : "hover:bg-gray-50 dark:hover:bg-gray-800"
                              )}
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-medium text-sm">{product.product_name}</span>
                                {counted > 0 && (
                                  <Badge variant="secondary" className="bg-green-100 text-green-700">
                                    {counted} un
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">
                                Unidade: {product.unit || "un"}
                              </p>
                            </div>
                          );
                        })
                      )
                    )}
                  </div>
                </ScrollArea>
              </div>

              {/* Contagem do Produto */}
              <div className="p-4">
                {selectedProduct ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">{selectedProduct.product_name}</h3>
                        <p className="text-sm text-muted-foreground">
                          Total contado: <span className="font-bold text-orange-600">{totalProductQty} un</span>
                        </p>
                      </div>
                      <Button size="sm" variant="outline" onClick={() => setSelectedProduct(null)}>
                        Fechar
                      </Button>
                    </div>

                    {/* Formulário */}
                    {canEdit && (
                      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 space-y-3">
                        <div className="flex gap-2">
                          <Select value={selectedSector} onValueChange={setSelectedSector}>
                            <SelectTrigger className="flex-1">
                              <SelectValue placeholder="Selecione o setor" />
                            </SelectTrigger>
                            <SelectContent>
                              {activeSectors.map((s) => (
                                <SelectItem key={s.id} value={s.id}>
                                  {s.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button size="icon" variant="outline" onClick={() => setShowAddSector(true)}>
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                        {/* Quantity input optimized for scanner/mobile - Requirements: 15.1, 15.2 */}
                        <div className="flex gap-2">
                          <Input
                            type="number"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            placeholder="Quantidade"
                            value={quantity || ""}
                            onChange={(e) => setQuantity(Number(e.target.value))}
                            className="flex-1 h-12 text-lg font-semibold text-center"
                            autoFocus
                            disabled={isSaving}
                          />
                          <Button 
                            onClick={handleAddQty} 
                            disabled={!selectedSector || quantity <= 0 || isSaving}
                            className="h-12 min-w-[100px] min-h-[44px] touch-manipulation"
                          >
                            {isSaving ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              "Adicionar"
                            )}
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Quantidades por setor */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Quantidades por setor</Label>
                      {productSectorQtys.length === 0 ? (
                        <p className="text-sm text-muted-foreground py-4 text-center">
                          Nenhuma quantidade registrada
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {productSectorQtys.map((sq) => (
                            <div
                              key={sq.id}
                              className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded"
                            >
                              <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-gray-400" />
                                <span className="text-sm">{sq.sectorName}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                {editingItemId === sq.id ? (
                                  <>
                                    {/* Edit quantity input optimized for mobile - Requirements: 15.1, 15.2 */}
                                    <Input
                                      type="number"
                                      inputMode="numeric"
                                      pattern="[0-9]*"
                                      value={editQty}
                                      onChange={(e) => setEditQty(Number(e.target.value))}
                                      className="w-24 h-10 text-center font-semibold"
                                      autoFocus
                                    />
                                    <Button size="sm" onClick={handleSaveEdit} className="h-10 min-h-[44px] touch-manipulation">
                                      Salvar
                                    </Button>
                                    <Button size="sm" variant="ghost" onClick={() => setEditingItemId(null)} className="h-10 min-h-[44px] touch-manipulation">
                                      Cancelar
                                    </Button>
                                  </>
                                ) : (
                                  <>
                                    <span className="font-medium">{sq.qty} un</span>
                                    {canEdit && (
                                      <>
                                        {/* Touch-optimized action buttons - min 44x44px - Requirements: 15.2 */}
                                        <Button
                                          size="icon"
                                          variant="ghost"
                                          className="h-11 w-11 min-h-[44px] min-w-[44px] touch-manipulation"
                                          onClick={() => {
                                            setEditingItemId(sq.id);
                                            setEditQty(sq.qty);
                                          }}
                                        >
                                          <Edit2 className="w-4 h-4" />
                                        </Button>
                                        <Button
                                          size="icon"
                                          variant="ghost"
                                          className="h-11 w-11 min-h-[44px] min-w-[44px] text-red-500 touch-manipulation"
                                          onClick={() => handleDeleteItem(sq.id)}
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </Button>
                                      </>
                                    )}
                                  </>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {canEdit && productSectorQtys.length > 0 && (
                      <Button onClick={handleConfirmProduct} className="w-full bg-green-600 hover:bg-green-700">
                        <CheckCircle2 className="w-4 h-4 mr-2" /> Confirmar Produto
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full py-16 text-center">
                    <Package className="w-12 h-12 text-gray-300 mb-3" />
                    <p className="text-muted-foreground">Selecione um produto para contar</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Resumo */}
        <ResponsiveDialog open={showSummary} onOpenChange={setShowSummary}>
          <ResponsiveDialogContent className="max-w-2xl max-h-[80vh] overflow-auto rounded-t-xl sm:rounded-xl">
            <ResponsiveDialogHeader className="text-left">
              <ResponsiveDialogTitle>Resumo da Contagem</ResponsiveDialogTitle>
            </ResponsiveDialogHeader>
            <div className="space-y-4">
              {summaryData.map((p, i) => (
                <div key={i} className="border rounded-lg p-3">
                  <h4 className="font-semibold">{p.name}</h4>
                  <div className="mt-2 space-y-1">
                    {p.sectors.map((s, j) => (
                      <div key={j} className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{s.sectorName}</span>
                        <span>{s.qty} un</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 pt-2 border-t flex justify-between font-medium">
                    <span>Total</span>
                    <span>{p.total} un</span>
                  </div>
                </div>
              ))}
              <div className="bg-orange-50 dark:bg-orange-950/30 rounded-lg p-4 flex justify-between items-center">
                <span className="font-semibold text-lg">Total Geral</span>
                <span className="text-2xl font-bold text-orange-600">{grandTotal} un</span>
              </div>
            </div>
          </ResponsiveDialogContent>
        </ResponsiveDialog>

        {/* Modal Novo Setor */}
        <ResponsiveDialog open={showAddSector} onOpenChange={setShowAddSector}>
          <ResponsiveDialogContent>
            <ResponsiveDialogHeader className="text-left">
              <ResponsiveDialogTitle>Novo Setor</ResponsiveDialogTitle>
            </ResponsiveDialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Nome do setor</Label>
                <Input
                  value={newSectorName}
                  onChange={(e) => setNewSectorName(e.target.value)}
                  placeholder="Ex: Geladeira 1, Freezer..."
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowAddSector(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreateSector} disabled={!newSectorName.trim()}>
                  Criar Setor
                </Button>
              </div>
            </div>
          </ResponsiveDialogContent>
        </ResponsiveDialog>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
