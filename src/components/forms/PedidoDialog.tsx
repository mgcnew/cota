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
  
  // Add Product Form States
  const [newProduct, setNewProduct] = useState<any>(null);
  const [newProductSearch, setNewProductSearch] = useState("");
  const [newQuantity, setNewQuantity] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const debouncedNewProductSearch = useDebounce(newProductSearch, 300);
  
  // Refs
  const newProductInputRef = useRef<HTMLInputElement>(null);
  const newQuantityInputRef = useRef<HTMLInputElement>(null);
  const newPriceInputRef = useRef<HTMLInputElement>(null);
  const addItemButtonRef = useRef<HTMLButtonElement>(null);

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

  const tabs = ["itens", "resumo", "exportar"];

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

  const filteredNewProducts = useMemo(() => {
    if (!debouncedNewProductSearch || debouncedNewProductSearch.length < 2) return [];
    return products.filter(p => p.name.toLowerCase().includes(debouncedNewProductSearch.toLowerCase())).slice(0, 30);
  }, [products, debouncedNewProductSearch]);

  const handleAddNewItem = () => {
    const productName = newProduct ? newProduct.name : newProductSearch;
    if (!productName) return;
    
    const qty = parseFloat(newQuantity) || 1;
    // Basic cleanup for price input
    const price = typeof newPrice === 'string' ? parseFloat(newPrice.replace(',', '.')) || 0 : newPrice;

    setItens([{ produto: productName, quantidade: qty, valorUnitario: price, unidade: 'un' }, ...itens]);
    
    // Reset form
    setNewProduct(null);
    setNewProductSearch("");
    setNewQuantity("");
    setNewPrice("");
    
    // Focus back
    setTimeout(() => newProductInputRef.current?.focus(), 50);
  };

  const handleNewItemKeyDown = (e: React.KeyboardEvent, field: 'search' | 'quantity' | 'price') => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (field === 'search') {
        if (filteredNewProducts.length > 0 && highlightedIndex >= 0) {
           const p = filteredNewProducts[highlightedIndex];
           setNewProduct(p);
           setNewProductSearch(p.name);
           setHighlightedIndex(-1);
           newQuantityInputRef.current?.focus();
        } else if (newProductSearch) {
           newQuantityInputRef.current?.focus();
        }
      } else if (field === 'quantity') {
        newPriceInputRef.current?.focus();
      } else if (field === 'price') {
        handleAddNewItem();
      }
    } else if (e.key === 'ArrowDown' && field === 'search') {
      e.preventDefault();
      setHighlightedIndex(prev => Math.min(prev + 1, filteredNewProducts.length - 1));
    } else if (e.key === 'ArrowUp' && field === 'search') {
      e.preventDefault();
      setHighlightedIndex(prev => Math.max(prev - 1, -1));
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
      <div className="w-8 h-8 rounded-lg bg-gray-900 dark:bg-white flex items-center justify-center text-white dark:text-gray-900 shadow-lg ring-1 ring-white/20">
        <ShoppingCart className="h-4 w-4" />
      </div>
      <div className="flex flex-col">
        <DialogTitle className="text-sm font-black text-gray-900 dark:text-white tracking-tight leading-none">
          Gerenciar Pedido
        </DialogTitle>
        <div className="flex items-center gap-1.5 mt-1">
          <span className="text-[8px] text-gray-500 dark:text-gray-400 font-black uppercase tracking-widest bg-gray-100/50 dark:bg-white/5 px-1.5 py-0.5 rounded-md border border-gray-200/50 dark:border-white/5">
            #{pedido?.id?.substring(0, 8)}
          </span>
          <div className="h-1 w-1 rounded-full bg-emerald-500 animate-pulse" />
          {getStatusBadge(status || pedido?.status || 'pendente')}
        </div>
      </div>
    </div>
  );

  // Footer content shared between Dialog and Drawer
  const footerContent = (
    <div className="flex items-center justify-between w-full relative z-10">
      <Button 
        variant="outline" 
        size="sm" 
        onClick={() => onOpenChange(false)} 
        disabled={loading} 
        className="h-9 px-5 border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-white/5 font-black text-[9px] uppercase tracking-widest rounded-xl hover:bg-gray-50 transition-all shadow-sm"
      >
        <X className="h-4 w-4 mr-1.5" />
        Fechar
      </Button>
      <Button 
        onClick={handleSubmit} 
        size="sm" 
        disabled={loading} 
        className="h-9 px-8 bg-orange-600 hover:bg-orange-700 text-white font-black uppercase text-[9px] tracking-widest shadow-md shadow-orange-500/10 rounded-xl transition-all active:scale-[0.98] ring-1 ring-white/20"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
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
            <TabsContent value="itens" className="flex-1 overflow-auto m-0 p-3 custom-scrollbar">
              <div className="space-y-3">
                {/* Campos de Detalhes e Adicionar (Mobile) */}
                <div className="bg-white/40 dark:bg-gray-900/40 rounded-xl p-3 border border-white/20 dark:border-white/5 space-y-3 backdrop-blur-sm">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-[8px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400 pl-1">Fornecedor</Label>
                      <Select value={fornecedor} onValueChange={setFornecedor}>
                        <SelectTrigger className="h-8 text-[10px] font-bold bg-white/50 dark:bg-gray-950/50 border-white/20 dark:border-white/10 rounded-lg shadow-sm">
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent className="bg-white/95 dark:bg-gray-950/95 backdrop-blur-xl border-white/20 dark:border-white/10">
                          {suppliers.map(s => <SelectItem key={s.id} value={s.id} className="text-xs font-bold">{s.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[8px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400 pl-1">Entrega</Label>
                      <Input 
                        type="date" 
                        value={dataEntrega} 
                        onChange={e => setDataEntrega(e.target.value)} 
                        className="h-8 text-[10px] font-bold bg-white/50 dark:bg-gray-950/50 border-white/20 dark:border-white/10 rounded-lg shadow-sm" 
                      />
                    </div>
                  </div>
                  
                  {/* Formulário de Adição Rápida Mobile */}
                  <div className="pt-2 border-t border-white/10 space-y-2">
                    <Label className="text-[8px] font-black uppercase tracking-widest text-orange-500 pl-1">Adicionar Produto</Label>
                    <div className="relative group">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                      <Input
                        ref={newProductInputRef}
                        placeholder="Buscar produto..."
                        value={newProductSearch}
                        onChange={(e) => { setNewProductSearch(e.target.value); setNewProduct(null); }}
                        onKeyDown={(e) => handleNewItemKeyDown(e, 'search')}
                        className="h-8 pl-8 text-[11px] bg-white/50 dark:bg-gray-950/50 border-white/20 dark:border-white/10 font-bold rounded-lg"
                      />
                      {filteredNewProducts.length > 0 && !newProduct && (
                        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-950 border border-white/10 rounded-lg shadow-xl max-h-32 overflow-auto">
                          {filteredNewProducts.map((p, idx) => (
                            <button
                              key={p.id}
                              onClick={() => { setNewProduct(p); setNewProductSearch(p.name); newQuantityInputRef.current?.focus(); }}
                              className="w-full px-3 py-2 text-left text-[10px] font-bold border-b border-white/5 last:border-none"
                            >
                              {p.name}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="grid grid-cols-5 gap-2">
                      <Input
                        ref={newQuantityInputRef}
                        type="number"
                        placeholder="Qtd"
                        value={newQuantity}
                        onChange={(e) => setNewQuantity(e.target.value)}
                        onKeyDown={(e) => handleNewItemKeyDown(e, 'quantity')}
                        className="col-span-2 h-8 text-[11px] bg-white/50 dark:bg-gray-950/50 border-white/20 dark:border-white/10 font-black text-center rounded-lg"
                      />
                      <Input
                        ref={newPriceInputRef}
                        placeholder="Preço"
                        value={newPrice}
                        onChange={(e) => setNewPrice(e.target.value)}
                        onKeyDown={(e) => handleNewItemKeyDown(e, 'price')}
                        className="col-span-2 h-8 text-[11px] bg-white/50 dark:bg-gray-950/50 border-white/20 dark:border-white/10 font-black text-center rounded-lg"
                      />
                      <Button onClick={handleAddNewItem} size="icon" className="h-8 w-8 bg-orange-600 rounded-lg shrink-0">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 px-1">
                  <span className="text-[9px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">Itens do Pedido</span>
                  <Badge variant="outline" className="h-3.5 px-1 text-[7px] font-black bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 rounded">
                    {itens.length}
                  </Badge>
                </div>
                
                <div className="space-y-1 pb-4">
                  {itens.length === 0 ? (
                    <div className="text-center py-8 text-gray-400 dark:text-gray-500 border border-dashed border-white/10 rounded-xl bg-white/5 flex flex-col items-center justify-center">
                      <Package className="h-6 w-6 opacity-20 mb-1" />
                      <p className="text-[8px] font-black uppercase tracking-widest opacity-50">Nenhum item</p>
                    </div>
                  ) : itens.map((item, index) => (
                    <div key={index} className="p-1.5 bg-white/60 dark:bg-gray-900/40 rounded-lg border border-white/10 backdrop-blur-md shadow-sm">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-bold truncate text-gray-900 dark:text-white">{item.produto}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[9px] font-black text-emerald-600 dark:text-emerald-400">R$ {item.valorUnitario.toFixed(2)}</span>
                            <span className="text-[9px] font-bold text-gray-400">x {item.quantidade} {item.unidade}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-black text-gray-900 dark:text-white">R$ {(item.quantidade * item.valorUnitario).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => handleRemoveItem(index)} className="h-6 w-6 text-gray-400 hover:text-red-500 rounded-md">
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Total Mobile */}
                <div className="p-3 bg-emerald-500/5 dark:bg-emerald-900/10 rounded-xl border border-emerald-500/20 backdrop-blur-md flex justify-between items-center shadow-sm">
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-0.5">Total do Pedido</span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-[10px] font-black text-gray-400 uppercase">R$</span>
                      <span className="text-lg font-black text-gray-900 dark:text-white tracking-tighter">
                        {calculateTotal().toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                  <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 ring-1 ring-white/20">
                    <DollarSign className="h-4 w-4" />
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Tab: Detalhes (Edição) */}
            <TabsContent value="detalhes" className="flex-1 overflow-auto m-0 p-5 custom-scrollbar">
              <div className="space-y-5">
                <div className="space-y-1.5">
                  <Label className="text-[9px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest pl-1">Fornecedor</Label>
                  <Select value={fornecedor} onValueChange={setFornecedor}>
                    <SelectTrigger className="h-10 text-xs bg-white/50 dark:bg-gray-950/50 border-gray-200 dark:border-gray-800 font-bold rounded-xl">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-3.5 w-3.5 text-orange-500" />
                        <SelectValue placeholder="Selecione o fornecedor" />
                      </div>
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-gray-950 rounded-xl">
                      {suppliers.map(s => <SelectItem key={s.id} value={s.id} className="font-bold py-2 text-xs">{s.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[9px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest pl-1">Data de Entrega</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
                    <Input type="date" value={dataEntrega} onChange={e => setDataEntrega(e.target.value)} className="h-10 text-xs pl-9 bg-white/50 dark:bg-gray-950/50 border-gray-200 dark:border-gray-800 font-bold rounded-xl" />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-[9px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest pl-1">Status</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {statusOptions.map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => setStatus(opt.value)}
                        className={cn(
                          "px-3 py-2 rounded-xl text-[9px] uppercase tracking-widest font-black border transition-all min-h-[36px]",
                          status === opt.value 
                            ? `${opt.color} border-current ring-2 ring-current/10` 
                            : "bg-white/40 dark:bg-gray-900/40 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-800"
                        )}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[9px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest pl-1">Observações</Label>
                  <Textarea
                    placeholder="Notas internas..."
                    value={observacoes}
                    onChange={e => setObservacoes(e.target.value)}
                    className="min-h-[100px] resize-none text-xs bg-white/50 dark:bg-gray-950/50 border-gray-200 dark:border-gray-800 font-medium rounded-xl pt-2"
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
        className="w-[95vw] max-w-[1100px] h-[85vh] max-h-[700px] overflow-hidden p-0 gap-0 !bg-white/70 dark:!bg-gray-950/70 backdrop-blur-2xl border border-white/20 dark:border-white/10 shadow-2xl rounded-[2rem] [&>button]:hidden animate-in fade-in zoom-in-95 duration-300"
        onKeyDown={handleModalKeyDown}
      >
        {/* Tabs com design refinado */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          {/* Header compacto com semiglass e Tabs integradas */}
          <div className="flex-shrink-0 border-b border-white/10 dark:border-white/5 bg-white/30 dark:bg-white/5 backdrop-blur-md relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 to-transparent pointer-events-none"></div>
            
            {/* Top Bar: Título, Tabs e Botão Fechar */}
            <div className="flex items-center justify-between px-6 py-2 relative z-10 h-14">
              <div className="flex items-center gap-6">
                {/* Título */}
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gray-900 dark:bg-white flex items-center justify-center text-white dark:text-gray-900 shadow-lg ring-1 ring-white/20">
                    <ShoppingCart className="h-4 w-4" />
                  </div>
                  <DialogTitle className="text-sm font-black text-gray-900 dark:text-white tracking-tight leading-none">
                    Gerenciar Pedido
                  </DialogTitle>
                </div>

                {/* Tabs List Integrada na mesma linha */}
                <TabsList className="flex bg-transparent p-0 h-full border-b border-transparent gap-4">
                  <TabsTrigger 
                    value="itens" 
                    className="relative h-full px-0 bg-transparent border-b-2 border-transparent text-[10px] uppercase tracking-[0.15em] font-black text-gray-500 dark:text-gray-400 data-[state=active]:text-orange-600 dark:data-[state=active]:text-orange-400 data-[state=active]:border-orange-500 dark:data-[state=active]:border-orange-500 rounded-none shadow-none transition-all hover:text-gray-700 dark:hover:text-gray-300"
                  >
                    <Package className="h-3.5 w-3.5 mr-2" />Itens
                  </TabsTrigger>
                  <TabsTrigger 
                    value="resumo" 
                    className="relative h-full px-0 bg-transparent border-b-2 border-transparent text-[10px] uppercase tracking-[0.15em] font-black text-gray-500 dark:text-gray-400 data-[state=active]:text-orange-600 dark:data-[state=active]:text-orange-400 data-[state=active]:border-orange-500 dark:data-[state=active]:border-orange-500 rounded-none shadow-none transition-all hover:text-gray-700 dark:hover:text-gray-300"
                  >
                    <ClipboardList className="h-3.5 w-3.5 mr-2" />Resumo
                  </TabsTrigger>
                  <TabsTrigger 
                    value="exportar" 
                    className="relative h-full px-0 bg-transparent border-b-2 border-transparent text-[10px] uppercase tracking-[0.15em] font-black text-gray-500 dark:text-gray-400 data-[state=active]:text-orange-600 dark:data-[state=active]:text-orange-400 data-[state=active]:border-orange-500 dark:data-[state=active]:border-orange-500 rounded-none shadow-none transition-all hover:text-gray-700 dark:hover:text-gray-300"
                  >
                    <Download className="h-3.5 w-3.5 mr-2" />Exportar
                  </TabsTrigger>
                </TabsList>
              </div>

              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => onOpenChange(false)} 
                className="h-8 w-8 text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/20 dark:hover:bg-white/10 rounded-lg transition-all border border-transparent hover:border-white/20 shadow-sm"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Tab: Itens (Edição) */}
          <TabsContent value="itens" className="flex-1 overflow-hidden m-0 p-0 flex flex-col">
            <div className="flex-1 flex gap-0 overflow-hidden divide-x divide-white/10">
              {/* Coluna Esquerda: Fornecedor e Adicionar Produto */}
              <div className="w-[280px] flex-shrink-0 flex flex-col bg-white/30 dark:bg-black/5 overflow-y-auto custom-scrollbar p-3 gap-3">
                  <div className="space-y-3">
                    {/* Fornecedor */}
                    <div className="space-y-1">
                      <Label className="text-[9px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em] pl-1">Fornecedor</Label>
                      <Select value={fornecedor} onValueChange={setFornecedor}>
                        <SelectTrigger className="h-8 text-[11px] bg-white/50 dark:bg-gray-950/50 border-white/20 dark:border-white/10 font-bold rounded-lg shadow-sm focus:ring-orange-500/20 transition-all">
                          <div className="flex items-center gap-2">
                            <Building2 className="h-3.5 w-3.5 text-orange-500" />
                            <SelectValue placeholder="Selecione" />
                          </div>
                        </SelectTrigger>
                        <SelectContent className="bg-white/95 dark:bg-gray-950/95 backdrop-blur-2xl border-white/20 dark:border-white/10 rounded-xl shadow-2xl">
                          {suppliers.map(s => <SelectItem key={s.id} value={s.id} className="font-bold py-1.5 px-3 text-[11px]">{s.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-[9px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em] pl-1">Data Entrega</Label>
                      <div className="relative group">
                        <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 group-hover:text-orange-500 transition-colors pointer-events-none" />
                        <Input 
                          type="date" 
                          value={dataEntrega} 
                          onChange={e => setDataEntrega(e.target.value)} 
                          className="h-8 text-[11px] pl-8 bg-white/50 dark:bg-gray-950/50 border-white/20 dark:border-white/10 font-bold rounded-lg shadow-sm focus:ring-orange-500/20 transition-all" 
                        />
                      </div>
                    </div>

                    {/* Formulário de Adicionar Produto */}
                    <div className="space-y-1 bg-white/40 dark:bg-gray-900/40 p-2.5 rounded-xl border border-white/20 dark:border-white/5 shadow-sm">
                      <Label className="text-[9px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em] pl-1 text-orange-500">Adicionar Produto</Label>
                      
                      {/* Product Search */}
                      <div className="relative group mb-1.5">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 group-focus-within:text-orange-500 transition-colors" />
                        <Input
                          ref={newProductInputRef}
                          placeholder="Buscar produto..."
                          value={newProductSearch}
                          onChange={(e) => { setNewProductSearch(e.target.value); setNewProduct(null); }}
                          onKeyDown={(e) => handleNewItemKeyDown(e, 'search')}
                          onFocus={() => setHighlightedIndex(-1)}
                          className="h-8 pl-8 text-[11px] bg-white/50 dark:bg-gray-950/50 border-white/20 dark:border-white/10 font-bold rounded-lg focus:ring-orange-500/20 shadow-sm"
                        />
                        {/* Dropdown */}
                        {filteredNewProducts.length > 0 && !newProduct && (
                          <div className="absolute z-50 w-full mt-1 bg-white/95 dark:bg-gray-950/95 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-xl shadow-xl max-h-48 overflow-auto custom-scrollbar animate-in fade-in slide-in-from-top-1">
                            {filteredNewProducts.map((p, idx) => (
                              <button
                                key={p.id}
                                onClick={() => { setNewProduct(p); setNewProductSearch(p.name); newQuantityInputRef.current?.focus(); }}
                                onMouseEnter={() => setHighlightedIndex(idx)}
                                className={cn(
                                  "w-full px-3 py-1.5 text-left text-[10px] flex items-center gap-2 transition-all border-b border-white/5 last:border-none group/btn",
                                  idx === highlightedIndex ? "bg-orange-500/10 text-orange-600 dark:text-orange-400" : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5"
                                )}
                              >
                                <div className={cn("w-4 h-4 rounded flex items-center justify-center transition-all", idx === highlightedIndex ? "bg-orange-500 text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-400")}>
                                  <Package className="h-2.5 w-2.5" />
                                </div>
                                <span className="font-bold truncate">{p.name}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-2 mb-2">
                        <div className="space-y-0.5">
                           <Label className="text-[8px] font-black text-gray-400 uppercase tracking-widest pl-1">Qtd</Label>
                           <Input
                             ref={newQuantityInputRef}
                             type="number"
                             placeholder="1"
                             value={newQuantity}
                             onChange={(e) => setNewQuantity(e.target.value)}
                             onKeyDown={(e) => handleNewItemKeyDown(e, 'quantity')}
                             className="h-8 text-[11px] bg-white/50 dark:bg-gray-950/50 border-white/20 dark:border-white/10 font-black text-center rounded-lg shadow-sm"
                           />
                        </div>
                        <div className="space-y-0.5">
                           <Label className="text-[8px] font-black text-gray-400 uppercase tracking-widest pl-1">Preço</Label>
                           <div className="relative">
                             <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[9px] font-black text-emerald-600 opacity-50">R$</span>
                             <Input
                               ref={newPriceInputRef}
                               placeholder="0,00"
                               value={newPrice}
                               onChange={(e) => setNewPrice(e.target.value)}
                               onKeyDown={(e) => handleNewItemKeyDown(e, 'price')}
                               className="h-8 pl-6 text-[11px] bg-white/50 dark:bg-gray-950/50 border-white/20 dark:border-white/10 font-black rounded-lg shadow-sm"
                             />
                           </div>
                        </div>
                      </div>
                      
                      <Button 
                        ref={addItemButtonRef}
                        onClick={handleAddNewItem}
                        className="w-full h-8 bg-orange-600 hover:bg-orange-700 text-white font-black text-[9px] uppercase tracking-widest shadow-md rounded-lg active:scale-95 transition-all"
                      >
                        <Plus className="h-3 w-3 mr-1.5" /> Adicionar
                      </Button>
                    </div>
                  </div>

                  <div className="flex-1 flex flex-col space-y-1">
                    <div className="flex items-center gap-2 pl-1">
                      <FileText className="h-3.5 w-3.5 text-orange-500" />
                      <Label className="text-[9px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em]">Observações</Label>
                    </div>
                    <Textarea
                      placeholder="Adicione notas..."
                      value={observacoes}
                      onChange={e => setObservacoes(e.target.value)}
                      className="flex-1 w-full min-h-[60px] resize-none text-[11px] bg-white/50 dark:bg-gray-950/50 border-white/20 dark:border-white/10 font-medium rounded-lg focus:ring-orange-500/20 transition-all shadow-sm p-2"
                    />
                  </div>
              </div>

              {/* Coluna Direita: Lista de Itens (Ocupa mais espaço) */}
              <div className="flex-1 flex flex-col bg-white/20 dark:bg-gray-950/20 overflow-hidden relative">
                 <div className="flex-shrink-0 px-3 py-2 bg-white/40 dark:bg-white/5 border-b border-white/10 backdrop-blur-md">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-black text-gray-600 dark:text-gray-300 uppercase tracking-widest">Itens do Pedido</span>
                    <Badge variant="outline" className="h-3.5 px-1 text-[7px] font-black bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 rounded">
                      {itens.length}
                    </Badge>
                  </div>
                </div>
                
                <ScrollArea className="flex-1 custom-scrollbar">
                  <div className="p-1 space-y-0.5">
                    {itens.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center py-10 opacity-50">
                        <Package className="h-5 w-5 opacity-30 mb-1" />
                        <p className="text-[8px] font-black uppercase tracking-widest opacity-50">Lista vazia</p>
                      </div>
                    ) : (
                      <div className="space-y-0.5">
                        {itens.map((item, index) => (
                          <div key={index} className="flex items-center gap-1 p-0.5 bg-white/80 dark:bg-gray-900/80 rounded border border-white/10 dark:border-white/5 hover:border-orange-500/20 transition-all group relative">
                            <div className="flex-1 grid grid-cols-12 gap-1 items-center">
                              {/* Produto */}
                              <div className="col-span-5 relative">
                                <Input
                                  ref={el => productInputRefs.current[index] = el}
                                  placeholder="Produto..."
                                  value={item.produto}
                                  onChange={e => { 
                                    handleItemChange(index, 'produto', e.target.value); 
                                    setProductSearch(e.target.value);
                                    setActiveSearchIndex(index);
                                  }}
                                  onFocus={() => setActiveSearchIndex(index)}
                                  onKeyDown={e => handleItemKeyDown(e, index, 'produto')}
                                  className="h-5 text-[10px] bg-transparent border-transparent focus:bg-white/50 dark:focus:bg-gray-950/50 font-bold rounded px-1 shadow-none focus:border-white/10"
                                />
                                {activeSearchIndex === index && productSearch && filteredProducts.length > 0 && (
                                  <div className="absolute z-50 w-full mt-1 bg-white/95 dark:bg-gray-950/95 backdrop-blur-2xl border border-white/20 dark:border-white/10 rounded shadow-xl max-h-40 overflow-auto custom-scrollbar">
                                    {filteredProducts.map((p) => (
                                      <button 
                                        key={p.id} 
                                        onClick={() => { 
                                          handleItemChange(index, 'produto', p.name); 
                                          setProductSearch(''); 
                                          setActiveSearchIndex(null);
                                          setTimeout(() => quantityInputRefs.current[index]?.focus(), 50);
                                        }}
                                        className="w-full px-2 py-1 text-left text-[9px] hover:bg-orange-500/10 text-gray-900 dark:text-white flex items-center gap-1 transition-all font-bold"
                                      >
                                        {p.name}
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>

                              {/* Quantidade */}
                              <div className="col-span-2 flex gap-0.5">
                                <Input 
                                  ref={el => quantityInputRefs.current[index] = el}
                                  type="number" 
                                  value={item.quantidade || ''} 
                                  onChange={e => handleItemChange(index, 'quantidade', parseFloat(e.target.value) || 0)} 
                                  onKeyDown={e => handleItemKeyDown(e, index, 'quantidade')}
                                  className="h-5 text-[10px] bg-transparent border-transparent focus:bg-white/50 dark:focus:bg-gray-950/50 font-black rounded text-center px-0.5 shadow-none" 
                                />
                                <Select value={item.unidade} onValueChange={v => handleItemChange(index, 'unidade', v)}>
                                  <SelectTrigger className="h-5 w-10 text-[8px] bg-transparent border-transparent focus:bg-white/50 dark:focus:bg-gray-950/50 font-black rounded uppercase px-0.5 shadow-none"><SelectValue /></SelectTrigger>
                                  <SelectContent className="bg-white/95 dark:bg-gray-950/95 border-white/20 rounded">
                                    {["un", "kg", "cx", "pc", "L", "dz", "pct", "g", "ml"].map(u => (
                                      <SelectItem key={u} value={u} className="font-black uppercase text-[9px]">{u}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>

                              {/* Preço */}
                              <div className="col-span-2 relative">
                                <span className="absolute left-1 top-1/2 -translate-y-1/2 text-[8px] font-black text-emerald-600 opacity-50">R$</span>
                                <Input 
                                  ref={el => priceInputRefs.current[index] = el}
                                  type="number" 
                                  step="0.01"
                                  value={item.valorUnitario || ''} 
                                  onChange={e => handleItemChange(index, 'valorUnitario', parseFloat(e.target.value) || 0)} 
                                  onKeyDown={e => handleItemKeyDown(e, index, 'preco')}
                                  className="h-5 pl-4 text-[10px] bg-transparent border-transparent focus:bg-white/50 dark:focus:bg-gray-950/50 font-black rounded shadow-none" 
                                />
                              </div>

                              {/* Subtotal */}
                              <div className="col-span-2 text-right">
                                <p className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
                                  {(item.quantidade * item.valorUnitario).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </p>
                              </div>

                              {/* Remover */}
                              <div className="col-span-1 flex justify-end">
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  onClick={() => handleRemoveItem(index)} 
                                  className="h-4 w-4 text-gray-400 hover:text-red-500 hover:bg-transparent p-0 rounded-none transition-all"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </ScrollArea>

                {/* Total Footer Ultra Compacto */}
                <div className="flex-shrink-0 px-3 py-1 bg-white/40 dark:bg-black/20 border-t border-white/10 backdrop-blur-md">
                  <div className="flex items-center justify-between">
                    <span className="text-[8px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">Total</span>
                    <div className="flex items-baseline gap-0.5">
                      <span className="text-[10px] font-black text-emerald-600/70 uppercase">R$</span>
                      <span className="text-sm font-black text-gray-900 dark:text-white tracking-tighter">
                        {calculateTotal().toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Tab: Resumo (Visualização) */}
          <TabsContent value="resumo" className="flex-1 m-0 p-0 overflow-hidden outline-none data-[state=active]:flex data-[state=active]:flex-col">
            <ScrollArea className="flex-1">
              <div className="p-4 space-y-4 pb-16 pt-2">
                {/* Cards de resumo com design semiglass */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="bg-orange-500/5 dark:bg-orange-900/10 rounded-xl p-3 border border-orange-500/20 dark:border-orange-800/30 backdrop-blur-md shadow-sm">
                  <div className="flex items-center gap-1.5 text-orange-600 dark:text-orange-400 mb-1">
                    <Building2 className="h-3 w-3" />
                    <span className="text-[8px] font-black uppercase tracking-widest opacity-70">Fornecedor</span>
                  </div>
                  <p className="font-black text-[10px] truncate text-gray-900 dark:text-white">{selectedSupplier?.name || pedido?.fornecedor || '-'}</p>
                </div>
                <div className="bg-blue-500/5 dark:bg-blue-900/10 rounded-xl p-3 border border-blue-500/20 dark:border-blue-800/30 backdrop-blur-md shadow-sm">
                  <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 mb-1">
                    <Calendar className="h-3 w-3" />
                    <span className="text-[8px] font-black uppercase tracking-widest opacity-70">Entrega</span>
                  </div>
                  <p className="font-black text-[10px] text-gray-900 dark:text-white">{formatDate(dataEntrega || pedido?.dataEntrega)}</p>
                </div>
                <div className="bg-purple-500/5 dark:bg-purple-900/10 rounded-xl p-3 border border-purple-500/20 dark:border-purple-800/30 backdrop-blur-md shadow-sm">
                  <div className="flex items-center gap-1.5 text-purple-600 dark:text-purple-400 mb-1">
                    <Package className="h-3 w-3" />
                    <span className="text-[8px] font-black uppercase tracking-widest opacity-70">Itens</span>
                  </div>
                  <p className="font-black text-[10px] text-gray-900 dark:text-white">{itens.length} produto(s)</p>
                </div>
                <div className="bg-emerald-500/5 dark:bg-emerald-900/10 rounded-xl p-3 border border-emerald-500/20 dark:border-emerald-800/30 backdrop-blur-md shadow-sm">
                  <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 mb-1">
                    <DollarSign className="h-3 w-3" />
                    <span className="text-[8px] font-black uppercase tracking-widest opacity-70">Total</span>
                  </div>
                  <p className="font-black text-[10px] text-emerald-700 dark:text-emerald-400">R$ {calculateTotal().toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                </div>
              </div>

              {/* Lista de itens resumida com design semiglass */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 px-1">
                  <ClipboardList className="h-3.5 w-3.5 text-orange-500" />
                  <span className="text-[9px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">Detalhamento de Itens</span>
                </div>
                <div className="bg-white/40 dark:bg-gray-950/40 rounded-xl border border-gray-100 dark:border-gray-800/50 overflow-hidden backdrop-blur-xl shadow-sm">
                  <div className="max-h-[300px] overflow-auto custom-scrollbar divide-y divide-gray-100 dark:divide-gray-800/50">
                    {itens.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-8 gap-2 opacity-30">
                        <Package className="h-8 w-8" />
                        <p className="text-[10px] font-black uppercase tracking-widest">Nenhum item</p>
                      </div>
                    ) : itens.map((item, index) => (
                      <div key={index} className="flex items-center justify-between px-3 py-2 hover:bg-gray-50/50 dark:hover:bg-white/5 transition-all group">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <div className="w-6 h-6 rounded-lg bg-orange-500/10 flex items-center justify-center flex-shrink-0 border border-orange-500/10">
                            <Package className="h-3 w-3 text-orange-500" />
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="text-[10px] truncate text-gray-900 dark:text-white font-bold">{item.produto || 'Não definido'}</span>
                            <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">{item.unidade} • Unid. R$ {item.valorUnitario.toFixed(2)}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <div className="flex flex-col items-end">
                            <span className="text-[8px] font-black text-gray-400 uppercase tracking-tighter">{item.quantidade}x</span>
                            <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400">R$ {(item.quantidade * item.valorUnitario).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Observações com design semiglass */}
              {observacoes && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 px-1">
                    <FileText className="h-3.5 w-3.5 text-orange-500" />
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Notas do Pedido</span>
                  </div>
                  <div className="bg-white/40 dark:bg-gray-900/40 rounded-xl p-3 border border-gray-100 dark:border-gray-800/50 backdrop-blur-md shadow-sm">
                    <p className="text-[10px] text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-medium leading-relaxed">{observacoes}</p>
                  </div>
                </div>
              )}

              {/* Status atual centralizado */}
              <div className="flex flex-col items-center justify-center gap-2 py-3 border-t border-gray-100 dark:border-gray-800/50">
                <span className="text-[8px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">Status do Pedido</span>
                <div className="transform scale-90">
                  {getStatusBadge(status || pedido?.status || 'pendente')}
                </div>
              </div>
            </div>
          </ScrollArea>
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

        {/* Footer Compacto */}
        <div className="flex-shrink-0 px-4 py-3 border-t border-white/20 dark:border-white/10 bg-white/40 dark:bg-gray-950/40 backdrop-blur-2xl relative overflow-hidden flex items-center justify-end gap-2">
          <div className="absolute inset-0 bg-gradient-to-t from-orange-500/5 to-transparent pointer-events-none"></div>
          
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)} 
            disabled={loading} 
            className="h-8 px-4 border-white/30 dark:border-white/10 bg-white/5 dark:bg-white/5 font-black text-[9px] uppercase tracking-widest rounded-lg hover:bg-white/10 transition-all shadow-sm relative z-10"
          >
            Cancelar
          </Button>

          <Button 
            onClick={handleSubmit} 
            disabled={loading} 
            className="h-8 px-6 bg-orange-600 hover:bg-orange-700 text-white font-black uppercase text-[9px] tracking-widest shadow-md shadow-orange-500/10 rounded-lg transition-all active:scale-[0.98] ring-1 ring-white/20 relative z-10"
          >
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <Save className="h-3.5 w-3.5 mr-1.5" />}
            Salvar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
