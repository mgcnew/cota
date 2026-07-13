import { useMemo, useRef, useState, useEffect, useCallback } from "react";
import { Trophy, Building2, Inbox, ChevronLeft, ChevronRight, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/utils/formatters";
import { normalizePrice, PriceMetadata } from "@/utils/priceNormalization";

interface QuoteCompareTabProps {
  products: any[];
  fornecedores: any[];
  supplierItems: any[];
  safeStr: (val: any) => string;
}

interface Cell {
  unit: number;
  total: number;
}

/**
 * Matriz de comparação produto × fornecedor — a visão de decisão da cotação.
 * Linhas = itens; colunas = fornecedores; célula = preço unitário normalizado.
 * A melhor célula de cada linha é destacada (cor + troféu, nunca só cor) e as
 * demais mostram a diferença % vs. o melhor. Rodapé traz total e cobertura por
 * fornecedor, mais a "cesta ótima" (soma dos melhores preços).
 *
 * Com muitos fornecedores: colunas ordenadas por relevância (vitórias → menor
 * total), quem não cotou nada fica oculto (opcional exibir) e o scroll
 * horizontal ganha fades + setas para indicar que há mais colunas.
 */
export function QuoteCompareTab({ products, fornecedores, supplierItems, safeStr }: QuoteCompareTabProps) {
  const [showEmpty, setShowEmpty] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScroll, setCanScroll] = useState({ left: false, right: false });

  const matrix = useMemo(() => {
    // célula[productId][supplierId] = { unit, total } normalizados
    const cells: Record<string, Record<string, Cell>> = {};

    products.forEach((p: any) => {
      cells[p.product_id] = {};
      fornecedores.forEach((f: any) => {
        const item = supplierItems.find(
          (i: any) => i?.supplier_id === f.id && i?.product_id === p.product_id
        );
        if (!item || !(item.valor_oferecido > 0)) return;

        try {
          const meta: PriceMetadata = {
            valorOferecido: item.valor_oferecido,
            unidadePreco: item.unidade_preco || "un",
            fatorConversao: item.fator_conversao || undefined,
            quantidadePorEmbalagem: item.quantidade_por_embalagem || undefined,
          };
          const n = normalizePrice(meta, p.quantidade, p.unidade);
          cells[p.product_id][f.id] = {
            unit: n.valorUnitario > 0 ? n.valorUnitario : item.valor_oferecido,
            total: n.valorTotal > 0 ? n.valorTotal : item.valor_oferecido * p.quantidade,
          };
        } catch {
          cells[p.product_id][f.id] = {
            unit: item.valor_oferecido,
            total: item.valor_oferecido * p.quantidade,
          };
        }
      });
    });

    // melhor fornecedor por produto (menor total normalizado)
    const bestByProduct: Record<string, string | null> = {};
    products.forEach((p: any) => {
      let best: string | null = null;
      let bestTotal = Infinity;
      Object.entries(cells[p.product_id]).forEach(([supplierId, cell]) => {
        if (cell.total < bestTotal) {
          bestTotal = cell.total;
          best = supplierId;
        }
      });
      bestByProduct[p.product_id] = best;
    });

    // totais, cobertura e vitórias por fornecedor
    const supplierTotals: Record<string, number> = {};
    const supplierCoverage: Record<string, number> = {};
    const supplierWins: Record<string, number> = {};
    fornecedores.forEach((f: any) => {
      supplierTotals[f.id] = 0;
      supplierCoverage[f.id] = 0;
      supplierWins[f.id] = 0;
      products.forEach((p: any) => {
        const cell = cells[p.product_id][f.id];
        if (cell) {
          supplierTotals[f.id] += cell.total;
          supplierCoverage[f.id] += 1;
          if (bestByProduct[p.product_id] === f.id) supplierWins[f.id] += 1;
        }
      });
    });

    // cesta ótima = soma dos melhores totais por produto
    const cestaOtima = products.reduce((sum: number, p: any) => {
      const best = bestByProduct[p.product_id];
      return sum + (best ? cells[p.product_id][best].total : 0);
    }, 0);

    return { cells, bestByProduct, supplierTotals, supplierCoverage, supplierWins, cestaOtima };
  }, [products, fornecedores, supplierItems]);

  // Colunas: quem cotou algo, ordenado por vitórias (desc) e depois menor total.
  // Sem proposta fica de fora por padrão — vira só um aviso com opção de exibir.
  const { visibleSuppliers, emptyCount } = useMemo(() => {
    const withData = fornecedores.filter((f: any) => matrix.supplierCoverage[f.id] > 0);
    const empty = fornecedores.filter((f: any) => matrix.supplierCoverage[f.id] === 0);

    withData.sort((a: any, b: any) => {
      const winDiff = matrix.supplierWins[b.id] - matrix.supplierWins[a.id];
      if (winDiff !== 0) return winDiff;
      const covDiff = matrix.supplierCoverage[b.id] - matrix.supplierCoverage[a.id];
      if (covDiff !== 0) return covDiff;
      return matrix.supplierTotals[a.id] - matrix.supplierTotals[b.id];
    });

    return {
      visibleSuppliers: showEmpty ? [...withData, ...empty] : withData,
      emptyCount: empty.length,
    };
  }, [fornecedores, matrix, showEmpty]);

  const updateScrollHints = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScroll({
      left: el.scrollLeft > 4,
      right: el.scrollLeft + el.clientWidth < el.scrollWidth - 4,
    });
  }, []);

  useEffect(() => {
    updateScrollHints();
    window.addEventListener("resize", updateScrollHints);
    return () => window.removeEventListener("resize", updateScrollHints);
  }, [updateScrollHints, visibleSuppliers.length]);

  const scrollBy = (dir: 1 | -1) => {
    scrollRef.current?.scrollBy({ left: dir * 240, behavior: "smooth" });
  };

  if (products.length === 0 || fornecedores.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-20 text-center opacity-50">
        <Inbox className="h-10 w-10 text-zinc-400 mb-4" />
        <p className="text-sm font-semibold text-foreground">Nada para comparar ainda</p>
        <p className="text-xs text-muted-foreground mt-1">Adicione produtos e fornecedores à cotação.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full">
      {/* Barra de contexto: cesta ótima + navegação de colunas */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-border dark:border-white/5 bg-card/50">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-emerald-500/10 ring-1 ring-emerald-500/20">
            <Trophy className="h-4 w-4 text-emerald-500" />
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground leading-none mb-1">Cesta ótima (melhor preço de cada item)</p>
            <p className="text-base font-bold text-emerald-600 dark:text-emerald-400 leading-none tabular-nums">
              {formatCurrency(matrix.cestaOtima)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {emptyCount > 0 && (
            <button
              type="button"
              onClick={() => setShowEmpty(v => !v)}
              className={cn(
                "inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[11px] font-medium transition-colors",
                showEmpty
                  ? "bg-muted text-foreground border-border"
                  : "bg-transparent text-muted-foreground border-border/60 hover:text-foreground"
              )}
            >
              <EyeOff className="h-3 w-3" />
              {emptyCount} sem proposta
              <span className="text-brand font-semibold">{showEmpty ? "ocultar" : "mostrar"}</span>
            </button>
          )}

          {/* Setas de navegação — só quando há colunas fora da tela */}
          {(canScroll.left || canScroll.right) && (
            <div className="hidden sm:flex items-center gap-1">
              <button
                type="button"
                aria-label="Fornecedores anteriores"
                onClick={() => scrollBy(-1)}
                disabled={!canScroll.left}
                className="flex items-center justify-center h-7 w-7 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted/60 disabled:opacity-30 disabled:pointer-events-none transition-colors"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                aria-label="Próximos fornecedores"
                onClick={() => scrollBy(1)}
                disabled={!canScroll.right}
                className="flex items-center justify-center h-7 w-7 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted/60 disabled:opacity-30 disabled:pointer-events-none transition-colors"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Legenda compacta */}
      <div className="px-4 py-1.5 border-b border-border/60 dark:border-white/5 bg-muted/20">
        <p className="text-[10px] text-muted-foreground">
          <Trophy className="inline h-2.5 w-2.5 text-emerald-500 -mt-0.5 mr-1" />
          = melhor preço do item · <span className="text-red-500 font-medium">+%</span> = acima do melhor · colunas ordenadas por vitórias
        </p>
      </div>

      {/* Matriz — scroll horizontal próprio, 1ª coluna fixa, fades nas bordas */}
      <div className="relative">
        {canScroll.left && (
          <div className="pointer-events-none absolute left-[140px] top-0 bottom-0 w-6 bg-gradient-to-r from-background/90 to-transparent z-20" />
        )}
        {canScroll.right && (
          <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-10 bg-gradient-to-l from-background/90 to-transparent z-20" />
        )}

        <div ref={scrollRef} onScroll={updateScrollHints} className="overflow-x-auto custom-scrollbar">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-border dark:border-white/5 bg-muted/30">
                <th className="sticky left-0 z-10 bg-background text-left px-3 py-2 w-[140px] min-w-[140px] max-w-[140px]">
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Item</span>
                </th>
                {visibleSuppliers.map((f: any) => {
                  const wins = matrix.supplierWins[f.id];
                  return (
                    <th key={f.id} className="px-2 py-2 min-w-[104px] text-right">
                      <div className="flex flex-col items-end gap-0.5">
                        <span
                          className="text-[11px] font-semibold text-foreground truncate max-w-[96px]"
                          title={f.nome}
                        >
                          {safeStr(f.nome)}
                        </span>
                        {wins > 0 && (
                          <span className="inline-flex items-center gap-0.5 text-[9px] font-semibold text-emerald-600 dark:text-emerald-400">
                            <Trophy className="h-2.5 w-2.5" /> {wins}
                          </span>
                        )}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {products.map((p: any) => {
                const bestId = matrix.bestByProduct[p.product_id];
                const bestCell = bestId ? matrix.cells[p.product_id][bestId] : null;

                return (
                  <tr key={p.product_id} className="border-b border-border/60 dark:border-white/5">
                    <td className="sticky left-0 z-10 bg-background px-3 py-2 w-[140px] min-w-[140px] max-w-[140px]">
                      <p className="text-xs font-semibold text-foreground truncate" title={p.product_name}>
                        {safeStr(p.product_name)}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {safeStr(p.quantidade)} {safeStr(p.unidade)}
                      </p>
                    </td>
                    {visibleSuppliers.map((f: any) => {
                      const cell = matrix.cells[p.product_id][f.id];
                      if (!cell) {
                        return (
                          <td key={f.id} className="px-2 py-2 text-right">
                            <span className="text-xs text-muted-foreground/40">—</span>
                          </td>
                        );
                      }
                      const isBest = bestId === f.id;
                      const deltaPct = !isBest && bestCell && bestCell.unit > 0
                        ? ((cell.unit - bestCell.unit) / bestCell.unit) * 100
                        : 0;

                      return (
                        <td
                          key={f.id}
                          className={cn(
                            "px-2 py-2 text-right align-middle",
                            isBest && "bg-emerald-500/[0.07]"
                          )}
                        >
                          <div className="flex items-center justify-end gap-1">
                            {isBest && <Trophy className="h-2.5 w-2.5 text-emerald-500 shrink-0" />}
                            <span className={cn(
                              "text-xs tabular-nums whitespace-nowrap",
                              isBest ? "font-bold text-emerald-600 dark:text-emerald-400" : "font-medium text-foreground"
                            )}>
                              {formatCurrency(cell.unit)}
                            </span>
                          </div>
                          {!isBest && deltaPct >= 0.5 && (
                            <p className="text-[9px] text-red-500/90 tabular-nums mt-0.5">
                              +{deltaPct.toFixed(0)}%
                            </p>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              {/* Total por fornecedor (soma do que cada um cotou) */}
              <tr className="border-t-2 border-border dark:border-white/10 bg-muted/30">
                <td className="sticky left-0 z-10 bg-background px-3 py-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Total cotado</span>
                </td>
                {visibleSuppliers.map((f: any) => {
                  const total = matrix.supplierTotals[f.id];
                  return (
                    <td key={f.id} className="px-2 py-2 text-right">
                      <span className={cn(
                        "text-xs font-bold tabular-nums whitespace-nowrap",
                        total > 0 ? "text-foreground" : "text-muted-foreground/40"
                      )}>
                        {total > 0 ? formatCurrency(total) : "—"}
                      </span>
                    </td>
                  );
                })}
              </tr>
              {/* Cobertura */}
              <tr className="bg-muted/30">
                <td className="sticky left-0 z-10 bg-background px-3 pb-2.5 pt-0.5">
                  <span className="text-[10px] text-muted-foreground">Itens cotados</span>
                </td>
                {visibleSuppliers.map((f: any) => (
                  <td key={f.id} className="px-2 pb-2.5 pt-0.5 text-right">
                    <span className="text-[10px] text-muted-foreground tabular-nums">
                      {matrix.supplierCoverage[f.id]}/{products.length}
                    </span>
                  </td>
                ))}
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
