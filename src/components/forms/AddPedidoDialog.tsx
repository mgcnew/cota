import React, { useState, useMemo, useRef, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerClose,
} from "@/components/ui/drawer";
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
  const [showMobileCart, setShowMobileCart] = useState(false);
  const [showMobileSupplierSearch, setShowMobileSupplierSearch] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [newProductQuantity, setNewProductQuantity] = useState("");
  const [newProductUnit, setNewProductUnit] = useState("un");
  const [newProductPrice, setNewProductPrice] = useState("");
  const [lastUsedPrices, setLastUsedPrices] = useState<Record<string, number>>({});
  const [showQuickCreateProduct, setShowQuickCreateProduct] = useState(false);
  const [showQuickCreateSupplier, setShowQuickCreateSupplier] = useState(false);
  const [showMobileProductSearch, setShowMobileProductSearch] = useState(false);

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
    setShowMobileSupplierSearch(false);
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
    
    // Only focus on desktop to avoid triggering mobile drawers/keyboard issues
    if (!isMobile) {
      setTimeout(() => productSearchRef.current?.focus(), 50);
    }
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

  // Reset state when opening/closing
  useEffect(() => {
    if (!open) {
      handleReset();
    } else {
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
      }
    }
  }, [open, preSelectedProducts]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onOpenChange(false);
    }
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
  };

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

  const DialogHeaderComponent = DialogHeader;
  const DialogTitleComponent = DialogTitle;
  const DialogDescriptionComponent = DialogDescription;

  const modalInnerContent = (
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

          <div className="flex items-center gap-2">
            {isMobile && activeStep === "produtos" && itens.length > 0 && (
              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowMobileCart(true)}
                className="relative h-10 w-10 border-brand/20 bg-brand/5 text-brand hover:bg-brand/10 hover:text-brand transition-colors"
                title="Ver itens adicionados"
              >
                <Package className="h-5 w-5" />
                <Badge 
                  className={cn(
                    "absolute -top-2 -right-2 h-5 min-w-[20px] flex items-center justify-center px-1 rounded-full",
                    "bg-red-500 text-white border-2 border-white",
                    "text-[10px] font-bold shadow-sm"
                  )}
                >
                  {itens.length}
                </Badge>
              </Button>
            )}

            <Button 
              type="button" 
              variant="ghost" 
              size="icon" 
              onClick={() => onOpenChange(false)}
              className={cn(ds.components.button.ghost, ds.components.button.size.icon, "ml-2")}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
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
            <div className="flex flex-col lg:grid lg:grid-cols-2 gap-6 pb-60 lg:pb-0">
              
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
                        placeholder={isMobile ? "Tocar para buscar produto..." : "Buscar produto..."} 
                        value={selectedProduct ? selectedProduct.name : productSearch}
                        readOnly={isMobile}
                        onClick={(e) => {
                          if (isMobile) {
                            e.currentTarget.blur();
                            setShowMobileProductSearch(true);
                          }
                        }}
                        onChange={(e) => { 
                          if (!isMobile) {
                            setProductSearch(e.target.value); 
                            setSelectedProduct(null); 
                          }
                        }}
                        onKeyDown={(e) => handleProductKeyDown(e, 'search')}
                        onFocus={(e) => {
                          if (isMobile) {
                            e.target.blur();
                            setShowMobileProductSearch(true);
                            return;
                          }
                          if (productSearch.trim().length >= 3 && searchedProducts.length > 0) {
                            setShowProductSuggestions(true);
                          } else {
                            setShowProductSuggestions(false);
                          }
                          handleInputFocus(e);
                        }}
                        className={cn(ds.components.input.root, "pl-10")} 
                      />
                      {!isMobile && showProductSuggestions && searchedProducts.length > 0 && !selectedProduct && (
                        <div className={cn(
                          "absolute top-full left-0 right-0 mt-2 rounded-xl shadow-2xl max-h-[250px] overflow-y-auto z-[200] custom-scrollbar animate-in fade-in zoom-in-95 duration-200",
                          ds.colors.surface.card,
                          ds.colors.border.default,
                          "border"
                        )}>
                          {searchedProducts.map((p, i) => renderProductItem(p, i))}
                        </div>
                      )}
                      {!isMobile && showProductSuggestions && productSearch.trim().length >= 3 && searchedProducts.length === 0 && !selectedProduct && !isSearchingProducts && !showQuickCreateProduct && (
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
                          <SelectItem value="metade">metade</SelectItem>
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
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      handleAddProduct();
                    }} 
                    disabled={(!selectedProduct && productSearch.trim().length < 2) || !newProductQuantity}
                    className={cn(ds.components.button.primary, "w-full h-10")}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar (Enter)
                  </Button>
                </CardContent>
              </Card>

              {/* Lista de Itens */}
              <Card className={cn(ds.components.card.root, "hidden lg:flex flex-col min-h-[200px] max-h-[350px] lg:max-h-none lg:h-full overflow-hidden")}>
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
          <div className="h-full p-6 overflow-y-auto custom-scrollbar">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 content-start pb-60 lg:pb-0">
              
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

  // ── Mobile helpers ─────────────────────────────────────────────────────────
  const addDays = (n: number) => {
    const d = new Date();
    d.setDate(d.getDate() + n);
    return d;
  };

  const mobileContent = (
    <>
      {/* Mobile Header */}
      <div className={cn(ds.components.modal.header, "flex-shrink-0 px-4 py-3")}>
        <div className="flex items-center gap-3">
          {currentStepIndex > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handlePrevious}
              className={cn(ds.components.button.ghost, ds.components.button.size.icon)}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
          )}
          <div className="flex-1 min-w-0">
            <p className={cn(ds.typography.size.xs, ds.typography.weight.bold, "text-brand uppercase tracking-wider")}>
              Novo Pedido · Passo {currentStepIndex + 1} de {STEPS.length}
            </p>
            <h2 className={cn(ds.components.modal.title, "mt-0.5")}>
              {STEPS[currentStepIndex].title}
            </h2>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onOpenChange(false)}
            className={cn(ds.components.button.ghost, ds.components.button.size.icon)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        {/* Segmented progress bar */}
        <div className="mt-3 flex gap-1.5">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-1 flex-1 rounded-full transition-all duration-300",
                i <= currentStepIndex ? "bg-brand" : "bg-zinc-200 dark:bg-zinc-800"
              )}
            />
          ))}
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">

        {/* ── Step 1: Produtos ───────────────────────────── */}
        {activeStep === "produtos" && (
          <div className="p-4 space-y-4 pb-32">

            {/* Product Search Trigger */}
            <button
              type="button"
              onClick={() => setShowMobileProductSearch(true)}
              className={cn(
                "w-full flex items-center gap-3 px-4 h-14 rounded-xl border transition-all active:scale-[0.99]",
                ds.colors.surface.card, ds.colors.border.default
              )}
            >
              <Search className="h-5 w-5 text-brand flex-shrink-0" />
              <span className={cn(ds.typography.size.base, ds.colors.text.secondary, "flex-1 text-left")}>
                {selectedProduct ? selectedProduct.name : "Toque para buscar produto..."}
              </span>
              {selectedProduct ? (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setSelectedProduct(null); setProductSearch(""); }}
                  className="p-1 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  <X className="h-4 w-4 text-zinc-400" />
                </button>
              ) : (
                <ChevronRight className="h-4 w-4 text-zinc-300 flex-shrink-0" />
              )}
            </button>

            {/* Quick Add Form — appears after selecting a product */}
            {selectedProduct && (
              <div className={cn(
                "p-4 rounded-xl border space-y-3 animate-in slide-in-from-top-2",
                ds.colors.surface.section, ds.colors.border.default
              )}>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-brand/10 flex items-center justify-center flex-shrink-0">
                    <Package className="h-4 w-4 text-brand" />
                  </div>
                  <p className={cn(ds.typography.size.sm, ds.typography.weight.bold, ds.colors.text.primary, "truncate flex-1")}>
                    {selectedProduct.name}
                  </p>
                </div>
                <div className="grid grid-cols-5 gap-2">
                  <div className={cn(ds.components.input.group, "col-span-2")}>
                    <Label className={ds.components.input.label}>Qtd *</Label>
                    <Input
                      ref={quantityInputRef}
                      type="number"
                      inputMode="decimal"
                      placeholder="0"
                      value={newProductQuantity}
                      onChange={(e) => setNewProductQuantity(e.target.value)}
                      className={cn(ds.components.input.root, "h-12 text-base text-center")}
                      autoFocus
                    />
                  </div>
                  <div className={cn(ds.components.input.group, "col-span-1")}>
                    <Label className={ds.components.input.label}>Un</Label>
                    <Select value={newProductUnit} onValueChange={setNewProductUnit}>
                      <SelectTrigger className={cn(ds.components.input.root, "h-12 px-2")}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="kg">kg</SelectItem>
                        <SelectItem value="un">un</SelectItem>
                        <SelectItem value="pct">pct</SelectItem>
                        <SelectItem value="cx">cx</SelectItem>
                        <SelectItem value="g">g</SelectItem>
                        <SelectItem value="l">l</SelectItem>
                        <SelectItem value="ml">ml</SelectItem>
                        <SelectItem value="metade">metade</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className={cn(ds.components.input.group, "col-span-2")}>
                    <Label className={ds.components.input.label}>Preço</Label>
                    <div className="relative">
                      <span className={cn("absolute left-2.5 top-1/2 -translate-y-1/2", ds.typography.size.xs, ds.typography.weight.bold, ds.colors.text.secondary)}>R$</span>
                      <Input
                        ref={priceInputRef}
                        inputMode="decimal"
                        placeholder="0,00"
                        value={newProductPrice}
                        onChange={(e) => setNewProductPrice(e.target.value)}
                        className={cn(ds.components.input.root, "h-12 pl-8 text-base")}
                      />
                    </div>
                  </div>
                </div>
                <Button
                  type="button"
                  onClick={handleAddProduct}
                  disabled={!newProductQuantity}
                  className={cn(ds.components.button.primary, "w-full h-12 text-base")}
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Adicionar ao Pedido
                </Button>
              </div>
            )}

            {/* Items List */}
            {itens.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className={cn(ds.typography.size.xs, ds.typography.weight.bold, ds.colors.text.secondary, "uppercase tracking-wider")}>
                    Itens adicionados
                  </p>
                  <Badge className={cn(ds.components.badge.base, "bg-brand/10 text-brand border-brand/20")}>{itens.length}</Badge>
                </div>
                {itens.map((item, index) => (
                  <div
                    key={index}
                    className={cn("flex items-center gap-3 p-3 rounded-xl border", ds.colors.surface.card, ds.colors.border.default)}
                  >
                    <div className={cn("w-6 h-6 rounded flex items-center justify-center flex-shrink-0", ds.typography.size.xs, ds.typography.weight.bold, ds.colors.surface.section, ds.colors.text.secondary)}>
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn(ds.typography.size.sm, ds.typography.weight.bold, ds.colors.text.primary, "truncate")}>{item.produto}</p>
                      <p className={cn(ds.typography.size.xs, ds.colors.text.secondary)}>
                        {item.quantidade} {item.unidade}{item.valorUnitario > 0 ? ` · R$ ${item.valorUnitario.toFixed(2)}` : ""}
                      </p>
                    </div>
                    {item.valorUnitario > 0 && (
                      <p className={cn(ds.typography.size.sm, ds.typography.weight.bold, "text-brand")}>
                        R$ {(item.quantidade * item.valorUnitario).toFixed(2)}
                      </p>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setItens(itens.filter((_, i) => i !== index))}
                      className={cn(ds.components.button.ghost, "h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20")}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Empty State */}
            {itens.length === 0 && !selectedProduct && (
              <div className={cn("flex flex-col items-center justify-center py-16 rounded-xl border border-dashed", ds.colors.border.default)}>
                <ShoppingCart className={cn("h-12 w-12 mb-3 opacity-20", ds.colors.text.secondary)} />
                <p className={cn(ds.typography.size.sm, ds.typography.weight.medium, ds.colors.text.secondary)}>Nenhum item adicionado</p>
                <p className={cn(ds.typography.size.xs, ds.colors.text.muted, "mt-1")}>Busque um produto acima para começar</p>
              </div>
            )}
          </div>
        )}

        {/* ── Step 2: Fornecedor & Entrega ───────────────── */}
        {activeStep === "fornecedor" && (
          <div className="p-4 space-y-5 pb-32">

            {/* Supplier */}
            <div className={ds.components.input.group}>
              <Label className={ds.components.input.label}>Fornecedor *</Label>
              {fornecedor ? (
                <div className={cn("flex items-center gap-3 p-3 rounded-xl border", "bg-brand/5 border-brand/20")}>
                  <div className="w-8 h-8 rounded-lg bg-brand/20 flex items-center justify-center flex-shrink-0">
                    <Building2 className="h-4 w-4 text-brand" />
                  </div>
                  <p className={cn(ds.typography.size.sm, ds.typography.weight.bold, ds.colors.text.primary, "flex-1 truncate")}>
                    {suppliers.find(s => s.id === fornecedor)?.name}
                  </p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setFornecedor("")}
                    className={cn(ds.components.button.ghost, "h-8 w-8 text-brand hover:bg-brand/10")}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowMobileSupplierSearch(true)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 h-14 rounded-xl border transition-all active:scale-[0.99]",
                    ds.colors.surface.card, ds.colors.border.default
                  )}
                >
                  <Building2 className="h-5 w-5 text-zinc-400 flex-shrink-0" />
                  <span className={cn(ds.typography.size.base, ds.colors.text.secondary, "flex-1 text-left")}>Selecionar fornecedor...</span>
                  <ChevronRight className="h-4 w-4 text-zinc-300 flex-shrink-0" />
                </button>
              )}
            </div>

            {/* Date Quick Chips */}
            <div className={ds.components.input.group}>
              <Label className={ds.components.input.label}>Data de Entrega *</Label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: "Hoje", days: 0 },
                  { label: "Amanhã", days: 1 },
                  { label: "+3 dias", days: 3 },
                  { label: "+7 dias", days: 7 },
                ].map(({ label, days }) => {
                  const target = addDays(days);
                  const isSelected = dataEntrega && format(dataEntrega, "yyyy-MM-dd") === format(target, "yyyy-MM-dd");
                  return (
                    <button
                      key={label}
                      type="button"
                      onClick={() => setDataEntrega(target)}
                      className={cn(
                        "h-12 rounded-xl border text-sm font-bold transition-all active:scale-[0.97]",
                        isSelected
                          ? "bg-brand text-white border-brand shadow-sm"
                          : cn(ds.colors.surface.card, ds.colors.border.default, ds.colors.text.secondary)
                      )}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
              {dataEntrega && (
                <p className={cn(ds.typography.size.xs, ds.colors.text.secondary, "mt-2 text-center")}>
                  📅 {format(dataEntrega, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </p>
              )}
            </div>

            {/* Observations */}
            <div className={ds.components.input.group}>
              <Label className={ds.components.input.label}>Observações</Label>
              <Textarea
                placeholder="Instruções de entrega, pagamento..."
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                onFocus={handleInputFocus}
                className={cn(ds.components.input.root, "min-h-[100px] resize-none")}
              />
            </div>
          </div>
        )}

        {/* ── Step 3: Confirmar ──────────────────────────── */}
        {activeStep === "confirmar" && (
          <div className="p-4 space-y-4 pb-32">
            <div className="grid grid-cols-2 gap-3">
              <div className={cn("p-3 rounded-xl border", ds.colors.surface.section, ds.colors.border.default)}>
                <p className={cn(ds.typography.size.xs, ds.typography.weight.bold, ds.colors.text.secondary, "uppercase tracking-wider mb-1.5 flex items-center gap-1.5")}>
                  <Building2 className="h-3 w-3" /> Fornecedor
                </p>
                <p className={cn(ds.typography.size.sm, ds.typography.weight.bold, ds.colors.text.primary, "truncate")}>
                  {suppliers.find(s => s.id === fornecedor)?.name || "—"}
                </p>
              </div>
              <div className={cn("p-3 rounded-xl border", ds.colors.surface.section, ds.colors.border.default)}>
                <p className={cn(ds.typography.size.xs, ds.typography.weight.bold, ds.colors.text.secondary, "uppercase tracking-wider mb-1.5 flex items-center gap-1.5")}>
                  <CalendarIcon className="h-3 w-3" /> Entrega
                </p>
                <p className={cn(ds.typography.size.sm, ds.typography.weight.bold, ds.colors.text.primary)}>
                  {dataEntrega ? format(dataEntrega, "dd/MM/yyyy", { locale: ptBR }) : "—"}
                </p>
              </div>
            </div>

            {/* Items Summary */}
            <div className={cn("rounded-xl border overflow-hidden", ds.colors.border.default)}>
              <div className={cn("px-4 py-3 flex items-center justify-between border-b", ds.colors.surface.section, ds.colors.border.default)}>
                <span className={cn(ds.typography.size.sm, ds.typography.weight.bold, ds.colors.text.primary, "flex items-center gap-2")}>
                  <ShoppingCart className="h-4 w-4 text-brand" /> Itens do Pedido
                </span>
                <Badge className={cn(ds.components.badge.base, "bg-brand/10 text-brand border-brand/20")}>{itens.length}</Badge>
              </div>
              <div className={cn("divide-y", ds.colors.border.default)}>
                {itens.map((item, index) => (
                  <div key={index} className={cn("flex items-center justify-between px-4 py-3", ds.colors.surface.card)}>
                    <div className="flex-1 min-w-0">
                      <p className={cn(ds.typography.size.sm, ds.typography.weight.bold, ds.colors.text.primary, "truncate")}>{item.produto}</p>
                      <p className={cn(ds.typography.size.xs, ds.colors.text.secondary, "mt-0.5")}>
                        {item.quantidade} {item.unidade} × R$ {item.valorUnitario.toFixed(2)}
                      </p>
                    </div>
                    <p className={cn(ds.typography.size.sm, ds.typography.weight.bold, ds.colors.text.primary, "ml-3")}>
                      R$ {(item.quantidade * item.valorUnitario).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
              <div className={cn("px-4 py-3 flex items-center justify-between border-t", ds.colors.surface.section, ds.colors.border.default)}>
                <span className={cn(ds.typography.size.xs, ds.typography.weight.bold, ds.colors.text.secondary, "uppercase tracking-wider")}>Total</span>
                <span className={cn(ds.typography.size.lg, ds.typography.weight.bold, "text-brand")}>
                  R$ {itens.reduce((acc, i) => acc + i.quantidade * i.valorUnitario, 0).toFixed(2)}
                </span>
              </div>
            </div>

            {observacoes && (
              <div className={cn("p-3 rounded-xl border", ds.colors.surface.section, ds.colors.border.default)}>
                <p className={cn(ds.typography.size.xs, ds.typography.weight.bold, ds.colors.text.secondary, "uppercase tracking-wider mb-1.5 flex items-center gap-1.5")}>
                  <FileText className="h-3 w-3" /> Observações
                </p>
                <p className={cn(ds.typography.size.sm, ds.colors.text.primary)}>{observacoes}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Fixed Bottom Action Bar */}
      <div className={cn(
        "flex-shrink-0 px-4 pt-3 pb-[calc(12px+env(safe-area-inset-bottom))] border-t flex items-center gap-3",
        ds.colors.surface.section, ds.colors.border.default
      )}>
        {currentStepIndex > 0 && (
          <Button
            type="button"
            variant="outline"
            onClick={handlePrevious}
            className={cn(ds.components.button.secondary, "h-12 px-5")}
          >
            <ChevronLeft className="h-4 w-4 mr-1" /> Voltar
          </Button>
        )}
        {currentStepIndex < STEPS.length - 1 ? (
          <Button
            type="button"
            onClick={handleNext}
            disabled={!canProceed()}
            className={cn(ds.components.button.primary, "flex-1 h-12 text-base")}
          >
            Próximo <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        ) : (
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={loading || !canProceed()}
            className={cn(ds.components.button.primary, "flex-1 h-12 text-base")}
          >
            {loading ? (
              <><Loader2 className="h-5 w-5 mr-2 animate-spin" /> Criando...</>
            ) : (
              <><Check className="h-5 w-5 mr-2" /> Criar Pedido</>
            )}
          </Button>
        )}
      </div>

      {/* ── Mobile Supplier Search Drawer ───────────────── */}
      <Drawer open={showMobileSupplierSearch && isMobile} onOpenChange={setShowMobileSupplierSearch}>
        <DrawerContent className={cn("h-[92vh] flex flex-col", ds.colors.surface.card, ds.colors.border.default, "border-t")}>
          <DrawerHeader className="border-b pb-3 px-4 flex-shrink-0">
            <DrawerTitle className="sr-only">Buscar Fornecedor</DrawerTitle>
            <DrawerDescription className="sr-only">Selecione um fornecedor</DrawerDescription>
            <div className="flex items-center gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                <Input
                  autoFocus
                  placeholder="Buscar fornecedor..."
                  className={cn(ds.components.input.root, "pl-10 h-11 text-base rounded-xl")}
                  value={supplierSearch}
                  onChange={(e) => setSupplierSearch(e.target.value)}
                />
              </div>
              <DrawerClose asChild>
                <Button variant="ghost" className="px-2 font-bold text-brand text-xs uppercase tracking-widest whitespace-nowrap">
                  Fechar
                </Button>
              </DrawerClose>
            </div>
          </DrawerHeader>
          <div className="flex-1 overflow-y-auto custom-scrollbar p-3">
            {filteredSuppliers.length > 0 ? (
              <div className="space-y-2">
                {filteredSuppliers.map(s => (
                  <button
                    key={s.id}
                    onClick={() => { setFornecedor(s.id); setSupplierSearch(""); setShowMobileSupplierSearch(false); }}
                    className={cn(
                      "w-full flex items-center gap-3 p-4 rounded-2xl border text-left transition-all active:scale-[0.98]",
                      fornecedor === s.id
                        ? "bg-brand text-white border-brand"
                        : cn(ds.colors.surface.section, ds.colors.border.default)
                    )}
                  >
                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0", fornecedor === s.id ? "bg-white/20" : "bg-brand/10")}>
                      <Building2 className={cn("h-5 w-5", fornecedor === s.id ? "text-white" : "text-brand")} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn(ds.typography.size.sm, ds.typography.weight.bold, "truncate", fornecedor === s.id ? "text-white" : ds.colors.text.primary)}>{s.name}</p>
                      {s.contact && <p className={cn(ds.typography.size.xs, "truncate mt-0.5", fornecedor === s.id ? "text-white/70" : ds.colors.text.secondary)}>{s.contact}</p>}
                    </div>
                    {fornecedor === s.id && <Check className="h-4 w-4 text-white flex-shrink-0" />}
                  </button>
                ))}
              </div>
            ) : supplierSearch.length > 0 ? (
              <div className="p-10 text-center flex flex-col items-center">
                <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center mb-4", ds.colors.surface.section)}>
                  <Building2 className={cn("h-8 w-8 opacity-30", ds.colors.text.secondary)} />
                </div>
                <p className={cn(ds.typography.size.base, ds.typography.weight.bold, ds.colors.text.primary)}>Fornecedor não encontrado</p>
                <p className={cn(ds.typography.size.xs, ds.colors.text.secondary, "mt-1 mb-6")}>Deseja cadastrá-lo agora?</p>
                <Button
                  onClick={() => { setShowMobileSupplierSearch(false); setShowQuickCreateSupplier(true); }}
                  className={cn(ds.components.button.primary, "h-11 px-6 rounded-xl")}
                >
                  <Plus className="h-4 w-4 mr-2" /> Cadastrar Fornecedor
                </Button>
              </div>
            ) : (
              <div className="py-16 text-center flex flex-col items-center">
                <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center mb-4", ds.colors.surface.section)}>
                  <Search className={cn("h-5 w-5 opacity-40", ds.colors.text.secondary)} />
                </div>
                <p className={cn(ds.typography.size.xs, ds.typography.weight.bold, ds.colors.text.secondary, "uppercase tracking-widest")}>Digite para buscar</p>
              </div>
            )}
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className={cn(
          "p-0 gap-0 overflow-hidden border shadow-xl flex flex-col",
          ds.colors.surface.page,
          ds.colors.border.default,
          // Mobile: Full Screen
          isMobile 
            ? "w-full h-[100dvh] max-h-[100dvh] rounded-none border-none inset-0 p-0" 
            : "w-[96vw] sm:w-[92vw] md:w-[90vw] max-w-[900px] h-[90vh] sm:h-[88vh] max-h-[750px] rounded-2xl"
        )}
        onKeyDown={!isMobile ? handleKeyDown : undefined}
        hideClose={isMobile}
      >
        {/* Adiciona títulos acessíveis */}
        <div className="sr-only">
          <DialogTitle>Novo Pedido Geral</DialogTitle>
          <DialogDescription>Crie um novo pedido de compra</DialogDescription>
        </div>

        {isMobile ? mobileContent : modalInnerContent}
        
        {/* Mobile Shopping Cart Drawer - Renderizado como filho do DialogContent para manter contexto de interação */}
        <Drawer open={showMobileCart && isMobile} onOpenChange={setShowMobileCart}>
          <DrawerContent className={cn("max-h-[85vh] flex flex-col", ds.colors.surface.card, ds.colors.border.default)}>
            <DrawerHeader className="text-left border-b border-border/40 pb-4">
              <div className="flex items-center justify-between">
                <DrawerTitle className={cn(ds.typography.size.lg, ds.typography.weight.bold, "flex items-center gap-2")}>
                  <Package className="h-5 w-5 text-brand" />
                  Itens do Pedido
                </DrawerTitle>
                <Badge variant="secondary" className="bg-brand/10 text-brand hover:bg-brand/20 border-brand/20">
                  {itens.length} itens
                </Badge>
              </div>
              <DrawerDescription className={cn(ds.typography.size.sm, ds.colors.text.secondary)}>
                Revise e gerencie os itens do seu pedido
              </DrawerDescription>
            </DrawerHeader>
            
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
              {itens.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <Package className="h-12 w-12 text-muted-foreground/30 mb-3" />
                  <p className="text-sm font-medium text-foreground">Nenhum produto adicionado</p>
                  <p className="text-xs text-muted-foreground mt-1">Busque e adicione produtos no formulário.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {itens.map((item, index) => (
                    <div key={index} className={cn(
                      "flex flex-col gap-2 p-3 rounded-lg border shadow-sm",
                      "bg-background/50",
                      ds.colors.border.default
                    )}>
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex items-start gap-2 min-w-0 flex-1">
                          <div className="w-6 h-6 rounded flex items-center justify-center flex-shrink-0 bg-secondary text-secondary-foreground text-xs font-bold mt-0.5">
                            {index + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-bold text-foreground leading-tight">{item.produto}</p>
                            <div className="flex items-center gap-1.5 mt-1 text-[12px] text-muted-foreground flex-wrap">
                              <span className="bg-secondary/50 px-1.5 py-0.5 rounded flex items-center gap-1">
                                {item.quantidade} <span className="opacity-70">{item.unidade}</span>
                              </span>
                              <span>×</span>
                              <span className={cn(item.valorUnitario <= 0 && "text-zinc-500 italic")}>
                                {item.valorUnitario > 0 ? `R$ ${item.valorUnitario.toFixed(2)}` : 'Sem preço'}
                              </span>
                            </div>
                          </div>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => {
                            setItens(itens.filter((_, i) => i !== index));
                            if (itens.length === 1) setShowMobileCart(false); // Fecha se remover o último
                          }}
                          className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive flex-shrink-0"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex justify-end items-center pt-2 border-t border-border/40 mt-1">
                         <p className="text-[14px] font-bold text-foreground">
                           R$ {(item.quantidade * item.valorUnitario).toFixed(2)}
                         </p>
                      </div>
                    </div>
                  )).reverse()}
                </div>
              )}
            </div>
            
            <div className="p-4 border-t border-border bg-background/50 flex-shrink-0 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)]">
               <div className="flex justify-between items-center mb-4">
                 <span className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Total do Pedido</span>
                 <span className="text-xl font-bold text-brand">
                   R$ {itens.reduce((acc, i) => acc + i.quantidade * i.valorUnitario, 0).toFixed(2)}
                 </span>
               </div>
               <DrawerClose asChild>
                <Button className={cn(ds.components.button.primary, "w-full h-11")} onClick={() => setShowMobileCart(false)}>
                  Continuar Editando
                </Button>
              </DrawerClose>
            </div>
          </DrawerContent>
        </Drawer>
        
        {/* Mobile Product Search Drawer */}
        <Drawer open={showMobileProductSearch && isMobile} onOpenChange={setShowMobileProductSearch}>
          <DrawerContent className={cn("h-[94vh] flex flex-col", ds.colors.surface.card, ds.colors.border.default, "border-t")}>
            <DrawerHeader className="border-b border-border/40 pb-4 px-4 overflow-visible flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    autoFocus
                    placeholder="Nome do produto..."
                    className={cn(ds.components.input.root, "pl-10 h-11 text-base rounded-xl")}
                    value={productSearch}
                    onChange={(e) => {
                      setProductSearch(e.target.value);
                      setSelectedProduct(null);
                    }}
                  />
                </div>
                <DrawerClose asChild>
                  <Button variant="ghost" className="px-2 font-bold text-brand text-xs uppercase tracking-widest whitespace-nowrap">Fechar</Button>
                </DrawerClose>
              </div>
            </DrawerHeader>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-3">
              {isSearchingProducts ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                  <Loader2 className="h-8 w-8 animate-spin text-zinc-300" />
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Buscando...</p>
                </div>
              ) : searchedProducts.length > 0 ? (
                <div className="grid grid-cols-1 gap-2">
                  {searchedProducts.map((p, index) => (
                     <button
                      key={p.id}
                      onClick={() => {
                        selectProductFromList(p);
                        setShowMobileProductSearch(false);
                      }}
                      className={cn(
                        "w-full flex items-center gap-4 p-4 rounded-2xl text-left border transition-all active:scale-[0.98]",
                        ds.colors.surface.section,
                        ds.colors.border.default,
                        "hover:bg-brand/5 hover:border-brand/30 transition-colors"
                      )}
                     >
                      <div className="w-10 h-10 rounded-xl bg-brand/10 text-brand flex items-center justify-center flex-shrink-0 shadow-sm border border-brand/10">
                        <Package className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={cn(ds.typography.size.sm, ds.typography.weight.bold, "text-foreground truncate")}>{p.name}</p>
                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mt-1">{p.unit || 'unidade'}</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-brand/30" />
                     </button>
                  ))}
                </div>
              ) : productSearch.trim().length >= 3 ? (
                <div className="p-10 text-center flex flex-col items-center">
                  <div className="w-20 h-20 rounded-3xl bg-brand/5 flex items-center justify-center mb-6 shadow-inner">
                     <Package className="h-10 w-10 text-brand/30" />
                  </div>
                  <p className="text-base font-bold text-foreground">Produto não encontrado</p>
                  <p className="text-xs text-muted-foreground mt-2 mb-8 max-w-[200px] mx-auto">Gostaria de cadastrar "{productSearch}" no sistema agora?</p>
                  <Button
                    onClick={() => {
                      setShowMobileProductSearch(false);
                      setShowQuickCreateProduct(true);
                    }}
                    className={cn(ds.components.button.primary, "h-12 w-full max-w-[240px] rounded-2xl shadow-lg shadow-brand/20")}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Cadastrar Produto
                  </Button>
                </div>
              ) : (
                 <div className="py-20 text-center flex flex-col items-center">
                    <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-4">
                      <Search className="h-5 w-5 text-zinc-400" />
                    </div>
                    <p className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-400">Aguardando busca...</p>
                 </div>
              )}
            </div>
          </DrawerContent>
        </Drawer>
      </DialogContent>
    </Dialog>
  );
}
