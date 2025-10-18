import { useState, useEffect, useRef, useMemo } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { useDebounce } from "@/hooks/useDebounce";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
  const [productSearch, setProductSearch] = useState("");
  const debouncedProductSearch = useDebounce(productSearch, 300);
  const [selectedSuppliers, setSelectedSuppliers] = useState<Supplier[]>([]);
  const [activeTab, setActiveTab] = useState("produtos");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const productsContainerRef = useRef<HTMLDivElement>(null);
  
  // Estados para o novo formulário de produto único
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [newProductQuantity, setNewProductQuantity] = useState("");
  const [newProductUnit, setNewProductUnit] = useState("");

  const form = useForm<QuoteFormData>({
    resolver: zodResolver(quoteSchema),
    defaultValues: {
      produtos: [],
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

  const handleAddNewProduct = () => {
    if (selectedProduct && newProductQuantity && newProductUnit) {
      append({ 
        produtoId: selectedProduct.id, 
        produtoNome: selectedProduct.name, 
        quantidade: newProductQuantity, 
        unidade: newProductUnit 
      });
      
      // Limpar o formulário após adicionar
      setSelectedProduct(null);
      setNewProductQuantity("");
      setNewProductUnit("");
    }
  };

  useEffect(() => {
    if (open) {
      loadData();
    }
  }, [open]);

  const loadData = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Load suppliers (usually few)
      const suppliersRes = await supabase
        .from("suppliers")
        .select("id, name")
        .eq('user_id', user.id)
        .order("name");

      if (suppliersRes.data) setSuppliers(suppliersRes.data);

      // Load products in batches
      const { count: totalCount, error: countError } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      if (countError) throw countError;
      
      if (!totalCount || totalCount === 0) {
        setProducts([]);
        setLoading(false);
        return;
      }

      const pageSize = 1000;
      const totalPages = Math.ceil(totalCount / pageSize);
      const allProducts = [];

      console.log(`[ADD QUOTE] Loading ${totalCount} products in ${totalPages} pages`);

      for (let page = 0; page < totalPages; page++) {
        const from = page * pageSize;
        const to = from + pageSize - 1;

        const { data: pageData, error: pageError } = await supabase
          .from('products')
          .select('id, name')
          .eq('user_id', user.id)
          .order('name')
          .range(from, to);

        if (pageError) throw pageError;
        if (pageData && pageData.length > 0) {
          allProducts.push(...pageData);
        }
      }

      console.log(`[ADD QUOTE] Loaded ${allProducts.length} products total`);
      setProducts(allProducts);
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

  // Filter products with debounce - só mostra ao digitar
  const filteredProducts = useMemo(() => {
    if (!debouncedProductSearch) return []; // Não mostra nada até começar a digitar
    return products.filter(p => 
      p.name.toLowerCase().includes(debouncedProductSearch.toLowerCase())
    );
  }, [products, debouncedProductSearch]);

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
      <DialogContent className="w-[95vw] sm:w-[90vw] max-w-[1000px] h-[90vh] sm:h-[85vh] max-h-[900px] p-0 gap-0 overflow-hidden border-teal-200/40 dark:border-gray-700 shadow-2xl rounded-xl sm:rounded-2xl flex flex-col animate-in fade-in-0 zoom-in-95 slide-in-from-bottom-4 duration-300 bg-white dark:bg-gray-900">
        <DialogHeader className="relative px-4 sm:px-6 py-3 bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50 dark:from-gray-800 dark:via-gray-800 dark:to-gray-800 border-b border-teal-100/60 dark:border-gray-700 overflow-hidden">
          <div className="absolute top-0 left-0 w-24 h-24 bg-gradient-to-br from-teal-400/10 to-cyan-400/10 dark:from-teal-400/20 dark:to-cyan-400/20 rounded-full -translate-y-12 -translate-x-12"></div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-teal-400/10 to-cyan-400/10 dark:from-teal-400/20 dark:to-cyan-400/20 rounded-full -translate-y-16 translate-x-16"></div>
          
          <div className="relative z-10">
            {/* Compact Header */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 flex-1">
                <div className="p-2 rounded-xl bg-gradient-to-br from-teal-600 via-cyan-600 to-blue-600 text-white shadow-lg shadow-teal-500/25 ring-2 ring-white/20 dark:ring-teal-900/50 flex-shrink-0">
                  <FileText className="h-5 w-5" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <DialogTitle className="text-lg font-bold text-gray-900 dark:text-white">
                    Nova Cotação
                  </DialogTitle>
                  <DialogDescription className="text-gray-600 dark:text-gray-400 text-xs">
                    {Math.round(progress)}% concluído
                  </DialogDescription>
                </div>

                {/* Navigation Controls - Moved to left side */}
                <div className="flex items-center gap-2 sm:gap-3">
                  {currentTabIndex > 0 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handlePrevious}
                      className="border-gray-300 hover:bg-gray-100 h-8 px-3"
                    >
                      <ChevronLeft className="h-3 w-3 mr-1" />
                      <span className="hidden sm:inline">Voltar</span>
                    </Button>
                  )}
                  
                  {currentTabIndex < tabs.length - 1 ? (
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleNext}
                      disabled={!canProceedToNext()}
                      className="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white shadow-lg h-8 px-3"
                    >
                      <span className="hidden sm:inline">Próximo</span>
                      <ChevronRight className="h-3 w-3 ml-1" />
                    </Button>
                  ) : (
                    <Button
                      type="submit"
                      size="sm"
                      disabled={isSubmitting}
                      className="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white shadow-lg h-8 px-3"
                      form="quote-form"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="animate-spin h-3 w-3 border-2 border-white border-t-transparent rounded-full mr-1"></div>
                          <span className="hidden sm:inline">Criando...</span>
                        </>
                      ) : (
                        <>
                          <Check className="h-3 w-3 mr-1" />
                          <span className="hidden sm:inline">Criar</span>
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>

              {/* Close Button - Isolated on the right */}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setOpen(false)}
                className="text-gray-600 hover:bg-gray-100 h-8 w-8 p-0 flex-shrink-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Compact Progress Bar */}
            <div className="mt-2">
              <Progress 
                value={progress} 
                className="h-2 bg-teal-100/60 [&>div]:bg-gradient-to-r [&>div]:from-teal-500 [&>div]:to-cyan-500"
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
              <form id="quote-form" onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col h-full overflow-hidden">
                {/* Compact Tab Navigation */}
                <div className="flex-shrink-0 px-3 sm:px-6 py-2 border-b border-teal-100/60 dark:border-gray-700 bg-gradient-to-r from-teal-50/40 to-cyan-50/30 dark:from-gray-800 dark:to-gray-800 backdrop-blur-sm">
                  <div className="flex space-x-1 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-1 shadow-lg border border-teal-200/40 dark:border-gray-700">
                    {tabs.map((tab) => {
                      const Icon = tab.icon;
                      const status = getTabStatus(tab.id);
                      return (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setActiveTab(tab.id)}
                          className={cn(
                            "flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-300 relative overflow-hidden group",
                            status === "current" && "bg-gradient-to-r from-teal-600 to-cyan-600 text-white shadow-xl shadow-teal-500/25 scale-105",
                            status === "completed" && "bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg",
                            status === "pending" && "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-teal-50 dark:hover:bg-teal-900/30 hover:text-teal-700 dark:hover:text-teal-400"
                          )}
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                          
                          <div className={cn(
                            "flex items-center justify-center w-4 h-4 rounded transition-all",
                            status === "current" && "bg-white/20",
                            status === "completed" && "bg-white/20"
                          )}>
                            {status === "completed" ? (
                              <Check className="h-3 w-3 text-white" />
                            ) : (
                              <Icon className="h-3 w-3" />
                            )}
                          </div>
                          
                          <span className="relative z-10 hidden sm:inline">{tab.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Content Area - Now with more space */}
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
                          <div className="h-full p-4 sm:p-6">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
                              {/* Formulário de Adição - Lado Esquerdo */}
                              <Card className="border-teal-100 dark:border-gray-700 bg-gradient-to-br from-white to-teal-50/20 dark:from-gray-800 dark:to-gray-800 shadow-sm h-fit">
                                <CardHeader className="pb-3 border-b border-teal-100/60 dark:border-gray-700">
                                  <CardTitle className="flex items-center gap-2 text-teal-900 dark:text-white">
                                    <Plus className="h-5 w-5 text-teal-600" />
                                    Adicionar Produto
                                  </CardTitle>
                                </CardHeader>
                                 <CardContent className="pt-4 space-y-4">
                                  {/* Seletor de Produto */}
                                  <div>
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Produto *</label>
                                    <Popover>
                                      <PopoverTrigger asChild>
                                        <Button
                                          variant="outline"
                                          role="combobox"
                                          className="w-full justify-between border-teal-200 dark:border-gray-700 focus:ring-teal-500/20 dark:bg-gray-800 dark:text-white"
                                        >
                                          {selectedProduct ? selectedProduct.name : "Selecionar produto..."}
                                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                      </PopoverTrigger>
                                      <PopoverContent className="w-full p-0 border-teal-200" align="start">
                                        <Command>
                                          <CommandInput 
                                            placeholder={`Buscar entre ${products.length} produtos...`}
                                            value={productSearch}
                                            onValueChange={setProductSearch}
                                          />
                                           <CommandList>
                                             <CommandEmpty>
                                               {debouncedProductSearch 
                                                 ? "Nenhum produto encontrado." 
                                                 : `Digite para buscar entre ${products.length} produtos...`
                                               }
                                             </CommandEmpty>
                                             <CommandGroup>
                                              {filteredProducts.map((product) => (
                                                <CommandItem
                                                  key={product.id}
                                                  value={product.name}
                                                  onSelect={() => {
                                                    setSelectedProduct(product);
                                                    setProductSearch("");
                                                  }}
                                                >
                                                  <Check
                                                    className={cn(
                                                      "mr-2 h-4 w-4",
                                                      selectedProduct?.id === product.id ? "opacity-100" : "opacity-0"
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
                                  </div>

                                  {/* Quantidade e Unidade */}
                                  <div className="grid grid-cols-2 gap-3">
                                    <div>
                                      <label className="text-sm font-medium text-gray-700 mb-2 block">Quantidade *</label>
                                      <Input 
                                        placeholder="Ex: 500" 
                                        type="number" 
                                        value={newProductQuantity}
                                        onChange={(e) => setNewProductQuantity(e.target.value)}
                                        className="border-teal-200 focus:border-teal-500 focus:ring-teal-500/20"
                                      />
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium text-gray-700 mb-2 block">Unidade *</label>
                                      <Select value={newProductUnit} onValueChange={setNewProductUnit}>
                                        <SelectTrigger className="border-teal-200">
                                          <SelectValue placeholder="Selecione" />
                                        </SelectTrigger>
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
                                    </div>
                                  </div>

                                  {/* Botão Adicionar */}
                                  <Button
                                    type="button"
                                    onClick={handleAddNewProduct}
                                    disabled={!selectedProduct || !newProductQuantity || !newProductUnit}
                                    className="w-full bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white shadow-lg disabled:opacity-50"
                                  >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Adicionar à Lista
                                  </Button>
                                </CardContent>
                              </Card>

                              {/* Lista de Produtos - Lado Direito */}
                              <Card className="border-teal-100 bg-gradient-to-br from-white to-teal-50/20 shadow-sm">
                                <CardHeader className="pb-3 border-b border-teal-100/60 dark:border-gray-700">
                                  <CardTitle className="flex items-center gap-2 text-teal-900 dark:text-white">
                                    <Package className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                                    Produtos Adicionados ({fields.length})
                                  </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-4">
                                  {fields.length === 0 ? (
                                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                                      <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                      <p>Nenhum produto adicionado ainda</p>
                                      <p className="text-sm">Use o formulário ao lado para adicionar produtos</p>
                                    </div>
                                  ) : (
                                    <ScrollArea className="h-[400px]">
                                      <div className="space-y-3">
                                        {fields.map((field, index) => (
                                          <Card key={field.id} className="border-teal-200 dark:border-gray-700 hover:border-teal-400 dark:hover:border-teal-600 transition-all bg-white dark:bg-gray-800">
                                            <div className="h-1 bg-gradient-to-r from-teal-500 to-cyan-500"></div>
                                            <CardContent className="p-3">
                                              <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                  <h4 className="font-semibold text-gray-900 dark:text-white text-sm">
                                                    {form.watch(`produtos.${index}.produtoNome`) || `Produto ${index + 1}`}
                                                  </h4>
                                                  <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                                    <span className="font-medium">{form.watch(`produtos.${index}.quantidade`)}</span>
                                                    <span className="mx-1">×</span>
                                                    <span>{form.watch(`produtos.${index}.unidade`)}</span>
                                                  </div>
                                                </div>
                                                <Button
                                                  type="button"
                                                  variant="ghost"
                                                  size="sm"
                                                  onClick={() => remove(index)}
                                                  className="text-red-600 hover:bg-red-50 h-8 w-8 p-0"
                                                >
                                                  <Trash2 className="h-4 w-4" />
                                                </Button>
                                              </div>
                                            </CardContent>
                                          </Card>
                                        ))}
                                      </div>
                                    </ScrollArea>
                                  )}
                                </CardContent>
                              </Card>
                            </div>
                          </div>
                        </TabsContent>

                        {/* Período Tab */}
                        <TabsContent value="periodo" className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4 m-0">
                          <Card className="border-0 shadow-lg bg-gradient-to-br from-white via-gray-50/30 to-indigo-50/20 dark:from-gray-800 dark:via-gray-800 dark:to-gray-800 backdrop-blur-sm">
                            <CardHeader className="pb-3 bg-gradient-to-r from-indigo-50/60 to-purple-50/40 dark:from-gray-800 dark:to-gray-800 rounded-t-xl border-b border-gray-100/60 dark:border-gray-700">
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
                        <TabsContent value="fornecedores" className="flex-1 overflow-y-auto p-3 sm:p-4 m-0">
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
                            {/* Formulário de Adição de Fornecedores - Lado Esquerdo */}
                            <Card className="h-fit">
                              <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                  <Building2 className="h-5 w-5 text-green-600" />
                                  Adicionar Fornecedores
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
                              </CardContent>
                            </Card>

                            {/* Lista de Fornecedores Selecionados - Lado Direito */}
                            <Card className="h-fit">
                              <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                  <Building2 className="h-5 w-5 text-blue-600" />
                                  Fornecedores Selecionados
                                  {selectedSuppliers.length > 0 && (
                                    <Badge variant="secondary" className="ml-auto">
                                      {selectedSuppliers.length}
                                    </Badge>
                                  )}
                                </CardTitle>
                              </CardHeader>
                              <CardContent>
                                {selectedSuppliers.length > 0 ? (
                                  <ScrollArea className="h-[400px] pr-4">
                                    <div className="space-y-3">
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
                                  </ScrollArea>
                                ) : (
                                  <div className="text-center py-8 text-gray-500">
                                    <Building2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                    <p>Nenhum fornecedor selecionado ainda</p>
                                    <p className="text-sm">Use o formulário ao lado para buscar e adicionar fornecedores</p>
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          </div>
                        </TabsContent>

                        {/* Detalhes Tab */}
                        <TabsContent value="detalhes" className="flex-1 m-0 min-h-0">
                          <ScrollArea className="h-full w-full [&>div>div[style]]:!pr-0">
                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 lg:gap-4 p-2 sm:p-3">
                              {/* Coluna Esquerda - Formulário de Detalhes */}
                              <Card className="border-purple-100 bg-gradient-to-br from-white to-purple-50/20 shadow-sm h-fit">
                                <CardHeader className="pb-2 border-b border-purple-100/60">
                                  <CardTitle className="flex items-center gap-2 text-purple-900 text-sm">
                                    <FileText className="h-4 w-4 text-purple-600" />
                                    Detalhes Adicionais
                                  </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-3 space-y-3">
                                <FormField
                                  control={form.control}
                                  name="observacoes"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel className="text-sm">Observações</FormLabel>
                                      <FormControl>
                                        <Textarea 
                                          placeholder="Adicione observações, especificações técnicas, condições especiais ou qualquer informação relevante para os fornecedores..." 
                                          className="resize-none min-h-[100px] text-sm" 
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

                                {/* Informações Adicionais */}
                                <div className="bg-purple-50/50 border border-purple-100 rounded-lg p-3">
                                  <h4 className="font-medium text-purple-900 mb-2 flex items-center gap-2 text-sm">
                                    <FileText className="h-3 w-3" />
                                    Dicas para uma boa cotação
                                  </h4>
                                  <ul className="space-y-1 text-xs text-purple-700">
                                    <li className="flex items-start gap-2">
                                      <span className="text-purple-500 mt-0.5">•</span>
                                      <span>Seja específico nas observações para evitar dúvidas</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                      <span className="text-purple-500 mt-0.5">•</span>
                                      <span>Inclua especificações técnicas quando necessário</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                      <span className="text-purple-500 mt-0.5">•</span>
                                      <span>Defina condições de pagamento e entrega</span>
                                    </li>
                                  </ul>
                                </div>
                              </CardContent>
                            </Card>

                            {/* Coluna Direita - Resumo da Cotação */}
                            <Card className="border-blue-100 bg-gradient-to-br from-white to-blue-50/20 shadow-sm h-fit">
                              <CardHeader className="pb-2 border-b border-blue-100/60">
                                <CardTitle className="flex items-center gap-2 text-blue-900 text-sm">
                                  <Package className="h-4 w-4 text-blue-600" />
                                  Resumo da Cotação
                                </CardTitle>
                              </CardHeader>
                              <CardContent className="pt-3 space-y-3">
                                {/* Estatísticas Principais */}
                                <div className="grid grid-cols-2 gap-2">
                                  <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-2 text-center">
                                    <div className="text-xl font-bold text-blue-600">{fields.length}</div>
                                    <div className="text-xs text-blue-700 font-medium">Produtos</div>
                                  </div>
                                  <div className="bg-green-50/50 border border-green-100 rounded-lg p-2 text-center">
                                    <div className="text-xl font-bold text-green-600">{selectedSuppliers.length}</div>
                                    <div className="text-xs text-green-700 font-medium">Fornecedores</div>
                                  </div>
                                </div>

                                {/* Detalhes do Período */}
                                <div className="bg-gray-50/50 border border-gray-100 rounded-lg p-3">
                                  <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2 text-sm">
                                    <Clock className="h-3 w-3 text-gray-600" />
                                    Período da Cotação
                                  </h4>
                                  <div className="text-xs">
                                    <div className="flex justify-between items-center">
                                      <span className="text-gray-600">Período:</span>
                                      <span className="font-medium text-gray-900">
                                        {form.watch("dataInicio") && form.watch("dataFim") 
                                          ? `${format(form.watch("dataInicio"), "dd/MM", { locale: ptBR })} - ${format(form.watch("dataFim"), "dd/MM/yyyy", { locale: ptBR })}`
                                          : "Não definido"
                                        }
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                {/* Lista de Produtos */}
                                {fields.length > 0 && (
                                  <div className="bg-gray-50/50 border border-gray-100 rounded-lg p-3">
                                    <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2 text-sm">
                                      <Package className="h-3 w-3 text-gray-600" />
                                      Produtos Selecionados
                                    </h4>
                                    <ScrollArea className="max-h-[120px] lg:max-h-[150px]">
                                      <div className="space-y-1">
                                        {fields.map((field, index) => (
                                          <div key={field.id} className="flex items-center justify-between p-2 bg-white rounded border border-gray-100">
                                            <div className="flex-1 min-w-0">
                                              <p className="text-xs font-medium text-gray-900 truncate">
                                                {form.watch(`produtos.${index}.produtoNome`) || "Produto não selecionado"}
                                              </p>
                                              <p className="text-xs text-gray-500">
                                                {form.watch(`produtos.${index}.quantidade`)} {form.watch(`produtos.${index}.unidade`)}
                                              </p>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </ScrollArea>
                                  </div>
                                )}

                                {/* Lista de Fornecedores */}
                                {selectedSuppliers.length > 0 && (
                                  <div className="bg-gray-50/50 border border-gray-100 rounded-lg p-3">
                                    <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2 text-sm">
                                      <Building2 className="h-3 w-3 text-gray-600" />
                                      Fornecedores Participantes
                                    </h4>
                                    <ScrollArea className="max-h-[100px] lg:max-h-[120px]">
                                      <div className="space-y-1">
                                        {selectedSuppliers.map((supplier) => (
                                          <div key={supplier.id} className="flex items-center gap-2 p-2 bg-white rounded border border-gray-100">
                                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                            <span className="text-xs font-medium text-gray-900">{supplier.name}</span>
                                          </div>
                                        ))}
                                      </div>
                                    </ScrollArea>
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                            </div>
                          </ScrollArea>
                        </TabsContent>
                      </Tabs>
                    </motion.div>
                  </AnimatePresence>
                </div>
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
