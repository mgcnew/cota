import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerFooter, DrawerTitle } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Plus, Trash2, Loader2, Building2, Calendar, Package, FileText, 
  Save, ShoppingCart, Truck, X, Search, CheckCircle, ClipboardList, Download,
  DollarSign
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { OrderExportTab } from "@/components/pedidos/OrderExportTab";

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
    <div className="flex items-center gap-4">
      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white shadow-lg shadow-orange-500/20 ring-1 ring-white/20">
        <ShoppingCart className="h-6 w-6" />
      </div>
      <div className="flex flex-col">
        <DialogTitle className="text-xl font-bold text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
          Gerenciar Pedido
        </DialogTitle>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-[0.15em] bg-white/50 dark:bg-black/20 px-2 py-0.5 rounded-md border border-white/20">
            #{pedido?.id?.substring(0, 8)}
          </span>
          <div className="h-1 w-1 rounded-full bg-gray-300 dark:bg-gray-700"></div>
          {getStatusBadge(status || pedido?.status || 'pendente')}
        </div>
      </div>
    </div>
  );

  // Footer content shared between Dialog and Drawer
  const footerContent = (
    <div className="flex items-center justify-between w-full">
      <Button 
        variant="outline" 
        size="sm" 
        onClick={() => onOpenChange(false)} 
        disabled={loading} 
        className="h-11 px-6 border-white/20 dark:border-white/10 bg-white/5 dark:bg-white/5 font-bold text-xs uppercase tracking-[0.15em] hover:bg-white/10 transition-all rounded-xl backdrop-blur-md"
      >
        Fechar
      </Button>
      <Button 
        onClick={handleSubmit} 
        size="sm" 
        disabled={loading} 
        className="h-11 px-8 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white font-bold text-xs uppercase tracking-[0.15em] shadow-lg shadow-orange-500/20 transition-all active:scale-[0.98] rounded-xl ring-1 ring-white/20"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin mr-3" /> : <Save className="h-4 w-4 mr-3" />}
        Salvar Alterações
      </Button>
    </div>
  );

  // Mobile: Render as Drawer (bottom sheet) - Requirements: 5.5
  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[90vh] overflow-hidden flex flex-col !bg-white/70 dark:!bg-gray-950/70 backdrop-blur-2xl border-t border-white/20 rounded-t-[2.5rem] shadow-2xl animate-in slide-in-from-bottom duration-300">
          <DrawerHeader className="text-left border-b border-white/10 dark:border-white/5 bg-white/30 dark:bg-white/5 px-6 py-5 backdrop-blur-md relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 to-transparent pointer-events-none"></div>
            <div className="relative z-10">
              {headerContent}
            </div>
          </DrawerHeader>
          
          {/* Tabs com design refinado para mobile */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
            <div className="px-4 pt-4">
              <TabsList className="flex-shrink-0 bg-white/40 dark:bg-gray-950/40 backdrop-blur-xl p-1 rounded-2xl border border-white/20 dark:border-white/10 grid grid-cols-4 gap-1 shadow-inner h-12">
                <TabsTrigger value="itens" className="text-[9px] uppercase tracking-wider font-black text-gray-500 dark:text-gray-400 data-[state=active]:bg-white/90 dark:data-[state=active]:bg-gray-800/90 data-[state=active]:text-orange-600 dark:data-[state=active]:text-orange-300 touch-target rounded-xl transition-all">
                  <Package className="h-3.5 w-3.5 mr-1" />Itens
                </TabsTrigger>
                <TabsTrigger value="detalhes" className="text-[9px] uppercase tracking-wider font-black text-gray-500 dark:text-gray-400 data-[state=active]:bg-white/90 dark:data-[state=active]:bg-gray-800/90 data-[state=active]:text-orange-600 dark:data-[state=active]:text-orange-300 touch-target rounded-xl transition-all">
                  <FileText className="h-3.5 w-3.5 mr-1" />Info
                </TabsTrigger>
                <TabsTrigger value="resumo" className="text-[9px] uppercase tracking-wider font-black text-gray-500 dark:text-gray-400 data-[state=active]:bg-white/90 dark:data-[state=active]:bg-gray-800/90 data-[state=active]:text-orange-600 dark:data-[state=active]:text-orange-300 touch-target rounded-xl transition-all">
                  <ClipboardList className="h-3.5 w-3.5 mr-1" />Resumo
                </TabsTrigger>
                <TabsTrigger value="exportar" className="text-[9px] uppercase tracking-wider font-black text-gray-500 dark:text-gray-400 data-[state=active]:bg-white/90 dark:data-[state=active]:bg-gray-800/90 data-[state=active]:text-orange-600 dark:data-[state=active]:text-orange-300 touch-target rounded-xl transition-all">
                  <Download className="h-3.5 w-3.5 mr-1" />Export
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Tab: Itens (Edição) */}
            <TabsContent value="itens" className="flex-1 overflow-auto m-0 p-4 custom-scrollbar">
              <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em]">Itens do Pedido</span>
                    <p className="text-[9px] text-gray-400 font-bold uppercase mt-0.5 opacity-60">Toque para editar</p>
                  </div>
                  <Button ref={addButtonRef} onClick={handleAddItem} size="sm" className="h-10 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white font-bold shadow-lg shadow-orange-500/20 rounded-xl transition-all active:scale-95 ring-1 ring-white/20">
                    <Plus className="h-4 w-4 mr-1.5" />Novo Item
                  </Button>
                </div>
                
                <div className="space-y-3 pb-4">
                  {itens.length === 0 ? (
                    <div className="text-center py-12 text-gray-400 dark:text-gray-500 border-2 border-dashed border-white/20 dark:border-white/10 rounded-[2rem] bg-white/5 dark:bg-white/5 backdrop-blur-md flex flex-col items-center justify-center">
                      <div className="w-16 h-16 rounded-2xl bg-gray-500/5 flex items-center justify-center mb-3 border border-white/5">
                        <Package className="h-8 w-8 opacity-20" />
                      </div>
                      <p className="text-[10px] font-black uppercase tracking-widest opacity-50">Nenhum item</p>
                    </div>
                  ) : itens.map((item, index) => (
                    <div key={index} className="p-4 bg-white/40 dark:bg-gray-900/40 rounded-[1.5rem] border border-white/20 dark:border-white/10 backdrop-blur-xl shadow-sm relative overflow-hidden group active:scale-[0.98] transition-all">
                      <div className="space-y-4">
                        {/* Produto */}
                        <div className="relative">
                          <Label className="text-[9px] text-gray-500 dark:text-gray-400 mb-1.5 block font-black uppercase tracking-widest pl-1">Produto</Label>
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                              placeholder="Buscar produto..."
                              value={item.produto}
                              onChange={e => { 
                                handleItemChange(index, 'produto', e.target.value); 
                                setProductSearch(e.target.value);
                                setActiveSearchIndex(index);
                              }}
                              onFocus={() => setActiveSearchIndex(index)}
                              className="h-11 text-sm pl-9 bg-white/50 dark:bg-gray-950/50 border-white/20 dark:border-white/10 font-bold rounded-xl"
                            />
                          </div>
                          {activeSearchIndex === index && productSearch && filteredProducts.length > 0 && (
                            <div className="absolute z-50 w-full mt-1 bg-white/95 dark:bg-gray-950/95 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-xl shadow-2xl max-h-40 overflow-auto custom-scrollbar">
                              {filteredProducts.map(p => (
                                <button 
                                  key={p.id} 
                                  onClick={() => { 
                                    handleItemChange(index, 'produto', p.name); 
                                    setProductSearch(''); 
                                    setActiveSearchIndex(null);
                                  }}
                                  className="w-full px-4 py-3 text-left text-sm hover:bg-orange-500/10 text-gray-900 dark:text-white flex items-center gap-3 transition-colors font-bold border-b border-white/5 last:border-none"
                                >
                                  <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-500">
                                    <Package className="h-4 w-4" />
                                  </div>
                                  {p.name}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                        {/* Quantidade, Unidade, Preço */}
                        <div className="grid grid-cols-3 gap-3">
                          <div className="col-span-1">
                            <Label className="text-[9px] text-gray-500 dark:text-gray-400 mb-1.5 block font-black uppercase tracking-widest pl-1">Qtd</Label>
                            <Input 
                              type="number" 
                              value={item.quantidade} 
                              onChange={e => handleItemChange(index, 'quantidade', parseFloat(e.target.value) || 0)} 
                              className="h-11 text-sm bg-white/50 dark:bg-gray-950/50 border-white/20 dark:border-white/10 font-black rounded-xl text-center" 
                            />
                          </div>
                          <div className="col-span-1">
                            <Label className="text-[9px] text-gray-500 dark:text-gray-400 mb-1.5 block font-black uppercase tracking-widest pl-1">Un</Label>
                            <Select value={item.unidade} onValueChange={v => handleItemChange(index, 'unidade', v)}>
                              <SelectTrigger className="h-11 text-xs bg-white/50 dark:bg-gray-950/50 border-white/20 dark:border-white/10 font-black rounded-xl uppercase"><SelectValue /></SelectTrigger>
                              <SelectContent className="bg-white/95 dark:bg-gray-950/95 backdrop-blur-xl border-white/20 dark:border-white/10 rounded-xl shadow-2xl">
                                {["un", "kg", "cx", "pc", "L", "dz", "pct", "g", "ml"].map(u => (
                                  <SelectItem key={u} value={u} className="font-black uppercase text-[10px] tracking-widest">{u}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="col-span-1">
                            <Label className="text-[9px] text-gray-500 dark:text-gray-400 mb-1.5 block font-black uppercase tracking-widest pl-1">Preço</Label>
                            <div className="relative">
                              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[9px] font-black text-orange-500/50">R$</span>
                              <Input 
                                type="number" 
                                step="0.01"
                                value={item.valorUnitario} 
                                onChange={e => handleItemChange(index, 'valorUnitario', parseFloat(e.target.value) || 0)} 
                                className="h-11 text-sm pl-7 bg-white/50 dark:bg-gray-950/50 border-white/20 dark:border-white/10 font-black rounded-xl" 
                              />
                            </div>
                          </div>
                        </div>
                        {/* Subtotal e Remover */}
                        <div className="flex items-center justify-between pt-3 border-t border-white/10 dark:border-white/5 bg-black/5 dark:bg-white/5 -mx-4 -mb-4 px-4 py-2.5 rounded-b-[1.5rem]">
                          <div className="flex flex-col">
                            <span className="text-[8px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Subtotal</span>
                            <span className="text-sm font-black text-orange-600 dark:text-orange-400">
                              R$ {(item.quantidade * item.valorUnitario).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                          <Button variant="ghost" size="icon" onClick={() => handleRemoveItem(index)} className="h-10 w-10 text-gray-400 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Total Mobile Impactante */}
                <div className="relative group overflow-hidden rounded-[2rem] p-0.5 mt-4">
                  <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-amber-500 opacity-20"></div>
                  <div className="relative flex justify-between items-center p-6 bg-white/60 dark:bg-gray-950/60 border border-white/30 dark:border-white/10 backdrop-blur-2xl shadow-xl rounded-[1.9rem]">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-orange-600 dark:text-orange-400 uppercase tracking-[0.2em] mb-1">Total do Pedido</span>
                      <div className="flex items-baseline gap-1">
                        <span className="text-xs font-black text-gray-400 uppercase">R$</span>
                        <span className="text-2xl font-black text-gray-900 dark:text-white tracking-tighter">
                          {calculateTotal().toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white shadow-lg ring-2 ring-white/20">
                      <DollarSign className="h-6 w-6" />
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Tab: Detalhes (Edição) */}
            <TabsContent value="detalhes" className="flex-1 overflow-auto m-0 p-6 custom-scrollbar">
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em] pl-1">Fornecedor</Label>
                  <Select value={fornecedor} onValueChange={setFornecedor}>
                    <SelectTrigger className="h-12 text-sm bg-white/50 dark:bg-gray-950/50 border-white/20 dark:border-white/10 font-bold rounded-2xl shadow-sm">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-orange-500" />
                        <SelectValue placeholder="Selecione o fornecedor" />
                      </div>
                    </SelectTrigger>
                    <SelectContent className="bg-white/95 dark:bg-gray-950/95 backdrop-blur-2xl border-white/20 dark:border-white/10 rounded-2xl shadow-2xl">
                      {suppliers.map(s => <SelectItem key={s.id} value={s.id} className="font-bold py-3">{s.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em] pl-1">Data de Entrega</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                    <Input type="date" value={dataEntrega} onChange={e => setDataEntrega(e.target.value)} className="h-12 text-sm pl-10 bg-white/50 dark:bg-gray-950/50 border-white/20 dark:border-white/10 font-bold rounded-2xl shadow-sm" />
                  </div>
                </div>
                
                <div className="space-y-3">
                  <Label className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em] pl-1">Status do Pedido</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {statusOptions.map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => setStatus(opt.value)}
                        className={cn(
                          "px-3 py-3 rounded-2xl text-[10px] uppercase tracking-wider font-black border-2 transition-all min-h-[44px] shadow-sm relative overflow-hidden",
                          status === opt.value 
                            ? `${opt.color} border-current ring-2 ring-current/10` 
                            : "bg-white/40 dark:bg-gray-900/40 text-gray-700 dark:text-gray-300 border-white/10 dark:border-white/5"
                        )}
                      >
                        <span className="relative z-10">{opt.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em] pl-1">Observações</Label>
                  <Textarea
                    placeholder="Notas internas ou observações..."
                    value={observacoes}
                    onChange={e => setObservacoes(e.target.value)}
                    className="min-h-[120px] resize-none text-sm bg-white/50 dark:bg-gray-950/50 border-white/20 dark:border-white/10 font-medium rounded-2xl shadow-sm pt-3"
                  />
                </div>
              </div>
            </TabsContent>

            {/* Tab: Resumo (Visualização) */}
            <TabsContent value="resumo" className="flex-1 overflow-auto m-0 p-6 custom-scrollbar">
              <div className="space-y-6">
                {/* Cards de resumo mobile semiglass */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-orange-500/5 dark:bg-orange-900/10 rounded-[1.5rem] p-4 border border-orange-500/20 dark:border-orange-800/30 backdrop-blur-md shadow-sm">
                    <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400 mb-2">
                      <Building2 className="h-3.5 w-3.5" />
                      <span className="text-[9px] font-black uppercase tracking-widest opacity-70">Fornecedor</span>
                    </div>
                    <p className="font-black text-xs truncate text-gray-900 dark:text-white">{selectedSupplier?.name || pedido?.fornecedor || '-'}</p>
                  </div>
                  <div className="bg-blue-500/5 dark:bg-blue-900/10 rounded-[1.5rem] p-4 border border-blue-500/20 dark:border-blue-800/30 backdrop-blur-md shadow-sm">
                    <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-2">
                      <Calendar className="h-3.5 w-3.5" />
                      <span className="text-[9px] font-black uppercase tracking-widest opacity-70">Entrega</span>
                    </div>
                    <p className="font-black text-xs text-gray-900 dark:text-white">{formatDate(dataEntrega || pedido?.dataEntrega)}</p>
                  </div>
                  <div className="bg-purple-500/5 dark:bg-purple-900/10 rounded-[1.5rem] p-4 border border-purple-500/20 dark:border-purple-800/30 backdrop-blur-md shadow-sm">
                    <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 mb-2">
                      <Package className="h-3.5 w-3.5" />
                      <span className="text-[9px] font-black uppercase tracking-widest opacity-70">Itens</span>
                    </div>
                    <p className="font-black text-xs text-gray-900 dark:text-white">{itens.length} produto(s)</p>
                  </div>
                  <div className="bg-emerald-500/5 dark:bg-emerald-900/10 rounded-[1.5rem] p-4 border border-emerald-500/20 dark:border-emerald-800/30 backdrop-blur-md shadow-sm">
                    <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 mb-2">
                      <DollarSign className="h-3.5 w-3.5" />
                      <span className="text-[9px] font-black uppercase tracking-widest opacity-70">Total</span>
                    </div>
                    <p className="font-black text-xs text-emerald-700 dark:text-emerald-400">R$ {calculateTotal().toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  </div>
                </div>

                {/* Status atual mobile */}
                <div className="flex flex-col items-center justify-center gap-3 py-4 bg-white/30 dark:bg-black/20 rounded-[1.5rem] border border-white/20">
                  <span className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500">Status do Pedido</span>
                  <div className="transform scale-110">
                    {getStatusBadge(status || pedido?.status || 'pendente')}
                  </div>
                </div>

                {/* Observações mobile */}
                {observacoes && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 px-1">
                      <FileText className="h-3.5 w-3.5 text-orange-500" />
                      <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Observações</span>
                    </div>
                    <div className="bg-white/40 dark:bg-gray-900/40 rounded-2xl p-4 border border-white/20 backdrop-blur-md">
                      <p className="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-medium leading-relaxed">{observacoes}</p>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Tab: Exportar */}
            <TabsContent value="exportar" className="flex-1 overflow-hidden m-0 p-0">
              <OrderExportTab
                pedido={pedido}
                itens={itens}
                fornecedor={fornecedor}
                dataEntrega={dataEntrega}
                observacoes={observacoes}
                suppliers={suppliers}
              />
            </TabsContent>
          </Tabs>

          <DrawerFooter className="border-t border-white/10 dark:border-white/5 bg-white/20 dark:bg-gray-900/20 px-4 py-3 backdrop-blur-md">
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
        className="w-[95vw] max-w-[850px] h-[90vh] max-h-[700px] overflow-hidden p-0 gap-0 !bg-white/70 dark:!bg-gray-950/70 backdrop-blur-2xl border border-white/20 dark:border-white/10 shadow-2xl rounded-[2rem] [&>button]:hidden animate-in fade-in zoom-in-95 duration-300"
        onKeyDown={handleModalKeyDown}
      >
        {/* Header compacto com semiglass */}
        <div className="flex-shrink-0 px-6 py-4 border-b border-white/10 dark:border-white/5 bg-white/30 dark:bg-white/5 backdrop-blur-md relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 to-transparent pointer-events-none"></div>
          <div className="flex items-center justify-between relative z-10">
            {headerContent}
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => onOpenChange(false)} 
              className="h-10 w-10 text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/20 dark:hover:bg-white/10 rounded-xl transition-all border border-transparent hover:border-white/20 shadow-sm"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Tabs com design refinado */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <div className="px-6 pt-4 bg-white/20 dark:bg-black/5">
            <TabsList className="flex-shrink-0 bg-white/40 dark:bg-gray-950/40 backdrop-blur-xl p-1.5 rounded-2xl border border-white/30 dark:border-white/10 grid grid-cols-4 gap-2 shadow-inner h-14">
              <TabsTrigger value="itens" className="text-[10px] uppercase tracking-[0.15em] font-black text-gray-500 dark:text-gray-400 data-[state=active]:bg-white/90 dark:data-[state=active]:bg-gray-800/90 data-[state=active]:text-orange-600 dark:data-[state=active]:text-orange-300 rounded-xl transition-all duration-300 data-[state=active]:shadow-lg data-[state=active]:ring-1 data-[state=active]:ring-white/20">
                <Package className="h-4 w-4 mr-2" />Itens
              </TabsTrigger>
              <TabsTrigger value="detalhes" className="text-[10px] uppercase tracking-[0.15em] font-black text-gray-500 dark:text-gray-400 data-[state=active]:bg-white/90 dark:data-[state=active]:bg-gray-800/90 data-[state=active]:text-orange-600 dark:data-[state=active]:text-orange-300 rounded-xl transition-all duration-300 data-[state=active]:shadow-lg data-[state=active]:ring-1 data-[state=active]:ring-white/20">
                <FileText className="h-4 w-4 mr-2" />Detalhes
              </TabsTrigger>
              <TabsTrigger value="resumo" className="text-[10px] uppercase tracking-[0.15em] font-black text-gray-500 dark:text-gray-400 data-[state=active]:bg-white/90 dark:data-[state=active]:bg-gray-800/90 data-[state=active]:text-orange-600 dark:data-[state=active]:text-orange-300 rounded-xl transition-all duration-300 data-[state=active]:shadow-lg data-[state=active]:ring-1 data-[state=active]:ring-white/20">
                <ClipboardList className="h-4 w-4 mr-2" />Resumo
              </TabsTrigger>
              <TabsTrigger value="exportar" className="text-[10px] uppercase tracking-[0.15em] font-black text-gray-500 dark:text-gray-400 data-[state=active]:bg-white/90 dark:data-[state=active]:bg-gray-800/90 data-[state=active]:text-orange-600 dark:data-[state=active]:text-orange-300 rounded-xl transition-all duration-300 data-[state=active]:shadow-lg data-[state=active]:ring-1 data-[state=active]:ring-white/20">
                <Download className="h-4 w-4 mr-2" />Exportar
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Tab: Itens (Edição) */}
          <TabsContent value="itens" className="flex-1 overflow-auto m-0 p-0 custom-scrollbar">
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between px-2">
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em]">Itens do Pedido</span>
                    <Badge variant="secondary" className="h-5 px-2 text-[9px] font-black bg-orange-500/10 text-orange-600 dark:text-orange-400 border-none rounded-md ring-1 ring-orange-500/20">
                      {itens.length} {itens.length === 1 ? 'item' : 'itens'}
                    </Badge>
                  </div>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight mt-1">Gerencie os produtos e valores</p>
                </div>
                <Button ref={addButtonRef} onClick={handleAddItem} size="sm" className="h-10 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-bold text-[10px] uppercase tracking-wider shadow-lg shadow-orange-500/20 rounded-xl transition-all active:scale-95 ring-1 ring-white/20">
                  <Plus className="h-4 w-4 mr-2" />Adicionar Item
                </Button>
              </div>
              
              <div className="space-y-4 pb-4">
                {itens.length === 0 ? (
                  <div className="text-center py-20 text-gray-400 dark:text-gray-500 border-2 border-dashed border-white/20 dark:border-white/10 rounded-[2.5rem] bg-white/5 dark:bg-white/5 backdrop-blur-md flex flex-col items-center justify-center group hover:border-orange-500/30 transition-all duration-500">
                    <div className="w-20 h-20 rounded-3xl bg-gray-500/5 flex items-center justify-center mb-4 border border-white/5 group-hover:scale-110 group-hover:bg-orange-500/5 transition-all duration-500">
                      <Package className="h-10 w-10 opacity-20 group-hover:opacity-40 group-hover:text-orange-500 transition-all" />
                    </div>
                    <p className="text-xs font-black uppercase tracking-[0.3em] opacity-50">Nenhum item adicionado</p>
                    <p className="text-[10px] font-bold opacity-30 mt-2 uppercase tracking-widest">Clique em "Adicionar" para iniciar seu pedido</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {itens.map((item, index) => (
                      <div key={index} className="group relative">
                        <div className="p-5 bg-white/40 dark:bg-gray-900/40 rounded-[1.5rem] border border-white/30 dark:border-white/10 backdrop-blur-xl shadow-sm group-hover:border-orange-500/40 transition-all duration-300 hover:shadow-xl hover:shadow-orange-500/5 ring-1 ring-transparent hover:ring-white/20">
                          <div className="grid grid-cols-12 gap-5 items-start">
                            {/* Produto */}
                            <div className="col-span-12 lg:col-span-6 relative">
                              <Label className="text-[10px] text-gray-500 dark:text-gray-400 mb-2.5 block font-black uppercase tracking-widest pl-1">Produto</Label>
                              <div className="relative group/input">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-white/50 dark:bg-white/5 flex items-center justify-center text-gray-400 group-hover/input:text-orange-500 transition-colors border border-white/20">
                                  <Search className="h-4 w-4" />
                                </div>
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
                                  className="h-12 text-sm pl-14 bg-white/50 dark:bg-gray-950/50 border-white/30 dark:border-white/10 font-bold rounded-2xl focus:ring-orange-500/20 focus:border-orange-500/40 transition-all"
                                />
                              </div>
                              {activeSearchIndex === index && productSearch && filteredProducts.length > 0 && (
                                <div className="absolute z-[60] w-full mt-2 bg-white/95 dark:bg-gray-950/95 backdrop-blur-2xl border border-white/30 dark:border-white/10 rounded-2xl shadow-2xl max-h-56 overflow-auto custom-scrollbar animate-in fade-in slide-in-from-top-2 ring-1 ring-black/5">
                                  {filteredProducts.map((p) => (
                                    <button 
                                      key={p.id} 
                                      onClick={() => { 
                                        handleItemChange(index, 'produto', p.name); 
                                        setProductSearch(''); 
                                        setActiveSearchIndex(null);
                                        setTimeout(() => {
                                          quantityInputRefs.current[index]?.focus();
                                          quantityInputRefs.current[index]?.select();
                                        }, 50);
                                      }}
                                      className="w-full px-4 py-3.5 text-left text-sm hover:bg-orange-500/10 text-gray-900 dark:text-white flex items-center gap-3 transition-all font-bold border-b border-white/5 last:border-none group/btn"
                                    >
                                      <div className="w-9 h-9 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500 group-hover/btn:scale-110 transition-transform">
                                        <Package className="h-4 w-4" />
                                      </div>
                                      <span className="flex-1">{p.name}</span>
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* Quantidade e Unidade */}
                            <div className="col-span-6 lg:col-span-3">
                              <Label className="text-[10px] text-gray-500 dark:text-gray-400 mb-2.5 block font-black uppercase tracking-widest pl-1">Quantidade</Label>
                              <div className="flex gap-2">
                                <Input 
                                  ref={el => quantityInputRefs.current[index] = el}
                                  type="number" 
                                  value={item.quantidade || ''} 
                                  onChange={e => handleItemChange(index, 'quantidade', parseFloat(e.target.value) || 0)} 
                                  onKeyDown={e => handleItemKeyDown(e, index, 'quantidade')}
                                  className="h-12 text-sm bg-white/50 dark:bg-gray-950/50 border-white/30 dark:border-white/10 font-black rounded-2xl text-center focus:ring-orange-500/20 focus:border-orange-500/40 transition-all" 
                                />
                                <Select value={item.unidade} onValueChange={v => handleItemChange(index, 'unidade', v)}>
                                  <SelectTrigger className="h-12 w-24 text-xs bg-white/50 dark:bg-gray-950/50 border-white/30 dark:border-white/10 font-black rounded-2xl focus:ring-orange-500/20 focus:border-orange-500/40 uppercase transition-all shadow-sm"><SelectValue /></SelectTrigger>
                                  <SelectContent className="bg-white/95 dark:bg-gray-950/95 backdrop-blur-2xl border-white/30 dark:border-white/10 rounded-2xl shadow-2xl ring-1 ring-black/5">
                                    {["un", "kg", "cx", "pc", "L", "dz", "pct", "g", "ml"].map(u => (
                                      <SelectItem key={u} value={u} className="font-black uppercase text-[10px] tracking-widest focus:bg-orange-500/10 focus:text-orange-600 transition-colors">{u}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>

                            {/* Preço e Remover */}
                            <div className="col-span-6 lg:col-span-3">
                              <Label className="text-[10px] text-gray-500 dark:text-gray-400 mb-2.5 block font-black uppercase tracking-widest pl-1">Valor Unit.</Label>
                              <div className="flex gap-2">
                                <div className="relative flex-1 group/price">
                                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[10px] font-black text-orange-500/50 group-hover/price:text-orange-500 transition-colors">R$</span>
                                  <Input 
                                    ref={el => priceInputRefs.current[index] = el}
                                    type="number" 
                                    step="0.01"
                                    value={item.valorUnitario || ''} 
                                    onChange={e => handleItemChange(index, 'valorUnitario', parseFloat(e.target.value) || 0)} 
                                    onKeyDown={e => handleItemKeyDown(e, index, 'preco')}
                                    className="h-12 text-sm pl-10 bg-white/50 dark:bg-gray-950/50 border-white/30 dark:border-white/10 font-black rounded-2xl focus:ring-orange-500/20 focus:border-orange-500/40 transition-all" 
                                  />
                                </div>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  onClick={() => handleRemoveItem(index)} 
                                  className="h-12 w-12 text-gray-400 hover:text-red-500 hover:bg-red-500/10 rounded-2xl transition-all flex-shrink-0 border border-white/20 hover:border-red-500/30 shadow-sm"
                                >
                                  <Trash2 className="h-5 w-5" />
                                </Button>
                              </div>
                            </div>
                          </div>

                          {/* Subtotal do Item com design semiglass */}
                          <div className="mt-5 pt-4 border-t border-white/10 dark:border-white/5 flex justify-between items-center bg-black/5 dark:bg-white/5 -mx-5 -mb-5 px-5 py-3 rounded-b-[1.5rem]">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></div>
                              <span className="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em]">Subtotal do Item</span>
                            </div>
                            <div className="flex items-baseline gap-1">
                              <span className="text-[10px] font-bold text-orange-500/70 dark:text-orange-400/70 uppercase">R$</span>
                              <span className="font-black text-gray-900 dark:text-white text-base tracking-tight">
                                {(item.quantidade * item.valorUnitario).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Total Final Impactante */}
              <div className="relative group overflow-hidden rounded-[2rem] p-0.5 mt-8">
                <div className="absolute inset-0 bg-gradient-to-r from-orange-500 via-amber-500 to-orange-500 animate-gradient-x opacity-20 group-hover:opacity-40 transition-opacity duration-700"></div>
                <div className="relative flex justify-between items-center p-8 bg-white/60 dark:bg-gray-950/60 border border-white/40 dark:border-white/10 backdrop-blur-2xl shadow-2xl rounded-[1.9rem]">
                  <div className="flex items-center gap-5">
                    <div className="w-16 h-16 rounded-[1.25rem] bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white shadow-xl shadow-orange-500/30 ring-2 ring-white/30 group-hover:scale-110 transition-transform duration-500">
                      <DollarSign className="h-8 w-8" />
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs font-black text-orange-600 dark:text-orange-400 uppercase tracking-[0.3em]">
                        Total Consolidado
                      </span>
                      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest opacity-60">Soma de todos os itens do pedido</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Valor Total</span>
                    <span className="font-black text-4xl text-gray-900 dark:text-white tracking-tighter flex items-center gap-2">
                      <span className="text-xl text-orange-500/50">R$</span>
                      {calculateTotal().toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Tab: Detalhes (Edição) */}
          <TabsContent value="detalhes" className="flex-1 overflow-auto m-0 p-0 custom-scrollbar">
            <div className="p-8 space-y-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <Label className="text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em] pl-1">Fornecedor Responsável</Label>
                  <Select value={fornecedor} onValueChange={setFornecedor}>
                    <SelectTrigger className="h-12 text-sm bg-white/40 dark:bg-gray-950/40 border-white/30 dark:border-white/10 font-bold rounded-2xl focus:ring-orange-500/20 shadow-sm transition-all">
                      <div className="flex items-center gap-3">
                        <Building2 className="h-4 w-4 text-orange-500" />
                        <SelectValue placeholder="Selecione o fornecedor" />
                      </div>
                    </SelectTrigger>
                    <SelectContent className="bg-white/95 dark:bg-gray-950/95 backdrop-blur-2xl border-white/30 dark:border-white/10 rounded-2xl shadow-2xl ring-1 ring-black/5">
                      {suppliers.map(s => <SelectItem key={s.id} value={s.id} className="font-bold focus:bg-orange-500/10 focus:text-orange-600 transition-colors py-3 px-4">{s.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest pl-1 opacity-60">Selecione o parceiro comercial deste pedido</p>
                </div>
                <div className="space-y-3">
                  <Label className="text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em] pl-1">Previsão de Entrega</Label>
                  <div className="relative group">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-hover:text-orange-500 transition-colors pointer-events-none" />
                    <Input 
                      type="date" 
                      value={dataEntrega} 
                      onChange={e => setDataEntrega(e.target.value)} 
                      className="h-12 text-sm pl-12 bg-white/40 dark:bg-gray-950/40 border-white/30 dark:border-white/10 font-bold rounded-2xl focus:ring-orange-500/20 shadow-sm transition-all" 
                    />
                  </div>
                  <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest pl-1 opacity-60">Data estimada para o recebimento</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <Label className="text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em] pl-1">Status do Fluxo de Pedido</Label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {statusOptions.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setStatus(opt.value)}
                      className={cn(
                        "px-4 py-3 rounded-2xl text-[10px] uppercase tracking-[0.15em] font-black border-2 transition-all min-h-[50px] shadow-sm relative overflow-hidden group/status",
                        status === opt.value 
                          ? `${opt.color} border-current ring-4 ring-current/10 scale-[1.02] z-10` 
                          : "bg-white/40 dark:bg-gray-900/40 text-gray-500 dark:text-gray-400 border-white/20 dark:border-white/5 hover:border-orange-500/30 hover:bg-white/60 dark:hover:bg-gray-800/60"
                      )}
                    >
                      <div className="flex flex-col items-center gap-1.5 relative z-10">
                        {status === opt.value && <div className="w-1 h-1 rounded-full bg-current animate-ping absolute -top-1 -right-1"></div>}
                        {opt.label}
                      </div>
                      {status === opt.value && (
                        <div className="absolute inset-0 bg-current opacity-[0.03] animate-pulse"></div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between pl-1">
                  <Label className="text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em]">Observações Internas</Label>
                  <Badge variant="outline" className="text-[9px] font-bold uppercase tracking-widest border-white/20 bg-white/5">Opcional</Badge>
                </div>
                <div className="relative group">
                  <FileText className="absolute left-4 top-4 h-4 w-4 text-gray-400 group-hover:text-orange-500 transition-colors pointer-events-none" />
                  <Textarea
                    placeholder="Adicione notas, instruções de entrega ou observações financeiras..."
                    value={observacoes}
                    onChange={e => setObservacoes(e.target.value)}
                    className="min-h-[150px] pl-12 pt-3.5 resize-none text-sm bg-white/40 dark:bg-gray-950/40 border-white/30 dark:border-white/10 font-medium rounded-2xl focus:ring-orange-500/20 focus:border-orange-500/40 transition-all shadow-sm"
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Tab: Resumo (Visualização) */}
          <TabsContent value="resumo" className="flex-1 overflow-auto m-0 p-0 custom-scrollbar">
            <div className="p-8 space-y-8">
              {/* Cards de resumo com design semiglass */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-orange-500/5 dark:bg-orange-900/10 rounded-3xl p-5 border border-orange-500/20 dark:border-orange-800/30 backdrop-blur-md shadow-sm hover:shadow-lg transition-all duration-300 group/card">
                  <div className="flex items-center gap-2.5 text-orange-600 dark:text-orange-400 mb-3">
                    <div className="w-8 h-8 rounded-xl bg-orange-500/10 flex items-center justify-center group-hover/card:scale-110 transition-transform">
                      <Building2 className="h-4 w-4" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-70">Fornecedor</span>
                  </div>
                  <p className="font-black text-sm truncate text-gray-900 dark:text-white pl-1">{selectedSupplier?.name || pedido?.fornecedor || '-'}</p>
                </div>
                <div className="bg-blue-500/5 dark:bg-blue-900/10 rounded-3xl p-5 border border-blue-500/20 dark:border-blue-800/30 backdrop-blur-md shadow-sm hover:shadow-lg transition-all duration-300 group/card">
                  <div className="flex items-center gap-2.5 text-blue-600 dark:text-blue-400 mb-3">
                    <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center group-hover/card:scale-110 transition-transform">
                      <Calendar className="h-4 w-4" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-70">Entrega</span>
                  </div>
                  <p className="font-black text-sm text-gray-900 dark:text-white pl-1">{formatDate(dataEntrega || pedido?.dataEntrega)}</p>
                </div>
                <div className="bg-purple-500/5 dark:bg-purple-900/10 rounded-3xl p-5 border border-purple-500/20 dark:border-purple-800/30 backdrop-blur-md shadow-sm hover:shadow-lg transition-all duration-300 group/card">
                  <div className="flex items-center gap-2.5 text-purple-600 dark:text-purple-400 mb-3">
                    <div className="w-8 h-8 rounded-xl bg-purple-500/10 flex items-center justify-center group-hover/card:scale-110 transition-transform">
                      <Package className="h-4 w-4" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-70">Volume</span>
                  </div>
                  <p className="font-black text-sm text-gray-900 dark:text-white pl-1">{itens.length} produto(s)</p>
                </div>
                <div className="bg-emerald-500/5 dark:bg-emerald-900/10 rounded-3xl p-5 border border-emerald-500/20 dark:border-emerald-800/30 backdrop-blur-md shadow-sm hover:shadow-lg transition-all duration-300 group/card">
                  <div className="flex items-center gap-2.5 text-emerald-600 dark:text-emerald-400 mb-3">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center group-hover/card:scale-110 transition-transform">
                      <DollarSign className="h-4 w-4" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-70">Investimento</span>
                  </div>
                  <p className="font-black text-sm text-emerald-700 dark:text-emerald-400 pl-1">R$ {calculateTotal().toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                </div>
              </div>

              {/* Lista de itens resumida com design semiglass */}
              <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                  <div className="flex items-center gap-2">
                    <ClipboardList className="h-4 w-4 text-orange-500" />
                    <span className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em]">Detalhamento de Itens</span>
                  </div>
                  <Badge variant="outline" className="text-[9px] font-bold uppercase tracking-widest border-white/20">Checklist</Badge>
                </div>
                <Card className="bg-white/40 dark:bg-gray-950/40 rounded-[2rem] border border-white/30 dark:border-white/10 overflow-hidden backdrop-blur-2xl shadow-xl">
                  <div className="max-h-[250px] overflow-auto custom-scrollbar divide-y divide-white/10 dark:divide-white/5">
                    {itens.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 gap-3 opacity-30">
                        <Package className="h-10 w-10" />
                        <p className="text-xs font-black uppercase tracking-[0.2em]">Nenhum item registrado</p>
                      </div>
                    ) : itens.map((item, index) => (
                      <div key={index} className="flex items-center justify-between px-6 py-4 hover:bg-white/10 dark:hover:bg-white/5 transition-all group/item">
                        <div className="flex items-center gap-4 min-w-0 flex-1">
                          <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center flex-shrink-0 border border-orange-500/20 group-hover/item:scale-110 transition-transform">
                            <Package className="h-4 w-4 text-orange-500" />
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="text-sm truncate text-gray-900 dark:text-white font-bold">{item.produto || 'Produto não definido'}</span>
                            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{item.unidade} • Unid. R$ {item.valorUnitario.toFixed(2)}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-6 flex-shrink-0">
                          <div className="flex flex-col items-end">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">{item.quantidade}x</span>
                            <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">R$ {(item.quantidade * item.valorUnitario).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>

              {/* Observações com design semiglass */}
              {observacoes && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 px-2">
                    <FileText className="h-4 w-4 text-orange-500" />
                    <span className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em]">Notas do Pedido</span>
                  </div>
                  <div className="bg-white/40 dark:bg-gray-900/40 rounded-[1.5rem] p-6 border border-white/30 dark:border-white/10 backdrop-blur-2xl shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-3 opacity-10">
                      <FileText className="h-12 w-12" />
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-medium leading-relaxed relative z-10">{observacoes}</p>
                  </div>
                </div>
              )}

              {/* Status atual centralizado */}
              <div className="flex flex-col items-center justify-center gap-4 py-6 border-t border-white/10">
                <div className="flex items-center gap-3">
                  <div className="h-[1px] w-12 bg-gradient-to-r from-transparent to-gray-300 dark:to-gray-700"></div>
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 dark:text-gray-500">Status do Pedido</span>
                  <div className="h-[1px] w-12 bg-gradient-to-l from-transparent to-gray-300 dark:to-gray-700"></div>
                </div>
                <div className="transform scale-110 shadow-xl rounded-full">
                  {getStatusBadge(status || pedido?.status || 'pendente')}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Tab: Exportar */}
          <TabsContent value="exportar" className="flex-1 overflow-hidden m-0 p-0">
            <OrderExportTab
              pedido={pedido}
              itens={itens}
              fornecedor={fornecedor}
              dataEntrega={dataEntrega}
              observacoes={observacoes}
              suppliers={suppliers}
            />
          </TabsContent>
        </Tabs>

        {/* Footer com semiglass e atalhos */}
        <div className="flex-shrink-0 px-8 py-5 border-t border-white/20 dark:border-white/10 bg-white/40 dark:bg-gray-950/40 backdrop-blur-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-t from-orange-500/5 to-transparent pointer-events-none"></div>
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-8">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => onOpenChange(false)} 
                disabled={loading} 
                className="border-white/30 dark:border-white/10 bg-white/5 dark:bg-white/5 font-black text-[10px] uppercase tracking-[0.2em] h-12 px-6 hover:bg-white/10 transition-all rounded-2xl backdrop-blur-md shadow-sm"
              >
                Fechar
              </Button>
              <div className="hidden lg:flex items-center gap-5 text-[9px] font-black uppercase tracking-wider text-gray-400 dark:text-gray-500">
                <span className="flex items-center gap-2 group/kbd cursor-help">
                  <kbd className="px-2 py-1 bg-white/20 dark:bg-gray-800/50 rounded-lg shadow-sm border border-white/20 group-hover/kbd:border-orange-500/30 transition-colors">Alt+←→</kbd> 
                  <span className="opacity-60 group-hover/kbd:opacity-100 transition-opacity">Navegar Abas</span>
                </span>
                <span className="flex items-center gap-2 group/kbd cursor-help">
                  <kbd className="px-2 py-1 bg-white/20 dark:bg-gray-800/50 rounded-lg shadow-sm border border-white/20 group-hover/kbd:border-orange-500/30 transition-colors">Alt+N</kbd> 
                  <span className="opacity-60 group-hover/kbd:opacity-100 transition-opacity">Novo Item</span>
                </span>
                <span className="flex items-center gap-2 group/kbd cursor-help">
                  <kbd className="px-2 py-1 bg-white/20 dark:bg-gray-800/50 rounded-lg shadow-sm border border-white/20 group-hover/kbd:border-orange-500/30 transition-colors">Ctrl+Enter</kbd> 
                  <span className="opacity-60 group-hover/kbd:opacity-100 transition-opacity">Salvar Alterações</span>
                </span>
              </div>
            </div>
            <Button 
              onClick={handleSubmit} 
              size="sm" 
              disabled={loading} 
              className="bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white font-black h-12 px-10 shadow-xl shadow-orange-500/20 rounded-2xl transition-all active:scale-[0.98] uppercase tracking-[0.2em] text-[10px] ring-1 ring-white/30"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-3" /> : <Save className="h-4 w-4 mr-3" />}
              Salvar Pedido
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
