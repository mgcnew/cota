import { useMemo } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  Package, Building2, DollarSign, ClipboardList,
  Award, X, CheckCircle2, Clock, Sparkles
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

  const naoResponderam = fornecedores.filter(f => calcularTotalFornecedor(f.supplierId) === 0);

  const isMobile = useIsMobile();

  const modalContent = (
    <div className="flex flex-col h-full min-h-0">
      {/* Header */}
      <div className="flex-shrink-0 px-4 sm:px-5 py-3 border-b border-border dark:border-white/5 bg-card flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-brand/10 border border-brand/20 flex items-center justify-center shrink-0">
          <ClipboardList className="h-4 w-4 text-brand" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-foreground truncate">Resumo da Cotação</h2>
            <StatusBadge status={quote.status} />
          </div>
          <p className="text-[11px] text-muted-foreground font-medium truncate">
            #{safeStr(quote.id).slice(0, 8)}
            <span className="mx-1.5 opacity-40">·</span>
            {safeStr(quote.dataInicio)} – {safeStr(quote.dataFim)}
          </p>
        </div>
        <Button
          variant="ghost" size="icon"
          onClick={() => onOpenChange(false)}
          className="h-8 w-8 text-muted-foreground hover:bg-muted rounded-lg shrink-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Body */}
      <div className="flex-1 min-h-0 flex flex-col gap-3 p-3 sm:p-4 overflow-y-auto md:overflow-hidden custom-scrollbar bg-background">
        {/* KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 flex-shrink-0">
          <div className={cn(ds.components.card.root, "px-2 py-2 flex flex-col items-center gap-0.5")}>
            <div className="flex items-center gap-1">
              <Package className="h-3 w-3 text-zinc-500" />
              <span className="text-[9px] uppercase tracking-widest font-bold text-muted-foreground">Itens</span>
            </div>
            <p className="text-lg font-bold leading-none text-foreground">{products.length}</p>
          </div>
          <div className={cn(ds.components.card.root, "px-2 py-2 flex flex-col items-center gap-0.5")}>
            <div className="flex items-center gap-1">
              <Building2 className="h-3 w-3 text-zinc-500" />
              <span className="text-[9px] uppercase tracking-widest font-bold text-muted-foreground">Fornec.</span>
            </div>
            <p className="text-lg font-bold leading-none text-foreground">
              <span className="text-brand">{fornecedoresRespondidos}</span>
              <span className="text-sm text-muted-foreground">/{fornecedores.length}</span>
            </p>
          </div>
          <div className={cn(ds.components.card.root, "px-2 py-2 flex flex-col items-center gap-0.5 bg-brand/5 dark:bg-brand/10 !border-brand/20")}>
            <div className="flex items-center gap-1">
              <DollarSign className="h-3 w-3 text-brand" />
              <span className="text-[9px] uppercase tracking-widest font-bold text-brand">Melhor Total</span>
            </div>
            <p className="text-sm font-bold leading-none text-brand">{formatCurrency(totalMelhorPreco)}</p>
          </div>
          <div className={cn(ds.components.card.root, "px-2 py-2 flex flex-col items-center gap-0.5")}>
            <div className="flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-emerald-500" />
              <span className="text-[9px] uppercase tracking-widest font-bold text-muted-foreground">Economia</span>
            </div>
            <p className={cn("text-sm font-bold leading-none", totalEconomiaPotencial > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground")}>
              {totalEconomiaPotencial > 0 ? formatCurrency(totalEconomiaPotencial) : "—"}
            </p>
          </div>
        </div>

        {/* Duas colunas: Itens Cotados | Ranking */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 flex-1 min-h-0">
          {/* Itens Cotados */}
          <div className="flex flex-col rounded-xl border border-border dark:border-white/5 bg-card/30 overflow-hidden min-h-0">
            <div className="px-3 py-2 border-b border-border dark:border-white/5 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-1.5">
                <Package className="h-3.5 w-3.5 text-brand" />
                <span className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Itens Cotados</span>
              </div>
              <Badge className="bg-brand/10 text-brand border-brand/20 h-5 px-1.5 !text-[10px] font-bold">{products.length}</Badge>
            </div>
            <div className="grid grid-cols-[minmax(0,1fr)_34px_74px_72px] gap-1 px-3 py-1.5 bg-muted/40 border-b border-border dark:border-white/5 flex-shrink-0">
              <span className="text-[9px] uppercase tracking-widest font-bold text-muted-foreground">Embalagem</span>
              <span className="text-[9px] uppercase tracking-widest font-bold text-muted-foreground text-center">Qtd</span>
              <span className="text-[9px] uppercase tracking-widest font-bold text-muted-foreground text-right">Melhor</span>
              <span className="text-[9px] uppercase tracking-widest font-bold text-muted-foreground text-right">Fornec.</span>
            </div>
            <div className="flex-1 min-h-0 max-h-[220px] md:max-h-none overflow-y-auto custom-scrollbar divide-y divide-border dark:divide-white/5">
              {products.map((p: any) => {
                const best = getBestPrice(p.packagingId);
                return (
                  <div key={p.packagingId} className="grid grid-cols-[minmax(0,1fr)_34px_74px_72px] gap-1 px-3 py-1.5 items-center hover:bg-muted/20 transition-colors">
                    <p className="text-xs font-bold text-foreground truncate" title={safeStr(p.packagingName)}>{safeStr(p.packagingName)}</p>
                    <p className="text-xs text-center tabular-nums text-muted-foreground">{p.quantidadeNecessaria || '-'}</p>
                    <p className="text-xs text-right tabular-nums font-bold text-brand">{formatCurrency(best.price)}</p>
                    <p className="text-[10px] text-right truncate text-muted-foreground" title={best.supplier}>{best.supplier}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Ranking */}
          <div className="flex flex-col rounded-xl border border-border dark:border-white/5 bg-card/30 overflow-hidden min-h-0">
            <div className="px-3 py-2 border-b border-border dark:border-white/5 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5 text-brand" />
                <span className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Ranking por Valor</span>
              </div>
              <Badge className="bg-brand/10 text-brand border-brand/20 h-5 px-1.5 !text-[10px] font-bold">{fornecedores.length}</Badge>
            </div>
            <div className="flex-1 min-h-0 max-h-[220px] md:max-h-none overflow-y-auto custom-scrollbar divide-y divide-border dark:divide-white/5">
              {fornecedoresRanking.length > 0 ? fornecedoresRanking.map((f, idx) => {
                const isBest = idx === 0;
                return (
                  <div key={f.supplierId} className={cn("px-3 py-1.5 flex items-center gap-2.5 transition-colors", isBest ? "bg-brand/5 dark:bg-brand/10" : "hover:bg-muted/20")}>
                    <div className={cn(
                      "w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 text-[9px] font-bold",
                      isBest ? "bg-brand/20 text-brand border border-brand/30" : "bg-muted text-muted-foreground border border-border dark:border-white/5"
                    )}>
                      {idx + 1}º
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-bold text-foreground truncate">{safeStr(f.supplierName)}</p>
                        {isBest && <Award className="h-3 w-3 text-brand flex-shrink-0" />}
                      </div>
                      <div className="flex items-center gap-1">
                        {f.status === 'respondido'
                          ? <CheckCircle2 className="h-2.5 w-2.5 text-brand" />
                          : <Clock className="h-2.5 w-2.5 text-amber-500" />}
                        <span className="text-[9px] uppercase tracking-wider text-muted-foreground">
                          {f.status === 'respondido' ? 'Respondido' : 'Pendente'} · {f.itensRespondidos} itens
                        </span>
                      </div>
                    </div>
                    <p className={cn("text-xs flex-shrink-0 tabular-nums font-bold", isBest ? "text-brand" : "text-foreground")}>
                      {formatCurrency(f.total)}
                    </p>
                  </div>
                );
              }) : (
                <div className="py-6 text-center">
                  <p className="text-xs text-muted-foreground">Nenhum fornecedor respondeu ainda</p>
                </div>
              )}

              {naoResponderam.map(f => (
                <div key={f.supplierId} className="px-3 py-1.5 flex items-center gap-2.5 opacity-40">
                  <div className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 bg-muted border border-border dark:border-white/5">
                    <Clock className="h-3 w-3 text-zinc-400" />
                  </div>
                  <p className="text-xs flex-1 truncate text-muted-foreground">{safeStr(f.supplierName)}</p>
                  <span className="text-[10px] text-muted-foreground">Sem resposta</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Observações */}
        {quote.observacoes && (
          <div className="flex-shrink-0 rounded-lg border border-border dark:border-white/5 bg-muted/20 px-3 py-2">
            <p className="text-[9px] uppercase tracking-widest font-bold text-muted-foreground mb-0.5">Observações</p>
            <p className="text-xs text-muted-foreground line-clamp-2">{safeStr(quote.observacoes)}</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex-shrink-0 px-4 py-3 border-t border-border dark:border-white/5 bg-muted/30 flex justify-end">
        <Button onClick={() => onOpenChange(false)} className="h-9 px-5 text-xs font-bold bg-brand hover:bg-brand/90 text-white">
          Fechar
        </Button>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="h-[90vh] rounded-t-2xl p-0 overflow-hidden flex flex-col bg-background border-t border-border dark:border-white/5">
          <DrawerTitle className="sr-only">Resumo da Cotação</DrawerTitle>
          <DrawerDescription className="sr-only">Resumo dos preços e fornecedores da cotação</DrawerDescription>
          {modalContent}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        hideClose
        className="w-[95vw] max-w-[820px] h-[72vh] max-h-[620px] overflow-hidden flex flex-col p-0 gap-0 rounded-2xl border border-border dark:border-white/5 shadow-2xl bg-background [&>button]:hidden"
      >
        <DialogTitle className="sr-only">Resumo da Cotação</DialogTitle>
        <DialogDescription className="sr-only">Resumo dos preços e fornecedores da cotação</DialogDescription>
        {modalContent}
      </DialogContent>
    </Dialog>
  );
}
