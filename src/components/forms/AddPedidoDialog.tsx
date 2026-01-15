import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { AnimatedTabContent } from "@/components/ui/animated-tabs";
import { useDebounce } from "@/hooks/useDebounce";
import { useIsMobile } from "@/hooks/use-mobile";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
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
      {/* Header compacto */}
      <div className={`flex-shrink-0 px-4 ${isMobile ? 'py-4' : 'py-3'} border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={`${isMobile ? 'w-10 h-10 rounded-xl shadow-lg' : 'w-9 h-9 rounded-lg'} bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center`}>
              <ShoppingCart className={`${isMobile ? 'h-5 w-5' : 'h-4 w-4'} text-orange-600 dark:text-orange-400`} />
            </div>
            <div>
              <div className={`${isMobile ? 'text-lg font-bold' : 'text-base font-semibold'} text-gray-900 dark:text-white`}>Novo Pedido</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">{steps[currentStep].description}</div>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)} className={`${isMobile ? 'h-9 w-9 rounded-lg' : 'h-8 w-8'} text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200`}>
            <X className={isMobile ? 'h-5 w-5' : 'h-4 w-4'} />
          </Button>
        </div>
        
        {/* Steps indicator compacto */}
        <div className="flex items-center gap-1">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center flex-1">
              <button
                onClick={() => index < currentStep && setCurrentStep(index)}
                disabled={index > currentStep}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all w-full",
                  index < currentStep ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 cursor-pointer hover:bg-green-200" :
                  index === currentStep ? "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400" :
                  "bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed"
                )}
              >
                {index < currentStep ? <CheckCircle className="h-3.5 w-3.5" /> : <step.icon className="h-3.5 w-3.5" />}
                <span className={isMobile ? '' : 'hidden sm:inline'}>{step.title}</span>
                {!isMobile && <span className="sm:hidden">{index + 1}</span>}
              </button>
              {index < steps.length - 1 && (
                <ChevronRight className={cn("h-4 w-4 mx-1 flex-shrink-0", index < currentStep ? "text-green-400" : "text-gray-300 dark:text-gray-600")} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <AnimatedTabContent
          value={String(currentStep)}
          activeTab={String(currentStep)}
          className="h-full"
        >
              {/* Step 0: Produtos */}
              {currentStep === 0 && (
                <div className="h-full flex flex-col p-4">
                  {/* Formulário de adicionar produto */}
                  <div className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-gray-800 dark:to-gray-800 rounded-xl p-4 mb-4 border border-orange-200/50 dark:border-gray-700">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                      <div className="md:col-span-2">
                        <Label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">Produto</Label>
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input
                            ref={productSearchRef}
                            placeholder="Digite para buscar..."
                            value={selectedProduct ? selectedProduct.name : productSearch}
                            onChange={(e) => { setProductSearch(e.target.value); setSelectedProduct(null); }}
                            onKeyDown={(e) => handleProductKeyDown(e, 'search')}
                            className="pl-9 h-10 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700"
                            tabIndex={0}
                          />
                          {filteredProducts.length > 0 && !selectedProduct && (
                            <div 
                              ref={productListRef}
                              className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-48 overflow-auto"
                            >
                              {filteredProducts.map((p, index) => (
                                <button
                                  key={p.id}
                                  onClick={() => selectProductFromList(p)}
                                  onMouseEnter={() => setHighlightedProductIndex(index)}
                                  className={cn(
                                    "w-full px-3 py-2 text-left text-sm flex items-center gap-2 transition-colors",
                                    highlightedProductIndex === index 
                                      ? "bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300" 
                                      : "hover:bg-orange-50 dark:hover:bg-gray-700"
                                  )}
                                >
                                  <Package className={cn(
                                    "h-4 w-4",
                                    highlightedProductIndex === index ? "text-orange-600" : "text-orange-500"
                                  )} />
                                  {p.name}
                                </button>
                              ))}
                              <div className="px-3 py-1.5 text-[10px] text-gray-400 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                                <kbd className="px-1 py-0.5 bg-gray-200 dark:bg-gray-600 rounded">↑↓</kbd> Navegar • <kbd className="px-1 py-0.5 bg-gray-200 dark:bg-gray-600 rounded">Enter</kbd> Selecionar • <kbd className="px-1 py-0.5 bg-gray-200 dark:bg-gray-600 rounded">Esc</kbd> Fechar
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">Quantidade</Label>
                        <Input
                          ref={quantityInputRef}
                          type="number"
                          placeholder="0"
                          value={newProductQuantity}
                          onChange={(e) => setNewProductQuantity(e.target.value)}
                          onKeyDown={(e) => handleProductKeyDown(e, 'quantity')}
                          className="h-10 bg-white dark:bg-gray-900"
                          tabIndex={0}
                        />
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">Preço Unit.</Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">R$</span>
                          <Input
                            ref={priceInputRef}
                            type="text"
                            placeholder="0,00"
                            value={newProductPrice}
                            onChange={(e) => setNewProductPrice(e.target.value)}
                            onKeyDown={(e) => handleProductKeyDown(e, 'price')}
                            className="pl-9 h-10 bg-white dark:bg-gray-900"
                            tabIndex={0}
                          />
                        </div>
                      </div>
                    </div>
                    <Button ref={addButtonRef} onClick={handleAddProduct} disabled={!selectedProduct} className="mt-3 w-full bg-orange-600 hover:bg-orange-700 text-white">
                      <Plus className="h-4 w-4 mr-2" />Adicionar Produto (Enter)
                    </Button>
                    
                    {/* Dicas de atalhos */}
                    <div className="mt-2 text-xs text-center text-gray-400 space-y-0.5">
                      <p><kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-[10px]">Enter</kbd> Avançar campo / Adicionar</p>
                      <p><kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-[10px]">Alt+→</kbd> Próximo passo</p>
                    </div>
                  </div>

                  {/* Lista de itens */}
                  <div className="flex-1 min-h-0">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Itens do Pedido ({itens.length})</span>
                      <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                        Total: R$ {calculateTotal().toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </Badge>
                    </div>
                    <ScrollArea className="h-[calc(100%-2rem)] border border-gray-200 dark:border-gray-700 rounded-lg">
                      {itens.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                          <Package className="h-12 w-12 mb-3 opacity-50" />
                          <p className="text-sm">Nenhum produto adicionado</p>
                          <p className="text-xs">Use o formulário acima para adicionar</p>
                        </div>
                      ) : (
                        <div className="p-2 space-y-2">
                          {itens.map((item, index) => (
                            <div key={index} className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700 hover:border-orange-200 transition-colors">
                              <div className="w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                                <Package className="h-5 w-5 text-orange-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm truncate">{item.produto}</p>
                                <p className="text-xs text-gray-500">{item.quantidade} {item.unidade} × R$ {item.valorUnitario.toFixed(2)}</p>
                              </div>
                              <div className="text-right">
                                <p className="font-bold text-emerald-600">R$ {(item.quantidade * item.valorUnitario).toFixed(2)}</p>
                              </div>
                              <div className="flex gap-1">
                                <Button variant="ghost" size="icon" onClick={() => handleDuplicateItem(index)} className="h-8 w-8 text-gray-400 hover:text-blue-600">
                                  <Copy className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => handleRemoveItem(index)} className="h-8 w-8 text-gray-400 hover:text-red-600">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </ScrollArea>
                  </div>
                </div>
              )}

              {/* Step 1: Fornecedor */}
              {currentStep === 1 && (
                <div className="h-full flex flex-col p-4">
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium mb-2 block">Fornecedor</Label>
                      <div className="relative mb-2">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          ref={supplierSearchRef}
                          placeholder="Buscar fornecedor..."
                          value={supplierSearch}
                          onChange={(e) => setSupplierSearch(e.target.value)}
                          className="pl-9"
                          tabIndex={0}
                        />
                      </div>
                      <ScrollArea className="h-48 border border-gray-200 dark:border-gray-700 rounded-lg">
                        <div className="p-2 space-y-1">
                          {filteredSuppliers.map(s => (
                            <button
                              key={s.id}
                              onClick={() => setFornecedor(s.id)}
                              className={cn(
                                "w-full p-3 rounded-lg text-left transition-all flex items-center gap-3",
                                fornecedor === s.id 
                                  ? "bg-orange-100 dark:bg-orange-900/30 border-2 border-orange-500" 
                                  : "bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 hover:border-orange-200"
                              )}
                            >
                              <div className={cn("w-10 h-10 rounded-full flex items-center justify-center", fornecedor === s.id ? "bg-orange-500 text-white" : "bg-gray-100 dark:bg-gray-700")}>
                                <Building2 className="h-5 w-5" />
                              </div>
                              <div>
                                <p className="font-medium text-sm">{s.name}</p>
                                <p className="text-xs text-gray-500">{s.contact || 'Sem contato'}</p>
                              </div>
                              {fornecedor === s.id && <CheckCircle className="ml-auto h-5 w-5 text-orange-500" />}
                            </button>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium mb-2 block">Data de Entrega</Label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input type="date" value={dataEntrega} onChange={(e) => setDataEntrega(e.target.value)} className="pl-9" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Finalizar */}
              {currentStep === 2 && (
                <div className="h-full flex flex-col p-4">
                  <div className="space-y-4">
                    {/* Resumo */}
                    <div className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-gray-800 dark:to-gray-800 rounded-xl p-4 border border-orange-200/50">
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                        <FileText className="h-5 w-5 text-orange-600" />Resumo do Pedido
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white dark:bg-gray-900 rounded-lg p-3">
                          <p className="text-xs text-gray-500 mb-1">Fornecedor</p>
                          <p className="font-medium">{suppliers.find(s => s.id === fornecedor)?.name || '-'}</p>
                        </div>
                        <div className="bg-white dark:bg-gray-900 rounded-lg p-3">
                          <p className="text-xs text-gray-500 mb-1">Data de Entrega</p>
                          <p className="font-medium">{dataEntrega ? new Date(dataEntrega + 'T00:00:00').toLocaleDateString('pt-BR') : '-'}</p>
                        </div>
                        <div className="bg-white dark:bg-gray-900 rounded-lg p-3">
                          <p className="text-xs text-gray-500 mb-1">Itens</p>
                          <p className="font-medium">{itens.length} produto(s)</p>
                        </div>
                        <div className="bg-white dark:bg-gray-900 rounded-lg p-3">
                          <p className="text-xs text-gray-500 mb-1">Valor Total</p>
                          <p className="font-bold text-lg text-emerald-600">R$ {calculateTotal().toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                        </div>
                      </div>
                    </div>

                    {/* Observações */}
                    <div>
                      <Label className="text-sm font-medium mb-2 block">Observações (opcional)</Label>
                      <Textarea
                        placeholder="Adicione observações sobre o pedido..."
                        value={observacoes}
                        onChange={(e) => setObservacoes(e.target.value)}
                        className="min-h-[100px] resize-none"
                      />
                    </div>

                    {/* Lista de itens resumida */}
                    <div>
                      <Label className="text-sm font-medium mb-2 block">Itens do Pedido</Label>
                      <ScrollArea className="h-32 border border-gray-200 dark:border-gray-700 rounded-lg">
                        <div className="p-2 space-y-1">
                          {itens.map((item, index) => (
                            <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded text-sm">
                              <span className="truncate flex-1">{item.produto}</span>
                              <span className="text-gray-500 mx-2">{item.quantidade} {item.unidade}</span>
                              <span className="font-medium text-emerald-600">R$ {(item.quantidade * item.valorUnitario).toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  </div>
                </div>
              )}
          </AnimatedTabContent>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-4 bg-gray-50 dark:bg-gray-800/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="outline" onClick={() => currentStep > 0 ? setCurrentStep(currentStep - 1) : onOpenChange(false)} disabled={loading}>
                <ChevronLeft className="h-4 w-4 mr-1" />
                {currentStep === 0 ? 'Cancelar' : 'Voltar'}
              </Button>
              {!isMobile && (
                <div className="hidden sm:flex items-center gap-2 text-xs text-gray-400">
                  <span><kbd className="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-[10px]">Alt+←→</kbd> Navegar</span>
                  {currentStep === 2 && <span><kbd className="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-[10px]">Ctrl+Enter</kbd> Criar</span>}
                </div>
              )}
            </div>
            
            {currentStep < 2 ? (
              <Button onClick={() => setCurrentStep(currentStep + 1)} disabled={!canProceed()} className="bg-orange-600 hover:bg-orange-700 text-white">
                {isMobile ? 'Próximo' : 'Próximo (Alt+→)'}
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={loading || !canProceed()} className="bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white min-w-[140px]">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><ShoppingCart className="h-4 w-4 mr-2" />{isMobile ? 'Criar' : 'Criar (Ctrl+Enter)'}</>}
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
        <DrawerContent className="h-[95vh] rounded-t-2xl p-0 overflow-hidden flex flex-col bg-white dark:bg-gray-900">
          {modalInnerContent}
        </DrawerContent>
      </Drawer>
    );
  }

  // Desktop: Usar Dialog
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="w-[95vw] max-w-[800px] h-[90vh] max-h-[700px] overflow-hidden p-0 gap-0 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-2xl rounded-xl [&>button]:hidden"
        onKeyDown={handleModalKeyDown}
      >
        {modalInnerContent}
      </DialogContent>
    </Dialog>
  );
}
