import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ResponsiveModal } from "@/components/responsive/ResponsiveModal";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  Package, Building2, DollarSign, Calendar, ClipboardList,
  TrendingDown, Award, X, CheckCircle2, Clock, Sparkles, Info
} from "lucide-react";
import { cn } from "@/lib/utils";
import { designSystem as ds } from "@/styles/design-system";
import { formatCurrency } from "@/utils/formatters";
import type { Quote } from "@/hooks/useCotacoes";

interface ResumoCotacaoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quote: Quote;
}

export default function ResumoCotacaoDialog({ open, onOpenChange, quote }: ResumoCotacaoDialogProps) {
  const products = useMemo(() => {
    const items = (quote as any)?._raw?.quote_items || [];
    return [...items].sort((a, b) => (a.product_name || '').localeCompare(b.product_name || ''));
  }, [quote]);
  const fornecedores = quote.fornecedoresParticipantes || [];
  const fornecedoresRespondidos = fornecedores.filter(f => f.status === "respondido").length;

  const safeStr = (val: any): string => typeof val === 'string' ? val : String(val || '');

  const getSupplierProductValue = (supplierId: string, productId: string): number => {
    const raw = quote as any;
    const items = raw._supplierItems || raw._raw?.quote_supplier_items || [];
    return items.find((i: any) => i?.supplier_id === supplierId && i?.product_id === productId)?.valor_oferecido || 0;
  };

  const calcularTotalFornecedor = (supplierId: string): number => {
    return products.reduce((sum: number, p: any) => {
      const precoUn = getSupplierProductValue(supplierId, p.product_id);
      const qtd = Number(p.quantidade) || 1;
      return sum + (precoUn * qtd);
    }, 0);
  };

  const getBestPrice = (productId: string) => {
    let best = { price: 0, supplier: '-' };
    fornecedores.forEach(f => {
      const val = getSupplierProductValue(f.id, productId);
      if (val > 0 && (best.price === 0 || val < best.price)) {
        best = { price: val, supplier: safeStr(f.nome) };
      }
    });
    return best;
  };

  const getAllPricesForProduct = (productId: string): { supplier: string; price: number }[] => {
    return fornecedores
      .map(f => ({
        supplier: safeStr(f.nome),
        price: getSupplierProductValue(f.id, productId),
      }))
      .filter(item => item.price > 0)
      .sort((a, b) => a.price - b.price);
  };

  // Mapear para cada produto qual fornecedor ganhou (menor preço)
  const produtosComVencedor = useMemo(() => {
    return products.map((p: any) => {
      const best = getBestPrice(p.product_id);
      const qtd = Number(p.quantidade) || 1;
      // Encontrar o ID do fornecedor vencedor
      let winnerId: string | null = null;
      fornecedores.forEach(f => {
        const val = getSupplierProductValue(f.id, p.product_id);
        if (val > 0 && val === best.price) {
          winnerId = f.id;
        }
      });
      return {
        productId: p.product_id,
        productName: p.product_name,
        quantidade: qtd,
        unidade: p.unidade,
        bestPrice: best.price,
        bestSupplier: best.supplier,
        winnerId,
        totalItem: best.price * qtd,
      };
    });
  }, [products, fornecedores]);

  const totalMelhorPreco = produtosComVencedor.reduce((t, p) => t + p.totalItem, 0);

  const totalEconomiaPotencial = useMemo(() => {
    let economia = 0;
    products.forEach((p: any) => {
      const qtd = Number(p.quantidade) || 1;
      const prices = fornecedores
        .map(f => getSupplierProductValue(f.id, p.product_id))
        .filter(val => val > 0)
        .sort((a, b) => b - a);

      if (prices.length > 1) {
        const highestPrice = prices[0];
        const bestPrice = prices[prices.length - 1];
        if (highestPrice > bestPrice) {
          economia += (highestPrice - bestPrice) * qtd;
        }
      }
    });
    return economia;
  }, [products, fornecedores]);

  // Ranking: calcular total de cada fornecedor só com os produtos que ELE ganhou
  const fornecedoresRanking = useMemo(() => {
    return fornecedores
      .map(f => {
        // Soma apenas os itens onde ESTE fornecedor é o vencedor
        const itensGanhos = produtosComVencedor.filter(p => p.winnerId === f.id);
        const totalGanho = itensGanhos.reduce((sum, p) => sum + p.totalItem, 0);
        return {
          ...f,
          total: totalGanho,
          itensGanhos: itensGanhos.length,
          isRespondido: f.status === 'respondido'
        };
      })
      .filter(f => f.total > 0)
      .sort((a, b) => b.itensGanhos - a.itensGanhos || a.total - b.total);
  }, [fornecedores, produtosComVencedor]);

  // Melhor fornecedor = quem ganhou mais itens (desempate: menor valor)
  const melhorFornecedor = fornecedoresRanking.length > 0 ? fornecedoresRanking[0] : null;

  return (
    <ResponsiveModal
      open={open}
      onOpenChange={onOpenChange}
      hideClose
      title="Resumo da Cotação"
      description={`#${safeStr(quote.id).slice(0, 8)}`}
      desktopMaxWidth="md"
      className={cn(
        "backdrop-blur-xl shadow-2xl [&>button]:hidden flex flex-col overflow-hidden",
        ds.colors.surface.card
      )}
      footer={
        <Button
          onClick={() => onOpenChange(false)}
          size="sm"
          className={ds.components.button.secondary}
        >
          Fechar
        </Button>
      }
    >
      {/* Close button */}
      <div className="absolute right-3 top-3 z-50">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onOpenChange(false)}
          className={cn(ds.components.button.ghost, ds.components.button.size.icon, "!bg-transparent")}
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Fechar</span>
        </Button>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
        <div className="space-y-3 pb-2">

          {/* ── HEADER: Status + Período ── */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-brand/10 border border-brand/20">
                <ClipboardList className="h-4 w-4 text-brand" />
              </div>
              <div>
                <p className={cn("text-[10px] uppercase tracking-widest", ds.typography.weight.bold, ds.colors.text.muted)}>
                  Cotação de Produtos
                </p>
                <StatusBadge status={quote.status} />
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1 justify-end mb-0.5">
                <Calendar className="h-3 w-3 text-zinc-400" />
                <p className={cn("text-[10px] uppercase tracking-wider", ds.typography.weight.bold, ds.colors.text.muted)}>Período</p>
              </div>
              <p className={cn("text-xs", ds.typography.weight.bold, ds.colors.text.primary)}>
                {safeStr(quote.dataInicio)} – {safeStr(quote.dataFim)}
              </p>
            </div>
          </div>

          {/* ── KPI ROW: 3 colunas compactas ── */}
          <div className="grid grid-cols-3 gap-2">
            {/* Produtos */}
            <div className={cn(ds.components.card.root, "p-2.5 text-center")}>
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <Package className="h-3 w-3 text-zinc-500" />
                <span className={cn("text-[9px] uppercase tracking-widest", ds.typography.weight.bold, ds.colors.text.muted)}>Produtos</span>
              </div>
              <p className={cn("text-lg leading-none", ds.typography.weight.bold, ds.colors.text.primary)}>
                {products.length}
              </p>
            </div>

            {/* Fornecedores */}
            <div className={cn(ds.components.card.root, "p-2.5 text-center")}>
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <Building2 className="h-3 w-3 text-zinc-500" />
                <span className={cn("text-[9px] uppercase tracking-widest", ds.typography.weight.bold, ds.colors.text.muted)}>Fornecedores</span>
              </div>
              <p className={cn("text-lg leading-none", ds.typography.weight.bold, ds.colors.text.primary)}>
                <span className="text-brand">{fornecedoresRespondidos}</span>
                <span className={cn("text-sm", ds.colors.text.muted)}>/{fornecedores.length}</span>
              </p>
            </div>

            {/* Melhor Total */}
            <div className={cn(ds.components.card.root, "p-2.5 text-center bg-brand/5 dark:bg-brand/10 !border-brand/20")}>
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <DollarSign className="h-3 w-3 text-brand" />
                <span className={cn("text-[9px] uppercase tracking-widest text-brand", ds.typography.weight.bold)}>Melhor Total</span>
              </div>
              <p className={cn("text-base leading-none text-brand", ds.typography.weight.bold)}>
                {formatCurrency(totalMelhorPreco)}
              </p>
            </div>
          </div>

          {/* ── MELHOR FORNECEDOR + ECONOMIA ── */}
          {melhorFornecedor && (
            <div className={cn(ds.components.card.root, "overflow-hidden")}>
              {/* Melhor Fornecedor */}
              <div className="px-3 py-2.5 flex items-center gap-3 border-b border-zinc-100 dark:border-zinc-800/50">
                <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-brand/10 border border-brand/20">
                  <Award className="h-4 w-4 text-brand" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn("text-[9px] uppercase tracking-widest text-brand", ds.typography.weight.bold)}>
                    🏆 Melhor Fornecedor
                  </p>
                  <p className={cn("text-sm truncate", ds.typography.weight.bold, ds.colors.text.primary)}>
                    {safeStr(melhorFornecedor.nome)}
                  </p>
                </div>
                <p className={cn("text-sm text-brand flex-shrink-0", ds.typography.weight.bold)}>
                  {formatCurrency(melhorFornecedor.total)}
                </p>
              </div>

              {/* Economia Potencial */}
              {totalEconomiaPotencial > 0 && (
                <div className="px-3 py-2.5 flex items-center gap-3 bg-brand/5 dark:bg-brand/10">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-brand/10 border border-brand/20">
                    <Sparkles className="h-4 w-4 text-brand" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn("text-[9px] uppercase tracking-widest text-brand", ds.typography.weight.bold)}>
                      Economia Potencial
                    </p>
                    <p className={cn("text-xs leading-relaxed", ds.colors.text.secondary)}>
                      Diferença entre a pior e melhor oferta × quantidade
                    </p>
                  </div>
                  <p className={cn("text-sm text-brand flex-shrink-0", ds.typography.weight.bold)}>
                    {formatCurrency(totalEconomiaPotencial)}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ── PRODUTOS: Tabela compacta ── */}
          <div className={cn(ds.components.card.root, "overflow-hidden")}>
            <div className="px-3 py-2 border-b border-zinc-100 dark:border-zinc-800/50 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Package className="h-3.5 w-3.5 text-brand" />
                <span className={cn("text-[10px] uppercase tracking-widest", ds.typography.weight.bold, ds.colors.text.muted)}>
                  Produtos Cotados
                </span>
              </div>
              <Badge className="bg-brand/10 text-brand border-brand/20 h-5 px-1.5 !text-[10px] font-bold">
                {products.length}
              </Badge>
            </div>

            {/* Cabeçalho */}
            <div className="grid grid-cols-[1fr_60px_90px_80px] gap-1 px-3 py-1.5 bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-100 dark:border-zinc-800/30">
              <span className={cn("text-[9px] uppercase tracking-widest", ds.typography.weight.bold, ds.colors.text.muted)}>Produto</span>
              <span className={cn("text-[9px] uppercase tracking-widest text-center", ds.typography.weight.bold, ds.colors.text.muted)}>Qtd</span>
              <span className={cn("text-[9px] uppercase tracking-widest text-right", ds.typography.weight.bold, ds.colors.text.muted)}>Melhor</span>
              <span className={cn("text-[9px] uppercase tracking-widest text-right", ds.typography.weight.bold, ds.colors.text.muted)}>Fornec.</span>
            </div>

            <div className="divide-y divide-zinc-100 dark:divide-zinc-800/30 max-h-[200px] overflow-y-auto custom-scrollbar">
              {products.map((p: any) => {
                const best = getBestPrice(p.product_id);
                return (
                  <div
                    key={p.product_id}
                    className="grid grid-cols-[1fr_60px_90px_80px] gap-1 px-3 py-1.5 items-center hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20 transition-colors"
                  >
                    <p className={cn("text-xs truncate", ds.typography.weight.bold, ds.colors.text.primary)}>
                      {safeStr(p.product_name)}
                    </p>
                    <p className={cn("text-xs text-center tabular-nums", ds.colors.text.secondary)}>
                      {safeStr(p.quantidade)} {safeStr(p.unidade)}
                    </p>
                    <div className="flex items-center justify-end gap-1 relative group/info">
                      <p className={cn("text-xs tabular-nums text-brand", ds.typography.weight.bold)}>
                        {formatCurrency(best.price)}
                      </p>
                      {(() => {
                        const allPrices = getAllPricesForProduct(p.product_id);
                        if (allPrices.length <= 1) return null;
                        const bestPrice = allPrices[0]?.price || 1;
                        return (
                          <>
                            <Info className="h-3 w-3 text-zinc-400 hover:text-brand cursor-help transition-colors flex-shrink-0" />
                            <div className="absolute right-0 top-full mt-1 z-[100] hidden group-hover/info:block animate-in fade-in slide-in-from-top-1 duration-200">
                              <div className={cn("rounded-lg border shadow-xl p-2.5 min-w-[200px] max-w-[260px]", ds.colors.surface.card, "border-zinc-200 dark:border-zinc-700")}>
                                <p className={cn("text-[9px] uppercase tracking-widest mb-2 pb-1.5 border-b border-zinc-100 dark:border-zinc-800/50", ds.typography.weight.bold, ds.colors.text.muted)}>
                                  Comparativo de Preços
                                </p>
                                <div className="space-y-1.5">
                                  {allPrices.map((item, idx) => {
                                    const diff = ((item.price - bestPrice) / bestPrice) * 100;
                                    const isBest = idx === 0;
                                    return (
                                      <div key={item.supplier} className="flex items-center justify-between gap-2">
                                        <span className={cn("text-[11px] truncate flex-1", isBest ? "text-brand" : "", ds.typography.weight.medium, isBest ? "" : ds.colors.text.secondary)}>
                                          {isBest && "🏆 "}{item.supplier}
                                        </span>
                                        <div className="flex items-center gap-1.5 flex-shrink-0">
                                          <span className={cn("text-[11px] tabular-nums", ds.typography.weight.bold, isBest ? "text-brand" : ds.colors.text.primary)}>
                                            {formatCurrency(item.price)}
                                          </span>
                                          {!isBest && (
                                            <span className="text-[9px] tabular-nums font-bold text-red-500/80">
                                              +{diff.toFixed(1)}%
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                    <p className={cn("text-[10px] text-right truncate", ds.colors.text.muted)} title={best.supplier}>
                      {best.supplier}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── RANKING FORNECEDORES ── */}
          <div className={cn(ds.components.card.root, "overflow-hidden")}>
            <div className="px-3 py-2 border-b border-zinc-100 dark:border-zinc-800/50 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5 text-brand" />
                <span className={cn("text-[10px] uppercase tracking-widest", ds.typography.weight.bold, ds.colors.text.muted)}>
                  Ranking · Itens Ganhos
                </span>
              </div>
              <Badge className="bg-brand/10 text-brand border-brand/20 h-5 px-1.5 !text-[10px] font-bold">
                {fornecedores.length}
              </Badge>
            </div>

            <div className="divide-y divide-zinc-100 dark:divide-zinc-800/30 max-h-[200px] overflow-y-auto custom-scrollbar">
              {fornecedoresRanking.length > 0 ? fornecedoresRanking.map((f, idx) => {
                const isBest = idx === 0;
                return (
                  <div
                    key={f.id}
                    className={cn(
                      "px-3 py-2 flex items-center gap-2.5 transition-colors",
                      isBest ? "bg-brand/5 dark:bg-brand/10" : "hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20"
                    )}
                  >
                    {/* Posição */}
                    <div className={cn(
                      "w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 text-[10px]",
                      ds.typography.weight.bold,
                      isBest
                        ? "bg-brand/20 text-brand border border-brand/30"
                        : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 border border-zinc-200 dark:border-zinc-700"
                    )}>
                      {idx + 1}º
                    </div>

                    {/* Nome + Status */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className={cn("text-xs truncate", ds.typography.weight.bold, ds.colors.text.primary)}>
                          {safeStr(f.nome)}
                        </p>
                        {isBest && <Award className="h-3 w-3 text-brand flex-shrink-0" />}
                      </div>
                      <div className="flex items-center gap-1 mt-0.5">
                        {f.isRespondido ? (
                          <CheckCircle2 className="h-2.5 w-2.5 text-brand" />
                        ) : (
                          <Clock className="h-2.5 w-2.5 text-amber-500" />
                        )}
                        <span className={cn("text-[9px] uppercase tracking-wider", ds.colors.text.muted)}>
                          Ganhou {f.itensGanhos} {f.itensGanhos === 1 ? 'item' : 'itens'}
                        </span>
                      </div>
                    </div>

                    {/* Valor */}
                    <p className={cn(
                      "text-xs flex-shrink-0 tabular-nums",
                      ds.typography.weight.bold,
                      isBest ? "text-brand" : ds.colors.text.primary
                    )}>
                      {formatCurrency(f.total)}
                    </p>
                  </div>
                );
              }) : (
                <div className="py-6 text-center">
                  <p className={cn("text-xs", ds.colors.text.muted)}>Nenhum fornecedor respondeu ainda</p>
                </div>
              )}

              {/* Fornecedores sem resposta */}
              {fornecedores
                .filter(f => calcularTotalFornecedor(f.id) === 0)
                .map(f => (
                  <div key={f.id} className="px-3 py-2 flex items-center gap-2.5 opacity-40">
                    <div className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
                      <Clock className="h-3 w-3 text-zinc-400" />
                    </div>
                    <p className={cn("text-xs flex-1 truncate", ds.colors.text.muted)}>
                      {safeStr(f.nome)}
                    </p>
                    <span className={cn("text-[10px]", ds.colors.text.muted)}>Sem resposta</span>
                  </div>
                ))
              }
            </div>
          </div>

          {/* ── OBSERVAÇÕES ── */}
          {(quote as any).observacoes && (
            <div className={cn(ds.components.card.root, "p-3")}>
              <p className={cn("text-[9px] uppercase tracking-widest mb-1", ds.typography.weight.bold, ds.colors.text.muted)}>
                Observações
              </p>
              <p className={cn("text-xs leading-relaxed", ds.colors.text.secondary)}>
                {safeStr((quote as any).observacoes)}
              </p>
            </div>
          )}

        </div>
      </div>
    </ResponsiveModal>
  );
}
