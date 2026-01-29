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
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { usePackagingQuotes } from "@/hooks/usePackagingQuotes";
import { usePackagingSearch } from "@/hooks/usePackagingSearch";
import { useDebounce } from "@/hooks/useDebounce";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  CalendarIcon, Package, Building2, Plus, Loader2, 
  ChevronRight, ChevronLeft, Check, FileText, Search, X, Clock
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { PackagingItem } from "@/types/packaging";
import type { Supplier } from "@/hooks/useSuppliers";
import { useIsMobile } from "@/hooks/use-mobile";
import { useKeyboardOffset } from "@/hooks/useKeyboardOffset";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  packagingItems: PackagingItem[];
  suppliers: Supplier[];
}

const STEPS = [
  { id: "embalagens", title: "Embalagens", icon: Package },
  { id: "fornecedores", title: "Fornecedores", icon: Building2 },
  { id: "periodo", title: "Período", icon: Clock },
  { id: "confirmar", title: "Confirmar", icon: FileText },
];

export function AddPackagingQuoteDialog({ open, onOpenChange, packagingItems: _initialItems, suppliers }: Props) {
  const { addQuote } = usePackagingQuotes();
  const isMobile = useIsMobile();
  const keyboardOffset = useKeyboardOffset();
  const [activeStep, setActiveStep] = useState("embalagens");
  const [selectedItems, setSelectedItems] = useState<PackagingItem[]>([]);
  const [selectedSuppliers, setSelectedSuppliers] = useState<string[]>([]);
  const [searchItem, setSearchItem] = useState("");
  const debouncedSearchItem = useDebounce(searchItem, 300);
  const { data: searchResults, isLoading: isLoadingSearch } = usePackagingSearch(debouncedSearchItem);
  
  const [searchSupplier, setSearchSupplier] = useState("");
  const [dataInicio, setDataInicio] = useState<Date>(new Date());
  const [dataFim, setDataFim] = useState<Date>(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
  const [observacoes, setObservacoes] = useState("");

  const itemSearchRef = useRef<HTMLInputElement>(null);
  const supplierSearchRef = useRef<HTMLInputElement>(null);

  const currentStepIndex = STEPS.findIndex(s => s.id === activeStep);
  const progress = ((currentStepIndex + 1) / STEPS.length) * 100;

  useEffect(() => {
    if (open) {
      setTimeout(() => {
        if (activeStep === "embalagens") itemSearchRef.current?.focus();
        else if (activeStep === "fornecedores") supplierSearchRef.current?.focus();
      }, 100);
    }
  }, [activeStep, open]);

  // filteredItems não é mais necessário pois usamos searchResults do hook

  const filteredSuppliers = useMemo(() => {
    const search = searchSupplier.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
    if (!search) return suppliers;

    return suppliers.filter(s =>
      s.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes(search)
    );
  }, [suppliers, searchSupplier]);

  const selectedSuppliersData = useMemo(() => 
    suppliers.filter(s => selectedSuppliers.includes(s.id)),
    [suppliers, selectedSuppliers]);

  const toggleItem = (item: PackagingItem) => {
    setSelectedItems(prev => {
      const exists = prev.some(i => i.id === item.id);
      if (exists) {
        return prev.filter(i => i.id !== item.id);
      }
      return [...prev, item];
    });
  };

  const toggleSupplier = (id: string) => {
    setSelectedSuppliers(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const getStepStatus = (stepId: string) => {
    const stepIndex = STEPS.findIndex(s => s.id === stepId);
    if (stepIndex < currentStepIndex) return "completed";
    if (stepIndex === currentStepIndex) return "current";
    return "pending";
  };

  const canProceed = () => {
    switch (activeStep) {
      case "embalagens": return selectedItems.length > 0;
      case "fornecedores": return selectedSuppliers.length > 0;
      case "periodo": return dataInicio && dataFim && dataFim > dataInicio;
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
    const itens = selectedItems.map(item => {
      return { packagingId: item.id, packagingName: item.name };
    });

    const fornecedoresNomes: { [id: string]: string } = {};
    selectedSuppliers.forEach(id => {
      const supplier = suppliers.find(s => s.id === id);
      if (supplier) fornecedoresNomes[id] = supplier.name;
    });

    await addQuote.mutateAsync({
      dataInicio, dataFim, observacoes, itens,
      fornecedoresIds: selectedSuppliers, fornecedoresNomes,
    });

    handleReset();
    onOpenChange(false);
  };

  const handleReset = () => {
    setActiveStep("embalagens");
    setSelectedItems([]);
    setSelectedSuppliers([]);
    setSearchItem("");
    setSearchSupplier("");
    setDataInicio(new Date());
    setDataFim(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
    setObservacoes("");
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
  }, [activeStep, currentStepIndex, canProceed]);

  // Render list helper
  const renderList = (items: any[], renderItem: (item: any) => React.ReactNode, emptyMessage: React.ReactNode, icon: React.ElementType) => {
    if (items.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-8 text-gray-400">
          <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-full mb-2">
            {React.createElement(icon, { className: "h-6 w-6 opacity-50" })}
          </div>
          <p className="text-xs font-medium text-center">{emptyMessage}</p>
        </div>
      );
    }
    
    // On mobile, use native scroll within the step container instead of nested ScrollArea
    if (isMobile) {
      return (
        <div className="p-1.5 space-y-1 max-h-[300px] overflow-y-auto custom-scrollbar">
          {items.map(renderItem)}
        </div>
      );
    }

    return (
      <ScrollArea className="h-[250px] border border-gray-200 dark:border-gray-800 rounded-lg bg-gray-50 dark:bg-gray-950">
        <div className="p-1.5 space-y-1">
          {items.map(renderItem)}
        </div>
      </ScrollArea>
    );
  };

  // Scroll into view helper para inputs
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

  // Se estiver no mobile e teclado aberto, ajustamos o container para garantir visibilidade
  // O container principal flex-1 precisa encolher
  
  const content = (
    <>
      {/* Header otimizado */}
      <div className="flex-shrink-0 px-4 sm:px-5 py-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 relative overflow-hidden">
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 flex-shrink-0">
              <Package className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <DialogTitleComponent className="text-lg font-bold text-gray-900 dark:text-white tracking-tight truncate">
                Nova Cotação
              </DialogTitleComponent>
              <DialogDescriptionComponent className="text-gray-500 dark:text-gray-400 text-xs font-medium truncate">
                Etapa {currentStepIndex + 1}/{STEPS.length}
              </DialogDescriptionComponent>
            </div>
          </div>

          {/* Navigation */}
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
              <Button type="button" size="sm" onClick={handleSubmit} disabled={addQuote.isPending}
                className="bg-gray-900 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-200 text-white dark:text-gray-900 font-bold uppercase tracking-wider text-xs shadow-md h-9 px-4 rounded-lg active:scale-95 transition-transform">
                {addQuote.isPending ? (
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
          {STEPS.map((step) => {
            const Icon = step.icon;
            const status = getStepStatus(step.id);
            return (
              <button key={step.id} type="button" onClick={() => setActiveStep(step.id)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap flex-shrink-0 flex-1 justify-center",
                  status === "current" && "bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm ring-1 ring-gray-200 dark:ring-gray-700",
                  status === "completed" && "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer shadow-sm",
                  status === "pending" && "text-gray-500 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
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
      <div className="flex-1 overflow-hidden relative bg-white dark:bg-gray-950">
        {/* Step: Embalagens */}
        {activeStep === "embalagens" && (
          <div className="h-full p-4 sm:p-6 overflow-y-auto custom-scrollbar">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 h-full content-start">
              {/* Formulário de Seleção */}
              <Card className={cn("border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm h-fit rounded-xl relative", isMobile ? "overflow-visible z-20" : "overflow-hidden")}>
                <CardHeader className="pb-3 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
                  <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white text-sm font-black uppercase tracking-wide">
                    <Plus className="h-4 w-4 text-gray-500" />
                    <span className="truncate">Selecionar Embalagens</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="relative mb-3 z-30">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                    <Input ref={itemSearchRef} placeholder="Buscar embalagem..." value={searchItem}
                      onChange={(e) => setSearchItem(e.target.value)}
                      onFocus={handleInputFocus}
                      className="pl-9 pr-9 h-9 bg-white dark:bg-gray-950 border-gray-200 dark:border-gray-800 text-xs font-medium rounded-lg focus:ring-gray-400/20" />
                    {isLoadingSearch && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-gray-400" />
                      </div>
                    )}
                    
                    {/* Lista de Resultados Mobile - Dropdown Absoluto */}
                    {isMobile && searchItem.trim().length > 0 && (
                      <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-50 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow-xl overflow-hidden">
                        {renderList(
                          searchResults || [],
                          (item) => {
                            const isSelected = selectedItems.some(i => i.id === item.id);
                            return (
                              <div key={item.id} onClick={() => toggleItem(item)}
                                className={cn(
                                  "w-full p-2 text-left transition-all flex items-center gap-2 group cursor-pointer border-b border-gray-100 dark:border-gray-800 last:border-0",
                                  isSelected
                                    ? "bg-gray-50 dark:bg-gray-800/50"
                                    : "hover:bg-gray-50 dark:hover:bg-gray-800/50"
                                )}>
                                <Checkbox checked={isSelected} 
                                  className="data-[state=checked]:bg-gray-900 data-[state=checked]:border-gray-900 dark:data-[state=checked]:bg-white dark:data-[state=checked]:border-white dark:data-[state=checked]:text-gray-900 h-4 w-4 rounded pointer-events-none" />
                                <div className="flex-1 min-w-0">
                                  <p className={cn("text-xs font-bold truncate", isSelected ? "text-gray-900 dark:text-white" : "text-gray-600 dark:text-gray-400")}>{item.name}</p>
                                  {item.category && <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">{item.category}</span>}
                                </div>
                              </div>
                            );
                          },
                          "Nenhuma embalagem encontrada",
                          Package
                        )}
                      </div>
                    )}
                  </div>

                  {/* Lista de Resultados Desktop - Normal Flow */}
                  {!isMobile && renderList(
                    searchResults || [],
                    (item) => {
                      const isSelected = selectedItems.some(i => i.id === item.id);
                      return (
                        <div key={item.id} onClick={() => toggleItem(item)}
                          className={cn(
                            "w-full p-2 rounded-md text-left transition-all flex items-center gap-2 group cursor-pointer",
                            isSelected
                              ? "bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
                              : "hover:bg-gray-50 dark:hover:bg-gray-800/50 border border-transparent"
                          )}>
                          <Checkbox checked={isSelected} 
                            className="data-[state=checked]:bg-gray-900 data-[state=checked]:border-gray-900 dark:data-[state=checked]:bg-white dark:data-[state=checked]:border-white dark:data-[state=checked]:text-gray-900 h-4 w-4 rounded pointer-events-none" />
                          <div className="flex-1 min-w-0">
                            <p className={cn("text-xs font-bold truncate", isSelected ? "text-gray-900 dark:text-white" : "text-gray-600 dark:text-gray-400")}>{item.name}</p>
                            {item.category && <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">{item.category}</span>}
                          </div>
                        </div>
                      );
                    },
                    searchItem.trim().length === 0 ? "Digite para buscar embalagens" : "Nenhuma embalagem encontrada",
                    Package
                  )}
                  
                  {/* Feedback vazio inicial Mobile (quando não há busca) */}
                  {isMobile && searchItem.trim().length === 0 && (
                     <div className="flex flex-col items-center justify-center py-4 text-gray-400">
                       <p className="text-xs font-medium text-center">Digite para buscar embalagens</p>
                     </div>
                  )}
                </CardContent>
              </Card>

              {/* Lista de Selecionados */}
              <Card className={cn("border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm rounded-xl overflow-hidden h-fit relative", isMobile ? "z-10" : "")}>
                <CardHeader className="pb-3 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
                  <CardTitle className="flex items-center justify-between text-sm font-black uppercase tracking-wide">
                    <span className="flex items-center gap-2 text-gray-900 dark:text-white">
                      <Package className="h-4 w-4 text-gray-500" />
                      Selecionadas
                    </span>
                    <Badge variant="outline" className="bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white border-gray-200 dark:border-gray-700 font-bold">
                      {selectedItems.length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  {renderList(
                    selectedItems,
                    (item) => (
                      <div key={item.id} className="flex items-center gap-2 p-2 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg shadow-sm group">
                        <div className="w-6 h-6 rounded bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                          <Package className="h-3 w-3 text-gray-500" />
                        </div>
                        <span className="flex-1 text-xs font-bold text-gray-700 dark:text-gray-300 truncate">{item.name}</span>
                        <Button variant="ghost" size="sm" onClick={() => toggleItem(item)}
                          className="h-6 w-6 p-0 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors">
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ),
                    "Nenhuma embalagem selecionada",
                    Package
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Step: Fornecedores */}
        {activeStep === "fornecedores" && (
          <div className="h-full p-4 sm:p-6 overflow-y-auto custom-scrollbar">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 content-start min-h-full">
              <Card className="border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm h-fit rounded-xl overflow-hidden">
                <CardHeader className="pb-3 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
                  <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white text-sm font-black uppercase tracking-wide">
                    <Building2 className="h-4 w-4 text-gray-500 flex-shrink-0" />
                    <span className="truncate">Selecionar Fornecedores</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="relative mb-3">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                    <Input ref={supplierSearchRef} placeholder="Buscar fornecedor..." value={searchSupplier}
                      onChange={(e) => setSearchSupplier(e.target.value)}
                      onFocus={handleInputFocus}
                      className="pl-9 h-9 bg-white dark:bg-gray-950 border-gray-200 dark:border-gray-800 text-xs font-medium rounded-lg focus:ring-gray-400/20" />
                  </div>
                  {renderList(
                    filteredSuppliers,
                    (supplier) => (
                      <button key={supplier.id} onClick={() => toggleSupplier(supplier.id)}
                        className={cn(
                          "w-full p-2 rounded-md text-left transition-all flex items-center gap-2 group",
                          selectedSuppliers.includes(supplier.id)
                            ? "bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
                            : "hover:bg-gray-50 dark:hover:bg-gray-800/50 border border-transparent"
                        )}>
                        <div className={cn("w-6 h-6 rounded flex items-center justify-center flex-shrink-0 transition-colors",
                          selectedSuppliers.includes(supplier.id) ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900" : "bg-gray-200 dark:bg-gray-700 text-gray-500")}>
                          {selectedSuppliers.includes(supplier.id) ? <Check className="h-3 w-3" /> : <Building2 className="h-3 w-3" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={cn("text-xs font-bold truncate", selectedSuppliers.includes(supplier.id) ? "text-gray-900 dark:text-white" : "text-gray-600 dark:text-gray-400")}>{supplier.name}</p>
                          {supplier.phone && <span className="text-[10px] text-gray-400 font-medium">{supplier.phone}</span>}
                        </div>
                      </button>
                    ),
                    "Nenhum fornecedor encontrado",
                    Building2
                  )}
                </CardContent>
              </Card>

              <Card className="border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm rounded-xl overflow-hidden h-fit">
                <CardHeader className="pb-3 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
                  <CardTitle className="flex items-center justify-between text-sm font-black uppercase tracking-wide">
                    <span className="flex items-center gap-2 text-gray-900 dark:text-white">
                      <Building2 className="h-4 w-4 text-gray-500" />
                      Selecionados
                    </span>
                    <Badge variant="outline" className="bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white border-gray-200 dark:border-gray-700 font-bold">
                      {selectedSuppliers.length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  {renderList(
                    selectedSuppliersData,
                    (supplier) => (
                      <div key={supplier.id} className="flex items-center gap-2 p-2 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/50 rounded-lg shadow-sm">
                        <div className="w-6 h-6 rounded bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                          <Building2 className="h-3 w-3 text-gray-500" />
                        </div>
                        <span className="flex-1 text-xs font-bold text-gray-700 dark:text-gray-300 truncate">{supplier.name}</span>
                        <Button variant="ghost" size="sm" onClick={() => toggleSupplier(supplier.id)}
                          className="h-6 w-6 p-0 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors">
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ),
                    "Nenhum fornecedor selecionado",
                    Building2
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Step: Período */}
        {activeStep === "periodo" && (
          <div className="h-full p-4 sm:p-6 overflow-y-auto custom-scrollbar flex items-center justify-center">
            <Card className="border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm w-full max-w-xl rounded-xl overflow-hidden">
              <CardHeader className="pb-3 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
                <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white text-sm font-black uppercase tracking-wide">
                  <Clock className="h-4 w-4 text-gray-500 flex-shrink-0" />
                  <span>Período da Cotação</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Data de Início</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left font-medium h-10 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
                          <CalendarIcon className="mr-2 h-4 w-4 text-gray-400" />
                          {format(dataInicio, "dd/MM/yyyy", { locale: ptBR })}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 border-gray-200 dark:border-gray-700" align="start">
                        <Calendar mode="single" selected={dataInicio}
                          onSelect={(date) => date && setDataInicio(date)} locale={ptBR} />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Data de Fim</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline"
                          className={cn("w-full justify-start text-left font-medium h-10 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800",
                            dataFim <= dataInicio && "border-red-300 text-red-600 bg-red-50")}>
                          <CalendarIcon className="mr-2 h-4 w-4 text-gray-400" />
                          {format(dataFim, "dd/MM/yyyy", { locale: ptBR })}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 border-gray-200 dark:border-gray-700" align="start">
                        <Calendar mode="single" selected={dataFim}
                          onSelect={(date) => date && setDataFim(date)} locale={ptBR}
                          disabled={(date) => date <= dataInicio} />
                      </PopoverContent>
                    </Popover>
                    {dataFim <= dataInicio && (
                      <p className="text-[10px] font-bold text-red-500 mt-1">Data de fim deve ser posterior à data de início</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Observações (opcional)</Label>
                  <Textarea 
                    placeholder="Observações sobre a cotação..." 
                    value={observacoes}
                    onChange={(e) => setObservacoes(e.target.value)} 
                    onFocus={handleInputFocus}
                    rows={4} 
                    className="resize-none bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-sm focus:ring-gray-400/20" 
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step: Confirmar */}
        {activeStep === "confirmar" && (
          <div className="h-full p-4 sm:p-6 overflow-y-auto custom-scrollbar">
            <div className="max-w-2xl mx-auto space-y-4">
              {/* Período */}
              <Card className="border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm rounded-xl overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                      <CalendarIcon className="h-3.5 w-3.5 text-gray-500" />
                    </div>
                    <span className="text-xs font-black uppercase tracking-wider text-gray-500">Período</span>
                  </div>
                  <p className="text-sm font-bold text-gray-900 dark:text-white pl-8">
                    {format(dataInicio, "dd/MM/yyyy", { locale: ptBR })} até {format(dataFim, "dd/MM/yyyy", { locale: ptBR })}
                  </p>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Embalagens */}
                <Card className="border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm rounded-xl overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                          <Package className="h-3.5 w-3.5 text-gray-500" />
                        </div>
                        <span className="text-xs font-black uppercase tracking-wider text-gray-500">Embalagens</span>
                      </div>
                      <Badge variant="secondary" className="font-bold">{selectedItems.length}</Badge>
                    </div>
                    <div className="flex flex-wrap gap-1.5 pl-8">
                      {selectedItems.map(item => (
                        <Badge key={item.id} variant="outline" className="text-[10px] font-medium bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300">
                          {item.name}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Fornecedores */}
                <Card className="border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm rounded-xl overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                          <Building2 className="h-3.5 w-3.5 text-gray-500" />
                        </div>
                        <span className="text-xs font-black uppercase tracking-wider text-gray-500">Fornecedores</span>
                      </div>
                      <Badge variant="secondary" className="font-bold">{selectedSuppliersData.length}</Badge>
                    </div>
                    <div className="flex flex-wrap gap-1.5 pl-8">
                      {selectedSuppliersData.map(supplier => (
                        <Badge key={supplier.id} variant="outline" className="text-[10px] font-medium bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300">
                          {supplier.name}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Observações */}
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

              {/* Dica */}
              <div className="text-center pt-4">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-800 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                  <kbd className="font-sans text-xs">Ctrl</kbd> + <kbd className="font-sans text-xs">Enter</kbd> para confirmar
                </span>
              </div>
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
        className="w-[96vw] sm:w-[92vw] md:w-[90vw] max-w-[800px] h-[90vh] sm:h-[88vh] max-h-[750px] p-0 gap-0 overflow-hidden border border-gray-200 dark:border-gray-800 shadow-md rounded-2xl flex flex-col bg-white dark:bg-gray-950 [&>button]:hidden"
        onKeyDown={handleKeyDown}
      >
        {content}
      </DialogContent>
    </Dialog>
  );
}
