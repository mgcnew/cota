import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { QuickCreateProduct } from "@/components/forms/QuickCreateProduct";
import { QuickCreateSupplier } from "@/components/forms/QuickCreateSupplier";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { AnimatedTabContent } from "@/components/ui/animated-tabs";
import { useDebounce } from "@/hooks/useDebounce";
import { useIsMobile } from "@/hooks/use-mobile";
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
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
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
  PopoverAnchor,
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
import { Button, buttonVariants } from "@/components/ui/button";
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
  ChevronDown,
  ChevronUp,
  RotateCcw,
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
import { cn, formatLocalDate } from "@/lib/utils";
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
  unit?: string | null;
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
  defaultSupplierId?: string | null;
}

export default function AddQuoteDialog({ onAdd, trigger, open: externalOpen, onOpenChange: externalOnOpenChange, defaultSupplierId }: AddQuoteDialogProps) {
  console.log("[AddQuoteDialog] Componente renderizado. Open state:", externalOpen);
  const isMobile = useIsMobile();
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  const [internalOpen, setInternalOpen] = useState(false);
  const open = externalOpen !== undefined ? externalOpen : internalOpen;
  const setOpen = externalOnOpenChange || setInternalOpen;
  const [showMobileCart, setShowMobileCart] = useState(false);
  const [showMobileProductSearch, setShowMobileProductSearch] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSearchingProducts, setIsSearchingProducts] = useState(false);
  const [supplierSearch, setSupplierSearch] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showProductSuggestions, setShowProductSuggestions] = useState(false);
  const [highlightedProductIndex, setHighlightedProductIndex] = useState(-1);
  const [highlightedSupplierIndex, setHighlightedSupplierIndex] = useState(-1);
  const debouncedProductSearch = useDebounce(productSearch, 300);
  const [selectedSuppliers, setSelectedSuppliers] = useState<Supplier[]>([]);
  const [activeTab, setActiveTab] = useState("produtos");
  const [personalizeViewMode, setPersonalizeViewMode] = useState<"by-supplier" | "by-product">("by-supplier");
  const [personalizeSearch, setPersonalizeSearch] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const productsContainerRef = useRef<HTMLDivElement>(null);
  const productListRef = useRef<HTMLDivElement>(null);
  const prevTabIndexRef = useRef(0);
  const prevProductIdsRef = useRef<string[]>([]);

  const tabs = useMemo(() => [
    { id: "produtos", label: "Produtos", icon: Package },
    { id: "periodo_fornecedores", label: "Período & Fornecedores", icon: Building2 },
    { id: "personalizar", label: "Configurar Itens", icon: MousePointerClick },
    { id: "detalhes", label: "Resumo", icon: FileText }
  ], []);

  const [supplierItemAssignments, setSupplierItemAssignments] = useState<Record<string, string[]>>({});
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

  const toggleExpanded = (id: string) => {
    setExpandedItems(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const currentTabIndex = tabs.findIndex(tab => tab.id === activeTab);
  const [direction, setDirection] = useState<"forward" | "backward">("forward");

  const changeTab = (newTabId: string) => {
    const newIndex = tabs.findIndex(t => t.id === newTabId);
    setDirection(newIndex > currentTabIndex ? "forward" : "backward");
    prevTabIndexRef.current = currentTabIndex;
    setActiveTab(newTabId);
  };

  // Efeito para focar o campo de busca mobile quando o drawer abrir
  useEffect(() => {
    if (showMobileProductSearch && isMobile) {
      // Pequeno atraso para garantir que a animação do Drawer permitiu o foco
      const timer = setTimeout(() => {
        mobileProductSearchRef.current?.focus();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [showMobileProductSearch, isMobile]);

  // Estados para o novo formulário de produto único
  const [newProductQuantity, setNewProductQuantity] = useState("");
  const [newProductUnit, setNewProductUnit] = useState("");
  const [lastUsedUnit, setLastUsedUnit] = useState("kg");
  const [supplierPopoverOpen, setSupplierPopoverOpen] = useState(false);
  const [focusedSupplierId, setFocusedSupplierId] = useState<string | null>(null);

  // Estados para cadastro rápido inline
  const [showQuickCreateProduct, setShowQuickCreateProduct] = useState(false);
  const [showQuickCreateSupplier, setShowQuickCreateSupplier] = useState(false);

  // Estados para agendamento
  const [isScheduled, setIsScheduled] = useState(false);

  // Refs para auto-foco
  const quantityInputRef = useRef<HTMLInputElement>(null);
  const productSearchRef = useRef<HTMLInputElement>(null);
  const unitSelectRef = useRef<HTMLButtonElement>(null);
  const addButtonRef = useRef<HTMLButtonElement>(null);
  const supplierSearchRef = useRef<HTMLInputElement>(null);
  const mobileProductSearchRef = useRef<HTMLInputElement>(null);

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

  // Função para manter os fornecedores sincronizados com os produtos
  useEffect(() => {
    const currentProductIds = fields.map(f => f.produtoId);
    const prevProductIds = prevProductIdsRef.current;
    
    // Novas IDs que foram adicionadas agora
    const newProductIds = currentProductIds.filter(id => !prevProductIds.includes(id));
    
    setSupplierItemAssignments(prev => {
      const next = { ...prev };
      const supplierIds = Object.keys(next);
      
      // Se não houver fornecedores ainda, não fazemos nada (serão tratados ao selecionar o fornecedor)
      if (supplierIds.length > 0) {
        supplierIds.forEach(supplierId => {
          // Se o fornecedor já tiver atribuições, adicionamos apenas os NOVOS produtos
          // para manter a "liberdade" de ele já ter removido outros produtos
          if (newProductIds.length > 0) {
            const currentAssignments = next[supplierId] || [];
            // Adicionamos os novos ao final, evitando duplicatas
            const updatedAssignments = [...new Set([...currentAssignments, ...newProductIds])];
            next[supplierId] = updatedAssignments;
          }
          
          // Sempre filtramos para remover IDs que não existem mais (produtos deletados)
          next[supplierId] = (next[supplierId] || []).filter(id => currentProductIds.includes(id));
        });
      }
      return next;
    });
    
    prevProductIdsRef.current = currentProductIds;
  }, [fields.length]);

  // Filter suppliers only if search has content (Mover para cima para uso nos handlers)
  const filteredSuppliers = supplierSearch.length >= 1
    ? suppliers.filter(supplier =>
      supplier.name.toLowerCase().includes(supplierSearch.toLowerCase()) ||
      (supplier.contact && supplier.contact.toLowerCase().includes(supplierSearch.toLowerCase()))
    )
    : [];

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

  // Handler para busca de fornecedores e navegação
  const handleSupplierKeyDown = (e: React.KeyboardEvent) => {
    if (filteredSuppliers.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setHighlightedSupplierIndex(prev => prev < filteredSuppliers.length - 1 ? prev + 1 : 0);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHighlightedSupplierIndex(prev => prev > 0 ? prev - 1 : filteredSuppliers.length - 1);
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        if (highlightedSupplierIndex >= 0) {
          const supplier = filteredSuppliers[highlightedSupplierIndex];
          const isSelected = selectedSuppliers.some(s => s.id === supplier.id);
          if (isSelected) {
            handleSupplierRemove(supplier.id);
          } else {
            handleSupplierSelect(supplier);
          }
        }
        return;
      }
      if (e.key === 'Escape') {
        setSupplierSearch("");
        setHighlightedSupplierIndex(-1);
        return;
      }
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
        changeTab(tabs[tabIndex].id);
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
      // Auto-foco no seletor correspondente ao abrir ou trocar de aba
      setTimeout(() => {
        if (activeTab === 'produtos' && productSearchRef.current) {
          productSearchRef.current.focus();
        } else if (activeTab === 'periodo_fornecedores' && supplierSearchRef.current) {
          supplierSearchRef.current.focus();
        }
      }, 300);
    } else {
      // Reset ao fechar
      setActiveTab("produtos");
      prevTabIndexRef.current = 0;
      setDirection("forward");
      setSelectedProduct(null);
      setNewProductQuantity("");
      setNewProductUnit("");
      setProductSearch("");
      setSupplierSearch("");
      setProducts([]);
      setShowQuickCreateProduct(false);
      setShowQuickCreateSupplier(false);
      setShowMobileProductSearch(false);
      setShowMobileCart(false);
    }
  }, [open, activeTab]);

  // Busca dinâmica de produtos quando o termo de busca muda
  useEffect(() => {
    if (debouncedProductSearch.trim().length >= 1) {
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

      if (suppliersRes.data) {
        setSuppliers(suppliersRes.data);
        if (defaultSupplierId && selectedSuppliers.length === 0) {
          const defaultSup = suppliersRes.data.find(s => s.id === defaultSupplierId);
          if (defaultSup) {
            setSelectedSuppliers([defaultSup]);
            form.setValue("fornecedoresIds", [defaultSup.id]);
          }
        }
      }
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
        .select('id, name, unit, barcode')
        .or(`name.ilike.%${term}%,barcode.ilike.%${term}%`)
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
          data_inicio: formatLocalDate(data.dataInicio),
          data_fim: formatLocalDate(data.dataFim),
          data_planejada: data.dataPlanejada ? data.dataPlanejada.toISOString() : null,
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
        const assignedProductIds = supplierItemAssignments[supplierId] || data.produtos.map(p => p.produtoId);
        data.produtos
          .filter(produto => assignedProductIds.includes(produto.produtoId))
          .forEach(produto => {
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

      // Small delay to ensure all Supabase inserts are fully committed
      // before triggering cache invalidation via onAdd/refetch
      await new Promise(resolve => setTimeout(resolve, 300));

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
      changeTab("produtos");

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
      
      // Ao selecionar um fornecedor, ele recebe todos os produtos por padrão
      setSupplierItemAssignments(prev => ({
        ...prev,
        [supplier.id]: fields.map(f => f.produtoId)
      }));
    }
    setSupplierSearch("");
  };

  const handleSupplierRemove = (supplierId: string) => {
    const newSuppliers = selectedSuppliers.filter(s => s.id !== supplierId);
    setSelectedSuppliers(newSuppliers);
    form.setValue("fornecedoresIds", newSuppliers.map(s => s.id));

    // Remove as atribuições de itens do fornecedor
    setSupplierItemAssignments(prev => {
      const next = { ...prev };
      delete next[supplierId];
      return next;
    });

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
      const newSuppliers = [...selectedSuppliers];
      const newAssignments = { ...supplierItemAssignments };
      const currentProductIds = fields.map(f => f.produtoId);

      filteredSuppliers.forEach(s => {
        if (!newSuppliers.some(selected => selected.id === s.id)) {
          newSuppliers.push(s);
          newAssignments[s.id] = currentProductIds;
        }
      });
      
      setSelectedSuppliers(newSuppliers);
      form.setValue("fornecedoresIds", newSuppliers.map(s => s.id));
      setSupplierItemAssignments(newAssignments);

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
    setSupplierItemAssignments({});
  };

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
      case "personalizar": {
        // Pelo menos um fornecedor deve ter pelo menos um produto
        return Object.values(supplierItemAssignments).some(ids => ids.length > 0);
      }
      case "detalhes":
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (currentTabIndex < tabs.length - 1) {
      changeTab(tabs[currentTabIndex + 1].id);
    }
  };

  const handlePrevious = () => {
    if (currentTabIndex > 0) {
      changeTab(tabs[currentTabIndex - 1].id);
    }
  };

  const getTabStatus = (tabId: string) => {
    const tabIndex = tabs.findIndex(tab => tab.id === tabId);
    if (tabIndex < currentTabIndex) return "completed";
    if (tabIndex === currentTabIndex) return "current";
    return "pending";
  };

  // ═══════════════════════════════════════════════════════════
  // MOBILE-SPECIFIC CONTENT — Linear flow, large touch targets
  // ═══════════════════════════════════════════════════════════
  const mobileContent = (
    <>
      {/* Mobile Header — minimal, sticky */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2 flex-shrink-0">
        <div className="flex items-center gap-3">
          {currentTabIndex > 0 ? (
            <button
              type="button"
              onClick={handlePrevious}
              className={cn("w-8 h-8 rounded-full flex items-center justify-center", ds.colors.surface.section)}
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setOpen(false)}
              className={cn("w-8 h-8 rounded-full flex items-center justify-center", ds.colors.surface.section)}
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <div>
            <DialogTitle className={cn(ds.typography.size.base, ds.typography.weight.semibold, ds.colors.text.primary)}>
              {currentTabIndex === 0 ? "Produtos" : 
               currentTabIndex === 1 ? "Período & Fornecedores" : 
               currentTabIndex === 2 ? "Configurar Itens" : 
               "Resumo"}
            </DialogTitle>
            <DialogDescription className={cn(ds.typography.size.xs, ds.colors.text.secondary)}>
              Passo {currentTabIndex + 1} de {tabs.length}
            </DialogDescription>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {currentTabIndex === 0 && fields.length > 0 && (
            <button
              type="button"
              onClick={() => setShowMobileCart(true)}
              className={cn(
                "relative w-9 h-9 rounded-full flex items-center justify-center",
                "bg-brand/10 text-brand"
              )}
            >
              <Package className="h-4 w-4" />
              <span className="absolute -top-1 -right-1 bg-brand text-zinc-950 text-[10px] w-[16px] h-[16px] rounded-full flex items-center justify-center font-bold">
                {fields.length}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Progress bar — thin, clean */}
      <div className="flex gap-1.5 px-4 pb-3">
        {tabs.map((_, idx) => (
          <div
            key={idx}
            className={cn(
              "h-1 rounded-full flex-1 transition-all duration-300",
              idx < currentTabIndex ? "bg-brand" : idx === currentTabIndex ? "bg-brand/50" : "bg-muted"
            )}
          />
        ))}
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className={cn("animate-spin h-10 w-10 border-4 rounded-full mx-auto mb-3", "border-muted", "border-t-brand")} />
            <p className={cn(ds.typography.size.sm, ds.colors.text.secondary)}>Carregando...</p>
          </div>
        </div>
      ) : (
        <Form {...form}>
          <form
            id="quote-form-mobile"
            onSubmit={form.handleSubmit((data) => onSubmit(data, false))}
            className="flex flex-col flex-1 min-h-0 overflow-hidden"
          >
            {/* ── STEP 1: Products ── */}
            {activeTab === "produtos" && (
              <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                {/* Quick add area */}
                <div className="px-4 pb-3 space-y-3 flex-shrink-0">
                  {/* Product selector */}
                  <div
                    onClick={() => {
                      setShowMobileProductSearch(true);
                    }}
                    className={cn(
                      "flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer active:scale-[0.98] transition-all",
                      selectedProduct
                        ? "border-brand/30 bg-brand/5"
                        : cn(ds.colors.surface.card, ds.colors.border.default)
                    )}
                  >
                    <div className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
                      selectedProduct ? "bg-brand/15 text-brand" : ds.colors.surface.section
                    )}>
                      {selectedProduct ? <Check className="h-5 w-5" /> : <Search className="h-5 w-5 text-zinc-400" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        ds.typography.size.sm,
                        selectedProduct ? cn(ds.typography.weight.semibold, ds.colors.text.primary) : ds.colors.text.secondary
                      )}>
                        {selectedProduct ? selectedProduct.name : "Toque para buscar produto..."}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-zinc-300 flex-shrink-0" />
                  </div>

                  {/* Quantity + Unit — only show when product is selected */}
                  {selectedProduct && (
                    <div className="flex gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="flex-1">
                        <Input
                          ref={quantityInputRef}
                          placeholder="Qtd"
                          type="number"
                          inputMode="decimal"
                          value={newProductQuantity}
                          onChange={(e) => setNewProductQuantity(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              if (selectedProduct && newProductQuantity && newProductUnit) {
                                handleAddNewProduct();
                              }
                            }
                          }}
                          className={cn(ds.components.input.root, "h-12 text-base text-center")}
                          autoFocus
                        />
                      </div>
                      <Select value={newProductUnit} onValueChange={setNewProductUnit}>
                        <SelectTrigger className={cn(ds.components.input.root, "w-24 h-12 text-base")}>
                          <SelectValue placeholder="Un" />
                        </SelectTrigger>
                        <SelectContent className={cn(ds.colors.surface.card, ds.colors.border.default, "border")}>
                          <SelectItem value="kg">kg</SelectItem>
                          <SelectItem value="g">g</SelectItem>
                          <SelectItem value="un">un</SelectItem>
                          <SelectItem value="cx">cx</SelectItem>
                          <SelectItem value="pct">pct</SelectItem>
                          <SelectItem value="l">l</SelectItem>
                          <SelectItem value="ml">ml</SelectItem>
                          <SelectItem value="metade">metade</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        type="button"
                        onClick={() => {
                          handleAddNewProduct();
                        }}
                        disabled={!newProductQuantity || !newProductUnit}
                        className={cn(ds.components.button.primary, "h-12 w-12 p-0 flex-shrink-0")}
                      >
                        <Plus className="h-5 w-5" />
                      </Button>
                    </div>
                  )}
                </div>

                {/* Product list — scrollable */}
                <div className="flex-1 overflow-y-auto px-4 pb-24">
                  {fields.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center mb-4", ds.colors.surface.section)}>
                        <Package className="h-8 w-8 text-zinc-300" />
                      </div>
                      <p className={cn(ds.typography.weight.medium, ds.colors.text.secondary)}>Nenhum produto adicionado</p>
                      <p className={cn(ds.typography.size.xs, ds.colors.text.muted, "mt-1")}>Toque acima para buscar e adicionar</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {fields.map((field, index) => (
                        <div
                          key={field.id}
                          className={cn(
                            "flex items-center gap-3 p-3 rounded-xl border transition-all",
                            ds.colors.surface.card,
                            ds.colors.border.subtle
                          )}
                        >
                          <div className="flex-1 min-w-0">
                            <p className={cn(ds.typography.size.sm, ds.typography.weight.medium, ds.colors.text.primary, "truncate")}>
                              {form.watch(`produtos.${index}.produtoNome`)}
                            </p>
                            <p className={cn(ds.typography.size.xs, ds.colors.text.secondary, "mt-0.5")}>
                              {form.watch(`produtos.${index}.quantidade`)} {form.watch(`produtos.${index}.unidade`)}
                            </p>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => remove(index)}
                            className="h-8 w-8 p-0 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg flex-shrink-0"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── STEP 2: Period & Suppliers ── */}
            {activeTab === "periodo_fornecedores" && (
              <div className="flex-1 overflow-y-auto px-4 pb-24">
                <div className="space-y-5">
                  {/* Period shortcuts */}
                  <div className="space-y-2">
                    <label className={cn(ds.components.input.label, "flex items-center gap-2")}>
                      <Clock className="h-3.5 w-3.5 text-brand" />
                      Prazo da Cotação
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { label: "Hoje", value: "0" },
                        { label: "3 dias", value: "3" },
                        { label: "7 dias", value: "7" },
                        { label: "15 dias", value: "15" },
                        { label: "30 dias", value: "30" },
                      ].map((preset) => {
                        const days = parseInt(preset.value);
                        const currentEnd = form.watch("dataFim");
                        const currentStart = form.watch("dataInicio");
                        const diffDays = currentEnd && currentStart
                          ? Math.round((currentEnd.getTime() - currentStart.getTime()) / (1000 * 60 * 60 * 24))
                          : 7;
                        const isActive = diffDays === days;
                        return (
                          <button
                            key={preset.value}
                            type="button"
                            onClick={() => {
                              const hoje = new Date();
                              hoje.setHours(0, 0, 0, 0);
                              const fim = new Date(hoje);
                              fim.setDate(hoje.getDate() + days);
                              form.setValue("dataInicio", hoje);
                              form.setValue("dataFim", fim);
                            }}
                            className={cn(
                              "py-2.5 px-3 rounded-xl text-sm font-medium border transition-all active:scale-95",
                              isActive
                                ? "bg-brand/10 border-brand/30 text-brand"
                                : cn(ds.colors.surface.card, ds.colors.border.subtle, ds.colors.text.secondary)
                            )}
                          >
                            {preset.label}
                          </button>
                        );
                      })}
                    </div>
                    {/* Period display */}
                    <p className={cn(ds.typography.size.xs, ds.colors.text.muted, "text-center pt-1")}>
                      {form.watch("dataInicio") && form.watch("dataFim")
                        ? `${format(form.watch("dataInicio"), "dd/MM", { locale: ptBR })} até ${format(form.watch("dataFim"), "dd/MM", { locale: ptBR })}`
                        : "Selecione um período"}
                    </p>
                  </div>

                  {/* Schedule toggle */}
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

                  {isScheduled && (
                    <FormField
                      control={form.control}
                      name="dataPlanejada"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel className={ds.components.input.label}>Data de Ativação *</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    ds.components.button.secondary,
                                    "w-full justify-start font-normal h-12",
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
                            <PopoverContent className={cn(ds.colors.surface.card, ds.colors.border.default, "w-auto p-0 border shadow-2xl overflow-hidden rounded-2xl")} align="center">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                locale={ptBR}
                                disabled={(date) => {
                                  const today = new Date();
                                  today.setHours(0, 0, 0, 0);
                                  return date < today;
                                }}
                                classNames={{
                                  day_selected: "bg-brand text-zinc-950 hover:bg-brand hover:text-zinc-950 focus:bg-brand focus:text-zinc-950 font-black rounded-xl",
                                  day_today: "bg-muted/50 text-accent-foreground border-2 border-brand/20 rounded-xl",
                                  day: cn(
                                    buttonVariants({ variant: "ghost" }),
                                    "h-9 w-9 p-0 font-medium aria-selected:opacity-100 hover:bg-brand/10 hover:text-brand rounded-xl transition-all"
                                  ),
                                  day_disabled: "text-muted-foreground/30 opacity-40 cursor-not-allowed",
                                  day_outside: "text-muted-foreground/20 opacity-30",
                                }}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {/* Suppliers */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className={cn(ds.components.input.label, "flex items-center gap-2 mb-0")}>
                        <Building2 className="h-3.5 w-3.5 text-brand" />
                        Fornecedores
                        {selectedSuppliers.length > 0 && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-brand text-zinc-950">
                            {selectedSuppliers.length}
                          </span>
                        )}
                      </label>
                      {supplierSearch.length > 0 && filteredSuppliers.length > 0 && (
                        <button
                          type="button"
                          onClick={handleSelectAllSuppliers}
                          className={cn(ds.typography.size.xs, "text-brand")}
                        >
                          {filteredSuppliers.every(s => selectedSuppliers.some(sel => sel.id === s.id))
                            ? "Desmarcar"
                            : "Selecionar todos"}
                        </button>
                      )}
                    </div>

                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                      <Input
                        ref={supplierSearchRef}
                        placeholder="Buscar fornecedor..."
                        value={supplierSearch}
                        onChange={(e) => {
                          setSupplierSearch(e.target.value);
                          if (e.target.value.length > 0) setHighlightedSupplierIndex(0);
                          else setHighlightedSupplierIndex(-1);
                        }}
                        className={cn(ds.components.input.root, "pl-10 h-12 text-base")}
                      />
                    </div>

                    {/* Selected suppliers chips */}
                    {selectedSuppliers.length > 0 && supplierSearch.length === 0 && (
                      <div className="flex flex-wrap gap-2">
                        {selectedSuppliers.map((s) => (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => handleSupplierRemove(s.id)}
                            className={cn(
                              "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all active:scale-95",
                              "bg-brand/10 border-brand/20 text-brand"
                            )}
                          >
                            {s.name}
                            <X className="h-3 w-3" />
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Supplier list */}
                    {supplierSearch.length > 0 && (
                      <div className="space-y-1">
                        {filteredSuppliers.length > 0 ? (
                          filteredSuppliers.map((supplier) => {
                            const isSelected = selectedSuppliers.some(s => s.id === supplier.id);
                            return (
                              <button
                                key={supplier.id}
                                type="button"
                                onClick={() => isSelected ? handleSupplierRemove(supplier.id) : handleSupplierSelect(supplier)}
                                className={cn(
                                  "w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left active:scale-[0.98]",
                                  isSelected
                                    ? "border-brand/30 bg-brand/10"
                                    : cn(ds.colors.surface.card, "border-transparent")
                                )}
                              >
                                <div className={cn(
                                  "w-5 h-5 rounded-md border flex items-center justify-center flex-shrink-0 transition-colors",
                                  isSelected ? "bg-brand border-brand text-zinc-950" : ds.colors.border.default
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
                              </button>
                            );
                          })
                        ) : !showQuickCreateSupplier ? (
                          <div className="p-4 text-center space-y-3">
                            <Building2 className={cn("h-6 w-6 mx-auto opacity-40", ds.colors.text.muted)} />
                            <p className={cn(ds.typography.size.xs, ds.colors.text.muted)}>Nenhum resultado</p>
                            <Button
                              type="button"
                              onClick={() => setShowQuickCreateSupplier(true)}
                              className={cn(ds.components.button.primary, "h-10 text-sm")}
                            >
                              <Plus className="h-4 w-4 mr-1.5" />
                              Cadastrar "{supplierSearch}"
                            </Button>
                          </div>
                        ) : null}

                        {showQuickCreateSupplier && (
                          <QuickCreateSupplier
                            initialName={supplierSearch}
                            onCreated={(supplier) => {
                              setShowQuickCreateSupplier(false);
                              const newSupplier = { id: supplier.id, name: supplier.name, contact: supplier.contact };
                              setSuppliers(prev => [...prev, newSupplier].sort((a, b) => a.name.localeCompare(b.name)));
                              handleSupplierSelect(newSupplier);
                              setSupplierSearch("");
                            }}
                            onCancel={() => {
                              setShowQuickCreateSupplier(false);
                              supplierSearchRef.current?.focus();
                            }}
                          />
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ── STEP 3: Personalize ── */}
            {activeTab === "personalizar" && (
              <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                {/* Header controls */}
                <div className="px-4 pb-3 space-y-3 flex-shrink-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex p-1 rounded-xl bg-muted/50 border border-border/50 flex-1">
                      <button
                        type="button"
                        onClick={() => setPersonalizeViewMode("by-supplier")}
                        className={cn(
                          "flex-1 py-2 text-xs font-medium rounded-lg transition-all",
                          personalizeViewMode === "by-supplier" 
                            ? "bg-background shadow-sm text-brand" 
                            : "text-muted-foreground"
                        )}
                      >
                        Por Fornecedor
                      </button>
                      <button
                        type="button"
                        onClick={() => setPersonalizeViewMode("by-product")}
                        className={cn(
                          "flex-1 py-2 text-xs font-medium rounded-lg transition-all",
                          personalizeViewMode === "by-product" 
                            ? "bg-background shadow-sm text-brand" 
                            : "text-muted-foreground"
                        )}
                      >
                        Por Produto
                      </button>
                    </div>
                    
                    <div className="flex gap-1 flex-shrink-0">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          const allProductIds = fields.map(f => f.produtoId);
                          const newAssignments: Record<string, string[]> = {};
                          selectedSuppliers.forEach(s => {
                            newAssignments[s.id] = [...allProductIds];
                          });
                          setSupplierItemAssignments(newAssignments);
                        }}
                        className="h-9 w-9 rounded-xl bg-brand/5 text-brand"
                        title="Atribuir Tudo"
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => setSupplierItemAssignments({})}
                        className="h-9 w-9 rounded-xl bg-red-50 text-red-500 dark:bg-red-950/20"
                        title="Limpar Tudo"
                      >
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                    <Input
                      placeholder={personalizeViewMode === "by-supplier" ? "Filtrar fornecedores..." : "Filtrar produtos..."}
                      value={personalizeSearch}
                      onChange={(e) => setPersonalizeSearch(e.target.value)}
                      className={cn(ds.components.input.root, "pl-10 h-10 text-sm")}
                    />
                  </div>
                </div>

                {/* List of items */}
                <div className="flex-1 overflow-y-auto px-4 pb-24 space-y-3">
                  {personalizeViewMode === "by-supplier" ? (
                    selectedSuppliers
                      .filter(s => s.name.toLowerCase().includes(personalizeSearch.toLowerCase()))
                      .map(supplier => {
                        const assignedIds = supplierItemAssignments[supplier.id] || [];
                        const isExpanded = expandedItems[supplier.id];
                        
                        return (
                          <div key={supplier.id} className={cn("rounded-2xl border transition-all overflow-hidden", ds.colors.surface.card, ds.colors.border.subtle)}>
                            <div 
                              onClick={() => toggleExpanded(supplier.id)}
                              className="p-4 flex items-center justify-between cursor-pointer active:bg-muted/30"
                            >
                              <div className="flex-1 min-w-0">
                                <p className={cn(ds.typography.size.sm, ds.typography.weight.semibold, ds.colors.text.primary, "truncate")}>
                                  {supplier.name}
                                </p>
                                <p className={cn(ds.typography.size.xs, ds.colors.text.secondary)}>
                                  {assignedIds.length} de {fields.length} produtos
                                </p>
                              </div>
                              <div className="flex items-center gap-3">
                                <div className="flex gap-1">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleAllItemsForSupplier(supplier.id, true);
                                    }}
                                    className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider bg-brand/10 text-brand rounded-md border border-brand/20"
                                  >
                                    Tudo
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleAllItemsForSupplier(supplier.id, false);
                                    }}
                                    className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider bg-zinc-100 dark:bg-zinc-800 text-zinc-500 rounded-md border border-border"
                                  >
                                    Limpar
                                  </button>
                                </div>
                                {isExpanded ? <ChevronUp className="h-4 w-4 text-zinc-400" /> : <ChevronDown className="h-4 w-4 text-zinc-400" />}
                              </div>
                            </div>

                            {isExpanded && (
                              <div className="px-4 pb-4 pt-0 space-y-2 border-t border-border/30 bg-muted/20 animate-in fade-in slide-in-from-top-1 duration-200">
                                {fields.map((field, idx) => {
                                  const productId = field.produtoId;
                                  const productName = form.watch(`produtos.${idx}.produtoNome`);
                                  const isChecked = assignedIds.includes(productId);
                                  
                                  return (
                                    <div 
                                      key={productId}
                                      onClick={() => toggleItemAssignment(supplier.id, productId)}
                                      className="flex items-center gap-3 py-2 cursor-pointer"
                                    >
                                      <div className={cn(
                                        "w-5 h-5 rounded border flex items-center justify-center transition-all",
                                        isChecked ? "bg-brand border-brand text-zinc-950" : "border-zinc-300 dark:border-zinc-700"
                                      )}>
                                        {isChecked && <Check className="h-3 w-3" />}
                                      </div>
                                      <span className={cn(ds.typography.size.xs, isChecked ? ds.colors.text.primary : ds.colors.text.secondary)}>
                                        {productName}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })
                  ) : (
                    fields
                      .filter(f => f.produtoNome.toLowerCase().includes(personalizeSearch.toLowerCase()))
                      .map((field, idx) => {
                        const productId = field.produtoId;
                        const productName = form.watch(`produtos.${idx}.produtoNome`);
                        const isExpanded = expandedItems[productId];
                        const suppliersAssigned = selectedSuppliers.filter(s => (supplierItemAssignments[s.id] || []).includes(productId));
                        
                        return (
                          <div key={productId} className={cn("rounded-2xl border transition-all overflow-hidden", ds.colors.surface.card, ds.colors.border.subtle)}>
                            <div 
                              onClick={() => toggleExpanded(productId)}
                              className="p-4 flex items-center justify-between cursor-pointer active:bg-muted/30"
                            >
                              <div className="flex-1 min-w-0">
                                <p className={cn(ds.typography.size.sm, ds.typography.weight.semibold, ds.colors.text.primary, "truncate")}>
                                  {productName}
                                </p>
                                <p className={cn(ds.typography.size.xs, ds.colors.text.secondary)}>
                                  {suppliersAssigned.length} de {selectedSuppliers.length} fornecedores
                                </p>
                              </div>
                              <div className="flex items-center gap-3">
                                <div className="flex gap-1">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      selectedSuppliers.forEach(s => {
                                        if (!(supplierItemAssignments[s.id] || []).includes(productId)) {
                                          toggleItemAssignment(s.id, productId);
                                        }
                                      });
                                    }}
                                    className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider bg-brand/10 text-brand rounded-md border border-brand/20"
                                  >
                                    Todos
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      selectedSuppliers.forEach(s => {
                                        if ((supplierItemAssignments[s.id] || []).includes(productId)) {
                                          toggleItemAssignment(s.id, productId);
                                        }
                                      });
                                    }}
                                    className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider bg-zinc-100 dark:bg-zinc-800 text-zinc-500 rounded-md border border-border"
                                  >
                                    Nenhum
                                  </button>
                                </div>
                                {isExpanded ? <ChevronUp className="h-4 w-4 text-zinc-400" /> : <ChevronDown className="h-4 w-4 text-zinc-400" />}
                              </div>
                            </div>

                            {isExpanded && (
                              <div className="px-4 pb-4 pt-0 space-y-2 border-t border-border/30 bg-muted/20 animate-in fade-in slide-in-from-top-1 duration-200">
                                {selectedSuppliers.map(supplier => {
                                  const isChecked = (supplierItemAssignments[supplier.id] || []).includes(productId);
                                  
                                  return (
                                    <div 
                                      key={supplier.id}
                                      onClick={() => toggleItemAssignment(supplier.id, productId)}
                                      className="flex items-center gap-3 py-2 cursor-pointer"
                                    >
                                      <div className={cn(
                                        "w-5 h-5 rounded border flex items-center justify-center transition-all",
                                        isChecked ? "bg-brand border-brand text-zinc-950" : "border-zinc-300 dark:border-zinc-700"
                                      )}>
                                        {isChecked && <Check className="h-3 w-3" />}
                                      </div>
                                      <span className={cn(ds.typography.size.xs, isChecked ? ds.colors.text.primary : ds.colors.text.secondary)}>
                                        {supplier.name}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })
                  )}
                </div>
              </div>
            )}

            {/* ── STEP 4: Review ── */}
            {activeTab === "detalhes" && (
              <div className="flex-1 overflow-y-auto px-4 pb-24">
                <div className="space-y-4">
                  {/* Products summary */}
                  <div className={cn("p-4 rounded-xl border", ds.colors.surface.card, ds.colors.border.subtle)}>
                    <div className="flex items-center gap-2 mb-3">
                      <Package className="h-4 w-4 text-brand" />
                      <h3 className={cn(ds.typography.size.sm, ds.typography.weight.semibold, ds.colors.text.primary)}>
                        Produtos ({fields.length})
                      </h3>
                    </div>
                    <div className="space-y-2">
                      {fields.map((field, index) => (
                        <div key={field.id} className="flex justify-between items-center text-sm">
                          <span className={cn(ds.colors.text.secondary, "truncate pr-3")}>
                            {form.watch(`produtos.${index}.produtoNome`)}
                          </span>
                          <span className={cn(ds.typography.weight.medium, ds.colors.text.primary, "flex-shrink-0")}>
                            {form.watch(`produtos.${index}.quantidade`)} {form.watch(`produtos.${index}.unidade`)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Period summary */}
                  <div className={cn("p-4 rounded-xl border", ds.colors.surface.card, ds.colors.border.subtle)}>
                    <div className="flex items-center gap-2 mb-3">
                      <Clock className="h-4 w-4 text-brand" />
                      <h3 className={cn(ds.typography.size.sm, ds.typography.weight.semibold, ds.colors.text.primary)}>Prazos</h3>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className={ds.colors.text.secondary}>Duração:</span>
                        <span className={cn(ds.typography.weight.medium, ds.colors.text.primary)}>
                          {form.watch("dataInicio") && form.watch("dataFim")
                            ? `${format(form.watch("dataInicio"), "dd/MM", { locale: ptBR })} até ${format(form.watch("dataFim"), "dd/MM", { locale: ptBR })}`
                            : "Não definida"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className={ds.colors.text.secondary}>Agendamento:</span>
                        <span className={cn(ds.typography.weight.medium, isScheduled ? "text-brand" : ds.colors.text.primary)}>
                          {isScheduled ? "Planejado" : "Imediato"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Suppliers summary */}
                  <div className={cn("p-4 rounded-xl border", ds.colors.surface.card, ds.colors.border.subtle)}>
                    <div className="flex items-center gap-2 mb-3">
                      <Building2 className="h-4 w-4 text-brand" />
                      <h3 className={cn(ds.typography.size.sm, ds.typography.weight.semibold, ds.colors.text.primary)}>
                        Fornecedores ({selectedSuppliers.length})
                      </h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {selectedSuppliers.map(s => (
                        <span key={s.id} className={cn(
                          "px-2 py-1 rounded-md text-[10px] uppercase tracking-wider font-bold border",
                          ds.colors.surface.section, ds.colors.border.subtle, ds.colors.text.secondary
                        )}>
                          {s.name}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Observations */}
                  <div className="space-y-2">
                    <label className={ds.components.input.label}>Observações (opcional)</label>
                    <Textarea
                      placeholder="Alguma observação para os fornecedores?"
                      value={form.watch("observacoes") || ""}
                      onChange={(e) => form.setValue("observacoes", e.target.value)}
                      className={cn(ds.components.input.root, "min-h-[80px] text-sm")}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ── Bottom Action Bar ── */}
            <div className={cn(
              "fixed bottom-0 left-0 right-0 p-4 border-t z-40",
              ds.colors.surface.card, ds.colors.border.default,
              "safe-area-bottom"
            )}>
              {currentTabIndex === tabs.length - 1 ? (
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className={cn(ds.components.button.primary, "w-full h-12 text-base")}
                >
                  {isSubmitting ? (
                    <><Loader2 className="mr-2 h-5 w-5 animate-spin" />Salvando...</>
                  ) : (
                    <><Check className="mr-2 h-5 w-5" />Finalizar Cotação</>
                  )}
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={handleNext}
                  disabled={!canProceedToNext()}
                  className={cn(ds.components.button.primary, "w-full h-12 text-base")}
                >
                  Próximo
                  <ChevronRight className="ml-2 h-5 w-5" />
                </Button>
              )}
            </div>
          </form>
        </Form>
      )}

      {isSubmitting && (
        <div className={cn(
          "absolute inset-0 backdrop-blur-sm z-50 flex items-center justify-center",
          "bg-background/80"
        )}>
          <div className="text-center space-y-3">
            <div className={cn("animate-spin h-12 w-12 border-4 rounded-full mx-auto", "border-border", "border-t-brand")} />
            <p className={cn(ds.typography.size.sm, ds.typography.weight.medium, ds.colors.text.primary)}>Criando cotação...</p>
          </div>
        </div>
      )}

      {/* Mobile Cart Drawer — reused from desktop */}
      <Drawer open={showMobileCart} onOpenChange={setShowMobileCart}>
        <DrawerContent className="max-h-[85vh]">
          <DrawerHeader className="border-b border-border/50 pb-4">
            <DrawerTitle className="text-left flex items-center gap-2">
              <Package className="h-5 w-5 text-brand" />
              Produtos Adicionados ({fields.length})
            </DrawerTitle>
            <DrawerDescription className="text-left">
              Edite ou remova os produtos.
            </DrawerDescription>
          </DrawerHeader>
          <div className="p-4 overflow-y-auto min-h-[50vh]">
            {fields.length === 0 ? (
              <div className={cn("text-center py-8", ds.colors.text.secondary)}>
                <Package className="h-12 w-12 mx-auto mb-3 opacity-20" />
                <p className={ds.typography.weight.medium}>Nenhum produto adicionado</p>
              </div>
            ) : (
              <div className="space-y-3">
                {fields.map((field, index) => (
                  <div key={field.id} className={cn(
                    ds.colors.surface.card, ds.colors.border.subtle,
                    "border rounded-xl"
                  )}>
                    <div className="p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h4 className={cn(ds.typography.weight.semibold, ds.colors.text.primary, "text-sm break-words")}>
                            {form.watch(`produtos.${index}.produtoNome`)}
                          </h4>
                          <p className={cn("text-xs mt-1", ds.colors.text.secondary)}>
                            {form.watch(`produtos.${index}.quantidade`)} {form.watch(`produtos.${index}.unidade`)}
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => remove(index)}
                          className="h-9 w-9 p-0 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg flex-shrink-0"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <DrawerFooter className="border-t border-border/50 pt-4">
            <DrawerClose asChild>
              <Button variant="outline" className={cn(ds.components.button.secondary, "w-full")}>Fechar Lista</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

    </>
  );

  // ═══════════════════════════════════════════════════════════
  // DESKTOP CONTENT — Tabs, side-by-side layout (unchanged)
  // ═══════════════════════════════════════════════════════════
  const modalInnerContent = (
    <>
      {/* Minimal Header & Stepper */}
      <div className="px-5 md:px-6 pt-5 pb-2 flex flex-col gap-3 flex-shrink-0 bg-transparent">
        <div className="flex items-start justify-between">
          <div>
            <DialogTitle className={cn(ds.typography.size["lg"], ds.typography.weight.semibold, ds.colors.text.primary, "tracking-tight")}>
              Nova Cotação
            </DialogTitle>
            <DialogDescription className={cn(ds.colors.text.secondary, "mt-1", ds.typography.size.sm)}>
              Passo {currentTabIndex + 1}: <span className={ds.typography.weight.medium}>{tabs[currentTabIndex]?.label}</span>
            </DialogDescription>
          </div>
          <div className="flex items-center gap-2">
            {isMobile && currentTabIndex === 0 && (
              <Button 
                type="button"
                variant="outline" 
                size="icon" 
                onClick={() => setShowMobileCart(true)} 
                className={cn(ds.components.button.secondary, "h-8 w-8 relative border-brand/20 bg-brand/5 text-brand flex-shrink-0")}
              >
                <Package className="h-4 w-4" />
                {fields.length > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-brand text-zinc-950 text-[10px] w-[18px] h-[18px] rounded-full flex items-center justify-center font-bold">
                    {fields.length}
                  </span>
                )}
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={() => setOpen(false)} className={cn(ds.components.button.ghost, "h-8 w-8 rounded-full flex-shrink-0")}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="w-full overflow-x-auto custom-scrollbar pb-2">
          <TabsList className="bg-transparent p-0 flex gap-2 w-max min-w-full justify-start h-auto">
            {tabs.map((tab, idx) => {
              const isActive = currentTabIndex === idx;
              const Icon = tab.icon;
              return (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  onClick={() => changeTab(tab.id)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-xl transition-all whitespace-nowrap border",
                    isActive 
                      ? "bg-brand/10 border-brand/30 text-brand shadow-sm" 
                      : "bg-muted/30 border-transparent text-muted-foreground hover:bg-muted/50"
                  )}
                >
                  <div className={cn(
                    "w-6 h-6 rounded-lg flex items-center justify-center transition-colors",
                    isActive ? "bg-brand text-zinc-950" : "bg-muted text-muted-foreground"
                  )}>
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <span className="text-[11px] font-bold uppercase tracking-wider">{tab.label}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>
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
            <form id="quote-form" onSubmit={form.handleSubmit((data) => onSubmit(data, false))} className="flex flex-col h-full">
              {/* Content Area - Now with more space */}
              <div className="flex-1">
                <AnimatedTabContent
                  value={activeTab}
                  activeTab={activeTab}
                  direction={direction}
                  className="h-full"
                >
                  <Tabs value={activeTab} onValueChange={changeTab} className="w-full h-full">
                    {/* Produtos Tab */}
                    <TabsContent value="produtos" className="h-full m-0 overflow-visible">
                      <div className={cn("h-full p-3 sm:p-4 md:p-6", ds.colors.surface.page)}>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 h-full min-h-0">
                          {/* Formulário de Adição - Lado Esquerdo */}
                          <div className={cn(
                            "flex flex-col space-y-4 h-full min-h-0 pr-2 select-none flex-shrink-0 lg:flex-shrink relative z-[20]",
                            "pb-20 sm:pb-0" // Espaço extra para o botão no mobile
                          )}>
                            <div className="pb-1 border-b border-border/50">
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
                                        readOnly={isMobile}
                                        onClick={() => isMobile && setShowMobileProductSearch(true)}
                                        onChange={(e) => {
                                          setProductSearch(e.target.value);
                                          setSelectedProduct(null);
                                          setShowProductSuggestions(true);
                                        }}
                                        onFocus={(e) => {
                                          if (isMobile) {
                                            setShowMobileProductSearch(true);
                                            return;
                                          }
                                          setShowProductSuggestions(true);
                                          handleInputFocus(e);
                                        }}
                                        onBlur={() => {
                                          setTimeout(() => setShowProductSuggestions(false), 200);
                                        }}
                                        onKeyDown={handleProductKeyDown}
                                        className={cn(ds.components.input.root, "pl-10 h-9 text-sm cursor-pointer")}
                                        tabIndex={0}
                                      />

                                      {/* Indicador de Carregamento Dinâmico */}
                                      {isSearchingProducts && (
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                          <Loader2 className="h-4 w-4 animate-spin text-brand" />
                                        </div>
                                      )}

                                      {/* Dropdown de Sugestões com Scroll Nativo */}
                                      {showProductSuggestions && products.length > 0 && !selectedProduct && (
                                          <div className="absolute top-full left-0 right-0 mt-1 p-0 border shadow-2xl z-[1000] rounded-xl bg-card overflow-hidden animate-in fade-in slide-in-from-top-2 border-brand/20">
                                            <div className="max-h-[250px] w-full overflow-y-auto custom-scrollbar">
                                            <div className="p-1 space-y-1">
                                              {products.map((product, index) => (
                                                <button
                                                  key={product.id}
                                                  type="button"
                                                  onMouseDown={(e) => {
                                                    e.preventDefault();
                                                    setSelectedProduct(product);
                                                    if (product.unit) {
                                                      setNewProductUnit(product.unit);
                                                    }
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
                                                    <span className="font-medium truncate text-xs sm:text-sm">{product.name}</span>
                                                  </div>
                                                </button>
                                              ))}
                                            </div>
                                          </div>
                                        </div>
                                      )}
                                    </div>

                                  {/* Estado Vazio/Nenhum Resultado - Com opção de cadastro rápido */}
                                  {showProductSuggestions && productSearch.length >= 1 && products.length === 0 && !selectedProduct && !isSearchingProducts && !showQuickCreateProduct && (
                                    <div className={cn(
                                      "w-full mt-2 rounded-xl border-dashed p-4 text-center animate-in fade-in slide-in-from-top-2",
                                      ds.colors.surface.card,
                                      ds.colors.border.default,
                                      "border-2"
                                    )}>
                                      <Package className={cn("h-6 w-6 mx-auto mb-2 opacity-40", ds.colors.text.muted)} />
                                      <p className={cn(ds.typography.size.xs, ds.typography.weight.bold, ds.colors.text.muted, "uppercase tracking-widest mb-3")}>
                                        Nenhum produto encontrado
                                      </p>
                                      <Button
                                        type="button"
                                        onClick={() => {
                                          setShowProductSuggestions(false);
                                          setShowQuickCreateProduct(true);
                                        }}
                                        className={cn(ds.components.button.primary, "h-8 text-xs px-4")}
                                      >
                                        <Plus className="h-3.5 w-3.5 mr-1.5" />
                                        Cadastrar "{productSearch}"
                                      </Button>
                                    </div>
                                  )}

                                  {/* Formulário inline de cadastro rápido de produto */}
                                  {showQuickCreateProduct && (
                                    <QuickCreateProduct
                                      initialName={productSearch}
                                      onCreated={(product) => {
                                        setShowQuickCreateProduct(false);
                                        setSelectedProduct({ id: product.id, name: product.name, unit: product.unit });
                                        setNewProductUnit(product.unit || "kg");
                                        setProductSearch("");
                                        setTimeout(() => {
                                          quantityInputRef.current?.focus();
                                        }, 100);
                                      }}
                                      onCancel={() => {
                                        setShowQuickCreateProduct(false);
                                        productSearchRef.current?.focus();
                                      }}
                                    />
                                  )}
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
                                    className={cn(ds.components.input.root, "h-9 text-sm")}
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
                                      className={cn(ds.components.input.root, "h-9 text-sm")}
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
                                      <SelectItem value="metade">metade</SelectItem>
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
                                className={cn(ds.components.button.primary, "w-full mt-2 h-9 text-sm")}
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
                          <div className="hidden lg:flex flex-col space-y-4 h-full min-h-0 overflow-hidden relative z-[10]">
                            <div className="pb-1 border-b border-border/50 flex-shrink-0">
                              <h3 className={cn(ds.typography.size.base, ds.typography.weight.medium, ds.colors.text.primary, "flex items-center gap-2")}>
                                <Package className={cn("h-5 w-5 flex-shrink-0", ds.colors.text.secondary)} />
                                <span className="truncate">Produtos Adicionados ({fields.length})</span>
                              </h3>
                            </div>
                            <div className="flex-1 min-h-0 pt-2">
                              {fields.length === 0 ? (
                                <div className={cn("text-center py-8", ds.colors.text.secondary)}>
                                  <Package className="h-12 w-12 mx-auto mb-3 opacity-20" />
                                  <p className={ds.typography.weight.medium}>Nenhum produto adicionado</p>
                                  <p className={cn(ds.typography.size.xs, "mt-1")}>Use o formulário para adicionar</p>
                                </div>
                              ) : (
                                <div className="h-full overflow-y-auto scrollbar-hide pr-2">
                                  <div className="space-y-3">
                                    {fields.map((field, index) => (
                                      <div key={field.id} className={cn(
                                        ds.colors.surface.card,
                                        ds.colors.border.subtle,
                                        "border rounded-xl transition-all hover:border-brand/30"
                                      )}>

                                        <div className="p-2 sm:p-2.5">
                                          <div className="flex items-start justify-between gap-2">
                                            <div className="flex-1 min-w-0">
                                              <h4 className={cn(ds.typography.weight.semibold, ds.colors.text.primary, "text-xs sm:text-sm break-words")}>
                                                {form.watch(`produtos.${index}.produtoNome`) || `Produto ${index + 1}`}
                                              </h4>
                                              <div className={cn("text-[11px] sm:text-xs text-muted-foreground mt-0.5 flex items-center gap-2")}>
                                                <span className={cn(
                                                  ds.typography.fontFamily.mono,
                                                  ds.colors.surface.card,
                                                  "px-1.5 rounded border"
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
                                              className={cn(ds.components.button.danger, "h-7 w-7 sm:h-8 sm:w-8 p-0 flex-shrink-0")}
                                            >
                                              <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
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
                          "flex flex-col gap-5 p-5 sm:p-6 lg:w-[320px] xl:w-[360px] flex-shrink-0 overflow-y-auto pb-24 scrollbar-hide",
                          "lg:border-r border-border/50 bg-card rounded-l-2xl"
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
                                    <PopoverContent className={cn(ds.colors.surface.card, ds.colors.border.default, "w-auto p-0 border shadow-2xl overflow-hidden rounded-2xl")} align="start">
                                      <Calendar
                                        mode="single"
                                        selected={field.value}
                                        onSelect={field.onChange}
                                        locale={ptBR}
                                        disabled={(date) => {
                                          const today = new Date();
                                          today.setHours(0, 0, 0, 0);
                                          return date < today;
                                        }}
                                        classNames={{
                                          day_selected: "bg-brand text-zinc-950 hover:bg-brand hover:text-zinc-950 focus:bg-brand focus:text-zinc-950 font-black rounded-xl",
                                          day_today: "bg-muted/50 text-accent-foreground border-2 border-brand/20 rounded-xl",
                                          day: cn(
                                            buttonVariants({ variant: "ghost" }),
                                            "h-9 w-9 p-0 font-medium aria-selected:opacity-100 hover:bg-brand/10 hover:text-brand rounded-xl transition-all"
                                          ),
                                          day_disabled: "text-muted-foreground/30 opacity-40 cursor-not-allowed",
                                          day_outside: "text-muted-foreground/20 opacity-30",
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
                              <div className="space-y-2">
                                <label className={ds.components.input.label}>Atalho de Período</label>
                                <Select onValueChange={(val) => {
                                  const days = parseInt(val);
                                  const hoje = new Date();
                                  hoje.setHours(0, 0, 0, 0);
                                  const fim = new Date(hoje);
                                  fim.setDate(hoje.getDate() + days);
                                  form.setValue("dataInicio", hoje);
                                  form.setValue("dataFim", fim);
                                  
                                  toast({
                                    title: "⏱️ Período aplicado",
                                    description: `Cotação definida para ${days === 0 ? 'hoje' : days + ' dias'}`,
                                    duration: 2000,
                                  });
                                }}>
                                  <SelectTrigger className={cn(ds.components.input.root, "w-full h-10")}>
                                    <SelectValue placeholder="Escolha um período rápido" />
                                  </SelectTrigger>
                                  <SelectContent className={cn(ds.colors.surface.card, ds.colors.border.default, "border shadow-xl")}>
                                    <SelectItem value="0">Somente hoje</SelectItem>
                                    <SelectItem value="3">Próximos 3 dias</SelectItem>
                                    <SelectItem value="7">Próximos 7 dias (Padrão)</SelectItem>
                                    <SelectItem value="15">Próximos 15 dias</SelectItem>
                                    <SelectItem value="30">Próximos 30 dias</SelectItem>
                                  </SelectContent>
                                </Select>
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
                                        <PopoverContent className={cn(ds.colors.surface.card, ds.colors.border.default, "w-auto p-0 border shadow-2xl overflow-hidden rounded-2xl")} align="start">
                                          <Calendar
                                            mode="single"
                                            selected={field.value}
                                            onSelect={field.onChange}
                                            locale={ptBR}
                                            disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                                            classNames={{
                                              day_selected: "bg-brand text-zinc-950 hover:bg-brand hover:text-zinc-950 focus:bg-brand focus:text-zinc-950 font-black rounded-xl",
                                              day_today: "bg-muted/50 text-accent-foreground border-2 border-brand/20 rounded-xl",
                                              day: cn(
                                                buttonVariants({ variant: "ghost" }),
                                                "h-9 w-9 p-0 font-medium aria-selected:opacity-100 hover:bg-brand/10 hover:text-brand rounded-xl transition-all"
                                              ),
                                              day_disabled: "text-muted-foreground/30 opacity-40 cursor-not-allowed",
                                              day_outside: "text-muted-foreground/20 opacity-30",
                                            }}
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
                                        <PopoverContent className={cn(ds.colors.surface.card, ds.colors.border.default, "w-auto p-0 border shadow-2xl overflow-hidden rounded-2xl")} align="start">
                                          <Calendar
                                            mode="single"
                                            selected={field.value}
                                            onSelect={field.onChange}
                                            locale={ptBR}
                                            disabled={(date) => {
                                              const dataIn = form.getValues("dataInicio") || new Date();
                                              const d = new Date(dataIn);
                                              d.setHours(0, 0, 0, 0);
                                              return date < d;
                                            }}
                                            classNames={{
                                              day_selected: "bg-brand text-zinc-950 hover:bg-brand hover:text-zinc-950 focus:bg-brand focus:text-zinc-950 font-black rounded-xl",
                                              day_today: "bg-muted/50 text-accent-foreground border-2 border-brand/20 rounded-xl",
                                              day: cn(
                                                buttonVariants({ variant: "ghost" }),
                                                "h-9 w-9 p-0 font-medium aria-selected:opacity-100 hover:bg-brand/10 hover:text-brand rounded-xl transition-all"
                                              ),
                                              day_disabled: "text-muted-foreground/30 opacity-40 cursor-not-allowed",
                                              day_outside: "text-muted-foreground/20 opacity-30",
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
                                  ref={supplierSearchRef}
                                  placeholder="Buscar fornecedor..."
                                  value={supplierSearch}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setSupplierSearch(val);
                                    // Auto-selecionar o primeiro resultado ao digitar
                                    if (val.length > 0) {
                                      setHighlightedSupplierIndex(0);
                                    } else {
                                      setHighlightedSupplierIndex(-1);
                                    }
                                  }}
                                  onKeyDown={handleSupplierKeyDown}
                                  className={cn(ds.components.input.root, "pl-10 h-9")}
                                />
                              </div>
                          </div>

                          <div className="flex-1 overflow-y-auto p-2 scrollbar-hide pb-20">
                            {supplierSearch.length === 0 && selectedSuppliers.length === 0 ? (
                              <div className="h-full flex flex-col items-center justify-center gap-2 p-6 text-center">
                                <Search className={cn("h-8 w-8 opacity-20", ds.colors.text.secondary)} />
                                <p className={cn(ds.typography.size.sm, ds.typography.weight.medium, ds.colors.text.secondary)}>
                                  Digite para buscar
                                </p>
                              </div>
                            ) : (
                                <div className="space-y-1">
                                  {(supplierSearch.length > 0 ? filteredSuppliers : selectedSuppliers).map((supplier, index) => {
                                    const isSelected = selectedSuppliers.some(s => s.id === supplier.id);
                                    const isHighlighted = supplierSearch.length > 0 && highlightedSupplierIndex === index;
                                    
                                    return (
                                      <button
                                        key={supplier.id}
                                        type="button"
                                        onClick={() => isSelected ? handleSupplierRemove(supplier.id) : handleSupplierSelect(supplier)}
                                        onMouseEnter={() => {
                                          if (supplierSearch.length > 0) setHighlightedSupplierIndex(index);
                                        }}
                                        className={cn(
                                          "w-full flex items-center gap-3 p-3 rounded-xl cursor-pointer border transition-all text-left",
                                          isSelected
                                            ? "border-brand/30 bg-brand/10 dark:bg-brand/20"
                                            : isHighlighted 
                                              ? "border-brand bg-brand/5 dark:bg-brand/10 shadow-md ring-1 ring-brand/30"
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
                                        {isSelected && (
                                          <div className="flex items-center gap-2">
                                            <Badge variant="outline" className="h-5 px-1.5 text-[10px] font-bold bg-brand/5 border-brand/20 text-brand">
                                              {(supplierItemAssignments[supplier.id] || []).length}/{fields.length} itens
                                            </Badge>
                                            <Button
                                              type="button"
                                              variant="ghost"
                                              size="icon"
                                              className="h-7 w-7 text-brand hover:bg-brand/10"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                changeTab("personalizar");
                                                setPersonalizeViewMode("by-supplier");
                                              }}
                                            >
                                              <LayoutList className="h-3.5 w-3.5" />
                                            </Button>
                                          </div>
                                        )}
                                      </button>
                                    );
                                  })}
                                {supplierSearch.length > 0 && filteredSuppliers.length === 0 && !showQuickCreateSupplier && (
                                  <div className="p-4 text-center space-y-3">
                                    <Building2 className={cn("h-6 w-6 mx-auto opacity-40", ds.colors.text.muted)} />
                                    <p className={cn(ds.typography.size.xs, ds.typography.weight.bold, ds.colors.text.muted, "uppercase tracking-widest")}>
                                      Nenhum resultado para "{supplierSearch}"
                                    </p>
                                    <Button
                                      type="button"
                                      onClick={() => setShowQuickCreateSupplier(true)}
                                      className={cn(ds.components.button.primary, "h-8 text-xs px-4")}
                                    >
                                      <Plus className="h-3.5 w-3.5 mr-1.5" />
                                      Cadastrar "{supplierSearch}"
                                    </Button>
                                  </div>
                                )}

                                {/* Formulário inline de cadastro rápido de fornecedor */}
                                {showQuickCreateSupplier && (
                                  <QuickCreateSupplier
                                    initialName={supplierSearch}
                                    onCreated={(supplier) => {
                                      setShowQuickCreateSupplier(false);
                                      // Adicionar à lista local de fornecedores e selecionar automaticamente
                                      const newSupplier = { id: supplier.id, name: supplier.name, contact: supplier.contact };
                                      setSuppliers(prev => [...prev, newSupplier].sort((a, b) => a.name.localeCompare(b.name)));
                                      handleSupplierSelect(newSupplier);
                                      setSupplierSearch("");
                                    }}
                                    onCancel={() => {
                                      setShowQuickCreateSupplier(false);
                                      supplierSearchRef.current?.focus();
                                    }}
                                  />
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                      </div>
                    </TabsContent>
                    <TabsContent value="personalizar" className="flex-1 h-full min-h-0 overflow-hidden m-0 p-0">
                      <div className={cn("h-full flex flex-col", ds.colors.surface.page)}>
                        <div className="p-4 sm:p-5 border-b flex-shrink-0 bg-card/80 backdrop-blur-sm sticky top-0 z-10">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center text-brand">
                                <MousePointerClick className="h-5 w-5" />
                              </div>
                              <div>
                                <h3 className={cn(ds.typography.size.base, ds.typography.weight.bold, ds.colors.text.primary)}>
                                  Configurar Envio
                                </h3>
                                <p className={cn(ds.typography.size.xs, ds.colors.text.secondary)}>
                                  Escolha quais produtos cada fornecedor receberá.
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 bg-muted/50 p-1 rounded-xl border border-border/50">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setPersonalizeViewMode("by-supplier")}
                                className={cn(
                                  "h-8 text-xs px-3 rounded-lg transition-all",
                                  personalizeViewMode === "by-supplier" 
                                    ? "bg-background shadow-sm text-brand font-bold" 
                                    : "text-muted-foreground hover:text-primary"
                                )}
                              >
                                <Building2 className="h-3.5 w-3.5 mr-1.5" />
                                Por Fornecedor
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setPersonalizeViewMode("by-product")}
                                className={cn(
                                  "h-8 text-xs px-3 rounded-lg transition-all",
                                  personalizeViewMode === "by-product" 
                                    ? "bg-background shadow-sm text-brand font-bold" 
                                    : "text-muted-foreground hover:text-primary"
                                )}
                              >
                                <Package className="h-3.5 w-3.5 mr-1.5" />
                                Por Produto
                              </Button>
                            </div>
                          </div>
                        </div>

                        {/* Search & Bulk Actions */}
                        <div className="px-4 py-3 border-b bg-muted/20 flex flex-wrap items-center justify-between gap-3">
                          <div className="relative flex-1 min-w-[200px] max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                            <Input
                              placeholder={personalizeViewMode === "by-supplier" ? "Filtrar fornecedores..." : "Filtrar produtos..."}
                              value={personalizeSearch}
                              onChange={(e) => setPersonalizeSearch(e.target.value)}
                              className="pl-9 h-9 text-xs bg-background/50 border-border/50 focus:border-brand/50 rounded-lg"
                            />
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const currentProductIds = fields.map(f => f.produtoId);
                                const newAssignments = { ...supplierItemAssignments };
                                selectedSuppliers.forEach(s => {
                                  newAssignments[s.id] = currentProductIds;
                                });
                                setSupplierItemAssignments(newAssignments);
                                toast({ title: "✅ Todos os itens atribuídos a todos os fornecedores" });
                              }}
                              className="h-8 text-[10px] uppercase tracking-wider font-bold hover:bg-brand/10 border-brand/30 text-brand"
                            >
                              Atribuir Tudo
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const newAssignments = { ...supplierItemAssignments };
                                selectedSuppliers.forEach(s => {
                                  newAssignments[s.id] = [];
                                });
                                setSupplierItemAssignments(newAssignments);
                                toast({ 
                                  title: "⚠️ Atribuições limpas",
                                  description: "Nenhum fornecedor receberá itens agora."
                                });
                              }}
                              className="h-8 text-[10px] uppercase tracking-wider font-bold hover:bg-red-50 border-red-200 text-red-500"
                            >
                              Limpar Tudo
                            </Button>
                          </div>
                        </div>

                        <ScrollArea className="flex-1">
                          <div className="p-4 sm:p-6 pb-24">
                            {selectedSuppliers.length === 0 ? (
                              <div className="py-20 text-center space-y-4">
                                <div className="w-16 h-16 rounded-full bg-muted mx-auto flex items-center justify-center">
                                  <Building2 className="h-8 w-8 opacity-20 text-brand" />
                                </div>
                                <div className="space-y-1">
                                  <p className={cn(ds.typography.size.sm, ds.typography.weight.bold, ds.colors.text.primary)}>
                                    Nenhum fornecedor selecionado
                                  </p>
                                  <p className={cn(ds.typography.size.xs, ds.colors.text.secondary)}>
                                    Selecione os fornecedores na aba anterior para configurar os itens.
                                  </p>
                                </div>
                                <Button 
                                  variant="outline" 
                                  onClick={() => changeTab("periodo_fornecedores")}
                                  className="h-9 text-xs"
                                >
                                  Voltar para Seleção
                                </Button>
                              </div>
                            ) : personalizeViewMode === "by-supplier" ? (
                              <div className="grid grid-cols-1 gap-6">
                                {selectedSuppliers
                                  .filter(s => s.name.toLowerCase().includes(personalizeSearch.toLowerCase()))
                                  .map((supplier) => (
                                  <div key={supplier.id} className={cn(
                                    ds.colors.surface.card,
                                    "border border-border/60 shadow-sm overflow-hidden rounded-2xl transition-all hover:border-brand/30"
                                  )}>
                                    <div className="py-3 px-4 bg-muted/40 border-b flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-lg bg-brand/10 flex items-center justify-center">
                                          <Building2 className="h-4 w-4 text-brand" />
                                        </div>
                                        <div>
                                          <h4 className="text-sm font-bold text-primary">{supplier.name}</h4>
                                          <p className="text-[10px] text-muted-foreground">
                                            {(supplierItemAssignments[supplier.id] || []).length} de {fields.length} itens selecionados
                                          </p>
                                        </div>
                                      </div>
                                      <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => {
                                            setSupplierItemAssignments(prev => ({
                                              ...prev,
                                              [supplier.id]: fields.map(f => f.produtoId)
                                            }));
                                          }}
                                          className="h-7 text-[10px] font-bold text-brand hover:bg-brand/10 px-2"
                                        >
                                          Tudo
                                        </Button>
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => {
                                            const currentAssignments = supplierItemAssignments[supplier.id] || [];
                                            const newAssignments = { ...supplierItemAssignments };
                                            selectedSuppliers.forEach(s => {
                                              newAssignments[s.id] = [...currentAssignments];
                                            });
                                            setSupplierItemAssignments(newAssignments);
                                            toast({ 
                                              title: "📋 Configuração copiada",
                                              description: `A lista de ${supplier.name} foi aplicada a todos os fornecedores.`,
                                              duration: 2000
                                            });
                                          }}
                                          className="h-7 text-[10px] font-bold text-blue-500 hover:bg-blue-50 px-2"
                                        >
                                          Replicar
                                        </Button>
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => {
                                            setSupplierItemAssignments(prev => ({
                                              ...prev,
                                              [supplier.id]: []
                                            }));
                                          }}
                                          className="h-7 text-[10px] font-bold text-red-500 hover:bg-red-50 px-2"
                                        >
                                          Limpar
                                        </Button>
                                      </div>
                                    </div>
                                    <div className="p-3 bg-background/50">
                                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                                        {fields.map((field) => {
                                          const isAssigned = (supplierItemAssignments[supplier.id] || []).includes(field.produtoId);
                                          return (
                                            <button
                                              key={field.id}
                                              type="button"
                                              onClick={() => {
                                                setSupplierItemAssignments(prev => {
                                                  const current = prev[supplier.id] || [];
                                                  const next = current.includes(field.produtoId)
                                                    ? current.filter(id => id !== field.produtoId)
                                                    : [...current, field.produtoId];
                                                  return { ...prev, [supplier.id]: next };
                                                });
                                              }}
                                              className={cn(
                                                "flex flex-col p-2.5 rounded-xl border text-left transition-all relative group",
                                                isAssigned 
                                                  ? "border-brand/40 bg-brand/[0.04] ring-1 ring-brand/10" 
                                                  : "border-border/50 bg-transparent opacity-60 grayscale-[0.5] hover:opacity-100 hover:grayscale-0 hover:border-brand/20"
                                              )}
                                            >
                                              <div className={cn(
                                                "absolute top-2 right-2 w-4 h-4 rounded-full border flex items-center justify-center transition-all",
                                                isAssigned ? "bg-brand border-brand text-zinc-950 scale-100" : "bg-transparent border-border scale-90"
                                              )}>
                                                {isAssigned && <Check className="h-2.5 w-2.5 stroke-[4]" />}
                                              </div>
                                              <p className={cn("text-[11px] font-bold leading-tight pr-4", isAssigned ? "text-brand" : "text-primary")}>
                                                {field.produtoNome}
                                              </p>
                                              <p className="text-[10px] text-muted-foreground mt-1">
                                                {field.quantidade} {field.unidade}
                                              </p>
                                            </button>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="grid grid-cols-1 gap-6">
                                {fields
                                  .filter(f => f.produtoNome.toLowerCase().includes(personalizeSearch.toLowerCase()))
                                  .map((field) => (
                                  <div key={field.id} className={cn(
                                    ds.colors.surface.card,
                                    "border border-border/60 shadow-sm overflow-hidden rounded-2xl transition-all hover:border-brand/30"
                                  )}>
                                    <div className="py-3 px-4 bg-muted/40 border-b flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-lg bg-brand/10 flex items-center justify-center">
                                          <Package className="h-4 w-4 text-brand" />
                                        </div>
                                        <div>
                                          <h4 className="text-sm font-bold text-primary">{field.produtoNome}</h4>
                                          <p className="text-[10px] text-muted-foreground">
                                            {selectedSuppliers.filter(s => (supplierItemAssignments[s.id] || []).includes(field.produtoId)).length} de {selectedSuppliers.length} fornecedores
                                          </p>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => {
                                            setSupplierItemAssignments(prev => {
                                              const next = { ...prev };
                                              selectedSuppliers.forEach(s => {
                                                const current = next[s.id] || [];
                                                if (!current.includes(field.produtoId)) {
                                                  next[s.id] = [...current, field.produtoId];
                                                }
                                              });
                                              return next;
                                            });
                                          }}
                                          className="h-7 text-[10px] font-bold text-brand hover:bg-brand/10 px-2"
                                        >
                                          Todos
                                        </Button>
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => {
                                            setSupplierItemAssignments(prev => {
                                              const next = { ...prev };
                                              selectedSuppliers.forEach(s => {
                                                next[s.id] = (next[s.id] || []).filter(id => id !== field.produtoId);
                                              });
                                              return next;
                                            });
                                          }}
                                          className="h-7 text-[10px] font-bold text-red-500 hover:bg-red-50 px-2"
                                        >
                                          Nenhum
                                        </Button>
                                      </div>
                                    </div>
                                    <div className="p-3 bg-background/50">
                                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                                        {selectedSuppliers.map((supplier) => {
                                          const isAssigned = (supplierItemAssignments[supplier.id] || []).includes(field.produtoId);
                                          return (
                                            <button
                                              key={supplier.id}
                                              type="button"
                                              onClick={() => {
                                                setSupplierItemAssignments(prev => {
                                                  const current = prev[supplier.id] || [];
                                                  const next = current.includes(field.produtoId)
                                                    ? current.filter(id => id !== field.produtoId)
                                                    : [...current, field.produtoId];
                                                  return { ...prev, [supplier.id]: next };
                                                });
                                              }}
                                              className={cn(
                                                "flex items-center gap-2 p-2.5 rounded-xl border text-left transition-all relative group",
                                                isAssigned 
                                                  ? "border-brand/40 bg-brand/[0.04] ring-1 ring-brand/10" 
                                                  : "border-border/50 bg-transparent opacity-60 grayscale-[0.5] hover:opacity-100 hover:grayscale-0 hover:border-brand/20"
                                              )}
                                            >
                                              <div className={cn(
                                                "w-4 h-4 rounded-full border flex items-center justify-center transition-all flex-shrink-0",
                                                isAssigned ? "bg-brand border-brand text-zinc-950" : "bg-transparent border-border"
                                              )}>
                                                {isAssigned && <Check className="h-2.5 w-2.5 stroke-[4]" />}
                                              </div>
                                              <p className={cn("text-[11px] font-bold leading-tight truncate", isAssigned ? "text-brand" : "text-primary")}>
                                                {supplier.name}
                                              </p>
                                            </button>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                        </div>
                      </ScrollArea>
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
                                  "p-5 rounded-2xl border bg-card/50",
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
                                    "p-5 rounded-2xl border bg-card/50",
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
                                    "p-5 rounded-2xl border bg-card/50",
                                    ds.colors.border.subtle
                                  )}>
                                    <div className="flex items-center gap-2 mb-4">
                                      <Building2 className="h-4 w-4 text-brand" />
                                      <h3 className={cn(ds.typography.size.sm, ds.typography.weight.semibold, ds.colors.text.primary)}>
                                        Fornecedores selecionados
                                      </h3>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                      {selectedSuppliers.map((s) => {
                                        const assignedCount = (supplierItemAssignments[s.id] || []).length;
                                        const totalCount = fields.length;
                                        const isPartial = assignedCount < totalCount;
                                        
                                        return (
                                          <div key={s.id} className={cn(
                                            "flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] uppercase tracking-wider font-bold border transition-all",
                                            isPartial ? "bg-amber-50 border-amber-200 text-amber-700" : cn(ds.colors.surface.section, ds.colors.border.subtle, ds.colors.text.secondary)
                                          )}>
                                            {s.name}
                                            <span className="opacity-50">
                                              ({assignedCount}/{totalCount})
                                            </span>
                                          </div>
                                        );
                                      })}
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
                  {currentTabIndex > 0 ? (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handlePrevious}
                      className={cn(ds.components.button.secondary, "h-9 text-sm px-4")}
                    >
                      <ChevronLeft className="mr-2 h-4 w-4" />
                      Voltar
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setOpen(false)}
                      className={cn(ds.components.button.secondary, "h-9 text-sm px-4")}
                    >
                      Cancelar
                    </Button>
                  )}

                  {currentTabIndex === tabs.length - 1 ? (
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className={cn(ds.components.button.primary, "h-9 text-sm px-5")}
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
                      className={cn(ds.components.button.primary, "h-9 text-sm px-5")}
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
              "border-border",
              "border-t-brand"
            )}></div>
            <p className={cn(ds.typography.size.sm, ds.typography.weight.medium, ds.colors.text.primary)}>Criando cotação...</p>
          </div>
        </div>
      )}
    </>
  );

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
          "p-0 flex flex-col [&>button]:hidden",
          ds.components.modal.content,
          "border backdrop-blur-xl",
          isMobile
            ? "w-full h-[100dvh] max-h-[100dvh] rounded-none border-none inset-0"
            : "w-[96vw] sm:w-[92vw] md:w-[85vw] max-w-[800px] h-[88vh] sm:h-[85vh] max-h-[750px] rounded-xl sm:rounded-2xl"
        )}
        onKeyDown={!isMobile ? handleModalKeyDown : undefined}
      >
        {mounted ? (isMobile ? mobileContent : modalInnerContent) : null}

        {/* Mobile Product Search Drawer — rendered at DialogContent level so it's always available */}
        <Drawer open={showMobileProductSearch && isMobile} onOpenChange={setShowMobileProductSearch}>
          <DrawerContent className={cn("h-[94vh] flex flex-col", ds.colors.surface.card, ds.colors.border.default, "border-t")}>
            <DrawerHeader className="border-b border-border/50 pb-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <DrawerTitle className="text-left text-brand flex items-center gap-2">
                    <Search className="h-5 w-5" />
                    Buscar Produto
                  </DrawerTitle>
                  <DrawerDescription className="text-left">
                    Procure pelo produto que deseja adicionar.
                  </DrawerDescription>
                </div>
                <DrawerClose asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                    <X className="h-4 w-4" />
                  </Button>
                </DrawerClose>
              </div>
            </DrawerHeader>

            <div className="p-4 space-y-4 flex-1 flex flex-col min-h-0 bg-background/30">
              {/* Campo de Busca no Drawer */}
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 group-focus-within:text-brand transition-colors" />
                <Input
                  ref={mobileProductSearchRef}
                  autoFocus
                  placeholder="Nome do produto..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className={cn(ds.components.input.root, "pl-10 h-12 text-base")}
                />
                {isSearchingProducts && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Loader2 className="h-4 w-4 animate-spin text-brand" />
                  </div>
                )}
              </div>

              {/* Resultados */}
              <ScrollArea className="flex-1 -mx-4 px-4 overflow-y-auto pr-2">
                <div className="space-y-2 pb-10">
                  {productSearch.length === 0 ? (
                    <div className="py-12 text-center space-y-3 opacity-60">
                      <div className={cn("w-12 h-12 rounded-full mx-auto flex items-center justify-center", ds.colors.surface.section)}>
                        <Search className="h-6 w-6 text-zinc-400" />
                      </div>
                      <p className={cn(ds.typography.size.sm, ds.colors.text.secondary)}>
                        Comece a digitar para buscar
                      </p>
                    </div>
                  ) : products.length > 0 ? (
                    products.map((product) => (
                      <Button
                        key={product.id}
                        variant="ghost"
                        type="button"
                        onClick={() => {
                          console.log("[AddQuoteDialog] Produto selecionado mobile:", product.name);
                          setSelectedProduct(product);
                          if (product.unit) setNewProductUnit(product.unit);
                          setProductSearch("");
                          setShowMobileProductSearch(false);
                          setTimeout(() => {
                            if (quantityInputRef.current) {
                              quantityInputRef.current.focus();
                            }
                          }, 300);
                        }}
                        className={cn(
                          "w-full h-auto py-3 px-4 justify-start text-left flex items-center gap-4 transition-all rounded-xl border border-transparent hover:border-brand/20 hover:bg-brand/5 active:scale-[0.98]",
                          ds.colors.surface.card
                        )}
                      >
                        <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0", ds.colors.surface.section)}>
                          <Package className="h-5 w-5 text-zinc-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={cn(ds.typography.weight.semibold, ds.colors.text.primary, "truncate text-base")}>
                            {product.name}
                          </p>
                          {product.unit && (
                            <p className={cn(ds.typography.size.xs, ds.colors.text.secondary, "mt-0.5")}>
                              Unidade sugerida: {product.unit}
                            </p>
                          )}
                        </div>
                        <ChevronRight className="h-4 w-4 text-zinc-300" />
                      </Button>
                    ))
                  ) : !isSearchingProducts ? (
                    <div className="py-10 text-center space-y-6">
                      <div className="space-y-2">
                        <div className={cn("w-16 h-16 rounded-full mx-auto flex items-center justify-center", ds.colors.surface.section)}>
                          <Package className="h-8 w-8 text-zinc-300" />
                        </div>
                        <p className={cn(ds.typography.size.base, ds.typography.weight.medium, ds.colors.text.primary)}>
                          Nenhum produto encontrado
                        </p>
                        <p className={cn(ds.typography.size.sm, ds.colors.text.secondary)}>
                          Não encontramos "{productSearch}" no catálogo.
                        </p>
                      </div>

                      <Button
                        variant="default"
                        onClick={() => {
                          setShowMobileProductSearch(false);
                          setShowQuickCreateProduct(true);
                        }}
                        className={cn(ds.components.button.primary, "w-full max-w-xs mx-auto h-12")}
                      >
                        <Plus className="h-5 w-5 mr-2" />
                        Cadastrar "{productSearch}"
                      </Button>
                    </div>
                  ) : null}
                </div>
              </ScrollArea>
            </div>
          </DrawerContent>
        </Drawer>
      </DialogContent>
    </Dialog>
  );
}
