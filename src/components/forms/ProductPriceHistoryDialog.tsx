import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package, TrendingUp, TrendingDown, Calendar, Building2, DollarSign, Minus, Loader2, ClipboardList, ShoppingCart } from "lucide-react";
import { cn } from "@/lib/utils";
import { useProductPriceHistory, PriceHistoryEntry } from "@/hooks/useProductPriceHistory";

interface ProductPriceHistoryDialogProps {
  productName: string;
  productId: string;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function ProductPriceHistoryDialog({ 
  productName, 
  productId, 
  trigger,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange
}: ProductPriceHistoryDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("pedidos");
  
  // Support both controlled and uncontrolled modes
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? (controlledOnOpenChange || (() => {})) : setInternalOpen;
  
  const isMobile = false; // Removida dependência mobile
  
  // Buscar dados reais do histórico de preços
  const { data, isLoading, error } = useProductPriceHistory(productId);
  const { quoteHistory = [], orderHistory = [] } = (data as any) || {};

  // Calcular variação de preço
  const calculatePriceVariation = (currentPrice: number, previousPrice: number | null) => {
    if (!previousPrice) return { type: "stable" as const, percentage: 0 };
    
    const variation = ((currentPrice - previousPrice) / previousPrice) * 100;
    
    if (Math.abs(variation) < 1) return { type: "stable" as const, percentage: variation };
    if (variation > 0) return { type: "up" as const, percentage: variation };
    return { type: "down" as const, percentage: variation };
  };

  const getVariationIcon = (type: "up" | "down" | "stable") => {
    const iconClass = "h-4 w-4";
    
    switch (type) {
      case "up":
        return <TrendingUp className={cn(iconClass, "text-red-500")} />;
      case "down":
        return <TrendingDown className={cn(iconClass, "text-green-500 dark:text-green-300")} />;
      default:
        return <Minus className={cn(iconClass, "text-gray-400 dark:text-gray-500")} />;
    }
  };

  const getVariationColor = (type: "up" | "down" | "stable") => {
    switch (type) {
      case "up":
        return "text-red-600 bg-red-50 border-red-200 dark:text-red-300 dark:bg-red-900/30 dark:border-red-700/50";
      case "down":
        return "text-green-600 bg-green-50 border-green-200 dark:text-green-300 dark:bg-green-900/30 dark:border-green-700/50";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200 dark:text-gray-300 dark:bg-gray-900/30 dark:border-gray-700/50";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getStatusBadge = (status: string, type: 'quote' | 'order') => {
    if (type === 'quote') {
      const statusConfig = {
        finalizada: { label: "Finalizada", class: "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700" },
        ativa: { label: "Ativa", class: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700" },
        expirada: { label: "Expirada", class: "bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-900/30 dark:text-gray-500 dark:border-gray-700" }
      };
      const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.expirada;
      return (
        <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0", config.class)}>
          {config.label}
        </Badge>
      );
    } else {
      const statusConfig = {
        entregue: { label: "Entregue", class: "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700" },
        pendente: { label: "Pendente", class: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700" },
        atrasado: { label: "Atrasado", class: "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700" }
      };
      const config = statusConfig[status as keyof typeof statusConfig] || { label: status, class: "bg-gray-50 text-gray-600 border-gray-200" };
      return (
        <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0", config.class)}>
          {config.label}
        </Badge>
      );
    }
  };

  const HistoryList = ({ history }: { history: PriceHistoryEntry[] }) => (
    <div className="flex-1 overflow-y-auto space-y-2 py-3 pr-1 custom-scrollbar">
      {history.map((entry, index) => {
        const previousEntry = history[index + 1];
        const variation = calculatePriceVariation(entry.price, previousEntry?.price || null);
        
        return (
          <Card key={entry.id} className="hover:shadow-sm hover:bg-gray-50/60 dark:hover:bg-gray-800/60 transition-all duration-200 border border-gray-200/60 dark:border-gray-700/60 bg-white dark:bg-gray-900/50">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                  <div className="w-7 h-7 rounded-md bg-green-50 dark:bg-green-900/30 flex items-center justify-center border border-green-100 dark:border-green-700/50 flex-shrink-0">
                    <Building2 className="h-3.5 w-3.5 text-green-600 dark:text-green-300" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="font-medium text-gray-900 dark:text-gray-100 text-sm truncate">
                        {entry.supplier}
                      </span>
                      <Badge variant="outline" className="text-[10px] bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-900/40 dark:text-gray-300 dark:border-gray-700 px-1.5 py-0">
                        {entry.quotationId ? `COT #${entry.quotationId.substring(0, 6)}` : `PED #${entry.orderId?.substring(0, 6)}`}
                      </Badge>
                      {getStatusBadge(entry.status, entry.type)}
                    </div>
                    
                    <div className="flex items-center gap-1.5 text-[10px] text-gray-500 dark:text-gray-400">
                      <Calendar className="h-3 w-3" />
                      <span>{formatDate(entry.date)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 flex-shrink-0">
                  {index < history.length - 1 && (
                    <div className={cn(
                      "flex items-center gap-1 px-1.5 py-0.5 rounded-full border text-[10px] font-medium",
                      getVariationColor(variation.type)
                    )}>
                      {getVariationIcon(variation.type)}
                      <span>
                        {variation.type === "stable" 
                          ? "0%" 
                          : `${variation.percentage > 0 ? '+' : ''}${variation.percentage.toFixed(1)}%`
                        }
                      </span>
                    </div>
                  )}

                  <div className="text-right">
                    <div className="flex items-center gap-1 text-base font-semibold text-gray-900 dark:text-gray-100">
                      <DollarSign className="h-3.5 w-3.5 text-green-600 dark:text-green-300" />
                      <span>R$ {entry.price.toFixed(2)}</span>
                    </div>
                    {index === 0 && (
                      <Badge className="bg-blue-50 text-blue-700 text-[10px] mt-0.5 px-1.5 py-0 dark:bg-blue-900/40 dark:text-blue-300">
                        Mais recente
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );

  // Mobile: Usar Sheet (bottom sheet)
  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          {trigger}
        </SheetTrigger>
        <SheetContent side="bottom" className="h-[90vh] rounded-t-2xl pb-8">
          <SheetHeader className="pb-3 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center shadow-lg">
                <Package className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <SheetTitle className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  Histórico de Preços
                </SheetTitle>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
                  {productName}
                </p>
              </div>
            </div>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto space-y-3 py-4 mt-4">
          {isLoading ? (
            <div className="text-center py-12">
              <Loader2 className="h-8 w-8 text-blue-500 mx-auto mb-3 animate-spin" />
              <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Carregando histórico...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-red-300 dark:text-red-500 mx-auto mb-3" />
              <p className="text-red-500 dark:text-red-400 text-sm font-medium">Erro ao carregar histórico</p>
              <p className="text-xs text-red-400 dark:text-red-500 mt-1">Tente novamente mais tarde</p>
            </div>
          ) : sortedHistory.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-gray-300 dark:text-gray-500 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-300 text-sm font-medium">Nenhum histórico encontrado</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Este produto ainda não possui cotações finalizadas</p>
            </div>
          ) : (
            <>
              {/* Resumo estatístico mobile - no topo */}
              <div className="mb-4 p-4 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200/60 dark:border-blue-700/60">
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center">
                    <div className="text-[10px] text-gray-600 dark:text-gray-400 mb-1 font-medium">Menor</div>
                    <div className="font-bold text-green-600 dark:text-green-400 text-sm">
                      R$ {Math.min(...sortedHistory.map(h => h.price)).toFixed(2)}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-[10px] text-gray-600 dark:text-gray-400 mb-1 font-medium">Maior</div>
                    <div className="font-bold text-red-600 dark:text-red-400 text-sm">
                      R$ {Math.max(...sortedHistory.map(h => h.price)).toFixed(2)}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-[10px] text-gray-600 dark:text-gray-400 mb-1 font-medium">Médio</div>
                    <div className="font-bold text-blue-600 dark:text-blue-400 text-sm">
                      R$ {(sortedHistory.reduce((sum, h) => sum + h.price, 0) / sortedHistory.length).toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Lista de histórico mobile - layout vertical otimizado */}
              {sortedHistory.map((entry, index) => {
                const previousEntry = sortedHistory[index + 1];
                const variation = calculatePriceVariation(entry.price, previousEntry?.price || null);
                
                return (
                  <Card key={entry.id} className="border border-gray-200/60 dark:border-gray-700/60 bg-white dark:bg-gray-900/50 shadow-sm">
                    <CardContent className="p-4">
                      {/* Header do card mobile */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center flex-shrink-0 shadow-md">
                            <Building2 className="h-5 w-5 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm truncate mb-1">
                              {entry.supplier}
                            </p>
                            <div className="flex items-center gap-2 flex-wrap">
                              <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                                <Calendar className="h-3 w-3" />
                                <span>{formatDate(entry.date)}</span>
                              </div>
                              {getStatusBadge(entry.status)}
                            </div>
                          </div>
                        </div>
                        {index === 0 && (
                          <Badge className="bg-blue-500 text-white text-[10px] px-2 py-0.5 ml-2 flex-shrink-0">
                            Recente
                          </Badge>
                        )}
                      </div>

                      {/* Preço e variação mobile - destaque */}
                      <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-2">
                          <div className="text-xs text-gray-500 dark:text-gray-400">Preço:</div>
                          <div className="flex items-baseline gap-1">
                            <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
                            <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
                              R$ {entry.price.toFixed(2)}
                            </span>
                          </div>
                        </div>
                        
                        {/* Variação mobile - mais visível */}
                        {index < sortedHistory.length - 1 && (
                          <div className={cn(
                            "flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold",
                            getVariationColor(variation.type)
                          )}>
                            {getVariationIcon(variation.type, variation.percentage)}
                            <span>
                              {variation.type === "stable" 
                                ? "Sem mudança" 
                                : `${variation.percentage > 0 ? '+' : ''}${variation.percentage.toFixed(1)}%`
                              }
                            </span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </>
          )}
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  // Desktop: Usar Dialog (mantém layout original)
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="max-w-2xl h-[80vh] flex flex-col p-0 overflow-hidden bg-white dark:bg-[#10141f]">
        <DialogHeader className="p-4 border-b border-gray-100/80 dark:border-gray-700/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center shadow-lg">
              <Package className="h-5 w-5 text-white" />
            </div>
            <div className="min-w-0">
              <DialogTitle className="text-base font-bold text-gray-900 dark:text-gray-100">
                Histórico de Preços
              </DialogTitle>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate font-medium">
                {productName}
              </p>
            </div>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <div className="px-4 border-b border-gray-100 dark:border-gray-800">
            <TabsList className="flex bg-transparent !bg-transparent p-0 gap-6 h-10 w-full justify-start rounded-none border-b-0 shadow-none !shadow-none">
              <TabsTrigger 
                value="pedidos" 
                className="relative h-10 px-1 pb-2 pt-2 text-[9px] font-black uppercase tracking-widest
                  !bg-transparent data-[state=active]:!bg-transparent hover:!bg-transparent
                  !text-gray-400 dark:!text-gray-500 
                  data-[state=active]:!text-gray-900 dark:data-[state=active]:!text-white 
                  !shadow-none data-[state=active]:!shadow-none
                  rounded-none border-b-2 border-transparent data-[state=active]:!border-gray-900 dark:data-[state=active]:!border-white
                  transition-all cursor-pointer flex items-center gap-2"
              >
                <ShoppingCart className="h-3 w-3" />
                Pedidos Confirmados
              </TabsTrigger>
              <TabsTrigger 
                value="cotacoes" 
                className="relative h-10 px-1 pb-2 pt-2 text-[9px] font-black uppercase tracking-widest
                  !bg-transparent data-[state=active]:!bg-transparent hover:!bg-transparent
                  !text-gray-400 dark:!text-gray-500 
                  data-[state=active]:!text-gray-900 dark:data-[state=active]:!text-white 
                  !shadow-none data-[state=active]:!shadow-none
                  rounded-none border-b-2 border-transparent data-[state=active]:!border-gray-900 dark:data-[state=active]:!border-white
                  transition-all cursor-pointer flex items-center gap-2"
              >
                <ClipboardList className="h-3 w-3" />
                Histórico de Cotações
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-hidden px-4">
            {isLoading ? (
              <div className="h-full flex flex-col items-center justify-center py-12">
                <Loader2 className="h-8 w-8 text-blue-500 mb-4 animate-spin" />
                <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Carregando histórico...</p>
              </div>
            ) : error ? (
              <div className="h-full flex flex-col items-center justify-center py-12">
                <Package className="h-12 w-12 text-red-300 dark:text-red-500 mb-4" />
                <p className="text-red-500 dark:text-red-400 text-sm font-medium">Erro ao carregar histórico</p>
              </div>
            ) : (
              <>
                <TabsContent value="pedidos" className="h-full m-0 focus-visible:ring-0">
                  {orderHistory.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center py-12 text-center">
                      <ShoppingCart className="h-12 w-12 text-gray-200 dark:text-gray-700 mb-4" />
                      <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Nenhum pedido confirmado</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 max-w-[250px]">
                        Os preços reais de compra aparecerão aqui após a confirmação de pedidos.
                      </p>
                    </div>
                  ) : (
                    <HistoryList history={orderHistory} />
                  )}
                </TabsContent>
                
                <TabsContent value="cotacoes" className="h-full m-0 focus-visible:ring-0">
                  {quoteHistory.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center py-12 text-center">
                      <ClipboardList className="h-12 w-12 text-gray-200 dark:text-gray-700 mb-4" />
                      <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Nenhuma cotação encontrada</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        Este produto ainda não possui histórico de cotações.
                      </p>
                    </div>
                  ) : (
                    <HistoryList history={quoteHistory} />
                  )}
                </TabsContent>
              </>
            )}
          </div>
        </Tabs>

        {/* Resumo estatístico baseado na aba ativa */}
        {!isLoading && !error && (
          <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/40">
            {(() => {
              const currentHistory = activeTab === 'pedidos' ? orderHistory : quoteHistory;
              if (currentHistory.length === 0) return null;
              
              const prices = currentHistory.map(h => h.price);
              const minPrice = Math.min(...prices);
              const maxPrice = Math.max(...prices);
              const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;

              return (
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="space-y-1">
                    <div className="text-[10px] uppercase tracking-wider text-gray-500 dark:text-gray-400 font-bold">Menor</div>
                    <div className="font-bold text-green-600 dark:text-green-400 text-sm">R$ {minPrice.toFixed(2)}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-[10px] uppercase tracking-wider text-gray-500 dark:text-gray-400 font-bold">Maior</div>
                    <div className="font-bold text-red-600 dark:text-red-400 text-sm">R$ {maxPrice.toFixed(2)}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-[10px] uppercase tracking-wider text-gray-500 dark:text-gray-400 font-bold">Médio</div>
                    <div className="font-bold text-blue-600 dark:text-blue-400 text-sm">R$ {avgPrice.toFixed(2)}</div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}