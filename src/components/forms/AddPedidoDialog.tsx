import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { AnimatedTabContent } from "@/components/ui/animated-tabs";
import { useDebounce } from "@/hooks/useDebounce";
import { useIsMobile } from "@/hooks/use-mobile";
import { ResponsiveDialog, ResponsiveDialogContent, ResponsiveDialogTitle } from "@/components/ui/responsive-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, ShoppingCart, Package, Building2, CheckCircle, ChevronRight, ChevronLeft, 
  FileText, X, Search, Trash2, Copy, Calendar, DollarSign, Loader2, AlertCircle,
  Star, Trophy
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
        const { data } = await supabase
          .from('products')
          .select('id, name, brands(name, manual_rating, purchaseScore)')
          .order('name')
          .range(page * pageSize, (page + 1) * pageSize - 1);
        
        if (data) {
          // Flatten the brand data
          const processedData = data.map(p => ({
            ...p,
            brand_name: p.brands?.name,
            brand_rating: p.brands?.manual_rating,
            brand_score: p.brands?.purchaseScore
          }));
          allProducts.push(...processedData);
        }
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
      {/* Header Compacto com design semiglass */}
      <div className="flex-shrink-0 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 to-transparent pointer-events-none"></div>
        
        {/* Top Bar: Título, Steps e Botão Fechar */}
        <div className="flex items-center justify-between px-6 py-2 relative z-10 h-14">
          <div className="flex items-center gap-6">
            {/* Título */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gray-900 dark:bg-white flex items-center justify-center text-white dark:text-gray-900 shadow-lg ring-1 ring-white/20">
                <ShoppingCart className="h-4 w-4" />
              </div>
              <ResponsiveDialogTitle className="text-sm font-black text-gray-900 dark:text-white tracking-tight leading-none">
                Novo Pedido
              </ResponsiveDialogTitle>
            </div>

            {/* Steps indicator minimalista integrado */}
            <div className="hidden sm:flex items-center h-full border-b border-transparent gap-1">
              {steps.map((step, index) => (
                <button
                  key={step.id}
                  onClick={() => index < currentStep && setCurrentStep(index)}
                  disabled={index > currentStep}
                  className={cn(
                    "relative h-full px-3 flex items-center gap-2 border-b-2 transition-all text-[10px] uppercase tracking-[0.15em] font-black",
                    index === currentStep 
                      ? "border-orange-500 text-orange-600 dark:text-orange-400" 
                      : index < currentStep
                        ? "border-transparent text-emerald-600 dark:text-emerald-400 hover:text-emerald-700"
                        : "border-transparent text-gray-400 dark:text-gray-600 cursor-not-allowed"
                  )}
                >
                  {index < currentStep ? <CheckCircle className="h-3 w-3" /> : <step.icon className="h-3 w-3" />}
                  <span>{step.title}</span>
                </button>
              ))}
            </div>
          </div>

          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => onOpenChange(false)} 
            className="h-6 w-6 text-gray-400 hover:text-gray-900 dark:hover:text-white !bg-transparent p-0 border-0 shadow-none ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Fechar</span>
          </Button>
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
                <div className="h-full flex flex-col p-4">
                  {/* Formulário de adicionar produto Compacto e Horizontal */}
                  <div className="flex items-end gap-2 bg-white dark:bg-gray-900 rounded-xl p-3 border border-gray-200 dark:border-gray-800 shadow-sm mb-3 relative z-50">
                    <div className="flex-1 space-y-1">
                      <Label className="text-[9px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest pl-1">Produto</Label>
                      <div className="relative group">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 group-focus-within:text-orange-500 transition-colors" />
                        <Input
                          ref={productSearchRef}
                          placeholder="Buscar produto..."
                          value={selectedProduct ? selectedProduct.name : productSearch}
                          onChange={(e) => { setProductSearch(e.target.value); setSelectedProduct(null); }}
                          onKeyDown={(e) => handleProductKeyDown(e, 'search')}
                          className="h-9 pl-8 bg-white dark:bg-gray-950/60 border-gray-200 dark:border-gray-800 font-bold text-xs rounded-lg focus:ring-orange-500/20 transition-all shadow-sm"
                          tabIndex={0}
                        />
                        {filteredProducts.length > 0 && !selectedProduct && (
                          <div 
                            ref={productListRef}
                            className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl shadow-2xl max-h-64 overflow-auto custom-scrollbar"
                          >
                            {filteredProducts.map((p, index) => (
                              <button
                                key={p.id}
                                onClick={() => selectProductFromList(p)}
                                onMouseEnter={() => setHighlightedProductIndex(index)}
                                className={cn(
                                  "w-full px-3 py-2 text-left text-xs flex items-center justify-between gap-2 transition-all border-b border-gray-100 dark:border-gray-900 last:border-none",
                                  highlightedProductIndex === index 
                                    ? "bg-orange-500/10 text-orange-700 dark:text-orange-400" 
                                    : "hover:bg-gray-50 dark:hover:bg-white/5"
                                )}
                              >
                                <div className="flex items-center gap-2 overflow-hidden">
                                  <div className={cn("w-6 h-6 rounded flex items-center justify-center transition-all flex-shrink-0", highlightedProductIndex === index ? "bg-orange-500 text-white shadow-md" : "bg-gray-100 dark:bg-gray-800 text-gray-400")}>
                                    <Package className="h-3 w-3" />
                                  </div>
                                  <div className="flex flex-col min-w-0">
                                    <span className="font-bold tracking-tight truncate">{p.name}</span>
                                    {p.brand_name && (
                                      <div className="flex items-center gap-1.5 mt-0.5">
                                        <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">{p.brand_name}</span>
                                        {p.brand_rating > 0 && (
                                          <div className="flex items-center gap-0.5">
                                            <Star className="h-2 w-2 fill-amber-400 text-amber-400" />
                                            <span className="text-[9px] font-bold text-amber-600 dark:text-amber-500">{p.brand_rating}</span>
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>
                                
                                {p.brand_score > 0 && (
                                  <div className="flex items-center gap-1 bg-emerald-50 dark:bg-emerald-900/20 px-1.5 py-0.5 rounded-full flex-shrink-0">
                                    <Trophy className="h-2.5 w-2.5 text-emerald-600 dark:text-emerald-400" />
                                    <span className="text-[9px] font-bold text-emerald-700 dark:text-emerald-400">
                                      {p.brand_score >= 1000 ? `${(p.brand_score/1000).toFixed(1)}k` : p.brand_score}
                                    </span>
                                  </div>
                                )}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="w-20 space-y-1">
                      <Label className="text-[9px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest pl-1">Qtd</Label>
                      <Input
                        ref={quantityInputRef}
                        type="number"
                        placeholder="0"
                        value={newProductQuantity}
                        onChange={(e) => setNewProductQuantity(e.target.value)}
                        onKeyDown={(e) => handleProductKeyDown(e, 'quantity')}
                        className="h-9 bg-white dark:bg-gray-950/60 border-gray-200 dark:border-gray-800 font-black text-center text-xs rounded-lg focus:ring-orange-500/20 transition-all shadow-sm"
                        tabIndex={0}
                      />
                    </div>
                    <div className="w-24 space-y-1">
                      <Label className="text-[9px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest pl-1">Preço</Label>
                      <div className="relative group">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-emerald-600 font-black text-xs opacity-50">R$</span>
                        <Input
                          ref={priceInputRef}
                          type="text"
                          inputMode="decimal"
                          placeholder="0,00"
                          value={newProductPrice}
                          onChange={(e) => setNewProductPrice(e.target.value)}
                          onKeyDown={(e) => handleProductKeyDown(e, 'price')}
                          className="h-9 pl-7 bg-white dark:bg-gray-950/60 border-gray-200 dark:border-gray-800 font-black text-xs rounded-lg focus:ring-emerald-500/20 transition-all shadow-sm"
                          tabIndex={0}
                        />
                      </div>
                    </div>
                    <Button 
                      ref={addButtonRef} 
                      onClick={handleAddProduct} 
                      disabled={!selectedProduct} 
                      size="icon"
                      className="h-9 w-9 bg-orange-600 hover:bg-orange-700 text-white shadow-md shadow-orange-500/10 rounded-lg transition-all active:scale-95 ring-1 ring-white/20 shrink-0"
                    >
                      <Plus className="h-5 w-5" />
                    </Button>
                  </div>

                <div className="flex-1 min-h-0 flex flex-col">
                  <div className="flex items-center justify-between mb-2 px-1">
                    <span className="text-[9px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">Itens Adicionados ({itens.length})</span>
                    <Badge variant="outline" className="h-5 px-2 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 font-black text-[9px] uppercase tracking-widest rounded-md">
                      Total: R$ {calculateTotal().toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </Badge>
                  </div>
                  <ScrollArea className="flex-1 rounded-xl bg-gray-50/50 dark:bg-gray-950/20 shadow-inner custom-scrollbar border border-gray-100 dark:border-gray-800">
                    {itens.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-gray-400">
                        <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-2 border border-gray-200 dark:border-gray-800">
                          <Package className="h-5 w-5 opacity-20" />
                        </div>
                        <p className="text-[9px] font-black uppercase tracking-widest opacity-40">Lista vazia</p>
                      </div>
                    ) : (
                      <div className="p-2 space-y-1.5">
                        {itens.map((item, index) => (
                          <div key={index} className="flex items-center gap-2 p-2 bg-white dark:bg-gray-900 rounded-lg border border-gray-100 dark:border-gray-800 hover:border-orange-500/30 transition-all group shadow-sm">
                            <div className="w-8 h-8 rounded bg-orange-500/10 flex items-center justify-center border border-orange-500/10 flex-shrink-0">
                              <span className="text-[9px] font-black text-orange-600 dark:text-orange-400">{itens.length - index}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-black text-xs text-gray-900 dark:text-white truncate tracking-tight">{item.produto}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[9px] font-bold text-gray-500">
                                  {item.quantidade} {item.unidade}
                                </span>
                                <span className="text-[9px] font-black text-gray-300 dark:text-gray-700">|</span>
                                <span className="text-[9px] font-black text-emerald-600 dark:text-emerald-400">R$ {item.valorUnitario.toFixed(2)}</span>
                              </div>
                            </div>
                            <div className="text-right flex items-center gap-2">
                              <p className="font-black text-emerald-600 dark:text-emerald-400 text-xs tracking-tight">R$ {(item.quantidade * item.valorUnitario).toFixed(2)}</p>
                              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                <Button variant="ghost" size="icon" onClick={() => handleDuplicateItem(index)} className="h-6 w-6 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md">
                                  <Copy className="h-3 w-3" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => handleRemoveItem(index)} className="h-6 w-6 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md">
                                  <Trash2 className="h-3 w-3" />
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
                <div className="h-full flex flex-col p-4 space-y-4">
                  <div className="flex-1 min-h-0 flex flex-col space-y-2">
                    <Label className="text-[9px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest pl-1">Selecione o Fornecedor</Label>
                    <div className="relative group flex-shrink-0">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 group-focus-within:text-orange-500 transition-colors" />
                      <Input
                        ref={supplierSearchRef}
                        placeholder="Buscar por nome ou contato..."
                        value={supplierSearch}
                        onChange={(e) => setSupplierSearch(e.target.value)}
                        className="h-9 pl-9 bg-white dark:bg-gray-950/60 border-gray-200 dark:border-gray-800 font-bold text-xs rounded-lg focus:ring-orange-500/20 transition-all shadow-sm"
                        tabIndex={0}
                      />
                    </div>
                    <ScrollArea className="flex-1 rounded-xl bg-gray-50/50 dark:bg-gray-950/20 shadow-inner custom-scrollbar border border-gray-100 dark:border-gray-800">
                      <div className="p-2 space-y-1.5">
                        {filteredSuppliers.length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-8 opacity-50">
                            <Building2 className="h-6 w-6 mb-2 text-gray-400" />
                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Nenhum fornecedor encontrado</p>
                          </div>
                        ) : (
                          filteredSuppliers.map(s => (
                            <button
                              key={s.id}
                              onClick={() => setFornecedor(s.id)}
                              className={cn(
                                "w-full p-2 rounded-lg text-left transition-all flex items-center gap-3 border",
                                fornecedor === s.id 
                                  ? "bg-white dark:bg-gray-800 border-orange-500 shadow-md ring-1 ring-orange-500/10" 
                                  : "bg-white/40 dark:bg-gray-900/40 border-gray-100 dark:border-gray-800 hover:border-orange-500/30"
                              )}
                            >
                              <div className={cn("w-8 h-8 rounded flex items-center justify-center transition-all", fornecedor === s.id ? "bg-orange-600 text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-400")}>
                                <Building2 className="h-3.5 w-3.5" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className={cn("font-black text-xs tracking-tight truncate", fornecedor === s.id ? "text-orange-700 dark:text-orange-400" : "text-gray-900 dark:text-white")}>{s.name}</p>
                                <p className="text-[9px] text-gray-500 dark:text-gray-400 font-bold truncate opacity-70">{s.contact || 'Sem contato'}</p>
                              </div>
                              {fornecedor === s.id && <CheckCircle className="h-3.5 w-3.5 text-orange-600" />}
                            </button>
                          ))
                        )}
                      </div>
                    </ScrollArea>
                  </div>
                  
                  <div className="flex-shrink-0 space-y-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                    <Label className="text-[9px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest pl-1">Data Prevista de Entrega</Label>
                    <div className="relative group max-w-xs">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 group-focus-within:text-orange-500 transition-colors" />
                      <Input 
                        type="date" 
                        value={dataEntrega} 
                        onChange={(e) => setDataEntrega(e.target.value)} 
                        className="h-9 pl-9 bg-white dark:bg-gray-950/60 border-gray-200 dark:border-gray-800 font-bold text-xs rounded-lg focus:ring-orange-500/20 transition-all shadow-sm" 
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Finalizar */}
              {currentStep === 2 && (
                <div className="h-full flex flex-col p-4 space-y-4">
                  {/* Resumo Compacto */}
                  <div className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-800 shadow-sm ring-1 ring-white/20">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-gray-50 dark:bg-gray-950/40 rounded-lg p-2 border border-gray-100 dark:border-gray-800">
                        <p className="text-[8px] text-gray-400 dark:text-gray-500 mb-0.5 font-black uppercase tracking-widest">Fornecedor</p>
                        <p className="font-black text-xs text-gray-900 dark:text-white truncate tracking-tight">{suppliers.find(s => s.id === fornecedor)?.name || '-'}</p>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-950/40 rounded-lg p-2 border border-gray-100 dark:border-gray-800">
                        <p className="text-[8px] text-gray-400 dark:text-gray-500 mb-0.5 font-black uppercase tracking-widest">Entrega</p>
                        <p className="font-black text-xs text-gray-900 dark:text-white tracking-tight">{dataEntrega ? new Date(dataEntrega + 'T00:00:00').toLocaleDateString('pt-BR') : '-'}</p>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-950/40 rounded-lg p-2 border border-gray-100 dark:border-gray-800">
                        <p className="text-[8px] text-gray-400 dark:text-gray-500 mb-0.5 font-black uppercase tracking-widest">Itens</p>
                        <p className="font-black text-xs text-gray-900 dark:text-white tracking-tight">{itens.length} produto(s)</p>
                      </div>
                      <div className="bg-emerald-500/5 dark:bg-emerald-900/20 rounded-lg p-2 border border-emerald-500/20 shadow-sm">
                        <p className="text-[8px] text-emerald-700 dark:text-emerald-500 mb-0.5 font-black uppercase tracking-widest">Total</p>
                        <p className="font-black text-sm text-emerald-600 dark:text-emerald-400 tracking-tight">R$ {calculateTotal().toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                      </div>
                    </div>
                  </div>

                  {/* Observações */}
                  <div className="space-y-1.5">
                    <Label className="text-[9px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest pl-1">Notas Adicionais</Label>
                    <Textarea
                      placeholder="Instruções de entrega, condições de pagamento..."
                      value={observacoes}
                      onChange={(e) => setObservacoes(e.target.value)}
                      className="min-h-[60px] h-16 resize-none bg-white dark:bg-gray-950/60 border-gray-200 dark:border-gray-800 font-medium text-xs rounded-lg p-2 focus:ring-orange-500/20 transition-all shadow-sm"
                    />
                  </div>

                  {/* Lista Simplificada */}
                  <div className="flex-1 min-h-0 flex flex-col">
                    <ScrollArea className="flex-1 border border-gray-100 dark:border-gray-800 rounded-xl bg-gray-50/50 dark:bg-gray-950/20 shadow-inner custom-scrollbar">
                      <div className="p-2 space-y-1">
                        {itens.map((item, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-white dark:bg-gray-900 rounded-lg border border-gray-50 dark:border-gray-800 shadow-xs">
                            <span className="truncate flex-1 font-black text-xs text-gray-900 dark:text-white tracking-tight">{item.produto}</span>
                            <div className="flex items-center gap-3 ml-3">
                              <span className="text-[9px] font-bold text-gray-500">{item.quantidade} {item.unidade}</span>
                              <span className="font-black text-xs text-emerald-600 dark:text-emerald-400 tracking-tight">R$ {(item.quantidade * item.valorUnitario).toFixed(2)}</span>
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

      {/* Footer Compacto */}
      <div className="flex-shrink-0 px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex items-center justify-end gap-2 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-gray-500/5 to-transparent pointer-events-none"></div>
        
        <Button 
          variant="outline" 
          onClick={() => currentStep > 0 ? setCurrentStep(currentStep - 1) : onOpenChange(false)} 
          disabled={loading} 
          className="h-8 px-4 border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-white/5 font-black text-[9px] uppercase tracking-widest rounded-lg hover:bg-gray-50 transition-all shadow-sm relative z-10"
        >
          {currentStep === 0 ? 'Cancelar' : 'Voltar'}
        </Button>

        <div className="relative z-10">
          {currentStep < 2 ? (
            <Button 
              onClick={() => setCurrentStep(currentStep + 1)} 
              disabled={!canProceed()} 
              className="h-8 px-6 bg-orange-600 hover:bg-orange-700 text-white font-black uppercase text-[9px] tracking-widest shadow-md shadow-orange-500/10 rounded-lg transition-all active:scale-[0.98] ring-1 ring-white/20"
            >
              Próximo
              <ChevronRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          ) : (
            <Button 
              onClick={handleSubmit} 
              disabled={loading || !canProceed()} 
              className="h-8 px-6 bg-orange-600 hover:bg-orange-700 text-white font-black uppercase text-[9px] tracking-widest shadow-md shadow-orange-500/10 rounded-lg transition-all active:scale-[0.98] ring-1 ring-white/20"
            >
              {loading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
                  Criando...
                </>
              ) : (
                <>
                  <ShoppingCart className="h-3.5 w-3.5 mr-2" />
                  Finalizar
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </>
  );

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent 
        hideClose
        className="w-[95vw] sm:w-[95vw] md:max-w-[1000px] h-[95vh] sm:h-[85vh] max-h-[95vh] sm:max-h-[700px] overflow-hidden p-0 gap-0 border border-gray-200 dark:border-gray-800 shadow-2xl rounded-t-[2rem] sm:rounded-[2rem] bg-white dark:bg-gray-950 [&>button]:hidden"
        onKeyDown={handleModalKeyDown}
      >
        {modalInnerContent}
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
