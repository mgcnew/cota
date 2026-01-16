import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  TrendingDown, Award, Target, 
  Package, Building2, CheckCircle2, AlertCircle, Calculator
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
  const analysisData = useMemo(() => {
    if (!selectedQuoteId) return null;

    const quote = quotes.find(q => q.id === selectedQuoteId);
    if (!quote) return null;

    const order = orders.find(o => o.quoteId === quote.id);
    if (!order) return null;

    // Fornecedores que responderam
    const respondedSuppliers = quote.fornecedores.filter(f => f.status === "respondido");
    if (respondedSuppliers.length === 0) return null;

    // Criar mapa de quantidades reais do pedido
    const orderQuantities: Record<string, number> = {};
    order.itens.forEach(item => {
      orderQuantities[item.packagingId] = item.quantidade;
    });

    // Estrutura: { fornecedorId: { nome, itens: [{ nome, custoUn, qtd, total }], totalGeral } }
    const supplierData: Record<string, {
      id: string;
      nome: string;
      itens: Array<{ nome: string; custoUnitario: number; quantidade: number; total: number }>;
      totalGeral: number;
    }> = {};

    // Inicializar estrutura para cada fornecedor
    respondedSuppliers.forEach(fornecedor => {
      supplierData[fornecedor.supplierId] = {
        id: fornecedor.supplierId,
        nome: fornecedor.supplierName,
        itens: [],
        totalGeral: 0
      };
    });

    // Preencher dados de cada item
    quote.itens.forEach(item => {
      const quantidadePedido = orderQuantities[item.packagingId] || 0;
      if (quantidadePedido === 0) return;

      respondedSuppliers.forEach(fornecedor => {
        const supplierItem = fornecedor.itens.find(si => si.packagingId === item.packagingId);
        if (!supplierItem) return;

        // Calcular custo por unidade
        const custoUnitario = supplierItem.custoPorUnidade && supplierItem.custoPorUnidade > 0
          ? supplierItem.custoPorUnidade
          : (supplierItem.quantidadeUnidadesEstimada && supplierItem.quantidadeUnidadesEstimada > 0
              ? supplierItem.valorTotal! / supplierItem.quantidadeUnidadesEstimada
              : supplierItem.valorTotal || 0);

        const total = custoUnitario * quantidadePedido;

        supplierData[fornecedor.supplierId].itens.push({
          nome: item.packagingName,
          custoUnitario,
          quantidade: quantidadePedido,
          total
        });

        supplierData[fornecedor.supplierId].totalGeral += total;
      });
    });

    // Ordenar fornecedores por total (menor para maior)
    const sortedSuppliers = Object.values(supplierData).sort((a, b) => a.totalGeral - b.totalGeral);

    // Calcular economia em relação ao vencedor
    const vencedor = sortedSuppliers[0];
    const suppliersComEconomia = sortedSuppliers.map(supplier => ({
      ...supplier,
      economia: supplier.totalGeral - vencedor.totalGeral,
      economiaPercent: vencedor.totalGeral > 0 
        ? ((supplier.totalGeral - vencedor.totalGeral) / vencedor.totalGeral) * 100 
        : 0,
      isVencedor: supplier.id === vencedor.id
    }));

    return {
      quote,
      order,
      suppliers: suppliersComEconomia,
      vencedor
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
      {analysisData && (
        <>
          {/* Card do Vencedor */}
          <Card className="border-green-200 dark:border-green-800 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Award className="h-5 w-5 text-green-600" />
                <CardTitle className="text-base">🏆 Fornecedor Vencedor</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <p className="font-bold text-lg text-green-900 dark:text-green-100">
                    {analysisData.vencedor.nome}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {analysisData.vencedor.itens.length} itens cotados
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    R$ {analysisData.vencedor.totalGeral.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                  <Badge className="bg-green-600 text-white mt-1">Melhor Preço</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Comparação por Fornecedor */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="h-4 w-4 text-purple-600" />
                Comparação Detalhada
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {analysisData.suppliers.map((supplier, index) => (
                <div
                  key={supplier.id}
                  className={cn(
                    "rounded-xl border-2 overflow-hidden",
                    supplier.isVencedor
                      ? "border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-950/20"
                      : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50"
                  )}
                >
                  {/* Header do Fornecedor */}
                  <div className={cn(
                    "p-3 sm:p-4",
                    supplier.isVencedor
                      ? "bg-green-100 dark:bg-green-900/30"
                      : "bg-gray-50 dark:bg-gray-800/70"
                  )}>
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                        <div className={cn(
                          "w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center font-bold text-xs sm:text-sm flex-shrink-0",
                          supplier.isVencedor
                            ? "bg-green-600 text-white"
                            : "bg-gray-300 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                        )}>
                          {index + 1}º
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm sm:text-base truncate">{supplier.nome}</p>
                          <p className="text-xs text-muted-foreground">{supplier.itens.length} itens</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={cn(
                          "text-lg sm:text-xl font-bold",
                          supplier.isVencedor ? "text-green-600 dark:text-green-400" : ""
                        )}>
                          R$ {supplier.totalGeral.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                        {!supplier.isVencedor && supplier.economia > 0 && (
                          <Badge variant="destructive" className="mt-1 text-xs">
                            +R$ {supplier.economia.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </Badge>
                        )}
                        {supplier.isVencedor && (
                          <Badge className="bg-green-600 text-white mt-1 text-xs">
                            <Award className="h-3 w-3 mr-1" />
                            Vencedor
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Itens do Fornecedor */}
                  <div className="p-3 sm:p-4 space-y-2">
                    {supplier.itens.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between text-sm py-2 border-b border-gray-100 dark:border-gray-700/50 last:border-0 gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate text-xs sm:text-sm">{item.nome}</p>
                          <p className="text-xs text-muted-foreground">
                            R$ {item.custoUnitario.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/un × {item.quantidade}
                          </p>
                        </div>
                        <p className="font-semibold whitespace-nowrap text-xs sm:text-sm">
                          R$ {item.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Economia */}
                  {!supplier.isVencedor && supplier.economia > 0 && (
                    <div className="px-3 sm:px-4 pb-3 sm:pb-4">
                      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                        <div className="flex items-start sm:items-center justify-between gap-2 flex-col sm:flex-row">
                          <div className="flex items-center gap-2">
                            <TrendingDown className="h-4 w-4 text-red-600 flex-shrink-0" />
                            <span className="text-xs sm:text-sm font-medium text-red-900 dark:text-red-100">
                              Economia ao escolher {analysisData.vencedor.nome}:
                            </span>
                          </div>
                          <div className="text-left sm:text-right">
                            <p className="text-base sm:text-lg font-bold text-red-600 dark:text-red-400">
                              R$ {supplier.economia.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                            <p className="text-xs text-red-600 dark:text-red-400">
                              ({supplier.economiaPercent.toFixed(1)}%)
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Resumo Final */}
          <Card className="border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Package className="h-4 w-4 text-blue-600" />
                📊 Resumo da Economia
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {analysisData.suppliers.filter(s => !s.isVencedor && s.economia > 0).map(supplier => (
                <div key={supplier.id} className="flex items-center justify-between p-3 bg-white dark:bg-gray-800/50 rounded-lg gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">vs {supplier.nome}</p>
                    <p className="text-xs text-muted-foreground">
                      Custaria R$ {supplier.totalGeral.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-base sm:text-lg font-bold text-green-600 whitespace-nowrap">
                      -R$ {supplier.economia.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                    <Badge variant="outline" className="text-xs mt-1">
                      {supplier.economiaPercent.toFixed(1)}%
                    </Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
