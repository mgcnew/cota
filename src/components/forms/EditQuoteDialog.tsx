import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Calendar as CalendarIcon, Edit, Plus, Trash2, Check, ChevronsUpDown, FileText } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { format, parse } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

const productLineSchema = z.object({
  produtoId: z.string().min(1, "Produto é obrigatório"),
  produtoNome: z.string().min(1, "Produto é obrigatório"),
  quantidade: z.string().min(1, "Quantidade é obrigatória"),
  unidade: z.string().min(1, "Unidade é obrigatória"),
});

const quoteSchema = z.object({
  produtos: z.array(productLineSchema).min(1, "Adicione pelo menos um produto"),
  dataInicio: z.date({ required_error: "Data de início é obrigatória" }),
  dataFim: z.date({ required_error: "Data de fim é obrigatória" }),
  dataPlanejada: z.date().optional(),
  fornecedoresIds: z.array(z.string()).optional(),
  observacoes: z.string().optional(),
  status: z.string().min(1, "Status é obrigatório"),
}).refine((data) => data.dataFim > data.dataInicio, {
  message: "Data de fim deve ser posterior à data de início",
  path: ["dataFim"],
});

type QuoteFormData = z.infer<typeof quoteSchema>;

interface Quote {
  id: string;
  produto: string;
  quantidade: string;
  status: string;
  dataInicio: string;
  dataFim: string;
  _raw?: any; // Raw database data
}

interface EditQuoteDialogProps {
  quote: Quote;
  onEdit: (quoteId: string, data: QuoteFormData) => void;
  trigger?: React.ReactNode;
}

export default function EditQuoteDialog({ 
  quote,
  onEdit, 
  trigger,
}: EditQuoteDialogProps) {
  const [open, setOpen] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSuppliers, setSelectedSuppliers] = useState<any[]>([]);
  const [supplierSearch, setSupplierSearch] = useState("");

  const form = useForm<QuoteFormData>({
    resolver: zodResolver(quoteSchema),
    defaultValues: {
      produtos: [{ produtoId: "", produtoNome: "", quantidade: "", unidade: "kg" }],
      dataInicio: new Date(),
      dataFim: new Date(),
      dataPlanejada: undefined,
      fornecedoresIds: [],
      observacoes: "",
      status: "ativa",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "produtos",
  });

  useEffect(() => {
    if (open) {
      loadData();
    }
  }, [open]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load products and suppliers
      const [productsRes, suppliersRes] = await Promise.all([
        supabase.from("products").select("id, name").order("name"),
        supabase.from("suppliers").select("id, name").order("name"),
      ]);

      if (productsRes.data) setProducts(productsRes.data);
      if (suppliersRes.data) setSuppliers(suppliersRes.data);

      // Load quote details
      const { data: quoteData } = await supabase
        .from("quotes")
        .select(`
          *,
          quote_items(*),
          quote_suppliers(*)
        `)
        .eq("id", quote.id)
        .single();

      if (quoteData) {
        console.log("Quote data loaded:", quoteData);
        console.log("Quote items:", quoteData.quote_items);
        
        // Set products - ensure we always have at least the data
        let produtosData = [];
        if (quoteData.quote_items && quoteData.quote_items.length > 0) {
          produtosData = quoteData.quote_items.map((item: any) => ({
            produtoId: item.product_id || "",
            produtoNome: item.product_name || "",
            quantidade: String(item.quantidade || ""),
            unidade: item.unidade || "kg",
          }));
        } else {
          // Fallback: try to create from quote data itself
          produtosData = [{
            produtoId: "",
            produtoNome: "",
            quantidade: "",
            unidade: "kg",
          }];
        }

        console.log("Produtos data prepared:", produtosData);
        console.log("First product example:", produtosData[0]);

        // Set suppliers
        const suppliersData = (quoteData.quote_suppliers || []).map((s: any) => ({
          id: s.supplier_id,
          name: s.supplier_name,
        }));
        setSelectedSuppliers(suppliersData);

        const formData = {
          produtos: produtosData,
          dataInicio: new Date(quoteData.data_inicio),
          dataFim: new Date(quoteData.data_fim),
          dataPlanejada: quoteData.data_planejada ? new Date(quoteData.data_planejada) : undefined,
          fornecedoresIds: suppliersData.map((s: any) => s.id),
          observacoes: quoteData.observacoes || "",
          status: quoteData.status,
        };
        
        console.log("Form data to reset:", formData);
        console.log("Current form values before reset:", form.getValues());
        form.reset(formData);
        console.log("Current form values after reset:", form.getValues());
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados da cotação",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = (data: QuoteFormData) => {
    onEdit(quote.id, data);
    setOpen(false);
  };

  const handleSupplierSelect = (supplier: any) => {
    if (!selectedSuppliers.find(s => s.id === supplier.id)) {
      const newSuppliers = [...selectedSuppliers, supplier];
      setSelectedSuppliers(newSuppliers);
      form.setValue("fornecedoresIds", newSuppliers.map(s => s.id));
    }
    setSupplierSearch("");
  };

  const handleSupplierRemove = (supplierId: string) => {
    const newSuppliers = selectedSuppliers.filter(s => s.id !== supplierId);
    setSelectedSuppliers(newSuppliers);
    form.setValue("fornecedoresIds", newSuppliers.map(s => s.id));
  };

  const filteredSuppliers = suppliers.filter(supplier =>
    !selectedSuppliers.find(s => s.id === supplier.id) &&
    supplier.name.toLowerCase().includes(supplierSearch.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="sm">
            <Edit className="h-4 w-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="w-[96vw] sm:w-[92vw] md:w-[90vw] max-w-3xl max-h-[90vh] sm:max-h-[85vh] border-0 dark:border dark:border-gray-700 shadow-2xl rounded-lg sm:rounded-xl overflow-hidden flex flex-col bg-white dark:bg-gray-900">
        <DialogHeader className="flex-shrink-0 px-3 sm:px-4 py-2.5 border-b border-gray-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-800">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-teal-600 dark:bg-teal-500 flex items-center justify-center flex-shrink-0">
              <FileText className="h-4 w-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate">
                Editar Cotação
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-600 dark:text-gray-400 truncate">
                Atualize as informações
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto px-3 sm:px-4 py-3 sm:py-4 bg-white dark:bg-gray-900 min-h-0" style={{scrollbarWidth: 'none', msOverflowStyle: 'none'}}>
        <style>{`
          div.overflow-y-auto::-webkit-scrollbar {
            display: none;
          }
        `}</style>

        {loading ? (
          <div className="py-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 dark:border-teal-400"></div>
            <p className="mt-2 text-sm text-slate-600 dark:text-gray-400">Carregando...</p>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Produtos */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <FormLabel className="text-sm font-semibold text-slate-900 dark:text-white">Produtos*</FormLabel>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => append({ produtoId: "", produtoNome: "", quantidade: "", unidade: "kg" })}
                    className="h-8 text-xs dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Adicionar
                  </Button>
                </div>

                {fields.map((field, index) => (
                  <div key={field.id} className="border border-slate-200 dark:border-gray-700 rounded-lg p-3 space-y-2.5 bg-slate-50 dark:bg-gray-800/50">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-700 dark:text-gray-300">Produto {index + 1}</span>
                      {fields.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => remove(index)}
                          className="h-7 w-7 p-0 dark:hover:bg-gray-700"
                        >
                          <Trash2 className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />
                        </Button>
                      )}
                    </div>

                    <FormField
                      control={form.control}
                      name={`produtos.${index}.produtoId`}
                      render={({ field: formField }) => {
                        const produtoNome = form.watch(`produtos.${index}.produtoNome`);
                        const displayName = produtoNome || (formField.value ? products.find((p) => p.id === formField.value)?.name : null);
                        
                        return (
                        <FormItem className="flex flex-col">
                          <FormLabel className="text-xs text-slate-700 dark:text-gray-300">Produto*</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  role="combobox"
                                  className={cn(
                                    "justify-between h-9 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-white",
                                    !displayName && "text-muted-foreground dark:text-gray-500"
                                  )}
                                >
                                  {displayName || "Buscar produto..."}
                                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-[400px] p-0 dark:bg-gray-800 dark:border-gray-700" align="start">
                              <Command>
                                <CommandInput placeholder="Digite para buscar..." />
                                <CommandList className="max-h-[200px]">
                                  <CommandEmpty>Nenhum produto encontrado.</CommandEmpty>
                                  <CommandGroup>
                                    {products.map((product) => (
                                      <CommandItem
                                        key={product.id}
                                        value={product.name}
                                        onSelect={() => {
                                          form.setValue(`produtos.${index}.produtoId`, product.id);
                                          form.setValue(`produtos.${index}.produtoNome`, product.name);
                                        }}
                                      >
                                        <Check
                                          className={cn(
                                            "mr-2 h-4 w-4",
                                            product.id === formField.value ? "opacity-100" : "opacity-0"
                                          )}
                                        />
                                        {product.name}
                                      </CommandItem>
                                    ))}
                                  </CommandGroup>
                                </CommandList>
                              </Command>
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                        );
                      }}
                    />

                    <div className="grid grid-cols-2 gap-2.5">
                      <FormField
                        control={form.control}
                        name={`produtos.${index}.quantidade`}
                        render={({ field: formField }) => (
                          <FormItem>
                            <FormLabel className="text-xs text-slate-700 dark:text-gray-300">Quantidade*</FormLabel>
                            <FormControl>
                              <Input placeholder="Ex: 500" type="number" {...formField} className="h-9 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-white" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`produtos.${index}.unidade`}
                        render={({ field: formField }) => (
                          <FormItem>
                            <FormLabel className="text-xs text-slate-700 dark:text-gray-300">Unidade*</FormLabel>
                            <Select onValueChange={formField.onChange} value={formField.value}>
                              <FormControl>
                                <SelectTrigger className="h-9 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-white">
                                  <SelectValue placeholder="Selecione" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                                <SelectItem value="kg">Kg</SelectItem>
                                <SelectItem value="un">Unidade</SelectItem>
                                <SelectItem value="cx">Caixa</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Datas */}
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="dataInicio"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel className="text-xs text-slate-700 dark:text-gray-300">Data de Início*</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "pl-3 text-left font-normal h-9 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-white",
                                !field.value && "text-muted-foreground dark:text-gray-500"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "dd/MM/yyyy", { locale: ptBR })
                              ) : (
                                <span>Selecione a data</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 dark:bg-gray-800 dark:border-gray-700" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date < new Date("1900-01-01")}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="dataFim"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel className="text-xs text-slate-700 dark:text-gray-300">Data de Fim*</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "pl-3 text-left font-normal h-9 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-white",
                                !field.value && "text-muted-foreground dark:text-gray-500"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "dd/MM/yyyy", { locale: ptBR })
                              ) : (
                                <span>Selecione a data</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 dark:bg-gray-800 dark:border-gray-700" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date < new Date(form.getValues("dataInicio"))}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Data Planejada */}
              <FormField
                control={form.control}
                name="dataPlanejada"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel className="text-xs text-slate-700 dark:text-gray-300">Data Planejada (Opcional)</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "pl-3 text-left font-normal h-9 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-white",
                              !field.value && "text-muted-foreground dark:text-gray-500"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "dd/MM/yyyy", { locale: ptBR })
                            ) : (
                              <span>Não agendada</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 dark:bg-gray-800 dark:border-gray-700" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date < new Date()}
                          initialFocus
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Status */}
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs text-slate-700 dark:text-gray-300">Status*</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-9 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-white">
                          <SelectValue placeholder="Selecione o status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                        <SelectItem value="ativa">Ativa</SelectItem>
                        <SelectItem value="planejada">Planejada</SelectItem>
                        <SelectItem value="pendente">Pendente</SelectItem>
                        <SelectItem value="concluida">Concluída</SelectItem>
                        <SelectItem value="expirada">Expirada</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Fornecedores */}
              <div className="space-y-2.5">
                <FormLabel className="text-xs text-slate-700 dark:text-gray-300">Fornecedores Participantes (Opcional)</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-between h-9 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-white">
                      Adicionar Fornecedor
                      <ChevronsUpDown className="ml-2 h-3.5 w-3.5 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0 dark:bg-gray-800 dark:border-gray-700" align="start">
                    <Command>
                      <CommandInput 
                        placeholder="Buscar fornecedor..." 
                        value={supplierSearch}
                        onValueChange={setSupplierSearch}
                      />
                      <CommandList className="max-h-[200px]">
                        <CommandEmpty>Nenhum fornecedor encontrado.</CommandEmpty>
                        <CommandGroup>
                          {filteredSuppliers.map((supplier) => (
                            <CommandItem
                              key={supplier.id}
                              value={supplier.name}
                              onSelect={() => handleSupplierSelect(supplier)}
                            >
                              {supplier.name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                
                {selectedSuppliers.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {selectedSuppliers.map((supplier) => (
                      <div
                        key={supplier.id}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 text-xs border border-teal-200 dark:border-teal-800"
                      >
                        {supplier.name}
                        <button
                          type="button"
                          onClick={() => handleSupplierRemove(supplier.id)}
                          className="ml-0.5 hover:text-red-600 dark:hover:text-red-400 font-bold"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Observações */}
              <FormField
                control={form.control}
                name="observacoes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs text-slate-700 dark:text-gray-300">Observações</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Adicione observações..." 
                        className="resize-none text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-white dark:placeholder:text-gray-500" 
                        rows={2}
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-2 pt-3">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setOpen(false)}
                  className="dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit"
                  className="bg-gradient-to-r from-teal-600 to-cyan-600 dark:from-teal-500 dark:to-cyan-500 hover:from-teal-700 hover:to-cyan-700 dark:hover:from-teal-600 dark:hover:to-cyan-600 text-white"
                >
                  Salvar Alterações
                </Button>
              </div>
            </form>
          </Form>
        )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
