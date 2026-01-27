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
  ShoppingCart, Trash2, DollarSign
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { useKeyboardOffset } from "@/hooks/useKeyboardOffset";
import { usePackagingOrders } from "@/hooks/usePackagingOrders";
import { usePackagingSearch } from "@/hooks/usePackagingSearch";
import { useDebounce } from "@/hooks/useDebounce";
import { useToast } from "@/hooks/use-toast";
import type { PackagingItem } from "@/types/packaging";
import type { Supplier } from "@/hooks/useSuppliers";
import { designSystem as ds } from "@/styles/design-system";

interface PedidoItem {
  packagingId: string;
  packagingName: string;
  quantidade: number;
  unidadeCompra: string;
  valorUnitario: number;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  packagingItems: PackagingItem[];
  suppliers: Supplier[];
}

const STEPS = [
  { id: "produtos", title: "Produtos", icon: Package },
  { id: "fornecedor", title: "Fornecedor", icon: Building2 },
  { id: "confirmar", title: "Confirmar", icon: Check },
];

export function AddPackagingOrderDialog({ open, onOpenChange, packagingItems: _initialItems, suppliers }: Props) {
  const isMobile = useIsMobile();
  const keyboardOffset = useKeyboardOffset();
  const { toast } = useToast();
  const { createOrder } = usePackagingOrders();
  
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
  const debouncedProductSearch = useDebounce(productSearch, 300);
  const { data: searchResults, isLoading: isLoadingSearch } = usePackagingSearch(debouncedProductSearch);

  // New item states
  const [selectedProduct, setSelectedProduct] = useState<PackagingItem | null>(null);
  const [newProductQuantity, setNewProductQuantity] = useState("");
  const [newProductUnit, setNewProductUnit] = useState("un");
  const [newProductPrice, setNewProductPrice] = useState("");

  // Refs
  const productSearchRef = useRef<HTMLInputElement>(null);
  const quantityInputRef = useRef<HTMLInputElement>(null);
  const priceInputRef = useRef<HTMLInputElement>(null);
  const supplierSearchRef = useRef<HTMLInputElement>(null);

  const currentStepIndex = STEPS.findIndex(s => s.id === activeStep);
  const progress = ((currentStepIndex + 1) / STEPS.length) * 100;

  useEffect(() => {
    if (open) {
      handleReset();
      setTimeout(() => productSearchRef.current?.focus(), 100);
    }
  }, [open]);

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

  const filteredSuppliers = useMemo(() => {
    if (!supplierSearch) return suppliers;
    return suppliers.filter(s => s.name.toLowerCase().includes(supplierSearch.toLowerCase()));
  }, [suppliers, supplierSearch]);

  const handleAddProduct = () => {
    if (!selectedProduct || !newProductQuantity || !newProductPrice) {
      toast({ title: "Erro", description: "Preencha todos os campos", variant: "destructive" });
      return;
    }
    const quantidade = parseFloat(newProductQuantity.replace(',', '.'));
    const preco = parseFloat(newProductPrice.replace(',', '.'));
    
    if (isNaN(quantidade) || quantidade <= 0 || isNaN(preco) || preco <= 0) {
      toast({ title: "Erro", description: "Valores inválidos", variant: "destructive" });
      return;
    }
    
    setItens(prev => [...prev, { 
      packagingId: selectedProduct.id,
      packagingName: selectedProduct.name,
      quantidade, 
      unidadeCompra: newProductUnit, 
      valorUnitario: preco
    }]);
    
    // Reset inputs
    setSelectedProduct(null);
    setNewProductQuantity("");
    setNewProductPrice("");
    setProductSearch("");
    toast({ title: "Produto adicionado", duration: 1500 });
    
    setTimeout(() => productSearchRef.current?.focus(), 50);
  };

  const selectProductFromList = (product: PackagingItem) => {
    setSelectedProduct(product);
    setNewProductUnit(product.unit || "un");
    setProductSearch("");
    setHighlightedProductIndex(-1);
    setTimeout(() => {
      quantityInputRef.current?.focus();
    }, 50);
  };

  const canProceed = () => {
    switch (activeStep) {
      case "produtos": return itens.length > 0;
      case "fornecedor": return !!fornecedor && !!dataEntrega;
      default: return true;
    }
  };

  const handleNext = () => {
    if (currentStepIndex < STEPS.length - 1) {
      if (canProceed()) {
        setActiveStep(STEPS[currentStepIndex + 1].id);
      } else {
        toast({
          title: "Campos obrigatórios",
          description: "Por favor, preencha todos os campos obrigatórios desta etapa.",
          variant: "destructive"
        });
      }
    }
  };

  const handlePrevious = () => {
    if (currentStepIndex > 0) {
      setActiveStep(STEPS[currentStepIndex - 1].id);
    }
  };

  const handleStepChange = (stepId: string) => {
    const targetIndex = STEPS.findIndex(s => s.id === stepId);
    if (targetIndex > currentStepIndex && !canProceed()) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos obrigatórios antes de prosseguir.",
        variant: "destructive"
      });
      return;
    }
    setActiveStep(stepId);
  };

  const handleSubmit = async () => {
    if (!fornecedor || !dataEntrega || itens.length === 0) {
      toast({ title: "Erro", description: "Dados incompletos", variant: "destructive" });
      return;
    }
    
    setLoading(true);
    try {
      const selectedSupplier = suppliers.find(s => s.id === fornecedor);
      
      await createOrder.mutateAsync({
        supplierId: fornecedor,
        supplierName: selectedSupplier?.name || '',
        deliveryDate: format(dataEntrega, 'yyyy-MM-dd'),
        observations: observacoes,
        itens: itens.map(item => ({
          packagingId: item.packagingId,
          packagingName: item.packagingName,
          quantidade: item.quantidade,
          unidadeCompra: item.unidadeCompra,
          valorUnitario: item.valorUnitario
        }))
      });
      
      onOpenChange(false);
    } catch (error: any) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) handleReset();
    onOpenChange(isOpen);
  };

  const handleInputFocus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!isMobile) return;
    setTimeout(() => {
      e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 300);
  };

  const DialogContentComponent = isMobile ? DrawerContent : DialogContent;
  const DialogHeaderComponent = isMobile ? DrawerHeader : DialogHeader;
  const DialogTitleComponent = isMobile ? DrawerTitle : DialogTitle;
  const DialogDescriptionComponent = isMobile ? DrawerDescription : DialogDescription;

  const content = (
    <>
      <div className={cn(ds.components.modal.header, "flex-shrink-0")}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-brand flex items-center justify-center shadow-lg shadow-brand/20 flex-shrink-0">
              <ShoppingCart className="h-5 w-5 text-brand-foreground stroke-[2.5]" />
            </div>
            <div className="flex-1 min-w-0">
              <DialogTitleComponent className={cn(ds.components.modal.title, "truncate")}>
                Novo Pedido de Embalagem
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
          <Progress value={progress} className={cn("h-1.5 rounded-full", ds.colors.surface.section, "[&>div]:bg-brand")} />
        </div>
      </div>

      <div className={cn("flex-shrink-0 px-6 border-b bg-transparent", ds.colors.border.default)}>
        <div className={ds.components.tabs.clean.list}>
          {STEPS.map((step, index) => {
            const Icon = step.icon;
            const isActive = index === currentStepIndex;
            return (
              <button key={step.id} type="button" onClick={() => handleStepChange(step.id)}
                className={cn(ds.components.tabs.clean.trigger, "flex items-center gap-2", isActive && "data-[state=active]")}
                data-state={isActive ? "active" : "inactive"}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{step.title}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className={cn("flex-1 overflow-hidden relative", ds.colors.surface.page)}>
        {activeStep === "produtos" && (
          <div className="h-full p-6 overflow-y-auto custom-scrollbar">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full content-start">
              <Card className={ds.components.card.root}>
                <CardHeader className={ds.components.card.header}>
                  <CardTitle className={cn(ds.components.card.title, "flex items-center gap-2")}>
                    <Plus className="h-4 w-4 text-brand flex-shrink-0" />
                    <span>Adicionar Embalagem</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className={cn(ds.components.card.body, "space-y-4")}>
                  <div className={ds.components.input.group}>
                    <Label className={ds.components.input.label}>Embalagem *</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                      <Input 
                        ref={productSearchRef}
                        placeholder="Buscar embalagem..." 
                        value={selectedProduct ? selectedProduct.name : productSearch}
                        onChange={(e) => { setProductSearch(e.target.value); setSelectedProduct(null); }}
                        onFocus={handleInputFocus}
                        className={cn(ds.components.input.root, "pl-10")} 
                      />
                      {debouncedProductSearch && searchResults && searchResults.length > 0 && !selectedProduct && (
                        <div className={cn("absolute top-full left-0 right-0 mt-2 rounded-xl shadow-xl max-h-[200px] overflow-y-auto z-50 custom-scrollbar border", ds.colors.surface.card, ds.colors.border.default)}>
                          {searchResults.map((p: PackagingItem) => (
                            <button key={p.id} onClick={() => selectProductFromList(p)}
                              className={cn("w-full px-4 py-3 text-left flex items-center gap-3 transition-all rounded-lg hover:bg-brand/5")}>
                              <Package className="h-4 w-4 text-zinc-400" />
                              <span className="font-medium text-sm">{p.name}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className={ds.components.input.group}>
                      <Label className={ds.components.input.label}>Quantidade *</Label>
                      <Input 
                        ref={quantityInputRef}
                        type="number" 
                        placeholder="0"
                        value={newProductQuantity}
                        onChange={(e) => setNewProductQuantity(e.target.value)}
                        onFocus={handleInputFocus}
                        className={ds.components.input.root}
                      />
                    </div>
                    <div className={ds.components.input.group}>
                      <Label className={ds.components.input.label}>Preço Unit. *</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-400">R$</span>
                        <Input 
                          ref={priceInputRef}
                          placeholder="0,00"
                          value={newProductPrice}
                          onChange={(e) => setNewProductPrice(e.target.value)}
                          onFocus={handleInputFocus}
                          className={cn(ds.components.input.root, "pl-10")}
                        />
                      </div>
                    </div>
                  </div>

                  <Button onClick={handleAddProduct} disabled={!selectedProduct || !newProductQuantity || !newProductPrice}
                    className={cn(ds.components.button.primary, "w-full")}>
                    <Plus className="h-4 w-4 mr-2" />Adicionar Item
                  </Button>
                </CardContent>
              </Card>

              <Card className={cn(ds.components.card.root, "h-full max-h-[500px] lg:max-h-none flex flex-col")}>
                <CardHeader className={cn(ds.components.card.header, "flex-shrink-0")}>
                  <CardTitle className={cn(ds.components.card.title, "flex items-center justify-between")}>
                    <span className="flex items-center gap-2">
                      <ShoppingCart className="h-4 w-4 text-brand" />
                      Itens do Pedido
                    </span>
                    <Badge className="bg-brand/10 text-brand border-brand/20">{itens.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0 flex-1 overflow-hidden p-0">
                  <ScrollArea className="h-full">
                    <div className="p-4 space-y-3">
                      {itens.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-zinc-400">
                          <Package className="h-12 w-12 opacity-20 mb-3" />
                          <p className="text-sm font-medium">Nenhum item adicionado</p>
                        </div>
                      ) : (
                        itens.map((item, index) => (
                          <div key={index} className={cn("flex items-center gap-3 p-4 rounded-xl border shadow-sm", ds.colors.surface.card, ds.colors.border.default)}>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-sm truncate">{item.packagingName}</p>
                              <div className="flex items-center gap-2 mt-1 text-xs text-zinc-500">
                                <span>{item.quantidade} {item.unidadeCompra}</span>
                                <span>×</span>
                                <span>R$ {item.valorUnitario.toFixed(2)}</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-sm">R$ {(item.quantidade * item.valorUnitario).toFixed(2)}</p>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => setItens(itens.filter((_, i) => i !== index))}
                              className={cn(ds.components.button.danger, "h-8 w-8")}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
                <div className={cn("p-4 flex justify-between items-center border-t", ds.colors.border.default, ds.colors.surface.section)}>
                  <span className="text-sm font-bold text-zinc-500 uppercase">Total Estimado</span>
                  <span className="text-lg font-bold text-brand">
                    R$ {itens.reduce((acc, i) => acc + i.quantidade * i.valorUnitario, 0).toFixed(2)}
                  </span>
                </div>
              </Card>
            </div>
          </div>
        )}

        {activeStep === "fornecedor" && (
          <div className="h-full p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full content-start">
              <Card className={ds.components.card.root}>
                <CardHeader className={ds.components.card.header}>
                  <CardTitle className={cn(ds.components.card.title, "flex items-center gap-2")}>
                    <Building2 className="h-4 w-4 text-brand flex-shrink-0" />
                    <span>Selecionar Fornecedor</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className={cn(ds.components.card.body, "space-y-4")}>
                  <div className={ds.components.input.group}>
                    <Label className={ds.components.input.label}>Buscar Fornecedor *</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                      <Input 
                        placeholder="Digite para buscar..." 
                        value={supplierSearch}
                        onChange={(e) => setSupplierSearch(e.target.value)}
                        onFocus={handleInputFocus}
                        className={cn(ds.components.input.root, "pl-10")} 
                      />
                    </div>
                  </div>
                  
                  <ScrollArea className="h-[200px] border rounded-xl p-2">
                    <div className="space-y-1">
                      {filteredSuppliers.map(s => (
                        <button key={s.id} onClick={() => setFornecedor(s.id)}
                          className={cn("w-full p-3 rounded-lg text-left transition-all flex items-center gap-3",
                            fornecedor === s.id ? "bg-brand text-brand-foreground shadow-lg" : "hover:bg-brand/5")}>
                          <Building2 className="h-4 w-4" />
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-sm truncate">{s.name}</p>
                          </div>
                          {fornecedor === s.id && <Check className="h-4 w-4" />}
                        </button>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              <Card className={ds.components.card.root}>
                <CardHeader className={ds.components.card.header}>
                  <CardTitle className={cn(ds.components.card.title, "flex items-center gap-2")}>
                    <CalendarIcon className="h-4 w-4 text-brand flex-shrink-0" />
                    <span>Detalhes da Entrega</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className={cn(ds.components.card.body, "space-y-4")}>
                  <div className={ds.components.input.group}>
                    <Label className={ds.components.input.label}>Data de Entrega *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className={cn(ds.components.button.secondary, "w-full justify-start", !dataEntrega && "text-zinc-400")}>
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {dataEntrega ? format(dataEntrega, "dd/MM/yyyy", { locale: ptBR }) : "Selecione a data..."}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={dataEntrega} onSelect={setDataEntrega} locale={ptBR}
                          disabled={(date) => date < new Date(new Date().setHours(0,0,0,0))} />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className={ds.components.input.group}>
                    <Label className={ds.components.input.label}>Observações</Label>
                    <Textarea placeholder="Instruções de entrega..." value={observacoes}
                      onChange={(e) => setObservacoes(e.target.value)} onFocus={handleInputFocus}
                      className={cn(ds.components.input.root, "min-h-[100px] resize-none")} />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {activeStep === "confirmar" && (
          <div className="h-full p-6 overflow-y-auto custom-scrollbar">
            <div className="max-w-2xl mx-auto space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <Card className={ds.components.card.root}>
                  <CardContent className={cn(ds.components.card.body, "space-y-2")}>
                    <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Fornecedor</span>
                    <p className="font-bold text-sm truncate">{suppliers.find(s => s.id === fornecedor)?.name}</p>
                  </CardContent>
                </Card>
                <Card className={ds.components.card.root}>
                  <CardContent className={cn(ds.components.card.body, "space-y-2")}>
                    <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Entrega</span>
                    <p className="font-bold text-sm">{dataEntrega ? format(dataEntrega, "dd/MM/yyyy") : "-"}</p>
                  </CardContent>
                </Card>
              </div>

              <Card className={ds.components.card.root}>
                <CardHeader className={ds.components.card.header}>
                  <CardTitle className={cn(ds.components.card.title, "flex items-center justify-between")}>
                    <span>Itens do Pedido</span>
                    <Badge variant="secondary">{itens.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y">
                    {itens.map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-4">
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm truncate">{item.packagingName}</p>
                          <p className="text-xs text-zinc-500">{item.quantidade} {item.unidadeCompra} × R$ {item.valorUnitario.toFixed(2)}</p>
                        </div>
                        <p className="font-bold text-sm ml-4">R$ {(item.quantidade * item.valorUnitario).toFixed(2)}</p>
                      </div>
                    ))}
                  </div>
                  <div className={cn("p-4 border-t flex justify-between items-center", ds.colors.surface.section)}>
                    <span className="text-xs font-black uppercase text-zinc-400">Valor Total</span>
                    <span className="text-xl font-bold text-brand">
                      R$ {itens.reduce((acc, i) => acc + i.quantidade * i.valorUnitario, 0).toFixed(2)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>

      <div className={cn("flex-shrink-0 p-4 border-t flex items-center justify-between gap-3", ds.colors.surface.section, ds.colors.border.default)}>
        {currentStepIndex > 0 ? (
          <Button type="button" variant="outline" onClick={handlePrevious} className={cn(ds.components.button.secondary, "gap-2")}>
            <ChevronLeft className="h-4 w-4" />Voltar
          </Button>
        ) : <div />}

        {currentStepIndex < STEPS.length - 1 ? (
          <Button type="button" onClick={handleNext} disabled={!canProceed()} className={cn(ds.components.button.primary, "gap-2 ml-auto")}>
            Próximo<ChevronRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button type="button" onClick={handleSubmit} disabled={loading || !canProceed()} className={cn(ds.components.button.primary, "gap-2 ml-auto")}>
            {loading ? <><Loader2 className="h-4 w-4 animate-spin" />Criando...</> : <><Check className="h-4 w-4" />Criar Pedido</>}
          </Button>
        )}
      </div>
    </>
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className={cn("w-[96vw] sm:w-[92vw] md:w-[90vw] max-w-[900px] h-[90vh] sm:h-[88vh] max-h-[750px] p-0 gap-0 overflow-hidden border shadow-md rounded-2xl flex flex-col", ds.colors.surface.page, ds.colors.border.default)}>
        {content}
      </DialogContent>
    </Dialog>
  );
}
