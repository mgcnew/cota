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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  ListTodo, Package, Plus, Trash2, X, ChevronRight, 
  ChevronLeft, Check, Search, Star, Loader2, ClipboardList
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { useKeyboardOffset } from "@/hooks/useKeyboardOffset";
import { useToast } from "@/hooks/use-toast";
import { useProducts } from "@/hooks/useProducts";
import { useDebounce } from "@/hooks/useDebounce";

// Definição dos schemas (Zod) poderia ser movida para um arquivo separado, 
// mas para simplificar vamos manter a validação manual/inline por enquanto 
// para seguir o padrão do AddPedidoDialog, ou adaptar conforme necessário.

interface ListItem {
  nome: string;
  quantidade: number;
  unidade: string;
  product_id?: string;
}

interface ListFormValues {
  nome: string;
  itens: ListItem[];
}

interface AddListDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: ListFormValues) => void;
}

const STEPS = [
  { id: "info", title: "Informações", icon: ListTodo },
  { id: "itens", title: "Itens", icon: Package },
];

export default function AddListDialog({ open, onOpenChange, onSave }: AddListDialogProps) {
  const isMobile = useIsMobile();
  const keyboardOffset = useKeyboardOffset();
  const { toast } = useToast();
  
  // Data Hooks
  const { products, isLoading: productsLoading } = useProducts();

  // Form States
  const [activeStep, setActiveStep] = useState("info");
  const [listName, setListName] = useState("");
  const [itens, setItens] = useState<ListItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Search/Input States
  const [productSearch, setProductSearch] = useState("");
  const [highlightedProductIndex, setHighlightedProductIndex] = useState(-1);
  const debouncedProductSearch = useDebounce(productSearch, 300);

  // New Item States
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [newItemName, setNewItemName] = useState("");
  const [newItemQuantity, setNewItemQuantity] = useState("1");
  const [newItemUnit, setNewItemUnit] = useState("un");

  // Refs
  const nameInputRef = useRef<HTMLInputElement>(null);
  const itemInputRef = useRef<HTMLInputElement>(null);
  const quantityInputRef = useRef<HTMLInputElement>(null);

  const currentStepIndex = STEPS.findIndex(s => s.id === activeStep);
  const progress = ((currentStepIndex + 1) / STEPS.length) * 100;

  // Reset e Inicialização
  useEffect(() => {
    if (open) {
      if (activeStep === "info") {
        setTimeout(() => nameInputRef.current?.focus(), 100);
      }
    } else {
      // Reset ao fechar
      setTimeout(() => {
        setListName("");
        setItens([]);
        setActiveStep("info");
        setProductSearch("");
        setNewItemName("");
        setNewItemQuantity("1");
        setSelectedProduct(null);
      }, 300);
    }
  }, [open]);

  // Focus management on step change
  useEffect(() => {
    if (open) {
      setTimeout(() => {
        if (activeStep === "info") nameInputRef.current?.focus();
        else if (activeStep === "itens") itemInputRef.current?.focus();
      }, 100);
    }
  }, [activeStep, open]);

  // Filtered Products Logic
  const filteredProducts = useMemo(() => {
    if (!debouncedProductSearch || debouncedProductSearch.trim().length < 2) return [];
    if (products.length === 0) return [];

    const searchLower = debouncedProductSearch.toLowerCase().trim();
    
    return products.filter(p => {
      if (p.name.toLowerCase().includes(searchLower)) return true;
      if (p.brand_name && p.brand_name.toLowerCase().includes(searchLower)) return true;
      return false;
    }).slice(0, 30);
  }, [products, debouncedProductSearch]);

  // Handlers
  const handleAddItem = () => {
    const nome = selectedProduct ? selectedProduct.name : newItemName;
    const qtd = parseFloat(newItemQuantity);

    if (!nome || nome.trim().length < 2) {
      toast({ title: "Nome inválido", description: "O item precisa de pelo menos 2 caracteres.", variant: "destructive" });
      return;
    }
    if (!qtd || qtd <= 0) {
      toast({ title: "Quantidade inválida", description: "A quantidade deve ser maior que zero.", variant: "destructive" });
      return;
    }

    setItens(prev => [...prev, {
      nome,
      quantidade: qtd,
      unidade: newItemUnit,
      product_id: selectedProduct?.id
    }]);

    // Reset item inputs
    setNewItemName("");
    setProductSearch("");
    setNewItemQuantity("1");
    setSelectedProduct(null);
    toast({ title: "Item adicionado", duration: 1000 });
    
    setTimeout(() => itemInputRef.current?.focus(), 50);
  };

  const selectProductFromList = (product: any) => {
    setSelectedProduct(product);
    setNewItemName(product.name);
    setProductSearch(""); // Limpa a busca visualmente, mas mantém o item selecionado
    setHighlightedProductIndex(-1);
    setTimeout(() => {
      quantityInputRef.current?.focus();
      quantityInputRef.current?.select();
    }, 50);
  };

  const handleProductKeyDown = useCallback((e: React.KeyboardEvent, field: 'search' | 'quantity') => {
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
      if (field === 'search') {
        if (selectedProduct) {
          quantityInputRef.current?.focus();
          quantityInputRef.current?.select();
        } else if (newItemName.trim().length >= 2) {
            quantityInputRef.current?.focus();
            quantityInputRef.current?.select();
        }
      } else if (field === 'quantity') {
        handleAddItem();
      }
    }
  }, [selectedProduct, newItemName, newItemQuantity, filteredProducts, highlightedProductIndex]);

  const canProceed = () => {
    switch (activeStep) {
      case "info": return listName.trim().length >= 3;
      case "itens": return itens.length > 0;
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

  const handleSave = () => {
    if (!canProceed()) return;
    
    const data: ListFormValues = {
      nome: listName,
      itens
    };
    
    onSave(data);
    toast({
      title: "Lista criada com sucesso!",
      description: `A lista "${data.nome}" com ${data.itens.length} itens foi salva.`,
    });
    onOpenChange(false);
  };

  // Scroll into view helper
  const handleInputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    if (!isMobile) return;
    setTimeout(() => {
      e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 300);
  };

  // Render Helpers
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
              <ClipboardList className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <DialogTitleComponent className="text-lg font-bold text-gray-900 dark:text-white tracking-tight truncate">
                Nova Lista
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
              <Button type="button" size="sm" onClick={handleSave} disabled={!canProceed()}
                className="bg-gray-900 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-200 text-white dark:text-gray-900 font-bold uppercase tracking-wider text-xs shadow-md h-9 px-4 rounded-lg active:scale-95 transition-transform">
                <Check className="h-3 w-3 mr-1.5" /><span className="hidden sm:inline">Salvar</span>
              </Button>
            )}
          </div>
          
          <Button type="button" variant="ghost" size="icon" onClick={() => onOpenChange(false)}
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
        
        {/* Step: Informações */}
        {activeStep === "info" && (
          <div className="h-full p-4 sm:p-6 overflow-y-auto custom-scrollbar flex flex-col justify-start">
             <Card className="border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
              <CardHeader className="pb-3 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
                <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white text-sm font-black uppercase tracking-wide">
                  <ListTodo className="h-4 w-4 text-gray-500" />
                  <span>Informações Básicas</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Nome da Lista</Label>
                  <Input 
                    ref={nameInputRef}
                    placeholder="Ex: Rancho do Mês, Churrasco..." 
                    value={listName}
                    onChange={(e) => setListName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (listName.trim().length >= 3) handleNext();
                      }
                    }}
                    onFocus={handleInputFocus}
                    className="h-11 bg-white dark:bg-gray-950 border-gray-200 dark:border-gray-800 text-sm font-medium rounded-lg focus:ring-gray-400/20" 
                  />
                  <p className="text-[10px] text-gray-400 pl-1">Mínimo de 3 caracteres</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step: Itens */}
        {activeStep === "itens" && (
          <div className="h-full p-4 sm:p-6 overflow-y-auto custom-scrollbar">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 h-full content-start">
              
              {/* Adicionar Item */}
              <Card className="border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm h-fit rounded-xl overflow-visible z-10">
                <CardHeader className="pb-3 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 rounded-t-xl">
                  <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white text-sm font-black uppercase tracking-wide">
                    <Plus className="h-4 w-4 text-gray-500" />
                    <span>Adicionar Item</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                  {/* Busca/Nome */}
                  <div className="space-y-1 relative">
                    <Label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Item / Produto</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                      <Input 
                        ref={itemInputRef}
                        placeholder="Buscar ou digitar nome..." 
                        value={selectedProduct ? selectedProduct.name : (productSearch || newItemName)}
                        onChange={(e) => { 
                          setProductSearch(e.target.value); 
                          setNewItemName(e.target.value);
                          setSelectedProduct(null); 
                        }}
                        onKeyDown={(e) => handleProductKeyDown(e, 'search')}
                        onFocus={handleInputFocus}
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
                        placeholder="1"
                        value={newItemQuantity}
                        onChange={(e) => setNewItemQuantity(e.target.value)}
                        onKeyDown={(e) => handleProductKeyDown(e, 'quantity')}
                        onFocus={handleInputFocus}
                        className="h-9 bg-white dark:bg-gray-950 border-gray-200 dark:border-gray-800 text-xs font-medium rounded-lg"
                      />
                    </div>
                    {/* Unidade poderia ser um Select, mas vamos simplificar como fixo 'un' ou expandir futuramente */}
                    <div className="space-y-1">
                      <Label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Unidade</Label>
                      <div className="h-9 flex items-center px-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-800 rounded-lg text-xs font-medium text-gray-500">
                        {newItemUnit}
                      </div>
                    </div>
                  </div>

                  <Button onClick={handleAddItem} 
                    className="w-full bg-gray-900 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-200 text-white dark:text-gray-900 font-bold uppercase tracking-wider text-xs h-9 rounded-lg shadow-sm">
                    <Plus className="h-3.5 w-3.5 mr-2" />
                    Adicionar à Lista
                  </Button>
                </CardContent>
              </Card>

              {/* Lista de Itens */}
              <Card className="border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm h-full max-h-[400px] lg:max-h-none rounded-xl overflow-hidden flex flex-col">
                <CardHeader className="pb-3 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 flex-shrink-0">
                  <CardTitle className="flex items-center justify-between text-sm font-black uppercase tracking-wide">
                    <span className="flex items-center gap-2 text-gray-900 dark:text-white">
                      <Package className="h-4 w-4 text-gray-500" />
                      Itens da Lista
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
                          <ClipboardList className="h-8 w-8 opacity-20 mb-2" />
                          <p className="text-xs font-medium">Sua lista está vazia</p>
                        </div>
                      ) : (
                        itens.map((item, index) => (
                          <div key={index} className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg shadow-sm group">
                            <div className="w-8 h-8 rounded bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0 font-bold text-xs text-gray-500">
                              {index + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-gray-900 dark:text-white truncate">{item.nome}</p>
                              <div className="flex items-center gap-2 mt-0.5 text-[10px] text-gray-500">
                                <span>{item.quantidade} {item.unidade}</span>
                              </div>
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
              </Card>
            </div>
          </div>
        )}

      </div>
    </>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="w-[96vw] sm:w-[92vw] md:w-[90vw] max-w-[800px] h-[85vh] sm:h-[80vh] max-h-[700px] p-0 gap-0 overflow-hidden border border-gray-200 dark:border-gray-800 shadow-md rounded-2xl flex flex-col bg-white dark:bg-gray-950"
      >
        {content}
      </DialogContent>
    </Dialog>
  );
}
