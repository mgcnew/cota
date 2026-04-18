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
import { designSystem as ds } from "@/styles/design-system";

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
              ? (supplierItem.valorTotal || 0) / supplierItem.quantidadeUnidadesEstimada
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
    <div className="space-y-6">
      {/* Header */}
      <div className={cn(
        ds.components.card.root,
        "p-6 bg-brand/5 border-brand/10"
      )}>
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-brand/10 border border-brand/20">
            <Calculator className="h-6 w-6 text-brand" />
          </div>
          <div className="flex-1">
            <h3 className={cn(ds.typography.size.lg, ds.typography.weight.bold, ds.colors.text.primary)}>
              Análise de Economia
            </h3>
            <p className={cn(ds.typography.size.sm, ds.colors.text.secondary, "opacity-70")}>
              Compare o vencedor com os concorrentes e visualize a poupança real
            </p>
          </div>
        </div>
      </div>

      {/* Seletor de Cotação */}
      <div className={cn(ds.components.card.root, "p-6")}>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 rounded-xl bg-brand/10 text-brand border border-brand/20">
            <Target className="h-5 w-5" />
          </div>
          <h3 className={cn(ds.typography.size.base, ds.typography.weight.bold, ds.colors.text.primary)}>
            Selecione uma Cotação
          </h3>
        </div>
        
        {completedQuotesWithOrders.length === 0 ? (
          <div className="text-center py-16 bg-muted/20 rounded-3xl border-2 border-dashed border-border flex flex-col items-center justify-center">
            <div className="p-4 rounded-full bg-muted/30 mb-4">
              <AlertCircle className="h-10 w-10 text-muted-foreground/40" />
            </div>
            <p className={cn("text-base font-bold", ds.colors.text.primary)}>Nenhuma cotação concluída</p>
            <p className={cn("text-sm mt-1 max-w-xs mx-auto opacity-60 text-center", ds.colors.text.secondary)}>
              Complete uma cotação e converta em pedido para ver a análise de economia detalhada aqui.
            </p>
          </div>
        ) : (
          <Select value={selectedQuoteId} onValueChange={setSelectedQuoteId}>
            <SelectTrigger className={cn("w-full h-14 rounded-2xl transition-all hover:border-brand/50", ds.components.input.root)}>
              <SelectValue placeholder="Escolha uma cotação para analisar..." />
            </SelectTrigger>
            <SelectContent className="rounded-2xl border-border/50 shadow-2xl">
              {completedQuotesWithOrders.map(quote => (
                <SelectItem key={quote.id} value={quote.id} className="py-4 px-4 rounded-xl focus:bg-brand/5 focus:text-brand cursor-pointer">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center border border-brand/20">
                      <CheckCircle2 className="h-5 w-5 text-brand" />
                    </div>
                    <div>
                      <p className="font-bold text-sm">Cotação #{quote.id.substring(0, 8)}</p>
                      <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest opacity-60">
                        {quote.itens?.length || 0} itens cotados
                      </p>
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Análise de Economia */}
      {analysisData && (
        <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
          {/* Card do Vencedor */}
          <div className={cn(
            "p-8 rounded-3xl shadow-2xl overflow-hidden relative border border-brand/20",
            ds.colors.surface.card
          )}>
            {/* Background Decoration */}
            <div className="absolute right-0 top-0 w-48 h-full bg-brand/10 skew-x-[-25deg] translate-x-24 pointer-events-none" />
            <div className="absolute -left-12 -top-12 w-32 h-32 bg-brand/5 rounded-full blur-3xl pointer-events-none" />

            <div className="flex items-center justify-between flex-wrap gap-6 relative z-10">
              <div className="flex items-center gap-5">
                <div className="p-4 rounded-2xl bg-brand/5 backdrop-blur-md border border-brand/10 shadow-inner">
                  <Award className="h-10 w-10 text-brand animate-bounce-subtle" />
                </div>
                <div>
                  <p className="text-brand text-[10px] font-black uppercase tracking-[0.2em] mb-2 drop-shadow-sm">🏆 Fornecedor Vencedor</p>
                  <h2 className={cn(ds.typography.size["3xl"], "font-black tracking-tighter text-zinc-900 dark:text-white")}>
                    {analysisData.vencedor.nome}
                  </h2>
                  <div className="flex items-center gap-3 mt-2">
                    <Badge className="bg-brand/10 text-brand border-brand/20 text-[10px] font-black uppercase tracking-widest px-2 py-0.5">
                      {analysisData.vencedor.itens.length} Itens Ganhos
                    </Badge>
                    <span className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">Melhor custo-benefício</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mb-1 opacity-70">Valor Total do Pedido</p>
                <p className="text-4xl font-black text-brand italic tracking-tighter">
                  {formatCurrency(analysisData.vencedor.totalGeral)}
                </p>
              </div>
            </div>
          </div>

          {/* Comparação por Fornecedor */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 px-2">
              <div className="p-1.5 rounded-lg bg-brand/10 border border-brand/20">
                <Building2 className="h-4 w-4 text-brand" />
              </div>
              <h3 className={cn(ds.typography.size.lg, ds.typography.weight.bold, ds.colors.text.primary, "tracking-tight")}>
                Comparativo Real de Mercado
              </h3>
            </div>
            
            <div className="grid grid-cols-1 gap-4">
              {analysisData.suppliers.map((supplier, index) => (
                <div
                  key={supplier.id}
                  className={cn(
                    ds.components.card.root,
                    "overflow-hidden transition-all duration-300 hover:shadow-xl",
                    supplier.isVencedor ? "border-brand/40 bg-brand/[0.02] ring-1 ring-brand/10" : "border-border/40"
                  )}
                >
                  {/* Header do Fornecedor */}
                  <div className={cn(
                    "p-5 border-b transition-colors",
                    ds.colors.border.subtle,
                    supplier.isVencedor ? "bg-brand/10" : "bg-muted/30"
                  )}>
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className={cn(
                          "w-12 h-12 rounded-2xl flex items-center justify-center font-black text-base flex-shrink-0 border shadow-sm transition-transform group-hover:scale-105",
                          supplier.isVencedor
                            ? "bg-brand text-white border-brand shadow-brand/20"
                            : "bg-background text-muted-foreground border-border/60"
                        )}>
                          {index + 1}º
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={cn("font-black text-lg tracking-tight truncate", ds.colors.text.primary)}>{supplier.nome}</p>
                          <p className={cn("text-[10px] font-black uppercase tracking-[0.1em] opacity-50 mt-0.5", ds.colors.text.secondary)}>
                            {supplier.itens.length} itens cotados nesta rodada
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={cn(
                          "text-2xl font-black italic tracking-tighter",
                          supplier.isVencedor ? "text-brand" : ds.colors.text.primary
                        )}>
                          {formatCurrency(supplier.totalGeral)}
                        </p>
                        {!supplier.isVencedor && supplier.economia > 0 && (
                          <Badge variant="destructive" className="mt-1 text-[10px] font-black uppercase tracking-widest border-none px-2 h-5">
                            + {formatCurrency(supplier.economia)}
                          </Badge>
                        )}
                        {supplier.isVencedor && (
                          <Badge className="bg-brand text-white mt-1 text-[10px] font-black uppercase tracking-widest px-2 h-5 shadow-sm shadow-brand/20">
                            Vencedor
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Itens do Fornecedor */}
                  <div className="p-5 space-y-3 bg-card/40 backdrop-blur-sm">
                    {supplier.itens.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between py-3 border-b border-border/30 last:border-0 group/item transition-all hover:px-2 hover:bg-brand/[0.02] rounded-lg">
                        <div className="flex-1 min-w-0">
                          <p className={cn("font-bold truncate text-[15px] tracking-tight", ds.colors.text.primary)}>{item.nome}</p>
                          <p className={cn("text-[11px] font-black uppercase tracking-widest opacity-50 mt-0.5", ds.colors.text.secondary)}>
                            {formatCurrency(item.custoUnitario)}/un × {item.quantidade}
                          </p>
                        </div>
                        <p className={cn("font-black whitespace-nowrap text-base italic transition-transform group-hover/item:scale-105", ds.colors.text.primary)}>
                          {formatCurrency(item.total)}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Economia */}
                  {!supplier.isVencedor && supplier.economia > 0 && (
                    <div className="p-5 border-t border-border/30 bg-red-500/[0.02]">
                      <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-5 shadow-sm">
                        <div className="flex items-center justify-between gap-6 flex-wrap">
                          <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-red-500/10 shadow-inner">
                              <TrendingDown className="h-5 w-5 text-red-500" />
                            </div>
                            <div className="space-y-1">
                              <span className={cn("text-[11px] font-black uppercase tracking-widest", ds.colors.text.primary)}>
                                Potencial de Poupança:
                              </span>
                              <p className="text-[10px] font-medium opacity-60">Economia real ao optar pelo vencedor</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-black text-red-500 italic tracking-tighter">
                              - {formatCurrency(supplier.economia)}
                            </p>
                            <Badge className="bg-red-500 text-white border-none mt-1 text-[10px] font-black uppercase tracking-widest px-2">
                              {supplier.economiaPercent.toFixed(1)}% mais caro
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Resumo Final */}
          <div className={cn(
            "rounded-[32px] border-2 border-dashed p-10 relative overflow-hidden",
            ds.colors.border.subtle,
            "bg-brand/[0.02]"
          )}>
            <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
              <Calculator size={120} strokeWidth={1} className="text-brand" />
            </div>

            <div className="flex items-center gap-4 mb-10 relative z-10">
              <div className="p-3 rounded-2xl bg-brand/10 text-brand border border-brand/20 shadow-sm">
                <Package className="h-7 w-7" />
              </div>
              <div>
                <h3 className={cn(ds.typography.size.xl, "font-black", ds.colors.text.primary, "tracking-tighter")}>
                  Resumo Estratégico de Economia
                </h3>
                <p className={cn("text-xs font-bold uppercase tracking-widest opacity-50 mt-1", ds.colors.text.secondary)}>Análise comparativa direta de performance</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
              {analysisData.suppliers.filter(s => !s.isVencedor && s.economia > 0).map(supplier => (
                <div key={supplier.id} className={cn(
                  "p-6 rounded-[24px] border transition-all duration-300 group",
                  ds.colors.surface.card,
                  ds.colors.border.subtle,
                  "hover:border-brand/40 hover:shadow-2xl hover:-translate-y-1"
                )}>
                  <div className="flex justify-between items-start mb-6">
                    <div className="space-y-1">
                      <p className={cn("text-[10px] font-black uppercase tracking-[0.2em] opacity-40", ds.colors.text.secondary)}>vs Concorrente</p>
                      <p className={cn("font-black text-base truncate max-w-[120px]", ds.colors.text.primary)}>{supplier.nome}</p>
                    </div>
                    <Badge variant="outline" className="text-[10px] font-black border-brand/40 text-brand bg-brand/5 px-2 py-0.5 h-6">
                      {supplier.economiaPercent.toFixed(1)}% OFF
                    </Badge>
                  </div>
                  <div className="space-y-1 relative">
                    <p className={cn("text-3xl font-black text-emerald-600 dark:text-brand italic tracking-tighter group-hover:scale-110 transition-transform origin-left")}>
                      -{formatCurrency(supplier.economia)}
                    </p>
                    <div className="flex items-center gap-1.5 mt-2">
                      <div className="w-1 h-1 rounded-full bg-brand animate-pulse" />
                      <p className={cn("text-[10px] font-black uppercase tracking-widest opacity-40", ds.colors.text.muted)}>
                        Poupança Efetiva
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
