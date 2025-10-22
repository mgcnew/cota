import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Package, Users, TrendingDown, Edit2, Save, X, DollarSign, ShoppingCart, FileText, Download, Share2, Clock, Building2, Star, Minus } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import ConvertToOrderDialog from "./ConvertToOrderDialog";
import { SelectSupplierPerProductDialog } from "./SelectSupplierPerProductDialog";

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
  onConvertToOrder?: (quoteId: string, supplierId: string, deliveryDate: string, observations?: string) => void;
  trigger?: React.ReactNode;
  isUpdating?: boolean;
}

export default function ViewQuoteDialog({ quote, onUpdateSupplierProductValue, onConvertToOrder, trigger, isUpdating }: ViewQuoteDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<string>("");
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editedValues, setEditedValues] = useState<Record<string, number>>({});
  const [convertDialogOpen, setConvertDialogOpen] = useState(false);
  const [selectedSupplierForConversion, setSelectedSupplierForConversion] = useState<{ id: string; name: string } | null>(null);
  const [showSelectSupplierDialog, setShowSelectSupplierDialog] = useState(false);
  const [selectedSuppliers, setSelectedSuppliers] = useState<Map<string, { supplierId: string; supplierName: string }>>(new Map());
  const editInputRef = useRef<HTMLInputElement>(null);

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

  const handleConvertToOrder = () => {
    // Verificar se há múltiplos produtos
    if (products && products.length > 1) {
      // Preparar dados para seleção individual de fornecedores
      const productSelections = products.map((item: any) => {
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

        // Marcar o melhor preço
        if (supplierOptions.length > 0) {
          const minPrice = Math.min(...supplierOptions.map(s => s.price));
          supplierOptions.forEach(s => {
            if (s.price === minPrice) {
              s.isBest = true;
            }
          });
        }

        // Selecionar automaticamente o fornecedor com melhor preço
        const bestSupplier = supplierOptions.find(s => s.isBest);

        return {
          productId: item.product_id,
          productName: item.product_name,
          quantity: item.quantidade,
          unit: item.unidade,
          selectedSupplierId: bestSupplier?.supplierId || '',
          selectedSupplierName: bestSupplier?.supplierName || '',
          supplierOptions
        };
      });

      setSelectedSuppliers(new Map(productSelections.map((p: any) => [
        p.productId,
        { supplierId: p.selectedSupplierId, supplierName: p.selectedSupplierName }
      ])));

      setShowSelectSupplierDialog(true);
    } else {
      // Um único produto, usar fluxo simples
      const bestSupplier = getBestSupplier();
      if (bestSupplier) {
        setSelectedSupplierForConversion({
          id: bestSupplier.id,
          name: bestSupplier.nome
        });
        setConvertDialogOpen(true);
      }
    }
  };

  const handleSupplierSelectionConfirm = (selections: Map<string, { supplierId: string; supplierName: string }>) => {
    setSelectedSuppliers(selections);
    setShowSelectSupplierDialog(false);

    // Agrupar por fornecedor para decidir o fluxo
    const supplierGroups = new Map<string, string[]>();
    selections.forEach((selection, productId) => {
      if (!supplierGroups.has(selection.supplierId)) {
        supplierGroups.set(selection.supplierId, []);
      }
      supplierGroups.get(selection.supplierId)!.push(productId);
    });

    // Por enquanto, usar apenas o primeiro fornecedor (mais produtos)
    // Depois podemos implementar múltiplos pedidos
    const mainSupplier = Array.from(supplierGroups.entries())
      .sort((a, b) => b[1].length - a[1].length)[0];

    if (mainSupplier) {
      const selection = selections.get(mainSupplier[1][0]);
      if (selection) {
        setSelectedSupplierForConversion({
          id: selection.supplierId,
          name: selection.supplierName
        });
        setConvertDialogOpen(true);
      }
    }
  };

  const handleConfirmConversion = (deliveryDate: string, observations?: string) => {
    if (selectedSupplierForConversion && onConvertToOrder) {
      onConvertToOrder(quote.id, selectedSupplierForConversion.id, deliveryDate, observations);
      setConvertDialogOpen(false);
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
      <DialogContent className="w-[96vw] sm:w-[92vw] md:w-[90vw] max-w-6xl h-[92vh] sm:h-[88vh] md:h-[85vh] max-h-[950px] border-0 dark:border dark:border-gray-700 shadow-2xl rounded-lg sm:rounded-xl md:rounded-2xl p-0 flex flex-col bg-white dark:bg-gray-900">
        <DialogHeader className="px-3 sm:px-4 md:px-6 py-2.5 sm:py-3 border-b border-gray-100/60 dark:border-gray-700 bg-gradient-to-br from-blue-50/80 via-indigo-50/60 to-purple-50/40 dark:from-gray-800 dark:via-gray-800 dark:to-gray-800 backdrop-blur-sm relative overflow-hidden flex-shrink-0">
          {/* Efeitos decorativos de fundo */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-indigo-500/5 to-purple-500/5 dark:from-blue-500/10 dark:via-indigo-500/10 dark:to-purple-500/10"></div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400/10 to-indigo-400/10 dark:from-blue-400/20 dark:to-indigo-400/20 rounded-full -translate-y-16 translate-x-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-purple-400/10 to-pink-400/10 dark:from-purple-400/20 dark:to-pink-400/20 rounded-full translate-y-12 -translate-x-12"></div>

          <div className="relative z-10 flex items-center justify-between gap-2 sm:gap-3">
            <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
              <div className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 text-white shadow-lg shadow-blue-500/25 ring-2 ring-white/20 dark:ring-blue-900/50 backdrop-blur-sm flex-shrink-0">
                <Package className="h-4 w-4 sm:h-5 sm:w-5 drop-shadow-sm" />
              </div>
              <div className="flex flex-col flex-1 min-w-0">
                <DialogTitle className="text-base sm:text-lg font-bold bg-gradient-to-r from-blue-900 via-indigo-800 to-purple-800 dark:from-blue-300 dark:via-indigo-300 dark:to-purple-300 bg-clip-text text-transparent truncate">
                  Detalhes da Cotação
                </DialogTitle>
                <p className="text-gray-600 dark:text-gray-400 text-xs font-medium mt-0.5 truncate">
                  {quote.produto} • {getStatusBadge(quote.status)}
                </p>
              </div>
            </div>
            
            {/* Close Button - Isolated on the right */}
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 rounded-full border border-transparent hover:border-slate-300 dark:hover:border-gray-600 dark:text-gray-300 transition-colors flex-shrink-0"
              onClick={() => setOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="flex flex-col flex-1 min-h-0">
          <Tabs defaultValue="detalhes" className="w-full flex flex-col flex-1 min-h-0">
            <div className="px-3 sm:px-4 md:px-6 py-2 border-b border-gray-100/60 dark:border-gray-700 bg-gradient-to-r from-gray-50/80 to-slate-50/60 dark:from-gray-800/50 dark:to-gray-800/50 backdrop-blur-sm flex-shrink-0">
              <TabsList className="grid w-full grid-cols-3 bg-white/60 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg p-1 shadow-sm border border-gray-200/40 dark:border-gray-700 h-9">
                <TabsTrigger
                  value="detalhes"
                  className="rounded-md font-medium text-xs transition-all data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-sm px-2 py-1"
                >
                  Detalhes
                </TabsTrigger>
                <TabsTrigger
                  value="atualizacao"
                  className="rounded-md font-medium text-xs transition-all data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-sm px-2 py-1"
                >
                  Valores
                </TabsTrigger>
                <TabsTrigger
                  value="comparativo"
                  className="rounded-md font-medium text-xs transition-all data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-sm px-2 py-1"
                >
                  Comparativo
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="detalhes" className="flex-1 overflow-y-auto p-3 sm:p-4 animate-in fade-in-0 duration-300 min-h-0">
              {/* Layout otimizado e compacto */}
              <div className="max-w-5xl mx-auto space-y-4">
                
                {/* Seção 1: Resumo Executivo - Grid Compacto */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <Card className="p-3 border border-blue-200 dark:border-blue-800/40 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-900/20 dark:to-blue-800/10 hover:border-blue-300 dark:hover:border-blue-700 transition-all rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-blue-600 dark:bg-blue-500 text-white flex-shrink-0">
                        <Package className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-0.5">Produtos</p>
                        <p className="font-bold text-lg text-blue-900 dark:text-blue-100">{products.length}</p>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-3 border border-purple-200 dark:border-purple-800/40 bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-900/20 dark:to-purple-800/10 hover:border-purple-300 dark:hover:border-purple-700 transition-all rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-purple-600 dark:bg-purple-500 text-white flex-shrink-0">
                        <Users className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-purple-700 dark:text-purple-300 mb-0.5">Fornecedores</p>
                        <p className="font-bold text-lg text-purple-900 dark:text-purple-100">{quote.fornecedores}</p>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-3 border border-amber-200 dark:border-amber-800/40 bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-900/20 dark:to-amber-800/10 hover:border-amber-300 dark:hover:border-amber-700 transition-all rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-amber-600 dark:bg-amber-500 text-white flex-shrink-0">
                        <Clock className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-amber-700 dark:text-amber-300 mb-0.5">Prazo</p>
                        <p className="font-bold text-sm text-amber-900 dark:text-amber-100 truncate">{quote.dataFim}</p>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-3 border border-emerald-200 dark:border-emerald-800/40 bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-900/20 dark:to-emerald-800/10 hover:border-emerald-300 dark:hover:border-emerald-700 transition-all rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-emerald-600 dark:bg-emerald-500 text-white flex-shrink-0">
                        <TrendingDown className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-emerald-700 dark:text-emerald-300 mb-0.5">Economia</p>
                        <p className="font-bold text-sm text-emerald-900 dark:text-emerald-100 truncate">{quote.economia}</p>
                      </div>
                    </div>
                  </Card>
                </div>

                {/* Seção 2: Melhor Oferta Destaque */}
                {bestSupplier && (
                  <Card className="p-4 border-2 border-emerald-200 dark:border-emerald-800/40 bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/10 rounded-lg">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="p-3 rounded-xl bg-emerald-600 dark:bg-emerald-500 text-white flex-shrink-0">
                          <Star className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 uppercase mb-1">Melhor Fornecedor</p>
                          <p className="font-bold text-lg text-emerald-900 dark:text-emerald-100 truncate">{bestSupplier.nome}</p>
                          <p className="text-sm text-emerald-700 dark:text-emerald-300 font-medium">Valor Total: R$ {bestSupplier.totalValue.toFixed(2)}</p>
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        <div className="text-right">
                          <p className="text-xs text-emerald-700 dark:text-emerald-300 font-medium mb-1">Economia</p>
                          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{quote.economia}</p>
                        </div>
                      </div>
                    </div>
                  </Card>
                )}

                {/* Seção 3: Fornecedores Participantes - Tabela Compacta */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-slate-700 dark:text-gray-300 flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Fornecedores Participantes
                    </h3>
                    <Badge variant="secondary" className="dark:bg-gray-700 dark:text-gray-200">
                      {quote.fornecedoresParticipantes.length} total
                    </Badge>
                  </div>
                  
                  <Card className="border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-slate-50 dark:bg-gray-800/50 border-b border-slate-200 dark:border-gray-700">
                          <tr>
                            <th className="px-3 py-2 text-left text-xs font-semibold text-slate-700 dark:text-gray-300">Fornecedor</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold text-slate-700 dark:text-gray-300">Status</th>
                            <th className="px-3 py-2 text-right text-xs font-semibold text-slate-700 dark:text-gray-300">Valor Total</th>
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
                                <td className="px-3 py-2.5">
                                  <div className="flex items-center gap-2">
                                    <div className={cn(
                                      "w-2 h-2 rounded-full flex-shrink-0",
                                      fornecedor.status === 'respondido' ? "bg-emerald-500" : "bg-amber-500"
                                    )}></div>
                                    <div className="flex-1 min-w-0">
                                      <p className="font-semibold text-sm text-slate-900 dark:text-white truncate">
                                        {fornecedor.nome}
                                        {isBest && <Star className="inline-block h-3 w-3 ml-1 text-emerald-600 dark:text-emerald-400" />}
                                      </p>
                                      {fornecedor.dataResposta && (
                                        <p className="text-xs text-slate-500 dark:text-gray-400 truncate">{fornecedor.dataResposta}</p>
                                      )}
                                    </div>
                                  </div>
                                </td>
                                <td className="px-3 py-2.5">
                                  <Badge 
                                    variant={fornecedor.status === 'respondido' ? 'default' : 'outline'}
                                    className={cn(
                                      "text-xs",
                                      fornecedor.status === 'respondido' 
                                        ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800" 
                                        : "border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/20"
                                    )}
                                  >
                                    {fornecedor.status === 'respondido' ? 'Respondido' : 'Pendente'}
                                  </Badge>
                                </td>
                                <td className="px-3 py-2.5 text-right">
                                  {totalValue > 0 ? (
                                    <p className={cn(
                                      "font-bold text-sm",
                                      isBest ? "text-emerald-600 dark:text-emerald-400" : "text-slate-900 dark:text-white"
                                    )}>
                                      R$ {totalValue.toFixed(2)}
                                    </p>
                                  ) : (
                                    <span className="text-xs text-slate-400 dark:text-gray-500">-</span>
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

            <TabsContent value="atualizacao" className="flex-1 overflow-hidden p-3 sm:p-4 animate-in fade-in-0 duration-300">
              <div className="h-full flex flex-col lg:flex-row gap-4">
                {/* Painel Esquerdo - Seleção de Fornecedor */}
                <div className="lg:w-80 flex-shrink-0 space-y-4">
                  {/* Card de Seleção */}
                  <Card className="border border-blue-200 dark:border-blue-800/40 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
                    <div className="p-4 space-y-4">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-blue-600 dark:bg-blue-500 text-white">
                          <Users className="h-4 w-4" />
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100">Selecionar Fornecedor</h3>
                          <p className="text-xs text-blue-700 dark:text-blue-300">Escolha para editar valores</p>
                        </div>
                      </div>
                      
                      <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
                        <SelectTrigger className="bg-white dark:bg-gray-800 border-blue-200 dark:border-gray-700 focus:border-blue-400 dark:focus:border-blue-500 dark:text-white">
                          <SelectValue placeholder="Selecione um fornecedor" />
                        </SelectTrigger>
                        <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                          {quote.fornecedoresParticipantes.map(fornecedor => (
                            <SelectItem 
                              key={fornecedor.id} 
                              value={fornecedor.id}
                              className="focus:bg-blue-50 dark:focus:bg-blue-900/30"
                            >
                              <div className="flex items-center gap-2">
                                <div className={cn(
                                  "w-2 h-2 rounded-full",
                                  fornecedor.status === 'respondido' ? "bg-emerald-500" : "bg-amber-500"
                                )}></div>
                                <span>{fornecedor.nome}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </Card>

                  {/* Lista de Fornecedores */}
                  <Card className="border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                    <div className="p-3 border-b border-slate-200 dark:border-gray-700">
                      <h4 className="text-xs font-semibold text-slate-700 dark:text-gray-300 flex items-center gap-2">
                        <Building2 className="h-3 w-3" />
                        Todos os Fornecedores
                      </h4>
                    </div>
                    <div className="p-2 space-y-1 max-h-[400px] overflow-y-auto">
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
                              "w-full text-left p-2 rounded-lg transition-all",
                              isSelected 
                                ? "bg-blue-100 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-700" 
                                : "hover:bg-slate-50 dark:hover:bg-gray-700/50 border border-transparent"
                            )}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <div className={cn(
                                  "w-2 h-2 rounded-full flex-shrink-0",
                                  fornecedor.status === 'respondido' ? "bg-emerald-500" : "bg-amber-500"
                                )}></div>
                                <span className={cn(
                                  "text-xs font-medium truncate",
                                  isSelected ? "text-blue-900 dark:text-blue-100" : "text-slate-700 dark:text-gray-300"
                                )}>
                                  {fornecedor.nome}
                                </span>
                              </div>
                              {totalValue > 0 && (
                                <span className="text-xs font-semibold text-slate-600 dark:text-gray-400 flex-shrink-0">
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
                          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Selecione um Fornecedor</h3>
                          <p className="text-sm text-slate-600 dark:text-gray-400">
                            Escolha um fornecedor à esquerda para visualizar e editar os valores dos produtos
                          </p>
                        </div>
                      </div>
                    </Card>
                  ) : (
                    <Card className="h-full border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg overflow-hidden flex flex-col">
                      <div className="p-3 border-b border-slate-200 dark:border-gray-700 flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                          <DollarSign className="h-4 w-4" />
                          Produtos - {quote.fornecedoresParticipantes.find(f => f.id === selectedSupplier)?.nome}
                        </h3>
                        <Badge className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800">
                          {products.length} produtos
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
                                <td className="px-3 py-2.5">
                                  <p className="font-semibold text-sm text-slate-900 dark:text-white truncate" title={product.product_name}>
                                    {product.product_name}
                                  </p>
                                </td>
                                <td className="px-3 py-2.5">
                                  <div className="flex items-center gap-1">
                                    <span className="font-medium text-sm text-slate-700 dark:text-gray-300">{product.quantidade}</span>
                                    <span className="text-xs text-slate-500 dark:text-gray-400">{product.unidade}</span>
                                  </div>
                                </td>
                                <td className="px-3 py-2.5">
                                  {isEditing ? (
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
                                      className="w-32 h-8 rounded-lg border-blue-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white focus:border-blue-400 dark:focus:border-blue-500 text-sm"
                                      step="0.01"
                                      min="0"
                                      placeholder="0.00"
                                    />
                                  ) : (
                                    <div className="flex items-center gap-2">
                                      <span className={cn(
                                        "font-bold text-sm",
                                        isBestPrice ? "text-emerald-600 dark:text-emerald-400" : "text-slate-900 dark:text-white"
                                      )}>
                                        R$ {currentValue.toFixed(2)}
                                      </span>
                                      {isBestPrice && (
                                        <Badge className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 text-xs">
                                          <TrendingDown className="h-3 w-3" />
                                        </Badge>
                                      )}
                                    </div>
                                  )}
                                </td>
                                <td className="px-3 py-2.5 text-center">
                                  {isEditing ? (
                                    <div className="flex gap-1 justify-center">
                                      <Button
                                        size="sm"
                                        onClick={() => handleSaveEdit(product.product_id)}
                                        className="bg-emerald-600 dark:bg-emerald-500 hover:bg-emerald-700 dark:hover:bg-emerald-600 text-white h-8 w-8 p-0"
                                      >
                                        <Save className="h-3 w-3" />
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={handleCancelEdit}
                                        className="border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 h-8 w-8 p-0"
                                      >
                                        <X className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  ) : (
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => handleStartEdit(product.product_id, currentValue)}
                                      disabled={quote.status === "concluida"}
                                      className={cn(
                                        "h-8 w-8 p-0",
                                        quote.status === "concluida"
                                          ? "text-gray-400 dark:text-gray-600 cursor-not-allowed"
                                          : "text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30"
                                      )}
                                      title={quote.status === "concluida" ? "Cotação finalizada" : "Editar valor"}
                                    >
                                      <Edit2 className="h-3 w-3" />
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

            <TabsContent value="comparativo" className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-5 space-y-3 sm:space-y-4 animate-in fade-in-0 duration-500 min-h-0">
              {/* Resumo dos Fornecedores */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-4">
                {quote.fornecedoresParticipantes.map(fornecedor => {
                  const totalValue = products.reduce((sum: number, product: any) => {
                    const value = getSupplierProductValue(fornecedor.id, product.product_id);
                    return sum + (value || 0);
                  }, 0);

                  const respondedProducts = products.filter((product: any) =>
                    getSupplierProductValue(fornecedor.id, product.product_id) > 0
                  ).length;

                  const isWinning = bestSupplier?.id === fornecedor.id;

                  return (
                    <Card key={fornecedor.id} className={cn(
                      "p-4 sm:p-6 border transition-all duration-200 hover:shadow-md",
                      isWinning
                        ? "bg-white border-emerald-200 shadow-emerald-50 shadow-lg"
                        : "bg-white border-slate-200 hover:border-slate-300"
                    )}>
                      <div className="flex items-start gap-4">
                        <div className={cn(
                          "p-3 rounded-lg flex-shrink-0 border",
                          isWinning
                            ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                            : "bg-slate-50 border-slate-200 text-slate-600"
                        )}>
                          <Building2 className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0 space-y-4">
                          {/* H1 - Título Principal: Nome do Fornecedor */}
                          <div className="flex items-center justify-between">
                            <h1 className="text-base font-bold text-slate-900 truncate" title={fornecedor.nome}>
                              {fornecedor.nome}
                            </h1>
                            {isWinning && (
                              <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 font-semibold text-xs">
                                🏆 Melhor Oferta
                              </Badge>
                            )}
                          </div>
                          
                          {/* H3 - Destaques: Valores Principais */}
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Valor Total</span>
                              <div className={cn(
                                "text-lg font-bold leading-tight",
                                isWinning ? "text-emerald-700" : "text-slate-900"
                              )}>
                                R$ {totalValue.toFixed(2)}
                              </div>
                            </div>
                            <div className="space-y-2">
                              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Produtos</span>
                              <div className="text-sm font-bold text-slate-800">
                                {respondedProducts} <span className="text-xs font-medium text-slate-600">de {products.length}</span>
                              </div>
                            </div>
                          </div>
                          
                          {/* Body - Conteúdo: Informações Complementares */}
                          <div className="space-y-3">
                            <div className="flex justify-between items-center">
                              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Taxa de Participação</span>
                              <span className="text-xs font-bold text-slate-800">
                                {Math.round((respondedProducts / products.length) * 100)}%
                              </span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-2.5">
                              <div
                                className={cn(
                                  "h-2.5 rounded-full transition-all duration-500",
                                  isWinning ? "bg-emerald-500" : "bg-slate-400"
                                )}
                                style={{ width: `${(respondedProducts / products.length) * 100}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>

              {/* Tabela Comparativa */}
              <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[600px]">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        {/* H2 - Subtítulo: Header da Tabela */}
                        <th className="p-4 text-left min-w-[200px]">
                          <div className="flex items-center gap-3">
                            <div className="p-1.5 bg-slate-100 rounded-md">
                              <Package className="h-4 w-4 text-slate-600" />
                            </div>
                            <span className="text-base font-bold text-slate-800">Produtos</span>
                          </div>
                        </th>
                        {quote.fornecedoresParticipantes.map(fornecedor => (
                          <th key={fornecedor.id} className="p-4 text-center min-w-[120px] max-w-[140px]">
                            <div className="flex flex-col items-center gap-2">
                              <div className="p-1.5 bg-slate-100 rounded-md">
                                <Building2 className="h-4 w-4 text-slate-600" />
                              </div>
                              {/* H2 - Subtítulo: Nome do Fornecedor no Header */}
                              <span className="truncate text-xs font-bold text-slate-800 leading-tight" title={fornecedor.nome}>
                                {fornecedor.nome.length > 14 ? `${fornecedor.nome.substring(0, 14)}...` : fornecedor.nome}
                              </span>
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {products.map((product: any, index: number) => {
                        const { bestPrice, bestSupplierId } = getBestPriceInfoForProduct(product.product_id);

                        return (
                          <tr key={product.product_id} className={cn(
                            "border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors duration-150",
                            index % 2 === 0 ? "bg-white" : "bg-slate-50/30"
                          )}>
                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0 border border-slate-200">
                                  <Package className="h-4 w-4 text-slate-600" />
                                </div>
                                <div className="flex-1 min-w-0 space-y-2">
                                  {/* H3 - Destaque: Nome do Produto */}
                                  <p className="font-bold text-slate-900 text-sm truncate" title={product.product_name}>
                                    {product.product_name}
                                  </p>
                                  <div className="flex items-center gap-2">
                                    {/* Body - Conteúdo: Quantidade */}
                                    <span className="text-xs text-slate-700 font-semibold">{product.quantidade}</span>
                                    {/* Caption - Informação Secundária: Unidade */}
                                    <Badge variant="outline" className="text-xs px-2 py-0.5 h-5 border-slate-300 text-slate-600 bg-white font-medium">
                                      {product.unidade}
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                            </td>
                            {quote.fornecedoresParticipantes.map(fornecedor => {
                              const value = getSupplierProductValue(fornecedor.id, product.product_id);
                              const isBestPrice = fornecedor.id === bestSupplierId;

                              return (
                                <td key={fornecedor.id} className="p-4 text-center">
                                  {value > 0 ? (
                                    <div className="flex flex-col items-center gap-2">
                                      {/* H3 - Destaque: Valor do Produto */}
                                      <div className={cn(
                                        "px-3 py-2 rounded-lg transition-all duration-200 min-w-[100px]",
                                        isBestPrice
                                          ? "bg-emerald-500 text-white shadow-sm font-bold text-sm"
                                          : "bg-slate-100 text-slate-800 hover:bg-slate-200 border border-slate-200 font-semibold text-xs"
                                      )}>
                                        R$ {value.toFixed(2)}
                                      </div>
                                      {isBestPrice && (
                                        <div className="flex items-center gap-1 text-emerald-600">
                                          <Star className="h-3 w-3 fill-current" />
                                          <span className="text-xs font-semibold">Melhor preço</span>
                                        </div>
                                      )}
                                    </div>
                                  ) : (
                                      <div className="px-3 py-2 rounded-lg bg-slate-50 text-slate-400 font-medium text-xs border border-slate-200 min-w-[100px] flex items-center justify-center">
                                        <Minus className="h-4 w-4" />
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
              </div>

              {/* Ações da Cotação */}
              <div className="space-y-4">
                {/* Convert to Order Button */}
                {quote.status === 'ativa' && bestSupplier && (
                  <Card className="p-4 sm:p-5 border border-blue-200/50 shadow-lg bg-gradient-to-br from-blue-50/80 via-sky-50/60 to-blue-100/40 backdrop-blur-sm rounded-xl border-l-4 border-l-blue-500">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6">
                      <div className="flex items-center gap-3">
                        <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg">
                          <ShoppingCart className="h-5 w-5" />
                        </div>
                        <div>
                          {/* H2 - Subtítulo: Título da Seção */}
                          <h3 className="font-bold text-xl text-slate-900 mb-2">Pronto para Converter?</h3>
                          <div className="space-y-1">
                            {/* Body - Conteúdo: Informação do Fornecedor */}
                            <p className="text-xs text-slate-700">
                              Melhor fornecedor: <span className="font-bold text-blue-700">{bestSupplier.nome}</span>
                            </p>
                            {/* H3 - Destaque: Valor Total */}
                            <p className="text-sm text-slate-700">
                              Valor total: <span className="font-bold text-blue-700 text-base">R$ {bestSupplier.totalValue.toFixed(2)}</span>
                            </p>
                          </div>
                        </div>
                      </div>
                      <Button
                        onClick={handleConvertToOrder}
                        disabled={isUpdating}
                        className="bg-blue-600 border border-blue-600 hover:bg-blue-700 hover:border-blue-700 text-white transition-colors duration-200 text-sm px-6 py-2.5 h-auto min-h-[44px] whitespace-nowrap"
                      >
                        <ShoppingCart className="h-5 w-5 mr-2 flex-shrink-0" />
                        <span className="font-medium">Converter para Pedido</span>
                      </Button>
                    </div>
                  </Card>
                )}

                {/* Ações Adicionais */}
                <Card className="p-4 border border-slate-200/50 shadow-md bg-gradient-to-br from-white via-slate-50/30 to-blue-50/20 backdrop-blur-sm rounded-xl">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-gradient-to-br from-slate-500 to-slate-600 text-white shadow-sm">
                        <FileText className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm text-slate-900">Ações da Cotação</h4>
                        <p className="text-xs text-slate-600">Exportar dados ou compartilhar informações</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-slate-300 text-slate-600 hover:border-slate-400 hover:bg-slate-50 transition-colors duration-200 rounded-lg"
                        onClick={() => {
                          // Função para exportar dados da cotação
                          const data = {
                            cotacao: quote,
                            produtos: products,
                            fornecedores: quote.fornecedoresParticipantes
                          };
                          const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `cotacao-${quote.id}.json`;
                          a.click();
                          URL.revokeObjectURL(url);
                        }}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        <span className="hidden sm:inline">Exportar</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-slate-300 text-slate-600 hover:border-slate-400 hover:bg-slate-50 transition-colors duration-200 rounded-lg"
                        onClick={() => {
                          // Função para compartilhar cotação
                          if (navigator.share) {
                            navigator.share({
                              title: `Cotação - ${quote.produto}`,
                              text: `Cotação para ${quote.produto} com ${quote.fornecedores} fornecedores participantes`,
                              url: window.location.href
                            });
                          } else {
                            // Fallback para copiar link
                            navigator.clipboard.writeText(window.location.href);
                          }
                        }}
                      >
                        <Share2 className="h-4 w-4 mr-1" />
                        <span className="hidden sm:inline">Compartilhar</span>
                      </Button>
                    </div>
                  </div>
                </Card>

                {/* Informações de Tempo */}
                {quote.status === 'ativa' && (
                  <Card className="p-3 border border-blue-200/50 shadow-md bg-gradient-to-br from-blue-50/60 to-sky-50/40 backdrop-blur-sm rounded-xl border-l-4 border-l-blue-400">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-sm">
                        <Clock className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-blue-800">Cotação em Andamento</p>
                        <p className="text-xs text-blue-700">
                          Prazo final: {quote.dataFim} • Aguardando respostas dos fornecedores
                        </p>
                      </div>
                    </div>
                  </Card>
                )}
              </div>
            </TabsContent>
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
      </DialogContent>
    </Dialog>
  );
}
