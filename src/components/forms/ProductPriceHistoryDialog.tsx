import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Package, TrendingUp, TrendingDown, Calendar, Building2, DollarSign, Minus, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useProductPriceHistory } from "@/hooks/useProductPriceHistory";

interface ProductPriceHistoryDialogProps {
  productName: string;
  productId: string;
  trigger?: React.ReactNode;
}

export function ProductPriceHistoryDialog({ productName, productId, trigger }: ProductPriceHistoryDialogProps) {
  const [open, setOpen] = useState(false);
  
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
        return <TrendingDown className={cn(iconClass, "text-green-500")} />;
      default:
        return <Minus className={cn(iconClass, "text-gray-400")} />;
    }
  };

  const getVariationColor = (type: "up" | "down" | "stable") => {
    switch (type) {
      case "up":
        return "text-red-600 bg-red-50 border-red-200";
      case "down":
        return "text-green-600 bg-green-50 border-green-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
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
      concluida: { label: "Concluída", class: "bg-green-50 text-green-700 border-green-200" },
      ativa: { label: "Ativa", class: "bg-blue-50 text-blue-700 border-blue-200" },
      expirada: { label: "Expirada", class: "bg-gray-50 text-gray-600 border-gray-200" }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.expirada;
    
    return (
      <Badge variant="outline" className={cn("text-xs px-1.5 py-0", config.class)}>
        {config.label}
      </Badge>
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden">
        <DialogHeader className="pb-3 border-b border-gray-100/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center border border-blue-100">
              <Package className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold text-gray-900">
                Histórico de Preços
              </DialogTitle>
              <p className="text-xs text-gray-500 mt-0.5 truncate">
                {productName}
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-2 py-3">
          {isLoading ? (
            <div className="text-center py-6">
              <Loader2 className="h-6 w-6 text-blue-500 mx-auto mb-2 animate-spin" />
              <p className="text-gray-500 text-sm font-medium">Carregando histórico...</p>
            </div>
          ) : error ? (
            <div className="text-center py-6">
              <Package className="h-8 w-8 text-red-300 mx-auto mb-2" />
              <p className="text-red-500 text-sm font-medium">Erro ao carregar histórico</p>
              <p className="text-xs text-red-400">Tente novamente mais tarde</p>
            </div>
          ) : sortedHistory.length === 0 ? (
            <div className="text-center py-6">
              <Package className="h-8 w-8 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500 text-sm font-medium">Nenhum histórico encontrado</p>
              <p className="text-xs text-gray-400">Este produto ainda não possui cotações finalizadas</p>
            </div>
          ) : (
            sortedHistory.map((entry, index) => {
              const previousEntry = sortedHistory[index + 1];
              const variation = calculatePriceVariation(entry.price, previousEntry?.price || null);
              
              return (
                <Card key={entry.id} className="hover:shadow-sm hover:bg-gray-50/50 transition-all duration-200 border-gray-200/60">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      {/* Informações principais */}
                      <div className="flex items-center gap-2.5 flex-1 min-w-0">
                        <div className="w-7 h-7 rounded-md bg-green-50 flex items-center justify-center border border-green-100 flex-shrink-0">
                          <Building2 className="h-3.5 w-3.5 text-green-600" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className="font-medium text-gray-900 text-sm truncate">
                              {entry.supplier}
                            </span>
                            <Badge variant="outline" className="text-xs bg-gray-50 text-gray-600 border-gray-200 px-1.5 py-0">
                              {entry.quotationId.substring(0, 6)}...
                            </Badge>
                            {getStatusBadge(entry.status)}
                          </div>
                          
                          <div className="flex items-center gap-1.5 text-xs text-gray-500">
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
                          <div className="flex items-center gap-1 text-base font-semibold text-gray-900">
                            <DollarSign className="h-3.5 w-3.5 text-green-600" />
                            <span>R$ {entry.price.toFixed(2)}</span>
                          </div>
                          {index === 0 && (
                            <Badge className="bg-blue-50 text-blue-700 text-xs mt-0.5 px-1.5 py-0">
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
          <div className="pt-3 border-t border-gray-100/80 bg-gray-50/30 -mx-6 -mb-6 px-6 pb-6 mt-3">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <div className="text-xs text-gray-500 mb-0.5">Menor Preço</div>
                <div className="font-semibold text-green-600 text-sm">
                  R$ {Math.min(...sortedHistory.map(h => h.price)).toFixed(2)}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-0.5">Maior Preço</div>
                <div className="font-semibold text-red-600 text-sm">
                  R$ {Math.max(...sortedHistory.map(h => h.price)).toFixed(2)}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-0.5">Preço Médio</div>
                <div className="font-semibold text-blue-600 text-sm">
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