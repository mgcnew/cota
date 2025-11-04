import { useState, useEffect, useMemo } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Plus, Trash2, Loader2, Edit3, Building2, Calendar, Package, FileText, 
  DollarSign, Save, ShoppingCart, Truck, Clock, X, Hash, Eye
} from "lucide-react";
import { Combobox } from "@/components/ui/combobox";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { cn } from "@/lib/utils";
import { parseDecimalInput, formatDecimalDisplay } from "@/lib/text-utils";

interface PedidoItem {
  produto: string;
  quantidade: number;
  valorUnitario: number;
  unidade: string;
}

interface PedidoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pedido: any;
  onEdit?: () => void;
}

type EditSection = "dados" | "itens" | "observacoes";

export default function PedidoDialog({ open, onOpenChange, pedido, onEdit }: PedidoDialogProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Estados do modo
  const [isEditMode, setIsEditMode] = useState(false);
  const [activeSection, setActiveSection] = useState<EditSection>("dados");
  
  // Estados do formulário
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

  // Filtrar produtos baseado na busca
  const filteredProducts = useMemo(() => {
    const selectedProductNames = itens.map(item => item.produto).filter(Boolean);
    const selectedProducts = products.filter(p => selectedProductNames.includes(p.name));
    
    if (!debouncedProductSearch) {
      const initialProducts = products.slice(0, 50);
      const merged = [...selectedProducts, ...initialProducts];
      const unique = merged.filter((p, idx, arr) => 
        arr.findIndex(t => t.name === p.name) === idx
      );
      return unique;
    }
    
    const search = debouncedProductSearch.toLowerCase();
    const filtered = products.filter(p => 
      p.name?.toLowerCase().includes(search)
    );
    
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
      setIsEditMode(false);
      setActiveSection("dados");
    }
    if (pedido && open) {
      setFornecedor(pedido.supplier_id || "");
      setDataEntrega(pedido.delivery_date || "");
      setStatus(pedido.status || "");
      setObservacoes(pedido.observations || pedido.observacoes || "");
      
      if (pedido.detalhesItens && pedido.detalhesItens.length > 0) {
        const formattedItens = pedido.detalhesItens.map((item: any) => ({
          produto: item.product_name || item.produto || item.productName || "",
          quantidade: parseFloat(item.quantity || item.quantidade || 1),
          valorUnitario: parseFloat(item.unit_price || item.valorUnitario || item.unitPrice || 0),
          unidade: item.unit || item.unidade || "un"
        }));
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

      const { count: totalCount, error: countError } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true });
      
      if (countError) throw countError;
      if (!totalCount || totalCount === 0) {
        setProducts([]);
        return;
      }

      const pageSize = 1000;
      const totalPages = Math.ceil(totalCount / pageSize);
      const allProducts = [];
      
      for (let page = 0; page < totalPages; page++) {
        const from = page * pageSize;
        const to = from + pageSize - 1;
        
        const { data: pageData, error: pageError } = await supabase
          .from('products')
          .select('*')
          .order('name')
          .range(from, to);
        
        if (pageError) throw pageError;
        if (pageData && pageData.length > 0) {
          allProducts.push(...pageData);
        }
      }
      
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

      const { error: deleteError } = await supabase
        .from('order_items')
        .delete()
        .eq('order_id', pedido.id);

      if (deleteError) throw deleteError;

      const orderItems = itens.map(item => {
        const product = products.find(p => p.name === item.produto);
        const quantidade = typeof item.quantidade === 'string' 
          ? parseDecimalInput(item.quantidade) || 0
          : item.quantidade;
        
        return {
          order_id: pedido.id,
          product_id: product?.id || null,
          product_name: item.produto,
          quantity: quantidade,
          unit: item.unidade,
          unit_price: item.valorUnitario,
          total_price: quantidade * item.valorUnitario,
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

      setIsEditMode(false);
      if (onEdit) onEdit();
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

  const getStatusBadge = (status: string) => {
    const statusMap = {
      pendente: { variant: "outline" as const, label: "Pendente" },
      processando: { variant: "secondary" as const, label: "Processando" },
      confirmado: { variant: "default" as const, label: "Confirmado" },
      entregue: { variant: "default" as const, label: "Entregue" },
      cancelado: { variant: "destructive" as const, label: "Cancelado" }
    };
    const config = statusMap[status as keyof typeof statusMap] || statusMap.pendente;
    return <Badge variant={config.variant} className="text-xs">{config.label}</Badge>;
  };

  const formatCurrency = (value: string | number) => {
    if (typeof value === 'string') {
      if (value.includes('R$')) return value;
      const num = parseFloat(value);
      return isNaN(num) ? value : `R$ ${num.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
    }
    return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  };

  const formatDate = (dateString: string) => {
    if (dateString && dateString.includes('/')) {
      return dateString;
    }
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return dateString || '-';
      }
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return dateString || '-';
    }
  };

  const selectedSupplier = suppliers.find(s => s.id === fornecedor);

  const menuItems = [
    { id: "dados" as EditSection, label: "Dados do Pedido", icon: Building2 },
    { id: "itens" as EditSection, label: "Itens", icon: Package },
    { id: "observacoes" as EditSection, label: "Observações", icon: FileText },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[96vw] sm:w-[92vw] md:w-[90vw] max-w-6xl max-h-[90vh] sm:max-h-[85vh] overflow-hidden border border-gray-200/60 dark:border-gray-700/30 shadow-xl rounded-xl sm:rounded-2xl p-0 flex flex-col bg-white dark:bg-gray-900 [&>button]:hidden">
        <DialogHeader className="flex-shrink-0 px-4 py-2.5 border-b border-gray-200/60 dark:border-gray-700/40 bg-white dark:bg-gray-900">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white flex-shrink-0">
                {isEditMode ? <Edit3 className="h-4 w-4" /> : <ShoppingCart className="h-4 w-4" />}
              </div>
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <DialogTitle className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white truncate">
                  {isEditMode ? `Editar Pedido #${pedido?.id}` : `Pedido #${pedido?.id}`}
                </DialogTitle>
                {!isEditMode && pedido && (
                  <div className="hidden sm:block">
                    {getStatusBadge(pedido.status)}
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {!isEditMode && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditMode(true)}
                  className="h-8 px-3 text-xs"
                >
                  <Edit3 className="h-3.5 w-3.5 mr-1.5" />
                  Editar
                </Button>
              )}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsEditMode(false);
                  onOpenChange(false);
                }}
                className="h-8 w-8 p-0 flex-shrink-0 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex flex-col flex-1 overflow-hidden">
          {isEditMode ? (
            // Modo de Edição - Layout de duas colunas
            <div className="flex flex-1 overflow-hidden">
              {/* Menu Lateral Esquerdo */}
              <div className="w-56 flex-shrink-0 border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex flex-col shadow-sm">
                <ScrollArea className="flex-1">
                  <div className="p-2 space-y-1">
                    {menuItems.map((item) => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.id}
                          onClick={() => setActiveSection(item.id)}
                          className={cn(
                            "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                            activeSection === item.id
                              ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                              : "text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700 hover:shadow-sm border border-transparent hover:border-gray-200 dark:hover:border-gray-600"
                          )}
                        >
                          <Icon className="h-4 w-4 flex-shrink-0" />
                          <span className="text-left">{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </ScrollArea>
                
                {/* Resumo do Total */}
                <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-inner flex-shrink-0">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">Total do Pedido</p>
                    <p className="text-lg font-bold text-green-600 dark:text-green-400">
                      R$ {calculateTotal().toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{itens.length} item(s)</p>
                  </div>
                </div>
              </div>

              {/* Conteúdo Principal Direito */}
              {activeSection === "itens" ? (
                <div className="flex-1 bg-gray-50 dark:bg-gray-900 min-h-0 flex flex-col">
                  <div className="p-4 pb-3 flex-shrink-0">
                    <div className="max-w-4xl">
                      <div className="bg-white dark:bg-gray-800 rounded-xl p-3 shadow-md border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                            Itens do Pedido
                          </h3>
                          <Button 
                            type="button" 
                            onClick={handleAddItem}
                            className="bg-green-600 dark:bg-green-500 hover:bg-green-700 dark:hover:bg-green-600 text-white shadow-md shadow-green-600/20"
                            size="sm"
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Adicionar Item
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <ScrollArea className="flex-1 min-h-0">
                    <div className="px-4 pb-4">
                      <div className="max-w-4xl space-y-3">
                          {itens.map((item, index) => (
                            <Card key={index} className="p-4 border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-md hover:shadow-lg transition-shadow">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
                              <div className="lg:col-span-2 space-y-2">
                                <Label className="text-xs font-medium text-gray-600 dark:text-gray-400">
                                  Produto *
                                </Label>
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
                              
                              <div className="space-y-2">
                                <Label className="text-xs font-medium text-gray-600 dark:text-gray-400">
                                  Quantidade *
                                </Label>
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
                              
                              <div className="space-y-2">
                                <Label className="text-xs font-medium text-gray-600 dark:text-gray-400">
                                  Unidade *
                                </Label>
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
                              
                              <div className="space-y-2">
                                <Label className="text-xs font-medium text-gray-600 dark:text-gray-400">
                                  Valor Unit. *
                                </Label>
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
                              
                              <div className="flex items-end gap-2">
                                <div className="flex-1 space-y-2">
                                  <Label className="text-xs font-medium text-gray-600 dark:text-gray-400">
                                    Subtotal
                                  </Label>
                                  <div className="px-3 py-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded text-sm font-semibold text-green-700 dark:text-green-400">
                                    R$ {(item.quantidade * item.valorUnitario).toFixed(2)}
                                  </div>
                                </div>
                                {itens.length > 1 && (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleRemoveItem(index)}
                                    className="h-10 w-10 p-0 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/50"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </div>
                  </ScrollArea>
                </div>
              ) : (
                <ScrollArea className="flex-1 bg-gray-50 dark:bg-gray-900 min-h-0">
                  <div className="p-4">
                    {activeSection === "dados" && (
                      <div className="max-w-2xl space-y-4">
                        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md border border-gray-200 dark:border-gray-700">
                          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
                            Dados do Pedido
                          </h3>
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="fornecedor" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                Fornecedor *
                              </Label>
                              <Select value={fornecedor} onValueChange={setFornecedor}>
                                <SelectTrigger className="bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-white border-gray-300 dark:border-gray-600 shadow-sm">
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
                              <Label htmlFor="dataEntrega" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                Data de Entrega *
                              </Label>
                              <Input
                                id="dataEntrega"
                                type="date"
                                value={dataEntrega}
                                onChange={(e) => setDataEntrega(e.target.value)}
                                className="bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-white border-gray-300 dark:border-gray-600 shadow-sm"
                              />
                            </div>

                            <div className="space-y-2 lg:col-span-2">
                              <Label htmlFor="status" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                Status do Pedido
                              </Label>
                              <Select value={status} onValueChange={setStatus}>
                                <SelectTrigger className="bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-white border-gray-300 dark:border-gray-600 shadow-sm">
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
                        </div>
                      </div>
                    )}

                    {activeSection === "observacoes" && (
                    <div className="max-w-2xl space-y-4">
                      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md border border-gray-200 dark:border-gray-700">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
                          Observações Adicionais
                        </h3>
                        <div className="space-y-2">
                          <Textarea
                            id="observacoes"
                            placeholder="Digite observações sobre o pedido, instruções de entrega, etc..."
                            value={observacoes}
                            onChange={(e) => setObservacoes(e.target.value)}
                            rows={6}
                            className="resize-none bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-white border-gray-300 dark:border-gray-600 shadow-sm"
                          />
                          <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
                            {observacoes.length}/500 caracteres
                          </p>
                        </div>
                      </div>
                    </div>
                    )}
                  </div>
                </ScrollArea>
              )}
            </div>
          ) : (
            // Modo de Visualização
            <ScrollArea className="flex-1 bg-gray-50 dark:bg-gray-900 min-h-0">
              <div className="p-4 space-y-4">
                {/* Detalhes Principais */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md border border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
                    Detalhes do Pedido
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <Card className="p-3 bg-gray-50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-2 mb-2">
                        <Building2 className="h-3.5 w-3.5 text-gray-600 dark:text-muted-foreground" />
                        <p className="text-xs font-semibold text-gray-600 dark:text-muted-foreground uppercase tracking-wide">Fornecedor</p>
                      </div>
                      <p className="font-bold text-sm text-gray-900 dark:text-white truncate">
                        {pedido?.fornecedor || selectedSupplier?.name || '-'}
                      </p>
                    </Card>

                    <Card className="p-3 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-2 mb-2">
                        <DollarSign className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                        <p className="text-xs font-semibold text-green-700 dark:text-green-400 uppercase tracking-wide">Total</p>
                      </div>
                      <p className="font-bold text-base text-green-700 dark:text-green-400">
                        {formatCurrency(pedido?.total || pedido?.total_value || 0)}
                      </p>
                    </Card>

                    <Card className="p-3 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                        <p className="text-xs font-semibold text-blue-700 dark:text-blue-400 uppercase tracking-wide">Data Pedido</p>
                      </div>
                      <p className="font-bold text-sm text-blue-700 dark:text-blue-400 truncate">
                        {formatDate(pedido?.dataPedido || pedido?.created_at || '')}
                      </p>
                    </Card>

                    <Card className="p-3 bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-2 mb-2">
                        <Truck className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                        <p className="text-xs font-semibold text-purple-700 dark:text-purple-400 uppercase tracking-wide">Entrega</p>
                      </div>
                      <p className="font-bold text-sm text-purple-700 dark:text-purple-400 truncate">
                        {formatDate(pedido?.dataEntrega || pedido?.delivery_date || '')}
                      </p>
                    </Card>
                  </div>
                </div>

                {/* Status */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md border border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3 pb-2 border-b border-gray-200 dark:border-gray-700">
                    Status
                  </h3>
                  <div>{pedido && getStatusBadge(pedido.status)}</div>
                </div>

                {/* Itens */}
                {pedido?.detalhesItens && pedido.detalhesItens.length > 0 && (
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md border border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3 pb-2 border-b border-gray-200 dark:border-gray-700">
                      Itens do Pedido ({pedido.detalhesItens.length})
                    </h3>
                    <div className="border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm overflow-hidden bg-white dark:bg-gray-800">
                      <div 
                        className="overflow-y-auto overflow-x-auto w-full"
                        style={{ 
                          maxHeight: '400px',
                          minHeight: '200px'
                        }}
                        onWheel={(e) => {
                          const target = e.currentTarget as HTMLElement;
                          const canScroll = target.scrollHeight > target.clientHeight;
                          const isScrollingDown = e.deltaY > 0;
                          const isScrollingUp = e.deltaY < 0;
                          const isAtTop = Math.abs(target.scrollTop) < 1;
                          const isAtBottom = Math.abs(target.scrollTop + target.clientHeight - target.scrollHeight) < 1;
                          
                          if (canScroll) {
                            if ((isScrollingDown && !isAtBottom) || (isScrollingUp && !isAtTop)) {
                              e.stopPropagation();
                              e.preventDefault();
                              target.scrollTop += e.deltaY;
                            }
                          }
                        }}
                      >
                        <table className="w-full text-sm border-collapse">
                          <thead className="bg-gray-100 dark:bg-gray-700/50 border-b-2 border-gray-200 dark:border-gray-600 sticky top-0 z-10">
                            <tr>
                              <th className="p-3 text-left font-bold text-gray-700 dark:text-gray-300 whitespace-nowrap">Produto</th>
                              <th className="p-3 text-right font-bold text-gray-700 dark:text-gray-300 whitespace-nowrap">Qtd</th>
                              <th className="p-3 text-right font-bold text-gray-700 dark:text-gray-300 whitespace-nowrap">Unit.</th>
                              <th className="p-3 text-right font-bold text-gray-700 dark:text-gray-300 whitespace-nowrap">Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {pedido.detalhesItens.map((item: any, index: number) => (
                              <tr key={index} className="border-b border-gray-200 dark:border-gray-700 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                                <td className="p-3 font-semibold text-gray-900 dark:text-white">
                                  {item.produto || item.product_name}
                                </td>
                                <td className="p-3 text-right font-medium text-gray-700 dark:text-gray-300">
                                  {formatDecimalDisplay(Number(item.quantidade || item.quantity))}
                                </td>
                                <td className="p-3 text-right font-medium text-gray-700 dark:text-gray-300">
                                  R$ {Number(item.valorUnitario || item.unit_price).toFixed(2)}
                                </td>
                                <td className="p-3 text-right font-bold text-green-700 dark:text-green-400">
                                  R$ {(Number(item.quantidade || item.quantity) * Number(item.valorUnitario || item.unit_price)).toFixed(2)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {/* Observações */}
                {(pedido?.observacoes || pedido?.observations) && (
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md border border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3 pb-2 border-b border-gray-200 dark:border-gray-700">
                      Observações
                    </h3>
                    <Card className="p-3 bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600">
                      <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">
                        {pedido.observacoes || pedido.observations}
                      </p>
                    </Card>
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
        </div>

        <DialogFooter className="flex-shrink-0 px-4 py-2.5 border-t border-gray-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-800">
          <div className="flex items-center justify-between w-full gap-2">
            <div className="flex gap-2">
              {isEditMode && (
                <Button 
                  variant="outline" 
                  onClick={() => setIsEditMode(false)} 
                  disabled={loading}
                  className="dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
                >
                  Cancelar
                </Button>
              )}
              {!isEditMode && (
                <Button 
                  variant="outline" 
                  onClick={() => onOpenChange(false)} 
                  className="dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
                >
                  Fechar
                </Button>
              )}
            </div>
            
            {isEditMode && (
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
                    Salvar Alterações
                  </>
                )}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
