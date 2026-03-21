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
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
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
  ChevronRight, ChevronLeft, Check, FileText, Search, X, Clock, Settings2, ChevronsUpDown
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
  { id: "configuracao", title: "Configuração", icon: Settings2 },
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
        else if (activeStep === "configuracao") supplierSearchRef.current?.focus();
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
      case "configuracao": return selectedSuppliers.length > 0 && dataInicio && dataFim && dataFim > dataInicio && selectedItems.length > 0;
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
          <div className="bg-muted p-3 rounded-full mb-2">
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
      <ScrollArea className="flex-1 min-h-0 border border-border rounded-lg bg-background">
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
      <div className="flex-shrink-0 px-4 sm:px-6 py-4 border-b border-border/50 bg-card relative overflow-hidden">
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center text-brand border border-brand/20 flex-shrink-0">
              <Package className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <DialogTitleComponent className="text-lg font-bold text-foreground tracking-tight truncate">
                Nova Cotação
              </DialogTitleComponent>
              <DialogDescriptionComponent className="text-muted-foreground text-xs font-medium truncate">
                Etapa {currentStepIndex + 1}/{STEPS.length}
              </DialogDescriptionComponent>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center gap-2 sm:gap-3">
            {currentStepIndex > 0 && (
              <Button type="button" variant="outline" size="sm" onClick={handlePrevious}
                className="border-border/50 bg-card hover:bg-muted h-9 px-3 text-xs font-bold uppercase tracking-wider text-muted-foreground shadow-sm">
                <ChevronLeft className="h-3 w-3 sm:mr-1.5" />
                <span className="hidden sm:inline">Voltar</span>
              </Button>
            )}

            {currentStepIndex < STEPS.length - 1 ? (
              <Button type="button" size="sm" onClick={handleNext} disabled={!canProceed()}
                className="bg-brand hover:bg-brand/80 text-black font-bold uppercase tracking-wider text-xs shadow-md h-9 px-4 rounded-lg active:scale-95 transition-transform">
                <span className="hidden sm:inline">Próximo</span>
                <ChevronRight className="h-3 w-3 ml-1.5" />
              </Button>
            ) : (
              <Button type="button" size="sm" onClick={handleSubmit} disabled={addQuote.isPending}
                className="bg-brand hover:bg-brand/80 text-black font-bold uppercase tracking-wider text-xs shadow-md h-9 px-4 rounded-lg active:scale-95 transition-transform">
                {addQuote.isPending ? (
                  <><Loader2 className="h-3 w-3 animate-spin mr-1.5" /><span className="hidden sm:inline">Criando...</span></>
                ) : (
                  <><Check className="h-3 w-3 mr-1.5" /><span className="hidden sm:inline">Criar</span></>
                )}
              </Button>
            )}
          </div>

          <Button type="button" variant="ghost" size="icon" onClick={() => handleOpenChange(false)}
            className="h-9 w-9 text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-muted rounded-lg ml-2">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="mt-3">
          <Progress value={progress} className="h-1 bg-muted [&>div]:bg-brand rounded-full" />
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex-shrink-0 px-4 sm:px-5 py-3 border-b border-border/50 bg-muted/30">
        <div className="flex space-x-1 overflow-x-auto scrollbar-hide p-1 bg-background rounded-lg border border-border/50 shadow-sm">
          {STEPS.map((step) => {
            const Icon = step.icon;
            const status = getStepStatus(step.id);
            return (
              <button key={step.id} type="button" onClick={() => setActiveStep(step.id)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap flex-shrink-0 flex-1 justify-center",
                  status === "current" && "bg-card text-foreground shadow-sm border border-border/50",
                  status === "completed" && "bg-muted text-foreground hover:bg-muted/80 cursor-pointer shadow-sm",
                  status === "pending" && "text-muted-foreground hover:bg-muted cursor-pointer"
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
      <div className="flex-1 overflow-hidden relative bg-background">
        {/* Step: Embalagens */}
        {activeStep === "embalagens" && (
          <div className="h-full p-4 sm:p-6 overflow-y-auto custom-scrollbar">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 h-full content-start items-stretch">
              {/* Formulário de Seleção */}
              <Card className={cn("border-border bg-card shadow-sm h-full flex flex-col rounded-xl relative", isMobile ? "overflow-visible z-20" : "overflow-hidden")}>
                <CardHeader className="p-4 sm:p-5 border-b border-border/50 bg-muted/20">
                  <CardTitle className="flex items-center gap-2 text-foreground text-sm font-black uppercase tracking-wide">
                    <Plus className="h-4 w-4 text-brand" />
                    <span className="truncate">Selecionar Embalagens</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 flex-1 flex flex-col min-h-[300px]">
                  <div className="relative mb-3 z-30 flex-shrink-0">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                    <Input ref={itemSearchRef} placeholder="Buscar embalagem..." value={searchItem}
                      onChange={(e) => setSearchItem(e.target.value)}
                      onFocus={handleInputFocus}
                      className="pl-9 pr-9 h-9 bg-background border-border text-xs font-medium rounded-lg focus:ring-gray-400/20" />
                    {isLoadingSearch && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-gray-400" />
                      </div>
                    )}

                    {/* Lista de Resultados Mobile - Dropdown Absoluto */}
                    {isMobile && searchItem.trim().length > 0 && (
                      <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-50 bg-card border border-border rounded-lg shadow-xl overflow-hidden">
                        {renderList(
                          searchResults || [],
                          (item) => {
                            const isSelected = selectedItems.some(i => i.id === item.id);
                            return (
                              <div key={item.id} onClick={() => toggleItem(item)}
                                className={cn(
                                  "w-full p-3 text-left transition-all flex items-center gap-3 group cursor-pointer border-b border-border/40 last:border-0",
                                  isSelected
                                    ? "bg-muted/50"
                                    : "hover:bg-gray-50 dark:hover:bg-muted/50"
                                )}>
                                <Checkbox checked={isSelected}
                                  className="data-[state=checked]:bg-brand data-[state=checked]:border-brand data-[state=checked]:text-black h-4 w-4 rounded pointer-events-none" />
                                <div className="flex-1 min-w-0">
                                  <p className={cn("text-xs font-bold truncate", isSelected ? "text-foreground" : "text-muted-foreground")}>{item.name}</p>
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
                            "w-full p-2.5 rounded-lg text-left transition-all flex items-center gap-3 group cursor-pointer",
                            isSelected
                              ? "bg-muted border border-border/50"
                              : "hover:bg-gray-50 dark:hover:bg-muted/50 border border-transparent"
                          )}>
                          <Checkbox checked={isSelected}
                            className="data-[state=checked]:bg-brand data-[state=checked]:border-brand data-[state=checked]:text-black h-4 w-4 rounded pointer-events-none" />
                          <div className="flex-1 min-w-0">
                            <p className={cn("text-xs font-bold truncate", isSelected ? "text-foreground" : "text-muted-foreground")}>{item.name}</p>
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
              <Card className={cn("border-border bg-card shadow-sm rounded-xl overflow-hidden h-full flex flex-col relative", isMobile ? "z-10" : "")}>
                <CardHeader className="p-4 sm:p-5 border-b border-border/50 bg-muted/20">
                  <CardTitle className="flex items-center justify-between text-sm font-black uppercase tracking-wide">
                    <span className="flex items-center gap-2 text-foreground">
                      <Package className="h-4 w-4 text-brand" />
                      Selecionadas
                    </span>
                    <Badge variant="outline" className="bg-muted text-foreground border-border/50 font-bold">
                      {selectedItems.length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 flex-1 flex flex-col min-h-[300px]">
                  {renderList(
                    selectedItems,
                    (item) => (
                      <div key={item.id} className="flex items-center gap-3 p-3 bg-card hover:bg-muted/30 border border-border/50 rounded-xl shadow-sm group transition-all">
                        <div className="w-8 h-8 rounded-lg bg-brand/5 flex items-center justify-center flex-shrink-0 border border-brand/10">
                          <Package className="h-4 w-4 text-brand" />
                        </div>
                        <span className="flex-1 text-xs font-bold text-foreground truncate">{item.name}</span>
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

        {/* Step: Configuração (Merge Period, Suppliers and Confirmation) */}
        {activeStep === "configuracao" && (
          <div className="h-full p-4 sm:p-6 overflow-y-auto custom-scrollbar">
            <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 h-full content-start pb-20">

              {/* Coluna Esquerda: Configurações Gerais */}
              <div className="h-full">
                <Card className="border-border bg-card shadow-sm rounded-xl overflow-visible relative z-30 h-full flex flex-col">
                  <CardHeader className="p-4 sm:p-5 border-b border-border/50 bg-muted/20 rounded-t-xl flex-shrink-0">
                    <CardTitle className="flex items-center gap-2 text-foreground text-sm font-black uppercase tracking-wide">
                      <Clock className="h-4 w-4 text-brand flex-shrink-0" />
                      <span>Período & Detalhes</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-5 flex-1 flex flex-col min-h-[300px]">
                    <div className="grid grid-cols-2 gap-4 flex-shrink-0">
                      <div className="space-y-2">
                        <Label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Início</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className="w-full justify-start text-left font-medium h-10 bg-background border-border hover:bg-muted/40">
                              <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                              {format(dataInicio, "dd/MM/yyyy", { locale: ptBR })}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0 border-border/50 z-[100]" align="start">
                            <Calendar mode="single" selected={dataInicio} onSelect={(d) => d && setDataInicio(d)} locale={ptBR} />
                          </PopoverContent>
                        </Popover>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Fim</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className={cn("w-full justify-start text-left font-medium h-10 bg-background border-border hover:bg-muted/40", dataFim <= dataInicio && "border-red-500/50 text-red-500 bg-red-500/10")}>
                              <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                              {format(dataFim, "dd/MM/yyyy", { locale: ptBR })}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0 border-border/50 z-[100]" align="start">
                            <Calendar mode="single" selected={dataFim} onSelect={(d) => d && setDataFim(d)} locale={ptBR} disabled={(d) => d <= dataInicio} />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>

                    <div className="space-y-2 flex-1 flex flex-col">
                      <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">Observações (opcional)</Label>
                      <Textarea placeholder="Instruções para os fornecedores..." value={observacoes} onChange={(e) => setObservacoes(e.target.value)} onFocus={handleInputFocus} className="flex-1 resize-none bg-background border-border text-sm focus:ring-brand/20 min-h-[120px]" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Coluna Direita: Fornecedores */}
              <div className="relative overflow-visible z-40 h-full">
                <Card className="border-border bg-card shadow-sm rounded-xl overflow-visible h-full flex flex-col">
                  <CardHeader className="p-4 sm:p-5 border-b border-border/50 bg-muted/20 rounded-t-xl flex-shrink-0">
                    <CardTitle className="flex items-center justify-between text-sm font-black uppercase tracking-wide">
                      <span className="flex items-center gap-2 text-foreground">
                        <Building2 className="h-4 w-4 text-brand" />
                        Fornecedores
                      </span>
                      <Badge variant="outline" className="bg-muted">{selectedSuppliers.length}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-5 space-y-5 flex-1 flex flex-col min-h-[300px]">
                    {/* Popover Selection for Suppliers (Prevents huge scroll) */}
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" role="combobox" className="w-full justify-between bg-background border-border h-10 font-bold hover:bg-muted/40 text-xs text-foreground">
                          <span><Building2 className="inline-block w-3.5 h-3.5 mr-2" /> {selectedSuppliers.length === 0 ? "Adicionar fornecedores..." : `${selectedSuppliers.length} convidados`}</span>
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[300px] sm:w-[350px] p-0 border-border shadow-xl rounded-xl z-[100]" sideOffset={8}>
                        <Command className="bg-background">
                          <CommandInput placeholder="Buscar fornecedor..." className="h-10 text-xs" />
                          <CommandList className="max-h-[250px] custom-scrollbar">
                            <CommandEmpty className="py-4 text-center text-xs text-gray-500 font-medium">Nenhum fornecedor encontrado.</CommandEmpty>
                            <CommandGroup>
                              {suppliers.map(supplier => (
                                <CommandItem key={supplier.id} value={supplier.name} onSelect={() => toggleSupplier(supplier.id)} className="cursor-pointer text-xs font-bold text-foreground aria-selected:bg-gray-100 dark:aria-selected:bg-gray-800 aria-selected:text-gray-900 dark:aria-selected:text-white">
                                  <div className="flex items-center gap-2 w-full">
                                    <div className={cn("flex h-4 w-4 items-center justify-center rounded border", selectedSuppliers.includes(supplier.id) ? "bg-brand border-brand text-black" : "border-gray-300 dark:border-gray-600 opacity-50")}>
                                      {selectedSuppliers.includes(supplier.id) && <Check className="h-3 w-3" />}
                                    </div>
                                    <span className="truncate">{supplier.name}</span>
                                  </div>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>

                    {/* Selected Suppliers List */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 -mr-2">
                      {selectedSuppliers.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center py-10 bg-muted/20 border border-dashed border-border/50 rounded-xl">
                          <Building2 className="h-8 w-8 mb-3 text-muted-foreground opacity-50" />
                          <p className="text-xs font-medium text-center text-muted-foreground">Convide fornecedores acima</p>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-2.5">
                          {selectedSuppliersData.map(supplier => (
                            <div key={supplier.id} className="flex items-center justify-between p-3 bg-card border border-border/50 rounded-xl group hover:border-brand/30 transition-all">
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="w-8 h-8 rounded-lg bg-brand/5 border border-brand/10 flex items-center justify-center flex-shrink-0">
                                  <Building2 className="h-4 w-4 text-brand" />
                                </div>
                                <span className="text-xs font-bold truncate text-foreground">{supplier.name}</span>
                              </div>
                              <Button variant="ghost" size="icon" onClick={() => toggleSupplier(supplier.id)} className="h-6 w-6 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
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
          className="flex flex-col p-0 gap-0 overflow-hidden border-t border-border/50 bg-background transition-all duration-200"
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
        className="w-[96vw] sm:w-[92vw] md:w-[90vw] max-w-[800px] h-[90vh] sm:h-[88vh] max-h-[750px] p-0 gap-0 overflow-hidden border border-border shadow-md rounded-2xl flex flex-col bg-background [&>button]:hidden"
        onKeyDown={handleKeyDown}
      >
        {content}
      </DialogContent>
    </Dialog>
  );
}
