import { useState, useEffect, useMemo } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash2, Loader2, Edit3, Building2, Calendar, Package, FileText, DollarSign, Save } from "lucide-react";
import { Combobox } from "@/components/ui/combobox";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { cn } from "@/lib/utils";

interface PedidoItem {
  produto: string;
  quantidade: number;
  valorUnitario: number;
  unidade: string;
}

interface EditPedidoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pedido: any;
  onEdit: () => void;
}

export default function EditPedidoDialog({ open, onOpenChange, pedido, onEdit }: EditPedidoDialogProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [fornecedor, setFornecedor] = useState("");
  const [dataEntrega, setDataEntrega] = useState("");
  const [status, setStatus] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [itens, setItens] = useState<PedidoItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [productSearch, setProductSearch] = useState("");
  const debouncedProductSearch = useDebounce(productSearch, 300);

  const statusOptions = ["pendente", "processando", "confirmado", "entregue", "cancelado"];

  // Filtrar produtos baseado na busca - sempre incluir produtos selecionados
  const filteredProducts = useMemo(() => {
    // Obter produtos já selecionados nos itens
    const selectedProductNames = itens.map(item => item.produto).filter(Boolean);
    const selectedProducts = products.filter(p => selectedProductNames.includes(p.name));
    
    if (!debouncedProductSearch) {
      // Sem busca: mostrar produtos selecionados + primeiros 50
      const initialProducts = products.slice(0, 50);
      const merged = [...selectedProducts, ...initialProducts];
      // Remover duplicatas
      const unique = merged.filter((p, idx, arr) => 
        arr.findIndex(t => t.name === p.name) === idx
      );
      return unique;
    }
    
    // Com busca: filtrar + sempre incluir selecionados
    const search = debouncedProductSearch.toLowerCase();
    const filtered = products.filter(p => 
      p.name?.toLowerCase().includes(search)
    );
    
    // Adicionar produtos selecionados mesmo que não correspondam à busca
    const merged = [...selectedProducts, ...filtered].slice(0, 100);
    const unique = merged.filter((p, idx, arr) => 
      arr.findIndex(t => t.name === p.name) === idx
    );
    return unique;
  }, [products, debouncedProductSearch, itens]);

  useEffect(() => {
    if (open) {
      loadSuppliers();
      loadProducts();
    }
    if (pedido && open) {
      setFornecedor(pedido.supplier_id || "");
      setDataEntrega(pedido.delivery_date || "");
      setStatus(pedido.status);
      setObservacoes(pedido.observacoes || "");
      
      // Carregar itens do pedido
      if (pedido.detalhesItens && pedido.detalhesItens.length > 0) {
        console.log('[EDIT PEDIDO] Itens recebidos:', pedido.detalhesItens);
        const formattedItens = pedido.detalhesItens.map((item: any) => {
          const formattedItem = {
            produto: item.product_name || item.produto || item.productName || "",
            quantidade: parseFloat(item.quantity || item.quantidade || 1),
            valorUnitario: parseFloat(item.unit_price || item.valorUnitario || item.unitPrice || 0),
            unidade: item.unit || item.unidade || "un"
          };
          console.log('[EDIT PEDIDO] Item formatado:', formattedItem);
          return formattedItem;
        });
        setItens(formattedItens);
      } else {
        setItens([{ produto: "", quantidade: 1, valorUnitario: 0, unidade: "un" }]);
      }
    }
  }, [pedido, open]);

  const loadSuppliers = async () => {
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .order('name');
    
    if (error) {
      console.error('Error loading suppliers:', error);
      return;
    }
    setSuppliers(data || []);
  };

  const loadProducts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('User not authenticated');
        return;
      }

      // Get total count
      const { count: totalCount, error: countError } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);
      
      if (countError) throw countError;
      if (!totalCount || totalCount === 0) {
        setProducts([]);
        return;
      }

      // Load in batches of 1000
      const pageSize = 1000;
      const totalPages = Math.ceil(totalCount / pageSize);
      const allProducts = [];
      
      console.log(`[EDIT PEDIDO] Loading ${totalCount} products in ${totalPages} pages`);
      
      for (let page = 0; page < totalPages; page++) {
        const from = page * pageSize;
        const to = from + pageSize - 1;
        
        const { data: pageData, error: pageError } = await supabase
          .from('products')
          .select('*')
          .eq('user_id', user.id)
          .order('name')
          .range(from, to);
        
        if (pageError) throw pageError;
        if (pageData && pageData.length > 0) {
          allProducts.push(...pageData);
        }
      }
      
      console.log(`[EDIT PEDIDO] Loaded ${allProducts.length} products total`);
      setProducts(allProducts);
    } catch (error) {
      console.error('Error loading products:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar produtos",
        variant: "destructive"
      });
    }
  };

  const handleAddItem = () => {
    setItens([...itens, { produto: "", quantidade: 1, valorUnitario: 0, unidade: "un" }]);
  };

  const handleRemoveItem = (index: number) => {
    setItens(itens.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof PedidoItem, value: any) => {
    const newItens = [...itens];
    newItens[index] = { ...newItens[index], [field]: value };
    setItens(newItens);
  };

  const calculateTotal = () => {
    return itens.reduce((acc, item) => acc + (item.quantidade * item.valorUnitario), 0);
  };

  const handleSubmit = async () => {
    if (!user) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado",
        variant: "destructive",
      });
      return;
    }

    if (!fornecedor || !dataEntrega || itens.some(item => !item.produto || item.quantidade <= 0)) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const total = calculateTotal();
      const selectedSupplier = suppliers.find(s => s.id === fornecedor);

      // Update order
      const { error: orderError } = await supabase
        .from('orders')
        .update({
          supplier_id: fornecedor,
          supplier_name: selectedSupplier?.name || '',
          total_value: total,
          status,
          delivery_date: dataEntrega,
          observations: observacoes,
        })
        .eq('id', pedido.id);

      if (orderError) throw orderError;

      // Delete existing items
      const { error: deleteError } = await supabase
        .from('order_items')
        .delete()
        .eq('order_id', pedido.id);

      if (deleteError) throw deleteError;

      // Insert new items
      const orderItems = itens.map(item => {
        const product = products.find(p => p.name === item.produto);
        return {
          order_id: pedido.id,
          product_id: product?.id || null,
          product_name: item.produto,
          quantity: item.quantidade,
          unit: item.unidade,
          unit_price: item.valorUnitario,
          total_price: item.quantidade * item.valorUnitario,
        };
      });

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      toast({
        title: "Pedido atualizado",
        description: "Alterações salvas com sucesso",
      });

      onEdit();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error updating order:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar pedido",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[96vw] sm:w-[92vw] md:w-[90vw] max-w-4xl max-h-[90vh] sm:max-h-[85vh] overflow-hidden border-0 dark:border dark:border-gray-700 shadow-2xl rounded-lg sm:rounded-xl p-0 flex flex-col bg-white dark:bg-gray-900">
        <DialogHeader className="flex-shrink-0 px-3 sm:px-4 py-2 border-b border-gray-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-800">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded bg-blue-600 dark:bg-blue-500 flex-shrink-0">
              <Edit3 className="h-3.5 w-3.5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-sm font-bold text-slate-900 dark:text-white truncate">
                Editar Pedido #{pedido?.id}
              </DialogTitle>
            </div>
          </div>
        </DialogHeader>

        <div className="flex flex-col flex-1 overflow-hidden">
          <Tabs defaultValue="dados" className="w-full flex flex-col flex-1 overflow-hidden">
            <div className="flex-shrink-0 px-3 sm:px-4 py-1.5 border-b border-gray-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-800">
              <TabsList className="grid w-full grid-cols-3 bg-white dark:bg-gray-900 rounded-md p-0.5 border border-gray-200 dark:border-gray-700">
                <TabsTrigger 
                  value="dados" 
                  className="rounded text-xs font-medium px-2 py-1.5 data-[state=active]:bg-blue-600 data-[state=active]:dark:bg-blue-500 data-[state=active]:text-white"
                >
                  Dados
                </TabsTrigger>
                <TabsTrigger 
                  value="itens" 
                  className="rounded text-xs font-medium px-2 py-1.5 data-[state=active]:bg-green-600 data-[state=active]:dark:bg-green-500 data-[state=active]:text-white"
                >
                  Itens
                </TabsTrigger>
                <TabsTrigger 
                  value="observacoes" 
                  className="rounded text-xs font-medium px-2 py-1.5 data-[state=active]:bg-purple-600 data-[state=active]:dark:bg-purple-500 data-[state=active]:text-white"
                >
                  Obs
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="dados" className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="fornecedor" className="text-sm font-medium text-gray-700 dark:text-gray-300">Fornecedor *</Label>
                  <Select value={fornecedor} onValueChange={setFornecedor}>
                    <SelectTrigger className="dark:bg-gray-800 dark:border-gray-600 dark:text-white">
                      <SelectValue placeholder="Selecione o fornecedor" />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers.map((s) => (
                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dataEntrega" className="text-sm font-medium text-gray-700 dark:text-gray-300">Data de Entrega *</Label>
                  <Input
                    id="dataEntrega"
                    type="date"
                    value={dataEntrega}
                    onChange={(e) => setDataEntrega(e.target.value)}
                    className="dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                  />
                </div>

                <div className="space-y-2 lg:col-span-2">
                  <Label htmlFor="status" className="text-sm font-medium text-gray-700 dark:text-gray-300">Status do Pedido</Label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger className="dark:bg-gray-800 dark:border-gray-600 dark:text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s.charAt(0).toUpperCase() + s.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="itens" className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-sm text-gray-900 dark:text-white">Itens do Pedido *</h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {itens.length} item(s)
                    </p>
                  </div>
                  <Button 
                    type="button" 
                    onClick={handleAddItem}
                    className="bg-green-600 dark:bg-green-500 hover:bg-green-700 dark:hover:bg-green-600 text-white"
                    size="sm"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Adicionar
                  </Button>
                </div>

                <div className="space-y-2">
                  {itens.map((item, index) => (
                    <div key={index} className="p-2 sm:p-3 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2">
                        <div className="lg:col-span-2 space-y-1">
                          <Label className="text-xs font-medium text-gray-600 dark:text-gray-400">Produto *</Label>
                          <Combobox
                            options={filteredProducts.map(p => ({
                              value: p.name,
                              label: p.name
                            }))}
                            value={item.produto}
                            onValueChange={(value) => handleItemChange(index, 'produto', value)}
                            placeholder="Buscar produto..."
                            searchPlaceholder={`Buscar entre ${products.length} produtos...`}
                            emptyText={debouncedProductSearch ? "Nenhum produto encontrado" : "Digite para ver produtos..."}
                            className="text-sm"
                            onSearchChange={setProductSearch}
                          />
                        </div>
                        
                        <div className="space-y-1">
                          <Label className="text-xs font-medium text-gray-600 dark:text-gray-400">Qtd *</Label>
                          <Input
                            type="number"
                            min="1"
                            step="0.01"
                            value={item.quantidade}
                            onChange={(e) => handleItemChange(index, 'quantidade', parseFloat(e.target.value) || 0)}
                            onFocus={(e) => e.target.select()}
                            className="text-sm dark:bg-gray-900 dark:border-gray-600 dark:text-white"
                          />
                        </div>
                        
                        <div className="space-y-1">
                          <Label className="text-xs font-medium text-gray-600 dark:text-gray-400">Unidade *</Label>
                          <Select
                            value={item.unidade}
                            onValueChange={(value) => handleItemChange(index, 'unidade', value)}
                          >
                            <SelectTrigger className="text-sm dark:bg-gray-900 dark:border-gray-600 dark:text-white">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="un">un</SelectItem>
                              <SelectItem value="kg">kg</SelectItem>
                              <SelectItem value="pc">pc</SelectItem>
                              <SelectItem value="caixa">caixa</SelectItem>
                              <SelectItem value="litro">L</SelectItem>
                              <SelectItem value="metro">m</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-1">
                          <Label className="text-xs font-medium text-gray-600 dark:text-gray-400">Valor Unit. *</Label>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="0.00"
                            value={item.valorUnitario}
                            onChange={(e) => handleItemChange(index, 'valorUnitario', parseFloat(e.target.value) || 0)}
                            onFocus={(e) => e.target.select()}
                            className="text-sm dark:bg-gray-900 dark:border-gray-600 dark:text-white"
                          />
                        </div>
                        
                        <div className="flex items-end gap-1">
                          <div className="flex-1 space-y-1">
                            <Label className="text-xs font-medium text-gray-600 dark:text-gray-400">Subtotal</Label>
                            <div className="px-2 py-1.5 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded text-sm font-semibold text-green-700 dark:text-green-400">
                              R$ {(item.quantidade * item.valorUnitario).toFixed(2)}
                            </div>
                          </div>
                          {itens.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveItem(index)}
                              className="h-7 w-7 p-0 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/50"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-3 border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Total do Pedido</span>
                    <div className="text-right">
                      <div className="text-lg font-bold text-green-600 dark:text-green-400">
                        R$ {calculateTotal().toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{itens.length} item(s)</p>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="observacoes" className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3">
              <div className="space-y-2">
                <Label htmlFor="observacoes" className="text-sm font-medium text-gray-700 dark:text-gray-300">Observações Adicionais</Label>
                <Textarea
                  id="observacoes"
                  placeholder="Digite observações sobre o pedido, instruções de entrega, etc..."
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  rows={6}
                  className="resize-none dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {observacoes.length}/500 caracteres
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter className="flex-shrink-0 px-3 sm:px-4 py-2 border-t border-gray-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-800">
          <div className="flex items-center justify-between w-full gap-2">
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => onOpenChange(false)} 
                disabled={loading}
                className="dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
              >
                Cancelar
              </Button>
            </div>
            
            <Button 
              onClick={handleSubmit} 
              disabled={loading}
              className="bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Salvar
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
