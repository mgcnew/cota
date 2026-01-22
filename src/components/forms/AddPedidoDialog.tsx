import React, { useState, useMemo, useRef, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  CalendarIcon, Package, Building2, Plus, Loader2, 
  ChevronRight, ChevronLeft, Check, FileText, Search, X, Clock,
  ShoppingCart, Trash2, Copy, Star, Trophy, DollarSign
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { useKeyboardOffset } from "@/hooks/useKeyboardOffset";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { useActivityLog } from "@/hooks/useActivityLog";
import { parseDecimalInput } from "@/lib/text-utils";
import { useDebounce } from "@/hooks/useDebounce";

interface PedidoItem {
  produto: string;
  quantidade: number;
  unidade: string;
  valorUnitario: number;
  product_id?: string;
}

interface AddPedidoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (pedido: any) => void;
  preSelectedProducts?: any[];
}

const STEPS = [
  { id: "produtos", title: "Produtos", icon: Package },
  { id: "fornecedor", title: "Fornecedor", icon: Building2 },
  { id: "confirmar", title: "Confirmar", icon: Check },
];

export default function AddPedidoDialog({ open, onOpenChange, onAdd, preSelectedProducts = [] }: AddPedidoDialogProps) {
  const isMobile = useIsMobile();
  const keyboardOffset = useKeyboardOffset();
  const { toast } = useToast();
  const { user } = useAuth();
  const { logActivity } = useActivityLog();

  // Form states
  const [activeStep, setActiveStep] = useState("produtos");
  const [fornecedor, setFornecedor] = useState("");
  const [dataEntrega, setDataEntrega] = useState<Date | undefined>(undefined);
  const [observacoes, setObservacoes] = useState("");
  const [itens, setItens] = useState<PedidoItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Data states
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);

  // Search/Input states
  const [productSearch, setProductSearch] = useState("");
  const [supplierSearch, setSupplierSearch] = useState("");
  const [highlightedProductIndex, setHighlightedProductIndex] = useState(-1);
  const debouncedProductSearch = useDebounce(productSearch, 300);
  const debouncedSupplierSearch = useDebounce(supplierSearch, 300);

  // New item states
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [newProductQuantity, setNewProductQuantity] = useState("");
  const [newProductUnit, setNewProductUnit] = useState("un");
  const [newProductPrice, setNewProductPrice] = useState("");
  const [lastUsedPrices, setLastUsedPrices] = useState<Record<string, number>>({});

  // Refs
  const productSearchRef = useRef<HTMLInputElement>(null);
  const quantityInputRef = useRef<HTMLInputElement>(null);
  const priceInputRef = useRef<HTMLInputElement>(null);
  const supplierSearchRef = useRef<HTMLInputElement>(null);

  const currentStepIndex = STEPS.findIndex(s => s.id === activeStep);
  const progress = ((currentStepIndex + 1) / STEPS.length) * 100;

  // Load data
  useEffect(() => {
    if (open) {
      if (products.length === 0 && !productsLoading) loadProducts();
      loadSuppliers();
      loadLastPrices();
      if (preSelectedProducts.length > 0) {
        const preSelectedItems: PedidoItem[] = preSelectedProducts.map(p => ({
          produto: p.product_name,
          quantidade: p.quantity,
          unidade: p.unit,
          valorUnitario: p.estimated_price || 0,
          product_id: p.product_id
        }));
        setItens(preSelectedItems);
        setActiveStep("fornecedor");
      } else {
        handleReset();
        setTimeout(() => productSearchRef.current?.focus(), 100);
      }
    }
  }, [open]);

  // Focus management on step change
  useEffect(() => {
    if (open) {
      setTimeout(() => {
        if (activeStep === "produtos") productSearchRef.current?.focus();
        else if (activeStep === "fornecedor") supplierSearchRef.current?.focus();
      }, 100);
    }
  }, [activeStep, open]);

  const handleReset = () => {
    setActiveStep("produtos");
    setFornecedor("");
    setDataEntrega(undefined);
    setObservacoes("");
    setItens([]);
    setProductSearch("");
    setSupplierSearch("");
    setSelectedProduct(null);
    setNewProductQuantity("");
    setNewProductPrice("");
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
    
    setItens(prev => [...prev, { 
      produto: selectedProduct.name, 
      quantidade, 
      unidade: newProductUnit, 
      valorUnitario: preco,
      product_id: selectedProduct.id 
    }]);
    
    setLastUsedPrices(prev => ({ ...prev, [selectedProduct.id]: preco }));
    
    // Reset inputs but keep adding
    setSelectedProduct(null);
    setNewProductQuantity("");
    setNewProductPrice("");
    setProductSearch("");
    toast({ title: "Produto adicionado", duration: 1500 });
    
    setTimeout(() => productSearchRef.current?.focus(), 50);
  };

  const selectProductFromList = (product: any) => {
    setSelectedProduct(product);
    setProductSearch("");
    setHighlightedProductIndex(-1);
    if (lastUsedPrices[product.id]) {
      setNewProductPrice(lastUsedPrices[product.id].toString());
    }
    setTimeout(() => {
      quantityInputRef.current?.focus();
      quantityInputRef.current?.select();
    }, 50);
  };

  const handleProductKeyDown = useCallback((e: React.KeyboardEvent, field: 'search' | 'quantity' | 'price') => {
    if (field === 'search' && filteredProducts.length > 0 && !selectedProduct) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setHighlightedProductIndex(prev => prev < filteredProducts.length - 1 ? prev + 1 : 0);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHighlightedProductIndex(prev => prev > 0 ? prev - 1 : filteredProducts.length - 1);
        return;
      }
      if (e.key === 'Enter' && highlightedProductIndex >= 0) {
        e.preventDefault();
        selectProductFromList(filteredProducts[highlightedProductIndex]);
        return;
      }
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      if (field === 'search' && selectedProduct) {
        quantityInputRef.current?.focus();
        quantityInputRef.current?.select();
      } else if (field === 'quantity') {
        priceInputRef.current?.focus();
        priceInputRef.current?.select();
      } else if (field === 'price') {
        handleAddProduct();
      }
    }
  }, [selectedProduct, newProductQuantity, newProductPrice, filteredProducts, highlightedProductIndex]);

  const canProceed = () => {
    switch (activeStep) {
      case "produtos": return itens.length > 0;
      case "fornecedor": return !!fornecedor && !!dataEntrega;
      default: return true;
    }
  };

  const handleNext = () => {
    if (currentStepIndex < STEPS.length - 1 && canProceed()) {
      setActiveStep(STEPS[currentStepIndex + 1].id);
    }
  };

  const handlePrevious = () => {
    if (currentStepIndex > 0) {
      setActiveStep(STEPS[currentStepIndex - 1].id);
    }
  };

  const handleSubmit = async () => {
    if (!user || !fornecedor || !dataEntrega || itens.length === 0) return;
    
    setLoading(true);
    try {
      const total = itens.reduce((acc, item) => acc + item.quantidade * item.valorUnitario, 0);
      const selectedSupplier = suppliers.find(s => s.id === fornecedor);
      const { data: companyData } = await supabase.from("company_users").select("company_id").eq("user_id", user.id).single();
      if (!companyData) throw new Error("Empresa não encontrada");

      const { data: order, error: orderError } = await supabase.from('orders').insert({
        company_id: companyData.company_id,
        supplier_id: fornecedor,
        supplier_name: selectedSupplier?.name || '',
        total_value: total,
        status: 'pendente',
        delivery_date: format(dataEntrega, 'yyyy-MM-dd'),
        observations: observacoes
      }).select().single();
      
      if (orderError) throw orderError;

      const orderItems = itens.map(item => ({
        order_id: order.id,
        product_id: item.product_id || null,
        product_name: item.produto,
        quantity: item.quantidade,
        unit_price: item.valorUnitario,
        total_price: item.quantidade * item.valorUnitario,
        unit: item.unidade
      }));
      
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

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) handleReset();
    onOpenChange(isOpen);
  };

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.altKey && e.key === 'ArrowRight' && canProceed() && currentStepIndex < STEPS.length - 1) {
      e.preventDefault();
      handleNext();
    }
    if (e.altKey && e.key === 'ArrowLeft' && currentStepIndex > 0) {
      e.preventDefault();
      handlePrevious();
    }
    if (e.ctrlKey && e.key === 'Enter' && activeStep === "confirmar") {
      e.preventDefault();
      handleSubmit();
    }
  }, [activeStep, currentStepIndex, itens, fornecedor, dataEntrega]);

  // Helpers de Renderização
  const renderProductItem = (p: any, index: number) => (
    <button
      key={p.id}
      onClick={() => selectProductFromList(p)}
      className={cn(
        "w-full px-3 py-2 text-left text-xs flex items-center justify-between gap-2 transition-all border-b border-gray-100 dark:border-gray-800 last:border-none",
        highlightedProductIndex === index 
          ? "bg-gray-100 dark:bg-gray-800" 
          : "hover:bg-gray-50 dark:hover:bg-gray-800/50"
      )}
    >
      <div className="flex items-center gap-2 overflow-hidden">
        <div className="w-8 h-8 rounded flex items-center justify-center bg-gray-100 dark:bg-gray-800 text-gray-400 flex-shrink-0">
          <Package className="h-4 w-4" />
        </div>
        <div className="flex flex-col min-w-0">
          <span className="font-bold tracking-tight truncate text-gray-900 dark:text-white">{p.name}</span>
          {p.brand_name && (
            <div className="flex items-center gap-1.5">
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
    </button>
  );

  const DialogContentComponent = isMobile ? DrawerContent : DialogContent;
  const DialogHeaderComponent = isMobile ? DrawerHeader : DialogHeader;
  const DialogTitleComponent = isMobile ? DrawerTitle : DialogTitle;
  const DialogDescriptionComponent = isMobile ? DrawerDescription : DialogDescription;

  const content = (
    <>
      {/* Header */}
      <div className="flex-shrink-0 px-4 sm:px-5 py-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 relative overflow-hidden">
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 flex-shrink-0">
              <ShoppingCart className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <DialogTitleComponent className="text-lg font-bold text-gray-900 dark:text-white tracking-tight truncate">
                Novo Pedido
              </DialogTitleComponent>
              <DialogDescriptionComponent className="text-gray-500 dark:text-gray-400 text-xs font-medium truncate">
                Etapa {currentStepIndex + 1}/{STEPS.length}
              </DialogDescriptionComponent>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {currentStepIndex > 0 && (
              <Button type="button" variant="outline" size="sm" onClick={handlePrevious}
                className="border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 h-9 px-3 text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400 shadow-sm">
                <ChevronLeft className="h-3 w-3 sm:mr-1.5" />
                <span className="hidden sm:inline">Voltar</span>
              </Button>
            )}
            
            {currentStepIndex < STEPS.length - 1 ? (
              <Button type="button" size="sm" onClick={handleNext} disabled={!canProceed()}
                className="bg-gray-900 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-200 text-white dark:text-gray-900 font-bold uppercase tracking-wider text-xs shadow-md h-9 px-4 rounded-lg active:scale-95 transition-transform">
                <span className="hidden sm:inline">Próximo</span>
                <ChevronRight className="h-3 w-3 ml-1.5" />
              </Button>
            ) : (
              <Button type="button" size="sm" onClick={handleSubmit} disabled={loading}
                className="bg-gray-900 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-200 text-white dark:text-gray-900 font-bold uppercase tracking-wider text-xs shadow-md h-9 px-4 rounded-lg active:scale-95 transition-transform">
                {loading ? (
                  <><Loader2 className="h-3 w-3 animate-spin mr-1.5" /><span className="hidden sm:inline">Criando...</span></>
                ) : (
                  <><Check className="h-3 w-3 mr-1.5" /><span className="hidden sm:inline">Criar</span></>
                )}
              </Button>
            )}
          </div>
          
          <Button type="button" variant="ghost" size="icon" onClick={() => handleOpenChange(false)}
            className="h-9 w-9 text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg ml-2">
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="mt-3">
          <Progress value={progress} className="h-1 bg-gray-100 dark:bg-gray-800 [&>div]:bg-gray-900 dark:[&>div]:bg-white rounded-full" />
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex-shrink-0 px-4 sm:px-5 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
        <div className="flex space-x-1 overflow-x-auto scrollbar-hide p-1 bg-white dark:bg-gray-950 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
          {STEPS.map((step, index) => {
            const Icon = step.icon;
            const status = index < currentStepIndex ? "completed" : index === currentStepIndex ? "current" : "pending";
            return (
              <button key={step.id} type="button" onClick={() => status !== "pending" && setActiveStep(step.id)}
                disabled={status === "pending"}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap flex-shrink-0 flex-1 justify-center",
                  status === "current" && "bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm ring-1 ring-gray-200 dark:ring-gray-700",
                  status === "completed" && "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer shadow-sm",
                  status === "pending" && "text-gray-400 dark:text-gray-600 cursor-not-allowed"
                )}>
                <div className="flex items-center justify-center w-4 h-4">
                  {status === "completed" ? <Check className="h-3 w-3" /> : <Icon className="h-3 w-3" />}
                </div>
                <span className="hidden sm:inline">{step.title}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden relative bg-gray-50 dark:bg-black">
        
        {/* Step: Produtos */}
        {activeStep === "produtos" && (
          <div className="h-full p-4 sm:p-6 overflow-y-auto custom-scrollbar">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 h-full content-start">
              
              {/* Adicionar Produto */}
              <Card className="border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm h-fit rounded-xl overflow-visible z-10">
                <CardHeader className="pb-3 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 rounded-t-xl">
                  <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white text-sm font-black uppercase tracking-wide">
                    <Plus className="h-4 w-4 text-gray-500" />
                    <span>Adicionar Produto</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                  {/* Busca */}
                  <div className="space-y-1 relative">
                    <Label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Produto</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                      <Input 
                        ref={productSearchRef}
                        placeholder="Buscar produto..." 
                        value={selectedProduct ? selectedProduct.name : productSearch}
                        onChange={(e) => { setProductSearch(e.target.value); setSelectedProduct(null); }}
                        onKeyDown={(e) => handleProductKeyDown(e, 'search')}
                        className="pl-9 h-9 bg-white dark:bg-gray-950 border-gray-200 dark:border-gray-800 text-xs font-medium rounded-lg focus:ring-gray-400/20" 
                      />
                      {/* Dropdown de resultados */}
                      {filteredProducts.length > 0 && !selectedProduct && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg shadow-xl max-h-[200px] overflow-y-auto z-50">
                          {filteredProducts.map((p, i) => renderProductItem(p, i))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Quantidade</Label>
                      <Input 
                        ref={quantityInputRef}
                        type="number" 
                        placeholder="0"
                        value={newProductQuantity}
                        onChange={(e) => setNewProductQuantity(e.target.value)}
                        onKeyDown={(e) => handleProductKeyDown(e, 'quantity')}
                        className="h-9 bg-white dark:bg-gray-950 border-gray-200 dark:border-gray-800 text-xs font-medium rounded-lg"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Preço Unit.</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">R$</span>
                        <Input 
                          ref={priceInputRef}
                          inputMode="decimal"
                          placeholder="0,00"
                          value={newProductPrice}
                          onChange={(e) => setNewProductPrice(e.target.value)}
                          onKeyDown={(e) => handleProductKeyDown(e, 'price')}
                          className="pl-8 h-9 bg-white dark:bg-gray-950 border-gray-200 dark:border-gray-800 text-xs font-medium rounded-lg"
                        />
                      </div>
                    </div>
                  </div>

                  <Button onClick={handleAddProduct} disabled={!selectedProduct || !newProductQuantity || !newProductPrice}
                    className="w-full bg-gray-900 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-200 text-white dark:text-gray-900 font-bold uppercase tracking-wider text-xs h-9 rounded-lg shadow-sm">
                    <Plus className="h-3.5 w-3.5 mr-2" />
                    Adicionar Item
                  </Button>
                </CardContent>
              </Card>

              {/* Lista de Itens */}
              <Card className="border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm h-full max-h-[400px] lg:max-h-none rounded-xl overflow-hidden flex flex-col">
                <CardHeader className="pb-3 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 flex-shrink-0">
                  <CardTitle className="flex items-center justify-between text-sm font-black uppercase tracking-wide">
                    <span className="flex items-center gap-2 text-gray-900 dark:text-white">
                      <ShoppingCart className="h-4 w-4 text-gray-500" />
                      Itens do Pedido
                    </span>
                    <Badge variant="outline" className="bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white border-gray-200 dark:border-gray-700 font-bold">
                      {itens.length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0 flex-1 overflow-hidden p-0">
                  <ScrollArea className="h-full">
                    <div className="p-4 space-y-2">
                      {itens.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                          <Package className="h-8 w-8 opacity-20 mb-2" />
                          <p className="text-xs font-medium">Nenhum item adicionado</p>
                        </div>
                      ) : (
                        itens.map((item, index) => (
                          <div key={index} className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg shadow-sm group">
                            <div className="w-8 h-8 rounded bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0 font-bold text-xs text-gray-500">
                              {index + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-gray-900 dark:text-white truncate">{item.produto}</p>
                              <div className="flex items-center gap-2 mt-0.5 text-[10px] text-gray-500">
                                <span>{item.quantidade} {item.unidade}</span>
                                <span>x</span>
                                <span>R$ {item.valorUnitario.toFixed(2)}</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-xs font-black text-gray-900 dark:text-white">R$ {(item.quantidade * item.valorUnitario).toFixed(2)}</p>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => setItens(itens.filter((_, i) => i !== index))}
                              className="h-6 w-6 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded">
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        )).reverse()
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
                <div className="p-3 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 flex justify-between items-center">
                  <span className="text-xs font-bold text-gray-500 uppercase">Total Estimado</span>
                  <span className="text-sm font-black text-gray-900 dark:text-white">
                    R$ {itens.reduce((acc, i) => acc + i.quantidade * i.valorUnitario, 0).toFixed(2)}
                  </span>
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* Step: Fornecedor */}
        {activeStep === "fornecedor" && (
          <div className="h-full p-4 sm:p-6 overflow-y-auto custom-scrollbar">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 h-full content-start">
              
              {/* Selecionar Fornecedor */}
              <Card className="border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm h-fit rounded-xl overflow-hidden">
                <CardHeader className="pb-3 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
                  <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white text-sm font-black uppercase tracking-wide">
                    <Building2 className="h-4 w-4 text-gray-500" />
                    <span>Selecionar Fornecedor</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                    <Input 
                      ref={supplierSearchRef}
                      placeholder="Buscar fornecedor..." 
                      value={supplierSearch}
                      onChange={(e) => setSupplierSearch(e.target.value)}
                      className="pl-9 h-9 bg-white dark:bg-gray-950 border-gray-200 dark:border-gray-800 text-xs font-medium rounded-lg" 
                    />
                  </div>
                  
                  <ScrollArea className="h-[250px] border border-gray-200 dark:border-gray-800 rounded-lg bg-gray-50 dark:bg-gray-950">
                    <div className="p-1.5 space-y-1">
                      {filteredSuppliers.map(s => (
                        <button
                          key={s.id}
                          onClick={() => setFornecedor(s.id)}
                          className={cn(
                            "w-full p-2 rounded-md text-left transition-all flex items-center gap-3 group",
                            fornecedor === s.id 
                              ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-sm" 
                              : "hover:bg-gray-100 dark:hover:bg-gray-800"
                          )}
                        >
                          <Building2 className={cn("h-4 w-4", fornecedor === s.id ? "text-white dark:text-gray-900" : "text-gray-400")} />
                          <div className="flex-1 min-w-0">
                            <p className={cn("text-xs font-bold truncate", fornecedor === s.id ? "text-white dark:text-gray-900" : "text-gray-700 dark:text-gray-300")}>{s.name}</p>
                            {s.contact && <p className={cn("text-[10px] truncate opacity-80", fornecedor === s.id ? "text-gray-300 dark:text-gray-600" : "text-gray-500")}>{s.contact}</p>}
                          </div>
                          {fornecedor === s.id && <Check className="h-4 w-4" />}
                        </button>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Detalhes do Pedido */}
              <Card className="border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm h-fit rounded-xl overflow-hidden">
                <CardHeader className="pb-3 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
                  <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white text-sm font-black uppercase tracking-wide">
                    <FileText className="h-4 w-4 text-gray-500" />
                    <span>Detalhes da Entrega</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                  {fornecedor && (
                    <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-800 mb-4">
                      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Fornecedor Selecionado</span>
                      <p className="text-sm font-black text-gray-900 dark:text-white mt-1">
                        {suppliers.find(s => s.id === fornecedor)?.name}
                      </p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Data de Entrega</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className={cn(
                          "w-full justify-start text-left font-medium h-10 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800",
                          !dataEntrega && "text-gray-400"
                        )}>
                          <CalendarIcon className="mr-2 h-4 w-4 text-gray-400" />
                          {dataEntrega ? format(dataEntrega, "dd/MM/yyyy", { locale: ptBR }) : "Selecione a data..."}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 border-gray-200 dark:border-gray-700" align="start">
                        <Calendar mode="single" selected={dataEntrega}
                          onSelect={setDataEntrega} locale={ptBR}
                          disabled={(date) => date < new Date(new Date().setHours(0,0,0,0))} 
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Observações</Label>
                    <Textarea 
                      placeholder="Instruções de entrega, pagamento..." 
                      value={observacoes}
                      onChange={(e) => setObservacoes(e.target.value)}
                      className="min-h-[100px] resize-none bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-sm" 
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Step: Confirmar */}
        {activeStep === "confirmar" && (
          <div className="h-full p-4 sm:p-6 overflow-y-auto custom-scrollbar">
             <div className="max-w-2xl mx-auto space-y-4">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Resumo Fornecedor */}
                <Card className="border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm rounded-xl overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 rounded bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                        <Building2 className="h-3.5 w-3.5 text-gray-500" />
                      </div>
                      <span className="text-xs font-black uppercase tracking-wider text-gray-500">Fornecedor</span>
                    </div>
                    <p className="text-sm font-bold text-gray-900 dark:text-white pl-8">
                      {suppliers.find(s => s.id === fornecedor)?.name}
                    </p>
                  </CardContent>
                </Card>

                {/* Resumo Entrega */}
                <Card className="border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm rounded-xl overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 rounded bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                        <CalendarIcon className="h-3.5 w-3.5 text-gray-500" />
                      </div>
                      <span className="text-xs font-black uppercase tracking-wider text-gray-500">Entrega</span>
                    </div>
                    <p className="text-sm font-bold text-gray-900 dark:text-white pl-8">
                      {dataEntrega ? format(dataEntrega, "dd/MM/yyyy", { locale: ptBR }) : "-"}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Resumo Itens */}
              <Card className="border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm rounded-xl overflow-hidden">
                <CardHeader className="pb-3 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
                  <CardTitle className="flex items-center justify-between text-sm font-black uppercase tracking-wide">
                    <span className="flex items-center gap-2 text-gray-900 dark:text-white">
                      <ShoppingCart className="h-4 w-4 text-gray-500" />
                      Itens do Pedido
                    </span>
                    <Badge variant="secondary" className="font-bold">{itens.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-gray-100 dark:divide-gray-800">
                    {itens.map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                        <div className="flex-1">
                          <p className="text-xs font-bold text-gray-900 dark:text-white">{item.produto}</p>
                          <p className="text-[10px] text-gray-500">{item.quantidade} {item.unidade} x R$ {item.valorUnitario.toFixed(2)}</p>
                        </div>
                        <p className="text-xs font-black text-gray-900 dark:text-white">
                          R$ {(item.quantidade * item.valorUnitario).toFixed(2)}
                        </p>
                      </div>
                    ))}
                  </div>
                  <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-800 flex justify-between items-center">
                    <span className="text-xs font-black uppercase tracking-wider text-gray-500">Valor Total</span>
                    <span className="text-lg font-black text-gray-900 dark:text-white">
                      R$ {itens.reduce((acc, i) => acc + i.quantidade * i.valorUnitario, 0).toFixed(2)}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Resumo Observações */}
              {observacoes && (
                <Card className="border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm rounded-xl overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 rounded bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                        <FileText className="h-3.5 w-3.5 text-gray-500" />
                      </div>
                      <span className="text-xs font-black uppercase tracking-wider text-gray-500">Observações</span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 pl-8">{observacoes}</p>
                  </CardContent>
                </Card>
              )}
             </div>
          </div>
        )}

      </div>
    </>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={handleOpenChange}>
        <DrawerContent 
          className="flex flex-col p-0 gap-0 overflow-hidden border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 transition-all duration-200"
          style={{ 
            height: keyboardOffset > 0 ? `calc(100vh - ${keyboardOffset}px)` : '90vh',
            maxHeight: keyboardOffset > 0 ? `calc(100vh - ${keyboardOffset}px)` : '90vh',
            paddingBottom: keyboardOffset > 0 ? 0 : 'env(safe-area-inset-bottom, 20px)'
          }}
        >
          {content}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent 
        className="w-[96vw] sm:w-[92vw] md:w-[90vw] max-w-[900px] h-[90vh] sm:h-[88vh] max-h-[750px] p-0 gap-0 overflow-hidden border border-gray-200 dark:border-gray-800 shadow-md rounded-2xl flex flex-col bg-white dark:bg-gray-950"
        onKeyDown={handleKeyDown}
      >
        {content}
      </DialogContent>
    </Dialog>
  );
}
