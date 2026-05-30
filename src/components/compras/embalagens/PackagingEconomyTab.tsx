import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  TrendingDown, Award, Target,
  Package, Building2, CheckCircle2, AlertCircle, Calculator
} from "lucide-react";
import { usePackagingQuotes } from "@/hooks/usePackagingQuotes";
import { usePackagingOrders } from "@/hooks/usePackagingOrders";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/utils/formatters";

export function PackagingEconomyTab() {
  const { quotes } = usePackagingQuotes();
  const { orders } = usePackagingOrders();
  const [selectedQuoteId, setSelectedQuoteId] = useState<string>("");

  const completedQuotesWithOrders = useMemo(() => {
    return quotes.filter(quote => {
      const hasOrder = orders.some(order => order.quoteId === quote.id);
      return quote.status === "concluida" && hasOrder;
    });
  }, [quotes, orders]);

  const analysisData = useMemo(() => {
    if (!selectedQuoteId) return null;

    const quote = quotes.find(q => q.id === selectedQuoteId);
    if (!quote) return null;

    const order = orders.find(o => o.quoteId === quote.id);
    if (!order) return null;

    const respondedSuppliers = quote.fornecedores.filter(f => f.status === "respondido");
    if (respondedSuppliers.length === 0) return null;

    const orderQuantities: Record<string, number> = {};
    order.itens.forEach(item => {
      orderQuantities[item.packagingId] = item.quantidade;
    });

    const supplierData: Record<string, {
      id: string;
      nome: string;
      itens: Array<{ nome: string; custoUnitario: number; quantidade: number; total: number }>;
      totalGeral: number;
    }> = {};

    respondedSuppliers.forEach(fornecedor => {
      supplierData[fornecedor.supplierId] = {
        id: fornecedor.supplierId,
        nome: fornecedor.supplierName,
        itens: [],
        totalGeral: 0,
      };
    });

    quote.itens.forEach(item => {
      const quantidadePedido = orderQuantities[item.packagingId] || 0;
      if (quantidadePedido === 0) return;

      respondedSuppliers.forEach(fornecedor => {
        const supplierItem = fornecedor.itens.find(si => si.packagingId === item.packagingId);
        if (!supplierItem) return;

        const custoUnitario = supplierItem.custoPorUnidade && supplierItem.custoPorUnidade > 0
          ? supplierItem.custoPorUnidade
          : (supplierItem.quantidadeUnidadesEstimada && supplierItem.quantidadeUnidadesEstimada > 0
              ? (supplierItem.valorTotal || 0) / supplierItem.quantidadeUnidadesEstimada
              : supplierItem.valorTotal || 0);

        const total = custoUnitario * quantidadePedido;

        supplierData[fornecedor.supplierId].itens.push({
          nome: item.packagingName,
          custoUnitario,
          quantidade: quantidadePedido,
          total,
        });

        supplierData[fornecedor.supplierId].totalGeral += total;
      });
    });

    const sortedSuppliers = Object.values(supplierData).sort((a, b) => a.totalGeral - b.totalGeral);
    const vencedor = sortedSuppliers[0];

    const suppliersComEconomia = sortedSuppliers.map(supplier => ({
      ...supplier,
      economia: supplier.totalGeral - vencedor.totalGeral,
      economiaPercent: vencedor.totalGeral > 0
        ? ((supplier.totalGeral - vencedor.totalGeral) / vencedor.totalGeral) * 100
        : 0,
      isVencedor: supplier.id === vencedor.id,
    }));

    const economiaTotal = suppliersComEconomia.reduce((sum, s) => sum + s.economia, 0);

    return { quote, order, suppliers: suppliersComEconomia, vencedor, economiaTotal };
  }, [selectedQuoteId, quotes, orders]);

  // ── Empty state ─────────────────────────────────────────────────────────────
  if (completedQuotesWithOrders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center px-6">
        <div className="w-14 h-14 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
          <Calculator className="h-7 w-7 text-muted-foreground/40" />
        </div>
        <p className="font-semibold text-foreground">Nenhuma cotação concluída</p>
        <p className="text-sm text-muted-foreground mt-1 max-w-xs">
          Complete uma cotação e converta em pedido para ver a análise de economia aqui.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Seletor */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-brand/10 flex-shrink-0">
          <Target className="h-4 w-4 text-brand" />
        </div>
        <Select value={selectedQuoteId} onValueChange={setSelectedQuoteId}>
          <SelectTrigger className="flex-1 h-10 bg-background border-border">
            <SelectValue placeholder="Selecione uma cotação para analisar…" />
          </SelectTrigger>
          <SelectContent>
            {completedQuotesWithOrders.map(quote => (
              <SelectItem key={quote.id} value={quote.id}>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
                  <span className="font-medium">Cotação #{quote.id.substring(0, 8)}</span>
                  <span className="text-muted-foreground text-xs">· {quote.itens?.length || 0} itens</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Análise */}
      {analysisData && (
        <div className="space-y-4 animate-in fade-in duration-300">

          {/* Card vencedor */}
          <div className="rounded-xl border border-brand/30 bg-brand/5 p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-lg bg-brand flex items-center justify-center flex-shrink-0">
                <Award className="h-5 w-5 text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-brand uppercase tracking-widest">Fornecedor Vencedor</p>
                <p className="font-bold text-foreground text-base truncate">{analysisData.vencedor.nome}</p>
                <p className="text-xs text-muted-foreground">{analysisData.vencedor.itens.length} itens · melhor custo-benefício</p>
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">Total do Pedido</p>
              <p className="text-xl font-extrabold text-brand tabular-nums">{formatCurrency(analysisData.vencedor.totalGeral)}</p>
            </div>
          </div>

          {/* Cards por fornecedor */}
          <div className="space-y-3">
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5" />
              Comparativo por Fornecedor
            </p>

            {analysisData.suppliers.map((supplier, index) => (
              <div
                key={supplier.id}
                className={cn(
                  "rounded-xl border overflow-hidden",
                  supplier.isVencedor
                    ? "border-brand/30 bg-card"
                    : "border-border dark:border-white/5 bg-card"
                )}
              >
                {/* Header do fornecedor */}
                <div className={cn(
                  "flex items-center justify-between gap-3 px-4 py-3 border-b border-border dark:border-white/5",
                  supplier.isVencedor ? "bg-brand/5" : "bg-muted/30"
                )}>
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={cn(
                      "w-7 h-7 rounded-md flex items-center justify-center text-xs font-bold flex-shrink-0",
                      supplier.isVencedor
                        ? "bg-brand text-white"
                        : "bg-muted text-muted-foreground"
                    )}>
                      {index + 1}
                    </span>
                    <p className="font-semibold text-sm text-foreground truncate">{supplier.nome}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {supplier.isVencedor && (
                      <Badge className="bg-brand/10 text-brand border-brand/20 text-[10px] font-bold">
                        Vencedor
                      </Badge>
                    )}
                    {!supplier.isVencedor && supplier.economia > 0 && (
                      <Badge className="bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20 text-[10px] font-bold">
                        +{supplier.economiaPercent.toFixed(1)}% mais caro
                      </Badge>
                    )}
                    <p className={cn(
                      "font-extrabold text-sm tabular-nums",
                      supplier.isVencedor ? "text-brand" : "text-foreground"
                    )}>
                      {formatCurrency(supplier.totalGeral)}
                    </p>
                  </div>
                </div>

                {/* Linhas de itens */}
                <div className="divide-y divide-border dark:divide-white/5">
                  {supplier.itens.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between px-4 py-2.5 hover:bg-muted/30 transition-colors">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm text-foreground truncate">{item.nome}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {formatCurrency(item.custoUnitario)}/un × {item.quantidade}
                        </p>
                      </div>
                      <p className="font-bold text-sm text-foreground tabular-nums flex-shrink-0 ml-4">
                        {formatCurrency(item.total)}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Economia vs vencedor */}
                {!supplier.isVencedor && supplier.economia > 0 && (
                  <div className="flex items-center justify-between px-4 py-3 border-t border-border dark:border-white/5 bg-muted/20">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <TrendingDown className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      <span className="text-xs font-medium">Economia ao escolher o vencedor</span>
                    </div>
                    <p className="font-bold text-sm text-emerald-600 dark:text-emerald-400 tabular-nums">
                      {formatCurrency(supplier.economia)}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Totalizador de economia */}
          {analysisData.economiaTotal > 0 && (
            <div className="rounded-xl border border-emerald-200 dark:border-emerald-800/40 bg-emerald-50 dark:bg-emerald-950/20 p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                  <Package className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-foreground">Economia total identificada</p>
                  <p className="text-xs text-muted-foreground">Diferença acumulada entre vencedor e demais</p>
                </div>
              </div>
              <p className="font-extrabold text-lg text-emerald-600 dark:text-emerald-400 tabular-nums flex-shrink-0">
                {formatCurrency(analysisData.economiaTotal)}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Placeholder quando nenhuma cotação selecionada */}
      {!analysisData && selectedQuoteId && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <AlertCircle className="h-8 w-8 text-muted-foreground/40 mb-3" />
          <p className="text-sm font-medium text-foreground">Não foi possível carregar os dados</p>
          <p className="text-xs text-muted-foreground mt-1">Verifique se a cotação possui fornecedores que responderam.</p>
        </div>
      )}

      {!selectedQuoteId && completedQuotesWithOrders.length > 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Calculator className="h-8 w-8 text-muted-foreground/30 mb-3" />
          <p className="text-sm font-medium text-foreground">Selecione uma cotação</p>
          <p className="text-xs text-muted-foreground mt-1">Escolha uma cotação concluída para ver a análise comparativa.</p>
        </div>
      )}
    </div>
  );
}
