import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { AnimatedTabContent } from "@/components/ui/animated-tabs";
import { useDebounce } from "@/hooks/useDebounce";
import { useIsMobile } from "@/hooks/use-mobile";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerFooter, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, ShoppingCart, Package, Building2, CheckCircle, ChevronRight, ChevronLeft, 
  FileText, X, Search, Trash2, Copy, Calendar, DollarSign, Loader2, AlertCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { useActivityLog } from "@/hooks/useActivityLog";
import { parseDecimalInput } from "@/lib/text-utils";
import { cn } from "@/lib/utils";

interface PedidoItem {
  produto: string;
  quantidade: number;
  unidade: string;
  valorUnitario: number;
}

interface AddPedidoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (pedido: any) => void;
  preSelectedProducts?: any[];
}

export default function AddPedidoDialog({ open, onOpenChange, onAdd, preSelectedProducts = [] }: AddPedidoDialogProps) {
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const { user } = useAuth();
  const { logActivity } = useActivityLog();
  
  // Form states
  const [fornecedor, setFornecedor] = useState("");
  const [dataEntrega, setDataEntrega] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [itens, setItens] = useState<PedidoItem[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Data states
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  
  // Search states
  const [productSearch, setProductSearch] = useState("");
  const [supplierSearch, setSupplierSearch] = useState("");
  const [highlightedProductIndex, setHighlightedProductIndex] = useState(-1);
  const debouncedProductSearch = useDebounce(productSearch, 300);
  const debouncedSupplierSearch = useDebounce(supplierSearch, 300);

  // Step system
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [newProductQuantity, setNewProductQuantity] = useState("");
  const [newProductUnit, setNewProductUnit] = useState("un");
  const [newProductPrice, setNewProductPrice] = useState("");
  const [lastUsedPrices, setLastUsedPrices] = useState<Record<string, number>>({});

  // Refs para navegação por teclado
  const productSearchRef = useRef<HTMLInputElement>(null);
  const quantityInputRef = useRef<HTMLInputElement>(null);
  const priceInputRef = useRef<HTMLInputElement>(null);
  const addButtonRef = useRef<HTMLButtonElement>(null);
  const supplierSearchRef = useRef<HTMLInputElement>(null);
  const productListRef = useRef<HTMLDivElement>(null);

  const steps = [
    { id: 0, title: "Produtos", icon: Package, description: "Adicione os produtos do pedido" },
    { id: 1, title: "Fornecedor", icon: Building2, description: "Selecione o fornecedor" },
    { id: 2, title: "Finalizar", icon: CheckCircle, description: "Revise e confirme" }
  ];

  // Load data when dialog opens
  useEffect(() => {
    if (open) {
      resetForm();
      loadSuppliers();
      loadLastPrices();
      if (preSelectedProducts.length > 0) {
        const preSelectedItems: PedidoItem[] = preSelectedProducts.map(p => ({
          produto: p.product_name,
          quantidade: p.quantity,
          unidade: p.unit,
          valorUnitario: p.estimated_price || 0,
        }));
        setItens(preSelectedItems);
        setCurrentStep(1);
      } else {
        // Auto-foco no campo de busca de produto
        setTimeout(() => {
          productSearchRef.current?.focus();
        }, 300);
      }
    }
  }, [open]);

  // Auto-foco quando muda de step
  useEffect(() => {
    if (open) {
      setTimeout(() => {
        if (currentStep === 0) {
          productSearchRef.current?.focus();
        } else if (currentStep === 1) {
          supplierSearchRef.current?.focus();
        }
      }, 100);
    }
  }, [currentStep, open]);

  useEffect(() => {
    if (open && products.length === 0 && !productsLoading) {
      loadProducts();
    }
  }, [open]);

  const resetForm = () => {
    setCurrentStep(0);
    setFornecedor("");
    setDataEntrega("");
    setObservacoes("");
    setSelectedProduct(null);
    setNewProductQuantity("");
    setNewProductUnit("un");
    setNewProductPrice("");
    setProductSearch("");
    setSupplierSearch("");
    setItens([]);
  };

  const loadSuppliers = async () => {
    const { data } = await supabase.from('suppliers').select('id, name, contact').order('name');
    setSuppliers(data || []);
  };

  const loadLastPrices = async () => {
    const { data } = await supabase.from('order_items').select('product_id, unit_price').limit(100);
    if (data) {
      const pricesMap: Record<string, number> = {};
      data.forEach((item: any) => { if (!pricesMap[item.product_id]) pricesMap[item.product_id] = item.unit_price; });
      setLastUsedPrices(pricesMap);
    }
  };

  const loadProducts = async () => {
    setProductsLoading(true);
    try {
      const { count } = await supabase.from('products').select('*', { count: 'exact', head: true });
      if (!count) { setProducts([]); return; }
      
      const pageSize = 1000;
      const allProducts: any[] = [];
      for (let page = 0; page < Math.ceil(count / pageSize); page++) {
        const { data } = await supabase.from('products').select('id, name').order('name').range(page * pageSize, (page + 1) * pageSize - 1);
        if (data) allProducts.push(...data);
      }
      setProducts(allProducts);
    } catch (error) {
      toast({ title: "Erro", description: "Não foi possível carregar produtos", variant: "destructive" });
    } finally {
      setProductsLoading(false);
    }
  };

  const filteredProducts = useMemo(() => {
    if (!debouncedProductSearch || debouncedProductSearch.trim().length < 2) return [];
    return products.filter(p => p.name.toLowerCase().includes(debouncedProductSearch.toLowerCase())).slice(0, 30);
  }, [products, debouncedProductSearch]);

  // Reset highlighted index when search changes
  useEffect(() => {
    setHighlightedProductIndex(-1);
  }, [debouncedProductSearch]);

  // Scroll para o item destacado quando navegar com setas
  useEffect(() => {
    if (highlightedProductIndex >= 0 && productListRef.current) {
      const listElement = productListRef.current;
      const highlightedElement = listElement.children[highlightedProductIndex] as HTMLElement;
      if (highlightedElement) {
        highlightedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [highlightedProductIndex]);

  const filteredSuppliers = useMemo(() => {
    if (!debouncedSupplierSearch) return suppliers;
    return suppliers.filter(s => s.name.toLowerCase().includes(debouncedSupplierSearch.toLowerCase()));
  }, [suppliers, debouncedSupplierSearch]);

  const handleAddProduct = () => {
    if (!selectedProduct || !newProductQuantity || !newProductPrice) {
      toast({ title: "Erro", description: "Preencha todos os campos", variant: "destructive" });
      return;
    }
    const quantidade = parseDecimalInput(newProductQuantity);
    const preco = parseFloat(newProductPrice.replace(',', '.'));
    if (!quantidade || quantidade <= 0 || !preco || preco <= 0) {
      toast({ title: "Erro", description: "Valores inválidos", variant: "destructive" });
      return;
    }
    
    setItens([...itens, { produto: selectedProduct.name, quantidade, unidade: newProductUnit, valorUnitario: preco }]);
    setLastUsedPrices({ ...lastUsedPrices, [selectedProduct.id]: preco });
    setSelectedProduct(null);
    setNewProductQuantity("");
    setNewProductPrice("");
    setProductSearch("");
    toast({ title: "Produto adicionado", duration: 1500 });
    
    // Auto-foco no campo de busca para continuar adicionando
    setTimeout(() => {
      productSearchRef.current?.focus();
    }, 50);
  };

  // Função para selecionar produto da lista
  const selectProductFromList = (product: any) => {
    setSelectedProduct(product);
    setProductSearch("");
    setHighlightedProductIndex(-1);
    if (lastUsedPrices[product.id]) {
      setNewProductPrice(lastUsedPrices[product.id].toString());
    }
    // Auto-foco no campo de quantidade
    setTimeout(() => {
      quantityInputRef.current?.focus();
      quantityInputRef.current?.select();
    }, 50);
  };

  // Handler para navegação por teclado nos campos de produto
  const handleProductKeyDown = useCallback((e: React.KeyboardEvent, field: 'search' | 'quantity' | 'price') => {
    if (field === 'search' && filteredProducts.length > 0 && !selectedProduct) {
      // Navegação por setas na lista de produtos
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setHighlightedProductIndex(prev => 
          prev < filteredProducts.length - 1 ? prev + 1 : 0
        );
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHighlightedProductIndex(prev => 
          prev > 0 ? prev - 1 : filteredProducts.length - 1
        );
        return;
      }
      // Enter seleciona o produto destacado
      if (e.key === 'Enter' && highlightedProductIndex >= 0) {
        e.preventDefault();
        selectProductFromList(filteredProducts[highlightedProductIndex]);
        return;
      }
      // Escape fecha a lista
      if (e.key === 'Escape') {
        e.preventDefault();
        setProductSearch("");
        setHighlightedProductIndex(-1);
        return;
      }
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      
      if (field === 'search') {
        // Se tem produto selecionado, vai para quantidade
        if (selectedProduct) {
          quantityInputRef.current?.focus();
          quantityInputRef.current?.select();
        }
      } else if (field === 'quantity') {
        // Vai para preço
        priceInputRef.current?.focus();
        priceInputRef.current?.select();
      } else if (field === 'price') {
        // Tenta adicionar o produto
        if (selectedProduct && newProductQuantity && newProductPrice) {
          handleAddProduct();
        }
      }
    }
  }, [selectedProduct, newProductQuantity, newProductPrice, filteredProducts, highlightedProductIndex]);

  const handleRemoveItem = (index: number) => setItens(itens.filter((_, i) => i !== index));
  const handleDuplicateItem = (index: number) => { setItens([...itens, { ...itens[index] }]); toast({ title: "Produto duplicado", duration: 1500 }); };
  const calculateTotal = () => itens.reduce((acc, item) => acc + item.quantidade * item.valorUnitario, 0);

  const canProceed = () => {
    if (currentStep === 0) return itens.length > 0;
    if (currentStep === 1) return fornecedor && dataEntrega;
    return true;
  };

  const handleSubmit = async () => {
    if (!user || !fornecedor || !dataEntrega || itens.length === 0) return;
    
    setLoading(true);
    try {
      const total = calculateTotal();
      const selectedSupplier = suppliers.find(s => s.id === fornecedor);
      const { data: companyData } = await supabase.from("company_users").select("company_id").eq("user_id", user.id).single();
      if (!companyData) throw new Error("Empresa não encontrada");

      const { data: order, error: orderError } = await supabase.from('orders').insert({
        company_id: companyData.company_id,
        supplier_id: fornecedor,
        supplier_name: selectedSupplier?.name || '',
        total_value: total,
        status: 'pendente',
        delivery_date: dataEntrega,
        observations: observacoes
      }).select().single();
      
      if (orderError) throw orderError;

      const orderItems = itens.map(item => {
        const product = products.find(p => p.name === item.produto);
        return {
          order_id: order.id,
          product_id: product?.id || null,
          product_name: item.produto,
          quantity: item.quantidade,
          unit_price: item.valorUnitario,
          total_price: item.quantidade * item.valorUnitario,
          unit: item.unidade
        };
      });
      
      await supabase.from('order_items').insert(orderItems);
      await logActivity({ tipo: "pedido", acao: "Pedido criado", detalhes: `Pedido para ${selectedSupplier?.name} - R$ ${total.toFixed(2)}`, valor: total });
      
      toast({ title: "Pedido criado com sucesso!" });
      onAdd(order);
      onOpenChange(false);
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // Handler para atalhos globais do modal
  const handleModalKeyDown = useCallback((e: React.KeyboardEvent) => {
    // Ctrl+Enter para criar pedido (no último step)
    if (e.ctrlKey && e.key === 'Enter' && currentStep === 2) {
      e.preventDefault();
      handleSubmit();
    }
    
    // Alt+Setas para navegar entre steps
    if (e.altKey && e.key === 'ArrowRight' && canProceed() && currentStep < 2) {
      e.preventDefault();
      setCurrentStep(currentStep + 1);
    }
    if (e.altKey && e.key === 'ArrowLeft' && currentStep > 0) {
      e.preventDefault();
      setCurrentStep(currentStep - 1);
    }
    
    // Alt+N para focar no campo de produto (step 0)
    if (e.altKey && e.key === 'n' && currentStep === 0) {
      e.preventDefault();
      productSearchRef.current?.focus();
    }
    
    // Números 1-3 com Alt para ir direto para o step
    if (e.altKey && ['1', '2', '3'].includes(e.key)) {
      e.preventDefault();
      const stepIndex = parseInt(e.key) - 1;
      if (stepIndex <= currentStep || (stepIndex === currentStep + 1 && canProceed())) {
        setCurrentStep(stepIndex);
      }
    }
  }, [currentStep]);


  // Conteúdo interno do modal (compartilhado entre Dialog e Drawer)
  const modalInnerContent = (
    <>
      {/* Header com design semiglass */}
      <div className="flex-shrink-0 px-8 py-6 border-b border-white/10 dark:border-white/5 bg-white/30 dark:bg-white/5 backdrop-blur-md relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-gray-500/10 to-transparent pointer-events-none"></div>
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center text-white shadow-xl shadow-gray-500/20 ring-1 ring-white/20">
              <ShoppingCart className="h-7 w-7" />
            </div>
            <div className="space-y-1">
              <DialogTitle className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                Novo Pedido
              </DialogTitle>
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-gray-500 animate-pulse" />
                <DialogDescription className="text-[10px] text-gray-500 dark:text-gray-400 font-black uppercase tracking-[0.2em]">
                  Etapa {currentStep + 1} de {steps.length} • {steps[currentStep].title}
                </DialogDescription>
              </div>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => onOpenChange(false)} 
            className="h-12 w-12 text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/20 dark:hover:bg-white/10 rounded-2xl transition-all border border-transparent hover:border-white/20 shadow-sm"
          >
            <X className="h-6 w-6" />
          </Button>
        </div>
        
        {/* Steps indicator elegante Semiglass */}
        <div className="flex items-center gap-2 mt-6 relative z-10 bg-white/10 dark:bg-white/5 p-1.5 rounded-[1.25rem] border border-white/10 dark:border-white/5 backdrop-blur-sm">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center flex-1">
              <button
                onClick={() => index < currentStep && setCurrentStep(index)}
                disabled={index > currentStep}
                className={cn(
                  "flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-[10px] font-black transition-all w-full uppercase tracking-widest",
                  index < currentStep ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 cursor-pointer hover:bg-emerald-500/20" :
                  index === currentStep ? "bg-white/40 dark:bg-white/10 text-gray-900 dark:text-white shadow-sm border border-white/20" :
                  "text-gray-400 dark:text-gray-600 cursor-not-allowed"
                )}
              >
                {index < currentStep ? <CheckCircle className="h-4 w-4" /> : <step.icon className="h-4 w-4" />}
                <span className={isMobile ? 'hidden' : 'sm:inline'}>{step.title}</span>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-500/5 to-transparent pointer-events-none"></div>
        <AnimatedTabContent
          value={String(currentStep)}
          activeTab={String(currentStep)}
          className="h-full relative z-10"
        >
              {/* Step 0: Produtos */}
              {currentStep === 0 && (
                <div className="h-full flex flex-col p-8">
                  {/* Formulário de adicionar produto Semiglass */}
                  <div className="bg-white/40 dark:bg-gray-900/40 rounded-[2rem] p-8 mb-6 border border-white/40 dark:border-white/10 backdrop-blur-xl shadow-xl shadow-gray-500/5 ring-1 ring-white/20">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                      <div className="md:col-span-2 space-y-3">
                        <Label className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em] pl-1">Produto</Label>
                        <div className="relative group">
                          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-orange-500 transition-colors" />
                          <Input
                            ref={productSearchRef}
                            placeholder="Digite para buscar..."
                            value={selectedProduct ? selectedProduct.name : productSearch}
                            onChange={(e) => { setProductSearch(e.target.value); setSelectedProduct(null); }}
                            onKeyDown={(e) => handleProductKeyDown(e, 'search')}
                            className="h-14 pl-12 bg-white/60 dark:bg-gray-950/60 border-white/40 dark:border-white/10 font-black text-sm rounded-2xl focus:ring-orange-500/20 transition-all shadow-sm"
                            tabIndex={0}
                          />
                          {filteredProducts.length > 0 && !selectedProduct && (
                            <div 
                              ref={productListRef}
                              className="absolute z-50 w-full mt-2 bg-white/80 dark:bg-gray-950/80 backdrop-blur-2xl border border-white/30 dark:border-white/10 rounded-2xl shadow-2xl max-h-64 overflow-auto animate-in fade-in slide-in-from-top-2"
                            >
                              {filteredProducts.map((p, index) => (
                                <button
                                  key={p.id}
                                  onClick={() => selectProductFromList(p)}
                                  onMouseEnter={() => setHighlightedProductIndex(index)}
                                  className={cn(
                                    "w-full px-5 py-4 text-left text-sm flex items-center gap-4 transition-all border-b border-white/5 last:border-none",
                                    highlightedProductIndex === index 
                                      ? "bg-orange-500/10 text-orange-700 dark:text-orange-400" 
                                      : "hover:bg-white/10 dark:hover:bg-white/5"
                                  )}
                                >
                                  <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center transition-all", highlightedProductIndex === index ? "bg-orange-500 text-white shadow-lg" : "bg-gray-500/10 text-gray-400")}>
                                    <Package className="h-5 w-5" />
                                  </div>
                                  <span className="font-black tracking-tight">{p.name}</span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="space-y-3">
                        <Label className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em] pl-1">Quantidade</Label>
                        <Input
                          ref={quantityInputRef}
                          type="number"
                          placeholder="0"
                          value={newProductQuantity}
                          onChange={(e) => setNewProductQuantity(e.target.value)}
                          onKeyDown={(e) => handleProductKeyDown(e, 'quantity')}
                          className="h-14 bg-white/60 dark:bg-gray-950/60 border-white/40 dark:border-white/10 font-black text-center text-lg rounded-2xl focus:ring-orange-500/20 transition-all shadow-sm"
                          tabIndex={0}
                        />
                      </div>
                      <div className="space-y-3">
                        <Label className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em] pl-1">Preço Unit.</Label>
                        <div className="relative group">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-600 font-black text-sm">R$</span>
                          <Input
                            ref={priceInputRef}
                            type="text"
                            placeholder="0,00"
                            value={newProductPrice}
                            onChange={(e) => setNewProductPrice(e.target.value)}
                            onKeyDown={(e) => handleProductKeyDown(e, 'price')}
                            className="h-14 pl-12 bg-white/60 dark:bg-gray-950/60 border-white/40 dark:border-white/10 font-black text-lg rounded-2xl focus:ring-emerald-500/20 transition-all shadow-sm"
                            tabIndex={0}
                          />
                        </div>
                      </div>
                    </div>
                    <Button 
                      ref={addButtonRef} 
                      onClick={handleAddProduct} 
                      disabled={!selectedProduct} 
                      className="mt-8 w-full h-14 bg-gradient-to-r from-orange-600 via-amber-600 to-orange-600 hover:from-orange-700 hover:to-amber-700 text-white font-black uppercase text-[10px] tracking-[0.2em] shadow-xl shadow-orange-500/20 rounded-2xl transition-all active:scale-95 ring-2 ring-white/20 relative overflow-hidden group"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:animate-shimmer pointer-events-none"></div>
                      <Plus className="h-5 w-5 mr-3" /> Adicionar Produto (Enter)
                    </Button>
                  </div>

                  {/* Lista de itens Semiglass */}
                  <div className="flex-1 min-h-0 flex flex-col">
                    <div className="flex items-center justify-between mb-4 px-1">
                      <span className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em]">Itens do Pedido ({itens.length})</span>
                      <Badge variant="outline" className="h-8 px-4 bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20 font-black text-[10px] uppercase tracking-widest rounded-full ring-1 ring-orange-500/20 shadow-sm">
                        Total: R$ {calculateTotal().toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </Badge>
                    </div>
                    <ScrollArea className="flex-1 border border-white/20 dark:border-white/10 rounded-[2rem] bg-white/20 dark:bg-gray-950/20 backdrop-blur-xl shadow-inner custom-scrollbar">
                      {itens.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-24 text-gray-400">
                          <div className="w-20 h-20 rounded-3xl bg-gray-500/5 flex items-center justify-center mb-6 border border-white/10">
                            <Package className="h-10 w-10 opacity-20" />
                          </div>
                          <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40">Nenhum produto adicionado</p>
                          <p className="text-[9px] font-bold opacity-30 mt-2 uppercase tracking-widest">Use o formulário acima para começar</p>
                        </div>
                      ) : (
                        <div className="p-6 space-y-3">
                          {itens.map((item, index) => (
                            <div key={index} className="flex items-center gap-4 p-4 bg-white/40 dark:bg-gray-900/40 rounded-2xl border border-white/40 dark:border-white/10 hover:border-orange-500/40 transition-all group shadow-sm ring-1 ring-transparent hover:ring-white/20">
                              <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20 group-hover:scale-110 group-hover:shadow-lg transition-all flex-shrink-0">
                                <Package className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-black text-base text-gray-900 dark:text-white truncate tracking-tight">{item.produto}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge variant="secondary" className="h-5 px-2 text-[9px] font-black bg-orange-500/10 text-orange-600 dark:text-orange-400 border-none rounded-md">
                                    {item.quantidade} {item.unidade}
                                  </Badge>
                                  <span className="text-[10px] font-black text-gray-400">×</span>
                                  <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400">R$ {item.valorUnitario.toFixed(2)}</span>
                                </div>
                              </div>
                              <div className="text-right flex flex-col items-end">
                                <p className="font-black text-emerald-600 dark:text-emerald-400 text-base tracking-tight">R$ {(item.quantidade * item.valorUnitario).toFixed(2)}</p>
                                <div className="flex gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-all">
                                  <Button variant="ghost" size="icon" onClick={() => handleDuplicateItem(index)} className="h-8 w-8 text-gray-400 hover:text-blue-600 hover:bg-blue-500/10 rounded-lg">
                                    <Copy className="h-4 w-4" />
                                  </Button>
                                  <Button variant="ghost" size="icon" onClick={() => handleRemoveItem(index)} className="h-8 w-8 text-gray-400 hover:text-red-600 hover:bg-red-500/10 rounded-lg">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          )).reverse()}
                        </div>
                      )}
                    </ScrollArea>
                  </div>
                </div>
              )}

              {/* Step 1: Fornecedor */}
              {currentStep === 1 && (
                <div className="h-full flex flex-col p-8 space-y-8">
                  <div className="space-y-4">
                    <Label className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em] pl-1">Selecione o Fornecedor</Label>
                    <div className="relative group">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-orange-500 transition-colors" />
                      <Input
                        ref={supplierSearchRef}
                        placeholder="Buscar por nome ou contato..."
                        value={supplierSearch}
                        onChange={(e) => setSupplierSearch(e.target.value)}
                        className="h-14 pl-12 bg-white/60 dark:bg-gray-950/60 border-white/40 dark:border-white/10 font-black rounded-2xl focus:ring-orange-500/20 transition-all shadow-sm"
                        tabIndex={0}
                      />
                    </div>
                    <ScrollArea className="h-64 border border-white/20 dark:border-white/10 rounded-[2rem] bg-white/20 dark:bg-gray-950/20 backdrop-blur-xl shadow-inner custom-scrollbar">
                      <div className="p-4 space-y-3">
                        {filteredSuppliers.map(s => (
                          <button
                            key={s.id}
                            onClick={() => setFornecedor(s.id)}
                            className={cn(
                              "w-full p-4 rounded-2xl text-left transition-all flex items-center gap-4 border group",
                              fornecedor === s.id 
                                ? "bg-orange-500/10 border-orange-500 shadow-xl shadow-orange-500/5 ring-1 ring-white/20" 
                                : "bg-white/40 dark:bg-gray-900/40 border-white/40 dark:border-white/10 hover:border-orange-500/40"
                            )}
                          >
                            <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center transition-all", fornecedor === s.id ? "bg-orange-500 text-white shadow-lg scale-110" : "bg-white/40 dark:bg-gray-800/40 text-gray-400 border border-white/20 group-hover:scale-105")}>
                              <Building2 className="h-6 w-6" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={cn("font-black text-base tracking-tight truncate", fornecedor === s.id ? "text-orange-700 dark:text-orange-400" : "text-gray-900 dark:text-white")}>{s.name}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 font-bold truncate opacity-70">{s.contact || 'Sem contato registrado'}</p>
                            </div>
                            {fornecedor === s.id && (
                              <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-600">
                                <CheckCircle className="h-5 w-5 animate-in zoom-in-50" />
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                  
                  <div className="space-y-4">
                    <Label className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em] pl-1">Data Prevista de Entrega</Label>
                    <div className="relative group max-w-sm">
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-orange-500 transition-colors" />
                      <Input 
                        type="date" 
                        value={dataEntrega} 
                        onChange={(e) => setDataEntrega(e.target.value)} 
                        className="h-14 pl-12 bg-white/60 dark:bg-gray-950/60 border-white/40 dark:border-white/10 font-black rounded-2xl focus:ring-orange-500/20 transition-all shadow-sm" 
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Finalizar */}
              {currentStep === 2 && (
                <div className="h-full flex flex-col p-8 space-y-8">
                  {/* Resumo Semiglass */}
                  <div className="bg-white/40 dark:bg-gray-900/40 rounded-[2.5rem] p-8 border border-white/40 dark:border-white/10 backdrop-blur-xl shadow-xl shadow-gray-500/5 ring-1 ring-white/20 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent pointer-events-none"></div>
                    <h3 className="font-black text-[10px] text-gray-500 dark:text-gray-400 mb-6 flex items-center gap-3 uppercase tracking-[0.2em] relative z-10">
                      <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-600">
                        <FileText className="h-4 w-4" />
                      </div>
                      Resumo da Operação
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative z-10">
                      <div className="bg-white/60 dark:bg-gray-950/60 rounded-2xl p-5 border border-white/40 dark:border-white/10 shadow-sm">
                        <p className="text-[9px] text-gray-400 dark:text-gray-500 mb-1.5 font-black uppercase tracking-widest">Fornecedor</p>
                        <p className="font-black text-base text-gray-900 dark:text-white truncate tracking-tight">{suppliers.find(s => s.id === fornecedor)?.name || '-'}</p>
                      </div>
                      <div className="bg-white/60 dark:bg-gray-950/60 rounded-2xl p-5 border border-white/40 dark:border-white/10 shadow-sm">
                        <p className="text-[9px] text-gray-400 dark:text-gray-500 mb-1.5 font-black uppercase tracking-widest">Previsão de Entrega</p>
                        <p className="font-black text-base text-gray-900 dark:text-white tracking-tight">{dataEntrega ? new Date(dataEntrega + 'T00:00:00').toLocaleDateString('pt-BR') : '-'}</p>
                      </div>
                      <div className="bg-white/60 dark:bg-gray-950/60 rounded-2xl p-5 border border-white/40 dark:border-white/10 shadow-sm">
                        <p className="text-[9px] text-gray-400 dark:text-gray-500 mb-1.5 font-black uppercase tracking-widest">Volume de Itens</p>
                        <p className="font-black text-base text-gray-900 dark:text-white tracking-tight">{itens.length} produto(s) listado(s)</p>
                      </div>
                      <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 dark:from-emerald-500/20 dark:to-teal-500/20 rounded-2xl p-5 border border-emerald-500/20 shadow-sm">
                        <p className="text-[9px] text-emerald-700 dark:text-emerald-500 mb-1.5 font-black uppercase tracking-widest">Investimento Total</p>
                        <p className="font-black text-2xl text-emerald-600 dark:text-emerald-400 tracking-tighter">R$ {calculateTotal().toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                      </div>
                    </div>
                  </div>

                  {/* Observações Semiglass */}
                  <div className="space-y-4">
                    <Label className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em] pl-1">Notas Adicionais (OPCIONAL)</Label>
                    <Textarea
                      placeholder="Instruções de entrega, condições de pagamento..."
                      value={observacoes}
                      onChange={(e) => setObservacoes(e.target.value)}
                      className="min-h-[100px] resize-none bg-white/60 dark:bg-gray-950/60 border-white/40 dark:border-white/10 font-medium text-sm rounded-[1.5rem] p-6 focus:ring-orange-500/20 transition-all shadow-sm"
                    />
                  </div>

                  {/* Lista de itens resumida Semiglass */}
                  <div className="flex-1 min-h-0 flex flex-col">
                    <Label className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em] mb-4 pl-1">Conferência de Itens</Label>
                    <ScrollArea className="flex-1 border border-white/20 dark:border-white/10 rounded-[2rem] bg-white/20 dark:bg-gray-950/20 backdrop-blur-xl shadow-inner custom-scrollbar">
                      <div className="p-6 space-y-2">
                        {itens.map((item, index) => (
                          <div key={index} className="flex items-center justify-between p-4 bg-white/40 dark:bg-gray-900/40 rounded-xl border border-white/10 shadow-sm">
                            <span className="truncate flex-1 font-black text-sm text-gray-900 dark:text-white tracking-tight">{item.produto}</span>
                            <div className="flex items-center gap-4 ml-4">
                              <span className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">{item.quantidade} {item.unidade}</span>
                              <div className="h-4 w-px bg-white/10 mx-2"></div>
                              <span className="font-black text-sm text-emerald-600 dark:text-emerald-400 tracking-tight">R$ {(item.quantidade * item.valorUnitario).toFixed(2)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                </div>
              )}
          </AnimatedTabContent>
      </div>

      {/* Footer Semiglass */}
      <div className="flex-shrink-0 px-8 py-6 border-t border-white/20 dark:border-white/10 bg-white/40 dark:bg-gray-950/40 backdrop-blur-2xl flex items-center justify-between relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-gray-500/5 to-transparent pointer-events-none"></div>
        <div className="flex items-center gap-4 relative z-10">
          <Button 
            variant="outline" 
            onClick={() => currentStep > 0 ? setCurrentStep(currentStep - 1) : onOpenChange(false)} 
            disabled={loading} 
            className="h-14 px-8 border-white/30 dark:border-white/10 bg-white/5 font-black text-[10px] uppercase tracking-[0.2em] rounded-2xl hover:bg-white/10 transition-all backdrop-blur-md shadow-sm"
          >
            <ChevronLeft className="h-5 w-5 mr-2" />
            {currentStep === 0 ? 'Cancelar' : 'Voltar'}
          </Button>
          {!isMobile && (
            <div className="hidden sm:flex items-center gap-3 px-4 py-2 bg-white/10 dark:bg-white/5 rounded-full border border-white/10 backdrop-blur-sm text-[8px] text-gray-400 font-black uppercase tracking-widest opacity-60">
              <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 bg-black/20 rounded">Alt+←→</kbd> Navegar</span>
              {currentStep === 2 && <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 bg-black/20 rounded">Ctrl+Enter</kbd> Criar</span>}
            </div>
          )}
        </div>
        
        <div className="relative z-10">
          {currentStep < 2 ? (
            <Button 
              onClick={() => setCurrentStep(currentStep + 1)} 
              disabled={!canProceed()} 
              className="h-14 px-10 bg-gradient-to-r from-orange-600 via-amber-600 to-orange-600 hover:from-orange-700 hover:to-amber-700 text-white font-black uppercase text-[10px] tracking-[0.2em] shadow-xl shadow-orange-500/20 rounded-2xl transition-all active:scale-[0.98] ring-2 ring-white/20 relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:animate-shimmer pointer-events-none"></div>
              {isMobile ? 'Próximo' : 'Próximo Passo'}
              <ChevronRight className="h-5 w-5 ml-2" />
            </Button>
          ) : (
            <Button 
              onClick={handleSubmit} 
              disabled={loading || !canProceed()} 
              className="h-14 px-12 bg-gradient-to-r from-orange-600 via-amber-600 to-orange-600 hover:from-orange-700 hover:to-amber-700 text-white font-black uppercase text-[10px] tracking-[0.2em] shadow-xl shadow-orange-500/20 rounded-2xl transition-all active:scale-[0.98] ring-2 ring-white/20 relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:animate-shimmer pointer-events-none"></div>
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 mr-3 animate-spin" />
                  Criando...
                </>
              ) : (
                <>
                  <ShoppingCart className="h-5 w-5 mr-3" />
                  {isMobile ? 'Finalizar' : 'Finalizar Pedido'}
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </>
  );

  // Mobile: Usar Drawer
  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[95vh] overflow-hidden flex flex-col !bg-white/70 dark:!bg-gray-950/70 backdrop-blur-2xl border-t border-white/20 rounded-t-[2.5rem] shadow-2xl">
          {modalInnerContent}
        </DrawerContent>
      </Drawer>
    );
  }

  // Desktop: Usar Dialog
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="w-[95vw] max-w-[850px] h-[90vh] max-h-[750px] overflow-hidden p-0 gap-0 border border-white/30 dark:border-white/10 shadow-2xl rounded-[2.5rem] !bg-white/70 dark:!bg-gray-950/70 backdrop-blur-2xl [&>button]:hidden animate-in fade-in zoom-in-95 duration-300"
        onKeyDown={handleModalKeyDown}
      >
        {modalInnerContent}
      </DialogContent>
    </Dialog>
  );
}
