import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  TrendingDown, DollarSign, Award, Target, 
  Package, Building2, CheckCircle2, AlertCircle,
  Percent, Calculator
} from "lucide-react";
import { usePackagingQuotes } from "@/hooks/usePackagingQuotes";
import { usePackagingOrders } from "@/hooks/usePackagingOrders";
import { cn } from "@/lib/utils";

export function PackagingEconomyTab() {
  const { quotes } = usePackagingQuotes();
  const { orders } = usePackagingOrders();
  const [selectedQuoteId, setSelectedQuoteId] = useState<string>("");

  // Filtrar cotações concluídas que foram convertidas em pedidos
  const completedQuotesWithOrders = useMemo(() => {
    return quotes.filter(quote => {
      const hasOrder = orders.some(order => order.quoteId === quote.id);
      return quote.status === "concluida" && hasOrder;
    });
  }, [quotes, orders]);

  // Dados da cotação selecionada
  const selectedQuoteData = useMemo(() => {
    if (!selectedQuoteId) return null;

    const quote = quotes.find(q => q.id === selectedQuoteId);
    if (!quote) return null;

    const order = orders.find(o => o.quoteId === quote.id);
    if (!order) return null;

    // Fornecedores que responderam
    const respondedSuppliers = quote.fornecedores.filter(f => f.status === "respondido");
    if (respondedSuppliers.length === 0) return null;

    // Calcular melhor e pior preço POR ITEM (baseado no custo por unidade)
    const itemAnalysis: Record<string, {
      packagingName: string;
      best: { supplierId: string; supplierName: string; costPerUnit: number; valorTotal: number };
      worst: { supplierId: string; supplierName: string; costPerUnit: number; valorTotal: number };
      second?: { supplierId: string; supplierName: string; costPerUnit: number; valorTotal: number };
      allPrices: Array<{ supplierId: string; supplierName: string; costPerUnit: number; valorTotal: number }>;
    }> = {};

    quote.itens.forEach(item => {
      const prices: Array<{ supplierId: string; supplierName: string; costPerUnit: number; valorTotal: number }> = [];

      respondedSuppliers.forEach(fornecedor => {
        const supplierItem = fornecedor.itens.find(si => si.packagingId === item.packagingId);
        
        if (!supplierItem || !supplierItem.valorTotal || supplierItem.valorTotal <= 0) return;
        
        // Calcular custo por unidade
        const costPerUnit = supplierItem.custoPorUnidade && supplierItem.custoPorUnidade > 0
          ? supplierItem.custoPorUnidade
          : (supplierItem.quantidadeUnidadesEstimada && supplierItem.quantidadeUnidadesEstimada > 0
              ? supplierItem.valorTotal / supplierItem.quantidadeUnidadesEstimada
              : supplierItem.valorTotal);
        
        if (costPerUnit > 0) {
          prices.push({
            supplierId: fornecedor.supplierId,
            supplierName: fornecedor.supplierName,
            costPerUnit,
            valorTotal: supplierItem.valorTotal
          });
        }
      });

      // Ordenar por custo por unidade (menor para maior)
      prices.sort((a, b) => a.costPerUnit - b.costPerUnit);

      if (prices.length > 0) {
        itemAnalysis[item.packagingId] = {
          packagingName: item.packagingName,
          best: prices[0],
          worst: prices[prices.length - 1],
          second: prices.length > 1 ? prices[1] : undefined,
          allPrices: prices
        };
      }
    });

    // Calcular totais por fornecedor (soma dos valores totais dos itens)
    const supplierTotals = new Map<string, { name: string; total: number; items: number }>();
    
    Object.values(itemAnalysis).forEach(analysis => {
      const best = analysis.best;
      const current = supplierTotals.get(best.supplierId) || { 
        name: best.supplierName, 
        total: 0, 
        items: 0 
      };
      current.total += best.valorTotal;
      current.items += 1;
      supplierTotals.set(best.supplierId, current);
    });

    // Ordenar fornecedores por total (menor para maior)
    const sortedSuppliers = Array.from(supplierTotals.entries())
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => a.total - b.total);

    if (sortedSuppliers.length === 0) return null;

    const winner = sortedSuppliers[0];
    const secondPlace = sortedSuppliers[1];
    const worstPrice = sortedSuppliers[sortedSuppliers.length - 1];

    // Calcular economia: soma das economias de cada item
    let economyVsSecond = 0;
    let economyVsWorst = 0;

    Object.values(itemAnalysis).forEach(analysis => {
      // Economia vs segundo melhor
      if (analysis.second) {
        economyVsSecond += analysis.second.valorTotal - analysis.best.valorTotal;
      }
      // Economia vs pior
      economyVsWorst += analysis.worst.valorTotal - analysis.best.valorTotal;
    });

    return {
      quote,
      order,
      winner,
      secondPlace,
      worstPrice,
      allSuppliers: sortedSuppliers,
      itemAnalysis,
      economyVsSecond,
      economyVsWorst,
      economyPercentVsSecond: secondPlace ? (economyVsSecond / secondPlace.total) * 100 : 0,
      economyPercentVsWorst: worstPrice ? (economyVsWorst / worstPrice.total) * 100 : 0,
    };
  }, [selectedQuoteId, quotes, orders]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card className="border-purple-200 dark:border-purple-800 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950/20 dark:to-indigo-950/20">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center">
              <Calculator className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">Análise de Economia</CardTitle>
              <p className="text-sm text-muted-foreground">Compare o vencedor com os concorrentes</p>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Seletor de Cotação */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="h-4 w-4 text-purple-600" />
            Selecione uma Cotação
          </CardTitle>
        </CardHeader>
        <CardContent>
          {completedQuotesWithOrders.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-sm text-muted-foreground">Nenhuma cotação concluída com pedido encontrada</p>
              <p className="text-xs text-muted-foreground mt-1">
                Complete uma cotação e converta em pedido para ver a análise de economia
              </p>
            </div>
          ) : (
            <Select value={selectedQuoteId} onValueChange={setSelectedQuoteId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Escolha uma cotação para analisar..." />
              </SelectTrigger>
              <SelectContent>
                {completedQuotesWithOrders.map(quote => (
                  <SelectItem key={quote.id} value={quote.id}>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span>Cotação #{quote.id.substring(0, 8)}</span>
                      <Badge variant="secondary" className="text-xs">
                        {quote.itens?.length || 0} itens
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </CardContent>
      </Card>

      {/* Análise de Economia */}
      {selectedQuoteData && (
        <>
          {/* Resumo Geral */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-green-200 dark:border-green-800 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-green-600" />
                    <CardTitle className="text-sm">Vencedor</CardTitle>
                  </div>
                  <Badge className="bg-green-600 text-white">1º</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="font-semibold text-green-900 dark:text-green-100 truncate">
                  {selectedQuoteData.winner.name}
                </p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-2">
                  R$ {selectedQuoteData.winner.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {selectedQuoteData.winner.items} itens cotados
                </p>
              </CardContent>
            </Card>

            <Card className="border-orange-200 dark:border-orange-800 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingDown className="h-5 w-5 text-orange-600" />
                    <CardTitle className="text-sm">Economia vs 2º</CardTitle>
                  </div>
                  {selectedQuoteData.secondPlace && (
                    <Badge variant="secondary">2º</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {selectedQuoteData.secondPlace ? (
                  <>
                    <p className="font-semibold text-orange-900 dark:text-orange-100 truncate">
                      {selectedQuoteData.secondPlace.name}
                    </p>
                    <p className="text-2xl font-bold text-orange-600 dark:text-orange-400 mt-2">
                      R$ {selectedQuoteData.economyVsSecond.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300">
                        {selectedQuoteData.economyPercentVsSecond.toFixed(1)}%
                      </Badge>
                      <span className="text-xs text-muted-foreground">de economia</span>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">Apenas 1 fornecedor cotou</p>
                )}
              </CardContent>
            </Card>

            <Card className="border-red-200 dark:border-red-800 bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950/20 dark:to-rose-950/20">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Percent className="h-5 w-5 text-red-600" />
                    <CardTitle className="text-sm">Economia Total</CardTitle>
                  </div>
                  {selectedQuoteData.worstPrice && (
                    <Badge variant="destructive">Pior</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {selectedQuoteData.worstPrice && selectedQuoteData.allSuppliers.length > 1 ? (
                  <>
                    <p className="font-semibold text-red-900 dark:text-red-100 truncate">
                      vs {selectedQuoteData.worstPrice.name}
                    </p>
                    <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-2">
                      R$ {selectedQuoteData.economyVsWorst.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300">
                        {selectedQuoteData.economyPercentVsWorst.toFixed(1)}%
                      </Badge>
                      <span className="text-xs text-muted-foreground">de economia</span>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">Apenas 1 fornecedor cotou</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Comparação Detalhada */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="h-4 w-4 text-purple-600" />
                Ranking de Fornecedores
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {selectedQuoteData.allSuppliers.map((supplier, index) => {
                  const isWinner = index === 0;
                  const diffFromWinner = supplier.total - selectedQuoteData.winner.total;
                  const percentDiff = selectedQuoteData.winner.total > 0 
                    ? (diffFromWinner / selectedQuoteData.winner.total) * 100 
                    : 0;

                  return (
                    <div
                      key={supplier.id}
                      className={cn(
                        "flex items-center justify-between p-4 rounded-xl border-2 transition-all",
                        isWinner 
                          ? "border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-950/20" 
                          : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50"
                      )}
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm",
                          isWinner 
                            ? "bg-green-600 text-white" 
                            : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                        )}>
                          {index + 1}º
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold truncate">{supplier.name}</p>
                          <p className="text-xs text-muted-foreground">{supplier.items} itens cotados</p>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className={cn(
                          "text-lg font-bold",
                          isWinner ? "text-green-600 dark:text-green-400" : ""
                        )}>
                          R$ {supplier.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                        {!isWinner && diffFromWinner > 0 && (
                          <div className="flex items-center gap-1 justify-end mt-1">
                            <Badge variant="secondary" className="text-xs">
                              +R$ {diffFromWinner.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              +{percentDiff.toFixed(1)}%
                            </Badge>
                          </div>
                        )}
                        {isWinner && (
                          <Badge className="bg-green-600 text-white mt-1">
                            <Award className="h-3 w-3 mr-1" />
                            Melhor Preço
                          </Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Insights */}
          <Card className="border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-blue-600" />
                Insights de Economia
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {selectedQuoteData.secondPlace && (
                <div className="flex items-start gap-3 p-3 bg-white dark:bg-gray-800/50 rounded-lg">
                  <CheckCircle2 className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Economia Inteligente</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Ao escolher {selectedQuoteData.winner.name} em vez do segundo colocado (
                      {selectedQuoteData.secondPlace.name}), você economizou{" "}
                      <span className="font-semibold text-orange-600">
                        R$ {selectedQuoteData.economyVsSecond.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                      {" "}({selectedQuoteData.economyPercentVsSecond.toFixed(1)}%).
                    </p>
                  </div>
                </div>
              )}

              {selectedQuoteData.worstPrice && selectedQuoteData.allSuppliers.length > 2 && (
                <div className="flex items-start gap-3 p-3 bg-white dark:bg-gray-800/50 rounded-lg">
                  <TrendingDown className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Máxima Economia</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Comparado com a pior oferta ({selectedQuoteData.worstPrice.name}), você economizou{" "}
                      <span className="font-semibold text-red-600">
                        R$ {selectedQuoteData.economyVsWorst.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                      {" "}({selectedQuoteData.economyPercentVsWorst.toFixed(1)}%).
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3 p-3 bg-white dark:bg-gray-800/50 rounded-lg">
                <Package className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Competitividade</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Esta cotação teve {selectedQuoteData.allSuppliers.length} fornecedor(es) participante(s), 
                    garantindo preços competitivos através da concorrência.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Análise Detalhada por Item */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Package className="h-4 w-4 text-indigo-600" />
                Análise Detalhada por Item
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(selectedQuoteData.itemAnalysis).map(([packagingId, analysis]) => (
                  <div key={packagingId} className="border rounded-xl p-4 bg-gray-50 dark:bg-gray-800/30">
                    <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                      <Package className="h-4 w-4 text-indigo-600" />
                      {analysis.packagingName}
                    </h4>
                    
                    <div className="space-y-2">
                      {analysis.allPrices.map((price, index) => {
                        const isBest = index === 0;
                        const isWorst = index === analysis.allPrices.length - 1;
                        const diffFromBest = price.valorTotal - analysis.best.valorTotal;
                        const percentDiff = analysis.best.valorTotal > 0 
                          ? (diffFromBest / analysis.best.valorTotal) * 100 
                          : 0;

                        return (
                          <div
                            key={price.supplierId}
                            className={cn(
                              "flex items-center justify-between p-3 rounded-lg border",
                              isBest 
                                ? "border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-950/20" 
                                : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50"
                            )}
                          >
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <div className={cn(
                                "w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold",
                                isBest 
                                  ? "bg-green-600 text-white" 
                                  : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                              )}>
                                {index + 1}
                              </div>
                              <span className="text-sm font-medium truncate">{price.supplierName}</span>
                            </div>

                            <div className="text-right">
                              <p className={cn(
                                "text-sm font-bold",
                                isBest ? "text-green-600 dark:text-green-400" : ""
                              )}>
                                R$ {price.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                R$ {price.costPerUnit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/un
                              </p>
                              {!isBest && diffFromBest > 0 && (
                                <Badge variant="outline" className="text-[10px] mt-1">
                                  +{percentDiff.toFixed(1)}%
                                </Badge>
                              )}
                              {isBest && (
                                <Badge className="bg-green-600 text-white text-[10px] mt-1">
                                  Melhor
                                </Badge>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Economia deste item */}
                    {analysis.allPrices.length > 1 && (
                      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Economia vs pior preço:</span>
                          <span className="font-semibold text-green-600">
                            R$ {(analysis.worst.valorTotal - analysis.best.valorTotal).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        {analysis.second && (
                          <div className="flex items-center justify-between text-xs mt-1">
                            <span className="text-muted-foreground">Economia vs 2º lugar:</span>
                            <span className="font-semibold text-orange-600">
                              R$ {(analysis.second.valorTotal - analysis.best.valorTotal).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
