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
import { usePackagingQuotes } from "@/hooks/usePackagingQuotes";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  CalendarIcon, Package, Building2, Plus, Loader2, 
  ChevronRight, Check, FileText, Search, X
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
  { id: 0, title: "Embalagens", icon: Package, description: "Selecione os itens para cotar" },
  { id: 1, title: "Fornecedores", icon: Building2, description: "Escolha os participantes" },
  { id: 2, title: "Período", icon: CalendarIcon, description: "Defina as datas" },
  { id: 3, title: "Confirmar", icon: FileText, description: "Revise e crie a cotação" },
];

export function AddPackagingQuoteDialog({ open, onOpenChange, packagingItems, suppliers }: Props) {
  const { addQuote } = usePackagingQuotes();
  const [step, setStep] = useState(0);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [selectedSuppliers, setSelectedSuppliers] = useState<string[]>([]);
  const [searchItem, setSearchItem] = useState("");
  const [searchSupplier, setSearchSupplier] = useState("");
  const [dataInicio, setDataInicio] = useState<Date>(new Date());
  const [dataFim, setDataFim] = useState<Date>(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
  const [observacoes, setObservacoes] = useState("");

  const itemSearchRef = useRef<HTMLInputElement>(null);
  const supplierSearchRef = useRef<HTMLInputElement>(null);

  // Auto-focus on search when step changes
  useEffect(() => {
    if (open) {
      setTimeout(() => {
        if (step === 0) itemSearchRef.current?.focus();
        else if (step === 1) supplierSearchRef.current?.focus();
      }, 100);
    }
  }, [step, open]);

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

  const canProceed = () => {
    switch (step) {
      case 0: return selectedItems.length > 0;
      case 1: return selectedSuppliers.length > 0;
      case 2: return dataInicio && dataFim && dataFim > dataInicio;
      default: return true;
    }
  };

  const handleNext = () => {
    if (step < 3 && canProceed()) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  const handleSubmit = async () => {
    const itens = selectedItems.map(id => {
      const item = packagingItems.find(p => p.id === id);
      return {
        packagingId: id,
        packagingName: item?.name || '',
      };
    });

    const fornecedoresNomes: { [id: string]: string } = {};
    selectedSuppliers.forEach(id => {
      const supplier = suppliers.find(s => s.id === id);
      if (supplier) fornecedoresNomes[id] = supplier.name;
    });

    await addQuote.mutateAsync({
      dataInicio,
      dataFim,
      observacoes,
      itens,
      fornecedoresIds: selectedSuppliers,
      fornecedoresNomes,
    });

    handleReset();
    onOpenChange(false);
  };

  const handleReset = () => {
    setStep(0);
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

  // Keyboard shortcuts
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.altKey && e.key === 'ArrowRight' && canProceed() && step < 3) {
      e.preventDefault();
      setStep(step + 1);
    }
    if (e.altKey && e.key === 'ArrowLeft' && step > 0) {
      e.preventDefault();
      setStep(step - 1);
    }
    if (e.ctrlKey && e.key === 'Enter' && step === 3) {
      e.preventDefault();
      handleSubmit();
    }
  }, [step]);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent 
        className="w-[95vw] max-w-[700px] h-[85vh] max-h-[650px] overflow-hidden p-0 gap-0 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-2xl rounded-xl"
        onKeyDown={handleKeyDown}
      >
        {/* Header */}
        <div className="flex-shrink-0 px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <Package className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <DialogTitle className="text-base font-semibold text-gray-900 dark:text-white">
                  Nova Cotação de Embalagens
                </DialogTitle>
                <DialogDescription className="text-xs text-gray-500 dark:text-gray-400">
                  {STEPS[step].description}
                </DialogDescription>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => handleOpenChange(false)} 
              className="h-8 w-8 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Steps indicator */}
          <div className="flex items-center gap-1">
            {STEPS.map((s, index) => (
              <div key={s.id} className="flex items-center flex-1">
                <button
                  onClick={() => index < step && setStep(index)}
                  disabled={index > step}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all w-full",
                    index < step 
                      ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 cursor-pointer hover:bg-green-200" 
                      : index === step 
                        ? "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400" 
                        : "bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed"
                  )}
                >
                  {index < step ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : (
                    <s.icon className="h-3.5 w-3.5" />
                  )}
                  <span className="hidden sm:inline">{s.title}</span>
                  <span className="sm:hidden">{index + 1}</span>
                </button>
                {index < STEPS.length - 1 && (
                  <ChevronRight className={cn(
                    "h-4 w-4 mx-1 flex-shrink-0",
                    index < step ? "text-green-400" : "text-gray-300 dark:text-gray-600"
                  )} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {/* Step 0: Embalagens */}
          {step === 0 && (
            <div className="h-full flex flex-col p-4">
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  ref={itemSearchRef}
                  placeholder="Buscar embalagem..."
                  value={searchItem}
                  onChange={(e) => setSearchItem(e.target.value)}
                  className="pl-9 h-10 bg-white dark:bg-gray-900"
                />
              </div>

              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Embalagens Disponíveis
                </span>
                {selectedItems.length > 0 && (
                  <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-700">
                    {selectedItems.length} selecionada(s)
                  </Badge>
                )}
              </div>

              <ScrollArea className="flex-1 border border-gray-200 dark:border-gray-700 rounded-lg">
                {filteredItems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                    <Package className="h-12 w-12 mb-3 opacity-50" />
                    <p className="text-sm">Nenhuma embalagem encontrada</p>
                  </div>
                ) : (
                  <div className="p-2 space-y-1">
                    {filteredItems.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => toggleItem(item.id)}
                        className={cn(
                          "w-full p-3 rounded-lg text-left transition-all flex items-center gap-3",
                          selectedItems.includes(item.id)
                            ? "bg-purple-100 dark:bg-purple-900/30 border-2 border-purple-500"
                            : "bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 hover:border-purple-200"
                        )}
                      >
                        <Checkbox 
                          checked={selectedItems.includes(item.id)} 
                          className="data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{item.name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            {item.category && (
                              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                                {item.category}
                              </Badge>
                            )}
                            <span className="text-xs text-gray-500">{item.reference_unit}</span>
                          </div>
                        </div>
                        {selectedItems.includes(item.id) && (
                          <Check className="h-4 w-4 text-purple-600" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>
          )}

          {/* Step 1: Fornecedores */}
          {step === 1 && (
            <div className="h-full flex flex-col p-4">
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  ref={supplierSearchRef}
                  placeholder="Buscar fornecedor..."
                  value={searchSupplier}
                  onChange={(e) => setSearchSupplier(e.target.value)}
                  className="pl-9 h-10 bg-white dark:bg-gray-900"
                />
              </div>

              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Fornecedores Disponíveis
                </span>
                {selectedSuppliers.length > 0 && (
                  <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-700">
                    {selectedSuppliers.length} selecionado(s)
                  </Badge>
                )}
              </div>

              <ScrollArea className="flex-1 border border-gray-200 dark:border-gray-700 rounded-lg">
                {filteredSuppliers.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                    <Building2 className="h-12 w-12 mb-3 opacity-50" />
                    <p className="text-sm">Nenhum fornecedor encontrado</p>
                  </div>
                ) : (
                  <div className="p-2 space-y-1">
                    {filteredSuppliers.map((supplier) => (
                      <button
                        key={supplier.id}
                        onClick={() => toggleSupplier(supplier.id)}
                        className={cn(
                          "w-full p-3 rounded-lg text-left transition-all flex items-center gap-3",
                          selectedSuppliers.includes(supplier.id)
                            ? "bg-purple-100 dark:bg-purple-900/30 border-2 border-purple-500"
                            : "bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 hover:border-purple-200"
                        )}
                      >
                        <div className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center",
                          selectedSuppliers.includes(supplier.id) 
                            ? "bg-purple-500 text-white" 
                            : "bg-gray-100 dark:bg-gray-700"
                        )}>
                          <Building2 className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{supplier.name}</p>
                          {supplier.phone && (
                            <p className="text-xs text-gray-500">{supplier.phone}</p>
                          )}
                        </div>
                        {selectedSuppliers.includes(supplier.id) && (
                          <Check className="h-5 w-5 text-purple-500" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>
          )}

          {/* Step 2: Período */}
          {step === 2 && (
            <div className="h-full flex flex-col p-4">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Data de Início</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal h-10"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {format(dataInicio, "dd/MM/yyyy", { locale: ptBR })}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={dataInicio}
                          onSelect={(date) => date && setDataInicio(date)}
                          locale={ptBR}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Data de Fim</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal h-10",
                            dataFim <= dataInicio && "border-red-300 text-red-600"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {format(dataFim, "dd/MM/yyyy", { locale: ptBR })}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={dataFim}
                          onSelect={(date) => date && setDataFim(date)}
                          locale={ptBR}
                          disabled={(date) => date <= dataInicio}
                        />
                      </PopoverContent>
                    </Popover>
                    {dataFim <= dataInicio && (
                      <p className="text-xs text-red-500">Data de fim deve ser posterior à data de início</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Observações (opcional)</Label>
                  <Textarea
                    placeholder="Observações sobre a cotação..."
                    value={observacoes}
                    onChange={(e) => setObservacoes(e.target.value)}
                    rows={4}
                    className="resize-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Resumo */}
          {step === 3 && (
            <div className="h-full flex flex-col p-4">
              <ScrollArea className="flex-1">
                <div className="space-y-4">
                  {/* Período */}
                  <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-2 mb-2">
                      <CalendarIcon className="h-4 w-4 text-purple-600" />
                      <span className="font-medium text-sm">Período</span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {format(dataInicio, "dd/MM/yyyy", { locale: ptBR })} até {format(dataFim, "dd/MM/yyyy", { locale: ptBR })}
                    </p>
                  </div>

                  {/* Embalagens */}
                  <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-2 mb-3">
                      <Package className="h-4 w-4 text-purple-600" />
                      <span className="font-medium text-sm">Embalagens ({selectedItemsData.length})</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {selectedItemsData.map(item => (
                        <Badge key={item.id} variant="secondary" className="text-xs">
                          {item.name}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Fornecedores */}
                  <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-2 mb-3">
                      <Building2 className="h-4 w-4 text-purple-600" />
                      <span className="font-medium text-sm">Fornecedores ({selectedSuppliersData.length})</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {selectedSuppliersData.map(supplier => (
                        <Badge key={supplier.id} variant="outline" className="text-xs">
                          {supplier.name}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Observações */}
                  {observacoes && (
                    <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="h-4 w-4 text-purple-600" />
                        <span className="font-medium text-sm">Observações</span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{observacoes}</p>
                    </div>
                  )}

                  {/* Dica de atalho */}
                  <div className="text-center text-xs text-gray-400 pt-2">
                    <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">Ctrl+Enter</kbd> para criar
                  </div>
                </div>
              </ScrollArea>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <Button
            type="button"
            variant="ghost"
            onClick={step === 0 ? () => handleOpenChange(false) : handleBack}
            className="text-gray-600 dark:text-gray-400"
          >
            {step === 0 ? "Cancelar" : "Voltar"}
          </Button>

          <div className="text-xs text-gray-400">
            <kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-[10px]">Alt+→</kbd> Próximo
          </div>

          {step < 3 ? (
            <Button
              onClick={handleNext}
              disabled={!canProceed()}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              Próximo
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={addQuote.isPending}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              {addQuote.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              Criar Cotação
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
