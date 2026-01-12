import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
import { usePackagingQuotes } from "@/hooks/usePackagingQuotes";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, Package, Building2, Plus, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PackagingItem } from "@/types/packaging";
import type { Supplier } from "@/hooks/useSuppliers";

const schema = z.object({
  dataInicio: z.date({ required_error: "Data de início é obrigatória" }),
  dataFim: z.date({ required_error: "Data de fim é obrigatória" }),
  observacoes: z.string().optional(),
}).refine((data) => data.dataFim > data.dataInicio, {
  message: "Data de fim deve ser posterior à data de início",
  path: ["dataFim"],
});

type FormData = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  packagingItems: PackagingItem[];
  suppliers: Supplier[];
}

export function AddPackagingQuoteDialog({ open, onOpenChange, packagingItems, suppliers }: Props) {
  const { addQuote } = usePackagingQuotes();
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [selectedSuppliers, setSelectedSuppliers] = useState<string[]>([]);
  const [searchItem, setSearchItem] = useState("");
  const [searchSupplier, setSearchSupplier] = useState("");

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      dataInicio: new Date(),
      dataFim: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // +7 dias
      observacoes: "",
    },
  });

  const filteredItems = packagingItems.filter(item =>
    item.name.toLowerCase().includes(searchItem.toLowerCase())
  );

  const filteredSuppliers = suppliers.filter(s =>
    s.name.toLowerCase().includes(searchSupplier.toLowerCase())
  );

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

  const onSubmit = async (data: FormData) => {
    if (selectedItems.length === 0) {
      return;
    }

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
      dataInicio: data.dataInicio,
      dataFim: data.dataFim,
      observacoes: data.observacoes,
      itens,
      fornecedoresIds: selectedSuppliers,
      fornecedoresNomes,
    });

    // Reset
    setSelectedItems([]);
    setSelectedSuppliers([]);
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-purple-600" />
            Nova Cotação de Embalagens
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 overflow-hidden flex flex-col">
          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-6 pb-4">
              {/* Datas */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Data de Início</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !form.watch("dataInicio") && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {form.watch("dataInicio") ? (
                          format(form.watch("dataInicio"), "dd/MM/yyyy", { locale: ptBR })
                        ) : (
                          "Selecione"
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={form.watch("dataInicio")}
                        onSelect={(date) => date && form.setValue("dataInicio", date)}
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
                          !form.watch("dataFim") && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {form.watch("dataFim") ? (
                          format(form.watch("dataFim"), "dd/MM/yyyy", { locale: ptBR })
                        ) : (
                          "Selecione"
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={form.watch("dataFim")}
                        onSelect={(date) => date && form.setValue("dataFim", date)}
                        locale={ptBR}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Embalagens */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Embalagens ({selectedItems.length} selecionadas)
                </Label>
                <Input
                  placeholder="Buscar embalagem..."
                  value={searchItem}
                  onChange={(e) => setSearchItem(e.target.value)}
                />
                <div className="border rounded-lg max-h-40 overflow-y-auto">
                  {filteredItems.length === 0 ? (
                    <p className="text-sm text-muted-foreground p-3 text-center">
                      Nenhuma embalagem cadastrada
                    </p>
                  ) : (
                    filteredItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-3 p-2 hover:bg-muted/50 cursor-pointer"
                        onClick={() => toggleItem(item.id)}
                      >
                        <Checkbox checked={selectedItems.includes(item.id)} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{item.name}</p>
                          {item.category && (
                            <p className="text-xs text-muted-foreground">{item.category}</p>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Fornecedores */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Fornecedores ({selectedSuppliers.length} selecionados)
                </Label>
                <Input
                  placeholder="Buscar fornecedor..."
                  value={searchSupplier}
                  onChange={(e) => setSearchSupplier(e.target.value)}
                />
                <div className="border rounded-lg max-h-40 overflow-y-auto">
                  {filteredSuppliers.length === 0 ? (
                    <p className="text-sm text-muted-foreground p-3 text-center">
                      Nenhum fornecedor cadastrado
                    </p>
                  ) : (
                    filteredSuppliers.map((supplier) => (
                      <div
                        key={supplier.id}
                        className="flex items-center gap-3 p-2 hover:bg-muted/50 cursor-pointer"
                        onClick={() => toggleSupplier(supplier.id)}
                      >
                        <Checkbox checked={selectedSuppliers.includes(supplier.id)} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{supplier.name}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Observações */}
              <div className="space-y-2">
                <Label>Observações</Label>
                <Textarea
                  placeholder="Observações sobre a cotação..."
                  {...form.register("observacoes")}
                />
              </div>
            </div>
          </ScrollArea>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={selectedItems.length === 0 || addQuote.isPending}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {addQuote.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              Criar Cotação
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
