import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash2, Loader2, Edit3, Building2, Calendar, Package, FileText, DollarSign, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { cn } from "@/lib/utils";

interface PedidoItem {
  produto: string;
  quantidade: number;
  valorUnitario: number;
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

  const statusOptions = ["pendente", "processando", "confirmado", "entregue", "cancelado"];

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
      setItens(pedido.detalhesItens || [{ produto: "", quantidade: 1, valorUnitario: 0 }]);
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
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('name');
    
    if (error) {
      console.error('Error loading products:', error);
      return;
    }
    setProducts(data || []);
  };

  const handleAddItem = () => {
    setItens([...itens, { produto: "", quantidade: 1, valorUnitario: 0 }]);
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
      <DialogContent className="w-[90vw] max-w-5xl h-[85vh] max-h-[900px] overflow-hidden border-0 shadow-2xl rounded-xl sm:rounded-2xl p-0 animate-in fade-in-0 zoom-in-95 duration-300">
        <DialogHeader className="px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-100/60 bg-gradient-to-br from-blue-50/80 via-indigo-50/60 to-purple-50/40 backdrop-blur-sm relative overflow-hidden flex-shrink-0">
          {/* Efeitos decorativos de fundo */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-indigo-500/5 to-purple-500/5"></div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400/10 to-indigo-400/10 rounded-full -translate-y-16 translate-x-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-purple-400/10 to-blue-400/10 rounded-full translate-y-12 -translate-x-12"></div>
          
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
            <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
              <div className="p-2 sm:p-3 rounded-xl sm:rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 text-white shadow-lg shadow-blue-500/25 ring-2 ring-white/20 backdrop-blur-sm flex-shrink-0">
                <Edit3 className="h-5 w-5 sm:h-6 sm:w-6 drop-shadow-sm" />
              </div>
              <div className="flex flex-col flex-1 min-w-0">
                <DialogTitle className="text-lg sm:text-xl lg:text-2xl font-bold bg-gradient-to-r from-blue-900 via-indigo-800 to-purple-800 bg-clip-text text-transparent truncate">
                  Editar Pedido #{pedido?.id}
                </DialogTitle>
                <p className="text-gray-600/80 text-xs sm:text-sm font-medium mt-0.5 truncate">
                  Modifique as informações do pedido
                </p>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="flex flex-col h-full overflow-hidden">
          <Tabs defaultValue="dados" className="w-full flex flex-col h-full">
            <div className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 border-b border-gray-100/60 bg-gradient-to-r from-gray-50/80 to-slate-50/60 backdrop-blur-sm flex-shrink-0">
              <TabsList className="grid w-full grid-cols-3 bg-white/60 backdrop-blur-sm rounded-xl sm:rounded-2xl p-1 sm:p-1.5 shadow-lg border border-gray-200/40">
                <TabsTrigger 
                  value="dados" 
                  className="rounded-lg sm:rounded-xl font-semibold text-xs sm:text-sm transition-all duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-xl data-[state=active]:shadow-blue-500/25 px-2 sm:px-3 py-2 sm:py-2.5"
                >
                  <span className="hidden sm:inline">📋 Dados</span>
                  <span className="sm:hidden">📋</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="itens" 
                  className="rounded-lg sm:rounded-xl font-semibold text-xs sm:text-sm transition-all duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-600 data-[state=active]:to-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-xl data-[state=active]:shadow-green-500/25 px-2 sm:px-3 py-2 sm:py-2.5"
                >
                  <span className="hidden sm:inline">📦 Itens</span>
                  <span className="sm:hidden">📦</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="observacoes" 
                  className="rounded-lg sm:rounded-xl font-semibold text-xs sm:text-sm transition-all duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-violet-600 data-[state=active]:text-white data-[state=active]:shadow-xl data-[state=active]:shadow-purple-500/25 px-2 sm:px-3 py-2 sm:py-2.5"
                >
                  <span className="hidden sm:inline">📝 Obs</span>
                  <span className="sm:hidden">📝</span>
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="dados" className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6 animate-in fade-in-0 slide-in-from-bottom-4 duration-300">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                <Card className="p-4 sm:p-5 border-0 shadow-lg bg-gradient-to-br from-blue-50/60 to-indigo-50/40 backdrop-blur-sm rounded-xl sm:rounded-2xl">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg flex-shrink-0">
                        <Building2 className="h-4 w-4" />
                      </div>
                      <Label htmlFor="fornecedor" className="text-sm font-semibold text-gray-700">Fornecedor *</Label>
                    </div>
                    <Select value={fornecedor} onValueChange={setFornecedor}>
                      <SelectTrigger className="bg-white/60 backdrop-blur-sm border-blue-200 focus:border-blue-400 transition-colors">
                        <SelectValue placeholder="Selecione o fornecedor" />
                      </SelectTrigger>
                      <SelectContent>
                        {suppliers.map((s) => (
                          <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </Card>

                <Card className="p-4 sm:p-5 border-0 shadow-lg bg-gradient-to-br from-green-50/60 to-emerald-50/40 backdrop-blur-sm rounded-xl sm:rounded-2xl">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-gradient-to-br from-green-600 to-emerald-600 text-white shadow-lg flex-shrink-0">
                        <Calendar className="h-4 w-4" />
                      </div>
                      <Label htmlFor="dataEntrega" className="text-sm font-semibold text-gray-700">Data de Entrega *</Label>
                    </div>
                    <Input
                      id="dataEntrega"
                      type="date"
                      value={dataEntrega}
                      onChange={(e) => setDataEntrega(e.target.value)}
                      className="bg-white/60 backdrop-blur-sm border-green-200 focus:border-green-400 transition-colors"
                    />
                  </div>
                </Card>

                <Card className="p-4 sm:p-5 border-0 shadow-lg bg-gradient-to-br from-purple-50/60 to-violet-50/40 backdrop-blur-sm rounded-xl sm:rounded-2xl lg:col-span-2">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-gradient-to-br from-purple-600 to-violet-600 text-white shadow-lg flex-shrink-0">
                        <Package className="h-4 w-4" />
                      </div>
                      <Label htmlFor="status" className="text-sm font-semibold text-gray-700">Status do Pedido</Label>
                    </div>
                    <Select value={status} onValueChange={setStatus}>
                      <SelectTrigger className="bg-white/60 backdrop-blur-sm border-purple-200 focus:border-purple-400 transition-colors">
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
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="itens" className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6 animate-in fade-in-0 slide-in-from-bottom-4 duration-300">
              <Card className="p-4 sm:p-6 border-0 shadow-xl bg-gradient-to-br from-white via-gray-50/30 to-green-50/20 backdrop-blur-sm rounded-xl sm:rounded-2xl">
                <div className="space-y-4 sm:space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 sm:p-4 bg-gradient-to-r from-green-50/60 to-emerald-50/40 rounded-xl sm:rounded-2xl border border-green-100/60">
                    <div className="flex items-center gap-3">
                      <div className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-gradient-to-br from-green-600 to-emerald-600 text-white shadow-lg flex-shrink-0">
                        <Package className="h-4 w-4 sm:h-5 sm:w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-gray-900 text-sm sm:text-base">Itens do Pedido *</h4>
                        <p className="text-xs sm:text-sm text-gray-600">
                          {itens.length} item(s) no pedido
                        </p>
                      </div>
                    </div>
                    <Button 
                      type="button" 
                      onClick={handleAddItem}
                      className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                      size="sm"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      <span className="hidden sm:inline">Adicionar Item</span>
                      <span className="sm:hidden">Adicionar</span>
                    </Button>
                  </div>

                  <div className="space-y-3 sm:space-y-4">
                    {itens.map((item, index) => (
                      <Card key={index} className="p-3 sm:p-4 border-0 shadow-lg bg-gradient-to-br from-white/80 to-gray-50/40 backdrop-blur-sm rounded-xl">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
                          <div className="lg:col-span-2 space-y-2">
                            <Label className="text-xs font-semibold text-gray-600">Produto</Label>
                            <Select
                              value={item.produto}
                              onValueChange={(value) => handleItemChange(index, 'produto', value)}
                            >
                              <SelectTrigger className="bg-white/60 backdrop-blur-sm border-gray-200 focus:border-green-400 transition-colors">
                                <SelectValue placeholder="Selecione o produto" />
                              </SelectTrigger>
                              <SelectContent>
                                {products.map((p) => (
                                  <SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div className="space-y-2">
                            <Label className="text-xs font-semibold text-gray-600">Quantidade</Label>
                            <Input
                              type="number"
                              min="1"
                              value={item.quantidade}
                              onChange={(e) => handleItemChange(index, 'quantidade', parseInt(e.target.value) || 0)}
                              className="bg-white/60 backdrop-blur-sm border-gray-200 focus:border-green-400 transition-colors"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label className="text-xs font-semibold text-gray-600">Valor Unit.</Label>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              placeholder="0.00"
                              value={item.valorUnitario}
                              onChange={(e) => handleItemChange(index, 'valorUnitario', parseFloat(e.target.value) || 0)}
                              className="bg-white/60 backdrop-blur-sm border-gray-200 focus:border-green-400 transition-colors"
                            />
                          </div>
                          
                          <div className="flex items-end gap-2">
                            <div className="flex-1 space-y-2">
                              <Label className="text-xs font-semibold text-gray-600">Subtotal</Label>
                              <div className="px-3 py-2 bg-green-50 border border-green-200 rounded-md text-sm font-bold text-green-700">
                                R$ {(item.quantidade * item.valorUnitario).toFixed(2)}
                              </div>
                            </div>
                            {itens.length > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveItem(index)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>

                  <Card className="p-4 sm:p-5 border-0 shadow-xl bg-gradient-to-br from-green-50 via-emerald-50/60 to-teal-50/40 backdrop-blur-sm rounded-xl border-l-4 border-l-green-500">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="p-3 rounded-xl bg-gradient-to-br from-green-600 to-emerald-600 text-white shadow-xl flex-shrink-0">
                          <DollarSign className="h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900 text-sm">Total do Pedido</h4>
                          <p className="text-xs text-gray-600">Valor total calculado</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl sm:text-3xl font-bold text-green-600">
                          R$ {calculateTotal().toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </div>
                        <p className="text-xs text-gray-500">{itens.length} item(s)</p>
                      </div>
                    </div>
                  </Card>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="observacoes" className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6 animate-in fade-in-0 slide-in-from-bottom-4 duration-300">
              <Card className="p-4 sm:p-6 border-0 shadow-xl bg-gradient-to-br from-white via-gray-50/30 to-purple-50/20 backdrop-blur-sm rounded-xl sm:rounded-2xl">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-gradient-to-r from-purple-50/60 to-violet-50/40 rounded-xl sm:rounded-2xl border border-purple-100/60">
                    <div className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-gradient-to-br from-purple-600 to-violet-600 text-white shadow-lg flex-shrink-0">
                      <FileText className="h-4 w-4 sm:h-5 sm:w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-gray-900 text-sm sm:text-base">Observações do Pedido</h4>
                      <p className="text-xs sm:text-sm text-gray-600">
                        Adicione informações extras sobre o pedido
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="observacoes" className="text-sm font-semibold text-gray-700">Observações Adicionais</Label>
                    <Textarea
                      id="observacoes"
                      placeholder="Digite aqui observações importantes sobre o pedido, instruções especiais de entrega, condições de pagamento, etc..."
                      value={observacoes}
                      onChange={(e) => setObservacoes(e.target.value)}
                      rows={8}
                      className="bg-white/60 backdrop-blur-sm border-purple-200 focus:border-purple-400 transition-colors resize-none"
                    />
                    <p className="text-xs text-gray-500">
                      {observacoes.length}/500 caracteres
                    </p>
                  </div>
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 border-t border-gray-100/60 bg-gradient-to-r from-gray-50/80 to-slate-50/60 backdrop-blur-sm flex-shrink-0">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full sm:justify-between sm:items-center">
            <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <span>Editando pedido #{pedido?.id}</span>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <Button 
                variant="outline" 
                onClick={() => onOpenChange(false)} 
                disabled={loading}
                className="bg-white/60 backdrop-blur-sm border-gray-200 hover:bg-gray-50 transition-all duration-200"
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleSubmit} 
                disabled={loading}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    <span className="hidden sm:inline">Salvando...</span>
                    <span className="sm:hidden">Salvando</span>
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    <span className="hidden sm:inline">Salvar Alterações</span>
                    <span className="sm:hidden">Salvar</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
