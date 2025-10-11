import { useState, useEffect, useRef } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion, AnimatePresence } from "framer-motion";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar as CalendarIcon, 
  Plus, 
  X, 
  Check, 
  ChevronsUpDown, 
  Trash2, 
  Package, 
  Building2, 
  Clock, 
  FileText,
  ChevronRight,
  ChevronLeft
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
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
  fornecedoresIds: z.array(z.string()).min(1, "Selecione pelo menos um fornecedor"),
  observacoes: z.string().optional(),
}).refine((data) => data.dataFim > data.dataInicio, {
  message: "Data de fim deve ser posterior à data de início",
  path: ["dataFim"],
});

type QuoteFormData = z.infer<typeof quoteSchema>;

interface Product {
  id: string;
  name: string;
}

interface Supplier {
  id: string;
  name: string;
}

interface AddQuoteDialogProps {
  onAdd: (quote: QuoteFormData) => void;
  trigger?: React.ReactNode;
}

export default function AddQuoteDialog({ onAdd, trigger }: AddQuoteDialogProps) {
  const [open, setOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [supplierSearch, setSupplierSearch] = useState("");
  const [selectedSuppliers, setSelectedSuppliers] = useState<Supplier[]>([]);
  const [activeTab, setActiveTab] = useState("produtos");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const productsContainerRef = useRef<HTMLDivElement>(null);

  const form = useForm<QuoteFormData>({
    resolver: zodResolver(quoteSchema),
    defaultValues: {
      produtos: [{ produtoId: "", produtoNome: "", quantidade: "", unidade: "kg" }],
      dataInicio: new Date(),
      dataFim: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      fornecedoresIds: [],
      observacoes: "",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "produtos",
  });

  const handleAddProduct = () => {
    append({ produtoId: "", produtoNome: "", quantidade: "", unidade: "kg" });
  };

  useEffect(() => {
    if (open) {
      loadData();
    }
  }, [open]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [productsRes, suppliersRes] = await Promise.all([
        supabase.from("products").select("id, name").order("name"),
        supabase.from("suppliers").select("id, name").order("name"),
      ]);

      if (productsRes.data) setProducts(productsRes.data);
      if (suppliersRes.data) setSuppliers(suppliersRes.data);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar produtos e fornecedores",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: QuoteFormData) => {
    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Erro",
          description: "Você precisa estar logado para criar uma cotação",
          variant: "destructive",
        });
        return;
      }

      const { data: quote, error: quoteError } = await supabase
        .from("quotes")
        .insert({
          user_id: user.id,
          data_inicio: data.dataInicio.toISOString().split('T')[0],
          data_fim: data.dataFim.toISOString().split('T')[0],
          observacoes: data.observacoes || null,
          status: 'ativa'
        })
        .select()
        .single();

      if (quoteError) throw quoteError;

      const quoteItemsData = data.produtos.map(p => ({
        quote_id: quote.id,
        product_id: p.produtoId,
        product_name: p.produtoNome,
        quantidade: p.quantidade,
        unidade: p.unidade
      }));

      const { error: itemsError } = await supabase
        .from("quote_items")
        .insert(quoteItemsData);

      if (itemsError) throw itemsError;

      const { data: suppliersData } = await supabase
        .from("suppliers")
        .select("id, name")
        .in("id", data.fornecedoresIds);

      const quoteSuppliersData = data.fornecedoresIds.map(supplierId => {
        const supplier = suppliersData?.find(s => s.id === supplierId);
        return {
          quote_id: quote.id,
          supplier_id: supplierId,
          supplier_name: supplier?.name || "Desconhecido",
          status: 'pendente'
        };
      });

      const { error: suppliersError } = await supabase
        .from("quote_suppliers")
        .insert(quoteSuppliersData);

      if (suppliersError) throw suppliersError;

      const quoteSupplierItemsData: any[] = [];
      data.fornecedoresIds.forEach(supplierId => {
        data.produtos.forEach(produto => {
          quoteSupplierItemsData.push({
            quote_id: quote.id,
            supplier_id: supplierId,
            product_id: produto.produtoId,
            product_name: produto.produtoNome,
            valor_oferecido: 0
          });
        });
      });

      const { error: supplierItemsError } = await supabase
        .from("quote_supplier_items")
        .insert(quoteSupplierItemsData);

      if (supplierItemsError) throw supplierItemsError;

      onAdd(data);
      toast({
        title: "✅ Cotação criada com sucesso",
        description: "A cotação foi adicionada ao sistema.",
        className: "border-green-200 bg-green-50",
      });
      form.reset();
      setSelectedSuppliers([]);
      setSupplierSearch("");
      setActiveTab("produtos");
      setOpen(false);
    } catch (error: any) {
      console.error("Erro ao criar cotação:", error);
      toast({
        title: "❌ Erro ao criar cotação",
        description: error.message || "Ocorreu um erro ao criar a cotação",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSupplierSelect = (supplier: Supplier) => {
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

  const tabs = [
    { id: "produtos", label: "Produtos", icon: Package },
    { id: "periodo", label: "Período", icon: Clock },
    { id: "fornecedores", label: "Fornecedores", icon: Building2 },
    { id: "detalhes", label: "Detalhes", icon: FileText }
  ];

  const currentTabIndex = tabs.findIndex(tab => tab.id === activeTab);
  const progress = ((currentTabIndex + 1) / tabs.length) * 100;

  const canProceedToNext = () => {
    const formValues = form.getValues();
    switch (activeTab) {
      case "produtos":
        return formValues.produtos.every(p => p.produtoId && p.quantidade && p.unidade);
      case "periodo":
        return formValues.dataInicio && formValues.dataFim;
      case "fornecedores":
        return selectedSuppliers.length > 0;
      case "detalhes":
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (currentTabIndex < tabs.length - 1) {
      setActiveTab(tabs[currentTabIndex + 1].id);
    }
  };

  const handlePrevious = () => {
    if (currentTabIndex > 0) {
      setActiveTab(tabs[currentTabIndex - 1].id);
    }
  };

  const getTabStatus = (tabId: string) => {
    const tabIndex = tabs.findIndex(tab => tab.id === tabId);
    if (tabIndex < currentTabIndex) return "completed";
    if (tabIndex === currentTabIndex) return "current";
    return "pending";
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white">
            <Plus className="h-4 w-4 mr-2" />
            Nova Cotação
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="w-[95vw] sm:w-[90vw] max-w-[1000px] h-[90vh] sm:h-[85vh] max-h-[900px] p-0 gap-0 overflow-hidden border-teal-200/40 shadow-2xl rounded-xl sm:rounded-2xl flex flex-col animate-in fade-in-0 zoom-in-95 slide-in-from-bottom-4 duration-300">
        {/* Header */}
        <DialogHeader className="flex-shrink-0 px-4 sm:px-6 py-4 sm:py-5 border-b border-teal-100/60 bg-gradient-to-br from-teal-50/80 via-cyan-50/60 to-blue-50/40 backdrop-blur-sm relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-teal-500/5 via-cyan-500/5 to-blue-500/5"></div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-teal-400/10 to-cyan-400/10 rounded-full -translate-y-16 translate-x-16"></div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="p-2 sm:p-3 rounded-xl sm:rounded-2xl bg-gradient-to-br from-teal-600 via-cyan-600 to-blue-600 text-white shadow-lg shadow-teal-500/25 ring-2 ring-white/20 flex-shrink-0">
                <FileText className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              
              <div className="flex-1 min-w-0">
                <DialogTitle className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-teal-900 via-cyan-800 to-blue-800 bg-clip-text text-transparent">
                  Nova Cotação
                </DialogTitle>
                <DialogDescription className="text-gray-600/80 text-sm mt-1">
                  Crie uma nova cotação seguindo os passos abaixo
                </DialogDescription>
              </div>
            </div>
            
            <div className="mt-3 sm:mt-4 space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="font-medium text-teal-900">Progresso da Cotação</span>
                <span className="font-bold text-teal-700">{Math.round(progress)}% concluído</span>
              </div>
              <Progress 
                value={progress} 
                className="h-3 bg-teal-100/60 [&>div]:bg-gradient-to-r [&>div]:from-teal-500 [&>div]:to-cyan-500"
              />
            </div>
          </div>
        </DialogHeader>
        
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin h-12 w-12 border-4 border-teal-200 border-t-teal-600 rounded-full mx-auto mb-4"></div>
              <p className="text-sm font-medium text-teal-900">Carregando dados...</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col h-full overflow-hidden">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col h-full overflow-hidden">
                {/* Tab Navigation */}
                <div className="flex-shrink-0 px-3 sm:px-6 py-3 border-b border-teal-100/60 bg-gradient-to-r from-teal-50/40 to-cyan-50/30 backdrop-blur-sm overflow-x-auto scrollbar-thin">
                  <div className="flex space-x-2 bg-white/80 backdrop-blur-sm rounded-2xl p-1.5 shadow-lg border border-teal-200/40 min-w-max sm:min-w-0">
                    {tabs.map((tab) => {
                      const Icon = tab.icon;
                      const status = getTabStatus(tab.id);
                      return (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setActiveTab(tab.id)}
                          className={cn(
                            "flex items-center gap-2.5 px-4 sm:px-5 py-3 rounded-xl text-sm font-semibold transition-all duration-300 relative overflow-hidden group",
                            status === "current" && "bg-gradient-to-r from-teal-600 to-cyan-600 text-white shadow-xl shadow-teal-500/25 scale-105",
                            status === "completed" && "bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg",
                            status === "pending" && "bg-gray-100 text-gray-500 hover:bg-teal-50 hover:text-teal-700"
                          )}
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                          
                          <div className={cn(
                            "flex items-center justify-center w-6 h-6 rounded-lg transition-all",
                            status === "current" && "bg-white/20",
                            status === "completed" && "bg-white/20"
                          )}>
                            {status === "completed" ? (
                              <Check className="h-4 w-4 text-white" />
                            ) : (
                              <Icon className="h-4 w-4" />
                            )}
                          </div>
                          
                          <span className="relative z-10 hidden sm:inline">{tab.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Tab Content with Animations */}
                <div className="flex-1 overflow-hidden">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeTab}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.25, ease: "easeOut" }}
                      className="h-full"
                    >
                      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full h-full">
                        {/* Produtos Tab */}
                        <TabsContent value="produtos" className="h-full m-0">
                          <ScrollArea className="h-full">
                            <div className="p-4 sm:p-6 space-y-4">
                              <Card className="border-teal-100 bg-gradient-to-br from-white to-teal-50/20 shadow-sm">
                                <CardHeader className="pb-3 border-b border-teal-100/60">
                                  <CardTitle className="flex items-center gap-2 text-teal-900">
                                    <Package className="h-5 w-5 text-teal-600" />
                                    Produtos da Cotação
                                  </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-4">
                                  <Button
                                    type="button"
                                    autoFocus
                                    onClick={handleAddProduct}
                                    className="w-full mb-4 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white shadow-lg"
                                  >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Adicionar Produto
                                  </Button>

                                  <div ref={productsContainerRef} className="space-y-3">
                                    {fields.map((field, index) => (
                                      <Card key={field.id} className="border-teal-200 hover:border-teal-400 transition-all">
                                        <div className="h-1 bg-gradient-to-r from-teal-500 to-cyan-500"></div>
                                        <CardContent className="p-4 space-y-3">
                                          <div className="flex items-center justify-between">
                                            <h4 className="font-semibold text-gray-900">Produto {index + 1}</h4>
                                            {fields.length > 1 && (
                                              <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => remove(index)}
                                                className="text-red-600 hover:bg-red-50"
                                              >
                                                <Trash2 className="h-4 w-4" />
                                              </Button>
                                            )}
                                          </div>

                                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            <FormField
                                              control={form.control}
                                              name={`produtos.${index}.produtoId`}
                                              render={({ field: formField }) => (
                                                <FormItem>
                                                  <FormLabel>Produto *</FormLabel>
                                                  <Popover>
                                                    <PopoverTrigger asChild>
                                                      <FormControl>
                                                        <Button
                                                          variant="outline"
                                                          role="combobox"
                                                          className={cn(
                                                            "w-full justify-between border-teal-200 focus:ring-teal-500/20",
                                                            !formField.value && "text-muted-foreground"
                                                          )}
                                                        >
                                                          {formField.value
                                                            ? products.find((p) => p.id === formField.value)?.name
                                                            : "Selecionar produto..."}
                                                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                        </Button>
                                                      </FormControl>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-full p-0 border-teal-200" align="start">
                                                      <Command>
                                                        <CommandInput placeholder="Buscar produto..." />
                                                        <CommandList>
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
                                              )}
                                            />

                                            <div className="grid grid-cols-2 gap-3">
                                              <FormField
                                                control={form.control}
                                                name={`produtos.${index}.quantidade`}
                                                render={({ field: formField }) => (
                                                  <FormItem>
                                                    <FormLabel>Quantidade *</FormLabel>
                                                    <FormControl>
                                                      <Input 
                                                        placeholder="Ex: 500" 
                                                        type="number" 
                                                        className="border-teal-200 focus:border-teal-500 focus:ring-teal-500/20"
                                                        {...formField} 
                                                      />
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
                                                    <FormLabel>Unidade *</FormLabel>
                                                    <Select onValueChange={formField.onChange} defaultValue={formField.value}>
                                                      <FormControl>
                                                        <SelectTrigger className="border-teal-200">
                                                          <SelectValue placeholder="Selecione" />
                                                        </SelectTrigger>
                                                      </FormControl>
                                                      <SelectContent>
                                                        <SelectItem value="kg">kg</SelectItem>
                                                        <SelectItem value="g">g</SelectItem>
                                                        <SelectItem value="un">un</SelectItem>
                                                        <SelectItem value="cx">cx</SelectItem>
                                                        <SelectItem value="pct">pct</SelectItem>
                                                        <SelectItem value="l">l</SelectItem>
                                                        <SelectItem value="ml">ml</SelectItem>
                                                      </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                  </FormItem>
                                                )}
                                              />
                                            </div>
                                          </div>
                                        </CardContent>
                                      </Card>
                                    ))}
                                  </div>
                                </CardContent>
                              </Card>
                            </div>
                          </ScrollArea>
                        </TabsContent>

                        {/* Período Tab */}
                        <TabsContent value="periodo" className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4 m-0">
                          <Card className="border-0 shadow-lg bg-gradient-to-br from-white via-gray-50/30 to-indigo-50/20 backdrop-blur-sm">
                            <CardHeader className="pb-3 bg-gradient-to-r from-indigo-50/60 to-purple-50/40 rounded-t-xl border-b border-gray-100/60">
                              <CardTitle className="flex items-center gap-3 text-base font-bold">
                                <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/25">
                                  <Clock className="h-4 w-4 drop-shadow-sm" />
                                </div>
                                <div className="flex flex-col">
                                  <span className="bg-gradient-to-r from-indigo-900 to-purple-800 bg-clip-text text-transparent">
                                    Período da Cotação
                                  </span>
                                  <span className="text-xs text-gray-600 font-normal mt-0.5">
                                    Defina quando a cotação ficará aberta
                                  </span>
                                </div>
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="p-3 space-y-4">

                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                <FormField
                                  control={form.control}
                                  name="dataInicio"
                                  render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                      <FormLabel>Data de Início *</FormLabel>
                                      <Popover>
                                      <PopoverTrigger asChild>
                                        <FormControl>
                                          <Button
                                            variant="outline"
                                            className={cn(
                                              "w-full pl-3 text-left font-normal",
                                              !field.value && "text-muted-foreground"
                                            )}
                                          >
                                            {field.value ? (
                                              format(field.value, "dd/MM/yyyy", { locale: ptBR })
                                            ) : (
                                              <span>Selecione a data de início</span>
                                            )}
                                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                          </Button>
                                        </FormControl>
                                      </PopoverTrigger>
                                      <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                          mode="single"
                                          selected={field.value}
                                          onSelect={field.onChange}
                                          disabled={(date) => date < new Date()}
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
                                    <FormLabel>Data de Fim *</FormLabel>
                                    <Popover>
                                      <PopoverTrigger asChild>
                                        <FormControl>
                                          <Button
                                            variant="outline"
                                            className={cn(
                                              "w-full pl-3 text-left font-normal",
                                              !field.value && "text-muted-foreground"
                                            )}
                                          >
                                            {field.value ? (
                                              format(field.value, "dd/MM/yyyy", { locale: ptBR })
                                            ) : (
                                              <span>Selecione a data de fim</span>
                                            )}
                                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                          </Button>
                                        </FormControl>
                                      </PopoverTrigger>
                                      <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                          mode="single"
                                          selected={field.value}
                                          onSelect={field.onChange}
                                          disabled={(date) => {
                                            const startDate = form.getValues("dataInicio");
                                            return startDate ? date <= startDate : date < new Date();
                                          }}
                                          initialFocus
                                        />
                                      </PopoverContent>
                                    </Popover>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>

                            {/* Dicas compactas */}
                            <div className="bg-gradient-to-r from-blue-50/60 to-indigo-50/40 border border-blue-200/60 rounded-lg p-3">
                              <div className="flex items-center gap-2 mb-2">
                                <div className="w-5 h-5 rounded bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
                                  <span className="text-white text-xs">💡</span>
                                </div>
                                <h4 className="font-bold text-blue-900 text-xs">Dicas de Período</h4>
                              </div>
                              <ul className="text-xs text-blue-800 space-y-1">
                                <li>• 3-7 dias para cotações simples</li>
                                <li>• 7-14 dias para produtos especiais</li>
                                <li>• Evite períodos muito longos</li>
                              </ul>
                            </div>

                            {/* Presets rápidos */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const hoje = new Date();
                                  const fim = new Date(hoje);
                                  fim.setDate(hoje.getDate() + 3);
                                  form.setValue("dataInicio", hoje);
                                  form.setValue("dataFim", fim);
                                }}
                                className="h-8 text-xs"
                              >
                                3 dias
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const hoje = new Date();
                                  const fim = new Date(hoje);
                                  fim.setDate(hoje.getDate() + 7);
                                  form.setValue("dataInicio", hoje);
                                  form.setValue("dataFim", fim);
                                }}
                                className="h-8 text-xs"
                              >
                                7 dias
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const hoje = new Date();
                                  const fim = new Date(hoje);
                                  fim.setDate(hoje.getDate() + 14);
                                  form.setValue("dataInicio", hoje);
                                  form.setValue("dataFim", fim);
                                }}
                                className="h-8 text-xs"
                              >
                                14 dias
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const hoje = new Date();
                                  const fim = new Date(hoje);
                                  fim.setDate(hoje.getDate() + 30);
                                  form.setValue("dataInicio", hoje);
                                  form.setValue("dataFim", fim);
                                }}
                                className="h-8 text-xs"
                              >
                                30 dias
                              </Button>
                            </div>
                            </CardContent>
                          </Card>
                        </TabsContent>

                        {/* Fornecedores Tab */}
                        <TabsContent value="fornecedores" className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4 m-0">
                          <Card>
                            <CardHeader>
                              <CardTitle className="flex items-center gap-2">
                                <Building2 className="h-5 w-5 text-green-600" />
                                Fornecedores Participantes
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                              <p className="text-sm text-gray-600">
                                Selecione os fornecedores que participarão desta cotação
                              </p>

                              <FormField
                                control={form.control}
                                name="fornecedoresIds"
                                render={() => (
                                  <FormItem>
                                    <FormLabel>Buscar e Adicionar Fornecedores *</FormLabel>
                                    <Popover>
                                      <PopoverTrigger asChild>
                                        <FormControl>
                                          <Button
                                            variant="outline"
                                            role="combobox"
                                            className="w-full justify-between"
                                          >
                                            Buscar fornecedores...
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                          </Button>
                                        </FormControl>
                                      </PopoverTrigger>
                                      <PopoverContent className="w-full p-0" align="start">
                                        <Command>
                                          <CommandInput 
                                            placeholder="Digite o nome do fornecedor..." 
                                            value={supplierSearch}
                                            onValueChange={setSupplierSearch}
                                          />
                                          <CommandList>
                                            <CommandEmpty>Nenhum fornecedor encontrado.</CommandEmpty>
                                            <CommandGroup>
                                              {filteredSuppliers.map((supplier) => (
                                                <CommandItem
                                                  key={supplier.id}
                                                  value={supplier.name}
                                                  onSelect={() => handleSupplierSelect(supplier)}
                                                >
                                                  <Plus className="mr-2 h-4 w-4 text-green-600" />
                                                  {supplier.name}
                                                </CommandItem>
                                              ))}
                                            </CommandGroup>
                                          </CommandList>
                                        </Command>
                                      </PopoverContent>
                                    </Popover>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              {/* Fornecedores Selecionados */}
                              {selectedSuppliers.length > 0 && (
                                <div className="space-y-3">
                                  <h4 className="font-medium text-gray-900">
                                    Fornecedores Selecionados ({selectedSuppliers.length})
                                  </h4>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto">
                                    {selectedSuppliers.map((supplier) => (
                                      <div
                                        key={supplier.id}
                                        className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg"
                                      >
                                        <div className="flex items-center gap-3">
                                          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                            <Building2 className="h-4 w-4 text-green-600" />
                                          </div>
                                          <span className="font-medium text-green-900">{supplier.name}</span>
                                        </div>
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => handleSupplierRemove(supplier.id)}
                                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                        >
                                          <X className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {selectedSuppliers.length === 0 && (
                                <div className="text-center py-8 text-gray-500">
                                  <Building2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                  <p>Nenhum fornecedor selecionado ainda</p>
                                  <p className="text-sm">Use o campo acima para buscar e adicionar fornecedores</p>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        </TabsContent>

                        {/* Detalhes Tab */}
                        <TabsContent value="detalhes" className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4 m-0">
                          <Card>
                            <CardHeader>
                              <CardTitle className="flex items-center gap-2">
                                <FileText className="h-5 w-5 text-purple-600" />
                                Detalhes Adicionais
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                              <FormField
                                control={form.control}
                                name="observacoes"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Observações</FormLabel>
                                    <FormControl>
                                      <Textarea 
                                        placeholder="Adicione observações, especificações técnicas, condições especiais ou qualquer informação relevante para os fornecedores..." 
                                        className="resize-none min-h-[100px]" 
                                        {...field} 
                                      />
                                    </FormControl>
                                    <p className="text-xs text-gray-500">
                                      Estas informações serão enviadas junto com a cotação para todos os fornecedores
                                    </p>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              {/* Resumo da Cotação */}
                              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                                <h4 className="font-medium text-gray-900 mb-3">📋 Resumo da Cotação</h4>
                                <div className="space-y-2 text-sm">
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">Produtos:</span>
                                    <span className="font-medium">{fields.length} item(s)</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">Fornecedores:</span>
                                    <span className="font-medium">{selectedSuppliers.length} participante(s)</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">Período:</span>
                                    <span className="font-medium">
                                      {form.watch("dataInicio") && form.watch("dataFim") 
                                        ? `${format(form.watch("dataInicio"), "dd/MM", { locale: ptBR })} - ${format(form.watch("dataFim"), "dd/MM/yyyy", { locale: ptBR })}`
                                        : "Não definido"
                                      }
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </TabsContent>
                      </Tabs>
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* Footer */}
                <DialogFooter className="flex-shrink-0 px-4 sm:px-6 py-4 border-t border-teal-100/60 bg-gradient-to-r from-gray-50 to-teal-50/30">
                  <div className="flex justify-between w-full gap-3">
                    {currentTabIndex > 0 && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handlePrevious}
                        className="border-gray-300 hover:bg-gray-100"
                      >
                        <ChevronLeft className="h-4 w-4 mr-2" />
                        Voltar
                      </Button>
                    )}
                    
                    <div className="flex gap-3 ml-auto">
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setOpen(false)}
                        className="text-gray-600 hover:bg-gray-100"
                      >
                        Cancelar
                      </Button>
                      
                      {currentTabIndex < tabs.length - 1 ? (
                        <Button
                          type="button"
                          onClick={handleNext}
                          disabled={!canProceedToNext()}
                          className="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white shadow-lg"
                        >
                          Próximo
                          <ChevronRight className="h-4 w-4 ml-2" />
                        </Button>
                      ) : (
                        <Button
                          type="submit"
                          disabled={isSubmitting}
                          className="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white shadow-lg"
                        >
                          {isSubmitting ? (
                            <>
                              <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                              Criando...
                            </>
                          ) : (
                            <>
                              <Check className="h-4 w-4 mr-2" />
                              Criar Cotação
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                </DialogFooter>
              </form>
            </Form>
          </div>
        )}

        {isSubmitting && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center rounded-2xl">
            <div className="text-center space-y-3">
              <div className="animate-spin h-12 w-12 border-4 border-teal-200 border-t-teal-600 rounded-full mx-auto"></div>
              <p className="text-sm font-medium text-teal-900">Criando cotação...</p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
