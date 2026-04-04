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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { designSystem as ds } from "@/styles/design-system";

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

import { usePackagingItems } from "@/hooks/usePackagingItems";
import { useSuppliers } from "@/hooks/useSuppliers";
import { QuickCreateProduct } from "./QuickCreateProduct";
import { QuickCreateSupplier } from "./QuickCreateSupplier";

export default function AddPedidoDialog({ open, onOpenChange, onAdd, preSelectedProducts = [] }: AddPedidoDialogProps) {
  const isMobile = useIsMobile();
  const keyboardOffset = useKeyboardOffset();
  const { toast } = useToast();
  const { user } = useAuth();
  const { logActivity } = useActivityLog();

  // Data Hooks
  const [searchedProducts, setSearchedProducts] = useState<any[]>([]);
  const [isSearchingProducts, setIsSearchingProducts] = useState(false);
  const { suppliers, isLoading: suppliersLoading, refetch: refetchSuppliers } = useSuppliers();

  // Form states
  const [activeStep, setActiveStep] = useState("produtos");
  const [fornecedor, setFornecedor] = useState("");
  const [dataEntrega, setDataEntrega] = useState<Date | undefined>(undefined);
  const [observacoes, setObservacoes] = useState("");
  const [itens, setItens] = useState<PedidoItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Search/Input states
  const [productSearch, setProductSearch] = useState("");
  const [supplierSearch, setSupplierSearch] = useState("");
  const [highlightedProductIndex, setHighlightedProductIndex] = useState(-1);
  const [showProductSuggestions, setShowProductSuggestions] = useState(false);
  const debouncedProductSearch = useDebounce(productSearch, 300);
  const debouncedSupplierSearch = useDebounce(supplierSearch, 300);

  // New item states
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [newProductQuantity, setNewProductQuantity] = useState("");
  const [newProductUnit, setNewProductUnit] = useState("un");
  const [newProductPrice, setNewProductPrice] = useState("");
  const [lastUsedPrices, setLastUsedPrices] = useState<Record<string, number>>({});
  const [showQuickCreateProduct, setShowQuickCreateProduct] = useState(false);
  const [showQuickCreateSupplier, setShowQuickCreateSupplier] = useState(false);

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

  // Busca reativa de produtos
  useEffect(() => {
    async function searchProducts() {
      if (!debouncedProductSearch || debouncedProductSearch.trim().length < 3) {
        setSearchedProducts([]);
        setShowProductSuggestions(false);
        return;
      }

      setIsSearchingProducts(true);
      try {
        const term = debouncedProductSearch.trim();
        const { data, error } = await supabase
          .from('products')
          .select('id, name, unit')
          .ilike('name', `%${term}%`)
          .order('name')
          .limit(20);

        if (error) throw error;
        setSearchedProducts(data || []);
        if ((data || []).length > 0) {
          setShowProductSuggestions(true);
        }
      } catch (err) {
        console.error("Erro ao buscar produtos:", err);
      } finally {
        setIsSearchingProducts(false);
      }
    }

    if (!selectedProduct) {
      searchProducts();
    }
  }, [debouncedProductSearch, selectedProduct]);

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
    setShowQuickCreateProduct(false);
    setShowQuickCreateSupplier(false);
  };

  const loadLastPrices = async () => {
    const { data } = await supabase.from('order_items').select('product_id, unit_price').limit(100);
    if (data) {
      const pricesMap: Record<string, number> = {};
      data.forEach((item: any) => { if (!pricesMap[item.product_id]) pricesMap[item.product_id] = item.unit_price; });
      setLastUsedPrices(pricesMap);
    }
  };

  const filteredSuppliers = useMemo(() => {
    if (!debouncedSupplierSearch) return suppliers;
    return suppliers.filter(s => s.name.toLowerCase().includes(debouncedSupplierSearch.toLowerCase()));
  }, [suppliers, debouncedSupplierSearch]);

  const handleAddProduct = () => {
    const productName = selectedProduct ? selectedProduct.name : productSearch.trim();
    const quantidade = parseDecimalInput(newProductQuantity);
    const preco = newProductPrice ? parseFloat(newProductPrice.replace(',', '.')) : 0;
    
    if (!quantidade || quantidade <= 0) {
      toast({ title: "Erro", description: "Quantidade inválida", variant: "destructive" });
      return;
    }
    
    if (!productName) {
      toast({ title: "Erro", description: "Informe o produto", variant: "destructive" });
      return;
    }
    
    setItens(prev => [...prev, { 
      produto: productName, 
      quantidade, 
      unidade: newProductUnit, 
      valorUnitario: preco,
      product_id: selectedProduct?.id 
    }]);
    
    if (selectedProduct) {
      setLastUsedPrices(prev => ({ ...prev, [selectedProduct.id]: preco }));
    }
    
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
    setSearchedProducts([]);
    setHighlightedProductIndex(-1);
    
    // Set default unit and price
    if (product.unit) {
      setNewProductUnit(product.unit);
    }
    
    if (lastUsedPrices[product.id]) {
      setNewProductPrice(lastUsedPrices[product.id].toString());
    }
    
    setTimeout(() => {
      quantityInputRef.current?.focus();
      if (quantityInputRef.current) {
        quantityInputRef.current.select();
      }
    }, 50);
  };

  const handleProductKeyDown = useCallback((e: React.KeyboardEvent, field: 'search' | 'quantity' | 'price') => {
    if (field === 'search' && searchedProducts.length > 0 && !selectedProduct) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setHighlightedProductIndex(prev => prev < searchedProducts.length - 1 ? prev + 1 : 0);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHighlightedProductIndex(prev => prev > 0 ? prev - 1 : searchedProducts.length - 1);
        return;
      }
      if (e.key === 'Enter' && highlightedProductIndex >= 0) {
        e.preventDefault();
        selectProductFromList(searchedProducts[highlightedProductIndex]);
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
  }, [selectedProduct, newProductQuantity, newProductPrice, searchedProducts, highlightedProductIndex]);

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
        order_date: format(new Date(), 'yyyy-MM-dd'),
        delivery_date: format(dataEntrega, 'yyyy-MM-dd'),
        observations: observacoes
      }).select().single();
      
      if (orderError) throw orderError;

      const orderItems = itens.map(item => ({
        order_id: order.id,
        product_id: item.product_id || null,
        product_name: item.produto,
        quantity: item.quantidade,
        unit: item.unidade,
        unit_price: item.valorUnitario,
        total_price: item.quantidade * item.valorUnitario,
        // Campos para consistência com economia real
        quantidade_pedida: item.quantidade,
        unidade_pedida: item.unidade,
        valor_unitario_cotado: item.valorUnitario,
        maior_valor_cotado: item.valorUnitario // No pedido manual, o maior é o único
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

  // Scroll into view helper para inputs
  const handleInputFocus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!isMobile) return;
    setTimeout(() => {
      e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 300);
  };

  // Helpers de Renderização
  const renderProductItem = (p: any, index: number) => (
    <button
      key={p.id}
      onMouseDown={(e) => {
        e.preventDefault();
        setSelectedProduct(p);
        setProductSearch(p.name);
        setNewProductUnit(p.unit || 'un');
        setShowProductSuggestions(false);
        setHighlightedProductIndex(-1);
        setTimeout(() => quantityInputRef.current?.focus(), 50);
      }}
      onMouseEnter={() => setHighlightedProductIndex(index)}
      className={cn(
        "w-full px-4 py-2.5 text-left transition-all",
        highlightedProductIndex === index
          ? "bg-brand/10 text-brand"
          : ds.colors.surface.hover
      )}
    >
      <div className="flex items-center gap-3 overflow-hidden">
        <div className={cn(
          "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
          highlightedProductIndex === index
            ? "bg-brand/20 text-brand"
            : cn(ds.colors.surface.section, ds.colors.text.secondary)
        )}>
          <Package className="h-4 w-4" />
        </div>
        <div className="flex flex-col min-w-0">
          <span className={cn(
            ds.typography.weight.bold,
            ds.typography.size.sm,
            "truncate"
          )}>{p.name}</span>
          {p.unit && (
            <span className={cn(
              ds.typography.size.xs,
              ds.colors.text.secondary,
              "mt-0.5"
            )}>{p.unit}</span>
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
      <div className={cn(ds.components.modal.header, "flex-shrink-0")}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-brand flex items-center justify-center shadow-lg shadow-brand/20 flex-shrink-0">
              <ShoppingCart className="h-5 w-5 text-brand-foreground stroke-[2.5]" />
            </div>
            <div className="flex-1 min-w-0">
              <DialogTitleComponent className={cn(ds.components.modal.title, "truncate")}>
                Novo Pedido
              </DialogTitleComponent>
              <DialogDescriptionComponent className={cn(ds.typography.size.xs, ds.typography.weight.medium, ds.colors.text.secondary, "truncate mt-1")}>
                Etapa {currentStepIndex + 1}/{STEPS.length}
              </DialogDescriptionComponent>
            </div>
          </div>

          <Button 
            type="button" 
            variant="ghost" 
            size="icon" 
            onClick={() => handleOpenChange(false)}
            className={cn(ds.components.button.ghost, ds.components.button.size.icon, "ml-2")}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        <div className="mt-4">
          <Progress 
            value={progress} 
            className={cn(
              "h-1.5 rounded-full",
              ds.colors.surface.section,
              "[&>div]:bg-brand"
            )} 
          />
        </div>
      </div>

      {/* Tab Navigation */}
      <div className={cn(
        "flex-shrink-0 px-6 border-b bg-transparent",
        ds.colors.border.default
      )}>
        <div className={ds.components.tabs.clean.list}>
          {STEPS.map((step, index) => {
            const Icon = step.icon;
            const status = index < currentStepIndex ? "completed" : index === currentStepIndex ? "current" : "pending";
            const isActive = index === currentStepIndex;
            
            return (
              <button 
                key={step.id} 
                type="button" 
                onClick={() => setActiveStep(step.id)}
                className={cn(
                  ds.components.tabs.clean.trigger,
                  "flex items-center gap-2",
                  isActive && "data-[state=active]"
                )}
                data-state={isActive ? "active" : "inactive"}
              >
                <div className="flex items-center justify-center w-4 h-4">
                  {status === "completed" ? (
                    <Check className="h-4 w-4 text-brand" />
                  ) : (
                    <Icon className="h-4 w-4" />
                  )}
                </div>
                <span className="hidden sm:inline">{step.title}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className={cn("flex-1 overflow-hidden relative", ds.colors.surface.page)}>
        
        {/* Step: Produtos */}
        {activeStep === "produtos" && (
          <div className="h-full p-6 overflow-y-auto custom-scrollbar">
            <div className="flex flex-col lg:grid lg:grid-cols-2 gap-6 h-full">
              
              {/* Adicionar Produto */}
              <Card className={cn(ds.components.card.root, "overflow-visible")}>
                <CardHeader className={ds.components.card.header}>
                  <CardTitle className={cn(ds.components.card.title, "flex items-center gap-2")}>
                    <Plus className="h-4 w-4 text-brand flex-shrink-0" />
                    <span>Adicionar Produto</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className={cn(ds.components.card.body, "space-y-4 overflow-visible")}>
                  {/* Busca */}
                  <div className={ds.components.input.group}>
                    <Label className={ds.components.input.label}>Produto *</Label>
                    <div className="relative overflow-visible">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 group-focus-within:text-brand transition-colors" />
                      <Input 
                        ref={productSearchRef}
                        placeholder="Buscar produto..." 
                        value={selectedProduct ? selectedProduct.name : productSearch}
                        onChange={(e) => { setProductSearch(e.target.value); setSelectedProduct(null); }}
                        onKeyDown={(e) => handleProductKeyDown(e, 'search')}
                        onFocus={(e) => {
                          if (productSearch.trim().length >= 3 && searchedProducts.length > 0) {
                            setShowProductSuggestions(true);
                          } else {
                            setShowProductSuggestions(false);
                          }
                          handleInputFocus(e);
                        }}
                        className={cn(ds.components.input.root, "pl-10")} 
                      />
                      {showProductSuggestions && searchedProducts.length > 0 && !selectedProduct && (
                        <div className={cn(
                          "absolute top-full left-0 right-0 mt-2 rounded-xl shadow-2xl max-h-[250px] overflow-y-auto z-[200] custom-scrollbar animate-in fade-in zoom-in-95 duration-200",
                          ds.colors.surface.card,
                          ds.colors.border.default,
                          "border"
                        )}>
                          {searchedProducts.map((p, i) => renderProductItem(p, i))}
                        </div>
                      )}
                      {showProductSuggestions && productSearch.trim().length >= 3 && searchedProducts.length === 0 && !selectedProduct && !isSearchingProducts && !showQuickCreateProduct && (
                        <div className={cn(
                          "absolute top-full left-0 right-0 mt-2 rounded-xl shadow-2xl p-6 text-center z-[100] animate-in fade-in zoom-in-95",
                          ds.colors.surface.card,
                          ds.colors.border.default,
                          "border"
                        )}>
                          <Package className={cn("h-8 w-8 mx-auto mb-2 opacity-20", ds.colors.text.secondary)} />
                          <p className={cn(ds.typography.size.sm, ds.typography.weight.medium, ds.colors.text.secondary, "mb-4")}>
                            Este produto não consta no sistema
                          </p>
                          <Button
                            type="button"
                            onClick={() => {
                              setShowProductSuggestions(false);
                              setShowQuickCreateProduct(true);
                            }}
                            className={cn(ds.components.button.primary, "h-8 text-xs px-4 mx-auto")}
                          >
                            <Plus className="h-3.5 w-3.5 mr-1.5" />
                            Cadastrar "{productSearch}"
                          </Button>
                        </div>
                      )}

                      {/* Formulário inline de cadastro rápido de produto */}
                      {showQuickCreateProduct && (
                        <div className={cn(
                          "mt-4 p-4 rounded-xl border border-dashed animate-in fade-in slide-in-from-top-2",
                          ds.colors.border.default
                        )}>
                          <QuickCreateProduct
                            initialName={productSearch}
                            onCreated={(product) => {
                              setShowQuickCreateProduct(false);
                              setSelectedProduct({ id: product.id, name: product.name, unit: product.unit });
                              setNewProductUnit(product.unit || 'un');
                              setProductSearch("");
                              setTimeout(() => {
                                quantityInputRef.current?.focus();
                              }, 100);
                            }}
                            onCancel={() => {
                              setShowQuickCreateProduct(false);
                              productSearchRef.current?.focus();
                            }}
                          />
                        </div>
                      )}
                      {isSearchingProducts && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <Loader2 className="h-3 w-3 animate-spin text-zinc-400" />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-6 gap-3">
                    <div className={cn(ds.components.input.group, "col-span-3 sm:col-span-2")}>
                      <Label className={ds.components.input.label}>Qtd *</Label>
                      <Input 
                        ref={quantityInputRef}
                        type="number" 
                        placeholder="0"
                        value={newProductQuantity}
                        onChange={(e) => setNewProductQuantity(e.target.value)}
                        onKeyDown={(e) => handleProductKeyDown(e, 'quantity')}
                        onFocus={handleInputFocus}
                        className={cn(ds.components.input.root, "h-9")}
                      />
                    </div>
                    
                    <div className={cn(ds.components.input.group, "col-span-3 sm:col-span-1")}>
                      <Label className={ds.components.input.label}>Unid *</Label>
                      <Select value={newProductUnit} onValueChange={setNewProductUnit}>
                        <SelectTrigger className={cn(ds.components.input.root, "h-9 px-2")}>
                          <SelectValue placeholder="Un" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="kg">kg</SelectItem>
                          <SelectItem value="un">un</SelectItem>
                          <SelectItem value="pct">pct</SelectItem>
                          <SelectItem value="cx">cx</SelectItem>
                          <SelectItem value="g">g</SelectItem>
                          <SelectItem value="l">l</SelectItem>
                          <SelectItem value="ml">ml</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className={cn(ds.components.input.group, "col-span-6 sm:col-span-3")}>
                      <Label className={ds.components.input.label}>Preço Unit.</Label>
                      <div className="relative">
                        <span className={cn(
                          "absolute left-3 top-1/2 -translate-y-1/2",
                          ds.typography.size.xs,
                          ds.typography.weight.bold,
                          ds.colors.text.secondary
                        )}>R$</span>
                        <Input 
                          ref={priceInputRef}
                          inputMode="decimal"
                          placeholder="0,00"
                          value={newProductPrice}
                          onChange={(e) => setNewProductPrice(e.target.value)}
                          onKeyDown={(e) => handleProductKeyDown(e, 'price')}
                          onFocus={handleInputFocus}
                          className={cn(ds.components.input.root, "pl-10 h-9")}
                        />
                      </div>
                    </div>
                  </div>

                  <Button 
                    onClick={handleAddProduct} 
                    disabled={(!selectedProduct && productSearch.trim().length < 2) || !newProductQuantity}
                    className={cn(ds.components.button.primary, "w-full h-10")}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar (Enter)
                  </Button>
                </CardContent>
              </Card>

              {/* Lista de Itens */}
              <Card className={cn(ds.components.card.root, "min-h-[200px] max-h-[350px] lg:max-h-none lg:h-full flex flex-col overflow-hidden")}>
                <CardHeader className={cn(ds.components.card.header, "flex-shrink-0")}>
                  <CardTitle className={cn(ds.components.card.title, "flex items-center justify-between")}>
                    <span className="flex items-center gap-2">
                      <ShoppingCart className="h-4 w-4 text-brand" />
                      Itens do Pedido
                    </span>
                    <Badge className={cn(
                      ds.components.badge.base,
                      "bg-brand/10 text-brand border-brand/20"
                    )}>
                      {itens.length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0 flex-1 overflow-hidden p-0">
                  <ScrollArea className="h-full">
                    <div className="p-2 space-y-2">
                      {itens.length === 0 ? (
                        <div className={cn(
                          "flex flex-col items-center justify-center py-12",
                          ds.colors.text.secondary
                        )}>
                          <Package className="h-12 w-12 opacity-20 mb-3" />
                          <p className={cn(ds.typography.size.sm, ds.typography.weight.medium)}>Nenhum item adicionado</p>
                        </div>
                      ) : (
                        itens.map((item, index) => (
                          <div key={index} className={cn(
                            "flex items-center gap-2 p-2.5 rounded-lg border shadow-sm group",
                            ds.colors.surface.card,
                            ds.colors.border.default
                          )}>
                            <div className={cn(
                              "w-6 h-6 rounded flex items-center justify-center flex-shrink-0",
                              ds.typography.size.xs,
                              ds.typography.weight.bold,
                              "bg-zinc-100 dark:bg-zinc-800 text-zinc-500"
                            )}>
                              {index + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={cn(
                                "text-[13px]",
                                ds.typography.weight.bold,
                                ds.colors.text.primary,
                                "truncate leading-tight"
                              )}>{item.produto}</p>
                              <div className={cn(
                                "flex items-center gap-1.5 mt-0.5",
                                "text-[11px]",
                                ds.colors.text.secondary
                              )}>
                                <span>{item.quantidade} {item.unidade}</span>
                                <span>×</span>
                                <span className={cn(item.valorUnitario <= 0 && "text-zinc-500 italic")}>
                                  {item.valorUnitario > 0 ? `R$ ${item.valorUnitario.toFixed(2)}` : 'Sem preço'}
                                </span>
                              </div>
                            </div>
                            <div className="text-right ml-auto px-1">
                              <p className={cn(
                                "text-[13px]",
                                ds.typography.weight.bold,
                                ds.colors.text.primary
                              )}>R$ {(item.quantidade * item.valorUnitario).toFixed(2)}</p>
                            </div>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => setItens(itens.filter((_, i) => i !== index))}
                              className={cn(ds.components.button.danger, "h-8 w-8")}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )).reverse()
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
                <div className={cn(
                  "p-4 flex justify-between items-center",
                  ds.colors.border.default,
                  ds.colors.surface.section,
                  "border-t"
                )}>
                  <span className={cn(
                    ds.typography.size.sm,
                    ds.typography.weight.bold,
                    ds.colors.text.secondary,
                    "uppercase"
                  )}>Total Estimado</span>
                  <span className={cn(
                    ds.typography.size.lg,
                    ds.typography.weight.bold,
                    "text-brand"
                  )}>
                    R$ {itens.reduce((acc, i) => acc + i.quantidade * i.valorUnitario, 0).toFixed(2)}
                  </span>
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* Step: Fornecedor */}
        {activeStep === "fornecedor" && (
          <div className="h-full p-6 overflow-visible">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full content-start overflow-visible">
              
              {/* Selecionar Fornecedor */}
              <Card className={cn(ds.components.card.root, "overflow-visible")}>
                <CardHeader className={ds.components.card.header}>
                  <CardTitle className={cn(ds.components.card.title, "flex items-center gap-2")}>
                    <Building2 className="h-4 w-4 text-brand flex-shrink-0" />
                    <span>Selecionar Fornecedor</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className={cn(ds.components.card.body, "space-y-4 overflow-visible")}>
                  <div className={cn(ds.components.input.group, "relative z-50")}>
                    <Label className={ds.components.input.label}>Buscar Fornecedor *</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 group-focus-within:text-brand transition-colors z-10" />
                      <Input 
                        ref={supplierSearchRef}
                        placeholder="Digite para buscar..." 
                        value={supplierSearch}
                        onChange={(e) => setSupplierSearch(e.target.value)}
                        onFocus={handleInputFocus}
                        className={cn(ds.components.input.root, "pl-10")} 
                      />
                      
                      {/* Dropdown de resultados - posicionado absolutamente */}
                      {debouncedSupplierSearch && filteredSuppliers.length > 0 && (
                        <div className={cn(
                          "absolute top-full left-0 right-0 mt-2 z-[100] rounded-xl border shadow-xl max-h-[280px] overflow-y-auto custom-scrollbar",
                          ds.colors.surface.card,
                          ds.colors.border.default
                        )}>
                          <div className="p-2 space-y-1.5">
                            {filteredSuppliers.map(s => (
                              <button
                                key={s.id}
                                onClick={() => {
                                  setFornecedor(s.id);
                                  setSupplierSearch("");
                                }}
                                className={cn(
                                  "w-full p-3 rounded-lg text-left transition-all flex items-center gap-3 group",
                                  fornecedor === s.id 
                                    ? "bg-brand text-brand-foreground shadow-lg shadow-brand/20" 
                                    : cn(
                                        ds.colors.surface.hover,
                                        ds.colors.text.primary
                                      )
                                )}
                              >
                                <div className={cn(
                                  "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                                  fornecedor === s.id 
                                    ? "bg-brand-foreground/10 text-brand-foreground" 
                                    : cn(ds.colors.surface.section, ds.colors.text.secondary)
                                )}>
                                  <Building2 className="h-4 w-4" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className={cn(
                                    ds.typography.size.sm,
                                    ds.typography.weight.bold,
                                    "truncate",
                                    fornecedor === s.id && "text-brand-foreground"
                                  )}>{s.name}</p>
                                  {s.contact && (
                                    <p className={cn(
                                      ds.typography.size.xs,
                                      "truncate opacity-70 mt-0.5",
                                      fornecedor === s.id ? "text-brand-foreground" : ds.colors.text.secondary
                                    )}>{s.contact}</p>
                                  )}
                                </div>
                                {fornecedor === s.id && <Check className="h-4 w-4 text-brand-foreground flex-shrink-0" />}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Mensagem quando não há resultados - Com opção de cadastro rápido */}
                      {supplierSearch && filteredSuppliers.length === 0 && !showQuickCreateSupplier && (
                        <div className={cn(
                          "absolute top-full left-0 right-0 mt-2 z-[100] p-8 rounded-xl border text-center animate-in fade-in zoom-in-95",
                          ds.colors.surface.card,
                          ds.colors.border.default,
                          "shadow-xl"
                        )}>
                          <Building2 className={cn("h-10 w-10 mx-auto mb-3 opacity-20", ds.colors.text.secondary)} />
                          <p className={cn(
                            ds.typography.size.sm,
                            ds.typography.weight.medium,
                            ds.colors.text.secondary,
                            "mb-4"
                          )}>Fornecedor não encontrado</p>
                          <Button
                            type="button"
                            onClick={() => setShowQuickCreateSupplier(true)}
                            className={cn(ds.components.button.primary, "h-8 text-xs px-4 mx-auto")}
                          >
                            <Plus className="h-3.5 w-3.5 mr-1.5" />
                            Cadastrar "{supplierSearch}"
                          </Button>
                        </div>
                      )}

                      {/* Formulário inline de cadastro rápido de fornecedor */}
                      {showQuickCreateSupplier && (
                        <div className={cn(
                          "mt-4 p-4 rounded-xl border border-dashed animate-in fade-in slide-in-from-top-2",
                          ds.colors.border.default
                        )}>
                          <QuickCreateSupplier
                            initialName={supplierSearch}
                            onCreated={async (supplier) => {
                              setShowQuickCreateSupplier(false);
                              // Refresh da lista de fornecedores
                              if (refetchSuppliers) await refetchSuppliers();
                              
                              // Selecionar o novo fornecedor
                              setFornecedor(supplier.id);
                              setSupplierSearch("");
                            }}
                            onCancel={() => {
                              setShowQuickCreateSupplier(false);
                              supplierSearchRef.current?.focus();
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Mostrar fornecedor selecionado */}
                  {fornecedor && !supplierSearch && (
                    <div className={cn(
                      "p-4 rounded-xl border",
                      "bg-brand/5 border-brand/20"
                    )}>
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-brand/20 flex items-center justify-center flex-shrink-0">
                            <Building2 className="h-4 w-4 text-brand" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={cn(
                              ds.typography.size.xs,
                              ds.typography.weight.bold,
                              "text-brand",
                              "uppercase tracking-wider mb-1"
                            )}>Fornecedor Selecionado</p>
                            <p className={cn(
                              ds.typography.size.sm,
                              ds.typography.weight.bold,
                              ds.colors.text.primary,
                              "truncate"
                            )}>{suppliers.find(s => s.id === fornecedor)?.name}</p>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setFornecedor("");
                            setSupplierSearch("");
                            setTimeout(() => supplierSearchRef.current?.focus(), 50);
                          }}
                          className={cn(ds.components.button.ghost, "h-8 w-8 text-brand hover:text-brand hover:bg-brand/10")}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Detalhes do Pedido */}
              <Card className={ds.components.card.root}>
                <CardHeader className={ds.components.card.header}>
                  <CardTitle className={cn(ds.components.card.title, "flex items-center gap-2")}>
                    <FileText className="h-4 w-4 text-brand flex-shrink-0" />
                    <span>Detalhes da Entrega</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className={cn(ds.components.card.body, "space-y-4")}>
                  <div className={ds.components.input.group}>
                    <Label className={ds.components.input.label}>Data de Entrega *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button 
                          variant="outline" 
                          className={cn(
                            ds.components.button.secondary,
                            "w-full justify-start",
                            !dataEntrega && ds.colors.text.secondary
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {dataEntrega ? format(dataEntrega, "dd/MM/yyyy", { locale: ptBR }) : "Selecione a data..."}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className={cn(
                        "w-auto p-0",
                        ds.colors.surface.card,
                        ds.colors.border.default,
                        "border"
                      )} align="start">
                        <Calendar 
                          mode="single" 
                          selected={dataEntrega}
                          onSelect={setDataEntrega} 
                          locale={ptBR}
                          disabled={(date) => date < new Date(format(new Date(), 'yyyy-MM-dd'))} 
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className={ds.components.input.group}>
                    <Label className={ds.components.input.label}>Observações</Label>
                    <Textarea 
                      placeholder="Instruções de entrega, pagamento..." 
                      value={observacoes}
                      onChange={(e) => setObservacoes(e.target.value)}
                      onFocus={handleInputFocus}
                      className={cn(ds.components.input.root, "min-h-[120px] resize-none")} 
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Step: Confirmar */}
        {activeStep === "confirmar" && (
          <div className="h-full p-6 overflow-y-auto custom-scrollbar">
             <div className="max-w-2xl mx-auto space-y-6">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Resumo Fornecedor */}
                <Card className={ds.components.card.root}>
                  <CardContent className={cn(ds.components.card.body, "space-y-3")}>
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center",
                        "bg-brand/10"
                      )}>
                        <Building2 className="h-4 w-4 text-brand" />
                      </div>
                      <span className={cn(
                        ds.typography.size.xs,
                        ds.typography.weight.bold,
                        ds.colors.text.secondary,
                        "uppercase tracking-wider"
                      )}>Fornecedor</span>
                    </div>
                    <p className={cn(
                      ds.typography.size.sm,
                      ds.typography.weight.bold,
                      ds.colors.text.primary,
                      "pl-10"
                    )}>
                      {suppliers.find(s => s.id === fornecedor)?.name}
                    </p>
                  </CardContent>
                </Card>

                {/* Resumo Entrega */}
                <Card className={ds.components.card.root}>
                  <CardContent className={cn(ds.components.card.body, "space-y-3")}>
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center",
                        "bg-brand/10"
                      )}>
                        <CalendarIcon className="h-4 w-4 text-brand" />
                      </div>
                      <span className={cn(
                        ds.typography.size.xs,
                        ds.typography.weight.bold,
                        ds.colors.text.secondary,
                        "uppercase tracking-wider"
                      )}>Entrega</span>
                    </div>
                    <p className={cn(
                      ds.typography.size.sm,
                      ds.typography.weight.bold,
                      ds.colors.text.primary,
                      "pl-10"
                    )}>
                      {dataEntrega ? format(dataEntrega, "dd/MM/yyyy", { locale: ptBR }) : "-"}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Resumo Itens */}
              <Card className={ds.components.card.root}>
                <CardHeader className={ds.components.card.header}>
                  <CardTitle className={cn(ds.components.card.title, "flex items-center justify-between")}>
                    <span className="flex items-center gap-2">
                      <ShoppingCart className="h-4 w-4 text-brand" />
                      Itens do Pedido
                    </span>
                    <Badge className={cn(
                      ds.components.badge.base,
                      "bg-brand/10 text-brand border-brand/20"
                    )}>{itens.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className={cn("divide-y", ds.colors.border.default)}>
                    {itens.map((item, index) => (
                      <div key={index} className={cn(
                        "flex items-center justify-between p-4 transition-colors",
                        ds.colors.surface.hover
                      )}>
                        <div className="flex-1 min-w-0">
                          <p className={cn(
                            ds.typography.size.sm,
                            ds.typography.weight.bold,
                            ds.colors.text.primary,
                            "truncate"
                          )}>{item.produto}</p>
                          <p className={cn(
                            ds.typography.size.xs,
                            ds.colors.text.secondary,
                            "mt-1"
                          )}>{item.quantidade} {item.unidade} × R$ {item.valorUnitario.toFixed(2)}</p>
                        </div>
                        <p className={cn(
                          ds.typography.size.sm,
                          ds.typography.weight.bold,
                          ds.colors.text.primary,
                          "ml-4"
                        )}>
                          R$ {(item.quantidade * item.valorUnitario).toFixed(2)}
                        </p>
                      </div>
                    ))}
                  </div>
                  <div className={cn(
                    "p-4 border-t flex justify-between items-center",
                    ds.colors.surface.section,
                    ds.colors.border.default
                  )}>
                    <span className={cn(
                      ds.typography.size.sm,
                      ds.typography.weight.bold,
                      ds.colors.text.secondary,
                      "uppercase tracking-wider"
                    )}>Valor Total</span>
                    <span className={cn(
                      ds.typography.size.xl,
                      ds.typography.weight.bold,
                      "text-brand"
                    )}>
                      R$ {itens.reduce((acc, i) => acc + i.quantidade * i.valorUnitario, 0).toFixed(2)}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Resumo Observações */}
              {observacoes && (
                <Card className={ds.components.card.root}>
                  <CardContent className={cn(ds.components.card.body, "space-y-3")}>
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center",
                        "bg-brand/10"
                      )}>
                        <FileText className="h-4 w-4 text-brand" />
                      </div>
                      <span className={cn(
                        ds.typography.size.xs,
                        ds.typography.weight.bold,
                        ds.colors.text.secondary,
                        "uppercase tracking-wider"
                      )}>Observações</span>
                    </div>
                    <p className={cn(
                      ds.typography.size.sm,
                      ds.colors.text.primary,
                      "pl-10"
                    )}>{observacoes}</p>
                  </CardContent>
                </Card>
              )}
             </div>
          </div>
        )}

      </div>

      {/* Footer Navigation */}
      <div className={cn(
        "flex-shrink-0 p-4 border-t flex items-center justify-between gap-3",
        ds.colors.surface.section,
        ds.colors.border.default
      )}>
        {currentStepIndex > 0 ? (
          <Button
            type="button"
            variant="outline"
            onClick={handlePrevious}
            className={cn(ds.components.button.secondary, "gap-2")}
          >
            <ChevronLeft className="h-4 w-4" />
            Voltar
          </Button>
        ) : (
          <div />
        )}

        {currentStepIndex < STEPS.length - 1 ? (
          <Button
            type="button"
            onClick={handleNext}
            disabled={!canProceed()}
            className={cn(ds.components.button.primary, "gap-2 ml-auto")}
          >
            Próximo
            <ChevronRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={loading || !canProceed()}
            className={cn(ds.components.button.primary, "gap-2 ml-auto")}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Criando...
              </>
            ) : (
              <>
                <Check className="h-4 w-4" />
                Criar Pedido
              </>
            )}
          </Button>
        )}
      </div>
    </>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={handleOpenChange}>
        <DrawerContent 
          className={cn(
            "flex flex-col p-0 gap-0 overflow-hidden border-t transition-all duration-200",
            ds.colors.surface.page,
            ds.colors.border.default
          )}
          style={{ 
            height: keyboardOffset > 0 ? `calc(100vh - ${keyboardOffset}px)` : '95vh',
            maxHeight: keyboardOffset > 0 ? `calc(100vh - ${keyboardOffset}px)` : '95vh',
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
        className={cn(
          "w-[96vw] sm:w-[92vw] md:w-[90vw] max-w-[900px] h-[90vh] sm:h-[88vh] max-h-[750px]",
          "p-0 gap-0 overflow-hidden border shadow-md rounded-2xl flex flex-col",
          ds.colors.surface.page,
          ds.colors.border.default
        )}
        onKeyDown={handleKeyDown}
      >
        {content}
      </DialogContent>
    </Dialog>
  );
}
