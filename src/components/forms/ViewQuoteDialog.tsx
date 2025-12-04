import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Calendar, Package, Users, TrendingDown, Edit2, Edit3, Save, X, DollarSign, ShoppingCart, FileText, Download, Share2, Clock, Building2, Star, Minus, Edit, Plus, Trash2, Check, ChevronsUpDown, Loader2, Calendar as CalendarIcon, BarChart3, AlertCircle, Eye, Info } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

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
import { QuoteDetailsTab } from "../cotacoes/view-dialog/QuoteDetailsTab";
import { QuoteValuesTab } from "../cotacoes/view-dialog/QuoteValuesTab";
import { QuoteComparisonTab } from "../cotacoes/view-dialog/QuoteComparisonTab";
import {
  Quote,
  QuoteFormData,
  ViewQuoteDialogProps,
  EditSection,
  productLineSchema,
  quoteSchema
} from "../cotacoes/view-dialog/types";



export default function ViewQuoteDialog({ quote, quoteId, onUpdateSupplierProductValue, onConvertToOrder, onEdit, trigger, isUpdating, defaultTab, readOnly = false, open: externalOpen, onOpenChange: externalOnOpenChange }: ViewQuoteDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isMobile = false; // Removida dependência mobile

  // Usar controle externo se fornecido, senão usar interno
  const open = externalOpen !== undefined ? externalOpen : internalOpen;
  const setOpen = externalOnOpenChange || setInternalOpen;

  // Usar quote prop diretamente (removida lógica de lazy loading mobile)
  const currentQuote: Quote | null = quote || null;

  // Estado de loading (removida lógica mobile)
  const isLoadingQuote = false;

  // Se não há quote e modal não está aberto, apenas renderizar trigger
  if (!open && !currentQuote) {
    if (trigger) {
      return <>{trigger}</>;
    }
    return null;
  }

  // Estados do modo (similar ao PedidoDialog)
  const [isEditMode, setIsEditMode] = useState(false);
  const [activeSection, setActiveSection] = useState<EditSection>("detalhes");

  // Mantém compatibilidade com tabs antigas temporariamente
  const [activeTab, setActiveTab] = useState(defaultTab || "detalhes");
  const [selectedSupplier, setSelectedSupplier] = useState<string>("");
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editedValues, setEditedValues] = useState<Record<string, number>>({});
  const [editedPricingMetadata, setEditedPricingMetadata] = useState<
    Record<string, { unidadePreco: import("@/utils/priceNormalization").PricingUnit; fatorConversao?: number }>
  >({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
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

  const handleStartEdit = (
    productId: string,
    currentValue: number,
    currentMetadata?: {
      unidadePreco: import("@/utils/priceNormalization").PricingUnit | null;
      fatorConversao: number | null;
    }
  ) => {
    setEditingProductId(productId);
    setEditedValues((prev) => ({ ...prev, [productId]: currentValue }));
    // Initialize pricing metadata from current saved values
    if (currentMetadata?.unidadePreco) {
      setEditedPricingMetadata((prev) => ({
        ...prev,
        [productId]: {
          unidadePreco: currentMetadata.unidadePreco!,
          fatorConversao: currentMetadata.fatorConversao ?? undefined,
        },
      }));
    }
    setHasUnsavedChanges(true);
  };

  // Auto-foco e seleção quando entra em modo de edição
  useEffect(() => {
    if (editingProductId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingProductId]);

  // Limpar valores editados quando trocar de fornecedor
  useEffect(() => {
    if (hasUnsavedChanges && editingProductId) {
      // Mostrar aviso ao usuário
      toast({
        title: "Valor não salvo",
        description: "Os valores editados não foram salvos. Salve antes de trocar de fornecedor.",
        variant: "destructive",
      });
      return;
    }

    // Limpar valores editados quando trocar de fornecedor
    setEditedValues({});
    setEditedPricingMetadata({});
    setEditingProductId(null);
    setHasUnsavedChanges(false);
  }, [selectedSupplier]);

  const handleSaveEdit = async (productId: string) => {
    if (
      selectedSupplier &&
      onUpdateSupplierProductValue &&
      editedValues[productId] !== undefined &&
      currentQuote
    ) {
      // Get pricing metadata for this product
      const pricingMetadata = editedPricingMetadata[productId];

      // Salvar no banco with pricing metadata
      await onUpdateSupplierProductValue(
        currentQuote.id,
        selectedSupplier,
        productId,
        editedValues[productId],
        pricingMetadata
          ? {
              unidadePreco: pricingMetadata.unidadePreco,
              fatorConversao: pricingMetadata.fatorConversao,
              quantidadePorEmbalagem: pricingMetadata.fatorConversao,
            }
          : undefined
      );
      setEditingProductId(null);
      setEditedPricingMetadata((prev) => {
        const newState = { ...prev };
        delete newState[productId];
        return newState;
      });
      setHasUnsavedChanges(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingProductId(null);
    setEditedValues({});
    setEditedPricingMetadata({});
  };

  // Get pricing metadata for a supplier item
  const getSupplierItemPricingMetadata = (
    supplierId: string,
    productId: string
  ): {
    unidadePreco: import("@/utils/priceNormalization").PricingUnit | null;
    fatorConversao: number | null;
  } => {
    if (!currentQuote) return { unidadePreco: null, fatorConversao: null };
    const supplierItems =
      currentQuote._supplierItems || currentQuote._raw?.quote_supplier_items || [];
    const item = supplierItems.find(
      (item: any) =>
        item.supplier_id === supplierId && item.product_id === productId
    );
    return {
      unidadePreco: item?.unidade_preco || null,
      fatorConversao: item?.fator_conversao || null,
    };
  };

  // Get products from the quote (com verificação de null)
  const products = currentQuote?._raw?.quote_items || [];

  // Get supplier items for selected supplier
  const getSupplierProductValue = (supplierId: string, productId: string): number => {
    if (!currentQuote) return 0;
    const supplierItems = currentQuote._supplierItems || currentQuote._raw?.quote_supplier_items || [];
    const item = supplierItems.find(
      (item: any) => item.supplier_id === supplierId && item.product_id === productId
    );
    return item?.valor_oferecido || 0;
  };

  // Get supplier product value considering edited values (for real-time updates)
  const getCurrentProductValue = (supplierId: string, productId: string): number => {
    // Se estiver editando este produto para este fornecedor, usar valor editado
    if (selectedSupplier === supplierId && editedValues[productId] !== undefined) {
      return editedValues[productId];
    }
    // Senão, usar valor da base de dados
    return getSupplierProductValue(supplierId, productId);
  };

  // Calculate best price for each product and return the supplier ID
  const getBestPriceInfoForProduct = (productId: string): { bestPrice: number; bestSupplierId: string | null } => {
    if (!currentQuote) return { bestPrice: 0, bestSupplierId: null };

    let bestPrice = Infinity;
    let bestSupplierId: string | null = null;

    currentQuote.fornecedoresParticipantes.forEach(f => {
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
    if (!currentQuote) return 0;
    const valores = currentQuote.fornecedoresParticipantes
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
  // Resetar estados quando modal abre/fecha
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (open && currentQuote) {
      setIsEditMode(false);
      setActiveSection("detalhes");
      // Carregar dados para edição se necessário
      if (onEdit && editProducts.length === 0 && !editLoading) {
        loadEditData();
      }
    }
  }, [open, currentQuote]);

  // Carregar dados para edição quando entrar em modo de edição
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (open && isEditMode && onEdit) {
      const shouldLoad = editProducts.length === 0 && !editLoading;
      if (shouldLoad) {
        loadEditData();
      }
    }
  }, [open, isEditMode]);

  const loadEditData = async () => {
    if (!currentQuote) return;

    setEditLoading(true);
    try {
      // Load products and suppliers
      const [productsRes, suppliersRes] = await Promise.all([
        supabase.from("products").select("id, name").order("name"),
        supabase.from("suppliers").select("id, name, contact").order("name"),
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
        .eq("id", currentQuote.id)
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    (supplier.name.toLowerCase().includes(editSupplierSearch.toLowerCase()) ||
      (supplier.contact && supplier.contact.toLowerCase().includes(editSupplierSearch.toLowerCase())))
  );

  // Menu items para modo de edição (similar ao PedidoDialog)
  const menuItems = [
    { id: "detalhes" as EditSection, label: "Detalhes da Cotação", icon: FileText },
    { id: "fornecedores" as EditSection, label: "Fornecedores", icon: Building2 },
    { id: "observacoes" as EditSection, label: "Observações", icon: FileText },
  ];

  const handleEditSubmit = async (data: QuoteFormData) => {
    if (!onEdit || !currentQuote) return;

    setIsSavingEdit(true);
    try {
      await onEdit(currentQuote.id, data);
      toast({
        title: "✅ Cotação atualizada",
        description: "As alterações foram salvas com sucesso.",
      });
      // Voltar para modo de visualização após salvar
      setIsEditMode(false);
      setActiveSection("detalhes");
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
    if (!currentQuote || currentQuote.fornecedoresParticipantes.length === 0) return null;

    let bestSupplier = null;
    let lowestTotal = Infinity;

    currentQuote.fornecedoresParticipantes.forEach(fornecedor => {
      let total = 0;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    if (!products || products.length === 0 || !currentQuote) {
      return [];
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return products.map((item: any) => {
      const supplierOptions = currentQuote.fornecedoresParticipantes
        .map(fornecedor => {
          const supplierItem = (currentQuote!._supplierItems || currentQuote!._raw?.quote_supplier_items || []).find(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      if (!currentQuote || !currentQuote._raw) {
        return;
      }

      const supplierOrders: SupplierOrder[] = Array.from(supplierGroups.entries())
        .map(([supplierId, productIds]) => {
          const selection = selections.get(productIds[0]);
          if (!selection) return null;
          const supplierName = selection.supplierName;

          // Buscar produtos e valores
          const productsData = productIds.map(productId => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const product = currentQuote._raw.quote_items.find((item: any) => item.product_id === productId);
            if (!product) return null;
            const value = getSupplierProductValue(supplierId, productId);

            return {
              productId,
              productName: product.product_name,
              quantity: product.quantidade,
              value
            };
          }).filter(Boolean) as Array<{ productId: string; productName: string; quantity: string; value: number }>;

          if (productsData.length === 0) return null;

          const totalValue = productsData.reduce((sum, p) => sum + p.value, 0);

          return {
            supplierId,
            supplierName,
            products: productsData,
            totalValue,
            deliveryDate: '',
            observations: ''
          };
        })
        .filter(Boolean) as SupplierOrder[];

      setSupplierOrdersForConversion(supplierOrders);
      setShowMultipleOrdersDialog(true);
    }
  };

  const handleConfirmConversion = (deliveryDate: string, observations?: string) => {
    if (selectedSupplierForConversion && onConvertToOrder) {
      // Fluxo simples: 1 fornecedor com todos os produtos
      if (!currentQuote) return;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const allProductIds = products.map((p: any) => p.product_id);
      onConvertToOrder(currentQuote.id, [{
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

      if (!currentQuote) return;
      onConvertToOrder(currentQuote.id, orders);
      setShowMultipleOrdersDialog(false);
      setOpen(false);
    }
  };

  const bestSupplier = getBestSupplier();

  // Get products for conversion dialog
  const getConversionProducts = () => {
    if (!bestSupplier) return [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      {trigger && (
        <DialogTrigger asChild onClick={() => setOpen(true)}>
          {trigger}
        </DialogTrigger>
      )}
      <DialogContent className="w-[96vw] sm:w-[92vw] md:w-[90vw] max-w-[900px] h-[90vh] sm:h-[88vh] max-h-[850px] overflow-hidden border border-gray-200/60 dark:border-gray-700/30 shadow-xl rounded-xl sm:rounded-2xl p-0 flex flex-col bg-white dark:bg-gray-900 [&>button]:hidden">
        {isLoadingQuote ? (
          <div className="flex flex-col items-center justify-center h-full min-h-[400px] space-y-4">
            <Loader2 className="h-10 w-10 animate-spin text-teal-600 dark:text-teal-400" />
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Carregando detalhes da cotação...</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Aguarde um momento</p>
          </div>
        ) : !currentQuote ? (
          <div className="flex flex-col items-center justify-center h-full min-h-[400px] space-y-4">
            <AlertCircle className="h-10 w-10 text-red-600 dark:text-red-400" />
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Erro ao carregar cotação</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Não foi possível carregar os detalhes</p>
          </div>
        ) : (
          <>
            <DialogHeader className={`flex-shrink-0 ${isMobile ? 'px-4 py-4' : 'px-4 sm:px-5 py-3 sm:py-4'} border-b border-gray-200/60 dark:border-gray-700/40 bg-white dark:bg-gray-900`}>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className={`${isMobile ? 'w-10 h-10' : 'w-9 h-9'} rounded-lg bg-gradient-to-br from-primary to-primary-light flex items-center justify-center text-white flex-shrink-0`}>
                    {isEditMode ? <Edit3 className={`${isMobile ? 'h-5 w-5' : 'h-4 w-4'}`} /> : <Package className={`${isMobile ? 'h-5 w-5' : 'h-4 w-4'}`} />}
                  </div>
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <DialogTitle className={`${isMobile ? 'text-lg' : 'text-base sm:text-lg'} font-semibold text-gray-900 dark:text-white truncate`}>
                      {isEditMode ? `Editar Cotação #${currentQuote?.id?.substring(0, 8) || '...'}` : `Cotação #${currentQuote?.id?.substring(0, 8) || '...'}`}
                    </DialogTitle>
                    <div className="hidden sm:block">
                      {currentQuote && getStatusBadge(currentQuote.status)}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {!isEditMode && onEdit && currentQuote && currentQuote.status !== "concluida" && !readOnly && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditMode(true)}
                      className={`${isMobile ? 'h-9 px-3 text-sm' : 'h-8 px-3 text-xs'}`}
                    >
                      <Edit3 className={`${isMobile ? 'h-4 w-4' : 'h-3.5 w-3.5'} mr-1.5`} />
                      Editar
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setIsEditMode(false);
                      setOpen(false);
                    }}
                    className={`${isMobile ? 'h-9 w-9' : 'h-8 w-8'} p-0 flex-shrink-0 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700`}
                  >
                    <X className={`${isMobile ? 'h-5 w-5' : 'h-4 w-4'}`} />
                  </Button>
                </div>
              </div>
            </DialogHeader>

            <div className="flex flex-col flex-1 overflow-hidden min-h-0">
              {!currentQuote ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-8 w-8 animate-spin text-teal-600 dark:text-teal-400" />
                </div>
              ) : isEditMode ? (
                // Modo de Edição (similar ao PedidoDialog)
                <div className={`flex ${isMobile ? 'flex-col' : 'flex-row'} flex-1 overflow-hidden`}>
                  {/* Menu Lateral Esquerdo - Desktop | Tabs - Mobile */}
                  {isMobile ? (
                    <div className="flex-shrink-0 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                      <div className="flex overflow-x-auto">
                        {menuItems.map((item) => {
                          const Icon = item.icon;
                          return (
                            <button
                              key={item.id}
                              onClick={() => setActiveSection(item.id)}
                              className={cn(
                                "flex-shrink-0 px-4 py-3 flex items-center gap-2 border-b-2 transition-colors",
                                activeSection === item.id
                                  ? "border-primary dark:border-primary text-primary dark:text-primary bg-white dark:bg-gray-900"
                                  : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                              )}
                            >
                              <Icon className="h-4 w-4" />
                              <span className="text-sm font-medium whitespace-nowrap">{item.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="w-56 flex-shrink-0 border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex flex-col shadow-sm">
                      <ScrollArea className="flex-1">
                        <div className="p-2 space-y-1">
                          {menuItems.map((item) => {
                            const Icon = item.icon;
                            return (
                              <button
                                key={item.id}
                                onClick={() => setActiveSection(item.id)}
                                className={cn(
                                  "w-full px-3 py-2.5 flex items-center gap-3 rounded-lg text-sm font-medium transition-colors",
                                  activeSection === item.id
                                    ? "bg-primary dark:bg-primary text-white shadow-sm"
                                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50"
                                )}
                              >
                                <Icon className="h-4 w-4 flex-shrink-0" />
                                <span className="truncate">{item.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      </ScrollArea>
                    </div>
                  )}

                  {/* Conteúdo Principal de Edição */}
                  <ScrollArea className="flex-1 bg-gray-50 dark:bg-gray-900 min-h-0 h-full">
                    <div className={`${isMobile ? 'p-4' : 'p-4 sm:p-6'} pb-8`}>
                      {editLoading ? (
                        <div className="flex items-center justify-center h-full min-h-[400px]">
                          <div className="text-center space-y-4">
                            <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto" />
                            <div className="space-y-2">
                              <Skeleton className="h-4 w-3/4 mx-auto" />
                              <Skeleton className="h-4 w-1/2 mx-auto" />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <>
                          {activeSection === "detalhes" && (
                            <div className={`max-w-2xl ${isMobile ? 'mx-0 space-y-4' : 'mx-auto space-y-6'}`}>
                              <div className={`bg-white dark:bg-gray-800 rounded-xl ${isMobile ? 'p-4' : 'p-6'} shadow-md border border-gray-200 dark:border-gray-700`}>
                                <h3 className={`${isMobile ? 'text-lg mb-4' : 'text-xl mb-6'} font-bold text-gray-900 dark:text-white pb-3 border-b border-gray-200 dark:border-gray-700`}>
                                  Detalhes da Cotação
                                </h3>
                                <Form {...editForm}>
                                  <form onSubmit={editForm.handleSubmit(handleEditSubmit)} className="space-y-4">
                                    {/* Seção 1: Campos Essenciais - Grid Compacto */}
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                                      {/* Período */}
                                      <Card className="border border-blue-200/80 dark:border-gray-700/60 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                                        <div className="p-2.5 border-b border-blue-200/60 dark:border-gray-700/40 bg-blue-50/50 dark:bg-gray-800">
                                          <div className="flex items-center gap-2">
                                            <Calendar className="h-4 w-4 text-primary dark:text-primary" />
                                            <h4 className="text-xs font-semibold text-gray-900 dark:text-white">Período*</h4>
                                          </div>
                                        </div>
                                        <div className="p-2.5 space-y-2.5">
                                          <div className="grid grid-cols-2 gap-2">
                                            <FormField
                                              control={editForm.control}
                                              name="dataInicio"
                                              render={({ field }) => (
                                                <FormItem className="flex flex-col">
                                                  <FormLabel className="text-[10px] text-gray-600 dark:text-gray-400 mb-1">Início*</FormLabel>
                                                  <Popover>
                                                    <PopoverTrigger asChild>
                                                      <FormControl>
                                                        <Button
                                                          variant="outline"
                                                          size="sm"
                                                          className={cn(
                                                            "pl-2.5 pr-2 text-left font-normal h-8 text-xs dark:bg-gray-800 dark:text-white dark:border-gray-700",
                                                            !field.value && "text-muted-foreground"
                                                          )}
                                                        >
                                                          {field.value ? (
                                                            format(field.value, "dd/MM/yyyy", { locale: ptBR })
                                                          ) : (
                                                            <span className="text-[10px]">Data início</span>
                                                          )}
                                                          <CalendarIcon className="ml-auto h-3.5 w-3.5 opacity-50" />
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
                                                  <FormMessage className="text-[10px]" />
                                                </FormItem>
                                              )}
                                            />
                                            <FormField
                                              control={editForm.control}
                                              name="dataFim"
                                              render={({ field }) => (
                                                <FormItem className="flex flex-col">
                                                  <FormLabel className="text-[10px] text-gray-600 dark:text-gray-400 mb-1">Fim*</FormLabel>
                                                  <Popover>
                                                    <PopoverTrigger asChild>
                                                      <FormControl>
                                                        <Button
                                                          variant="outline"
                                                          size="sm"
                                                          className={cn(
                                                            "pl-2.5 pr-2 text-left font-normal h-8 text-xs dark:bg-gray-800 dark:text-white dark:border-gray-700",
                                                            !field.value && "text-muted-foreground"
                                                          )}
                                                        >
                                                          {field.value ? (
                                                            format(field.value, "dd/MM/yyyy", { locale: ptBR })
                                                          ) : (
                                                            <span className="text-[10px]">Data fim</span>
                                                          )}
                                                          <CalendarIcon className="ml-auto h-3.5 w-3.5 opacity-50" />
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
                                                  <FormMessage className="text-[10px]" />
                                                </FormItem>
                                              )}
                                            />
                                          </div>
                                          <FormField
                                            control={editForm.control}
                                            name="dataPlanejada"
                                            render={({ field }) => (
                                              <FormItem className="flex flex-col">
                                                <FormLabel className="text-[10px] text-gray-600 dark:text-gray-400 mb-1">Data Planejada (Opcional)</FormLabel>
                                                <Popover>
                                                  <PopoverTrigger asChild>
                                                    <FormControl>
                                                      <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className={cn(
                                                          "pl-2.5 pr-2 text-left font-normal h-8 text-xs dark:bg-gray-800 dark:text-white dark:border-gray-700",
                                                          !field.value && "text-muted-foreground"
                                                        )}
                                                      >
                                                        {field.value ? (
                                                          format(field.value, "dd/MM/yyyy", { locale: ptBR })
                                                        ) : (
                                                          <span className="text-[10px]">Não agendada</span>
                                                        )}
                                                        <CalendarIcon className="ml-auto h-3.5 w-3.5 opacity-50" />
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
                                                <FormMessage className="text-[10px]" />
                                              </FormItem>
                                            )}
                                          />
                                        </div>
                                      </Card>

                                      {/* Status */}
                                      <Card className="border border-indigo-200/80 dark:border-gray-700/60 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                                        <div className="p-2.5 border-b border-indigo-200/60 dark:border-gray-700/40 bg-indigo-50/50 dark:bg-gray-800">
                                          <div className="flex items-center gap-2">
                                            <FileText className="h-4 w-4 text-primary dark:text-primary" />
                                            <h4 className="text-xs font-semibold text-gray-900 dark:text-white">Status*</h4>
                                          </div>
                                        </div>
                                        <div className="p-2.5">
                                          <FormField
                                            control={editForm.control}
                                            name="status"
                                            render={({ field }) => (
                                              <FormItem>
                                                <Select onValueChange={field.onChange} value={field.value}>
                                                  <FormControl>
                                                    <SelectTrigger className="h-9 text-xs dark:bg-gray-800 dark:text-white dark:border-gray-700">
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
                                                <FormMessage className="text-[10px]" />
                                              </FormItem>
                                            )}
                                          />
                                        </div>
                                      </Card>
                                    </div>

                                    {/* Seção 2: Produtos - Layout Compacto em Tabela */}
                                    <Card className="border border-orange-200/80 dark:border-gray-700/60 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                                      <div className="p-2.5 border-b border-orange-200/60 dark:border-gray-700/40 bg-orange-50/50 dark:bg-gray-800 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                          <Package className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                                          <h4 className="text-xs font-semibold text-gray-900 dark:text-white">Produtos*</h4>
                                          <Badge variant="secondary" className="text-[10px] h-5 px-1.5 dark:bg-gray-700 dark:text-gray-300">
                                            {editFields.length}
                                          </Badge>
                                        </div>
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
                                      <div className="p-2.5 space-y-2">
                                        {editFields.map((field, index) => (
                                          <div key={field.id} className="border border-orange-200/60 dark:border-gray-700/40 rounded-md p-2.5 bg-orange-50/30 dark:bg-gray-800/50">
                                            <div className="grid grid-cols-12 gap-2 items-start">
                                              <div className="col-span-12 sm:col-span-6 lg:col-span-5">
                                                <FormField
                                                  control={editForm.control}
                                                  name={`produtos.${index}.produtoId`}
                                                  render={({ field: formField }) => {
                                                    const produtoNome = editForm.watch(`produtos.${index}.produtoNome`);
                                                    const displayName = produtoNome || (formField.value ? editProducts.find((p) => p.id === formField.value)?.name : null);

                                                    return (
                                                      <FormItem className="flex flex-col">
                                                        <FormLabel className="text-[10px] text-gray-600 dark:text-gray-400 mb-1">Produto*</FormLabel>
                                                        <Popover>
                                                          <PopoverTrigger asChild>
                                                            <FormControl>
                                                              <Button
                                                                variant="outline"
                                                                role="combobox"
                                                                size="sm"
                                                                className={cn(
                                                                  "justify-between h-8 text-xs dark:bg-gray-800 dark:text-white dark:border-gray-700",
                                                                  !displayName && "text-muted-foreground"
                                                                )}
                                                              >
                                                                <span className="truncate">{displayName || "Selecione..."}</span>
                                                                <ChevronsUpDown className="ml-2 h-3.5 w-3.5 shrink-0 opacity-50" />
                                                              </Button>
                                                            </FormControl>
                                                          </PopoverTrigger>
                                                          <PopoverContent className="w-full sm:w-[400px] p-0 dark:bg-gray-800 dark:border-gray-700" align="start">
                                                            <Command className="dark:bg-gray-800">
                                                              <CommandInput placeholder="Buscar produto..." className="dark:bg-gray-800 dark:text-white dark:border-gray-700" />
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
                                                        <FormMessage className="text-[10px]" />
                                                      </FormItem>
                                                    );
                                                  }}
                                                />
                                              </div>
                                              <div className="col-span-6 sm:col-span-3 lg:col-span-3">
                                                <FormField
                                                  control={editForm.control}
                                                  name={`produtos.${index}.quantidade`}
                                                  render={({ field: formField }) => (
                                                    <FormItem>
                                                      <FormLabel className="text-[10px] text-gray-600 dark:text-gray-400 mb-1">Quantidade*</FormLabel>
                                                      <FormControl>
                                                        <Input
                                                          placeholder="Ex: 500"
                                                          type="number"
                                                          {...formField}
                                                          className="h-8 text-xs dark:bg-gray-800 dark:text-white dark:border-gray-700"
                                                        />
                                                      </FormControl>
                                                      <FormMessage className="text-[10px]" />
                                                    </FormItem>
                                                  )}
                                                />
                                              </div>
                                              <div className="col-span-5 sm:col-span-2 lg:col-span-3">
                                                <FormField
                                                  control={editForm.control}
                                                  name={`produtos.${index}.unidade`}
                                                  render={({ field: formField }) => (
                                                    <FormItem>
                                                      <FormLabel className="text-[10px] text-gray-600 dark:text-gray-400 mb-1">Unidade*</FormLabel>
                                                      <Select onValueChange={formField.onChange} value={formField.value}>
                                                        <FormControl>
                                                          <SelectTrigger className="h-8 text-xs dark:bg-gray-800 dark:text-white dark:border-gray-700">
                                                            <SelectValue placeholder="Un" />
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
                                                      <FormMessage className="text-[10px]" />
                                                    </FormItem>
                                                  )}
                                                />
                                              </div>
                                              <div className="col-span-1 flex items-end pb-0.5">
                                                {editFields.length > 1 && (
                                                  <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => editRemove(index)}
                                                    className="h-8 w-8 p-0 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30"
                                                  >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                  </Button>
                                                )}
                                              </div>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </Card>

                                    {/* Seção 3: Opcionais - Grid Horizontal */}
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                                      {/* Fornecedores */}
                                      <Card className="border border-teal-200/80 dark:border-gray-700/60 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                                        <div className="p-2.5 border-b border-teal-200/60 dark:border-gray-700/40 bg-teal-50/50 dark:bg-gray-800">
                                          <div className="flex items-center gap-2">
                                            <Users className="h-4 w-4 text-primary dark:text-primary" />
                                            <h4 className="text-xs font-semibold text-gray-900 dark:text-white">Fornecedores (Opcional)</h4>
                                          </div>
                                        </div>
                                        <div className="p-2.5 space-y-2">
                                          <Popover>
                                            <PopoverTrigger asChild>
                                              <Button variant="outline" size="sm" className="w-full justify-between h-8 text-xs dark:bg-gray-800 dark:text-white dark:border-gray-700">
                                                Adicionar Fornecedor
                                                <ChevronsUpDown className="ml-2 h-3.5 w-3.5 shrink-0 opacity-50" />
                                              </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-full sm:w-[400px] p-0 dark:bg-gray-800 dark:border-gray-700" align="start">
                                              <Command className="dark:bg-gray-800">
                                                <CommandInput
                                                  placeholder="Buscar por nome ou vendedor..."
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
                                                        value={`${supplier.name} ${supplier.contact || ''}`}
                                                        onSelect={() => handleEditSupplierSelect(supplier)}
                                                        className="dark:hover:bg-gray-700 dark:text-white"
                                                      >
                                                        <div className="flex flex-col">
                                                          <span>{supplier.name}</span>
                                                          {supplier.contact && (
                                                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                                              Vendedor: {supplier.contact}
                                                            </span>
                                                          )}
                                                        </div>
                                                      </CommandItem>
                                                    ))}
                                                  </CommandGroup>
                                                </CommandList>
                                              </Command>
                                            </PopoverContent>
                                          </Popover>

                                          {editSelectedSuppliers.length > 0 && (
                                            <div className="max-h-[120px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-orange-200 dark:scrollbar-thumb-orange-800 scrollbar-track-transparent">
                                              <div className="flex flex-wrap gap-1.5">
                                                {editSelectedSuppliers.map((supplier) => (
                                                  <div
                                                    key={supplier.id}
                                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 text-[10px] border border-teal-200 dark:border-teal-800"
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

                                      {/* Observações */}
                                      <Card className="border border-slate-200/80 dark:border-gray-700/60 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                                        <div className="p-2.5 border-b border-slate-200/60 dark:border-gray-700/40 bg-slate-50/50 dark:bg-gray-800">
                                          <div className="flex items-center gap-2">
                                            <FileText className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                                            <h4 className="text-xs font-semibold text-gray-900 dark:text-white">Observações</h4>
                                          </div>
                                        </div>
                                        <div className="p-2.5">
                                          <FormField
                                            control={editForm.control}
                                            name="observacoes"
                                            render={({ field }) => (
                                              <FormItem>
                                                <FormControl>
                                                  <Textarea
                                                    placeholder="Adicione observações (opcional)..."
                                                    className="resize-none text-xs dark:bg-gray-800 dark:text-white dark:border-gray-700 min-h-[80px]"
                                                    rows={3}
                                                    {...field}
                                                  />
                                                </FormControl>
                                                <FormMessage className="text-[10px]" />
                                              </FormItem>
                                            )}
                                          />
                                        </div>
                                      </Card>
                                    </div>

                                    {/* Botões de ação */}
                                    <div className="flex justify-end gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                                      <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => {
                                          setIsEditMode(false);
                                          editForm.reset();
                                        }}
                                        disabled={isSavingEdit}
                                        size="sm"
                                        className={`${isMobile ? 'h-10 px-4' : 'h-9 px-3'} text-sm`}
                                      >
                                        Cancelar
                                      </Button>
                                      <Button
                                        type="submit"
                                        disabled={isSavingEdit || !editForm.formState.isDirty}
                                        size="sm"
                                        className={`${isMobile ? 'h-10 px-4' : 'h-9 px-3'} text-sm bg-primary hover:bg-primary/90 text-white`}
                                      >
                                        {isSavingEdit ? (
                                          <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Salvando...
                                          </>
                                        ) : (
                                          <>
                                            <Save className="h-4 w-4 mr-2" />
                                            Salvar
                                          </>
                                        )}
                                      </Button>
                                    </div>
                                  </form>
                                </Form>
                              </div>
                            </div>
                          )}

                          {activeSection === "fornecedores" && (
                            <div className={`max-w-2xl ${isMobile ? 'mx-0 space-y-4' : 'mx-auto space-y-6'}`}>
                              <div className={`bg-white dark:bg-gray-800 rounded-xl ${isMobile ? 'p-4' : 'p-6'} shadow-md border border-gray-200 dark:border-gray-700`}>
                                <h3 className={`${isMobile ? 'text-lg mb-4' : 'text-xl mb-6'} font-bold text-gray-900 dark:text-white pb-3 border-b border-gray-200 dark:border-gray-700`}>
                                  Fornecedores
                                </h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Seção de fornecedores em construção</p>
                              </div>
                            </div>
                          )}

                          {activeSection === "observacoes" && (
                            <div className={`max-w-2xl ${isMobile ? 'mx-0 space-y-4' : 'mx-auto space-y-6'}`}>
                              <div className={`bg-white dark:bg-gray-800 rounded-xl ${isMobile ? 'p-4' : 'p-6'} shadow-md border border-gray-200 dark:border-gray-700`}>
                                <h3 className={`${isMobile ? 'text-lg mb-4' : 'text-xl mb-6'} font-bold text-gray-900 dark:text-white pb-3 border-b border-gray-200 dark:border-gray-700`}>
                                  Observações
                                </h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Seção de observações em construção</p>
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </ScrollArea>
                </div>
              ) : (
                // Modo de Visualização
                <ScrollArea className="flex-1 bg-gray-50 dark:bg-gray-900 min-h-0 h-full">
                  <div className={`${isMobile ? 'p-4 space-y-4' : 'p-4 sm:p-6 space-y-6'} pb-8`}>
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                      <div className="px-2 sm:px-4 md:px-6 py-2 sm:py-2.5 border-b border-gray-200/60 dark:border-gray-700 bg-gradient-to-r from-gray-50/80 to-slate-50/60 dark:from-gray-800/50 dark:to-gray-900/50 backdrop-blur-sm flex-shrink-0">
                        <TabsList className={`grid w-full ${!readOnly ? "grid-cols-3" : "grid-cols-2"} bg-white/70 dark:bg-gray-800/95 backdrop-blur-sm rounded-lg sm:rounded-xl p-1 shadow-md border border-gray-200/50 dark:border-gray-700 gap-1 h-8 sm:h-9 transition-colors`}>
                          <TabsTrigger
                            value="detalhes"
                            className="group relative rounded-md sm:rounded-lg font-medium text-xs sm:text-sm transition-all duration-200 data-[state=active]:bg-primary dark:data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-md hover:bg-primary/10 dark:hover:bg-gray-700/50 data-[state=active]:hover:bg-primary/90 dark:data-[state=active]:hover:bg-primary/90 px-2 sm:px-3 py-1.5 sm:py-2 flex items-center justify-center gap-1.5 sm:gap-2 text-gray-700 dark:text-gray-300"
                          >
                            <Package className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                            <span className="hidden xs:inline">Detalhes</span>
                            {currentQuote && currentQuote.fornecedoresParticipantes.length > 0 && (
                              <Badge variant="secondary" className="ml-0.5 h-4 px-1 text-[9px] font-semibold bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary data-[state=active]:bg-primary/20 dark:data-[state=active]:bg-primary/20 data-[state=active]:text-white dark:data-[state=active]:text-white">
                                {currentQuote.fornecedoresParticipantes.length}
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
                          {!readOnly && (
                            <TabsTrigger
                              value="atualizacao"
                              className="group relative rounded-md sm:rounded-lg font-medium text-xs sm:text-sm transition-all duration-200 data-[state=active]:bg-success dark:data-[state=active]:bg-success data-[state=active]:text-white data-[state=active]:shadow-md hover:bg-success/10 dark:hover:bg-gray-700/50 data-[state=active]:hover:bg-success/90 dark:data-[state=active]:hover:bg-success/90 px-2 sm:px-3 py-1.5 sm:py-2 flex items-center justify-center gap-1.5 sm:gap-2 text-gray-700 dark:text-gray-300"
                            >
                              <DollarSign className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                              <span className="hidden xs:inline">Valores</span>
                              {products.length > 0 && (
                                <Badge variant="secondary" className="ml-0.5 h-4 px-1 text-[9px] font-semibold bg-success/20 dark:bg-success/20 text-success dark:text-success data-[state=active]:bg-success/30 dark:data-[state=active]:bg-success/30 data-[state=active]:text-white dark:data-[state=active]:text-white">
                                  {products.length}
                                </Badge>
                              )}
                            </TabsTrigger>
                          )}
                        </TabsList>
                      </div>

                      <TabsContent value="detalhes" className="flex-1 overflow-hidden p-0 animate-in fade-in-0 slide-in-from-right-2 duration-300 min-h-0 mt-0">
                        <QuoteDetailsTab
                          products={products}
                          currentQuote={currentQuote}
                          bestSupplier={bestSupplier}
                          getSupplierProductValue={getSupplierProductValue}
                        />
                      </TabsContent>

                      <TabsContent value="atualizacao" className="flex-1 overflow-hidden p-0 animate-in fade-in-0 slide-in-from-right-2 duration-300 min-h-0 mt-0">
                        <QuoteValuesTab
                          readOnly={readOnly}
                          products={products}
                          currentQuote={currentQuote}
                          selectedSupplier={selectedSupplier}
                          setSelectedSupplier={setSelectedSupplier}
                          getCurrentProductValue={getCurrentProductValue}
                          getSupplierItemPricingMetadata={getSupplierItemPricingMetadata}
                          getBestPriceInfoForProduct={getBestPriceInfoForProduct}
                          editingProductId={editingProductId}
                          editedValues={editedValues}
                          setEditedValues={setEditedValues}
                          editedPricingMetadata={editedPricingMetadata}
                          setEditedPricingMetadata={setEditedPricingMetadata}
                          handleSaveEdit={handleSaveEdit}
                          handleCancelEdit={handleCancelEdit}
                          handleStartEdit={handleStartEdit}
                          editInputRef={editInputRef}
                        />
                      </TabsContent>

                      <TabsContent value="comparativo" className="flex-1 overflow-hidden p-0 animate-in fade-in-0 slide-in-from-right-2 duration-300 min-h-0 mt-0">
                        <QuoteComparisonTab
                          readOnly={readOnly}
                          products={products}
                          currentQuote={currentQuote}
                          bestSupplier={bestSupplier}
                          getSupplierProductValue={getSupplierProductValue}
                          getBestPriceInfoForProduct={getBestPriceInfoForProduct}
                          handleConvertToOrder={handleConvertToOrder}
                          isUpdating={isUpdating}
                        />
                      </TabsContent>

                    </Tabs>
                  </div>
                </ScrollArea>
              )}
            </div>

            {/* Select Supplier Per Product Dialog */}
            {products && products.length > 1 && currentQuote && (
              <SelectSupplierPerProductDialog
                open={showSelectSupplierDialog}
                onOpenChange={setShowSelectSupplierDialog}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                products={products.map((item: any) => {
                  const supplierOptions = currentQuote.fornecedoresParticipantes
                    .map(fornecedor => {
                      const supplierItem = (currentQuote._supplierItems || currentQuote._raw?.quote_supplier_items || []).find(
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
            {selectedSupplierForConversion && currentQuote && (
              <ConvertToOrderDialog
                open={convertDialogOpen}
                onOpenChange={setConvertDialogOpen}
                quote={currentQuote}
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
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
