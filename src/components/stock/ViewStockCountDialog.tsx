import { useState, useMemo, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Download, Share2, MapPin, Loader2, Plus, X, Package, CheckCircle2, FileText, Edit, Trash2 } from "lucide-react";
import jsPDF from 'jspdf';
import { useStockCounts } from "@/hooks/useStockCounts";
import { useStockCountItems } from "@/hooks/useStockCountItems";
import { useStockSectors } from "@/hooks/useStockSectors";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/auth/AuthProvider";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog as AddSectorDialog, DialogContent as AddSectorDialogContent, DialogHeader as AddSectorDialogHeader, DialogTitle as AddSectorDialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

interface ViewStockCountDialogProps {
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
  unit_price: number;
  total_price: number;
}

interface SectorQuantity {
  sectorId: string;
  quantity: number;
}

export function ViewStockCountDialog({
  open,
  onOpenChange,
  stockCountId,
}: ViewStockCountDialogProps) {
  const { stockCounts } = useStockCounts();
  const { items, updateItem, isLoading } = useStockCountItems(stockCountId || '');
  const { sectors, activeSectors, createSector } = useStockSectors();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [orderProducts, setOrderProducts] = useState<OrderProduct[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<OrderProduct | null>(null);
  const [selectedSector, setSelectedSector] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(0);
  const [sectorQuantities, setSectorQuantities] = useState<SectorQuantity[]>([]); // Quantidades já contadas para o produto atual
  const [newSectorName, setNewSectorName] = useState("");
  const [newSectorDescription, setNewSectorDescription] = useState("");
  const [showAddSectorDialog, setShowAddSectorDialog] = useState(false);
  const [isCreatingSector, setIsCreatingSector] = useState(false);
  const [countedProducts, setCountedProducts] = useState<Set<string>>(new Set()); // IDs dos produtos já contados
  const [showSummary, setShowSummary] = useState(false);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editQuantity, setEditQuantity] = useState<number>(0);

  // Encontrar a contagem apenas se stockCountId existir
  const count = stockCountId ? stockCounts.find(c => c.id === stockCountId) : null;

  // Buscar produtos do pedido quando a contagem tiver order_id
  useEffect(() => {
    if (!count?.order_id || !open) return;

    const loadOrderProducts = async () => {
      setLoadingProducts(true);
      try {
        const { data, error } = await supabase
          .from('order_items')
          .select('*')
          .eq('order_id', count.order_id)
          .order('product_name', { ascending: true });

        if (error) throw error;
        setOrderProducts(data || []);
      } catch (error: any) {
        console.error('Erro ao carregar produtos do pedido:', error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar os produtos do pedido.",
          variant: "destructive",
        });
      } finally {
        setLoadingProducts(false);
      }
    };

    loadOrderProducts();
  }, [count?.order_id, open, toast]);

  // Carregar produtos já contados quando abrir
  useEffect(() => {
    if (!open || !stockCountId) {
      setCountedProducts(new Set());
      setOrderProducts([]);
      setSelectedProduct(null);
      setSectorQuantities([]);
      setSelectedSector("");
      setQuantity(0);
      return;
    }

    // Se status for pendente ou em_andamento, não bloquear produtos para permitir edição
    const canEdit = count?.status === 'pendente' || count?.status === 'em_andamento';
    
    if (canEdit) {
      // Não bloquear produtos quando pode editar
      setCountedProducts(new Set());
    } else {
      // Identificar quais produtos já foram contados (apenas quando não pode editar)
      const counted = new Set<string>();
      items.forEach(item => {
        const productId = item.order_item_id || item.product_id || '';
        if (productId && item.quantity_counted && item.quantity_counted > 0) {
          counted.add(productId);
        }
      });
      setCountedProducts(counted);
    }
  }, [open, stockCountId, items, count?.status]);

  // Quando selecionar um produto, carregar quantidades já contadas por setor
  useEffect(() => {
    if (!selectedProduct || !stockCountId) {
      setSectorQuantities([]);
      return;
    }

    const productId = selectedProduct.id;
    const productItems = items.filter(item => 
      (item.order_item_id === productId || item.product_id === productId) && 
      item.sector_id &&
      item.quantity_counted && 
      item.quantity_counted > 0
    );

    const quantitiesMap = new Map<string, number>();
    productItems.forEach(item => {
      if (item.sector_id) {
        const current = quantitiesMap.get(item.sector_id) || 0;
        quantitiesMap.set(item.sector_id, current + (item.quantity_counted || 0));
      }
    });

    setSectorQuantities(Array.from(quantitiesMap.entries()).map(([sectorId, quantity]) => ({
      sectorId,
      quantity,
    })));
  }, [selectedProduct, items, stockCountId]);

  // Selecionar produto para contagem
  const handleSelectProduct = (product: OrderProduct) => {
    setSelectedProduct(product);
    setSelectedSector("");
    setQuantity(0);
  };

  // Adicionar quantidade para um setor
  const handleAddQuantity = async () => {
    if (!selectedProduct || !selectedSector || !stockCountId || quantity <= 0) {
      toast({
        title: "Dados incompletos",
        description: "Por favor, selecione um setor e insira uma quantidade válida.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Verificar se já existe um item para este produto e setor
      let existingItem = items.find(item => 
        (item.order_item_id === selectedProduct.id || item.product_id === selectedProduct.product_id) &&
        item.sector_id === selectedSector
      );

      if (existingItem) {
        // Atualizar quantidade existente (somar)
        const newQuantity = (existingItem.quantity_counted || 0) + quantity;
        await updateItem.mutateAsync({
          id: existingItem.id,
          quantity_counted: newQuantity,
        });
      } else {
        // Criar novo item
        const { error: insertError } = await supabase
          .from('stock_count_items')
          .insert({
            stock_count_id: stockCountId,
            order_item_id: selectedProduct.id,
            product_id: selectedProduct.product_id,
            product_name: selectedProduct.product_name,
            sector_id: selectedSector,
            quantity_ordered: selectedProduct.quantity,
            quantity_existing: 0,
            quantity_counted: quantity,
          });

        if (insertError) throw insertError;
        queryClient.invalidateQueries({ queryKey: ['stock-count-items', stockCountId] });
      }

      // Atualizar lista de quantidades do setor
      const existing = sectorQuantities.find(sq => sq.sectorId === selectedSector);
      if (existing) {
        setSectorQuantities(sectorQuantities.map(sq =>
          sq.sectorId === selectedSector ? { ...sq, quantity: existing.quantity + quantity } : sq
        ));
      } else {
        setSectorQuantities([...sectorQuantities, { sectorId: selectedSector, quantity }]);
      }

      // Limpar campos
      setQuantity(0);
      setSelectedSector("");

      toast({
        title: "Quantidade adicionada",
        description: "A quantidade foi registrada com sucesso.",
      });
    } catch (error: any) {
      console.error('Erro ao adicionar quantidade:', error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível adicionar a quantidade.",
        variant: "destructive",
      });
    }
  };

  // Confirmar contagem do produto atual
  const handleConfirmProductCount = () => {
    if (!selectedProduct || !stockCountId || !count) return;

    // Se status for pendente ou em_andamento, não marcar como definitivamente contado
    // para permitir edição posterior
    const canEdit = count.status === 'pendente' || count.status === 'em_andamento';
    
    if (!canEdit) {
      // Apenas marcar como contado se não puder editar (status finalizada)
      setCountedProducts(new Set([...countedProducts, selectedProduct.id]));
    }

    // Invalidar queries para atualizar a lista de itens
    queryClient.invalidateQueries({ queryKey: ['stock-count-items', stockCountId] });

    // Limpar seleção
    setSelectedProduct(null);
    setSelectedSector("");
    setQuantity(0);
    setSectorQuantities([]);

    toast({
      title: "Contagem confirmada",
      description: canEdit 
        ? `${selectedProduct.product_name} foi salvo. Você pode editar novamente se necessário.`
        : `${selectedProduct.product_name} foi confirmado.`,
    });
  };

  // Criar novo setor
  const handleCreateSector = async () => {
    if (!newSectorName.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Por favor, informe o nome do setor.",
        variant: "destructive",
      });
      return;
    }

    setIsCreatingSector(true);
    try {
      await createSector.mutateAsync({
        name: newSectorName.trim(),
        description: newSectorDescription.trim() || undefined,
      });
      
      setNewSectorName("");
      setNewSectorDescription("");
      setShowAddSectorDialog(false);

      toast({
        title: "Setor criado",
        description: "O setor foi criado e adicionado à lista.",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao criar setor",
        description: error.message || "Não foi possível criar o setor.",
        variant: "destructive",
      });
    } finally {
      setIsCreatingSector(false);
    }
  };

  // Calcular total de quantidades do produto atual
  const totalProductQuantity = useMemo(() => {
    return sectorQuantities.reduce((sum, sq) => sum + sq.quantity, 0);
  }, [sectorQuantities]);

  // Agrupar itens por produto para o resumo
  const summaryData = useMemo(() => {
    const productMap = new Map<string, {
      product_name: string;
      sectors: Array<{ sectorName: string; quantity: number }>;
      total: number;
      items: Array<{ id: string; sector_id: string; quantity_counted: number }>;
    }>();

    items.forEach(item => {
      if (item.quantity_counted && item.quantity_counted > 0) {
        const productId = item.order_item_id || item.product_id || '';
        const productName = item.product_name || 'Produto Desconhecido';
        
        if (!productMap.has(productId)) {
          productMap.set(productId, {
            product_name: productName,
            sectors: [],
            total: 0,
            items: [],
          });
        }

        const product = productMap.get(productId)!;
        const sector = sectors.find(s => s.id === item.sector_id);
        
        const existingSector = product.sectors.find(s => s.sectorName === sector?.name);
        if (existingSector) {
          existingSector.quantity += item.quantity_counted;
        } else {
          product.sectors.push({
            sectorName: sector?.name || 'Setor Desconhecido',
            quantity: item.quantity_counted,
          });
        }

        product.total += item.quantity_counted;
        product.items.push({
          id: item.id,
          sector_id: item.sector_id || '',
          quantity_counted: item.quantity_counted,
        });
      }
    });

    return Array.from(productMap.values());
  }, [items, sectors]);

  // Gerar PDF da contagem
  const handleGeneratePDF = () => {
    if (!count || summaryData.length === 0) {
      toast({
        title: "Nenhum dado",
        description: "Não há dados para gerar o PDF.",
        variant: "destructive",
      });
      return;
    }

    try {
      const doc = new jsPDF();
      const margin = 15;
      let y = margin;

      // Título
      doc.setFontSize(18);
      doc.text('Contagem de Estoque', margin, y);
      y += 10;

      // Informações da contagem
      doc.setFontSize(10);
      doc.text(`Pedido: ${count.order?.supplier_name || 'Contagem Livre'}`, margin, y);
      y += 5;
      doc.text(`Data: ${new Date(count.created_at).toLocaleDateString('pt-BR')}`, margin, y);
      y += 5;
      if (count.notes) {
        doc.text(`Observações: ${count.notes}`, margin, y);
        y += 5;
      }
      y += 5;

      // Tabela de produtos
      doc.setFontSize(12);
      doc.text('Resumo da Contagem', margin, y);
      y += 8;

      // Cabeçalho da tabela
      doc.setFontSize(9);
      doc.setFillColor(240, 240, 240);
      doc.rect(margin, y, 180, 7, 'F');
      doc.text('Produto', margin + 2, y + 5);
      doc.text('Setor', margin + 60, y + 5);
      doc.text('Quantidade', margin + 120, y + 5);
      doc.text('Total', margin + 160, y + 5);
      y += 7;

      doc.setFontSize(8);
      summaryData.forEach((product, index) => {
        if (y > 270) {
          doc.addPage();
          y = margin;
        }

        product.sectors.forEach((sector, sectorIndex) => {
          if (y > 270) {
            doc.addPage();
            y = margin;
          }

          if (sectorIndex === 0) {
            doc.setFont('helvetica', 'bold');
            doc.text(product.product_name.substring(0, 35), margin + 2, y + 4);
            doc.setFont('helvetica', 'normal');
          }
          
          doc.text(sector.sectorName.substring(0, 20), margin + 60, y + 4);
          doc.text(sector.quantity.toString(), margin + 120, y + 4);
          
          if (sectorIndex === product.sectors.length - 1) {
            doc.setFont('helvetica', 'bold');
            doc.text(product.total.toString(), margin + 160, y + 4);
            doc.setFont('helvetica', 'normal');
          }
          
          y += 5;
        });

        // Linha separadora
        doc.setDrawColor(200, 200, 200);
        doc.line(margin, y, margin + 180, y);
        y += 3;
      });

      // Total geral
      const grandTotal = summaryData.reduce((sum, p) => sum + p.total, 0);
      y += 5;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text(`Total Geral: ${grandTotal} unidades`, margin + 120, y);
      
      doc.save(`contagem_estoque_${count.id.substring(0, 8)}.pdf`);

      toast({
        title: "PDF gerado",
        description: "O PDF foi baixado com sucesso.",
      });
    } catch (error: any) {
      console.error('Erro ao gerar PDF:', error);
      toast({
        title: "Erro ao gerar PDF",
        description: error.message || "Não foi possível gerar o PDF.",
        variant: "destructive",
      });
    }
  };

  // Compartilhar via WhatsApp
  const handleShareWhatsApp = () => {
    if (!count || summaryData.length === 0) {
      toast({
        title: "Nenhum dado",
        description: "Não há dados para compartilhar.",
        variant: "destructive",
      });
      return;
    }

    try {
      let message = `📦 *CONTAGEM DE ESTOQUE*\n\n`;
      message += `📋 Pedido: ${count.order?.supplier_name || 'Contagem Livre'}\n`;
      message += `📅 Data: ${new Date(count.created_at).toLocaleDateString('pt-BR')}\n`;
      if (count.notes) {
        message += `📝 Obs: ${count.notes}\n`;
      }
      message += `\n━━━━━━━━━━━━━━━━━━━━\n\n`;

      summaryData.forEach((product, index) => {
        message += `*${product.product_name}*\n`;
        product.sectors.forEach(sector => {
          message += `  • ${sector.sectorName}: ${sector.quantity} un\n`;
        });
        message += `  Total: *${product.total} un*\n`;
        if (index < summaryData.length - 1) {
          message += `\n`;
        }
      });

      const grandTotal = summaryData.reduce((sum, p) => sum + p.total, 0);
      message += `\n━━━━━━━━━━━━━━━━━━━━\n`;
      message += `*TOTAL GERAL: ${grandTotal} unidades*\n`;

      const encodedMessage = encodeURIComponent(message);
      const whatsappUrl = `https://wa.me/?text=${encodedMessage}`;
      
      window.open(whatsappUrl, '_blank');

      toast({
        title: "WhatsApp aberto",
        description: "A mensagem foi preparada para compartilhamento.",
      });
    } catch (error: any) {
      console.error('Erro ao compartilhar no WhatsApp:', error);
      toast({
        title: "Erro",
        description: "Não foi possível abrir o WhatsApp.",
        variant: "destructive",
      });
    }
  };

  // Editar quantidade de um item
  const handleEditItem = async (itemId: string, currentQuantity: number) => {
    setEditingItem(itemId);
    setEditQuantity(currentQuantity);
  };

  const handleSaveEdit = async () => {
    if (!editingItem || editQuantity < 0) return;

    try {
      await updateItem.mutateAsync({
        id: editingItem,
        quantity_counted: editQuantity,
      });

      queryClient.invalidateQueries({ queryKey: ['stock-count-items', stockCountId] });
      
      setEditingItem(null);
      setEditQuantity(0);

      toast({
        title: "Quantidade atualizada",
        description: "A quantidade foi atualizada com sucesso.",
      });
    } catch (error: any) {
      console.error('Erro ao atualizar quantidade:', error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível atualizar a quantidade.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm('Tem certeza que deseja remover esta quantidade?')) return;

    try {
      await supabase
        .from('stock_count_items')
        .delete()
        .eq('id', itemId);

      queryClient.invalidateQueries({ queryKey: ['stock-count-items', stockCountId] });

      toast({
        title: "Quantidade removida",
        description: "A quantidade foi removida com sucesso.",
      });
    } catch (error: any) {
      console.error('Erro ao remover quantidade:', error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível remover a quantidade.",
        variant: "destructive",
      });
    }
  };

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-6xl w-[90vw] max-h-[85vh] h-[80vh] overflow-hidden flex flex-col p-0">
          <DialogHeader className="px-4 py-3 border-b flex-shrink-0">
            <DialogTitle className="flex items-center justify-between text-base">
            <span>Contagem de Estoque</span>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8"
                onClick={() => setShowSummary(true)}
                disabled={summaryData.length === 0}
              >
                <FileText className="h-3.5 w-3.5 mr-1.5" />
                Resumo
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8"
                onClick={handleGeneratePDF}
                disabled={summaryData.length === 0}
              >
                <Download className="h-3.5 w-3.5 mr-1.5" />
                PDF
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8"
                onClick={handleShareWhatsApp}
                disabled={summaryData.length === 0}
              >
                <Share2 className="h-3.5 w-3.5 mr-1.5" />
                WhatsApp
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

          <div className="flex-1 overflow-hidden">
            {!count ? (
              <div className="flex items-center justify-center h-full py-12">
                <p className="text-muted-foreground">Contagem não encontrada.</p>
              </div>
            ) : isLoading || loadingProducts ? (
              <div className="flex items-center justify-center h-full py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
            ) : (
              <div className="h-full overflow-auto grid grid-cols-1 lg:grid-cols-2 gap-4 p-4">
              {/* Coluna Direita: Lista de Produtos do Pedido */}
              <Card className="flex flex-col overflow-hidden h-fit lg:h-full">
                <CardHeader className="border-b flex-shrink-0 px-3 py-2">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <Package className="h-4 w-4" />
                    Produtos do Pedido ({orderProducts.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 overflow-hidden p-0 min-h-0">
                  <ScrollArea className="h-full max-h-[60vh] lg:max-h-none">
                    <div className="p-2 space-y-1">
                      {orderProducts.length === 0 ? (
                        <div className="text-center py-6 text-muted-foreground text-sm">
                          {count.order_id 
                            ? "Nenhum produto encontrado neste pedido."
                            : "Esta contagem não foi criada a partir de um pedido."
                          }
                        </div>
                      ) : (
                        orderProducts.map((product) => {
                          const isSelected = selectedProduct?.id === product.id;
                          const isCounted = countedProducts.has(product.id);
                          // Permitir edição se status for pendente ou em_andamento
                          const canEdit = count?.status === 'pendente' || count?.status === 'em_andamento';
                          const canSelect = canEdit || !isCounted;
                          return (
                            <div
                              key={product.id}
                              onClick={() => canSelect && handleSelectProduct(product)}
                              className={`p-2 border rounded text-sm transition-colors ${
                                isSelected 
                                  ? 'bg-primary/10 border-primary' 
                                  : isCounted && !canEdit
                                    ? 'bg-muted/30 border-muted cursor-not-allowed opacity-60'
                                    : canSelect
                                      ? 'hover:bg-muted/50 cursor-pointer'
                                      : 'bg-muted/30 border-muted cursor-not-allowed opacity-60'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <p className="font-medium text-xs">{product.product_name}</p>
                                  <p className="text-xs text-muted-foreground mt-0.5">
                                    Quantidade pedida: {product.quantity} {product.unit || 'un'}
                                  </p>
                                </div>
                                {isCounted && (
                                  <CheckCircle2 className={`h-4 w-4 flex-shrink-0 ${canEdit ? 'text-blue-600' : 'text-green-600'}`} />
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Coluna Esquerda: Contagem do Produto Selecionado */}
              <Card className="flex flex-col overflow-hidden h-fit lg:h-full">
                <CardHeader className="border-b flex-shrink-0 px-3 py-2">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4" />
                    {selectedProduct ? `Contagem: ${selectedProduct.product_name}` : "Selecione um produto"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 overflow-hidden p-0 flex flex-col min-h-0">
                  {!selectedProduct ? (
                    <div className="flex items-center justify-center h-full p-6">
                      <div className="text-center text-muted-foreground">
                        <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p className="text-sm">Clique em um produto à direita para começar a contagem</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Informações do Produto */}
                      <div className="p-3 border-b bg-muted/30">
                        <div className="space-y-1">
                          <p className="font-semibold text-sm">{selectedProduct.product_name}</p>
                          <p className="text-xs text-muted-foreground">
                            Total contado: <span className="font-semibold text-primary">{totalProductQuantity}</span> unidades
                          </p>
                        </div>
                      </div>

                      {/* Formulário de Adicionar Quantidade */}
                      <div className="p-3 border-b space-y-3">
                        <div className="flex gap-2">
                          <Select
                            value={selectedSector}
                            onValueChange={setSelectedSector}
                          >
                            <SelectTrigger className="flex-1 h-9 text-xs">
                              <SelectValue placeholder="Selecione um setor" />
                            </SelectTrigger>
                            <SelectContent>
                              {activeSectors.length === 0 ? (
                                <SelectItem value="none" disabled>
                                  Nenhum setor disponível
                                </SelectItem>
                              ) : (
                                activeSectors.map((sector) => (
                                  <SelectItem key={sector.id} value={sector.id}>
                                    {sector.name}
                                  </SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
                          <Button
                            onClick={() => setShowAddSectorDialog(true)}
                            size="sm"
                            variant="outline"
                            className="h-9 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white"
                          >
                            <Plus className="h-3.5 w-3.5 mr-1.5" />
                            Novo Setor
                          </Button>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="quantity-input" className="text-xs">
                            Quantidade
                          </Label>
                          <div className="flex gap-2">
                            <Input
                              id="quantity-input"
                              type="number"
                              min="0"
                              step="1"
                              value={quantity || ""}
                              onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                              placeholder="0"
                              className="text-sm font-semibold h-9"
                            />
                            <Button
                              onClick={handleAddQuantity}
                              disabled={!selectedSector || quantity <= 0}
                              className="h-9 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700"
                            >
                              Adicionar
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* Lista de Quantidades por Setor */}
                      <ScrollArea className="flex-1 min-h-0">
                        <div className="p-3 space-y-2">
                          {sectorQuantities.length === 0 ? (
                            <div className="text-center py-4 text-muted-foreground text-xs">
                              <p>Nenhuma quantidade adicionada ainda.</p>
                              <p className="mt-1">Selecione um setor e insira uma quantidade acima.</p>
                            </div>
                          ) : (
                            sectorQuantities.map((sq) => {
                              const sector = sectors.find(s => s.id === sq.sectorId);
                              return (
                                <div
                                  key={sq.sectorId}
                                  className="p-2 border rounded flex items-center justify-between"
                                >
                                  <div className="flex items-center gap-2">
                                    <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                                    <span className="text-xs font-medium">{sector?.name || "Setor Desconhecido"}</span>
                                  </div>
                                  <span className="text-xs font-semibold text-primary">{sq.quantity} unidades</span>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </ScrollArea>

                      {/* Botão de Confirmar */}
                      <div className="p-3 border-t bg-muted/30">
                        <Button
                          onClick={handleConfirmProductCount}
                          className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                          disabled={sectorQuantities.length === 0}
                        >
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          Confirmar Contagem
                        </Button>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
                </div>
              )}
          </div>
      </DialogContent>
    </Dialog>

      {/* Dialog: Resumo da Contagem */}
      <Dialog open={showSummary} onOpenChange={setShowSummary}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-0">
          <DialogHeader className="px-6 py-4 border-b flex-shrink-0">
            <DialogTitle className="flex items-center justify-between">
              <span>Resumo da Contagem</span>
              <Button variant="outline" size="sm" onClick={() => setShowSummary(false)}>
                <X className="h-4 w-4 mr-2" />
                Fechar
              </Button>
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-auto p-6">
            {summaryData.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Nenhuma contagem registrada ainda.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {summaryData.map((product) => (
                  <Card key={product.product_name} className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-base">{product.product_name}</h3>
                          <p className="text-sm text-muted-foreground">
                            Total contado: {product.total} unidades
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-primary">{product.total} un</p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        {product.items.map((item) => {
                          const sector = sectors.find(s => s.id === item.sector_id);
                          const isEditing = editingItem === item.id;
                          
                          return (
                            <div
                              key={item.id}
                              className="flex items-center justify-between p-2 border rounded bg-muted/30"
                            >
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                                  <span className="text-sm font-medium">
                                    {sector?.name || 'Setor Desconhecido'}
                                  </span>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                {isEditing ? (
                                  <>
                                    <Input
                                      type="number"
                                      min="0"
                                      step="1"
                                      value={editQuantity}
                                      onChange={(e) => setEditQuantity(parseInt(e.target.value) || 0)}
                                      className="w-20 h-8 text-sm"
                                    />
                                    <Button
                                      size="sm"
                                      onClick={handleSaveEdit}
                                      className="h-8"
                                    >
                                      Salvar
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => {
                                        setEditingItem(null);
                                        setEditQuantity(0);
                                      }}
                                      className="h-8"
                                    >
                                      Cancelar
                                    </Button>
                                  </>
                                ) : (
                                  <>
                                    <span className="text-sm font-semibold min-w-[60px] text-right">
                                      {item.quantity_counted} un
                                    </span>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => handleEditItem(item.id, item.quantity_counted)}
                                      className="h-8 w-8 p-0"
                                    >
                                      <Edit className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => handleDeleteItem(item.id)}
                                      className="h-8 w-8 p-0 text-destructive"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                  </>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </Card>
                ))}

                <Card className="p-4 bg-primary/5 border-primary/20">
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-semibold">Total Geral</span>
                    <span className="text-2xl font-bold text-primary">
                      {summaryData.reduce((sum, p) => sum + p.total, 0)} unidades
                    </span>
                  </div>
                </Card>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog: Criar Novo Setor */}
      <AddSectorDialog open={showAddSectorDialog} onOpenChange={setShowAddSectorDialog}>
        <AddSectorDialogContent>
          <AddSectorDialogHeader>
            <AddSectorDialogTitle>Criar Novo Setor</AddSectorDialogTitle>
          </AddSectorDialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="sector-name">Nome do Setor *</Label>
              <Input
                id="sector-name"
                value={newSectorName}
                onChange={(e) => setNewSectorName(e.target.value)}
                placeholder="Ex: Geladeira 1, Freezer 2, etc."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sector-description">Descrição (opcional)</Label>
              <Textarea
                id="sector-description"
                value={newSectorDescription}
                onChange={(e) => setNewSectorDescription(e.target.value)}
                placeholder="Adicione uma descrição para este setor..."
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowAddSectorDialog(false);
                  setNewSectorName("");
                  setNewSectorDescription("");
                }}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleCreateSector}
                disabled={isCreatingSector || !newSectorName.trim()}
                className="bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700"
              >
                {isCreatingSector ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Criando...
                  </>
                ) : (
                  "Criar Setor"
                )}
              </Button>
            </div>
          </div>
        </AddSectorDialogContent>
      </AddSectorDialog>
    </>
  );
}
