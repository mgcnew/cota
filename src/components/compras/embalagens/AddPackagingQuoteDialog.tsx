import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
  ChevronRight, ChevronLeft, Check, FileText, Search
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
  { id: 1, title: "Embalagens", icon: Package },
  { id: 2, title: "Fornecedores", icon: Building2 },
  { id: 3, title: "Período", icon: CalendarIcon },
  { id: 4, title: "Resumo", icon: FileText },
];

export function AddPackagingQuoteDialog({ open, onOpenChange, packagingItems, suppliers }: Props) {
  const { addQuote } = usePackagingQuotes();
  const [step, setStep] = useState(1);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [selectedSuppliers, setSelectedSuppliers] = useState<string[]>([]);
  const [searchItem, setSearchItem] = useState("");
  const [searchSupplier, setSearchSupplier] = useState("");
  const [dataInicio, setDataInicio] = useState<Date>(new Date());
  const [dataFim, setDataFim] = useState<Date>(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
  const [observacoes, setObservacoes] = useState("");

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
      case 1: return selectedItems.length > 0;
      case 2: return selectedSuppliers.length > 0;
      case 3: return dataInicio && dataFim && dataFim > dataInicio;
      default: return true;
    }
  };

  const handleNext = () => {
    if (step < 4 && canProceed()) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
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

    // Reset
    handleReset();
    onOpenChange(false);
  };

  const handleReset = () => {
    setStep(1);
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

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-hidden flex flex-col p-0">
        {/* Header com Steps */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b bg-gradient-to-r from-purple-50 to-violet-50 dark:from-gray-800 dark:to-gray-800">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Package className="h-5 w-5 text-purple-600" />
            Nova Cotação de Embalagens
          </DialogTitle>
          
          {/* Step Indicator */}
          <div className="flex items-center justify-between mt-4">
            {STEPS.map((s, index) => {
              const Icon = s.icon;
              const isActive = step === s.id;
              const isCompleted = step > s.id;
              
              return (
                <div key={s.id} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div className={cn(
                      "w-9 h-9 rounded-full flex items-center justify-center transition-all",
                      isActive && "bg-purple-600 text-white shadow-lg shadow-purple-200",
                      isCompleted && "bg-purple-100 text-purple-600 dark:bg-purple-900/50",
                      !isActive && !isCompleted && "bg-gray-100 text-gray-400 dark:bg-gray-700"
                    )}>
                      {isCompleted ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                    </div>
                    <span className={cn(
                      "text-[10px] mt-1 font-medium",
                      isActive && "text-purple-600",
                      !isActive && "text-gray-400"
                    )}>
                      {s.title}
                    </span>
                  </div>
                  {index < STEPS.length - 1 && (
                    <div className={cn(
                      "w-8 h-0.5 mx-1 mt-[-12px]",
                      step > s.id ? "bg-purple-300" : "bg-gray-200 dark:bg-gray-700"
                    )} />
                  )}
                </div>
              );
            })}
          </div>
        </DialogHeader>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Step 1: Embalagens */}
          {step === 1 && (
            <div className="flex-1 flex flex-col p-6 overflow-hidden">
              <div className="mb-4">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                  Selecione as embalagens
                </h3>
                <p className="text-sm text-muted-foreground">
                  Escolha os itens que deseja cotar
                </p>
              </div>

              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar embalagem..."
                  value={searchItem}
                  onChange={(e) => setSearchItem(e.target.value)}
                  className="pl-9"
                />
              </div>

              <ScrollArea className="flex-1 border rounded-lg">
                {filteredItems.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    <Package className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Nenhuma embalagem encontrada</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {filteredItems.map((item) => (
                      <div
                        key={item.id}
                        className={cn(
                          "flex items-center gap-3 p-3 cursor-pointer transition-colors",
                          selectedItems.includes(item.id) 
                            ? "bg-purple-50 dark:bg-purple-900/20" 
                            : "hover:bg-muted/50"
                        )}
                        onClick={() => toggleItem(item.id)}
                      >
                        <Checkbox 
                          checked={selectedItems.includes(item.id)} 
                          className="data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{item.name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            {item.category && (
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                {item.category}
                              </Badge>
                            )}
                            <span className="text-xs text-muted-foreground">
                              {item.reference_unit}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>

              {selectedItems.length > 0 && (
                <div className="mt-3 p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <p className="text-sm text-purple-700 dark:text-purple-300">
                    <strong>{selectedItems.length}</strong> embalagem(ns) selecionada(s)
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Fornecedores */}
          {step === 2 && (
            <div className="flex-1 flex flex-col p-6 overflow-hidden">
              <div className="mb-4">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                  Selecione os fornecedores
                </h3>
                <p className="text-sm text-muted-foreground">
                  Escolha quem vai participar da cotação
                </p>
              </div>

              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar fornecedor..."
                  value={searchSupplier}
                  onChange={(e) => setSearchSupplier(e.target.value)}
                  className="pl-9"
                />
              </div>

              <ScrollArea className="flex-1 border rounded-lg">
                {filteredSuppliers.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    <Building2 className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Nenhum fornecedor encontrado</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {filteredSuppliers.map((supplier) => (
                      <div
                        key={supplier.id}
                        className={cn(
                          "flex items-center gap-3 p-3 cursor-pointer transition-colors",
                          selectedSuppliers.includes(supplier.id) 
                            ? "bg-purple-50 dark:bg-purple-900/20" 
                            : "hover:bg-muted/50"
                        )}
                        onClick={() => toggleSupplier(supplier.id)}
                      >
                        <Checkbox 
                          checked={selectedSuppliers.includes(supplier.id)} 
                          className="data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{supplier.name}</p>
                          {supplier.phone && (
                            <p className="text-xs text-muted-foreground">{supplier.phone}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>

              {selectedSuppliers.length > 0 && (
                <div className="mt-3 p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <p className="text-sm text-purple-700 dark:text-purple-300">
                    <strong>{selectedSuppliers.length}</strong> fornecedor(es) selecionado(s)
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Período */}
          {step === 3 && (
            <div className="flex-1 flex flex-col p-6">
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                  Defina o período
                </h3>
                <p className="text-sm text-muted-foreground">
                  Período de vigência da cotação
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Data de Início</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
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
                  <Label>Data de Fim</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
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

                <div className="space-y-2">
                  <Label>Observações (opcional)</Label>
                  <Textarea
                    placeholder="Observações sobre a cotação..."
                    value={observacoes}
                    onChange={(e) => setObservacoes(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Resumo */}
          {step === 4 && (
            <div className="flex-1 flex flex-col p-6 overflow-hidden">
              <div className="mb-4">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                  Confirme os dados
                </h3>
                <p className="text-sm text-muted-foreground">
                  Revise antes de criar a cotação
                </p>
              </div>

              <ScrollArea className="flex-1">
                <div className="space-y-4">
                  {/* Período */}
                  <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <CalendarIcon className="h-4 w-4 text-purple-600" />
                      <span className="font-medium text-sm">Período</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {format(dataInicio, "dd/MM/yyyy", { locale: ptBR })} até {format(dataFim, "dd/MM/yyyy", { locale: ptBR })}
                    </p>
                  </div>

                  {/* Embalagens */}
                  <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Package className="h-4 w-4 text-purple-600" />
                      <span className="font-medium text-sm">Embalagens ({selectedItemsData.length})</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedItemsData.map(item => (
                        <Badge key={item.id} variant="secondary" className="text-xs">
                          {item.name}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Fornecedores */}
                  <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Building2 className="h-4 w-4 text-purple-600" />
                      <span className="font-medium text-sm">Fornecedores ({selectedSuppliersData.length})</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedSuppliersData.map(supplier => (
                        <Badge key={supplier.id} variant="outline" className="text-xs">
                          {supplier.name}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Observações */}
                  {observacoes && (
                    <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="h-4 w-4 text-purple-600" />
                        <span className="font-medium text-sm">Observações</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{observacoes}</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t bg-gray-50 dark:bg-gray-800/50">
          <Button
            type="button"
            variant="ghost"
            onClick={step === 1 ? () => handleOpenChange(false) : handleBack}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            {step === 1 ? "Cancelar" : "Voltar"}
          </Button>

          {step < 4 ? (
            <Button
              onClick={handleNext}
              disabled={!canProceed()}
              className="bg-purple-600 hover:bg-purple-700"
            >
              Próximo
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={addQuote.isPending}
              className="bg-purple-600 hover:bg-purple-700"
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
