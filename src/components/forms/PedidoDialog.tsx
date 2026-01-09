import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerFooter } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Plus, Trash2, Loader2, Building2, Calendar, Package, FileText, 
  Save, ShoppingCart, Truck, X, Search, CheckCircle, ClipboardList
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

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

export default function PedidoDialog({ open, onOpenChange, pedido, onEdit }: PedidoDialogProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const isMobile = useIsMobile();
  
  const [activeTab, setActiveTab] = useState("itens");
  
  // Form states
  const [fornecedor, setFornecedor] = useState("");
  const [dataEntrega, setDataEntrega] = useState("");
  const [status, setStatus] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [itens, setItens] = useState<PedidoItem[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Data states
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [productSearch, setProductSearch] = useState("");
  const [activeSearchIndex, setActiveSearchIndex] = useState<number | null>(null);
  const debouncedProductSearch = useDebounce(productSearch, 300);

  // Refs para navegação por teclado
  const productInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const quantityInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const priceInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const addButtonRef = useRef<HTMLButtonElement>(null);

  const tabs = ["itens", "detalhes", "resumo"];

  const statusOptions = [
    { value: "pendente", label: "Pendente", color: "bg-amber-100 text-amber-700 border-amber-200" },
    { value: "processando", label: "Processando", color: "bg-blue-100 text-blue-700 border-blue-200" },
    { value: "confirmado", label: "Confirmado", color: "bg-indigo-100 text-indigo-700 border-indigo-200" },
    { value: "entregue", label: "Entregue", color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
    { value: "cancelado", label: "Cancelado", color: "bg-red-100 text-red-700 border-red-200" }
  ];

  useEffect(() => {
    if (open) {
      loadSuppliers();
      loadProducts();
      setActiveTab("itens");
      
      // Auto-foco no primeiro campo ou botão adicionar
      setTimeout(() => {
        if (itens.length > 0) {
          productInputRefs.current[0]?.focus();
        } else {
          addButtonRef.current?.focus();
        }
      }, 300);
    }
    if (pedido && open) {
      setFornecedor(pedido.supplier_id || "");
      setDataEntrega(pedido.delivery_date || "");
      setStatus(pedido.status || "pendente");
      setObservacoes(pedido.observations || pedido.observacoes || "");
      
      if (pedido.detalhesItens?.length > 0) {
        setItens(pedido.detalhesItens.map((item: any) => ({
          produto: item.product_name || item.produto || "",
          quantidade: parseFloat(item.quantity || item.quantidade || 1),
          valorUnitario: parseFloat(item.unit_price || item.valorUnitario || 0),
          unidade: item.unit || item.unidade || "un"
        })));
      } else {
        setItens([]);
      }
    }
  }, [pedido, open]);

  const loadSuppliers = async () => {
    const { data } = await supabase.from('suppliers').select('id, name').order('name');
    setSuppliers(data || []);
  };

  const loadProducts = async () => {
    try {
      const { count } = await supabase.from('products').select('*', { count: 'exact', head: true });
      if (!count) { setProducts([]); return; }
      
      const allProducts: any[] = [];
      for (let page = 0; page < Math.ceil(count / 1000); page++) {
        const { data } = await supabase.from('products').select('id, name').order('name').range(page * 1000, (page + 1) * 1000 - 1);
        if (data) allProducts.push(...data);
      }
      setProducts(allProducts);
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  const filteredProducts = useMemo(() => {
    if (!debouncedProductSearch || debouncedProductSearch.length < 2) return [];
    return products.filter(p => p.name.toLowerCase().includes(debouncedProductSearch.toLowerCase())).slice(0, 30);
  }, [products, debouncedProductSearch]);

  const handleAddItem = () => {
    const newIndex = itens.length;
    setItens([...itens, { produto: "", quantidade: 1, valorUnitario: 0, unidade: "un" }]);
    
    // Auto-foco no campo de produto do novo item
    setTimeout(() => {
      productInputRefs.current[newIndex]?.focus();
    }, 50);
  };
  
  const handleRemoveItem = (index: number) => {
    setItens(itens.filter((_, i) => i !== index));
    // Focar no item anterior ou no botão adicionar
    setTimeout(() => {
      if (index > 0) {
        productInputRefs.current[index - 1]?.focus();
      } else if (itens.length > 1) {
        productInputRefs.current[0]?.focus();
      } else {
        addButtonRef.current?.focus();
      }
    }, 50);
  };

  // Handler para navegação por teclado nos campos de item
  const handleItemKeyDown = useCallback((e: React.KeyboardEvent, index: number, field: 'produto' | 'quantidade' | 'preco') => {
    if (e.key === 'Enter') {
      e.preventDefault();
      
      if (field === 'produto') {
        // Se tem sugestões abertas, não faz nada (deixa o autocomplete funcionar)
        if (activeSearchIndex === index && filteredProducts.length > 0) return;
        // Vai para quantidade
        quantityInputRefs.current[index]?.focus();
        quantityInputRefs.current[index]?.select();
      } else if (field === 'quantidade') {
        // Vai para preço
        priceInputRefs.current[index]?.focus();
        priceInputRefs.current[index]?.select();
      } else if (field === 'preco') {
        // Se é o último item e está preenchido, adiciona novo
        const item = itens[index];
        if (item.produto && item.quantidade > 0) {
          if (index === itens.length - 1) {
            handleAddItem();
          } else {
            // Vai para o próximo item
            productInputRefs.current[index + 1]?.focus();
          }
        }
      }
    } else if (e.key === 'Tab' && !e.shiftKey && field === 'preco' && index === itens.length - 1) {
      // Tab no último campo do último item -> adiciona novo item
      const item = itens[index];
      if (item.produto && item.quantidade > 0) {
        e.preventDefault();
        handleAddItem();
      }
    }
  }, [itens, activeSearchIndex, filteredProducts.length]);
  
  const handleItemChange = (index: number, field: keyof PedidoItem, value: any) => {
    const newItens = [...itens];
    newItens[index] = { ...newItens[index], [field]: value };
    setItens(newItens);
  };
  
  const calculateTotal = () => itens.reduce((acc, item) => acc + (item.quantidade * item.valorUnitario), 0);

  const handleSubmit = async () => {
    if (!user || !fornecedor || !dataEntrega) {
      toast({ title: "Erro", description: "Preencha fornecedor e data de entrega", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const total = calculateTotal();
      const selectedSupplier = suppliers.find(s => s.id === fornecedor);

      await supabase.from('orders').update({
        supplier_id: fornecedor,
        supplier_name: selectedSupplier?.name || '',
        total_value: total,
        status,
        delivery_date: dataEntrega,
        observations: observacoes,
      }).eq('id', pedido.id);

      await supabase.from('order_items').delete().eq('order_id', pedido.id);

      const orderItems = itens.filter(item => item.produto).map(item => {
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

      if (orderItems.length > 0) {
        await supabase.from('order_items').insert(orderItems);
      }

      toast({ title: "Pedido atualizado com sucesso!" });
      if (onEdit) onEdit();
      onOpenChange(false);
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // Handler para atalhos globais do modal
  const handleModalKeyDown = useCallback((e: React.KeyboardEvent) => {
    // Ctrl+Enter para salvar
    if (e.ctrlKey && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
    
    // Alt+Setas para navegar entre abas
    if (e.altKey && e.key === 'ArrowRight') {
      e.preventDefault();
      const currentIndex = tabs.indexOf(activeTab);
      if (currentIndex < tabs.length - 1) {
        setActiveTab(tabs[currentIndex + 1]);
      }
    }
    if (e.altKey && e.key === 'ArrowLeft') {
      e.preventDefault();
      const currentIndex = tabs.indexOf(activeTab);
      if (currentIndex > 0) {
        setActiveTab(tabs[currentIndex - 1]);
      }
    }
    
    // Alt+N para adicionar novo item (quando na aba itens)
    if (e.altKey && e.key === 'n' && activeTab === 'itens') {
      e.preventDefault();
      handleAddItem();
    }
    
    // Números 1-3 com Alt para ir direto para a aba
    if (e.altKey && ['1', '2', '3'].includes(e.key)) {
      e.preventDefault();
      const tabIndex = parseInt(e.key) - 1;
      if (tabs[tabIndex]) {
        setActiveTab(tabs[tabIndex]);
      }
    }
  }, [activeTab]);

  const getStatusBadge = (statusValue: string) => {
    const config = statusOptions.find(s => s.value === statusValue) || statusOptions[0];
    return <Badge variant="outline" className={cn("font-medium text-xs", config.color)}>{config.label}</Badge>;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    if (dateString.includes('/')) return dateString;
    try { return new Date(dateString).toLocaleDateString('pt-BR'); } catch { return dateString; }
  };

  const selectedSupplier = suppliers.find(s => s.id === fornecedor);


  // Header content shared between Dialog and Drawer
  const headerContent = (
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
        <ShoppingCart className="h-4 w-4 text-orange-600 dark:text-orange-400" />
      </div>
      <div>
        <span className="text-base font-semibold text-gray-900 dark:text-white block">
          Gerenciar Pedido
        </span>
        <span className="text-xs text-gray-500 flex items-center gap-2">
          #{pedido?.id?.substring(0, 8)} • {getStatusBadge(status || pedido?.status || 'pendente')}
        </span>
      </div>
    </div>
  );

  // Footer content shared between Dialog and Drawer
  const footerContent = (
    <div className="flex items-center justify-between w-full">
      <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} disabled={loading} className="touch-target">
        Fechar
      </Button>
      <Button onClick={handleSubmit} size="sm" disabled={loading} className="bg-orange-600 hover:bg-orange-700 text-white touch-target">
        {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
        Salvar Alterações
      </Button>
    </div>
  );

  // Mobile: Render as Drawer (bottom sheet) - Requirements: 5.5
  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[85vh] overflow-hidden flex flex-col">
          <DrawerHeader className="text-left border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-4 py-3">
            {headerContent}
          </DrawerHeader>
          
          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="flex-shrink-0 mx-4 mt-3 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg grid grid-cols-3">
              <TabsTrigger value="itens" className="text-xs data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 touch-target">
                <Package className="h-3.5 w-3.5 mr-1.5" />Itens
              </TabsTrigger>
              <TabsTrigger value="detalhes" className="text-xs data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 touch-target">
                <FileText className="h-3.5 w-3.5 mr-1.5" />Detalhes
              </TabsTrigger>
              <TabsTrigger value="resumo" className="text-xs data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 touch-target">
                <ClipboardList className="h-3.5 w-3.5 mr-1.5" />Resumo
              </TabsTrigger>
            </TabsList>

            {/* Tab: Itens (Edição) */}
            <TabsContent value="itens" className="flex-1 overflow-auto m-0 p-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Produtos do Pedido</span>
                  <Button ref={addButtonRef} onClick={handleAddItem} size="sm" className="h-10 bg-orange-600 hover:bg-orange-700 text-white touch-target">
                    <Plus className="h-3.5 w-3.5 mr-1.5" />Adicionar
                  </Button>
                </div>
                
                <ScrollArea className="h-[200px] pr-2">
                  <div className="space-y-2">
                    {itens.length === 0 ? (
                      <div className="text-center py-8 text-gray-400 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
                        <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Nenhum item</p>
                        <p className="text-xs">Clique em "Adicionar" para incluir produtos</p>
                      </div>
                    ) : itens.map((item, index) => (
                      <div key={index} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                        <div className="space-y-3">
                          {/* Produto */}
                          <div className="relative">
                            <Label className="text-[10px] text-gray-500 mb-1 block">Produto</Label>
                            <div className="relative">
                              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                              <Input
                                placeholder="Buscar produto..."
                                value={item.produto}
                                onChange={e => { 
                                  handleItemChange(index, 'produto', e.target.value); 
                                  setProductSearch(e.target.value);
                                  setActiveSearchIndex(index);
                                }}
                                onFocus={() => setActiveSearchIndex(index)}
                                className="h-10 text-sm pl-7"
                              />
                            </div>
                            {activeSearchIndex === index && productSearch && filteredProducts.length > 0 && (
                              <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-32 overflow-auto">
                                {filteredProducts.map(p => (
                                  <button 
                                    key={p.id} 
                                    onClick={() => { 
                                      handleItemChange(index, 'produto', p.name); 
                                      setProductSearch(''); 
                                      setActiveSearchIndex(null);
                                    }}
                                    className="w-full px-2 py-2 text-left text-sm hover:bg-orange-50 dark:hover:bg-gray-700 flex items-center gap-2 min-h-[44px]"
                                  >
                                    <Package className="h-3 w-3 text-orange-500" />{p.name}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                          {/* Quantidade, Unidade, Preço */}
                          <div className="grid grid-cols-3 gap-2">
                            <div>
                              <Label className="text-[10px] text-gray-500 mb-1 block">Qtd</Label>
                              <Input 
                                type="number" 
                                value={item.quantidade} 
                                onChange={e => handleItemChange(index, 'quantidade', parseFloat(e.target.value) || 0)} 
                                className="h-10 text-sm" 
                              />
                            </div>
                            <div>
                              <Label className="text-[10px] text-gray-500 mb-1 block">Un</Label>
                              <Select value={item.unidade} onValueChange={v => handleItemChange(index, 'unidade', v)}>
                                <SelectTrigger className="h-10 text-sm"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="un">un</SelectItem>
                                  <SelectItem value="kg">kg</SelectItem>
                                  <SelectItem value="cx">cx</SelectItem>
                                  <SelectItem value="pc">pc</SelectItem>
                                  <SelectItem value="L">L</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label className="text-[10px] text-gray-500 mb-1 block">Preço</Label>
                              <Input 
                                type="number" 
                                step="0.01"
                                value={item.valorUnitario} 
                                onChange={e => handleItemChange(index, 'valorUnitario', parseFloat(e.target.value) || 0)} 
                                className="h-10 text-sm" 
                              />
                            </div>
                          </div>
                          {/* Subtotal e Remover */}
                          <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
                            <span className="text-xs font-semibold text-emerald-600">
                              Subtotal: R$ {(item.quantidade * item.valorUnitario).toFixed(2)}
                            </span>
                            <Button variant="ghost" size="icon" onClick={() => handleRemoveItem(index)} className="h-10 w-10 text-red-500 hover:text-red-700 hover:bg-red-50 touch-target">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>

                {/* Total */}
                <div className="flex items-center justify-between p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
                  <span className="font-medium text-emerald-700 dark:text-emerald-400">Total do Pedido</span>
                  <span className="text-lg font-bold text-emerald-700 dark:text-emerald-400">R$ {calculateTotal().toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </TabsContent>

            {/* Tab: Detalhes (Edição) */}
            <TabsContent value="detalhes" className="flex-1 overflow-auto m-0 p-4">
              <div className="space-y-4">
                <div>
                  <Label className="text-xs font-medium text-gray-600 dark:text-gray-400">Fornecedor</Label>
                  <Select value={fornecedor} onValueChange={setFornecedor}>
                    <SelectTrigger className="h-10 text-sm mt-1"><SelectValue placeholder="Selecione o fornecedor" /></SelectTrigger>
                    <SelectContent>
                      {suppliers.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs font-medium text-gray-600 dark:text-gray-400">Data de Entrega</Label>
                  <Input type="date" value={dataEntrega} onChange={e => setDataEntrega(e.target.value)} className="h-10 text-sm mt-1" />
                </div>
                
                <div>
                  <Label className="text-xs font-medium text-gray-600 dark:text-gray-400">Status do Pedido</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {statusOptions.map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => setStatus(opt.value)}
                        className={cn(
                          "px-3 py-3 rounded-lg text-xs font-medium border-2 transition-all min-h-[44px]",
                          status === opt.value 
                            ? `${opt.color} border-current ring-2 ring-offset-1` 
                            : "bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-gray-300"
                        )}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-xs font-medium text-gray-600 dark:text-gray-400">Observações</Label>
                  <Textarea
                    placeholder="Adicione observações sobre o pedido..."
                    value={observacoes}
                    onChange={e => setObservacoes(e.target.value)}
                    className="min-h-[100px] resize-none mt-1 text-sm"
                  />
                </div>
              </div>
            </TabsContent>

            {/* Tab: Resumo (Visualização) */}
            <TabsContent value="resumo" className="flex-1 overflow-auto m-0 p-4">
              <div className="space-y-4">
                {/* Cards de resumo */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-3 border border-orange-200/50">
                    <div className="flex items-center gap-1.5 text-orange-600 mb-1">
                      <Building2 className="h-3.5 w-3.5" />
                      <span className="text-[10px] font-medium uppercase">Fornecedor</span>
                    </div>
                    <p className="font-semibold text-sm truncate">{selectedSupplier?.name || pedido?.fornecedor || '-'}</p>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-200/50">
                    <div className="flex items-center gap-1.5 text-blue-600 mb-1">
                      <Calendar className="h-3.5 w-3.5" />
                      <span className="text-[10px] font-medium uppercase">Entrega</span>
                    </div>
                    <p className="font-semibold text-sm">{formatDate(dataEntrega || pedido?.dataEntrega)}</p>
                  </div>
                  <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3 border border-purple-200/50">
                    <div className="flex items-center gap-1.5 text-purple-600 mb-1">
                      <Package className="h-3.5 w-3.5" />
                      <span className="text-[10px] font-medium uppercase">Itens</span>
                    </div>
                    <p className="font-semibold text-sm">{itens.length} produto(s)</p>
                  </div>
                  <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-3 border border-emerald-200/50">
                    <div className="flex items-center gap-1.5 text-emerald-600 mb-1">
                      <Truck className="h-3.5 w-3.5" />
                      <span className="text-[10px] font-medium uppercase">Total</span>
                    </div>
                    <p className="font-bold text-sm text-emerald-700">R$ {calculateTotal().toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  </div>
                </div>

                {/* Status atual */}
                <div className="flex items-center justify-center gap-2 py-2">
                  <CheckCircle className="h-4 w-4 text-gray-400" />
                  <span className="text-xs text-gray-500">Status atual:</span>
                  {getStatusBadge(status || pedido?.status || 'pendente')}
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <DrawerFooter className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-4 py-3">
            {footerContent}
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  }

  // Desktop: Render as Dialog (centered modal)
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="w-[95vw] max-w-[750px] h-[85vh] max-h-[600px] overflow-hidden p-0 gap-0 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-2xl rounded-xl"
        onKeyDown={handleModalKeyDown}
      >
        {/* Header compacto */}
        <div className="flex-shrink-0 px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <div className="flex items-center justify-between">
            {headerContent}
            <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)} className="h-8 w-8">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="flex-shrink-0 mx-4 mt-3 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg grid grid-cols-3">
            <TabsTrigger value="itens" className="text-xs data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700">
              <Package className="h-3.5 w-3.5 mr-1.5" />Itens
            </TabsTrigger>
            <TabsTrigger value="detalhes" className="text-xs data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700">
              <FileText className="h-3.5 w-3.5 mr-1.5" />Detalhes
            </TabsTrigger>
            <TabsTrigger value="resumo" className="text-xs data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700">
              <ClipboardList className="h-3.5 w-3.5 mr-1.5" />Resumo
            </TabsTrigger>
          </TabsList>

          {/* Tab: Itens (Edição) */}
          <TabsContent value="itens" className="flex-1 overflow-auto m-0 p-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Produtos do Pedido</span>
                <Button ref={addButtonRef} onClick={handleAddItem} size="sm" className="h-8 bg-orange-600 hover:bg-orange-700 text-white">
                  <Plus className="h-3.5 w-3.5 mr-1.5" />Adicionar (Alt+N)
                </Button>
              </div>
              
              <ScrollArea className="h-[280px] pr-2">
                <div className="space-y-2">
                  {itens.length === 0 ? (
                    <div className="text-center py-8 text-gray-400 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
                      <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Nenhum item</p>
                      <p className="text-xs">Clique em "Adicionar" para incluir produtos</p>
                    </div>
                  ) : itens.map((item, index) => (
                    <div key={index} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                      <div className="grid grid-cols-12 gap-2 items-end">
                        {/* Produto */}
                        <div className="col-span-12 sm:col-span-5 relative">
                          <Label className="text-[10px] text-gray-500 mb-1 block">Produto</Label>
                          <div className="relative">
                            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                            <Input
                              ref={el => productInputRefs.current[index] = el}
                              placeholder="Buscar produto..."
                              value={item.produto}
                              onChange={e => { 
                                handleItemChange(index, 'produto', e.target.value); 
                                setProductSearch(e.target.value);
                                setActiveSearchIndex(index);
                              }}
                              onFocus={() => setActiveSearchIndex(index)}
                              onKeyDown={e => handleItemKeyDown(e, index, 'produto')}
                              className="h-8 text-xs pl-7"
                              tabIndex={0}
                            />
                          </div>
                          {activeSearchIndex === index && productSearch && filteredProducts.length > 0 && (
                            <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-32 overflow-auto">
                              {filteredProducts.map((p, pIndex) => (
                                <button 
                                  key={p.id} 
                                  onClick={() => { 
                                    handleItemChange(index, 'produto', p.name); 
                                    setProductSearch(''); 
                                    setActiveSearchIndex(null);
                                    // Auto-foco no campo de quantidade
                                    setTimeout(() => {
                                      quantityInputRefs.current[index]?.focus();
                                      quantityInputRefs.current[index]?.select();
                                    }, 50);
                                  }}
                                  onKeyDown={e => {
                                    if (e.key === 'Enter') {
                                      handleItemChange(index, 'produto', p.name); 
                                      setProductSearch(''); 
                                      setActiveSearchIndex(null);
                                      setTimeout(() => {
                                        quantityInputRefs.current[index]?.focus();
                                      }, 50);
                                    }
                                  }}
                                  className="w-full px-2 py-1.5 text-left text-xs hover:bg-orange-50 dark:hover:bg-gray-700 flex items-center gap-2"
                                >
                                  <Package className="h-3 w-3 text-orange-500" />{p.name}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                        {/* Quantidade */}
                        <div className="col-span-4 sm:col-span-2">
                          <Label className="text-[10px] text-gray-500 mb-1 block">Qtd</Label>
                          <Input 
                            ref={el => quantityInputRefs.current[index] = el}
                            type="number" 
                            value={item.quantidade} 
                            onChange={e => handleItemChange(index, 'quantidade', parseFloat(e.target.value) || 0)} 
                            onKeyDown={e => handleItemKeyDown(e, index, 'quantidade')}
                            className="h-8 text-xs" 
                            tabIndex={0}
                          />
                        </div>
                        {/* Unidade */}
                        <div className="col-span-4 sm:col-span-2">
                          <Label className="text-[10px] text-gray-500 mb-1 block">Un</Label>
                          <Select value={item.unidade} onValueChange={v => handleItemChange(index, 'unidade', v)}>
                            <SelectTrigger className="h-8 text-xs" tabIndex={0}><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="un">un</SelectItem>
                              <SelectItem value="kg">kg</SelectItem>
                              <SelectItem value="cx">cx</SelectItem>
                              <SelectItem value="pc">pc</SelectItem>
                              <SelectItem value="L">L</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        {/* Preço */}
                        <div className="col-span-4 sm:col-span-2">
                          <Label className="text-[10px] text-gray-500 mb-1 block">Preço</Label>
                          <Input 
                            ref={el => priceInputRefs.current[index] = el}
                            type="number" 
                            step="0.01"
                            value={item.valorUnitario} 
                            onChange={e => handleItemChange(index, 'valorUnitario', parseFloat(e.target.value) || 0)} 
                            onKeyDown={e => handleItemKeyDown(e, index, 'preco')}
                            className="h-8 text-xs" 
                            tabIndex={0}
                          />
                        </div>
                        {/* Ações */}
                        <div className="col-span-12 sm:col-span-1 flex items-center justify-between sm:justify-end gap-2">
                          <span className="text-xs font-semibold text-emerald-600 sm:hidden">
                            R$ {(item.quantidade * item.valorUnitario).toFixed(2)}
                          </span>
                          <Button variant="ghost" size="icon" onClick={() => handleRemoveItem(index)} className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50">
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                      {/* Subtotal desktop */}
                      <div className="hidden sm:flex justify-end mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                        <span className="text-xs text-gray-500">Subtotal: </span>
                        <span className="text-xs font-semibold text-emerald-600 ml-1">R$ {(item.quantidade * item.valorUnitario).toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              {/* Total */}
              <div className="flex items-center justify-between p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
                <span className="font-medium text-emerald-700 dark:text-emerald-400">Total do Pedido</span>
                <span className="text-lg font-bold text-emerald-700 dark:text-emerald-400">R$ {calculateTotal().toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </TabsContent>

          {/* Tab: Detalhes (Edição) */}
          <TabsContent value="detalhes" className="flex-1 overflow-auto m-0 p-4">
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs font-medium text-gray-600 dark:text-gray-400">Fornecedor</Label>
                  <Select value={fornecedor} onValueChange={setFornecedor}>
                    <SelectTrigger className="h-9 text-sm mt-1"><SelectValue placeholder="Selecione o fornecedor" /></SelectTrigger>
                    <SelectContent>
                      {suppliers.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs font-medium text-gray-600 dark:text-gray-400">Data de Entrega</Label>
                  <Input type="date" value={dataEntrega} onChange={e => setDataEntrega(e.target.value)} className="h-9 text-sm mt-1" />
                </div>
              </div>
              
              <div>
                <Label className="text-xs font-medium text-gray-600 dark:text-gray-400">Status do Pedido</Label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mt-2">
                  {statusOptions.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setStatus(opt.value)}
                      className={cn(
                        "px-3 py-2 rounded-lg text-xs font-medium border-2 transition-all",
                        status === opt.value 
                          ? `${opt.color} border-current ring-2 ring-offset-1` 
                          : "bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-gray-300"
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-xs font-medium text-gray-600 dark:text-gray-400">Observações</Label>
                <Textarea
                  placeholder="Adicione observações sobre o pedido..."
                  value={observacoes}
                  onChange={e => setObservacoes(e.target.value)}
                  className="min-h-[120px] resize-none mt-1 text-sm"
                />
              </div>
            </div>
          </TabsContent>

          {/* Tab: Resumo (Visualização) */}
          <TabsContent value="resumo" className="flex-1 overflow-auto m-0 p-4">
            <div className="space-y-4">
              {/* Cards de resumo */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-3 border border-orange-200/50">
                  <div className="flex items-center gap-1.5 text-orange-600 mb-1">
                    <Building2 className="h-3.5 w-3.5" />
                    <span className="text-[10px] font-medium uppercase">Fornecedor</span>
                  </div>
                  <p className="font-semibold text-sm truncate">{selectedSupplier?.name || pedido?.fornecedor || '-'}</p>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-200/50">
                  <div className="flex items-center gap-1.5 text-blue-600 mb-1">
                    <Calendar className="h-3.5 w-3.5" />
                    <span className="text-[10px] font-medium uppercase">Entrega</span>
                  </div>
                  <p className="font-semibold text-sm">{formatDate(dataEntrega || pedido?.dataEntrega)}</p>
                </div>
                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3 border border-purple-200/50">
                  <div className="flex items-center gap-1.5 text-purple-600 mb-1">
                    <Package className="h-3.5 w-3.5" />
                    <span className="text-[10px] font-medium uppercase">Itens</span>
                  </div>
                  <p className="font-semibold text-sm">{itens.length} produto(s)</p>
                </div>
                <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-3 border border-emerald-200/50">
                  <div className="flex items-center gap-1.5 text-emerald-600 mb-1">
                    <Truck className="h-3.5 w-3.5" />
                    <span className="text-[10px] font-medium uppercase">Total</span>
                  </div>
                  <p className="font-bold text-sm text-emerald-700">R$ {calculateTotal().toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                </div>
              </div>

              {/* Lista de itens resumida */}
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 rounded-t-lg">
                  <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Itens do Pedido</span>
                </div>
                <div className="max-h-[140px] overflow-auto">
                  {itens.length === 0 ? (
                    <p className="text-xs text-gray-400 text-center py-4">Nenhum item</p>
                  ) : itens.map((item, index) => (
                    <div key={index} className="flex items-center justify-between px-3 py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <Package className="h-3.5 w-3.5 text-orange-500 flex-shrink-0" />
                        <span className="text-xs truncate">{item.produto || 'Produto não definido'}</span>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <span className="text-xs text-gray-500">{item.quantidade} {item.unidade}</span>
                        <span className="text-xs font-semibold text-emerald-600">R$ {(item.quantidade * item.valorUnitario).toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Observações */}
              {observacoes && (
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-1.5 text-gray-600 mb-2">
                    <FileText className="h-3.5 w-3.5" />
                    <span className="text-xs font-semibold">Observações</span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 whitespace-pre-wrap">{observacoes}</p>
                </div>
              )}

              {/* Status atual */}
              <div className="flex items-center justify-center gap-2 py-2">
                <CheckCircle className="h-4 w-4 text-gray-400" />
                <span className="text-xs text-gray-500">Status atual:</span>
                {getStatusBadge(status || pedido?.status || 'pendente')}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <div className="flex-shrink-0 px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} disabled={loading}>
                Fechar
              </Button>
              <div className="hidden sm:flex items-center gap-2 text-xs text-gray-400">
                <span><kbd className="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-[10px]">Alt+←→</kbd> Abas</span>
                <span><kbd className="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-[10px]">Alt+N</kbd> Novo item</span>
                <span><kbd className="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-[10px]">Ctrl+Enter</kbd> Salvar</span>
              </div>
            </div>
            <Button onClick={handleSubmit} size="sm" disabled={loading} className="bg-orange-600 hover:bg-orange-700 text-white">
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              Salvar (Ctrl+Enter)
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
