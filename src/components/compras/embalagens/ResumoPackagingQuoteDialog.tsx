import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ResponsiveModal } from "@/components/responsive/ResponsiveModal";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  Package, Building2, DollarSign, Calendar, ClipboardList,
  TrendingDown, Award, X, CheckCircle2, Clock, Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";
import { designSystem as ds } from "@/styles/design-system";
import { formatCurrency } from "@/utils/formatters";
import type { PackagingQuoteDisplay } from "@/types/packaging";

interface ResumoPackagingQuoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quote: PackagingQuoteDisplay;
}

export function ResumoPackagingQuoteDialog({ open, onOpenChange, quote }: ResumoPackagingQuoteDialogProps) {
  const products = quote.itens || [];
  const fornecedores = quote.fornecedores || [];
  const fornecedoresRespondidos = fornecedores.filter(f => f.status === "respondido").length;

  const safeStr = (val: any): string => typeof val === 'string' ? val : String(val || '');

  const getQtdNecessaria = (packagingId: string): number => {
    const p = products.find((p: any) => p.packagingId === packagingId);
    return p?.quantidadeNecessaria || 1;
  };

  const getSupplierCustoPorUnidade = (supplierId: string, packagingId: string): number => {
    const f = fornecedores.find(f => f.supplierId === supplierId);
    if (!f) return 0;
    const item = f.itens.find(i => i.packagingId === packagingId);
    return item?.custoPorUnidade || 0;
  };

  const getSupplierValorTotalOfItem = (supplierId: string, packagingId: string): number => {
    const f = fornecedores.find(f => f.supplierId === supplierId);
    if (!f) return 0;
    const item = f.itens.find(i => i.packagingId === packagingId);
    const qtdNecessaria = getQtdNecessaria(packagingId);
    return (item?.valorTotal || 0) * qtdNecessaria;
  };

  const calcularTotalFornecedor = (supplierId: string): number => {
    let total = 0;
    const f = fornecedores.find(f => f.supplierId === supplierId);
    if (!f) return 0;
    f.itens.forEach(i => {
      const qtdNecessaria = getQtdNecessaria(i.packagingId);
      total += (i.valorTotal || 0) * qtdNecessaria;
    });
    return total;
  };

  const getBestPrice = (packagingId: string) => {
    let best = { price: 0, supplier: '-' };
    fornecedores.forEach(f => {
      const totalOfItem = getSupplierValorTotalOfItem(f.supplierId, packagingId);
      if (totalOfItem > 0 && (best.price === 0 || totalOfItem < best.price)) {
        best = { price: totalOfItem, supplier: safeStr(f.supplierName) };
      }
    });
    return best;
  };

  const totalMelhorPreco = products.reduce((t: number, p: any) => {
    const best = getBestPrice(p.packagingId);
    return t + best.price;
  }, 0);

  const melhorFornecedor = fornecedores.reduce((best: any, f) => {
    const total = calcularTotalFornecedor(f.supplierId);
    if (total > 0 && (!best || total < best.total)) return { ...f, total };
    return best;
  }, null);

  const totalEconomiaPotencial = useMemo(() => {
    let economia = 0;
    products.forEach((p: any) => {
      const prices = fornecedores
        .map(f => getSupplierValorTotalOfItem(f.supplierId, p.packagingId))
        .filter(val => val > 0)
        .sort((a, b) => b - a);

      if (prices.length > 1) {
        const highestPrice = prices[0];
        const bestPrice = prices[prices.length - 1];
        if (highestPrice > bestPrice) {
          economia += (highestPrice - bestPrice);
        }
      }
    });
    return economia;
  }, [products, fornecedores]);

  // Ranking de fornecedores ordenado por valor total (menor primeiro)
  const fornecedoresRanking = useMemo(() => {
    return fornecedores
      .map(f => ({
        ...f,
        total: calcularTotalFornecedor(f.supplierId),
        itensRespondidos: f.itens?.length || 0
      }))
      .filter(f => f.total > 0)
      .sort((a, b) => a.total - b.total);
  }, [fornecedores, products]);

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
                  Cotação de Embalagem
                </p>
                <StatusBadge status={quote.status} />
              </div>
            </div>
            <div className="text-right">
              <p className={cn("text-[10px] uppercase tracking-wider", ds.typography.weight.bold, ds.colors.text.muted)}>Período</p>
              <p className={cn("text-xs", ds.typography.weight.bold, ds.colors.text.primary)}>
                {safeStr(quote.dataInicio)} – {safeStr(quote.dataFim)}
              </p>
            </div>
          </div>

          {/* ── KPI ROW ── */}
          <div className="grid grid-cols-3 gap-2">
            {/* Embalagens */}
            <div className={cn(ds.components.card.root, "p-2.5 text-center")}>
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <Package className="h-3 w-3 text-zinc-500" />
                <span className={cn("text-[9px] uppercase tracking-widest", ds.typography.weight.bold, ds.colors.text.muted)}>Itens</span>
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
            <div className={cn(
              ds.components.card.root,
              "overflow-hidden"
            )}>
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
                    {safeStr(melhorFornecedor.supplierName)}
                  </p>
                </div>
                <p className={cn("text-sm text-brand flex-shrink-0", ds.typography.weight.bold)}>
                  {formatCurrency(melhorFornecedor.total)}
                </p>
              </div>

              {/* Economia */}
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
                      Diferença entre a pior e melhor oferta por item
                    </p>
                  </div>
                  <p className={cn("text-sm text-brand flex-shrink-0", ds.typography.weight.bold)}>
                    {formatCurrency(totalEconomiaPotencial)}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ── EMBALAGENS: Lista compacta ── */}
          <div className={cn(ds.components.card.root, "overflow-hidden")}>
            <div className="px-3 py-2 border-b border-zinc-100 dark:border-zinc-800/50 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Package className="h-3.5 w-3.5 text-brand" />
                <span className={cn("text-[10px] uppercase tracking-widest", ds.typography.weight.bold, ds.colors.text.muted)}>
                  Itens Cotados
                </span>
              </div>
              <Badge className="bg-brand/10 text-brand border-brand/20 h-5 px-1.5 !text-[10px] font-bold">
                {products.length}
              </Badge>
            </div>

            {/* Cabeçalho da tabela compacta */}
            <div className="grid grid-cols-[1fr_60px_90px_90px] gap-1 px-3 py-1.5 bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-100 dark:border-zinc-800/30">
              <span className={cn("text-[9px] uppercase tracking-widest", ds.typography.weight.bold, ds.colors.text.muted)}>Embalagem</span>
              <span className={cn("text-[9px] uppercase tracking-widest text-center", ds.typography.weight.bold, ds.colors.text.muted)}>Qtd</span>
              <span className={cn("text-[9px] uppercase tracking-widest text-right", ds.typography.weight.bold, ds.colors.text.muted)}>Melhor</span>
              <span className={cn("text-[9px] uppercase tracking-widest text-right", ds.typography.weight.bold, ds.colors.text.muted)}>Fornec.</span>
            </div>

            <div className="divide-y divide-zinc-100 dark:divide-zinc-800/30 max-h-[200px] overflow-y-auto custom-scrollbar">
              {products.map((p: any) => {
                const best = getBestPrice(p.packagingId);
                return (
                  <div
                    key={p.packagingId}
                    className="grid grid-cols-[1fr_60px_90px_90px] gap-1 px-3 py-1.5 items-center hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20 transition-colors"
                  >
                    <p className={cn("text-xs truncate", ds.typography.weight.bold, ds.colors.text.primary)}>
                      {safeStr(p.packagingName)}
                    </p>
                    <p className={cn("text-xs text-center tabular-nums", ds.colors.text.secondary)}>
                      {p.quantidadeNecessaria || '-'}
                    </p>
                    <p className={cn("text-xs text-right tabular-nums text-brand", ds.typography.weight.bold)}>
                      {formatCurrency(best.price)}
                    </p>
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
                  Ranking por Valor Total
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
                    key={f.supplierId}
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
                          {safeStr(f.supplierName)}
                        </p>
                        {isBest && (
                          <Award className="h-3 w-3 text-brand flex-shrink-0" />
                        )}
                      </div>
                      <div className="flex items-center gap-1 mt-0.5">
                        {f.status === 'respondido' ? (
                          <CheckCircle2 className="h-2.5 w-2.5 text-brand" />
                        ) : (
                          <Clock className="h-2.5 w-2.5 text-amber-500" />
                        )}
                        <span className={cn("text-[9px] uppercase tracking-wider", ds.colors.text.muted)}>
                          {f.status === 'respondido' ? 'Respondido' : 'Pendente'} · {f.itensRespondidos} itens
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

              {/* Fornecedores que não responderam */}
              {fornecedores
                .filter(f => calcularTotalFornecedor(f.supplierId) === 0)
                .map(f => (
                  <div
                    key={f.supplierId}
                    className="px-3 py-2 flex items-center gap-2.5 opacity-40"
                  >
                    <div className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
                      <Clock className="h-3 w-3 text-zinc-400" />
                    </div>
                    <p className={cn("text-xs flex-1 truncate", ds.colors.text.muted)}>
                      {safeStr(f.supplierName)}
                    </p>
                    <span className={cn("text-[10px]", ds.colors.text.muted)}>Sem resposta</span>
                  </div>
                ))
              }
            </div>
          </div>

          {/* ── OBSERVAÇÕES ── */}
          {quote.observacoes && (
            <div className={cn(ds.components.card.root, "p-3")}>
              <p className={cn("text-[9px] uppercase tracking-widest mb-1", ds.typography.weight.bold, ds.colors.text.muted)}>
                Observações
              </p>
              <p className={cn("text-xs leading-relaxed", ds.colors.text.secondary)}>
                {safeStr(quote.observacoes)}
              </p>
            </div>
          )}

        </div>
      </div>
    </ResponsiveModal>
  );
}
