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
    { id: "periodo_fornecedores", label: "Período & Fornecedores", icon: Clock },
    { id: "detalhes", label: "Detalhes", icon: FileText }
  ];

  const currentTabIndex = tabs.findIndex(tab => tab.id === activeTab);
  const progress = ((currentTabIndex + 1) / tabs.length) * 100;

  const canProceedToNext = () => {
    const formValues = form.getValues();
    switch (activeTab) {
      case "produtos":
        return formValues.produtos.every(p => p.produtoId && p.quantidade && p.unidade);
      case "periodo_fornecedores": {
        const hasPeriod = isScheduled
          ? !!formValues.dataPlanejada
          : !!formValues.dataInicio && !!formValues.dataFim;
        return hasPeriod && selectedSuppliers.length > 0;
      }
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
      {/* Minimal Header & Stepper */}
      <div className="px-6 md:px-8 pt-6 pb-2 flex flex-col gap-5 flex-shrink-0 bg-transparent">
        <div className="flex items-start justify-between">
          <div>
            <h2 className={cn(ds.typography.size["xl"], ds.typography.weight.semibold, ds.colors.text.primary, "tracking-tight")}>
              Nova Cotação
            </h2>
            <p className={cn(ds.colors.text.secondary, "mt-1.5", ds.typography.size.sm)}>
              Passo {currentTabIndex + 1}: <span className={ds.typography.weight.medium}>{tabs[currentTabIndex]?.label}</span>
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setOpen(false)} className={cn(ds.components.button.ghost, "h-8 w-8 rounded-full")}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          {tabs.map((tab, idx) => {
            const isCompleted = currentTabIndex > idx;
            const isActive = currentTabIndex === idx;
            return (
              <div key={tab.id} className="flex-1 flex flex-col gap-2">
                <div
                  className={cn(
                    "h-1.5 rounded-full transition-all duration-300",
                    isCompleted ? "bg-brand" : isActive ? "bg-brand/60" : "bg-zinc-100 dark:bg-zinc-800/50"
                  )}
                />
              </div>
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
                          <div className="flex flex-col space-y-4">
                            <div className="pb-1 border-b border-zinc-100 dark:border-zinc-800/50">
                              <h3 className={cn(ds.typography.size.base, ds.typography.weight.medium, ds.colors.text.primary, "flex items-center gap-2")}>
                                <Plus className="h-5 w-5 text-brand flex-shrink-0" />
                                <span className="truncate">Adicionar Produto</span>
                              </h3>
                            </div>
                            <div className="space-y-4 pt-2">
                              {/* Seletor de Produto com Autocomplete Dinâmico */}
                              <div className={ds.components.input.group}>
                                <label className={ds.components.input.label}>Produto *</label>
                                <div className="relative group">
                                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 group-focus-within:text-brand transition-colors" />
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
                                      className={cn(
                                        "absolute z-[100] w-full mt-2 rounded-2xl shadow-xl max-h-64 overflow-auto animate-in fade-in slide-in-from-top-2 custom-scrollbar",
                                        ds.colors.surface.card,
                                        ds.colors.border.default,
                                        "border"
                                      )}
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
                                                ? "bg-brand/10 text-brand"
                                                : cn(
                                                  ds.colors.surface.hover,
                                                  ds.colors.text.primary
                                                ),
                                            )}
                                          >
                                            <div className={cn(
                                              "w-8 h-8 rounded-lg flex items-center justify-center transition-all shadow-sm",
                                              highlightedProductIndex === index
                                                ? "bg-brand/20 text-brand"
                                                : cn(
                                                  ds.colors.surface.section,
                                                  ds.colors.text.secondary
                                                )
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
                                      <Loader2 className="h-4 w-4 animate-spin text-brand" />
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
                                <p className={cn(ds.typography.weight.medium, "text-brand")}>⌨️ Atalhos de Teclado</p>
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
                            </div>
                          </div>

                          {/* Lista de Produtos - Lado Direito */}
                          <div className="flex flex-col space-y-4">
                            <div className="pb-1 border-b border-zinc-100 dark:border-zinc-800/50">
                              <h3 className={cn(ds.typography.size.base, ds.typography.weight.medium, ds.colors.text.primary, "flex items-center gap-2")}>
                                <Package className={cn("h-5 w-5 flex-shrink-0", ds.colors.text.secondary)} />
                                <span className="truncate">Produtos Adicionados ({fields.length})</span>
                              </h3>
                            </div>
                            <div className="space-y-4 pt-2">
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
                                      <div key={field.id} className={cn(
                                        ds.colors.surface.card,
                                        ds.colors.border.subtle,
                                        "border rounded-xl transition-all hover:border-brand/30"
                                      )}>

                                        <div className="p-3">
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
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </ScrollArea>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </TabsContent>

                    {/* Periodo & Fornecedores - Tab Unificada */}
                    <TabsContent value="periodo_fornecedores" className="flex-1 h-full min-h-0 overflow-hidden m-0 p-0">
                      <div className="flex flex-col lg:flex-row h-full">

                        {/* Esquerda: Periodo */}
                        <div className={cn(
                          "flex flex-col gap-5 p-5 sm:p-6 lg:w-[320px] xl:w-[360px] flex-shrink-0 overflow-y-auto pb-24 custom-scrollbar",
                          "lg:border-r border-zinc-100 dark:border-zinc-800/50",
                          ds.colors.surface.card
                        )}>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-brand flex-shrink-0" />
                            <span className={cn(ds.typography.size.base, ds.typography.weight.semibold, ds.colors.text.primary)}>
                              Prazo da Cotação
                            </span>
                          </div>

                          {/* Toggle Agendamento */}
                          <div className={cn(
                            "flex items-center justify-between p-3 rounded-xl border",
                            ds.colors.surface.section,
                            ds.colors.border.subtle
                          )}>
                            <div>
                              <p className={cn(ds.typography.size.sm, ds.typography.weight.medium, ds.colors.text.primary)}>
                                Agendar cotação
                              </p>
                              <p className={cn(ds.typography.size.xs, ds.colors.text.secondary)}>
                                {isScheduled ? "Será criada como planejada" : "Inicia imediatamente"}
                              </p>
                            </div>
                            <Switch
                              checked={isScheduled}
                              onCheckedChange={(checked) => {
                                setIsScheduled(checked);
                                if (!checked) form.setValue("dataPlanejada", undefined);
                              }}
                              className="data-[state=checked]:bg-brand"
                            />
                          </div>

                          {isScheduled ? (
                            <FormField
                              control={form.control}
                              name="dataPlanejada"
                              render={({ field }) => (
                                <FormItem className="flex flex-col">
                                  <FormLabel className={ds.components.input.label}>
                                    Data de Ativação *
                                  </FormLabel>
                                  <Popover>
                                    <PopoverTrigger asChild>
                                      <FormControl>
                                        <Button
                                          variant="outline"
                                          className={cn(
                                            ds.components.button.secondary,
                                            "w-full justify-start font-normal",
                                            !field.value && "text-muted-foreground"
                                          )}
                                        >
                                          {field.value
                                            ? format(field.value, "dd/MM/yyyy", { locale: ptBR })
                                            : <span>Selecione a data</span>}
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
                                          const today = new Date();
                                          today.setHours(0, 0, 0, 0);
                                          return date < today;
                                        }}
                                        initialFocus
                                      />
                                    </PopoverContent>
                                  </Popover>
                                  <FormMessage />
                                  <p className={cn(ds.typography.size.xs, "text-amber-600 dark:text-amber-400 mt-1")}>
                                    Cotação ficará inativa até esta data.
                                  </p>
                                </FormItem>
                              )}
                            />
                          ) : (
                            <div className="flex flex-col gap-4">
                              {/* Atalhos rapidos */}
                              <div className="grid grid-cols-4 gap-1.5">
                                {[
                                  { label: "Hoje", days: 0 },
                                  { label: "3d", days: 3 },
                                  { label: "7d", days: 7 },
                                  { label: "15d", days: 15 },
                                ].map(({ label, days }) => (
                                  <button
                                    key={label}
                                    type="button"
                                    onClick={() => {
                                      const hoje = new Date();
                                      const fim = new Date(hoje);
                                      fim.setDate(hoje.getDate() + days);
                                      form.setValue("dataInicio", hoje);
                                      form.setValue("dataFim", fim);
                                    }}
                                    className={cn(
                                      "h-8 rounded-lg text-xs font-medium border transition-colors",
                                      days === 7
                                        ? "border-brand/50 bg-brand/10 text-brand"
                                        : cn(ds.colors.surface.section, ds.colors.border.subtle, ds.colors.text.secondary, "hover:border-brand/30 hover:text-brand")
                                    )}
                                  >
                                    {label}
                                  </button>
                                ))}
                              </div>

                              {/* Campos de data */}
                              <div className="grid grid-cols-2 gap-3">
                                <FormField
                                  control={form.control}
                                  name="dataInicio"
                                  render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                      <FormLabel className={ds.components.input.label}>Início *</FormLabel>
                                      <Popover>
                                        <PopoverTrigger asChild>
                                          <FormControl>
                                            <Button
                                              variant="outline"
                                              className={cn(
                                                ds.components.button.secondary,
                                                "w-full justify-start text-sm font-normal",
                                                !field.value && "text-muted-foreground"
                                              )}
                                            >
                                              {field.value
                                                ? format(field.value, "dd/MM/yy", { locale: ptBR })
                                                : <span>dd/mm</span>}
                                              <CalendarIcon className="ml-auto h-4 w-4 opacity-40" />
                                            </Button>
                                          </FormControl>
                                        </PopoverTrigger>
                                        <PopoverContent className={cn(ds.colors.surface.card, ds.colors.border.default, "w-auto p-0 border")} align="start">
                                          <Calendar
                                            mode="single"
                                            selected={field.value}
                                            onSelect={field.onChange}
                                            disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
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
                                      <FormLabel className={ds.components.input.label}>Fim *</FormLabel>
                                      <Popover>
                                        <PopoverTrigger asChild>
                                          <FormControl>
                                            <Button
                                              variant="outline"
                                              className={cn(
                                                ds.components.button.secondary,
                                                "w-full justify-start text-sm font-normal",
                                                !field.value && "text-muted-foreground"
                                              )}
                                            >
                                              {field.value
                                                ? format(field.value, "dd/MM/yy", { locale: ptBR })
                                                : <span>dd/mm</span>}
                                              <CalendarIcon className="ml-auto h-4 w-4 opacity-40" />
                                            </Button>
                                          </FormControl>
                                        </PopoverTrigger>
                                        <PopoverContent className={cn(ds.colors.surface.card, ds.colors.border.default, "w-auto p-0 border")} align="start">
                                          <Calendar
                                            mode="single"
                                            selected={field.value}
                                            onSelect={field.onChange}
                                            disabled={(date) => {
                                              const dataIn = form.getValues("dataInicio") || new Date();
                                              const d = new Date(dataIn);
                                              d.setHours(0, 0, 0, 0);
                                              return date < d;
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
                            </div>
                          )}
                        </div>

                        {/* Direita: Fornecedores */}
                        <div className={cn(
                          "flex flex-col flex-1 min-h-0 overflow-hidden",
                          ds.colors.surface.page
                        )}>
                          <div className={cn("p-4 sm:p-5 border-b flex-shrink-0", ds.colors.border.default)}>
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <Building2 className="h-4 w-4 text-brand" />
                                <span className={cn(ds.typography.size.base, ds.typography.weight.semibold, ds.colors.text.primary)}>
                                  Fornecedores
                                </span>
                                {selectedSuppliers.length > 0 && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-brand text-zinc-950">
                                    {selectedSuppliers.length}
                                  </span>
                                )}
                              </div>
                              {supplierSearch.length > 0 && filteredSuppliers.length > 0 && (
                                <button
                                  type="button"
                                  onClick={handleSelectAllSuppliers}
                                  className={cn(ds.typography.size.xs, "text-brand hover:underline")}
                                >
                                  {filteredSuppliers.every(s => selectedSuppliers.some(sel => sel.id === s.id))
                                    ? "Desmarcar todos"
                                    : "Selecionar todos"}
                                </button>
                              )}
                            </div>
                            <div className="relative">
                              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                              <Input
                                placeholder="Buscar fornecedor..."
                                value={supplierSearch}
                                onChange={(e) => setSupplierSearch(e.target.value)}
                                className={cn(ds.components.input.root, "pl-10 h-9")}
                              />
                            </div>
                          </div>

                          <div className="flex-1 overflow-y-auto p-2 custom-scrollbar pb-20">
                            {supplierSearch.length === 0 && selectedSuppliers.length === 0 ? (
                              <div className="h-full flex flex-col items-center justify-center gap-2 p-6 text-center">
                                <Search className={cn("h-8 w-8 opacity-20", ds.colors.text.secondary)} />
                                <p className={cn(ds.typography.size.sm, ds.typography.weight.medium, ds.colors.text.secondary)}>
                                  Digite para buscar
                                </p>
                              </div>
                            ) : (
                              <div className="space-y-1">
                                {(supplierSearch.length > 0 ? filteredSuppliers : selectedSuppliers).map((supplier) => {
                                  const isSelected = selectedSuppliers.some(s => s.id === supplier.id);
                                  return (
                                    <div
                                      key={supplier.id}
                                      onClick={() => isSelected ? handleSupplierRemove(supplier.id) : handleSupplierSelect(supplier)}
                                      className={cn(
                                        "flex items-center gap-3 p-3 rounded-xl cursor-pointer border transition-all",
                                        isSelected
                                          ? "border-brand/30 bg-brand/5 dark:bg-brand/10"
                                          : cn(ds.colors.surface.card, "border-transparent hover:border-brand/20")
                                      )}
                                    >
                                      <div className={cn(
                                        "w-5 h-5 rounded-md border flex items-center justify-center flex-shrink-0 transition-colors",
                                        isSelected ? "bg-brand border-brand text-zinc-950" : cn(ds.colors.border.default, "bg-transparent")
                                      )}>
                                        {isSelected && <Check className="h-3 w-3" />}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className={cn(ds.typography.size.sm, ds.typography.weight.medium, ds.colors.text.primary, "truncate")}>
                                          {supplier.name}
                                        </p>
                                        {supplier.contact && (
                                          <p className={cn(ds.typography.size.xs, ds.colors.text.secondary, "truncate")}>
                                            {supplier.contact}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                                {supplierSearch.length > 0 && filteredSuppliers.length === 0 && (
                                  <p className={cn("p-4 text-center", ds.typography.size.sm, ds.colors.text.secondary)}>
                                    Nenhum resultado para "{supplierSearch}"
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                      </div>
                    </TabsContent>
                        {/* Detalhes Tab - Resumo Final Minimalista */}
                        <TabsContent value="detalhes" className="flex-1 h-full min-h-0 overflow-hidden m-0 p-0">
                          <ScrollArea className="h-full custom-scrollbar">
                            <div className="p-4 sm:p-8 max-w-4xl mx-auto space-y-8 pb-32">
                              
                              <div className="text-center space-y-2">
                                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-brand/10 text-brand mb-2">
                                  <FileText className="h-6 w-6" />
                                </div>
                                <h1 className={cn(ds.typography.size.xl, ds.typography.weight.bold, ds.colors.text.primary)}>
                                  Revise sua Cotação
                                </h1>
                                <p className={cn(ds.typography.size.sm, ds.colors.text.secondary)}>
                                  Confira todas as informações antes de enviar para os fornecedores.
                                </p>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                
                                {/* Resumo de Produtos */}
                                <div className={cn(
                                  "p-5 rounded-2xl border bg-white dark:bg-zinc-900/50",
                                  ds.colors.border.subtle
                                )}>
                                  <div className="flex items-center gap-2 mb-4">
                                    <Package className="h-4 w-4 text-brand" />
                                    <h3 className={cn(ds.typography.size.sm, ds.typography.weight.semibold, ds.colors.text.primary)}>
                                      Produtos ({fields.length})
                                    </h3>
                                  </div>
                                  <div className="space-y-3">
                                    {fields.slice(0, 5).map((field, index) => (
                                      <div key={field.id} className="flex justify-between items-center text-sm">
                                        <span className={cn(ds.colors.text.secondary, "truncate pr-4")}>
                                          {form.watch(`produtos.${index}.produtoNome`) || "Produto"}
                                        </span>
                                        <span className={cn(ds.typography.weight.medium, ds.colors.text.primary, "flex-shrink-0")}>
                                          {form.watch(`produtos.${index}.quantidade`)} {form.watch(`produtos.${index}.unidade`)}
                                        </span>
                                      </div>
                                    ))}
                                    {fields.length > 5 && (
                                      <p className={cn(ds.typography.size.xs, "text-brand pt-1")}>
                                        + {fields.length - 5} outros produtos
                                      </p>
                                    )}
                                  </div>
                                </div>

                                {/* Resumo de Configuracao */}
                                <div className="space-y-6">
                                  
                                  {/* Prazos */}
                                  <div className={cn(
                                    "p-5 rounded-2xl border bg-white dark:bg-zinc-900/50",
                                    ds.colors.border.subtle
                                  )}>
                                    <div className="flex items-center gap-2 mb-4">
                                      <Clock className="h-4 w-4 text-brand" />
                                      <h3 className={cn(ds.typography.size.sm, ds.typography.weight.semibold, ds.colors.text.primary)}>
                                        Prazos
                                      </h3>
                                    </div>
                                    <div className="space-y-3 text-sm">
                                      <div className="flex justify-between items-center">
                                        <span className={ds.colors.text.secondary}>Duração:</span>
                                        <span className={cn(ds.typography.weight.medium, ds.colors.text.primary)}>
                                          {form.watch("dataInicio") && form.watch("dataFim")
                                            ? `${format(form.watch("dataInicio"), "dd/MM", { locale: ptBR })} até ${format(form.watch("dataFim"), "dd/MM", { locale: ptBR })}`
                                            : "Não definida"}
                                        </span>
                                      </div>
                                      <div className="flex justify-between items-center">
                                        <span className={ds.colors.text.secondary}>Agendamento:</span>
                                        <span className={cn(ds.typography.weight.medium, isScheduled ? "text-brand" : ds.colors.text.primary)}>
                                          {isScheduled ? "Planejado" : "Imediato"}
                                        </span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Fornecedores */}
                                  <div className={cn(
                                    "p-5 rounded-2xl border bg-white dark:bg-zinc-900/50",
                                    ds.colors.border.subtle
                                  )}>
                                    <div className="flex items-center gap-2 mb-4">
                                      <Building2 className="h-4 w-4 text-brand" />
                                      <h3 className={cn(ds.typography.size.sm, ds.typography.weight.semibold, ds.colors.text.primary)}>
                                        Fornecedores selecionados
                                      </h3>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                      {selectedSuppliers.map((s) => (
                                        <span key={s.id} className={cn(
                                          "px-2 py-1 rounded-md text-[10px] uppercase tracking-wider font-bold border",
                                          ds.colors.surface.section,
                                          ds.colors.border.subtle,
                                          ds.colors.text.secondary
                                        )}>
                                          {s.name}
                                        </span>
                                      ))}
                                      {selectedSuppliers.length === 0 && (
                                        <p className={cn(ds.typography.size.xs, ds.colors.text.secondary)}>Nenhum selecionado</p>
                                      )}
                                    </div>
                                  </div>

                                </div>

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
        <div className={cn(
          "absolute inset-0 backdrop-blur-sm z-50 flex items-center justify-center rounded-2xl",
          "bg-background/80"
        )}>
          <div className="text-center space-y-3">
            <div className={cn(
              "animate-spin h-12 w-12 border-4 rounded-full mx-auto",
              "border-zinc-200 dark:border-zinc-700",
              "border-t-brand"
            )}></div>
            <p className={cn(ds.typography.size.sm, ds.typography.weight.medium, ds.colors.text.primary)}>Criando cotação...</p>
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
          className={cn(
            "rounded-t-2xl p-0 overflow-hidden flex flex-col",
            ds.colors.surface.card,
            ds.colors.border.default,
            "border-t"
          )}
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
        className={cn(
          "w-[96vw] sm:w-[92vw] md:w-[90vw] max-w-[900px] h-[90vh] sm:h-[88vh] max-h-[850px] p-0 gap-0 overflow-hidden shadow-2xl rounded-xl sm:rounded-2xl flex flex-col [&>button]:hidden",
          ds.colors.surface.card,
          ds.colors.border.default,
          "border backdrop-blur-xl"
        )}
        onKeyDown={handleModalKeyDown}
      >
        {modalInnerContent}
      </DialogContent>
    </Dialog>
  );
}
