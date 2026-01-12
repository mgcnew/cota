import { useState, useMemo, useRef, useEffect, useCallback } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { usePackagingQuotes } from "@/hooks/usePackagingQuotes";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  CalendarIcon, Package, Building2, Plus, Loader2, 
  ChevronRight, ChevronLeft, Check, FileText, Search, X, Clock
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { PackagingItem } from "@/types/packaging";
import type { Supplier } from "@/hooks/useSuppliers";

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

export function AddPackagingQuoteDialog({ open, onOpenChange, packagingItems, suppliers }: Props) {
  const { addQuote } = usePackagingQuotes();
  const [activeStep, setActiveStep] = useState("embalagens");
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [selectedSuppliers, setSelectedSuppliers] = useState<string[]>([]);
  const [searchItem, setSearchItem] = useState("");
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

  const filteredItems = useMemo(() => 
    packagingItems.filter(item =>
      item.name.toLowerCase().includes(searchItem.toLowerCase())
    ), [packagingItems, searchItem]);

  const filteredSuppliers = useMemo(() => 
    suppliers.filter(s =>
      s.name.toLowerCase().includes(searchSupplier.toLowerCase())
    ), [suppliers, searchSupplier]);

  const selectedItemsData = useMemo(() => 
    packagingItems.filter(item => selectedItems.includes(item.id)),
    [packagingItems, selectedItems]);

  const selectedSuppliersData = useMemo(() => 
    suppliers.filter(s => selectedSuppliers.includes(s.id)),
    [suppliers, selectedSuppliers]);

  const toggleItem = (id: string) => {
    setSelectedItems(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
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
    const itens = selectedItems.map(id => {
      const item = packagingItems.find(p => p.id === id);
      return { packagingId: id, packagingName: item?.name || '' };
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
  }, [activeStep, currentStepIndex]);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent 
        className="w-[96vw] sm:w-[92vw] md:w-[90vw] max-w-[800px] h-[90vh] sm:h-[88vh] max-h-[750px] p-0 gap-0 overflow-hidden border border-gray-200/60 dark:border-gray-700/30 shadow-xl rounded-xl sm:rounded-2xl flex flex-col bg-white dark:bg-gray-900 [&>button]:hidden"
        onKeyDown={handleKeyDown}
      >
        {/* Header */}
        <DialogHeader className="flex-shrink-0 px-4 sm:px-5 py-3 sm:py-4 border-b border-gray-200/60 dark:border-gray-700/40 bg-white dark:bg-gray-900">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-9 h-9 rounded-lg bg-purple-600 flex items-center justify-center text-white flex-shrink-0">
                <Package className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <DialogTitle className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white truncate">
                  Nova Cotação de Embalagens
                </DialogTitle>
                <DialogDescription className="text-gray-500 dark:text-gray-400 text-xs truncate">
                  Etapa {currentStepIndex + 1}/{STEPS.length}
                </DialogDescription>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex items-center gap-2 sm:gap-3">
              {currentStepIndex > 0 && (
                <Button type="button" variant="outline" size="sm" onClick={handlePrevious}
                  className="border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 h-8 px-3">
                  <ChevronLeft className="h-3 w-3 mr-1" />
                  <span className="hidden sm:inline">Voltar</span>
                </Button>
              )}
              
              {currentStepIndex < STEPS.length - 1 ? (
                <Button type="button" size="sm" onClick={handleNext} disabled={!canProceed()}
                  className="bg-purple-600 hover:bg-purple-700 text-white shadow-lg h-8 px-3">
                  <span className="hidden sm:inline">Próximo</span>
                  <ChevronRight className="h-3 w-3 ml-1" />
                </Button>
              ) : (
                <Button type="button" size="sm" onClick={handleSubmit} disabled={addQuote.isPending}
                  className="bg-purple-600 hover:bg-purple-700 text-white shadow-lg h-8 px-3">
                  {addQuote.isPending ? (
                    <><Loader2 className="h-3 w-3 animate-spin mr-1" /><span className="hidden sm:inline">Criando...</span></>
                  ) : (
                    <><Check className="h-3 w-3 mr-1" /><span className="hidden sm:inline">Criar</span></>
                  )}
                </Button>
              )}
            </div>
            
            <Button type="button" variant="ghost" size="sm" onClick={() => handleOpenChange(false)}
              className="h-8 w-8 p-0 flex-shrink-0 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="mt-2">
            <Progress value={progress} className="h-1 bg-gray-100 dark:bg-gray-800 [&>div]:bg-purple-600" />
          </div>
        </DialogHeader>

        {/* Tab Navigation */}
        <div className="flex-shrink-0 px-4 py-2.5 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <div className="flex space-x-1 overflow-x-auto scrollbar-hide">
            {STEPS.map((step) => {
              const Icon = step.icon;
              const status = getStepStatus(step.id);
              return (
                <button key={step.id} type="button" onClick={() => status !== "pending" && setActiveStep(step.id)}
                  disabled={status === "pending"}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all whitespace-nowrap flex-shrink-0",
                    status === "current" && "bg-purple-600 text-white",
                    status === "completed" && "bg-green-600 text-white cursor-pointer",
                    status === "pending" && "bg-white dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed"
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
        <div className="flex-1 overflow-hidden">
          {/* Step: Embalagens */}
          {activeStep === "embalagens" && (
            <div className="h-full p-4 sm:p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 h-full">
                {/* Formulário de Seleção */}
                <Card className="border-purple-100 dark:border-gray-700 bg-white dark:bg-gray-800/50 shadow-sm h-fit">
                  <CardHeader className="pb-3 border-b border-purple-100/60 dark:border-gray-700">
                    <CardTitle className="flex items-center gap-2 text-purple-900 dark:text-white text-base">
                      <Plus className="h-5 w-5 text-purple-600 flex-shrink-0" />
                      <span className="truncate">Selecionar Embalagens</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="relative mb-3">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input ref={itemSearchRef} placeholder="Buscar embalagem..." value={searchItem}
                        onChange={(e) => setSearchItem(e.target.value)}
                        className="pl-9 h-10 bg-white dark:bg-gray-900 border-purple-200 dark:border-gray-700" />
                    </div>
                    <ScrollArea className="h-[200px] border border-gray-200 dark:border-gray-700 rounded-lg">
                      {filteredItems.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                          <Package className="h-10 w-10 mb-2 opacity-50" />
                          <p className="text-sm">Nenhuma embalagem encontrada</p>
                        </div>
                      ) : (
                        <div className="p-2 space-y-1">
                          {filteredItems.map((item) => (
                            <button key={item.id} onClick={() => toggleItem(item.id)}
                              className={cn(
                                "w-full p-2.5 rounded-lg text-left transition-all flex items-center gap-2",
                                selectedItems.includes(item.id)
                                  ? "bg-purple-100 dark:bg-purple-900/30 border border-purple-400"
                                  : "bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 hover:border-purple-200"
                              )}>
                              <Checkbox checked={selectedItems.includes(item.id)} 
                                className="data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600" />
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm truncate">{item.name}</p>
                                {item.category && <span className="text-xs text-gray-500">{item.category}</span>}
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </ScrollArea>
                  </CardContent>
                </Card>

                {/* Lista de Selecionados */}
                <Card className="border-gray-200 dark:border-gray-700 shadow-sm">
                  <CardHeader className="pb-3 border-b border-gray-200 dark:border-gray-700">
                    <CardTitle className="flex items-center justify-between text-base">
                      <span className="flex items-center gap-2">
                        <Package className="h-5 w-5 text-purple-600" />
                        Selecionadas
                      </span>
                      <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                        {selectedItems.length}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <ScrollArea className="h-[200px]">
                      {selectedItemsData.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                          <Package className="h-10 w-10 mb-2 opacity-50" />
                          <p className="text-sm">Nenhuma embalagem selecionada</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {selectedItemsData.map((item) => (
                            <div key={item.id} className="flex items-center gap-2 p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                              <Package className="h-4 w-4 text-purple-600" />
                              <span className="flex-1 text-sm font-medium truncate">{item.name}</span>
                              <Button variant="ghost" size="sm" onClick={() => toggleItem(item.id)}
                                className="h-6 w-6 p-0 text-gray-400 hover:text-red-500">
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* Step: Fornecedores */}
          {activeStep === "fornecedores" && (
            <div className="h-full p-4 sm:p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 h-full">
                <Card className="border-purple-100 dark:border-gray-700 bg-white dark:bg-gray-800/50 shadow-sm h-fit">
                  <CardHeader className="pb-3 border-b border-purple-100/60 dark:border-gray-700">
                    <CardTitle className="flex items-center gap-2 text-purple-900 dark:text-white text-base">
                      <Building2 className="h-5 w-5 text-purple-600 flex-shrink-0" />
                      <span className="truncate">Selecionar Fornecedores</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="relative mb-3">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input ref={supplierSearchRef} placeholder="Buscar fornecedor..." value={searchSupplier}
                        onChange={(e) => setSearchSupplier(e.target.value)}
                        className="pl-9 h-10 bg-white dark:bg-gray-900 border-purple-200 dark:border-gray-700" />
                    </div>
                    <ScrollArea className="h-[200px] border border-gray-200 dark:border-gray-700 rounded-lg">
                      {filteredSuppliers.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                          <Building2 className="h-10 w-10 mb-2 opacity-50" />
                          <p className="text-sm">Nenhum fornecedor encontrado</p>
                        </div>
                      ) : (
                        <div className="p-2 space-y-1">
                          {filteredSuppliers.map((supplier) => (
                            <button key={supplier.id} onClick={() => toggleSupplier(supplier.id)}
                              className={cn(
                                "w-full p-2.5 rounded-lg text-left transition-all flex items-center gap-2",
                                selectedSuppliers.includes(supplier.id)
                                  ? "bg-purple-100 dark:bg-purple-900/30 border border-purple-400"
                                  : "bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 hover:border-purple-200"
                              )}>
                              <div className={cn("w-8 h-8 rounded-full flex items-center justify-center",
                                selectedSuppliers.includes(supplier.id) ? "bg-purple-500 text-white" : "bg-gray-100 dark:bg-gray-700")}>
                                <Building2 className="h-4 w-4" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm truncate">{supplier.name}</p>
                                {supplier.phone && <span className="text-xs text-gray-500">{supplier.phone}</span>}
                              </div>
                              {selectedSuppliers.includes(supplier.id) && <Check className="h-4 w-4 text-purple-600" />}
                            </button>
                          ))}
                        </div>
                      )}
                    </ScrollArea>
                  </CardContent>
                </Card>

                <Card className="border-gray-200 dark:border-gray-700 shadow-sm">
                  <CardHeader className="pb-3 border-b border-gray-200 dark:border-gray-700">
                    <CardTitle className="flex items-center justify-between text-base">
                      <span className="flex items-center gap-2">
                        <Building2 className="h-5 w-5 text-purple-600" />
                        Selecionados
                      </span>
                      <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                        {selectedSuppliers.length}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <ScrollArea className="h-[200px]">
                      {selectedSuppliersData.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                          <Building2 className="h-10 w-10 mb-2 opacity-50" />
                          <p className="text-sm">Nenhum fornecedor selecionado</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {selectedSuppliersData.map((supplier) => (
                            <div key={supplier.id} className="flex items-center gap-2 p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                              <Building2 className="h-4 w-4 text-purple-600" />
                              <span className="flex-1 text-sm font-medium truncate">{supplier.name}</span>
                              <Button variant="ghost" size="sm" onClick={() => toggleSupplier(supplier.id)}
                                className="h-6 w-6 p-0 text-gray-400 hover:text-red-500">
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* Step: Período */}
          {activeStep === "periodo" && (
            <div className="h-full p-4 sm:p-6">
              <Card className="border-purple-100 dark:border-gray-700 bg-white dark:bg-gray-800/50 shadow-sm max-w-xl mx-auto">
                <CardHeader className="pb-3 border-b border-purple-100/60 dark:border-gray-700">
                  <CardTitle className="flex items-center gap-2 text-purple-900 dark:text-white text-base">
                    <Clock className="h-5 w-5 text-purple-600 flex-shrink-0" />
                    <span>Período da Cotação</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Data de Início</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full justify-start text-left font-normal h-10">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {format(dataInicio, "dd/MM/yyyy", { locale: ptBR })}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar mode="single" selected={dataInicio}
                            onSelect={(date) => date && setDataInicio(date)} locale={ptBR} />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Data de Fim</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline"
                            className={cn("w-full justify-start text-left font-normal h-10",
                              dataFim <= dataInicio && "border-red-300 text-red-600")}>
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {format(dataFim, "dd/MM/yyyy", { locale: ptBR })}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar mode="single" selected={dataFim}
                            onSelect={(date) => date && setDataFim(date)} locale={ptBR}
                            disabled={(date) => date <= dataInicio} />
                        </PopoverContent>
                      </Popover>
                      {dataFim <= dataInicio && (
                        <p className="text-xs text-red-500">Data de fim deve ser posterior à data de início</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Observações (opcional)</Label>
                    <Textarea placeholder="Observações sobre a cotação..." value={observacoes}
                      onChange={(e) => setObservacoes(e.target.value)} rows={4} className="resize-none" />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Step: Confirmar */}
          {activeStep === "confirmar" && (
            <div className="h-full p-4 sm:p-6 overflow-auto">
              <div className="max-w-2xl mx-auto space-y-4">
                {/* Período */}
                <Card className="border-gray-200 dark:border-gray-700">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <CalendarIcon className="h-4 w-4 text-purple-600" />
                      <span className="font-medium text-sm">Período</span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {format(dataInicio, "dd/MM/yyyy", { locale: ptBR })} até {format(dataFim, "dd/MM/yyyy", { locale: ptBR })}
                    </p>
                  </CardContent>
                </Card>

                {/* Embalagens */}
                <Card className="border-gray-200 dark:border-gray-700">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Package className="h-4 w-4 text-purple-600" />
                      <span className="font-medium text-sm">Embalagens ({selectedItemsData.length})</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {selectedItemsData.map(item => (
                        <Badge key={item.id} variant="secondary" className="text-xs">{item.name}</Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Fornecedores */}
                <Card className="border-gray-200 dark:border-gray-700">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Building2 className="h-4 w-4 text-purple-600" />
                      <span className="font-medium text-sm">Fornecedores ({selectedSuppliersData.length})</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {selectedSuppliersData.map(supplier => (
                        <Badge key={supplier.id} variant="outline" className="text-xs">{supplier.name}</Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Observações */}
                {observacoes && (
                  <Card className="border-gray-200 dark:border-gray-700">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="h-4 w-4 text-purple-600" />
                        <span className="font-medium text-sm">Observações</span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{observacoes}</p>
                    </CardContent>
                  </Card>
                )}

                {/* Dica */}
                <div className="text-center text-xs text-gray-400 pt-2">
                  <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">Ctrl+Enter</kbd> para criar
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
