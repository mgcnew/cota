import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Package, Users, TrendingDown, Edit2, Save, X, DollarSign, ShoppingCart, FileText, Download, Share2, Clock, Building2, Star, Minus, Edit, Plus, Trash2, Check, ChevronsUpDown, Loader2, Calendar as CalendarIcon, BarChart3, AlertCircle } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import ConvertToOrderDialog from "./ConvertToOrderDialog";
import ConvertToMultipleOrdersDialog, { SupplierOrder } from "./ConvertToMultipleOrdersDialog";
import { SelectSupplierPerProductDialog } from "./SelectSupplierPerProductDialog";

// Schemas de validação para edição
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

interface FornecedorParticipante {
  id: string;
  nome: string;
  valorOferecido: number;
  dataResposta: string | null;
  observacoes: string;
  status: "pendente" | "respondido";
}

interface Quote {
  id: string;
  produto: string;
  quantidade: string;
  status: string;
  dataInicio: string;
  dataFim: string;
  fornecedores: number;
  melhorPreco: string;
  melhorFornecedor: string;
  economia: string;
  fornecedoresParticipantes: FornecedorParticipante[];
  _raw?: any;
  _supplierItems?: any[];
}

interface ViewQuoteDialogProps {
  quote: Quote;
  onUpdateSupplierProductValue?: (quoteId: string, supplierId: string, productId: string, newValue: number) => void;
  onConvertToOrder?: (quoteId: string, orders: Array<{
    supplierId: string;
    productIds: string[];
    deliveryDate: string;
    observations?: string;
  }>) => void;
  onEdit?: (quoteId: string, data: QuoteFormData) => void;
  trigger?: React.ReactNode;
  isUpdating?: boolean;
  defaultTab?: string;
}

export default function ViewQuoteDialog({ quote, onUpdateSupplierProductValue, onConvertToOrder, onEdit, trigger, isUpdating, defaultTab = "detalhes" }: ViewQuoteDialogProps) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [selectedSupplier, setSelectedSupplier] = useState<string>("");
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editedValues, setEditedValues] = useState<Record<string, number>>({});
  const [convertDialogOpen, setConvertDialogOpen] = useState(false);
  const [selectedSupplierForConversion, setSelectedSupplierForConversion] = useState<{ id: string; name: string } | null>(null);
  const [showSelectSupplierDialog, setShowSelectSupplierDialog] = useState(false);
  const [selectedSuppliers, setSelectedSuppliers] = useState<Map<string, { supplierId: string; supplierName: string }>>(new Map());
  const [showMultipleOrdersDialog, setShowMultipleOrdersDialog] = useState(false);
  const [supplierOrdersForConversion, setSupplierOrdersForConversion] = useState<SupplierOrder[]>([]);
  const editInputRef = useRef<HTMLInputElement>(null);

  // Estados para formulário de edição
  const [editProducts, setEditProducts] = useState<any[]>([]);
  const [editSuppliers, setEditSuppliers] = useState<any[]>([]);
  const [editLoading, setEditLoading] = useState(false);
  const [editSelectedSuppliers, setEditSelectedSuppliers] = useState<any[]>([]);
  const [editSupplierSearch, setEditSupplierSearch] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const editForm = useForm<QuoteFormData>({
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

  const { fields: editFields, append: editAppend, remove: editRemove } = useFieldArray({
    control: editForm.control,
    name: "produtos",
  });

  const handleStartEdit = (productId: string, currentValue: number) => {
    setEditingProductId(productId);
    setEditedValues(prev => ({ ...prev, [productId]: currentValue }));
  };
  
  // Auto-foco e seleção quando entra em modo de edição
  useEffect(() => {
    if (editingProductId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingProductId]);

  const handleSaveEdit = (productId: string) => {
    if (selectedSupplier && onUpdateSupplierProductValue && editedValues[productId] !== undefined) {
      onUpdateSupplierProductValue(quote.id, selectedSupplier, productId, editedValues[productId]);
      setEditingProductId(null);
    }
  };

  const handleCancelEdit = () => {
    setEditingProductId(null);
    setEditedValues({});
  };

  // Get products from the quote
  const products = quote._raw?.quote_items || [];

  // Get supplier items for selected supplier
  const getSupplierProductValue = (supplierId: string, productId: string): number => {
    const supplierItems = quote._supplierItems || quote._raw?.quote_supplier_items || [];
    const item = supplierItems.find(
      (item: any) => item.supplier_id === supplierId && item.product_id === productId
    );
    return item?.valor_oferecido || 0;
  };

  // Calculate best price for each product and return the supplier ID
  const getBestPriceInfoForProduct = (productId: string): { bestPrice: number; bestSupplierId: string | null } => {
    let bestPrice = Infinity;
    let bestSupplierId: string | null = null;

    quote.fornecedoresParticipantes.forEach(f => {
      const value = getSupplierProductValue(f.id, productId);
      if (value > 0 && value < bestPrice) {
        bestPrice = value;
        bestSupplierId = f.id;
      }
    });

    return {
      bestPrice: bestPrice === Infinity ? 0 : bestPrice,
      bestSupplierId
    };
  };

  const getMelhorValor = () => {
    const valores = quote.fornecedoresParticipantes
      .filter(f => f.valorOferecido > 0)
      .map(f => f.valorOferecido);
    return valores.length > 0 ? Math.min(...valores) : 0;
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      ativa: "default",
      concluida: "secondary",
      pendente: "outline",
      expirada: "destructive",
      finalizada: "default"
    };

    const labels = {
      ativa: "Ativa",
      concluida: "Concluída",
      pendente: "Pendente",
      expirada: "Expirada",
      finalizada: "Finalizada"
    };

    return (
      <Badge variant={variants[status as keyof typeof variants] as any}>
        {labels[status as keyof typeof labels]}
      </Badge>
    );
  };

  // Get best supplier based on total value
  // Carregar dados para edição quando tab for acessada
  useEffect(() => {
    if (open && activeTab === "edicao" && onEdit) {
      const shouldLoad = editProducts.length === 0 && !editLoading;
      if (shouldLoad) {
        loadEditData();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, activeTab]);

  const loadEditData = async () => {
    setEditLoading(true);
    try {
      // Load products and suppliers
      const [productsRes, suppliersRes] = await Promise.all([
        supabase.from("products").select("id, name").order("name"),
        supabase.from("suppliers").select("id, name").order("name"),
      ]);

      if (productsRes.data) setEditProducts(productsRes.data);
      if (suppliersRes.data) setEditSuppliers(suppliersRes.data);

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
        // Set products
        let produtosData = [];
        if (quoteData.quote_items && quoteData.quote_items.length > 0) {
          produtosData = quoteData.quote_items.map((item: any) => ({
            produtoId: item.product_id || "",
            produtoNome: item.product_name || "",
            quantidade: String(item.quantidade || ""),
            unidade: item.unidade || "kg",
          }));
        } else {
          produtosData = [{
            produtoId: "",
            produtoNome: "",
            quantidade: "",
            unidade: "kg",
          }];
        }

        // Set suppliers
        const suppliersData = (quoteData.quote_suppliers || []).map((s: any) => ({
          id: s.supplier_id,
          name: s.supplier_name,
        }));
        setEditSelectedSuppliers(suppliersData);

        const formData = {
          produtos: produtosData,
          dataInicio: new Date(quoteData.data_inicio),
          dataFim: new Date(quoteData.data_fim),
          dataPlanejada: quoteData.data_planejada ? new Date(quoteData.data_planejada) : undefined,
          fornecedoresIds: suppliersData.map((s: any) => s.id),
          observacoes: quoteData.observacoes || "",
          status: quoteData.status,
        };
        
        editForm.reset(formData);
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados da cotação",
        variant: "destructive",
      });
    } finally {
      setEditLoading(false);
    }
  };

  const handleEditSupplierSelect = (supplier: any) => {
    if (!editSelectedSuppliers.find(s => s.id === supplier.id)) {
      const newSuppliers = [...editSelectedSuppliers, supplier];
      setEditSelectedSuppliers(newSuppliers);
      editForm.setValue("fornecedoresIds", newSuppliers.map(s => s.id));
    }
    setEditSupplierSearch("");
  };

  const handleEditSupplierRemove = (supplierId: string) => {
    const newSuppliers = editSelectedSuppliers.filter(s => s.id !== supplierId);
    setEditSelectedSuppliers(newSuppliers);
    editForm.setValue("fornecedoresIds", newSuppliers.map(s => s.id));
  };

  const filteredEditSuppliers = editSuppliers.filter(supplier =>
    !editSelectedSuppliers.find(s => s.id === supplier.id) &&
    supplier.name.toLowerCase().includes(editSupplierSearch.toLowerCase())
  );

  const handleEditSubmit = async (data: QuoteFormData) => {
    if (!onEdit) return;
    
    setIsSavingEdit(true);
    try {
      await onEdit(quote.id, data);
      toast({
        title: "✅ Cotação atualizada",
        description: "As alterações foram salvas com sucesso.",
      });
      // Opcional: voltar para tab de detalhes após salvar
      setActiveTab("detalhes");
    } catch (error) {
      console.error("Erro ao salvar:", error);
      toast({
        title: "❌ Erro ao salvar",
        description: "Não foi possível salvar as alterações.",
        variant: "destructive",
      });
    } finally {
      setIsSavingEdit(false);
    }
  };

  const getBestSupplier = () => {
    if (quote.fornecedoresParticipantes.length === 0) return null;

    let bestSupplier = null;
    let lowestTotal = Infinity;

    quote.fornecedoresParticipantes.forEach(fornecedor => {
      let total = 0;
      products.forEach((product: any) => {
        const value = getSupplierProductValue(fornecedor.id, product.product_id);
        if (value > 0) {
          total += value;
        }
      });

      if (total > 0 && total < lowestTotal) {
        lowestTotal = total;
        bestSupplier = fornecedor;
      }
    });

    return bestSupplier ? { ...bestSupplier, totalValue: lowestTotal } : null;
  };

  const buildProductSelections = () => {
    if (!products || products.length === 0) {
      return [];
    }

    return products.map((item: any) => {
      const supplierOptions = quote.fornecedoresParticipantes
        .map(fornecedor => {
          const supplierItem = (quote._supplierItems || quote._raw?.quote_supplier_items || []).find(
            (si: any) => si.supplier_id === fornecedor.id && si.product_id === item.product_id
          );

          return {
            supplierId: fornecedor.id,
            supplierName: fornecedor.nome,
            price: supplierItem?.valor_oferecido || 0,
            isBest: false
          };
        })
        .filter(s => s.price > 0);

      if (supplierOptions.length > 0) {
        const minPrice = Math.min(...supplierOptions.map(s => s.price));
        supplierOptions.forEach(option => {
          if (option.price === minPrice) {
            option.isBest = true;
          }
        });
      }

      const bestSupplierOption = supplierOptions.find(option => option.isBest);

      return {
        productId: item.product_id,
        productName: item.product_name,
        quantity: item.quantidade,
        unit: item.unidade,
        selectedSupplierId: bestSupplierOption?.supplierId || "",
        selectedSupplierName: bestSupplierOption?.supplierName || "",
        supplierOptions
      };
    });
  };

  const handleConvertToOrder = () => {
    const productSelections = buildProductSelections();

    if (productSelections.length === 0) {
      return;
    }

    const hasMultipleProducts = productSelections.length > 1;
    const hasTiedBestPrices = productSelections.some(selection =>
      selection.supplierOptions.filter(option => option.isBest).length > 1
    );

    if (hasMultipleProducts || hasTiedBestPrices) {
      const initialSelections = new Map<string, { supplierId: string; supplierName: string }>();
      productSelections.forEach(selection => {
        if (selection.selectedSupplierId) {
          initialSelections.set(selection.productId, {
            supplierId: selection.selectedSupplierId,
            supplierName: selection.selectedSupplierName
          });
        } else if (selection.supplierOptions.length > 0) {
          const fallback = selection.supplierOptions[0];
          initialSelections.set(selection.productId, {
            supplierId: fallback.supplierId,
            supplierName: fallback.supplierName
          });
        }
      });

      setSelectedSuppliers(initialSelections);
      setShowSelectSupplierDialog(true);
      return;
    }

    const bestSupplier = getBestSupplier();
    if (bestSupplier) {
      setSelectedSupplierForConversion({
        id: bestSupplier.id,
        name: bestSupplier.nome
      });
      setConvertDialogOpen(true);
    }
  };

  const handleSupplierSelectionConfirm = (selections: Map<string, { supplierId: string; supplierName: string }>) => {
    setSelectedSuppliers(selections);
    setShowSelectSupplierDialog(false);

    // Agrupar por fornecedor
    const supplierGroups = new Map<string, string[]>();
    selections.forEach((selection, productId) => {
      if (!supplierGroups.has(selection.supplierId)) {
        supplierGroups.set(selection.supplierId, []);
      }
      supplierGroups.get(selection.supplierId)!.push(productId);
    });

    // Se apenas 1 fornecedor foi escolhido, usar fluxo simples
    if (supplierGroups.size === 1) {
      const [supplierId, productIds] = Array.from(supplierGroups.entries())[0];
      const selection = selections.get(productIds[0]);
      if (selection) {
        setSelectedSupplierForConversion({
          id: selection.supplierId,
          name: selection.supplierName
        });
        setConvertDialogOpen(true);
      }
    } else {
      // Múltiplos fornecedores - preparar dados para múltiplos pedidos
      const supplierOrders: SupplierOrder[] = Array.from(supplierGroups.entries()).map(([supplierId, productIds]) => {
        const selection = selections.get(productIds[0]);
        const supplierName = selection!.supplierName;
        
        // Buscar produtos e valores
        const productsData = productIds.map(productId => {
          const product = quote._raw.quote_items.find((item: any) => item.product_id === productId);
          const value = getSupplierProductValue(supplierId, productId);
          
          return {
            productId,
            productName: product.product_name,
            quantity: product.quantidade,
            value
          };
        });
        
        const totalValue = productsData.reduce((sum, p) => sum + p.value, 0);
        
        return {
          supplierId,
          supplierName,
          products: productsData,
          totalValue,
          deliveryDate: '',
          observations: ''
        };
      });

      setSupplierOrdersForConversion(supplierOrders);
      setShowMultipleOrdersDialog(true);
    }
  };

  const handleConfirmConversion = (deliveryDate: string, observations?: string) => {
    if (selectedSupplierForConversion && onConvertToOrder) {
      // Fluxo simples: 1 fornecedor com todos os produtos
      const allProductIds = products.map((p: any) => p.product_id);
      onConvertToOrder(quote.id, [{
        supplierId: selectedSupplierForConversion.id,
        productIds: allProductIds,
        deliveryDate,
        observations
      }]);
      setConvertDialogOpen(false);
      setOpen(false);
    }
  };

  const handleConfirmMultipleOrders = (supplierOrders: SupplierOrder[]) => {
    if (onConvertToOrder) {
      const orders = supplierOrders.map(order => ({
        supplierId: order.supplierId,
        productIds: order.products.map(p => p.productId),
        deliveryDate: order.deliveryDate,
        observations: order.observations
      }));
      
      onConvertToOrder(quote.id, orders);
      setShowMultipleOrdersDialog(false);
      setOpen(false);
    }
  };

  const bestSupplier = getBestSupplier();

  // Get products for conversion dialog
  const getConversionProducts = () => {
    if (!bestSupplier) return [];
    return products.map((product: any) => {
      const value = getSupplierProductValue(bestSupplier.id, product.product_id);
      return {
        id: product.product_id,
        name: product.product_name,
        quantity: product.quantidade,
        value: value
      };
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="w-[96vw] sm:w-[92vw] md:w-[90vw] max-w-[900px] h-[90vh] sm:h-[88vh] max-h-[850px] overflow-hidden border border-gray-200/60 dark:border-gray-700/30 shadow-xl rounded-xl sm:rounded-2xl p-0 flex flex-col bg-white dark:bg-gray-900 [&>button]:hidden">
        <DialogHeader className="flex-shrink-0 px-4 sm:px-5 py-3 sm:py-4 border-b border-gray-200/60 dark:border-gray-700/40 bg-white dark:bg-gray-900">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white flex-shrink-0">
                <Package className="h-4 w-4" />
              </div>
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <DialogTitle className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                  Detalhes da Cotação
                </DialogTitle>
                <div className="hidden sm:block">
                  {getStatusBadge(quote.status)}
                </div>
              </div>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 flex-shrink-0 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={() => setOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="flex flex-col flex-1 min-h-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex flex-col flex-1 min-h-0">
            <div className="px-2 sm:px-4 md:px-6 py-2 sm:py-2.5 border-b border-gray-200/60 dark:border-gray-700 bg-gradient-to-r from-gray-50/80 to-slate-50/60 dark:from-gray-800/50 dark:to-gray-900/50 backdrop-blur-sm flex-shrink-0">
              <TabsList className={`grid w-full ${onEdit && quote.status !== "concluida" ? "grid-cols-4" : "grid-cols-3"} bg-white/70 dark:bg-gray-800/95 backdrop-blur-sm rounded-lg sm:rounded-xl p-1 shadow-md border border-gray-200/50 dark:border-gray-700 gap-1 h-8 sm:h-9 transition-colors`}>
                <TabsTrigger
                  value="detalhes"
                  className="group relative rounded-md sm:rounded-lg font-medium text-xs sm:text-sm transition-all duration-200 data-[state=active]:bg-blue-600 dark:data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-md hover:bg-blue-50 dark:hover:bg-gray-700/50 data-[state=active]:hover:bg-blue-700 dark:data-[state=active]:hover:bg-blue-700 px-2 sm:px-3 py-1.5 sm:py-2 flex items-center justify-center gap-1.5 sm:gap-2 text-gray-700 dark:text-gray-300"
                >
                  <Package className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                  <span className="hidden xs:inline">Detalhes</span>
                  {quote.fornecedoresParticipantes.length > 0 && (
                    <Badge variant="secondary" className="ml-0.5 h-4 px-1 text-[9px] font-semibold bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 data-[state=active]:bg-blue-500/20 dark:data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-100 dark:data-[state=active]:text-blue-100">
                      {quote.fornecedoresParticipantes.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger
                  value="comparativo"
                  className="group relative rounded-md sm:rounded-lg font-medium text-xs sm:text-sm transition-all duration-200 data-[state=active]:bg-purple-600 dark:data-[state=active]:bg-purple-600 data-[state=active]:text-white data-[state=active]:shadow-md hover:bg-purple-50 dark:hover:bg-gray-700/50 data-[state=active]:hover:bg-purple-700 dark:data-[state=active]:hover:bg-purple-700 px-2 sm:px-3 py-1.5 sm:py-2 flex items-center justify-center gap-1.5 sm:gap-2 text-gray-700 dark:text-gray-300"
                >
                  <BarChart3 className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                  <span className="hidden xs:inline">Comparativo</span>
                </TabsTrigger>
                <TabsTrigger
                  value="atualizacao"
                  className="group relative rounded-md sm:rounded-lg font-medium text-xs sm:text-sm transition-all duration-200 data-[state=active]:bg-emerald-600 dark:data-[state=active]:bg-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-md hover:bg-emerald-50 dark:hover:bg-gray-700/50 data-[state=active]:hover:bg-emerald-700 dark:data-[state=active]:hover:bg-emerald-700 px-2 sm:px-3 py-1.5 sm:py-2 flex items-center justify-center gap-1.5 sm:gap-2 text-gray-700 dark:text-gray-300"
                >
                  <DollarSign className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                  <span className="hidden xs:inline">Valores</span>
                  {products.length > 0 && (
                    <Badge variant="secondary" className="ml-0.5 h-4 px-1 text-[9px] font-semibold bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 data-[state=active]:bg-emerald-500/20 dark:data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-100 dark:data-[state=active]:text-emerald-100">
                      {products.length}
                    </Badge>
                  )}
                </TabsTrigger>
                {onEdit && quote.status !== "concluida" && (
                  <TabsTrigger
                    value="edicao"
                    className="group relative rounded-md sm:rounded-lg font-medium text-xs sm:text-sm transition-all duration-200 data-[state=active]:bg-orange-600 dark:data-[state=active]:bg-orange-600 data-[state=active]:text-white data-[state=active]:shadow-md hover:bg-orange-50 dark:hover:bg-gray-700/50 data-[state=active]:hover:bg-orange-700 dark:data-[state=active]:hover:bg-orange-700 px-2 sm:px-3 py-1.5 sm:py-2 flex items-center justify-center gap-1.5 sm:gap-2 text-gray-700 dark:text-gray-300"
                  >
                    <Edit className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                    <span className="hidden xs:inline">Edição</span>
                    {editForm.formState.isDirty && (
                      <AlertCircle className="h-3 w-3 text-orange-500 data-[state=active]:text-orange-100 animate-pulse flex-shrink-0" />
                    )}
                  </TabsTrigger>
                )}
              </TabsList>
            </div>

            <TabsContent value="detalhes" className="flex-1 overflow-y-auto p-2.5 sm:p-3 md:p-4 animate-in fade-in-0 slide-in-from-right-2 duration-300 min-h-0">
              {/* Layout otimizado e compacto */}
              <div className="max-w-5xl mx-auto space-y-3">
                
                {/* Seção 1: Resumo Executivo - Grid Compacto */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-2.5">
                  <Card className="p-2 sm:p-2.5 border border-blue-200/80 dark:border-blue-800/30 bg-gradient-to-br from-blue-50/90 to-blue-100/60 dark:from-blue-500/10 dark:to-transparent hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-md dark:hover:shadow-lg dark:hover:shadow-black/20 transition-all duration-200 rounded-lg shadow-sm dark:shadow-none">
                    <div className="flex items-center gap-1.5">
                      <div className="p-1.5 rounded-lg bg-blue-600 dark:bg-blue-600 text-white flex-shrink-0">
                        <Package className="h-3.5 w-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-medium text-blue-700 dark:text-blue-400 mb-0.5">Produtos</p>
                        <p className="font-bold text-sm text-blue-900 dark:text-white">{products.length}</p>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-2 sm:p-2.5 border border-purple-200 dark:border-purple-800/30 bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-500/10 dark:to-transparent hover:border-purple-300 dark:hover:border-purple-700 transition-all rounded-lg shadow-sm dark:shadow-none">
                    <div className="flex items-center gap-1.5">
                      <div className="p-1.5 rounded-lg bg-purple-600 dark:bg-purple-600 text-white flex-shrink-0">
                        <Users className="h-3.5 w-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-medium text-purple-700 dark:text-purple-400 mb-0.5">Fornecedores</p>
                        <p className="font-bold text-sm text-purple-900 dark:text-white">{quote.fornecedores}</p>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-2 sm:p-2.5 border border-amber-200 dark:border-amber-800/30 bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-500/10 dark:to-transparent hover:border-amber-300 dark:hover:border-amber-700 transition-all rounded-lg shadow-sm dark:shadow-none">
                    <div className="flex items-center gap-1.5">
                      <div className="p-1.5 rounded-lg bg-amber-600 dark:bg-amber-600 text-white flex-shrink-0">
                        <Clock className="h-3.5 w-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-medium text-amber-700 dark:text-amber-400 mb-0.5">Prazo</p>
                        <p className="font-semibold text-xs text-amber-900 dark:text-white truncate">{quote.dataFim}</p>
                        {quote._raw?.data_planejada && (
                          <p className="text-[9px] text-amber-600 dark:text-amber-500 mt-0.5 truncate">
                            {new Date(quote._raw.data_planejada).toLocaleDateString("pt-BR")}
                          </p>
                        )}
                      </div>
                    </div>
                  </Card>

                  <Card className="p-2 sm:p-2.5 border border-emerald-200 dark:border-emerald-800/30 bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-500/10 dark:to-transparent hover:border-emerald-300 dark:hover:border-emerald-700 transition-all rounded-lg shadow-sm dark:shadow-none">
                    <div className="flex items-center gap-1.5">
                      <div className="p-1.5 rounded-lg bg-emerald-600 dark:bg-emerald-600 text-white flex-shrink-0">
                        <TrendingDown className="h-3.5 w-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-medium text-emerald-700 dark:text-emerald-400 mb-0.5">Economia</p>
                        <p className="font-bold text-xs text-emerald-900 dark:text-white truncate">{quote.economia}</p>
                      </div>
                    </div>
                  </Card>
                </div>

                {/* Seção 2: Melhor Oferta Destaque */}
                {bestSupplier && (
                  <Card className="p-3 sm:p-4 border-2 border-emerald-300/70 dark:border-emerald-800/30 bg-gradient-to-br from-emerald-50 via-green-50 to-emerald-100/50 dark:from-emerald-500/10 dark:to-transparent rounded-lg shadow-md dark:shadow-none hover:shadow-lg dark:hover:shadow-lg dark:hover:shadow-black/20 transition-all duration-300">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 flex-1 min-w-0">
                        <div className="p-2 rounded-lg bg-emerald-600 dark:bg-emerald-600 text-white flex-shrink-0">
                          <Star className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 uppercase mb-0.5">Melhor Fornecedor</p>
                          <p className="font-bold text-sm text-emerald-900 dark:text-white truncate">{bestSupplier.nome}</p>
                          <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium mt-0.5">R$ {bestSupplier.totalValue.toFixed(2)}</p>
                        </div>
                      </div>
                      <div className="flex-shrink-0 text-right">
                        <p className="text-[10px] text-emerald-700 dark:text-emerald-400 font-medium mb-0.5">Economia</p>
                        <p className="text-base font-bold text-emerald-600 dark:text-emerald-400">{quote.economia}</p>
                      </div>
                    </div>
                  </Card>
                )}

                {/* Seção 3: Fornecedores Participantes - Tabela Compacta */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs font-semibold text-slate-700 dark:text-gray-300 flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5" />
                      Fornecedores Participantes
                    </h3>
                    <Badge variant="secondary" className="text-[10px] dark:bg-gray-700 dark:text-gray-200">
                      {quote.fornecedoresParticipantes.length}
                    </Badge>
                  </div>
                  
                  <Card className="border border-slate-200/80 dark:border-gray-700/60 bg-white dark:bg-[#1C1F26] rounded-lg sm:rounded-xl overflow-hidden shadow-md dark:shadow-none hover:shadow-lg dark:hover:shadow-lg dark:hover:shadow-black/20 transition-all duration-200">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-slate-50 dark:bg-gray-800/50 border-b border-slate-200 dark:border-gray-700">
                          <tr>
                            <th className="px-2 py-1.5 text-left text-[10px] font-semibold text-slate-700 dark:text-gray-300">Fornecedor</th>
                            <th className="px-2 py-1.5 text-left text-[10px] font-semibold text-slate-700 dark:text-gray-300">Status</th>
                            <th className="px-2 py-1.5 text-right text-[10px] font-semibold text-slate-700 dark:text-gray-300">Valor Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-gray-700">
                          {quote.fornecedoresParticipantes.map((fornecedor, index) => {
                            const totalValue = products.reduce((sum: number, product: any) => {
                              const value = getSupplierProductValue(fornecedor.id, product.product_id);
                              return sum + (value || 0);
                            }, 0);
                            const isBest = bestSupplier && fornecedor.id === bestSupplier.id;
                            
                            return (
                              <tr key={fornecedor.id} className={cn(
                                "hover:bg-slate-50 dark:hover:bg-gray-700/50 transition-colors",
                                isBest && "bg-emerald-50 dark:bg-emerald-900/20"
                              )}>
                                <td className="px-2 py-1.5">
                                  <div className="flex items-center gap-1.5">
                                    <div className={cn(
                                      "w-1.5 h-1.5 rounded-full flex-shrink-0",
                                      fornecedor.status === 'respondido' ? "bg-emerald-500 dark:bg-gray-600" : "bg-amber-500 dark:bg-gray-500"
                                    )}></div>
                                    <div className="flex-1 min-w-0">
                                      <p className="font-semibold text-xs text-slate-900 dark:text-white truncate">
                                        {fornecedor.nome}
                                        {isBest && <Star className="inline-block h-2.5 w-2.5 ml-0.5 text-emerald-600 dark:text-gray-400" />}
                                      </p>
                                      {fornecedor.dataResposta && (
                                        <p className="text-[10px] text-slate-500 dark:text-gray-400 truncate">{fornecedor.dataResposta}</p>
                                      )}
                                    </div>
                                  </div>
                                </td>
                                <td className="px-2 py-1.5">
                                  <Badge 
                                    variant={fornecedor.status === 'respondido' ? 'default' : 'outline'}
                                    className={cn(
                                      "text-[10px] h-4 px-1.5",
                                      fornecedor.status === 'respondido' 
                                        ? "bg-emerald-100 dark:bg-gray-700/50 text-emerald-700 dark:text-gray-300 border-emerald-200 dark:border-gray-600" 
                                        : "border-amber-300 dark:border-gray-600 text-amber-700 dark:text-gray-400 bg-amber-50 dark:bg-gray-800/50"
                                    )}
                                  >
                                    {fornecedor.status === 'respondido' ? 'OK' : 'Pend.'}
                                  </Badge>
                                </td>
                                <td className="px-2 py-1.5 text-right">
                                  {totalValue > 0 ? (
                                    <p className={cn(
                                      "font-bold text-xs",
                                      isBest ? "text-emerald-600 dark:text-gray-300" : "text-slate-900 dark:text-white"
                                    )}>
                                      R$ {totalValue.toFixed(2)}
                                    </p>
                                  ) : (
                                    <span className="text-[10px] text-slate-400 dark:text-gray-500">-</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="atualizacao" className="flex-1 overflow-hidden p-3 sm:p-4 md:p-5 animate-in fade-in-0 slide-in-from-right-2 duration-300">
              <div className="h-full flex flex-col lg:flex-row gap-4 sm:gap-5">
                {/* Painel Esquerdo - Seleção de Fornecedor Melhorada */}
                <div className="lg:w-80 flex-shrink-0 flex flex-col gap-2.5 sm:gap-3 min-h-0">
                  {/* Card de Seleção Principal */}
                  <Card className="border-2 border-emerald-200/80 dark:border-gray-700/30 bg-white dark:bg-[#1C1F26] shadow-md dark:shadow-none hover:shadow-lg dark:hover:shadow-lg dark:hover:shadow-black/20 transition-all duration-200 rounded-lg">
                    <div className="p-2.5 sm:p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-gray-700/50">
                          <Building2 className="h-3.5 w-3.5 text-emerald-600 dark:text-gray-300" />
                        </div>
                        <div>
                          <h3 className="text-xs font-semibold text-gray-900 dark:text-white">
                            Selecionar Fornecedor
                          </h3>
                          <p className="text-[10px] text-gray-600 dark:text-gray-400">Escolha para editar valores</p>
                        </div>
                      </div>
                      <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
                        <SelectTrigger className="w-full h-9 text-xs border-emerald-200 dark:border-gray-700/50 hover:border-emerald-300 dark:hover:border-gray-600 focus:ring-emerald-500 dark:focus:ring-gray-600 focus:ring-2 transition-all">
                          <SelectValue placeholder="Escolha um fornecedor..." />
                        </SelectTrigger>
                        <SelectContent>
                          {quote.fornecedoresParticipantes.map(fornecedor => {
                            const totalValue = products.reduce((sum: number, product: any) => {
                              const value = getSupplierProductValue(fornecedor.id, product.product_id);
                              return sum + (value || 0);
                            }, 0);
                            return (
                              <SelectItem key={fornecedor.id} value={fornecedor.id}>
                                <div className="flex items-center justify-between w-full gap-3">
                              <div className="flex items-center gap-2">
                                <div className={cn(
                                      "w-2.5 h-2.5 rounded-full",
                                  fornecedor.status === 'respondido' ? "bg-emerald-500 dark:bg-gray-600" : "bg-amber-500 dark:bg-gray-500"
                                )}></div>
                                    <span className="font-medium">{fornecedor.nome}</span>
                                  </div>
                                  {totalValue > 0 && (
                                    <span className="text-xs font-semibold text-emerald-600 dark:text-gray-300">
                                      R$ {totalValue.toFixed(2)}
                                    </span>
                                  )}
                              </div>
                            </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>
                  </Card>

                  {/* Lista de Fornecedores - Visual Melhorado */}
                  <Card className="border border-gray-200/80 dark:border-gray-700/60 bg-white dark:bg-gray-800 rounded-lg shadow-sm flex flex-col overflow-hidden flex-1 min-h-0">
                    <div className="p-2 border-b border-gray-200/60 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-800/50 flex-shrink-0">
                      <h4 className="text-[10px] font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                        <Users className="h-3 w-3 text-emerald-600 dark:text-gray-400" />
                        Todos os Fornecedores
                      </h4>
                    </div>
                    <div className="flex-1 overflow-y-auto p-1.5 space-y-1 min-h-0 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
                      {quote.fornecedoresParticipantes.map(fornecedor => {
                        const isSelected = selectedSupplier === fornecedor.id;
                        const totalValue = products.reduce((sum: number, product: any) => {
                          const value = getSupplierProductValue(fornecedor.id, product.product_id);
                          return sum + (value || 0);
                        }, 0);
                        
                        return (
                          <button
                            key={fornecedor.id}
                            onClick={() => setSelectedSupplier(fornecedor.id)}
                            className={cn(
                              "w-full text-left p-2 rounded-md transition-all duration-200 border",
                              isSelected 
                                ? "bg-emerald-50 dark:bg-gray-700/50 border-emerald-300 dark:border-gray-600 shadow-sm" 
                                : "hover:bg-gray-50 dark:hover:bg-gray-700/50 border-transparent hover:border-gray-200 dark:hover:border-gray-600"
                            )}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-1.5 flex-1 min-w-0">
                                <div className={cn(
                                  "w-2 h-2 rounded-full flex-shrink-0",
                                  fornecedor.status === 'respondido' ? "bg-emerald-500 dark:bg-gray-600" : "bg-amber-500 dark:bg-gray-500"
                                )}></div>
                                <span className={cn(
                                  "text-xs font-medium truncate",
                                  isSelected ? "text-emerald-900 dark:text-white" : "text-gray-700 dark:text-gray-300"
                                )}>
                                  {fornecedor.nome}
                                </span>
                                <Badge 
                                  variant={fornecedor.status === 'respondido' ? 'default' : 'outline'}
                                  className={cn(
                                    "text-[9px] h-4 px-1",
                                    fornecedor.status === 'respondido' 
                                      ? "bg-emerald-100 dark:bg-gray-700/50 text-emerald-700 dark:text-gray-300 border-emerald-200 dark:border-gray-600" 
                                      : "border-amber-300 dark:border-gray-600 text-amber-700 dark:text-gray-400 bg-amber-50 dark:bg-gray-800/50"
                                  )}
                                >
                                  {fornecedor.status === 'respondido' ? 'OK' : 'Pend.'}
                                </Badge>
                              </div>
                              {totalValue > 0 && (
                                <span className={cn(
                                  "text-xs font-bold flex-shrink-0",
                                  isSelected ? "text-emerald-700 dark:text-gray-300" : "text-gray-600 dark:text-gray-400"
                                )}>
                                  R$ {totalValue.toFixed(2)}
                                </span>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </Card>

                  {/* Alerta de Cotação Finalizada */}
                  {quote.status === "concluida" && (
                    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40 rounded-lg p-3">
                      <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300">
                        <ShoppingCart className="h-4 w-4 flex-shrink-0" />
                        <span className="text-xs font-medium">
                          Cotação finalizada
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Painel Direito - Tabela de Produtos */}
                <div className="flex-1 min-w-0">
                  {!selectedSupplier ? (
                    <Card className="h-full border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                      <div className="h-full flex items-center justify-center p-8">
                        <div className="text-center">
                          <div className="p-4 rounded-full bg-blue-50 dark:bg-blue-900/20 w-fit mx-auto mb-4">
                            <DollarSign className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                          </div>
                          <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-2">Selecione um Fornecedor</h3>
                          <p className="text-xs text-slate-600 dark:text-gray-400">
                            Escolha um fornecedor à esquerda para visualizar e editar os valores dos produtos
                          </p>
                        </div>
                      </div>
                    </Card>
                  ) : (
                    <Card className="h-full border-2 border-emerald-200/80 dark:border-emerald-800/60 bg-white dark:bg-gray-800 rounded-lg overflow-hidden flex flex-col shadow-md">
                      <div className="p-2.5 border-b border-gray-200/60 dark:border-gray-700/50 bg-gradient-to-r from-emerald-50/50 to-green-50/30 dark:bg-[#1C1F26] flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-lg bg-emerald-600 dark:bg-gray-700 text-white">
                            <DollarSign className="h-3.5 w-3.5" />
                          </div>
                          <div>
                            <h3 className="text-xs font-bold text-gray-900 dark:text-white truncate max-w-[180px]">
                              {quote.fornecedoresParticipantes.find(f => f.id === selectedSupplier)?.nome}
                        </h3>
                            <p className="text-[10px] text-gray-600 dark:text-gray-400">Valores dos produtos</p>
                          </div>
                        </div>
                        <Badge className="bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 text-[10px] font-semibold">
                          {products.length}
                        </Badge>
                      </div>
                      <div className="flex-1 overflow-auto">
                        <table className="w-full">
                          <thead className="bg-slate-50 dark:bg-gray-800/50 border-b border-slate-200 dark:border-gray-700">
                            <tr>
                              <th className="px-3 py-2 text-left text-xs font-semibold text-slate-700 dark:text-gray-300">
                                <div className="flex items-center gap-1">
                                  <Package className="h-3 w-3" />
                                  <span className="hidden sm:inline">Produto</span>
                                </div>
                              </th>
                            <th className="px-3 py-2 text-left text-xs font-semibold text-slate-700 dark:text-gray-300">
                              <div className="flex items-center gap-1">
                                <Package className="h-3 w-3" />
                                <span className="hidden sm:inline">Qtd</span>
                              </div>
                            </th>
                            <th className="px-3 py-2 text-left text-xs font-semibold text-slate-700 dark:text-gray-300">
                              <div className="flex items-center gap-1">
                                <DollarSign className="h-3 w-3" />
                                <span className="hidden sm:inline">Valor</span>
                              </div>
                            </th>
                            <th className="px-3 py-2 text-center text-xs font-semibold text-slate-700 dark:text-gray-300">
                              <Edit2 className="h-3 w-3 mx-auto" />
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-gray-700">
                          {products.map((product: any) => {
                            const currentValue = getSupplierProductValue(selectedSupplier, product.product_id);
                            const isEditing = editingProductId === product.product_id;
                            const { bestPrice, bestSupplierId } = getBestPriceInfoForProduct(product.product_id);
                            const isBestPrice = currentValue > 0 && selectedSupplier === bestSupplierId;

                            return (
                              <tr key={product.product_id} className={cn(
                                "hover:bg-slate-50 dark:hover:bg-gray-700/50 transition-colors",
                                isBestPrice && "bg-emerald-50 dark:bg-emerald-900/20"
                              )}>
                                <td className="px-2 py-1.5">
                                  <p className="font-semibold text-xs text-slate-900 dark:text-white truncate" title={product.product_name}>
                                    {product.product_name}
                                  </p>
                                </td>
                                <td className="px-2 py-1.5">
                                  <div className="flex items-center gap-1">
                                    <span className="font-medium text-xs text-slate-700 dark:text-gray-300">{product.quantidade}</span>
                                    <span className="text-[10px] text-slate-500 dark:text-gray-400">{product.unidade}</span>
                                  </div>
                                </td>
                                <td className="px-2 py-2">
                                  {isEditing ? (
                                    <div className="flex items-center gap-1.5">
                                    <Input
                                      ref={editInputRef}
                                      type="number"
                                      value={editedValues[product.product_id] || 0}
                                      onChange={(e) => setEditedValues(prev => ({
                                        ...prev,
                                        [product.product_id]: Number(e.target.value)
                                      }))}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                          handleSaveEdit(product.product_id);
                                        } else if (e.key === 'Escape') {
                                          handleCancelEdit();
                                        }
                                      }}
                                        className="w-28 h-8 rounded-md border-2 border-emerald-300 dark:border-emerald-700 dark:bg-gray-900 dark:text-white focus:border-emerald-500 dark:focus:border-emerald-400 focus:ring-1 focus:ring-emerald-200 dark:focus:ring-emerald-800 text-xs font-semibold transition-all"
                                      step="0.01"
                                      min="0"
                                      placeholder="0.00"
                                    />
                                      <div className="flex gap-0.5">
                                      <Button
                                        size="sm"
                                        onClick={() => handleSaveEdit(product.product_id)}
                                          className="bg-emerald-600 dark:bg-gray-700 hover:bg-emerald-700 dark:hover:bg-emerald-600 text-white h-8 w-8 p-0 shadow-sm"
                                      >
                                          <Save className="h-3.5 w-3.5" />
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={handleCancelEdit}
                                          className="border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 h-8 w-8 p-0"
                                      >
                                          <X className="h-3.5 w-3.5" />
                                      </Button>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-1.5">
                                      <span className={cn(
                                        "font-bold text-xs px-2 py-1 rounded-md",
                                        isBestPrice 
                                          ? "text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800" 
                                          : "text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600"
                                      )}>
                                        R$ {currentValue.toFixed(2)}
                                      </span>
                                      {isBestPrice && (
                                        <Badge className="bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 text-[9px] font-semibold h-4 px-1">
                                          <TrendingDown className="h-2.5 w-2.5 mr-0.5" />
                                          Melhor
                                        </Badge>
                                      )}
                                    </div>
                                  )}
                                </td>
                                <td className="px-3 py-2.5 text-center">
                                  {!isEditing && (
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => handleStartEdit(product.product_id, currentValue)}
                                      disabled={quote.status === "concluida"}
                                      className={cn(
                                        "h-9 w-9 p-0 rounded-lg transition-all",
                                        quote.status === "concluida"
                                          ? "text-gray-400 dark:text-gray-600 cursor-not-allowed"
                                          : "text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 hover:scale-110"
                                      )}
                                      title={quote.status === "concluida" ? "Cotação finalizada" : "Editar valor"}
                                    >
                                      <Edit2 className="h-4 w-4" />
                                    </Button>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </Card>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="comparativo" className="flex-1 overflow-hidden animate-in fade-in-0 slide-in-from-right-2 duration-300">
              <div className="h-full flex flex-col p-2.5 sm:p-3">

                {/* Resumo Comparativo Superior */}
                {bestSupplier && (
                  <Card className="mb-2.5 border-2 border-purple-200/80 dark:border-purple-800/30 bg-gradient-to-br from-purple-50 via-indigo-50 to-purple-100/50 dark:from-purple-500/10 dark:to-transparent rounded-lg shadow-md dark:shadow-none">
                    <div className="p-2.5 sm:p-3">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
                        <div className="flex items-center gap-2">
                          <div className="p-2 rounded-lg bg-purple-600 dark:bg-purple-600 text-white shadow-sm">
                            <BarChart3 className="h-4 w-4" />
                          </div>
                          <div>
                            <h3 className="text-[10px] font-semibold text-purple-900 dark:text-purple-300 uppercase mb-0.5">
                              Melhor Opção
                            </h3>
                            <p className="font-bold text-sm text-purple-900 dark:text-white">
                              {bestSupplier.nome}
                            </p>
                            <p className="text-[10px] text-purple-700 dark:text-purple-400 mt-0.5">
                              Economia: <span className="font-semibold text-emerald-600 dark:text-emerald-400">{quote.economia}</span>
                            </p>
                          </div>
                        </div>
                        <div className="text-center sm:text-right">
                          <p className="text-[10px] text-purple-700 dark:text-purple-400 font-medium mb-0.5">Total</p>
                          <p className="text-base font-bold text-purple-600 dark:text-purple-400">
                            R$ {bestSupplier.totalValue.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </Card>
                )}

                {/* Tabela Comparativa - Foco Total */}
                <Card className="flex-1 overflow-hidden border-2 border-purple-200/80 dark:border-purple-800/60 bg-white dark:bg-[#1C1F26] rounded-lg shadow-md dark:shadow-none flex flex-col">
                  <div className="flex-1 overflow-auto min-h-0">
                  <table className="w-full border-collapse min-w-max">
                      <thead className="sticky top-0 z-10 bg-purple-50/80 dark:bg-gray-900/95 backdrop-blur-sm">
                        <tr className="border-b-2 border-purple-300/60 dark:border-purple-700/60">
                          <th className="px-3 py-2 text-left bg-purple-100/80 dark:bg-gray-800/95 backdrop-blur-sm sticky left-0 z-20 shadow-sm">
                          <div className="flex items-center gap-1.5">
                              <Package className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                              <span className="font-bold text-xs text-purple-900 dark:text-white">Produto</span>
                          </div>
                        </th>
                        {quote.fornecedoresParticipantes.map(fornecedor => {
                          const totalValue = products.reduce((sum: number, product: any) => {
                            const value = getSupplierProductValue(fornecedor.id, product.product_id);
                            return sum + (value || 0);
                          }, 0);
                          const isWinning = bestSupplier?.id === fornecedor.id;
                          
                          return (
                            <th 
                              key={fornecedor.id} 
                              className={cn(
                                "px-2 py-2 text-center group relative",
                                quote.fornecedoresParticipantes.length > 5 ? "min-w-[100px] max-w-[120px]" : "min-w-[120px]",
                                isWinning 
                                    ? "bg-emerald-100/90 dark:bg-emerald-900/40 border-l-2 border-r-2 border-emerald-300 dark:border-emerald-700" 
                                    : "bg-purple-50/80 dark:bg-gray-900"
                              )}
                              title={`Total: R$ ${totalValue.toFixed(2)}`}
                            >
                                <div className="flex items-center justify-center gap-1 mb-0.5">
                                <Building2 className={cn(
                                  "h-3 w-3 flex-shrink-0",
                                    isWinning ? "text-emerald-600 dark:text-emerald-400" : "text-purple-600 dark:text-purple-400"
                                )} />
                                {isWinning && <Star className="h-2.5 w-2.5 text-emerald-600 dark:text-emerald-400 fill-current flex-shrink-0" />}
                              </div>
                              <p className={cn(
                                  "font-bold truncate",
                                quote.fornecedoresParticipantes.length > 5 ? "text-[10px]" : "text-xs",
                                  isWinning ? "text-emerald-700 dark:text-emerald-300" : "text-purple-900 dark:text-white"
                              )} title={fornecedor.nome}>
                                {fornecedor.nome}
                              </p>
                                <div className={cn(
                                  "mt-0.5 text-[9px] font-medium",
                                  isWinning ? "text-emerald-600 dark:text-emerald-400" : "text-purple-600 dark:text-purple-400"
                                )}>
                                  R$ {totalValue.toFixed(2)}
                              </div>
                            </th>
                          );
                        })}
                      </tr>
                    </thead>
                    <tbody>
                      {products.map((product: any, index: number) => {
                        const { bestPrice, bestSupplierId } = getBestPriceInfoForProduct(product.product_id);

                        return (
                          <tr key={product.product_id} className={cn(
                            "border-b border-slate-200 dark:border-gray-700 hover:bg-slate-50 dark:hover:bg-gray-800/50 transition-colors",
                            index % 2 === 0 ? "bg-white dark:bg-gray-900" : "bg-slate-50/50 dark:bg-gray-800/30"
                          )}>
                            <td className="px-3 py-2 bg-purple-50/50 dark:bg-gray-800/80 sticky left-0 z-10 shadow-sm border-r border-purple-200/40 dark:border-purple-700/40">
                              <p className="font-bold text-xs text-purple-900 dark:text-white truncate max-w-[200px]" title={product.product_name}>
                                {product.product_name}
                              </p>
                              <p className="text-[10px] text-purple-600 dark:text-purple-400 mt-0.5 font-medium">
                                {product.quantidade} {product.unidade}
                              </p>
                            </td>
                            {quote.fornecedoresParticipantes.map(fornecedor => {
                              const value = getSupplierProductValue(fornecedor.id, product.product_id);
                              const isBestPrice = fornecedor.id === bestSupplierId;
                              const isWinning = bestSupplier?.id === fornecedor.id;

                              // Calcular economia se houver outros valores
                              const allValues = quote.fornecedoresParticipantes
                                .map(f => getSupplierProductValue(f.id, product.product_id))
                                .filter(v => v > 0);
                              const maxValue = allValues.length > 0 ? Math.max(...allValues) : 0;
                              const economia = maxValue > 0 && value > 0 ? maxValue - value : 0;

                              return (
                                <td key={fornecedor.id} className={cn(
                                  "py-2 text-center",
                                  quote.fornecedoresParticipantes.length > 5 ? "px-1.5" : "px-2",
                                  isBestPrice && "bg-emerald-50/80 dark:bg-emerald-900/30",
                                  isWinning && "border-l-2 border-r-2 border-emerald-300/60 dark:border-emerald-700/60"
                                )}>
                                  {value > 0 ? (
                                    <div className="flex flex-col items-center gap-0.5">
                                    <div className={cn(
                                        "rounded-md font-bold inline-flex items-center justify-center gap-0.5 px-2 py-1 shadow-sm transition-all",
                                      quote.fornecedoresParticipantes.length > 5 
                                          ? "text-[10px] min-w-[75px]" 
                                          : "text-xs min-w-[85px]",
                                      isBestPrice
                                          ? "bg-emerald-600 dark:bg-gray-700 text-white ring-1 ring-emerald-200 dark:ring-emerald-800"
                                          : "bg-purple-100 dark:bg-purple-900/40 text-purple-900 dark:text-purple-100 border border-purple-200 dark:border-purple-800"
                                    )}>
                                      {isBestPrice && <TrendingDown className="h-2.5 w-2.5 flex-shrink-0" />}
                                      <span className="whitespace-nowrap">R$ {value.toFixed(2)}</span>
                                      </div>
                                      {isBestPrice && economia > 0 && (
                                        <Badge className="bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 text-[9px] h-4 px-1 font-semibold">
                                          Eco: R$ {economia.toFixed(2)}
                                        </Badge>
                                      )}
                                    </div>
                                  ) : (
                                    <div className="text-purple-300 dark:text-purple-800">
                                      <Minus className="h-3 w-3 mx-auto" />
                                    </div>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Rodapé com Ação de Converter */}
                {bestSupplier && quote.status !== 'finalizada' && (
                  <div className="flex-shrink-0 p-2.5 sm:p-3 border-t-2 border-purple-200/80 dark:border-gray-700/30 bg-gradient-to-r from-purple-50 via-indigo-50 to-purple-100/50 dark:bg-[#1C1F26]">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-purple-600 dark:bg-gray-700 text-white shadow-sm">
                          <Star className="h-3.5 w-3.5 fill-current" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-purple-900 dark:text-purple-100">
                            Melhor: <span className="text-emerald-600 dark:text-emerald-400">{bestSupplier.nome}</span>
                          </p>
                          <p className="text-[10px] text-purple-700 dark:text-purple-300 mt-0.5">
                            R$ {bestSupplier.totalValue.toFixed(2)} • Eco: <span className="font-semibold text-emerald-600 dark:text-emerald-400">{quote.economia}</span>
                          </p>
                        </div>
                      </div>
                      <Button
                        onClick={handleConvertToOrder}
                        disabled={isUpdating}
                        size="sm"
                        className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-indigo-600 dark:bg-gray-700 dark:hover:bg-gray-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold text-xs shadow-md dark:shadow-none hover:shadow-lg dark:hover:shadow-lg dark:hover:shadow-black/20 transition-all h-8"
                      >
                        <ShoppingCart className="h-3.5 w-3.5 mr-1.5" />
                        Converter
                      </Button>
                    </div>
                  </div>
                )}
                </Card>
              </div>
            </TabsContent>

            {/* Tab de Edição */}
            {onEdit && quote.status !== "concluida" && (
              <TabsContent value="edicao" className="flex-1 overflow-y-auto p-2.5 sm:p-3 animate-in fade-in-0 slide-in-from-right-2 duration-300 min-h-0">
                {editLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <Loader2 className="h-8 w-8 animate-spin text-orange-500 mx-auto mb-4" />
                      <p className="text-sm text-gray-600 dark:text-gray-400">Carregando dados...</p>
                    </div>
                  </div>
                ) : (
                  <Form {...editForm}>
                    <form onSubmit={editForm.handleSubmit(handleEditSubmit)} className="space-y-3 max-w-4xl mx-auto">
                      {/* Seção 1: Produtos */}
                      <Card className="border-2 border-orange-200/80 dark:border-orange-800/60 bg-white dark:bg-[#1C1F26] rounded-lg shadow-md dark:shadow-none">
                        <div className="p-2.5 border-b border-orange-200/60 dark:border-orange-800/30 bg-gradient-to-r from-orange-50/50 to-amber-50/30 dark:from-orange-500/10 dark:to-transparent">
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 rounded-lg bg-orange-600 dark:bg-orange-600 text-white">
                              <Package className="h-3.5 w-3.5" />
                            </div>
                            <div>
                              <h3 className="text-xs font-bold text-gray-900 dark:text-white">Produtos da Cotação</h3>
                              <p className="text-[10px] text-gray-600 dark:text-gray-400">Gerencie os produtos incluídos</p>
                            </div>
                          </div>
                        </div>
                        <div className="p-2.5 sm:p-3 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <FormLabel className="text-xs font-semibold text-gray-900 dark:text-white">Produtos*</FormLabel>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => editAppend({ produtoId: "", produtoNome: "", quantidade: "", unidade: "kg" })}
                            className="h-7 text-xs dark:bg-gray-800 dark:text-white dark:border-gray-700 dark:hover:bg-gray-700"
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Adicionar
                          </Button>
                        </div>

                          {editFields.map((field, index) => (
                            <Card key={field.id} className="border border-orange-200/60 dark:border-orange-800/30 rounded-md p-2.5 space-y-2 bg-gradient-to-br from-orange-50/30 to-amber-50/20 dark:from-orange-500/5 dark:to-transparent">
                              <div className="flex items-center justify-between pb-1.5 border-b border-orange-200/40 dark:border-orange-800/30">
                                <div className="flex items-center gap-1.5">
                                  <div className="p-1 rounded bg-orange-100 dark:bg-orange-900/40">
                                    <Package className="h-3 w-3 text-orange-600 dark:text-orange-400" />
                                  </div>
                                  <span className="text-xs font-bold text-gray-900 dark:text-white">Produto {index + 1}</span>
                                </div>
                                {editFields.length > 1 && (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => editRemove(index)}
                                    className="h-7 w-7 p-0 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-md"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                )}
                              </div>

                            <FormField
                              control={editForm.control}
                              name={`produtos.${index}.produtoId`}
                              render={({ field: formField }) => {
                                const produtoNome = editForm.watch(`produtos.${index}.produtoNome`);
                                const displayName = produtoNome || (formField.value ? editProducts.find((p) => p.id === formField.value)?.name : null);
                                
                                return (
                                  <FormItem className="flex flex-col">
                                    <FormLabel className="text-xs text-gray-700 dark:text-gray-300">Produto*</FormLabel>
                                    <Popover>
                                      <PopoverTrigger asChild>
                                        <FormControl>
                                          <Button
                                            variant="outline"
                                            role="combobox"
                                            className={cn(
                                              "justify-between h-8 text-xs dark:bg-gray-800 dark:text-white dark:border-gray-700",
                                              !displayName && "text-muted-foreground"
                                            )}
                                          >
                                            {displayName || "Buscar produto..."}
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                          </Button>
                                        </FormControl>
                                      </PopoverTrigger>
                                      <PopoverContent className="w-full sm:w-[400px] p-0 dark:bg-gray-800 dark:border-gray-700" align="start">
                                        <Command className="dark:bg-gray-800">
                                          <CommandInput placeholder="Digite para buscar..." className="dark:bg-gray-800 dark:text-white dark:border-gray-700" />
                                          <CommandList className="max-h-[200px]">
                                            <CommandEmpty className="dark:text-gray-400">Nenhum produto encontrado.</CommandEmpty>
                                            <CommandGroup>
                                              {editProducts.map((product) => (
                                                <CommandItem
                                                  key={product.id}
                                                  value={product.name}
                                                  onSelect={() => {
                                                    editForm.setValue(`produtos.${index}.produtoId`, product.id);
                                                    editForm.setValue(`produtos.${index}.produtoNome`, product.name);
                                                  }}
                                                  className="dark:hover:bg-gray-700 dark:text-white"
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

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                              <FormField
                                control={editForm.control}
                                name={`produtos.${index}.quantidade`}
                                render={({ field: formField }) => (
                                  <FormItem>
                                    <FormLabel className="text-xs text-gray-700 dark:text-gray-300">Quantidade*</FormLabel>
                                    <FormControl>
                                      <Input placeholder="Ex: 500" type="number" {...formField} className="h-8 text-xs dark:bg-gray-800 dark:text-white dark:border-gray-700" />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={editForm.control}
                                name={`produtos.${index}.unidade`}
                                render={({ field: formField }) => (
                                  <FormItem>
                                    <FormLabel className="text-xs text-gray-700 dark:text-gray-300">Unidade*</FormLabel>
                                    <Select onValueChange={formField.onChange} value={formField.value}>
                                      <FormControl>
                                        <SelectTrigger className="h-8 text-xs dark:bg-gray-800 dark:text-white dark:border-gray-700">
                                          <SelectValue placeholder="Selecione" />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                                        <SelectItem value="kg" className="dark:hover:bg-gray-700 dark:text-white">Kg</SelectItem>
                                        <SelectItem value="un" className="dark:hover:bg-gray-700 dark:text-white">Unidade</SelectItem>
                                        <SelectItem value="cx" className="dark:hover:bg-gray-700 dark:text-white">Caixa</SelectItem>
                                        <SelectItem value="g" className="dark:hover:bg-gray-700 dark:text-white">Grama</SelectItem>
                                        <SelectItem value="l" className="dark:hover:bg-gray-700 dark:text-white">Litro</SelectItem>
                                        <SelectItem value="ml" className="dark:hover:bg-gray-700 dark:text-white">Mililitro</SelectItem>
                                        <SelectItem value="pct" className="dark:hover:bg-gray-700 dark:text-white">Pacote</SelectItem>
                                      </SelectContent>
                                    </Select>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              </div>
                            </Card>
                          ))}
                        </div>
                      </Card>

                      {/* Seção 2: Período */}
                      <Card className="border-2 border-blue-200/80 dark:border-blue-800/60 bg-white dark:bg-[#1C1F26] rounded-xl shadow-md dark:shadow-none">
                        <div className="p-4 border-b border-blue-200/60 dark:border-blue-800/30 bg-gradient-to-r from-blue-50/50 to-cyan-50/30 dark:from-blue-500/10 dark:to-transparent">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-blue-600 dark:bg-blue-600 text-white">
                              <Calendar className="h-4 w-4" />
                            </div>
                            <div>
                              <h3 className="text-sm font-bold text-gray-900 dark:text-white">Período da Cotação</h3>
                              <p className="text-xs text-gray-600 dark:text-gray-400">Configure as datas de início, fim e planejada</p>
                            </div>
                          </div>
                        </div>
                        <div className="p-4 sm:p-5 space-y-4">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormField
                          control={editForm.control}
                          name="dataInicio"
                          render={({ field }) => (
                            <FormItem className="flex flex-col">
                              <FormLabel className="text-xs text-gray-700 dark:text-gray-300">Data de Início*</FormLabel>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <FormControl>
                                    <Button
                                      variant="outline"
                                      className={cn(
                                        "pl-3 text-left font-normal h-8 text-xs dark:bg-gray-800 dark:text-white dark:border-gray-700",
                                        !field.value && "text-muted-foreground"
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
                                  <CalendarComponent
                                    mode="single"
                                    selected={field.value}
                                    onSelect={field.onChange}
                                    disabled={(date) => date < new Date("1900-01-01")}
                                    initialFocus
                                    className="dark:bg-gray-800"
                                  />
                                </PopoverContent>
                              </Popover>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={editForm.control}
                          name="dataFim"
                          render={({ field }) => (
                            <FormItem className="flex flex-col">
                              <FormLabel className="text-xs text-gray-700 dark:text-gray-300">Data de Fim*</FormLabel>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <FormControl>
                                    <Button
                                      variant="outline"
                                      className={cn(
                                        "pl-3 text-left font-normal h-8 text-xs dark:bg-gray-800 dark:text-white dark:border-gray-700",
                                        !field.value && "text-muted-foreground"
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
                                  <CalendarComponent
                                    mode="single"
                                    selected={field.value}
                                    onSelect={field.onChange}
                                    disabled={(date) => {
                                      const startDate = editForm.getValues("dataInicio");
                                      return startDate ? date <= startDate : false;
                                    }}
                                    initialFocus
                                    className="dark:bg-gray-800"
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
                        control={editForm.control}
                        name="dataPlanejada"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel className="text-xs text-gray-700 dark:text-gray-300">Data Planejada (Opcional)</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant="outline"
                                    className={cn(
                                      "pl-3 text-left font-normal h-9 text-sm dark:bg-gray-800 dark:text-white dark:border-gray-700",
                                      !field.value && "text-muted-foreground"
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
                                <CalendarComponent
                                  mode="single"
                                  selected={field.value}
                                  onSelect={field.onChange}
                                  disabled={(date) => {
                                    const startDate = editForm.getValues("dataInicio");
                                    return startDate ? date < startDate : date < new Date();
                                  }}
                                  initialFocus
                                  className="dark:bg-gray-800"
                                />
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}
                        />
                        </div>
                      </Card>

                      {/* Seção 3: Status */}
                      <Card className="border-2 border-indigo-200/80 dark:border-indigo-800/60 bg-white dark:bg-[#1C1F26] rounded-lg shadow-md dark:shadow-none">
                        <div className="p-2.5 border-b border-indigo-200/60 dark:border-indigo-800/30 bg-gradient-to-r from-indigo-50/50 to-purple-50/30 dark:from-indigo-500/10 dark:to-transparent">
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 rounded-lg bg-indigo-600 dark:bg-indigo-600 text-white">
                              <FileText className="h-3.5 w-3.5" />
                            </div>
                            <div>
                              <h3 className="text-xs font-bold text-gray-900 dark:text-white">Status</h3>
                              <p className="text-[10px] text-gray-600 dark:text-gray-400">Defina o status atual</p>
                            </div>
                          </div>
                        </div>
                        <div className="p-2.5 sm:p-3">
                          <FormField
                            control={editForm.control}
                            name="status"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs text-gray-700 dark:text-gray-300">Status*</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger className="h-9 text-sm dark:bg-gray-800 dark:text-white dark:border-gray-700">
                                      <SelectValue placeholder="Selecione o status" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                                    <SelectItem value="ativa" className="dark:hover:bg-gray-700 dark:text-white">Ativa</SelectItem>
                                    <SelectItem value="planejada" className="dark:hover:bg-gray-700 dark:text-white">Planejada</SelectItem>
                                    <SelectItem value="pendente" className="dark:hover:bg-gray-700 dark:text-white">Pendente</SelectItem>
                                    <SelectItem value="concluida" className="dark:hover:bg-gray-700 dark:text-white">Concluída</SelectItem>
                                    <SelectItem value="expirada" className="dark:hover:bg-gray-700 dark:text-white">Expirada</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </Card>

                      {/* Seção 4: Fornecedores */}
                      <Card className="border-2 border-teal-200/80 dark:border-teal-800/60 bg-white dark:bg-[#1C1F26] rounded-lg shadow-md dark:shadow-none">
                        <div className="p-2.5 border-b border-teal-200/60 dark:border-teal-800/30 bg-gradient-to-r from-teal-50/50 to-cyan-50/30 dark:from-teal-500/10 dark:to-transparent">
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 rounded-lg bg-teal-600 dark:bg-teal-600 text-white">
                              <Users className="h-3.5 w-3.5" />
                            </div>
                            <div>
                              <h3 className="text-xs font-bold text-gray-900 dark:text-white">Fornecedores Participantes</h3>
                              <p className="text-[10px] text-gray-600 dark:text-gray-400">Selecione os fornecedores (opcional)</p>
                            </div>
                          </div>
                        </div>
                        <div className="p-2.5 sm:p-3 space-y-2">
                        <FormLabel className="text-xs text-gray-700 dark:text-gray-300">Fornecedores Participantes (Opcional)</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className="w-full justify-between h-8 text-xs dark:bg-gray-800 dark:text-white dark:border-gray-700">
                              Adicionar Fornecedor
                              <ChevronsUpDown className="ml-2 h-3.5 w-3.5 shrink-0 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-full sm:w-[400px] p-0 dark:bg-gray-800 dark:border-gray-700" align="start">
                            <Command className="dark:bg-gray-800">
                              <CommandInput 
                                placeholder="Buscar fornecedor..." 
                                value={editSupplierSearch}
                                onValueChange={setEditSupplierSearch}
                                className="dark:bg-gray-800 dark:text-white dark:border-gray-700"
                              />
                              <CommandList className="max-h-[200px]">
                                <CommandEmpty className="dark:text-gray-400">Nenhum fornecedor encontrado.</CommandEmpty>
                                <CommandGroup>
                                  {filteredEditSuppliers.map((supplier) => (
                                    <CommandItem
                                      key={supplier.id}
                                      value={supplier.name}
                                      onSelect={() => handleEditSupplierSelect(supplier)}
                                      className="dark:hover:bg-gray-700 dark:text-white"
                                    >
                                      {supplier.name}
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                        
                        {editSelectedSuppliers.length > 0 && (
                          <div className="max-h-[150px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-orange-200 dark:scrollbar-thumb-orange-800 scrollbar-track-transparent">
                            <div className="flex flex-wrap gap-1.5">
                              {editSelectedSuppliers.map((supplier) => (
                                <div
                                  key={supplier.id}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 text-xs border border-orange-200 dark:border-orange-800"
                                >
                                  {supplier.name}
                                  <button
                                    type="button"
                                    onClick={() => handleEditSupplierRemove(supplier.id)}
                                    className="ml-0.5 hover:text-red-600 dark:hover:text-red-400 font-bold transition-colors"
                                  >
                                    ×
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        </div>
                      </Card>

                      {/* Seção 5: Observações */}
                      <Card className="border-2 border-slate-200/80 dark:border-slate-700/60 bg-white dark:bg-[#1C1F26] rounded-lg shadow-md dark:shadow-none">
                        <div className="p-2.5 border-b border-slate-200/60 dark:border-slate-700/40 bg-gradient-to-r from-slate-50/50 to-gray-50/30 dark:from-slate-800/20 dark:to-gray-800/20">
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 rounded-lg bg-slate-600 dark:bg-slate-600 text-white">
                              <FileText className="h-3.5 w-3.5" />
                            </div>
                            <div>
                              <h3 className="text-xs font-bold text-gray-900 dark:text-white">Observações</h3>
                              <p className="text-[10px] text-gray-600 dark:text-gray-400">Adicione notas relevantes</p>
                            </div>
                          </div>
                        </div>
                        <div className="p-2.5 sm:p-3">
                          <FormField
                            control={editForm.control}
                            name="observacoes"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs text-gray-700 dark:text-gray-300">Observações</FormLabel>
                                <FormControl>
                                  <Textarea 
                                    placeholder="Adicione observações..." 
                                    className="resize-none text-sm dark:bg-gray-800 dark:text-white dark:border-gray-700" 
                                    rows={3}
                                    {...field} 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </Card>

                      {/* Botões de ação */}
                      <div className="flex flex-col sm:flex-row justify-end gap-2 pt-2">
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => setActiveTab("detalhes")}
                          disabled={isSavingEdit}
                          className="h-8 text-xs dark:bg-gray-800 dark:text-white dark:border-gray-700 dark:hover:bg-gray-700"
                        >
                          Cancelar
                        </Button>
                        <Button 
                          type="submit"
                          disabled={isSavingEdit}
                          className="h-8 text-xs bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white"
                        >
                          {isSavingEdit ? (
                            <>
                              <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                              Salvando...
                            </>
                          ) : (
                            <>
                              <Save className="h-3.5 w-3.5 mr-1.5" />
                              Salvar
                            </>
                          )}
                        </Button>
                      </div>
                    </form>
                  </Form>
                )}
              </TabsContent>
            )}
          </Tabs>
        </div>

        {/* Select Supplier Per Product Dialog */}
        {products && products.length > 1 && (
          <SelectSupplierPerProductDialog
            open={showSelectSupplierDialog}
            onOpenChange={setShowSelectSupplierDialog}
            products={products.map((item: any) => {
              const supplierOptions = quote.fornecedoresParticipantes
                .map(fornecedor => {
                  const supplierItem = (quote._supplierItems || quote._raw?.quote_supplier_items || []).find(
                    (si: any) => si.supplier_id === fornecedor.id && si.product_id === item.product_id
                  );

                  return {
                    supplierId: fornecedor.id,
                    supplierName: fornecedor.nome,
                    price: supplierItem?.valor_oferecido || 0,
                    isBest: false
                  };
                })
                .filter(s => s.price > 0);

              if (supplierOptions.length > 0) {
                const minPrice = Math.min(...supplierOptions.map(s => s.price));
                supplierOptions.forEach(s => {
                  if (s.price === minPrice) {
                    s.isBest = true;
                  }
                });
              }

              const bestSupplier = supplierOptions.find(s => s.isBest);
              const selection = selectedSuppliers.get(item.product_id);

              return {
                productId: item.product_id,
                productName: item.product_name,
                quantity: item.quantidade,
                unit: item.unidade,
                selectedSupplierId: selection?.supplierId || bestSupplier?.supplierId || '',
                selectedSupplierName: selection?.supplierName || bestSupplier?.supplierName || '',
                supplierOptions
              };
            })}
            onConfirm={handleSupplierSelectionConfirm}
          />
        )}

        {/* Convert to Order Dialog */}
        {selectedSupplierForConversion && (
          <ConvertToOrderDialog
            open={convertDialogOpen}
            onOpenChange={setConvertDialogOpen}
            quote={quote}
            supplier={selectedSupplierForConversion}
            products={getConversionProducts()}
            totalValue={bestSupplier?.totalValue || 0}
            onConfirm={handleConfirmConversion}
            isLoading={isUpdating}
          />
        )}

        {/* Convert to Multiple Orders Dialog */}
        <ConvertToMultipleOrdersDialog
          open={showMultipleOrdersDialog}
          onOpenChange={setShowMultipleOrdersDialog}
          supplierOrders={supplierOrdersForConversion}
          onConfirm={handleConfirmMultipleOrders}
          isLoading={isUpdating}
        />
      </DialogContent>
    </Dialog>
  );
}
