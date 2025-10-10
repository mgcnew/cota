import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Package, Users, TrendingDown, Edit2, Save, X, DollarSign, ShoppingCart, FileText } from "lucide-react";
import { useState } from "react";
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

  const handleStartEdit = (productId: string, currentValue: number) => {
    setEditingProductId(productId);
    setEditedValues(prev => ({ ...prev, [productId]: currentValue }));
  };

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
      <DialogContent className="w-[90vw] max-w-6xl h-[85vh] max-h-[900px] overflow-hidden border-0 shadow-2xl rounded-xl sm:rounded-2xl p-0">
        <DialogHeader className="px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-100/60 bg-gradient-to-br from-blue-50/80 via-indigo-50/60 to-purple-50/40 backdrop-blur-sm relative overflow-hidden flex-shrink-0">
          {/* Efeitos decorativos de fundo */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-indigo-500/5 to-purple-500/5"></div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400/10 to-indigo-400/10 rounded-full -translate-y-16 translate-x-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-purple-400/10 to-pink-400/10 rounded-full translate-y-12 -translate-x-12"></div>
          
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
            <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
              <div className="p-2 sm:p-3 rounded-xl sm:rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 text-white shadow-lg shadow-blue-500/25 ring-2 ring-white/20 backdrop-blur-sm flex-shrink-0">
                <Package className="h-5 w-5 sm:h-6 sm:w-6 drop-shadow-sm" />
              </div>
              <div className="flex flex-col flex-1 min-w-0">
                <DialogTitle className="text-lg sm:text-xl lg:text-2xl font-bold bg-gradient-to-r from-blue-900 via-indigo-800 to-purple-800 bg-clip-text text-transparent truncate">
                  Detalhes da Cotação
                </DialogTitle>
                <p className="text-gray-600/80 text-xs sm:text-sm font-medium mt-0.5 truncate">
                  Visualize e gerencie informações da cotação
                </p>
              </div>
            </div>
            <div className="flex-shrink-0 self-start sm:self-center">
              {getStatusBadge(quote.status)}
            </div>
          </div>
        </DialogHeader>

        <div className="flex flex-col h-full overflow-hidden">
          <Tabs defaultValue="detalhes" className="w-full flex flex-col h-full">
            <div className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 border-b border-gray-100/60 bg-gradient-to-r from-gray-50/80 to-slate-50/60 backdrop-blur-sm flex-shrink-0">
              <TabsList className="grid w-full grid-cols-3 bg-white/60 backdrop-blur-sm rounded-xl sm:rounded-2xl p-1 sm:p-1.5 shadow-lg border border-gray-200/40">
                <TabsTrigger 
                  value="detalhes" 
                  className="rounded-lg sm:rounded-xl font-semibold text-xs sm:text-sm transition-all duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-xl data-[state=active]:shadow-blue-500/25 px-2 sm:px-3 py-2 sm:py-2.5"
                >
                  <span className="hidden sm:inline">📋 Detalhes</span>
                  <span className="sm:hidden">📋</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="atualizacao" 
                  className="rounded-lg sm:rounded-xl font-semibold text-xs sm:text-sm transition-all duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-600 data-[state=active]:to-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-xl data-[state=active]:shadow-green-500/25 px-2 sm:px-3 py-2 sm:py-2.5"
                >
                  <span className="hidden sm:inline">💰 Valores</span>
                  <span className="sm:hidden">💰</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="comparativo" 
                  className="rounded-lg sm:rounded-xl font-semibold text-xs sm:text-sm transition-all duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white data-[state=active]:shadow-xl data-[state=active]:shadow-purple-500/25 px-2 sm:px-3 py-2 sm:py-2.5"
                >
                  <span className="hidden sm:inline">📊 Comparativo</span>
                  <span className="sm:hidden">📊</span>
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="detalhes" className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                <Card className="p-4 sm:p-5 border-0 shadow-lg bg-gradient-to-br from-blue-50/60 to-indigo-50/40 backdrop-blur-sm rounded-xl sm:rounded-2xl">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg flex-shrink-0">
                      <Package className="h-4 w-4 sm:h-5 sm:w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-medium text-gray-600">Produto Principal</p>
                      <p className="font-bold text-gray-900 text-sm sm:text-base lg:text-lg truncate">{quote.produto}</p>
                      <p className="text-xs sm:text-sm text-blue-600 font-medium truncate">{quote.quantidade}</p>
                    </div>
                  </div>
                </Card>

                <Card className="p-4 sm:p-5 border-0 shadow-lg bg-gradient-to-br from-green-50/60 to-emerald-50/40 backdrop-blur-sm rounded-xl sm:rounded-2xl">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-gradient-to-br from-green-600 to-emerald-600 text-white shadow-lg flex-shrink-0">
                      <Users className="h-4 w-4 sm:h-5 sm:w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-medium text-gray-600">Fornecedores Participantes</p>
                      <p className="font-bold text-gray-900 text-sm sm:text-base lg:text-lg">{quote.fornecedores}</p>
                      <p className="text-xs sm:text-sm text-green-600 font-medium">fornecedores convidados</p>
                    </div>
                  </div>
                </Card>

                <Card className="p-4 sm:p-5 border-0 shadow-lg bg-gradient-to-br from-purple-50/60 to-pink-50/40 backdrop-blur-sm rounded-xl sm:rounded-2xl">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 text-white shadow-lg flex-shrink-0">
                      <Calendar className="h-4 w-4 sm:h-5 sm:w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-medium text-gray-600">Período da Cotação</p>
                      <p className="font-bold text-gray-900 text-sm sm:text-base truncate">{quote.dataInicio}</p>
                      <p className="text-xs sm:text-sm text-purple-600 font-medium truncate">até {quote.dataFim}</p>
                    </div>
                  </div>
                </Card>

                <Card className="p-4 sm:p-5 border-0 shadow-lg bg-gradient-to-br from-orange-50/60 to-red-50/40 backdrop-blur-sm rounded-xl sm:rounded-2xl">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-gradient-to-br from-orange-600 to-red-600 text-white shadow-lg flex-shrink-0">
                      <TrendingDown className="h-4 w-4 sm:h-5 sm:w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-medium text-gray-600">Melhor Oferta</p>
                      <p className="font-bold text-green-600 text-sm sm:text-base lg:text-lg truncate">{quote.melhorPreco}</p>
                      <p className="text-xs sm:text-sm text-orange-600 font-medium truncate">{quote.melhorFornecedor}</p>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Resumo da economia */}
              <Card className="p-4 sm:p-6 border-0 shadow-xl bg-gradient-to-br from-green-50 via-emerald-50/60 to-teal-50/40 backdrop-blur-sm rounded-xl sm:rounded-2xl border-l-4 border-l-green-500">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                    <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-gradient-to-br from-green-600 to-emerald-600 text-white shadow-xl flex-shrink-0">
                      <DollarSign className="h-5 w-5 sm:h-6 sm:w-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-lg sm:text-xl text-gray-900">Economia Estimada</h3>
                      <p className="text-green-600 font-bold text-xl sm:text-2xl truncate">{quote.economia}</p>
                      <p className="text-xs sm:text-sm text-gray-600">em relação ao preço médio de mercado</p>
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 bg-green-100 rounded-full">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-green-700 font-semibold text-xs sm:text-sm">Economia Ativa</span>
                    </div>
                  </div>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="atualizacao" className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
              <Card className="p-4 sm:p-6 border-0 shadow-xl bg-gradient-to-br from-white via-gray-50/30 to-green-50/20 backdrop-blur-sm rounded-xl sm:rounded-2xl">
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-gradient-to-r from-green-50/60 to-emerald-50/40 rounded-xl sm:rounded-2xl border border-green-100/60">
                    <div className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-gradient-to-br from-green-600 to-emerald-600 text-white shadow-lg flex-shrink-0">
                      <Users className="h-4 w-4 sm:h-5 sm:w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <label className="text-xs sm:text-sm font-bold text-gray-900 block mb-2">Selecione o Fornecedor</label>
                      <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
                        <SelectTrigger className="bg-white/80 backdrop-blur-sm border-green-200 focus:border-green-400 rounded-xl">
                          <SelectValue placeholder="Escolha um fornecedor para editar valores" />
                        </SelectTrigger>
                        <SelectContent>
                          {quote.fornecedoresParticipantes.map(fornecedor => (
                            <SelectItem key={fornecedor.id} value={fornecedor.id}>
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                {fornecedor.nome}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {selectedSupplier && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold flex items-center gap-2 text-sm sm:text-base">
                          <DollarSign className="h-4 w-4" />
                          Lista de Produtos
                        </h4>
                        {quote.status === "concluida" && (
                          <Badge variant="secondary" className="bg-gray-100 text-gray-600 border border-gray-300">
                            <FileText className="h-3 w-3 mr-1" />
                            Cotação Finalizada
                          </Badge>
                        )}
                      </div>
                      
                      {quote.status === "concluida" && (
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
                          <div className="flex items-center gap-2 text-amber-800">
                            <ShoppingCart className="h-4 w-4" />
                            <span className="text-sm font-medium">
                              Esta cotação foi finalizada e convertida em pedido. Os valores não podem mais ser editados.
                            </span>
                          </div>
                        </div>
                      )}
                      <div className="rounded-xl sm:rounded-2xl border-0 shadow-lg overflow-hidden bg-white/60 backdrop-blur-sm overflow-x-auto">
                        <table className="w-full min-w-[600px]">
                          <thead>
                            <tr className="bg-gradient-to-r from-green-500 to-emerald-500 text-white">
                              <th className="p-3 sm:p-4 text-left font-bold text-xs sm:text-sm">
                                <span className="hidden sm:inline">📦 Produto</span>
                                <span className="sm:hidden">📦</span>
                              </th>
                              <th className="p-3 sm:p-4 text-left font-bold text-xs sm:text-sm">
                                <span className="hidden sm:inline">📏 Quantidade</span>
                                <span className="sm:hidden">📏</span>
                              </th>
                              <th className="p-3 sm:p-4 text-left font-bold text-xs sm:text-sm">
                                <span className="hidden sm:inline">💰 Valor Oferecido</span>
                                <span className="sm:hidden">💰</span>
                              </th>
                              <th className="p-3 sm:p-4 text-left font-bold text-xs sm:text-sm">
                                <span className="hidden sm:inline">⚙️ Ações</span>
                                <span className="sm:hidden">⚙️</span>
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {products.map((product: any) => {
                              const currentValue = getSupplierProductValue(selectedSupplier, product.product_id);
                              const isEditing = editingProductId === product.product_id;
                              const { bestPrice, bestSupplierId } = getBestPriceInfoForProduct(product.product_id);
                              const isBestPrice = currentValue > 0 && selectedSupplier === bestSupplierId;

                              return (
                                <tr key={product.product_id} className="border-b border-gray-100 last:border-0 hover:bg-green-50/30 transition-colors">
                                  <td className="p-3 sm:p-4">
                                    <div className="font-semibold text-gray-900 text-xs sm:text-sm truncate max-w-[150px] sm:max-w-none" title={product.product_name}>
                                      {product.product_name}
                                    </div>
                                  </td>
                                  <td className="p-3 sm:p-4">
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                                      <span className="font-medium text-xs sm:text-sm">{product.quantidade}</span>
                                      <Badge variant="outline" className="text-xs w-fit">{product.unidade}</Badge>
                                    </div>
                                  </td>
                                  <td className="p-3 sm:p-4">
                                    {isEditing ? (
                                      <div className="flex items-center gap-2">
                                        <Input
                                          type="number"
                                          value={editedValues[product.product_id] || 0}
                                          onChange={(e) => setEditedValues(prev => ({
                                            ...prev,
                                            [product.product_id]: Number(e.target.value)
                                          }))}
                                          className="w-28 sm:w-36 rounded-lg sm:rounded-xl border-green-200 focus:border-green-400 text-xs sm:text-sm"
                                          step="0.01"
                                          min="0"
                                          placeholder="0.00"
                                        />
                                      </div>
                                    ) : (
                                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                                        <span className={cn(
                                          "font-bold text-sm sm:text-base lg:text-lg",
                                          isBestPrice ? "text-green-600" : "text-gray-900"
                                        )}>
                                          R$ {currentValue.toFixed(2)}
                                        </span>
                                        {isBestPrice && (
                                          <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg text-xs w-fit">
                                            <span className="hidden sm:inline">🏆 Melhor Preço</span>
                                            <span className="sm:hidden">🏆</span>
                                          </Badge>
                                        )}
                                      </div>
                                    )}
                                  </td>
                                  <td className="p-3 sm:p-4">
                                    {isEditing ? (
                                      <div className="flex gap-1 sm:gap-2">
                                        <Button
                                          size="sm"
                                          onClick={() => handleSaveEdit(product.product_id)}
                                          className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg sm:rounded-xl shadow-lg h-8 w-8 sm:h-9 sm:w-9 p-0"
                                        >
                                          <Save className="h-3 w-3 sm:h-4 sm:w-4" />
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={handleCancelEdit}
                                          className="rounded-lg sm:rounded-xl border-red-200 text-red-600 hover:bg-red-50 h-8 w-8 sm:h-9 sm:w-9 p-0"
                                        >
                                          <X className="h-3 w-3 sm:h-4 sm:w-4" />
                                        </Button>
                                      </div>
                                    ) : (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleStartEdit(product.product_id, currentValue)}
                                        disabled={quote.status === "concluida"}
                                        className={cn(
                                          "rounded-lg sm:rounded-xl h-8 w-8 sm:h-9 sm:w-9 p-0",
                                          quote.status === "concluida" 
                                            ? "border-gray-200 text-gray-400 cursor-not-allowed" 
                                            : "border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-300"
                                        )}
                                        title={quote.status === "concluida" ? "Cotação finalizada - Edição não permitida" : "Editar valor"}
                                      >
                                        <Edit2 className="h-3 w-3 sm:h-4 sm:w-4" />
                                      </Button>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="comparativo" className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
              <div className="rounded-xl sm:rounded-2xl border-0 shadow-xl overflow-hidden bg-white/60 backdrop-blur-sm overflow-x-auto">
                <table className="w-full min-w-[700px]">
                  <thead>
                    <tr className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                      <th className="p-3 sm:p-4 text-left font-bold text-xs sm:text-sm">
                        <span className="hidden sm:inline">📦 Produto</span>
                        <span className="sm:hidden">📦</span>
                      </th>
                      {quote.fornecedoresParticipantes.map(fornecedor => (
                        <th key={fornecedor.id} className="p-3 sm:p-4 text-center font-bold text-xs sm:text-sm min-w-[120px]">
                          <div className="truncate" title={fornecedor.nome}>
                            <span className="hidden sm:inline">🏢 {fornecedor.nome}</span>
                            <span className="sm:hidden">{fornecedor.nome.substring(0, 8)}...</span>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product: any) => {
                      const { bestPrice, bestSupplierId } = getBestPriceInfoForProduct(product.product_id);
                      
                      return (
                        <tr key={product.product_id} className="border-b border-gray-100 last:border-0 hover:bg-purple-50/30 transition-colors">
                          <td className="p-3 sm:p-4">
                            <div className="flex items-center gap-2 sm:gap-3">
                              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-xs sm:text-sm flex-shrink-0">
                                📦
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-bold text-gray-900 text-xs sm:text-sm lg:text-base truncate" title={product.product_name}>
                                  {product.product_name}
                                </p>
                                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mt-1">
                                  <span className="text-xs sm:text-sm text-gray-600">{product.quantidade}</span>
                                  <Badge variant="outline" className="text-xs w-fit">{product.unidade}</Badge>
                                </div>
                              </div>
                            </div>
                          </td>
                          {quote.fornecedoresParticipantes.map(fornecedor => {
                            const value = getSupplierProductValue(fornecedor.id, product.product_id);
                            const isBestPrice = fornecedor.id === bestSupplierId;
                            
                            return (
                              <td key={fornecedor.id} className="p-3 sm:p-4 text-center">
                                {value > 0 ? (
                                  <div className="flex flex-col items-center gap-1 sm:gap-2">
                                    <div className={cn(
                                      "px-2 sm:px-4 py-1 sm:py-2 rounded-lg sm:rounded-xl font-bold text-xs sm:text-sm lg:text-base shadow-lg transition-all duration-300",
                                      isBestPrice 
                                        ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-green-500/25 scale-105 sm:scale-110" 
                                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                    )}>
                                      R$ {value.toFixed(2)}
                                    </div>
                                    {isBestPrice && (
                                      <Badge className="bg-gradient-to-r from-yellow-400 to-orange-400 text-white shadow-lg animate-pulse text-xs">
                                        <span className="hidden sm:inline">🏆 Melhor Oferta</span>
                                        <span className="sm:hidden">🏆</span>
                                      </Badge>
                                    )}
                                  </div>
                                ) : (
                                  <div className="px-2 sm:px-4 py-1 sm:py-2 rounded-lg sm:rounded-xl bg-gray-100 text-gray-400 font-medium text-xs sm:text-sm">
                                    <span className="hidden sm:inline">Sem oferta</span>
                                    <span className="sm:hidden">-</span>
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

              {/* Convert to Order Button */}
              {quote.status === 'ativa' && bestSupplier && (
                <Card className="p-6 border-0 shadow-xl bg-gradient-to-br from-green-50 via-emerald-50/60 to-teal-50/40 backdrop-blur-sm rounded-2xl border-l-4 border-l-green-500">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="p-4 rounded-xl bg-gradient-to-br from-green-600 to-emerald-600 text-white shadow-xl">
                        <ShoppingCart className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-gray-900">Pronto para Converter?</h3>
                        <p className="text-sm text-gray-600">
                          Melhor fornecedor: <span className="font-semibold text-green-700">{bestSupplier.nome}</span>
                        </p>
                        <p className="text-sm text-gray-600">
                          Valor total: <span className="font-bold text-green-700">R$ {bestSupplier.totalValue.toFixed(2)}</span>
                        </p>
                      </div>
                    </div>
                    <Button
                      onClick={handleConvertToOrder}
                      disabled={isUpdating}
                      className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-xl hover:shadow-2xl transition-all duration-300 text-base px-6 py-6"
                    >
                      <ShoppingCart className="h-5 w-5 mr-2" />
                      Converter para Pedido
                    </Button>
                  </div>
                </Card>
              )}
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
