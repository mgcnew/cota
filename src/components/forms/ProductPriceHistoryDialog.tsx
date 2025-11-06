import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Package, TrendingUp, TrendingDown, Calendar, Building2, DollarSign, Minus, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useProductPriceHistory } from "@/hooks/useProductPriceHistory";
import { useMobile } from "@/contexts/MobileProvider";

interface ProductPriceHistoryDialogProps {
  productName: string;
  productId: string;
  trigger?: React.ReactNode;
}

export function ProductPriceHistoryDialog({ productName, productId, trigger }: ProductPriceHistoryDialogProps) {
  const [open, setOpen] = useState(false);
  const isMobile = useMobile();
  
  // Buscar dados reais do histórico de preços
  const { data: priceHistory = [], isLoading, error } = useProductPriceHistory(productId);

  // Calcular variação de preço
  const calculatePriceVariation = (currentPrice: number, previousPrice: number | null) => {
    if (!previousPrice) return { type: "stable" as const, percentage: 0 };
    
    const variation = ((currentPrice - previousPrice) / previousPrice) * 100;
    
    if (Math.abs(variation) < 1) return { type: "stable" as const, percentage: variation };
    if (variation > 0) return { type: "up" as const, percentage: variation };
    return { type: "down" as const, percentage: variation };
  };

  // Os dados já vêm ordenados por data do hook
  const sortedHistory = priceHistory;

  const getVariationIcon = (type: "up" | "down" | "stable", percentage: number) => {
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

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      concluida: { label: "Concluída", class: "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700" },
      ativa: { label: "Ativa", class: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700" },
      expirada: { label: "Expirada", class: "bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-900/30 dark:text-gray-500 dark:border-gray-700" }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.expirada;
    
    return (
      <Badge variant="outline" className={cn("text-xs px-1.5 py-0", config.class)}>
        {config.label}
      </Badge>
    );
  };

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
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
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
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden bg-white dark:bg-[#10141f]">
        <DialogHeader className="pb-3 border-b border-gray-100/80 dark:border-gray-700/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center border border-blue-100 dark:border-blue-700/50">
              <Package className="h-4 w-4 text-blue-600 dark:text-blue-300" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold text-gray-900 dark:text-gray-100">
                Histórico de Preços
              </DialogTitle>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                {productName}
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-2 py-3">
          {isLoading ? (
            <div className="text-center py-6">
              <Loader2 className="h-6 w-6 text-blue-500 mx-auto mb-2 animate-spin" />
              <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Carregando histórico...</p>
            </div>
          ) : error ? (
            <div className="text-center py-6">
              <Package className="h-8 w-8 text-red-300 dark:text-red-500 mx-auto mb-2" />
              <p className="text-red-500 dark:text-red-400 text-sm font-medium">Erro ao carregar histórico</p>
              <p className="text-xs text-red-400 dark:text-red-500">Tente novamente mais tarde</p>
            </div>
          ) : sortedHistory.length === 0 ? (
            <div className="text-center py-6">
              <Package className="h-8 w-8 text-gray-300 dark:text-gray-500 mx-auto mb-2" />
              <p className="text-gray-500 dark:text-gray-300 text-sm font-medium">Nenhum histórico encontrado</p>
              <p className="text-xs text-gray-400 dark:text-gray-500">Este produto ainda não possui cotações finalizadas</p>
            </div>
          ) : (
            sortedHistory.map((entry, index) => {
              const previousEntry = sortedHistory[index + 1];
              const variation = calculatePriceVariation(entry.price, previousEntry?.price || null);
              
              return (
                <Card key={entry.id} className="hover:shadow-sm hover:bg-gray-50/60 dark:hover:bg-gray-800/60 transition-all duration-200 border border-gray-200/60 dark:border-gray-700/60 bg-white dark:bg-gray-900/50">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      {/* Informações principais */}
                      <div className="flex items-center gap-2.5 flex-1 min-w-0">
                        <div className="w-7 h-7 rounded-md bg-green-50 dark:bg-green-900/30 flex items-center justify-center border border-green-100 dark:border-green-700/50 flex-shrink-0">
                          <Building2 className="h-3.5 w-3.5 text-green-600 dark:text-green-300" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className="font-medium text-gray-900 dark:text-gray-100 text-sm truncate">
                              {entry.supplier}
                            </span>
                            <Badge variant="outline" className="text-xs bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-900/40 dark:text-gray-300 dark:border-gray-700 px-1.5 py-0">
                              {entry.quotationId.substring(0, 6)}...
                            </Badge>
                            {getStatusBadge(entry.status)}
                          </div>
                          
                          <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                            <Calendar className="h-3 w-3" />
                            <span>{formatDate(entry.date)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Preço e variação */}
                      <div className="flex items-center gap-2.5 flex-shrink-0">
                        {/* Indicador de variação */}
                        {index < sortedHistory.length - 1 && (
                          <div className={cn(
                            "flex items-center gap-1 px-1.5 py-0.5 rounded-full border text-xs font-medium",
                            getVariationColor(variation.type)
                          )}>
                            {getVariationIcon(variation.type, variation.percentage)}
                            <span>
                              {variation.type === "stable" 
                                ? "0%" 
                                : `${variation.percentage > 0 ? '+' : ''}${variation.percentage.toFixed(1)}%`
                              }
                            </span>
                          </div>
                        )}

                        {/* Preço */}
                        <div className="text-right">
                          <div className="flex items-center gap-1 text-base font-semibold text-gray-900 dark:text-gray-100">
                            <DollarSign className="h-3.5 w-3.5 text-green-600 dark:text-green-300" />
                            <span>R$ {entry.price.toFixed(2)}</span>
                          </div>
                          {index === 0 && (
                            <Badge className="bg-blue-50 text-blue-700 text-xs mt-0.5 px-1.5 py-0 dark:bg-blue-900/40 dark:text-blue-300">
                              Mais recente
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {/* Resumo estatístico */}
        {sortedHistory.length > 0 && (
          <div className="pt-3 border-t border-gray-100/80 bg-gray-50/30 dark:border-gray-700/60 dark:bg-gray-900/40 -mx-6 -mb-6 px-6 pb-6 mt-3">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Menor Preço</div>
                <div className="font-semibold text-green-600 dark:text-green-300 text-sm">
                  R$ {Math.min(...sortedHistory.map(h => h.price)).toFixed(2)}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Maior Preço</div>
                <div className="font-semibold text-red-600 dark:text-red-300 text-sm">
                  R$ {Math.max(...sortedHistory.map(h => h.price)).toFixed(2)}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Preço Médio</div>
                <div className="font-semibold text-blue-600 dark:text-blue-300 text-sm">
                  R$ {(sortedHistory.reduce((sum, h) => sum + h.price, 0) / sortedHistory.length).toFixed(2)}
                </div>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}