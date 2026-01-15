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

    // Calcular totais por fornecedor baseado no CUSTO POR UNIDADE (não no valor do pacote)
    // Isso garante comparação justa independente da quantidade por pacote
    const supplierTotals = new Map<string, { name: string; total: number; items: number }>();
    
    // Para cada fornecedor, somar o custo real baseado no melhor preço por unidade de cada item
    respondedSuppliers.forEach(fornecedor => {
      let totalCost = 0;
      let itemCount = 0;

      quote.itens.forEach(item => {
        const analysis = itemAnalysis[item.packagingId];
        if (!analysis) return;

        // Encontrar o preço deste fornecedor para este item
        const supplierPrice = analysis.allPrices.find(p => p.supplierId === fornecedor.supplierId);
        if (!supplierPrice) return;

        // Usar a quantidade necessária (se disponível) ou 1 como padrão
        const quantidadeNecessaria = item.quantidadeNecessaria || 1;
        
        // Calcular custo real: custo por unidade × quantidade necessária
        totalCost += supplierPrice.costPerUnit * quantidadeNecessaria;
        itemCount += 1;
      });

      if (itemCount > 0) {
        supplierTotals.set(fornecedor.supplierId, {
          name: fornecedor.supplierName,
          total: totalCost,
          items: itemCount
        });
      }
    });

    // Ordenar fornecedores por total (menor para maior)
    const sortedSuppliers = Array.from(supplierTotals.entries())
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => a.total - b.total);

    if (sortedSuppliers.length === 0) return null;

    const winner = sortedSuppliers[0];
    const secondPlace = sortedSuppliers[1];
    const worstPrice = sortedSuppliers[sortedSuppliers.length - 1];

    // Calcular economia: soma das economias de cada item baseado no custo por unidade
    let economyVsSecond = 0;
    let economyVsWorst = 0;

    Object.entries(itemAnalysis).forEach(([packagingId, analysis]) => {
      // Encontrar a quantidade necessária para este item
      const item = quote.itens.find(i => i.packagingId === packagingId);
      const quantidadeNecessaria = item?.quantidadeNecessaria || 1;

      // Economia vs segundo melhor (baseado no custo por unidade)
      if (analysis.second) {
        const diffPerUnit = analysis.second.costPerUnit - analysis.best.costPerUnit;
        economyVsSecond += diffPerUnit * quantidadeNecessaria;
      }
      
      // Economia vs pior (baseado no custo por unidade)
      const diffPerUnit = analysis.worst.costPerUnit - analysis.best.costPerUnit;
      economyVsWorst += diffPerUnit * quantidadeNecessaria;
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Card do Vencedor */}
            <Card className="border-green-200 dark:border-green-800 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-green-600" />
                    <CardTitle className="text-sm">🏆 Fornecedor Vencedor</CardTitle>
                  </div>
                  <Badge className="bg-green-600 text-white">Melhor Escolha</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="font-semibold text-green-900 dark:text-green-100 text-lg truncate">
                  {selectedQuoteData.winner.name}
                </p>
                <div className="mt-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Custo Total:</span>
                    <span className="text-xl font-bold text-green-600 dark:text-green-400">
                      R$ {selectedQuoteData.winner.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Itens cotados:</span>
                    <span className="text-sm font-medium">{selectedQuoteData.winner.items} itens</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Card de Economia Total */}
            <Card className="border-purple-200 dark:border-purple-800 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950/20 dark:to-indigo-950/20">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <TrendingDown className="h-5 w-5 text-purple-600" />
                  <CardTitle className="text-sm">💰 Economia Total Obtida</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground mb-3">
                  Ao escolher {selectedQuoteData.winner.name}, você economizou:
                </p>
                
                {selectedQuoteData.secondPlace && (
                  <div className="mb-3 p-3 bg-white dark:bg-gray-800/50 rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-orange-700 dark:text-orange-400">
                        vs {selectedQuoteData.secondPlace.name} (2º lugar)
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                        R$ {selectedQuoteData.economyVsSecond.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                      <Badge className="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300">
                        {selectedQuoteData.economyPercentVsSecond.toFixed(1)}%
                      </Badge>
                    </div>
                  </div>
                )}

                {selectedQuoteData.worstPrice && selectedQuoteData.allSuppliers.length > 1 && (
                  <div className="p-3 bg-white dark:bg-gray-800/50 rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-red-700 dark:text-red-400">
                        vs {selectedQuoteData.worstPrice.name} (pior preço)
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-red-600 dark:text-red-400">
                        R$ {selectedQuoteData.economyVsWorst.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                      <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300">
                        {selectedQuoteData.economyPercentVsWorst.toFixed(1)}%
                      </Badge>
                    </div>
                  </div>
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
                        <p className="text-xs text-muted-foreground">
                          Custo total (baseado em custo/unidade)
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
                            Melhor Custo/Unidade
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
                📊 Resumo da Análise
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-white dark:bg-gray-800/50 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">✅ Melhor Escolha</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    <span className="font-semibold text-green-600">{selectedQuoteData.winner.name}</span> ofereceu 
                    o melhor custo por unidade na maioria dos itens, resultando no menor custo total de{" "}
                    <span className="font-semibold">
                      R$ {selectedQuoteData.winner.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>.
                  </p>
                </div>
              </div>

              {selectedQuoteData.secondPlace && (
                <div className="flex items-start gap-3 p-3 bg-white dark:bg-gray-800/50 rounded-lg">
                  <TrendingDown className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">💡 Comparação com 2º Lugar</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Se você tivesse escolhido <span className="font-semibold">{selectedQuoteData.secondPlace.name}</span>, 
                      gastaria <span className="font-semibold">
                        R$ {selectedQuoteData.secondPlace.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>. Ao escolher {selectedQuoteData.winner.name}, você economizou{" "}
                      <span className="font-semibold text-orange-600">
                        R$ {selectedQuoteData.economyVsSecond.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span> ({selectedQuoteData.economyPercentVsSecond.toFixed(1)}%).
                    </p>
                  </div>
                </div>
              )}

              {selectedQuoteData.worstPrice && selectedQuoteData.allSuppliers.length > 2 && (
                <div className="flex items-start gap-3 p-3 bg-white dark:bg-gray-800/50 rounded-lg">
                  <Percent className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">🎯 Economia Máxima</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      A pior oferta foi de <span className="font-semibold">{selectedQuoteData.worstPrice.name}</span> com 
                      custo total de <span className="font-semibold">
                        R$ {selectedQuoteData.worstPrice.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>. Comparado a ela, você economizou{" "}
                      <span className="font-semibold text-red-600">
                        R$ {selectedQuoteData.economyVsWorst.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span> ({selectedQuoteData.economyPercentVsWorst.toFixed(1)}%).
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3 p-3 bg-white dark:bg-gray-800/50 rounded-lg">
                <Package className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">📦 Metodologia</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Os valores são calculados com base no <span className="font-semibold">custo por unidade</span> de 
                    cada item multiplicado pela quantidade necessária, garantindo comparação justa independente 
                    da quantidade por pacote oferecida por cada fornecedor.
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
                          <span className="text-muted-foreground">Economia/unidade vs pior:</span>
                          <span className="font-semibold text-green-600">
                            R$ {(analysis.worst.costPerUnit - analysis.best.costPerUnit).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/un
                          </span>
                        </div>
                        {analysis.second && (
                          <div className="flex items-center justify-between text-xs mt-1">
                            <span className="text-muted-foreground">Economia/unidade vs 2º:</span>
                            <span className="font-semibold text-orange-600">
                              R$ {(analysis.second.costPerUnit - analysis.best.costPerUnit).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/un
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
