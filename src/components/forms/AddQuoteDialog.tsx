import { useState, useEffect, useRef, useMemo } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { AnimatedTabContent } from "@/components/ui/animated-tabs";
import { useDebounce } from "@/hooks/useDebounce";
import { useIsMobile } from "@/hooks/use-mobile";
import { useKeyboardOffset } from "@/hooks/useKeyboardOffset";
import { designSystem as ds } from "@/styles/design-system";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerTrigger,
  DrawerTitle,
} from "@/components/ui/drawer";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
  ChevronLeft,
  Zap,
  Search,
  Loader2,
  Phone,
  Mail,
  MapPin,
  History,
  Star,
  Info,
  LayoutList,
  MousePointerClick,
  ArrowLeft
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { CapitalizedText } from "@/components/ui/capitalized-text";

const productLineSchema = z.object({
  produtoId: z.string().min(1, "Produto é obrigatório"),
  produtoNome: z.string().min(1, "Produto é obrigatório"),
  quantidade: z.string()
    .min(1, "Quantidade é obrigatória")
    .refine(
      (val) => {
        const num = parseFloat(val.replace(',', '.'));
        return !isNaN(num) && num > 0;
      },
      { message: "Quantidade deve ser um número válido maior que zero" }
    ),
  unidade: z.string().min(1, "Unidade é obrigatória"),
});

const quoteSchema = z.object({
  produtos: z.array(productLineSchema).min(1, "Adicione pelo menos um produto"),
  dataInicio: z.date({ required_error: "Data de início é obrigatória" }),
  dataFim: z.date({ required_error: "Data de fim é obrigatória" }),
  dataPlanejada: z.date().optional(),
  fornecedoresIds: z.array(z.string()).min(1, "Selecione pelo menos um fornecedor"),
  observacoes: z.string().optional(),
}).refine((data) => data.dataFim >= data.dataInicio, {
  message: "Data de fim deve ser igual ou posterior à data de início",
  path: ["dataFim"],
}).refine((data) => {
  if (data.dataPlanejada && data.dataInicio) {
    return data.dataPlanejada >= data.dataInicio;
  }
  return true;
}, {
  message: "Data planejada deve ser igual ou posterior à data de início",
  path: ["dataPlanejada"],
});

type QuoteFormData = z.infer<typeof quoteSchema>;

interface Product {
  id: string;
  name: string;
}

interface Supplier {
  id: string;
  name: string;
  contact?: string | null;
}

interface AddQuoteDialogProps {
  onAdd: (quote: QuoteFormData) => void;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export default function AddQuoteDialog({ onAdd, trigger, open: externalOpen, onOpenChange: externalOnOpenChange }: AddQuoteDialogProps) {
  console.log("[AddQuoteDialog] Componente renderizado. Open state:", externalOpen);
  const isMobile = useIsMobile();
  const keyboardOffset = useKeyboardOffset();
  const [internalOpen, setInternalOpen] = useState(false);
  const open = externalOpen !== undefined ? externalOpen : internalOpen;
  const setOpen = externalOnOpenChange || setInternalOpen;
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSearchingProducts, setIsSearchingProducts] = useState(false);
  const [supplierSearch, setSupplierSearch] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showProductSuggestions, setShowProductSuggestions] = useState(false);
  const [highlightedProductIndex, setHighlightedProductIndex] = useState(-1);
  const debouncedProductSearch = useDebounce(productSearch, 300);
  const [selectedSuppliers, setSelectedSuppliers] = useState<Supplier[]>([]);
  const [activeTab, setActiveTab] = useState("produtos");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const productsContainerRef = useRef<HTMLDivElement>(null);
  const productListRef = useRef<HTMLDivElement>(null);
  
  // Estados para o novo formulário de produto único
  const [newProductQuantity, setNewProductQuantity] = useState("");
  const [newProductUnit, setNewProductUnit] = useState("");
  const [lastUsedUnit, setLastUsedUnit] = useState("kg");
  const [supplierPopoverOpen, setSupplierPopoverOpen] = useState(false);
  const [focusedSupplierId, setFocusedSupplierId] = useState<string | null>(null);
  
  // Estados para agendamento
  const [isScheduled, setIsScheduled] = useState(false);
  
  // Refs para auto-foco
  const quantityInputRef = useRef<HTMLInputElement>(null);
  const productSearchRef = useRef<HTMLInputElement>(null);
  const unitSelectRef = useRef<HTMLButtonElement>(null);
  const addButtonRef = useRef<HTMLButtonElement>(null);

  const form = useForm<QuoteFormData>({
    resolver: zodResolver(quoteSchema),
    defaultValues: {
      produtos: [],
      dataInicio: new Date(),
      dataFim: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      dataPlanejada: undefined,
      fornecedoresIds: [],
      observacoes: "",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "produtos",
  });

  const handleInputFocus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const target = e.target;
    setTimeout(() => {
      target.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 300);
  };

  const handleAddNewProduct = () => {
    if (selectedProduct && newProductQuantity && newProductUnit) {
      append({ 
        produtoId: selectedProduct.id, 
        produtoNome: selectedProduct.name, 
        quantidade: newProductQuantity, 
        unidade: newProductUnit 
      });
      
      // Salvar última unidade usada
      setLastUsedUnit(newProductUnit);
      
      // Limpar o formulário após adicionar
      setSelectedProduct(null);
      setNewProductQuantity("");
      setProductSearch("");
      
      // Auto-foco no campo de busca de produto para continuar adicionando
      setTimeout(() => {
        productSearchRef.current?.focus();
      }, 50);
      
      toast({
        title: "✅ Produto adicionado",
        description: `${selectedProduct.name} foi adicionado à cotação`,
        duration: 1500,
      });
    }
  };
  
  // Handler para Enter key no campo de quantidade
  const handleQuantityKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedProduct && newProductQuantity && newProductUnit) {
        handleAddNewProduct();
      } else if (selectedProduct && newProductQuantity && !newProductUnit) {
        // Focar no select de unidade
        unitSelectRef.current?.click();
      }
    } else if (e.key === 'Tab' && !e.shiftKey) {
      // Tab vai para o select de unidade naturalmente
    }
  };
  
  // Handler para busca de produtos e navegação
  const handleProductKeyDown = (e: React.KeyboardEvent) => {
    if (showProductSuggestions && products.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setHighlightedProductIndex(prev => prev < products.length - 1 ? prev + 1 : 0);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHighlightedProductIndex(prev => prev > 0 ? prev - 1 : products.length - 1);
        return;
      }
      if (e.key === 'Enter' && highlightedProductIndex >= 0) {
        e.preventDefault();
        const product = products[highlightedProductIndex];
        setSelectedProduct(product);
        setProductSearch("");
        setShowProductSuggestions(false);
        setHighlightedProductIndex(-1);
        setTimeout(() => {
          quantityInputRef.current?.focus();
        }, 50);
        return;
      }
      if (e.key === 'Escape') {
        setShowProductSuggestions(false);
        setHighlightedProductIndex(-1);
        return;
      }
    }

    if (e.key === 'Enter' && selectedProduct && newProductQuantity && newProductUnit) {
      e.preventDefault();
      handleAddNewProduct();
    }
  };
  
  // Handler para atalhos globais do modal
  const handleModalKeyDown = (e: React.KeyboardEvent) => {
    // Ctrl+Enter para criar cotação
    if (e.ctrlKey && e.key === 'Enter' && activeTab === 'detalhes') {
      e.preventDefault();
      form.handleSubmit((data) => onSubmit(data, false))();
    }
    
    // Alt+Setas para navegar entre abas
    if (e.altKey && e.key === 'ArrowRight') {
      e.preventDefault();
      handleNext();
    }
    if (e.altKey && e.key === 'ArrowLeft') {
      e.preventDefault();
      handlePrevious();
    }
    
    // Números 1-5 com Alt para ir direto para a aba
    if (e.altKey && ['1', '2', '3', '4', '5'].includes(e.key)) {
      e.preventDefault();
      const tabIndex = parseInt(e.key) - 1;
      if (tabs[tabIndex]) {
        setActiveTab(tabs[tabIndex].id);
      }
    }
  };

  useEffect(() => {
    if (open) {
      loadInitialData();
      // Definir unidade padrão na primeira vez
      if (!newProductUnit) {
        setNewProductUnit(lastUsedUnit);
      }
      // Auto-foco no seletor de produto ao abrir
      setTimeout(() => {
        if (activeTab === 'produtos' && productSearchRef.current) {
          productSearchRef.current.focus();
        }
      }, 300);
    } else {
      // Reset ao fechar
      setActiveTab("produtos");
      setSelectedProduct(null);
      setNewProductQuantity("");
      setNewProductUnit("");
      setProductSearch("");
      setSupplierSearch("");
      setProducts([]);
    }
  }, [open]);
  
  // Busca dinâmica de produtos quando o termo de busca muda
  useEffect(() => {
    if (debouncedProductSearch.length >= 2) {
      searchProducts(debouncedProductSearch);
    } else {
      setProducts([]);
    }
  }, [debouncedProductSearch]);
  
  // Auto-foco quando produto é selecionado
  useEffect(() => {
    if (selectedProduct && quantityInputRef.current) {
      quantityInputRef.current.focus();
    }
  }, [selectedProduct]);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Load suppliers
      const suppliersRes = await supabase
        .from("suppliers")
        .select("id, name, contact")
        .order("name");

      if (suppliersRes.data) setSuppliers(suppliersRes.data);
    } catch (error) {
      console.error("Erro ao carregar dados iniciais:", error);
    } finally {
      setLoading(false);
    }
  };

  const searchProducts = async (term: string) => {
    setIsSearchingProducts(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, name')
        .ilike('name', `%${term}%`)
        .order('name')
        .limit(10);

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error("Erro ao buscar produtos:", error);
    } finally {
      setIsSearchingProducts(false);
    }
  };

  const onSubmit = async (data: QuoteFormData, keepOpen = false) => {
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

      // Get company_id
      const { data: companyData } = await supabase
        .from("company_users")
        .select("company_id")
        .eq("user_id", user.id)
        .single();

      if (!companyData) {
        throw new Error("Empresa não encontrada");
      }

      // Calcular status baseado em data_planejada
      let quoteStatus = 'ativa';
      if (data.dataPlanejada) {
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);
        const planejada = new Date(data.dataPlanejada);
        planejada.setHours(0, 0, 0, 0);
        
        if (planejada > hoje) {
          quoteStatus = 'planejada';
        }
      }

      const { data: quote, error: quoteError } = await supabase
        .from("quotes")
        .insert({
          company_id: companyData.company_id,
          data_inicio: data.dataInicio.toISOString().split('T')[0],
          data_fim: data.dataFim.toISOString().split('T')[0],
          data_planejada: data.dataPlanejada?.toISOString() || null,
          observacoes: data.observacoes || null,
          status: quoteStatus
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
        description: keepOpen
          ? "A cotação foi adicionada! Crie outra cotação."
          : "A cotação foi adicionada ao sistema.",
        className: "border-green-200 bg-green-50",
      });
      
      form.reset();
      setSelectedSuppliers([]);
      setSupplierSearch("");
      setActiveTab("produtos");
      
      if (!keepOpen) {
        setOpen(false);
      } else {
        // Focar no campo de produtos
        setTimeout(() => {
          productSearchRef.current?.focus();
        }, 100);
      }
    } catch (error: any) {
      console.error("Erro ao criar cotação:", error);
      toast({
        title: "❌ Erro ao criar cotação",
        description: error.message || "Ocorreu um erro ao criar a cotação",
        variant: "destructive",
        className: "bg-red-50 border-red-200 text-red-900",
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
    
    if (focusedSupplierId === supplierId) {
        setFocusedSupplierId(null);
    }
  };
  
  const handleSelectAllSuppliers = () => {
    if (filteredSuppliers.length === 0) return;

    // Check if all currently visible filtered suppliers are selected
    const allVisibleSelected = filteredSuppliers.every(s => 
        selectedSuppliers.some(selected => selected.id === s.id)
    );

    if (allVisibleSelected) {
        // Remove only the visible/filtered suppliers from selection
        const newSuppliers = selectedSuppliers.filter(s => 
            !filteredSuppliers.some(f => f.id === s.id)
        );
        setSelectedSuppliers(newSuppliers);
        form.setValue("fornecedoresIds", newSuppliers.map(s => s.id));
    } else {
        // Add visible/filtered suppliers to selection (avoid duplicates)
        const newSuppliers = [...selectedSuppliers];
        filteredSuppliers.forEach(s => {
            if (!newSuppliers.some(selected => selected.id === s.id)) {
                newSuppliers.push(s);
            }
        });
        setSelectedSuppliers(newSuppliers);
        form.setValue("fornecedoresIds", newSuppliers.map(s => s.id));
        
        toast({
            title: "✅ Fornecedores selecionados",
            description: `${filteredSuppliers.length} fornecedores adicionados da busca`,
            duration: 1500,
        });
    }
  };
  
  const handleClearAllSuppliers = () => {
    setSelectedSuppliers([]);
    form.setValue("fornecedoresIds", []);
  };

  // Filter suppliers only if search has content
  const filteredSuppliers = supplierSearch.length > 0 
    ? suppliers.filter(supplier =>
        supplier.name.toLowerCase().includes(supplierSearch.toLowerCase()) ||
        (supplier.contact && supplier.contact.toLowerCase().includes(supplierSearch.toLowerCase()))
      )
    : [];

  const tabs = [
    { id: "produtos", label: "Produtos", icon: Package },
    { id: "periodo", label: "Período & Agendamento", icon: Clock },
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
        if (isScheduled && !formValues.dataPlanejada) return false;
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

  // Conteúdo interno do modal (compartilhado entre Dialog e Drawer)
  const modalInnerContent = (
    <>
      {/* Header - Design System */}
      <div className={ds.components.modal.header}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#83E509] flex items-center justify-center shadow-lg shadow-[#83E509]/20">
            <Plus className="h-5 w-5 text-zinc-950 stroke-[2.5]" />
          </div>
          <div>
            <h2 className={ds.components.modal.title}>
              Nova Cotação
            </h2>
            <p className={cn(ds.colors.text.secondary, "mt-1")}>
              Passo {currentTabIndex + 1} de {tabs.length}
            </p>
          </div>
        </div>
        
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => setOpen(false)} 
          className={cn(ds.components.button.ghost, ds.components.button.size.icon)}
        >
          <X className="h-5 w-5" />
          <span className="sr-only">Fechar</span>
        </Button>
      </div>

      {/* Tabs Navigation - Design System Clean Style */}
      <div className="flex-shrink-0 px-6 border-b border-zinc-100 dark:border-zinc-800 bg-transparent">
        <div className={ds.components.tabs.clean.list}>
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const TabIcon = tab.icon;
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  ds.components.tabs.clean.trigger,
                  "flex items-center gap-2",
                  isActive && "data-[state=active]"
                )}
                data-state={isActive ? "active" : "inactive"}
              >
                <TabIcon className="h-4 w-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
      
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin h-12 w-12 border-4 border-teal-200 dark:border-gray-700 border-t-teal-600 dark:border-t-teal-400 rounded-full mx-auto mb-4"></div>
            <p className="text-sm font-medium text-teal-900 dark:text-teal-100">Carregando dados...</p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col h-full overflow-hidden">
          <Form {...form}>
            <form id="quote-form" onSubmit={form.handleSubmit((data) => onSubmit(data, false))} className="flex flex-col h-full overflow-hidden">
              {/* Content Area - Now with more space */}
              <div className="flex-1 overflow-hidden">
                <AnimatedTabContent
                  value={activeTab}
                  activeTab={activeTab}
                    className="h-full"
                  >
                      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full h-full">
                        {/* Produtos Tab */}
                        <TabsContent value="produtos" className="h-full m-0">
                          <div className={cn("h-full p-3 sm:p-4 md:p-6", ds.colors.surface.page)}>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 h-full">
                              {/* Formulário de Adição - Lado Esquerdo */}
                              <Card className={ds.components.card.root}>
                                <CardHeader className={ds.components.card.header}>
                                  <CardTitle className={cn(ds.components.card.title, "flex items-center gap-2")}>
                                    <Plus className="h-5 w-5 text-[#83E509] flex-shrink-0" />
                                    <span className="truncate">Adicionar Produto</span>
                                  </CardTitle>
                                </CardHeader>
                                 <CardContent className={cn(ds.components.card.body, "space-y-4")}>
                                  {/* Seletor de Produto com Autocomplete Dinâmico */}
                                  <div className={ds.components.input.group}>
                                    <label className={ds.components.input.label}>Produto *</label>
                                    <div className="relative group">
                                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 group-focus-within:text-[#83E509] transition-colors" />
                                      <Input
                                        ref={productSearchRef}
                                        placeholder="Digite o nome do produto..."
                                        value={selectedProduct ? selectedProduct.name : productSearch}
                                        onChange={(e) => { 
                                          setProductSearch(e.target.value); 
                                          setSelectedProduct(null); 
                                          setShowProductSuggestions(true);
                                        }}
                                        onFocus={(e) => {
                                            setShowProductSuggestions(true);
                                            handleInputFocus(e);
                                        }}
                                        onBlur={() => {
                                          // Timeout para permitir o clique nas sugestões
                                          setTimeout(() => setShowProductSuggestions(false), 200);
                                        }}
                                        onKeyDown={handleProductKeyDown}
                                        className={cn(ds.components.input.root, "pl-10")}
                                        tabIndex={0}
                                      />
                                      
                                      {/* Lista de Sugestões Autocomplete */}
                                      {showProductSuggestions && products.length > 0 && !selectedProduct && (
                                        <div 
                                          ref={productListRef}
                                          className="absolute z-[100] w-full mt-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-xl max-h-64 overflow-auto animate-in fade-in slide-in-from-top-2 custom-scrollbar"
                                        >
                                          <div className="p-2 space-y-1">
                                            {products.map((product, index) => (
                                              <button
                                                key={product.id}
                                                type="button"
                                                onClick={() => {
                                                  setSelectedProduct(product);
                                                  setProductSearch("");
                                                  setShowProductSuggestions(false);
                                                  setHighlightedProductIndex(-1);
                                                  setTimeout(() => {
                                                    quantityInputRef.current?.focus();
                                                    quantityInputRef.current?.select();
                                                  }, 50);
                                                }}
                                                onMouseEnter={() => setHighlightedProductIndex(index)}
                                                className={cn(
                                                  "w-full px-4 py-2.5 text-left text-sm flex items-center gap-3 transition-all rounded-xl",
                                                  (highlightedProductIndex === index)
                                                    ? "bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400" 
                                                    : "hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300",
                                                )}
                                              >
                                                <div className={cn(
                                                  "w-8 h-8 rounded-lg flex items-center justify-center transition-all shadow-sm",
                                                  highlightedProductIndex === index ? "bg-orange-100 text-orange-600 dark:bg-orange-900/40" : "bg-gray-100 dark:bg-gray-800 text-gray-400"
                                                )}>
                                                  <Package className="h-4 w-4" />
                                                </div>
                                                <div className="flex flex-col min-w-0">
                                                  <span className="font-medium truncate">{product.name}</span>
                                                </div>
                                              </button>
                                            ))}
                                          </div>
                                        </div>
                                      )}

                                      {/* Indicador de Carregamento Dinâmico */}
                                      {isSearchingProducts && (
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                          <Loader2 className="h-4 w-4 animate-spin text-[#83E509]" />
                                        </div>
                                      )}

                                      {/* Estado Vazio/Nenhum Resultado */}
                                      {showProductSuggestions && productSearch.length >= 2 && products.length === 0 && !selectedProduct && !isSearchingProducts && (
                                        <div className={cn(
                                          "absolute z-[100] w-full mt-2 rounded-xl shadow-xl p-6 text-center animate-in fade-in slide-in-from-top-2",
                                          ds.colors.surface.card,
                                          ds.colors.border.default,
                                          "border"
                                        )}>
                                          <Package className={cn("h-8 w-8 mx-auto mb-2 opacity-50", ds.colors.text.muted)} />
                                          <p className={cn(ds.typography.size.xs, ds.typography.weight.bold, ds.colors.text.muted, "uppercase tracking-widest")}>
                                            Nenhum produto encontrado
                                          </p>
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  {/* Quantidade e Unidade */}
                                  <div className="grid grid-cols-2 gap-4">
                                    <div className={ds.components.input.group}>
                                      <label className={ds.components.input.label}>Quantidade *</label>
                                      <Input 
                                        ref={quantityInputRef}
                                        placeholder="Ex: 500" 
                                        type="number" 
                                        value={newProductQuantity}
                                        onChange={(e) => setNewProductQuantity(e.target.value)}
                                        onFocus={handleInputFocus}
                                        onKeyDown={handleQuantityKeyDown}
                                        className={ds.components.input.root}
                                        tabIndex={0}
                                      />
                                    </div>
                                    <div className={ds.components.input.group}>
                                      <label className={ds.components.input.label}>Unidade *</label>
                                      <Select value={newProductUnit} onValueChange={(value) => {
                                        setNewProductUnit(value);
                                        // Auto-foco no botão adicionar após selecionar unidade
                                        setTimeout(() => {
                                          if (selectedProduct && newProductQuantity) {
                                            addButtonRef.current?.focus();
                                          }
                                        }, 50);
                                      }}>
                                        <SelectTrigger 
                                          ref={unitSelectRef}
                                          className={ds.components.input.root}
                                          tabIndex={0}
                                        >
                                          <SelectValue placeholder="Selecione" />
                                        </SelectTrigger>
                                        <SelectContent className={cn(ds.colors.surface.card, ds.colors.border.default, "border")}>
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
                                    ref={addButtonRef}
                                    type="button"
                                    onClick={handleAddNewProduct}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleAddNewProduct();
                                      }
                                    }}
                                    disabled={!selectedProduct || !newProductQuantity || !newProductUnit}
                                    className={cn(ds.components.button.primary, "w-full mt-2")}
                                    tabIndex={0}
                                  >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Adicionar à Lista (Enter)
                                  </Button>
                                  
                                  {/* Dica de atalhos */}
                                  <div className={cn(
                                    "text-center space-y-2 pt-4 mt-4 border-t",
                                    ds.typography.size.xs,
                                    ds.colors.text.secondary,
                                    ds.colors.border.subtle
                                  )}>
                                    <p className={cn(ds.typography.weight.medium, "text-[#83E509]")}>⌨️ Atalhos de Teclado</p>
                                    <div className="flex justify-center gap-4">
                                        <span className="flex items-center gap-1.5">
                                          <kbd className={cn("px-2 py-1 rounded text-[10px]", ds.colors.surface.section, ds.colors.border.default, "border font-mono")}>Tab</kbd> 
                                          <span>Navegar</span>
                                        </span>
                                        <span className="flex items-center gap-1.5">
                                          <kbd className={cn("px-2 py-1 rounded text-[10px]", ds.colors.surface.section, ds.colors.border.default, "border font-mono")}>Enter</kbd> 
                                          <span>Adicionar</span>
                                        </span>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>

                              {/* Lista de Produtos - Lado Direito */}
                              <Card className={ds.components.card.root}>
                                <CardHeader className={ds.components.card.header}>
                                  <CardTitle className={cn(ds.components.card.title, "flex items-center gap-2")}>
                                    <Package className={cn("h-5 w-5 flex-shrink-0", ds.colors.text.secondary)} />
                                    <span className="truncate">Produtos Adicionados ({fields.length})</span>
                                  </CardTitle>
                                </CardHeader>
                                <CardContent className={ds.components.card.body}>
                                  {fields.length === 0 ? (
                                    <div className={cn("text-center py-8", ds.colors.text.secondary)}>
                                      <Package className="h-12 w-12 mx-auto mb-3 opacity-20" />
                                      <p className={ds.typography.weight.medium}>Nenhum produto adicionado</p>
                                      <p className={cn(ds.typography.size.xs, "mt-1")}>Use o formulário para adicionar</p>
                                    </div>
                                  ) : (
                                    <ScrollArea className="h-[400px] pr-2">
                                      <div className="space-y-3">
                                        {fields.map((field, index) => (
                                          <Card key={field.id} className={cn(
                                            ds.components.card.root,
                                            "transition-all group hover:border-[#83E509]/30"
                                          )}>
                                            <div className="h-1 bg-zinc-200 dark:bg-zinc-700 group-hover:bg-[#83E509] transition-colors rounded-t-xl"></div>
                                            <CardContent className="p-3">
                                              <div className="flex items-start justify-between gap-2">
                                                <div className="flex-1 min-w-0">
                                                  <h4 className={cn(ds.typography.weight.semibold, ds.colors.text.primary, ds.typography.size.sm, "truncate")}>
                                                    {form.watch(`produtos.${index}.produtoNome`) || `Produto ${index + 1}`}
                                                  </h4>
                                                  <div className={cn(ds.typography.size.sm, ds.colors.text.secondary, "mt-1 flex items-center gap-2")}>
                                                    <span className={cn(
                                                      ds.typography.fontFamily.mono,
                                                      ds.colors.surface.card,
                                                      ds.colors.border.default,
                                                      "px-1.5 rounded border text-xs"
                                                    )}>
                                                        {form.watch(`produtos.${index}.quantidade`)} {form.watch(`produtos.${index}.unidade`)}
                                                    </span>
                                                  </div>
                                                </div>
                                                <Button
                                                  type="button"
                                                  variant="ghost"
                                                  size="sm"
                                                  onClick={() => remove(index)}
                                                  className={cn(ds.components.button.danger, "h-8 w-8 p-0 flex-shrink-0")}
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
                        <TabsContent value="periodo" className="flex-1 h-full min-h-0 overflow-y-auto p-3 sm:p-4 m-0 pb-20 custom-scrollbar">
                          <Card className={ds.components.card.root}>
                            <CardHeader className={ds.components.card.header}>
                              <CardTitle className={cn(ds.components.card.title, "flex items-center gap-2 sm:gap-3")}>
                                <div className="p-2 rounded-lg bg-[#83E509] text-zinc-950 shadow-lg shadow-[#83E509]/25 flex-shrink-0">
                                  <Clock className="h-4 w-4" />
                                </div>
                                <div className="flex flex-col min-w-0">
                                  <span className="truncate">Período da Cotação</span>
                                  <span className={cn(ds.typography.size.xs, ds.colors.text.secondary, ds.typography.weight.regular, "mt-0.5 truncate")}>
                                    Defina os prazos e agendamento da cotação
                                  </span>
                                </div>
                              </CardTitle>
                            </CardHeader>
                            <CardContent className={cn(ds.components.card.body, "space-y-6")}>

                              {/* Seção de Datas */}
                              <div className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                  <FormField
                                    control={form.control}
                                    name="dataInicio"
                                    render={({ field }) => (
                                      <FormItem className="flex flex-col">
                                        <FormLabel className={ds.components.input.label}>Data de Início *</FormLabel>
                                        <Popover>
                                        <PopoverTrigger asChild>
                                          <FormControl>
                                            <Button
                                              variant="outline"
                                              className={cn(
                                                ds.components.button.secondary,
                                                "w-full justify-start",
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
                                        <PopoverContent className={cn(ds.colors.surface.card, ds.colors.border.default, "w-auto p-0 border")} align="start">
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
                                      <FormLabel className={ds.components.input.label}>Data de Fim *</FormLabel>
                                      <Popover>
                                        <PopoverTrigger asChild>
                                          <FormControl>
                                            <Button
                                              variant="outline"
                                              className={cn(
                                                ds.components.button.secondary,
                                                "w-full justify-start",
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
                                        <PopoverContent className={cn(ds.colors.surface.card, ds.colors.border.default, "w-auto p-0 border")} align="start">
                                          <Calendar
                                            mode="single"
                                            selected={field.value}
                                            onSelect={field.onChange}
                                            disabled={(date) => {
                                              const startDate = form.getValues("dataInicio");
                                              return startDate ? date < startDate : date < new Date();
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

                              {/* Presets rápidos */}
                              <div className="space-y-2">
                                <div className={cn("flex items-center gap-2", ds.typography.size.xs, ds.colors.text.secondary)}>
                                  <Zap className="h-3 w-3" />
                                  <span className={ds.typography.weight.medium}>Atalhos Rápidos:</span>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      const hoje = new Date();
                                      form.setValue("dataInicio", hoje);
                                      form.setValue("dataFim", hoje);
                                      toast({ title: "✅ Período definido", description: "Hoje (início e fim no mesmo dia)", duration: 1500 });
                                    }}
                                    className={cn(ds.components.button.secondary, "h-10 text-xs font-semibold")}
                                  >
                                    <Zap className="h-3 w-3 mr-1" />
                                    Hoje
                                  </Button>
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
                                      toast({ title: "✅ Período definido", description: "3 dias", duration: 1500 });
                                    }}
                                    className={cn(ds.components.button.secondary, "h-10 text-xs font-semibold")}
                                  >
                                    <Clock className="h-3 w-3 mr-1" />
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
                                      toast({ title: "✅ Período definido", description: "7 dias (recomendado)", duration: 1500 });
                                    }}
                                    className={cn(ds.components.button.secondary, "h-10 text-xs font-semibold")}
                                  >
                                    <Zap className="h-3 w-3 mr-1" />
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
                                      toast({ title: "✅ Período definido", description: "14 dias", duration: 1500 });
                                    }}
                                    className={cn(ds.components.button.secondary, "h-10 text-xs font-semibold")}
                                  >
                                    <Clock className="h-3 w-3 mr-1" />
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
                                      toast({ title: "✅ Período definido", description: "30 dias", duration: 1500 });
                                    }}
                                    className={cn(ds.components.button.secondary, "h-10 text-xs font-semibold")}
                                  >
                                    <Clock className="h-3 w-3 mr-1" />
                                    30 dias
                                  </Button>
                                </div>
                              </div>
                              </div>

                              {/* Separator com estilo visual */}
                              <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                  <span className={cn("w-full border-t", ds.colors.border.default)} />
                                </div>
                                <div className={cn("relative flex justify-center", ds.typography.size.xs, "uppercase")}>
                                  <span className={cn(ds.colors.surface.card, "px-2", ds.colors.text.secondary, ds.typography.weight.medium, "tracking-wider")}>
                                    Opções Avançadas
                                  </span>
                                </div>
                              </div>

                              {/* Seção de Agendamento */}
                              <div className={cn(
                                "rounded-xl border transition-all duration-300 overflow-hidden",
                                isScheduled 
                                  ? "bg-amber-50/50 dark:bg-amber-900/10 border-amber-200/60 dark:border-amber-800/30 shadow-sm" 
                                  : "bg-gray-50/50 dark:bg-gray-800/30 border-gray-200/60 dark:border-gray-700/30"
                              )}>
                                <div className="p-4">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                      <div className={cn(
                                        "p-2 rounded-lg transition-colors",
                                        isScheduled ? "bg-amber-100 text-amber-600" : "bg-gray-200 text-gray-500"
                                      )}>
                                        <Zap className="h-4 w-4" />
                                      </div>
                                      <div className="flex flex-col">
                                        <label className="text-sm font-semibold text-gray-900 dark:text-gray-100 cursor-pointer select-none" onClick={() => {
                                            const newValue = !isScheduled;
                                            setIsScheduled(newValue);
                                            if (!newValue) {
                                              form.setValue("dataPlanejada", undefined);
                                            }
                                        }}>
                                          Agendar Cotação
                                        </label>
                                        <span className="text-xs text-gray-500 dark:text-gray-400">
                                          Programar ativação automática para uma data futura
                                        </span>
                                      </div>
                                    </div>
                                    <Switch
                                      checked={isScheduled}
                                      onCheckedChange={(checked) => {
                                        setIsScheduled(checked);
                                        if (!checked) {
                                          form.setValue("dataPlanejada", undefined);
                                        }
                                      }}
                                      className="data-[state=checked]:bg-amber-500"
                                    />
                                  </div>
                                  
                                  {isScheduled && (
                                    <div className="mt-4 pt-4 border-t border-amber-200/40 dark:border-amber-800/20 animate-in slide-in-from-top-2 fade-in duration-300">
                                      <div className="grid grid-cols-1 gap-4">
                                        <FormField
                                          control={form.control}
                                          name="dataPlanejada"
                                          render={({ field }) => (
                                            <FormItem className="flex flex-col">
                                              <FormLabel className="text-amber-900 dark:text-amber-200">Data de Ativação</FormLabel>
                                              <Popover>
                                                <PopoverTrigger asChild>
                                                  <FormControl>
                                                    <Button
                                                      variant="outline"
                                                      className={cn(
                                                        "w-full pl-3 text-left font-normal border-amber-200 dark:border-amber-800 bg-white dark:bg-gray-950",
                                                        !field.value && "text-muted-foreground"
                                                      )}
                                                    >
                                                      {field.value ? (
                                                        format(field.value, "dd/MM/yyyy", { locale: ptBR })
                                                      ) : (
                                                        <span>Selecione a data</span>
                                                      )}
                                                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50 text-amber-600" />
                                                    </Button>
                                                  </FormControl>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0 bg-white/95 dark:bg-gray-950/95 backdrop-blur-xl border-amber-200 dark:border-amber-800" align="start">
                                                  <Calendar
                                                    mode="single"
                                                    selected={field.value}
                                                    onSelect={field.onChange}
                                                    disabled={(date) => {
                                                      const startDate = form.getValues("dataInicio");
                                                      return startDate ? date < startDate : date < new Date();
                                                    }}
                                                    initialFocus
                                                    className="pointer-events-auto"
                                                  />
                                                </PopoverContent>
                                              </Popover>
                                              <FormMessage />
                                              <p className="text-xs text-amber-700 dark:text-amber-300/80 mt-1">
                                                A cotação ficará visível mas inativa até esta data.
                                              </p>
                                            </FormItem>
                                          )}
                                        />
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Dicas compactas - Sempre visíveis agora, mas adaptadas */}
                              <div className="bg-blue-50/30 dark:bg-blue-900/10 border border-blue-200/40 dark:border-blue-800/20 backdrop-blur-sm rounded-lg p-3">
                                <div className="flex items-center gap-2 mb-2">
                                  <div className="w-5 h-5 rounded bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
                                    <span className="text-white text-xs">💡</span>
                                  </div>
                                  <h4 className="font-bold text-blue-900 dark:text-blue-300 text-xs">Dicas de Planejamento</h4>
                                </div>
                                <ul className="text-xs text-blue-800 dark:text-blue-300 space-y-1">
                                  <li>• Cotações urgentes: 3-5 dias de prazo</li>
                                  <li>• Compras planejadas: Use o agendamento para organizar a semana</li>
                                  <li>• Grandes volumes: Mínimo de 7 dias para negociação</li>
                                </ul>
                              </div>
                            </CardContent>
                          </Card>
                        </TabsContent>

                        {/* Fornecedores Tab - Layout Master-Detail Responsivo */}
                        <TabsContent value="fornecedores" className="flex-1 h-full min-h-0 overflow-hidden p-0 m-0">
                          <div className={cn("flex flex-col lg:flex-row h-full relative", ds.colors.surface.page)}>
                            
                            {/* Lado Esquerdo: Lista de Fornecedores */}
                            {/* Mobile: Oculta se tiver detalhe aberto. Desktop: Sempre visível (7/12) */}
                            <div className={cn(
                              "flex-col h-full overflow-hidden transition-all duration-300",
                              ds.colors.surface.card,
                              ds.colors.border.default,
                              "border-r",
                              focusedSupplierId ? "hidden lg:flex lg:w-7/12" : "flex w-full lg:w-7/12"
                            )}>
                              {/* Header Fixo */}
                              <div className={cn(
                                "p-6 space-y-4 z-10",
                                ds.colors.border.default,
                                "border-b"
                              )}>
                                <div className="flex items-center justify-between">
                                  <div className={cn("flex items-center gap-3", ds.colors.text.primary)}>
                                    <Building2 className={cn("h-5 w-5", ds.colors.text.secondary)} />
                                    <span className={cn(ds.typography.weight.bold, ds.typography.size.base)}>Catálogo de Fornecedores</span>
                                  </div>
                                  
                                  {/* Botão Selecionar Todos - Só visível se houver resultados de busca */}
                                  {supplierSearch.length > 0 && filteredSuppliers.length > 0 && (
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={handleSelectAllSuppliers}
                                      className={cn(ds.components.button.ghost, "text-[#83E509] hover:text-[#72cc00]")}
                                    >
                                      <Check className="h-3 w-3 mr-1.5" />
                                      {filteredSuppliers.every(s => selectedSuppliers.some(sel => sel.id === s.id)) 
                                        ? "Desmarcar Resultados" 
                                        : "Selecionar Resultados"}
                                    </Button>
                                  )}
                                </div>
                                
                                <div className="relative group">
                                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 group-focus-within:text-[#83E509] transition-colors" />
                                  <Input
                                    placeholder="Buscar por nome, contato ou e-mail..."
                                    value={supplierSearch}
                                    onChange={(e) => setSupplierSearch(e.target.value)}
                                    onFocus={handleInputFocus}
                                    className={cn(ds.components.input.root, "pl-10")}
                                  />
                                </div>
                              </div>

                              {/* Lista Scrollável */}
                              <div className="flex-1 overflow-y-auto p-4 custom-scrollbar pb-20">
                                
                                {/* Estado Vazio (Sem busca e sem selecionados) */}
                                {supplierSearch.length === 0 && selectedSuppliers.length === 0 && (
                                  <div className={cn(
                                    "flex flex-col items-center justify-center h-full text-center p-8 space-y-4",
                                    ds.colors.text.secondary
                                  )}>
                                    <div className={cn(
                                      "w-16 h-16 rounded-full flex items-center justify-center",
                                      ds.colors.surface.section
                                    )}>
                                      <Search className="h-8 w-8 opacity-30" />
                                    </div>
                                    <div className="space-y-2">
                                      <p className={cn(ds.typography.size.base, ds.typography.weight.medium)}>Digite para buscar fornecedores</p>
                                      <p className={cn(ds.typography.size.xs, ds.colors.text.muted)}>Seus fornecedores selecionados também aparecerão aqui</p>
                                    </div>
                                  </div>
                                )}
                                
                                {/* Resultados da Busca */}
                                {supplierSearch.length > 0 && (
                                  <div className="mb-6">
                                    <h3 className={cn(
                                      ds.typography.size.xs,
                                      ds.typography.weight.bold,
                                      ds.colors.text.muted,
                                      "uppercase tracking-widest px-3 mb-3"
                                    )}>
                                      Resultados da Busca
                                    </h3>
                                    
                                    {filteredSuppliers.length === 0 ? (
                                      <div className={cn(
                                        "text-center p-6 rounded-xl mx-2 border border-dashed",
                                        ds.colors.surface.section,
                                        ds.colors.border.subtle,
                                        ds.colors.text.secondary,
                                        ds.typography.size.sm
                                      )}>
                                        Nenhum fornecedor encontrado para "{supplierSearch}"
                                      </div>
                                    ) : (
                                      <div className="space-y-2">
                                        {filteredSuppliers.map((supplier) => {
                                          const isSelected = selectedSuppliers.some(s => s.id === supplier.id);
                                          const isFocused = focusedSupplierId === supplier.id;

                                          return (
                                            <div
                                              key={supplier.id}
                                              onClick={() => setFocusedSupplierId(supplier.id)}
                                              className={cn(
                                                "group flex items-center gap-4 p-4 rounded-xl border transition-all cursor-pointer relative overflow-hidden",
                                                isFocused 
                                                  ? cn(
                                                      "border-[#83E509]/30 shadow-sm",
                                                      ds.colors.surface.section
                                                    )
                                                  : cn(
                                                      ds.colors.surface.card,
                                                      ds.colors.border.subtle,
                                                      ds.colors.surface.hover
                                                    )
                                              )}
                                            >
                                              {/* Selection Indicator Bar */}
                                              {isFocused && (
                                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#83E509]" />
                                              )}

                                              <div className="flex-shrink-0 relative z-10" onClick={(e) => e.stopPropagation()}>
                                                <div 
                                                  className={cn(
                                                    "w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all cursor-pointer",
                                                    isSelected
                                                      ? "bg-[#83E509] border-[#83E509] text-zinc-950"
                                                      : cn(
                                                          ds.colors.border.default,
                                                          ds.colors.surface.card,
                                                          "hover:border-[#83E509]/50"
                                                        )
                                                  )}
                                                  onClick={() => handleSupplierSelect(supplier)}
                                                >
                                                  {isSelected && <Check className="h-4 w-4" />}
                                                </div>
                                              </div>

                                              <div className="flex-1 min-w-0 z-10">
                                                <div className="flex items-center justify-between mb-1">
                                                  <span className={cn(
                                                    ds.typography.weight.semibold,
                                                    ds.typography.size.sm,
                                                    ds.colors.text.primary,
                                                    "truncate"
                                                  )}>
                                                    {supplier.name}
                                                  </span>
                                                  {isSelected && (
                                                    <span className={cn(
                                                      ds.typography.size.xs,
                                                      ds.typography.weight.bold,
                                                      "uppercase tracking-wider px-2 py-0.5 rounded-md",
                                                      "bg-[#83E509]/10 text-[#83E509]"
                                                    )}>
                                                      Selecionado
                                                    </span>
                                                  )}
                                                </div>
                                                <div className={cn(
                                                  "flex items-center gap-3",
                                                  ds.typography.size.xs,
                                                  ds.colors.text.secondary
                                                )}>
                                                  {supplier.contact && (
                                                    <span className="flex items-center gap-1.5 truncate">
                                                      <Phone className="h-3 w-3" />
                                                      {supplier.contact}
                                                    </span>
                                                  )}
                                                </div>
                                              </div>

                                              <ChevronRight className={cn(
                                                "h-5 w-5 transition-transform lg:hidden",
                                                ds.colors.text.muted,
                                                isFocused && "text-[#83E509] translate-x-1"
                                              )} />
                                            </div>
                                          );
                                        })}
                                      </div>
                                    )}
                                  </div>
                                )}
                                
                                {/* Lista de Selecionados - Sempre visível se houver selecionados */}
                                {selectedSuppliers.length > 0 && (
                                  <div className="mb-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                                    <div className="flex items-center justify-between mb-3 px-3">
                                      <h3 className={cn(
                                        ds.typography.size.xs,
                                        ds.typography.weight.bold,
                                        "text-[#83E509] uppercase tracking-widest"
                                      )}>
                                        Selecionados ({selectedSuppliers.length})
                                      </h3>
                                      <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        onClick={handleClearAllSuppliers}
                                        className={cn(ds.components.button.danger, "h-7 px-3 text-xs")}
                                      >
                                        Limpar
                                      </Button>
                                    </div>
                                    
                                    <div className="space-y-2">
                                      {selectedSuppliers.map((supplier) => {
                                        const isFocused = focusedSupplierId === supplier.id;
                                        
                                        return (
                                          <div
                                            key={`selected-${supplier.id}`}
                                            onClick={() => setFocusedSupplierId(supplier.id)}
                                            className={cn(
                                              "group flex items-center gap-4 p-4 rounded-xl border transition-all cursor-pointer relative overflow-hidden",
                                              "bg-[#83E509]/5",
                                              isFocused 
                                                ? "border-[#83E509]/40 shadow-sm" 
                                                : cn(
                                                    "border-[#83E509]/20",
                                                    "hover:bg-[#83E509]/10"
                                                  )
                                            )}
                                          >
                                            <div className="flex-shrink-0 relative z-10" onClick={(e) => e.stopPropagation()}>
                                              <div 
                                                className={cn(
                                                  "w-6 h-6 rounded-md border-2 bg-[#83E509] border-[#83E509] text-zinc-950 flex items-center justify-center transition-all cursor-pointer",
                                                  "hover:bg-red-500 hover:border-red-500 hover:text-white"
                                                )}
                                                onClick={() => handleSupplierRemove(supplier.id)}
                                              >
                                                <div className="group-hover:hidden"><Check className="h-4 w-4" /></div>
                                                <div className="hidden group-hover:block"><X className="h-4 w-4" /></div>
                                              </div>
                                            </div>

                                            <div className="flex-1 min-w-0 z-10">
                                              <div className="flex items-center justify-between mb-1">
                                                <span className={cn(
                                                  ds.typography.weight.semibold,
                                                  ds.typography.size.sm,
                                                  ds.colors.text.primary,
                                                  "truncate"
                                                )}>
                                                  {supplier.name}
                                                </span>
                                              </div>
                                              <div className={cn(
                                                "flex items-center gap-3",
                                                ds.typography.size.xs,
                                                ds.colors.text.secondary
                                              )}>
                                                {supplier.contact && (
                                                  <span className="flex items-center gap-1.5 truncate">
                                                    <Phone className="h-3 w-3" />
                                                    {supplier.contact}
                                                  </span>
                                                )}
                                              </div>
                                            </div>
                                            
                                            <ChevronRight className={cn(
                                              "h-5 w-5 transition-transform lg:hidden",
                                              ds.colors.text.muted,
                                              isFocused && "text-[#83E509] translate-x-1"
                                            )} />
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Lado Direito: Painel de Detalhes (Desktop & Mobile) */}
                            {/* Mobile: Visível se tiver detalhe aberto. Desktop: Sempre visível (5/12) */}
                            <div className={cn(
                              "flex-col h-full transition-all duration-300",
                              ds.colors.surface.section,
                              ds.colors.border.default,
                              "border-l",
                              focusedSupplierId ? "flex w-full lg:w-5/12" : "hidden lg:flex lg:w-5/12"
                            )}>
                              {focusedSupplierId ? (
                                (() => {
                                  const supplier = suppliers.find(s => s.id === focusedSupplierId);
                                  if (!supplier) return null;
                                  const isSelected = selectedSuppliers.some(s => s.id === supplier.id);

                                  return (
                                    <div className={cn(
                                      "flex flex-col h-full animate-in fade-in slide-in-from-right-4 duration-300",
                                      "lg:bg-transparent"
                                    )}>
                                      {/* Header do Painel */}
                                      <div className={cn(
                                        "p-6 flex items-center gap-4",
                                        ds.colors.border.default,
                                        "border-b"
                                      )}>
                                        {/* Botão Voltar (Mobile Only) */}
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className={cn(ds.components.button.ghost, "lg:hidden h-9 w-9")}
                                          onClick={() => setFocusedSupplierId(null)}
                                        >
                                          <ArrowLeft className="h-5 w-5" />
                                        </Button>
                                        
                                        <div className="flex-1 flex items-center justify-between gap-4">
                                          <div className="flex items-center gap-3">
                                            <div className={cn(
                                              "w-10 h-10 rounded-xl flex items-center justify-center shadow-sm",
                                              "bg-[#83E509] text-zinc-950",
                                              ds.typography.weight.bold,
                                              ds.typography.size.sm
                                            )}>
                                              {supplier.name.substring(0, 2).toUpperCase()}
                                            </div>
                                            <h2 className={cn(
                                              ds.typography.size.lg,
                                              ds.typography.weight.bold,
                                              ds.colors.text.primary,
                                              "leading-tight truncate"
                                            )}>
                                              {supplier.name}
                                            </h2>
                                          </div>
                                        </div>
                                      </div>
                                      
                                      {/* Ação Principal (Separada para Mobile) */}
                                      <div className={cn(
                                        "px-6 py-4",
                                        ds.colors.border.default,
                                        "border-b lg:border-0"
                                      )}>
                                         <Button
                                            size="sm"
                                            variant={isSelected ? "outline" : "default"}
                                            onClick={() => isSelected ? handleSupplierRemove(supplier.id) : handleSupplierSelect(supplier)}
                                            className={cn(
                                              "w-full lg:w-auto",
                                              isSelected 
                                                ? ds.components.button.danger
                                                : ds.components.button.primary
                                            )}
                                          >
                                            {isSelected ? (
                                              <>
                                                <X className="h-4 w-4 mr-2" />
                                                Remover da Cotação
                                              </>
                                            ) : (
                                              <>
                                                <Plus className="h-4 w-4 mr-2" />
                                                Adicionar à Cotação
                                              </>
                                            )}
                                          </Button>
                                      </div>

                                      {/* Corpo do Painel */}
                                      <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                                        {/* Info Cards */}
                                        <div className="grid grid-cols-2 gap-4">
                                          <div className={cn(
                                            "p-4 rounded-xl border shadow-sm",
                                            ds.colors.surface.card,
                                            ds.colors.border.default
                                          )}>
                                            <div className={cn(
                                              "flex items-center gap-2 mb-2",
                                              ds.typography.size.xs,
                                              ds.colors.text.secondary
                                            )}>
                                              <History className="h-4 w-4" />
                                              Última Cotação
                                            </div>
                                            <p className={cn(
                                              ds.typography.weight.semibold,
                                              ds.typography.size.sm,
                                              ds.colors.text.primary
                                            )}>--</p>
                                          </div>
                                          <div className={cn(
                                            "p-4 rounded-xl border shadow-sm",
                                            ds.colors.surface.card,
                                            ds.colors.border.default
                                          )}>
                                            <div className={cn(
                                              "flex items-center gap-2 mb-2",
                                              ds.typography.size.xs,
                                              ds.colors.text.secondary
                                            )}>
                                              <Star className="h-4 w-4 text-amber-500" />
                                              Avaliação
                                            </div>
                                            <p className={cn(
                                              ds.typography.weight.semibold,
                                              ds.typography.size.sm,
                                              ds.colors.text.primary
                                            )}>Novo</p>
                                          </div>
                                        </div>

                                        {/* Contact Info */}
                                        <div className="space-y-4">
                                          <h4 className={cn(
                                            ds.typography.size.xs,
                                            ds.typography.weight.bold,
                                            "uppercase tracking-wider",
                                            ds.colors.text.muted
                                          )}>
                                            Informações de Contato
                                          </h4>
                                          <div className="space-y-3">
                                            <div className={cn(
                                              "flex items-start gap-3 p-4 rounded-xl border transition-colors",
                                              ds.colors.surface.card,
                                              ds.colors.border.subtle,
                                              ds.colors.surface.hover
                                            )}>
                                              <Phone className={cn("h-5 w-5 mt-0.5", ds.colors.text.secondary)} />
                                              <div className="flex-1 min-w-0">
                                                <p className={cn(
                                                  ds.typography.size.sm,
                                                  ds.typography.weight.medium,
                                                  ds.colors.text.primary
                                                )}>Telefone / WhatsApp</p>
                                                <p className={cn(
                                                  ds.typography.size.sm,
                                                  ds.colors.text.secondary,
                                                  "truncate"
                                                )}>{supplier.contact || "Não informado"}</p>
                                              </div>
                                            </div>
                                            <div className={cn(
                                              "flex items-start gap-3 p-4 rounded-xl border transition-colors",
                                              ds.colors.surface.card,
                                              ds.colors.border.subtle,
                                              ds.colors.surface.hover
                                            )}>
                                              <Mail className={cn("h-5 w-5 mt-0.5", ds.colors.text.secondary)} />
                                              <div className="flex-1 min-w-0">
                                                <p className={cn(
                                                  ds.typography.size.sm,
                                                  ds.typography.weight.medium,
                                                  ds.colors.text.primary
                                                )}>E-mail</p>
                                                <p className={cn(
                                                  ds.typography.size.sm,
                                                  ds.colors.text.secondary,
                                                  "truncate"
                                                )}>{"Não informado"}</p>
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })()
                              ) : (
                                <div className={cn(
                                  "flex flex-col items-center justify-center h-full text-center p-8 space-y-4",
                                  ds.colors.text.secondary
                                )}>
                                  <div className={cn(
                                    "w-20 h-20 rounded-full flex items-center justify-center animate-pulse",
                                    ds.colors.surface.section
                                  )}>
                                    <MousePointerClick className="h-10 w-10 opacity-30" />
                                  </div>
                                  <div className="space-y-2">
                                    <h3 className={cn(
                                      ds.typography.size.lg,
                                      ds.typography.weight.semibold,
                                      ds.colors.text.primary
                                    )}>Detalhes do Fornecedor</h3>
                                    <p className={cn(
                                      ds.typography.size.sm,
                                      "max-w-[240px] mx-auto"
                                    )}>
                                      Clique em um fornecedor da lista para ver informações detalhadas e histórico.
                                    </p>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </TabsContent>


                        {/* Detalhes Tab */}
                        <TabsContent value="detalhes" className="flex-1 m-0 min-h-0">
                          <ScrollArea className={cn("h-full w-full [&>div>div[style]]:!pr-0", ds.colors.surface.page)}>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6 pb-24">
                              {/* Coluna Esquerda - Formulário de Detalhes */}
                              <div className="space-y-6">
                                <Card className={ds.components.card.root}>
                                  <CardHeader className={ds.components.card.header}>
                                    <CardTitle className={cn(ds.components.card.title, "flex items-center gap-2")}>
                                      <FileText className="h-4 w-4 text-[#83E509] flex-shrink-0" />
                                      <span className="truncate">Detalhes Adicionais</span>
                                    </CardTitle>
                                  </CardHeader>
                                  <CardContent className={cn(ds.components.card.body, "space-y-4")}>
                                    <FormField
                                      control={form.control}
                                      name="observacoes"
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormLabel className={ds.components.input.label}>Observações</FormLabel>
                                          <FormControl>
                                            <Textarea 
                                              placeholder="Adicione observações, especificações técnicas, condições especiais ou qualquer informação relevante para os fornecedores..." 
                                              className={cn(ds.components.input.root, "resize-none min-h-[160px]")}
                                              onFocus={handleInputFocus}
                                              {...field} 
                                            />
                                          </FormControl>
                                          <p className={cn(ds.typography.size.xs, ds.colors.text.secondary)}>
                                            Estas informações serão enviadas junto com a cotação para todos os fornecedores
                                          </p>
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />
                                  </CardContent>
                                </Card>
                              </div>

                              {/* Coluna Direita - Resumo da Cotação */}
                              <div className="space-y-6">
                                {/* Estatísticas Principais */}
                                <Card className={ds.components.card.root}>
                                  <CardHeader className={ds.components.card.header}>
                                    <CardTitle className={cn(ds.components.card.title, "flex items-center gap-2")}>
                                      <LayoutList className="h-4 w-4 text-[#83E509] flex-shrink-0" />
                                      <span className="truncate">Estatísticas</span>
                                    </CardTitle>
                                  </CardHeader>
                                  <CardContent className={ds.components.card.body}>
                                    <div className="grid grid-cols-2 gap-4">
                                      <div className={cn(
                                        ds.colors.surface.section,
                                        ds.colors.border.subtle,
                                        "border rounded-lg p-4 text-center"
                                      )}>
                                        <div className={cn(ds.typography.size["2xl"], ds.typography.weight.bold, "text-[#83E509] mb-1")}>{fields.length}</div>
                                        <div className={cn(ds.typography.size.xs, ds.colors.text.secondary, ds.typography.weight.medium)}>Produtos</div>
                                      </div>
                                      <div className={cn(
                                        ds.colors.surface.section,
                                        ds.colors.border.subtle,
                                        "border rounded-lg p-4 text-center"
                                      )}>
                                        <div className={cn(ds.typography.size["2xl"], ds.typography.weight.bold, "text-[#83E509] mb-1")}>{selectedSuppliers.length}</div>
                                        <div className={cn(ds.typography.size.xs, ds.colors.text.secondary, ds.typography.weight.medium)}>Fornecedores</div>
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>

                                {/* Detalhes do Período */}
                                <Card className={ds.components.card.root}>
                                  <CardHeader className={ds.components.card.header}>
                                    <CardTitle className={cn(ds.components.card.title, "flex items-center gap-2")}>
                                      <Clock className="h-4 w-4 text-[#83E509] flex-shrink-0" />
                                      <span className="truncate">Período da Cotação</span>
                                    </CardTitle>
                                  </CardHeader>
                                  <CardContent className={ds.components.card.body}>
                                    <div className="flex justify-between items-center">
                                      <span className={cn(ds.typography.size.sm, ds.colors.text.secondary)}>Período:</span>
                                      <span className={cn(ds.typography.size.sm, ds.typography.weight.semibold, ds.colors.text.primary)}>
                                        {form.watch("dataInicio") && form.watch("dataFim") 
                                          ? `${format(form.watch("dataInicio"), "dd/MM", { locale: ptBR })} - ${format(form.watch("dataFim"), "dd/MM/yyyy", { locale: ptBR })}`
                                          : "Não definido"
                                        }
                                      </span>
                                    </div>
                                  </CardContent>
                                </Card>

                                {/* Lista de Produtos */}
                                {fields.length > 0 && (
                                  <Card className={ds.components.card.root}>
                                    <CardHeader className={ds.components.card.header}>
                                      <CardTitle className={cn(ds.components.card.title, "flex items-center gap-2")}>
                                        <Package className="h-4 w-4 text-[#83E509] flex-shrink-0" />
                                        <span className="truncate">Produtos Selecionados</span>
                                      </CardTitle>
                                    </CardHeader>
                                    <CardContent className={ds.components.card.body}>
                                      <ScrollArea className="max-h-[200px] [&>div>div[style]]:!pr-0">
                                        <div className="space-y-3 pr-4">
                                          {fields.map((field, index) => (
                                            <div key={field.id} className={cn(
                                              "flex items-center justify-between p-4 rounded-lg border",
                                              ds.colors.surface.section,
                                              ds.colors.border.subtle
                                            )}>
                                              <div className="flex-1 min-w-0">
                                                <p className={cn(
                                                  ds.typography.size.sm,
                                                  ds.typography.weight.semibold,
                                                  ds.colors.text.primary,
                                                  "truncate mb-1"
                                                )}>
                                                  {form.watch(`produtos.${index}.produtoNome`) || "Produto não selecionado"}
                                                </p>
                                                <p className={cn(ds.typography.size.xs, ds.colors.text.secondary)}>
                                                  {form.watch(`produtos.${index}.quantidade`)} {form.watch(`produtos.${index}.unidade`)}
                                                </p>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      </ScrollArea>
                                    </CardContent>
                                  </Card>
                                )}

                                {/* Lista de Fornecedores */}
                                {selectedSuppliers.length > 0 && (
                                  <Card className={ds.components.card.root}>
                                    <CardHeader className={ds.components.card.header}>
                                      <CardTitle className={cn(ds.components.card.title, "flex items-center gap-2")}>
                                        <Building2 className="h-4 w-4 text-[#83E509] flex-shrink-0" />
                                        <span className="truncate">Fornecedores Participantes</span>
                                      </CardTitle>
                                    </CardHeader>
                                    <CardContent className={ds.components.card.body}>
                                      <ScrollArea className="max-h-[180px] [&>div>div[style]]:!pr-0">
                                        <div className="space-y-3 pr-4">
                                          {selectedSuppliers.map((supplier) => (
                                            <div key={supplier.id} className={cn(
                                              "flex items-center gap-3 p-4 rounded-lg border",
                                              ds.colors.surface.section,
                                              ds.colors.border.subtle
                                            )}>
                                              <div className="w-2 h-2 bg-[#83E509] rounded-full flex-shrink-0"></div>
                                              <CapitalizedText className={cn(
                                                ds.typography.size.sm,
                                                ds.typography.weight.semibold,
                                                ds.colors.text.primary,
                                                "truncate"
                                              )}>
                                                {supplier.name}
                                              </CapitalizedText>
                                            </div>
                                          ))}
                                        </div>
                                      </ScrollArea>
                                    </CardContent>
                                  </Card>
                                )}
                              </div>
                            </div>
                          </ScrollArea>
                        </TabsContent>
                      </Tabs>
                  </AnimatedTabContent>
                </div>

                {/* Footer Fixo */}
                <div className={cn(ds.components.modal.footer, "flex-shrink-0")}>
                  <div className="flex gap-2 justify-end">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setOpen(false)}
                      className={ds.components.button.secondary}
                    >
                      Cancelar
                    </Button>
                    
                    {currentTabIndex === tabs.length - 1 ? (
                      <Button 
                        type="submit"
                        disabled={isSubmitting}
                        className={ds.components.button.primary}
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Salvando...
                          </>
                        ) : (
                          <>
                            <Check className="mr-2 h-4 w-4" />
                            Finalizar Cotação
                          </>
                        )}
                      </Button>
                    ) : (
                      <Button 
                        type="button"
                        onClick={handleNext}
                        disabled={!canProceedToNext()}
                        className={ds.components.button.primary}
                      >
                        Próximo
                        <ChevronRight className="ml-2 h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </form>
            </Form>
          </div>
        )}

        {isSubmitting && (
          <div className="absolute inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm z-50 flex items-center justify-center rounded-2xl">
            <div className="text-center space-y-3">
              <div className="animate-spin h-12 w-12 border-4 border-teal-200 dark:border-gray-700 border-t-teal-600 dark:border-t-teal-400 rounded-full mx-auto"></div>
              <p className="text-sm font-medium text-teal-900 dark:text-teal-100">Criando cotação...</p>
            </div>
          </div>
        )}
      </>
    );

  // Mobile: Usar Drawer
  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={setOpen}>
        {trigger && (
          <DrawerTrigger asChild>
            {trigger}
          </DrawerTrigger>
        )}
        <DrawerContent 
          className="rounded-t-2xl p-0 overflow-hidden flex flex-col bg-white dark:bg-gray-950 border-t border-gray-200 dark:border-gray-800"
          style={{ 
            height: keyboardOffset > 0 ? `calc(100vh - ${keyboardOffset}px)` : '95vh',
            maxHeight: keyboardOffset > 0 ? `calc(100vh - ${keyboardOffset}px)` : '95vh',
            paddingBottom: keyboardOffset > 0 ? 0 : 'env(safe-area-inset-bottom, 20px)'
          }}
        >
          <DrawerTitle className="sr-only">Nova Cotação</DrawerTitle>
          {modalInnerContent}
        </DrawerContent>
      </Drawer>
    );
  }

  // Desktop: Usar Dialog
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && (
        <DialogTrigger asChild>
          {trigger}
        </DialogTrigger>
      )}
      <DialogContent 
        hideClose
        className="w-[96vw] sm:w-[92vw] md:w-[90vw] max-w-[900px] h-[90vh] sm:h-[88vh] max-h-[850px] p-0 gap-0 overflow-hidden border border-white/20 dark:border-white/10 shadow-2xl rounded-xl sm:rounded-2xl flex flex-col !bg-white/80 dark:!bg-gray-950/80 backdrop-blur-xl [&>button]:hidden"
        onKeyDown={handleModalKeyDown}
      >
        {modalInnerContent}
      </DialogContent>
    </Dialog>
  );
}
