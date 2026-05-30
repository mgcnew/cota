import { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Truck, Package, TrendingDown,
  Loader2, CheckCircle2, AlertCircle, X, Sparkles, BoxIcon,
} from "lucide-react";
import { usePedidos, type Pedido } from "@/hooks/usePedidos";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pedido: Pedido | null;
}

interface ItemEntrega {
  itemId: string;
  productName: string;
  quantidadePedida: number;
  unidadePedida: string;
  quantidadeEntregue: number;
  unidadeEntregue: string;
  valorUnitario: number;
  valorFaturado: number;
  maiorValor: number;
  fatorEmbalagem: number;
  isBoxUnit: boolean;
  quantidadePorEmbalagemOriginal: number | null;
}

function isBoxLikeUnit(unit: string): boolean {
  const normalized = unit.toLowerCase().trim();
  return normalized === "cx" || normalized === "caixa" || normalized === "caixas" || normalized.startsWith("cx");
}

export function RegistrarEntregaDialog({ open, onOpenChange, pedido }: Props) {
  const { updateQuantidadeEntregue, isUpdating } = usePedidos();
  const [itensEntrega, setItensEntrega] = useState<ItemEntrega[]>([]);
  // Estado de string bruta para o campo Un/Cx — evita que o campo
  // seja apagado enquanto o usuário ainda está digitando (ex: "1" → "10")
  const [fatorRaw, setFatorRaw] = useState<string[]>([]);

  useEffect(() => {
    if (pedido?.items) {
      const itens = pedido.items.map(item => {
        const quantidadePedida = item.quantidade_pedida || item.quantity || 1;
        const numUnit = Number(item.valor_unitario_cotado || item.unit_price) || 1;
        const baseUnitCost = numUnit * quantidadePedida;
        const computedFactor = baseUnitCost > 0
          ? Math.round(Number(item.total_price || baseUnitCost) / baseUnitCost)
          : 1;
        const fallbackFator = computedFactor < 1 ? 1 : computedFactor;
        const qtdEmbalagem = item.quantidade_por_embalagem || null;
        const fatorEmbalagem = qtdEmbalagem || fallbackFator;
        const unitStr = item.unidade_pedida || item.unidade_entregue || "un";
        const isBox = isBoxLikeUnit(unitStr);

        return {
          itemId: item.id || "",
          productName: item.product_name,
          quantidadePedida: item.quantidade_pedida || item.quantity,
          unidadePedida: unitStr,
          quantidadeEntregue: item.quantidade_entregue || 0,
          unidadeEntregue: item.unidade_entregue || "kg",
          valorUnitario: item.valor_unitario_cotado || item.unit_price,
          valorFaturado: item.unit_price,
          maiorValor: item.maior_valor_cotado || item.unit_price,
          fatorEmbalagem,
          isBoxUnit: isBox,
          quantidadePorEmbalagemOriginal: qtdEmbalagem,
        };
      });
      setItensEntrega(itens);
      // Inicializa a string bruta: mostra o valor se veio da cotação, vazio caso contrário
      setFatorRaw(itens.map(item =>
        item.quantidadePorEmbalagemOriginal ? String(item.fatorEmbalagem) : ""
      ));
    }
  }, [pedido]);

  const economiaEsperada = useMemo(() =>
    itensEntrega.reduce((sum, item) =>
      item.maiorValor > item.valorUnitario
        ? sum + (item.maiorValor - item.valorUnitario) * item.quantidadePedida * item.fatorEmbalagem
        : sum, 0),
    [itensEntrega]
  );

  const economiaRealPreview = useMemo(() =>
    itensEntrega.reduce((sum, item) =>
      item.quantidadeEntregue > 0 && item.maiorValor > item.valorFaturado
        ? sum + (item.maiorValor - item.valorFaturado) * item.quantidadeEntregue * item.fatorEmbalagem
        : sum, 0),
    [itensEntrega]
  );

  const valorTotalEntregue = useMemo(() =>
    itensEntrega.reduce((sum, item) =>
      sum + item.quantidadeEntregue * item.valorFaturado * item.fatorEmbalagem, 0),
    [itensEntrega]
  );

  const handleQuantidadeChange = (index: number, value: string) => {
    setItensEntrega(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], quantidadeEntregue: parseFloat(value) || 0 };
      return updated;
    });
  };

  const handlePrecoChange = (index: number, value: string) => {
    setItensEntrega(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], valorFaturado: parseFloat(value.replace(",", ".")) || 0 };
      return updated;
    });
  };

  const handleFatorEmbalagemChange = (index: number, value: string) => {
    // Mantém a string bruta para o campo não apagar enquanto o usuário digita
    setFatorRaw(prev => { const u = [...prev]; u[index] = value; return u; });
    const fator = parseFloat(value);
    if (!isNaN(fator) && fator >= 1) {
      setItensEntrega(prev => {
        const updated = [...prev];
        updated[index] = { ...updated[index], fatorEmbalagem: fator };
        return updated;
      });
    }
  };

  const handleMarcarFalta = (index: number) => {
    setItensEntrega(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], quantidadeEntregue: 0 };
      return updated;
    });
  };

  const handleSubmit = async () => {
    if (!pedido) return;
    const itensParaAtualizar = itensEntrega.map(item => ({
      itemId: item.itemId,
      quantidadeEntregue: item.quantidadeEntregue,
      unidadeEntregue: item.unidadeEntregue,
      valorFaturado: item.valorFaturado,
      fatorEmbalagem: item.fatorEmbalagem,
    }));
    if (itensParaAtualizar.length === 0) return;
    try {
      await updateQuantidadeEntregue({ pedidoId: pedido.id, itens: itensParaAtualizar });
      onOpenChange(false);
    } catch (error) {
      console.error("Erro ao registrar entrega:", error);
    }
  };

  const isMobile = useIsMobile();
  const veioDeCotacao = pedido?.quote_id != null;
  const todosPreenchidos = itensEntrega.every(item => item.quantidadeEntregue >= 0);
  const hasBoxItems = itensEntrega.some(item => item.isBoxUnit);
  const fugaEconomia = veioDeCotacao && (economiaEsperada - economiaRealPreview) > 0.05 && todosPreenchidos;

  if (!pedido) return null;

  const modalContent = (
    <div className="flex flex-col flex-1 min-h-0">
        {/* Header */}
        <div className="flex-shrink-0 px-4 sm:px-6 py-4 border-b border-border dark:border-white/5 bg-muted/30 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
            <Truck className="h-4 w-4 text-emerald-600 dark:text-emerald-500" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-bold text-foreground leading-none">
              Registrar Recebimento
            </h2>
            <p className="text-xs text-muted-foreground font-medium mt-1 truncate">
              {pedido.supplier_name}
              <span className="mx-1.5 opacity-40">·</span>
              Pedido #{pedido.id.substring(0, 8)}
            </p>
          </div>
          {veioDeCotacao && (
            <Badge variant="outline" className="shrink-0 text-[9px] bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20 font-bold uppercase tracking-wider">
              Via Cotação
            </Badge>
          )}
          <Button
            variant="ghost" size="icon"
            onClick={() => onOpenChange(false)}
            className="h-8 w-8 text-muted-foreground hover:bg-muted rounded-lg shrink-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
          {/* Aviso: pedido direto sem cotação */}
          {!veioDeCotacao && (
            <div className="flex items-start gap-2.5 p-3 bg-amber-500/10 rounded-xl border border-amber-500/20">
              <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
              <div className="text-xs text-amber-700 dark:text-amber-400">
                <span className="font-bold block">Pedido direto s/ cotação</span>
                <span className="opacity-80">A economia real não será calculada para este registro.</span>
              </div>
            </div>
          )}

          {/* Alerta IA: fuga de economia */}
          {fugaEconomia && (
            <div className="flex items-start gap-4 p-4 bg-amber-500/5 rounded-xl border border-amber-500/20 animate-in fade-in duration-300">
              <div className="p-2 rounded-xl bg-amber-500/10 shrink-0 border border-amber-500/20">
                <Sparkles className="h-4 w-4 text-amber-600" />
              </div>
              <div className="text-sm space-y-1">
                <p className="font-bold text-amber-600 text-[13px]">Alerta Cota Aki AI</p>
                <p className="text-foreground/80 leading-relaxed text-xs">
                  Alterações de preço ou quebra de volume detectadas. Fuga de economia de{" "}
                  <strong className="text-amber-500">
                    R$ {(economiaEsperada - economiaRealPreview).toFixed(2).replace(".", ",")}
                  </strong>{" "}
                  em relação à expectativa base.
                </p>
              </div>
            </div>
          )}

          {/* Tabela de itens */}
          <div className="border border-border dark:border-white/5 rounded-xl overflow-hidden">
            {/* Cabeçalho da tabela (desktop) */}
            <div className="hidden sm:grid gap-2.5 px-4 py-2.5 bg-muted/50 border-b border-border dark:border-white/5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider"
              style={{ gridTemplateColumns: hasBoxItems ? "1fr 100px 120px 1fr 90px" : "1fr 100px 120px 1fr" }}>
              <div>Produto</div>
              <div className="text-right">Custo NFe</div>
              <div className="text-right">Qtd Recebida</div>
              <div className="text-right">Economia</div>
              {hasBoxItems && <div className="text-right">Un/Cx</div>}
            </div>

            <div className="divide-y divide-border dark:divide-white/5">
              {itensEntrega.map((item, index) => {
                const diff = item.quantidadeEntregue - item.quantidadePedida;
                const isDifferent = item.quantidadeEntregue > 0 && Math.abs(diff) > 0.001;
                const isFalta = item.quantidadeEntregue === 0;
                const economiaItem = veioDeCotacao && item.quantidadeEntregue > 0 && item.maiorValor > item.valorFaturado
                  ? (item.maiorValor - item.valorFaturado) * item.quantidadeEntregue * item.fatorEmbalagem
                  : null;

                return (
                  <div key={item.itemId || index} className="px-4 py-3.5 hover:bg-muted/20 transition-colors space-y-3">
                    {/* Produto */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={cn(
                        "w-8 h-8 rounded-lg border flex items-center justify-center shrink-0",
                        item.isBoxUnit ? "bg-amber-500/5 border-amber-500/10" : "bg-brand/5 border-brand/10"
                      )}>
                        {item.isBoxUnit
                          ? <BoxIcon className="h-4 w-4 text-amber-600/70" />
                          : <Package className="h-4 w-4 text-brand/70" />
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm text-foreground truncate">{item.productName}</p>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          <span className="text-xs text-muted-foreground">
                            Pedido: <strong>{item.quantidadePedida} {item.unidadePedida}</strong>
                          </span>
                          {item.isBoxUnit && (
                            <Badge variant="outline" className="h-4 px-1 text-[8px] bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20 font-bold uppercase">
                              Caixa
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Inputs row: Custo NFe | Qtd Recebida | Economia | Un/Caixa? */}
                    <div className="grid gap-2.5 items-start"
                      style={{ gridTemplateColumns: hasBoxItems ? "100px 120px 1fr 90px" : "100px 120px 1fr" }}>

                      {/* Custo NFe */}
                      <div>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5">Custo NFe</p>
                        <div className="relative">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-black text-muted-foreground pointer-events-none">R$</span>
                          <Input
                            type="text" inputMode="decimal"
                            value={item.valorFaturado === 0 ? "" : item.valorFaturado.toFixed(2)}
                            onChange={e => handlePrecoChange(index, e.target.value)}
                            onFocus={e => e.target.select()}
                            placeholder="0,00"
                            className={cn(
                              "h-9 pl-7 pr-1.5 text-right font-black text-sm",
                              item.valorFaturado !== item.valorUnitario
                                ? "border-amber-500/50 bg-amber-500/5 text-amber-600 dark:text-amber-400"
                                : ""
                            )}
                          />
                        </div>
                        {item.valorFaturado !== item.valorUnitario ? (
                          <p className="text-[10px] font-bold mt-1 text-amber-500 text-right leading-none">
                            Cotado: {item.valorUnitario.toFixed(2)}
                          </p>
                        ) : (
                          <div className="mt-1 h-[14px]" />
                        )}
                      </div>

                      {/* Qtd Recebida */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Recebida</p>
                          {!isFalta ? (
                            <button
                              onClick={() => handleMarcarFalta(index)}
                              className="text-[9px] font-bold text-amber-500 hover:text-amber-600 uppercase tracking-tight px-1.5 py-0.5 rounded hover:bg-amber-500/10 transition-colors"
                            >
                              Falta
                            </button>
                          ) : (
                            <span className="text-[9px] font-bold text-red-500 uppercase tracking-tight">Em falta</span>
                          )}
                        </div>
                        <div className="relative">
                          <Input
                            type="number" step="0.01" min="0"
                            value={item.quantidadeEntregue === 0 ? "" : item.quantidadeEntregue}
                            onChange={e => handleQuantidadeChange(index, e.target.value)}
                            onFocus={e => e.target.select()}
                            placeholder="0.00"
                            className={cn(
                              "h-9 pr-9 text-right font-black text-sm",
                              isFalta
                                ? "border-red-500/40 bg-red-500/5 text-red-500"
                                : isDifferent
                                  ? diff > 0
                                    ? "border-blue-500/40 bg-blue-500/5 text-blue-600 dark:text-blue-400"
                                    : "border-amber-500/40 bg-amber-500/5 text-amber-600 dark:text-amber-400"
                                  : ""
                            )}
                          />
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-muted-foreground uppercase pointer-events-none">
                            {item.unidadeEntregue}
                          </span>
                        </div>
                        {isFalta ? (
                          <p className="text-[10px] font-bold mt-1 text-red-500 flex items-center justify-end gap-1 leading-none">
                            <AlertCircle className="h-3 w-3 shrink-0" />Em falta
                          </p>
                        ) : isDifferent ? (
                          <p className={cn("text-[10px] font-bold mt-1 flex items-center justify-end gap-1 leading-none",
                            diff > 0 ? "text-blue-500" : "text-amber-500")}>
                            <AlertCircle className="h-3 w-3 shrink-0" />
                            {diff > 0 ? `+${diff.toFixed(2)}` : `-${Math.abs(diff).toFixed(2)}`}
                          </p>
                        ) : (
                          <div className="mt-1 h-[14px]" />
                        )}
                      </div>

                      {/* Economia por item */}
                      <div>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5">Economia</p>
                        <div className={cn(
                          "h-9 rounded-md border px-3 flex items-center justify-between gap-2",
                          economiaItem !== null
                            ? "bg-emerald-500/5 border-emerald-500/20"
                            : "bg-muted/30 border-border dark:border-white/5"
                        )}>
                          {economiaItem !== null ? (
                            <>
                              <span className="text-[9px] font-bold text-emerald-600/70 dark:text-emerald-500/70 uppercase tracking-wide whitespace-nowrap">
                                Ec. parcial
                              </span>
                              <span className="font-black text-sm text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                                R$ {economiaItem.toFixed(2)}
                              </span>
                            </>
                          ) : (
                            <span className="text-xs text-muted-foreground mx-auto">—</span>
                          )}
                        </div>
                        <div className="mt-1 h-[14px]" />
                      </div>

                      {/* Un/Caixa (condicional) */}
                      {hasBoxItems && (
                        <div>
                          {item.isBoxUnit ? (
                            <>
                              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5">Un/Cx</p>
                              <div className="relative">
                                <Input
                                  type="number" step="0.01" min="1"
                                  value={fatorRaw[index] ?? ""}
                                  onChange={e => handleFatorEmbalagemChange(index, e.target.value)}
                                  onFocus={e => e.target.select()}
                                  placeholder="—"
                                  className={cn(
                                    "h-9 pr-1.5 text-right font-black text-sm",
                                    item.quantidadePorEmbalagemOriginal
                                      ? "bg-emerald-500/5 border-emerald-500/30 text-emerald-700 dark:text-emerald-400"
                                      : item.fatorEmbalagem > 1
                                        ? "bg-amber-500/5 border-amber-500/30 text-amber-700 dark:text-amber-400"
                                        : ""
                                  )}
                                />
                              </div>
                              {item.quantidadePorEmbalagemOriginal ? (
                                <p className="text-[10px] font-medium mt-1 text-emerald-600 dark:text-emerald-500 text-right leading-none">
                                  Cot.: {item.quantidadePorEmbalagemOriginal}
                                </p>
                              ) : (
                                <div className="mt-1 h-[14px]" />
                              )}
                            </>
                          ) : (
                            <div />
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 px-5 py-4 bg-muted/30 border-t border-border dark:border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-8">
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-0.5">Total Recebido</p>
              <p className="font-black text-xl text-foreground tracking-tight">
                R$ {valorTotalEntregue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </p>
            </div>
            {veioDeCotacao && economiaRealPreview > 0 && (
              <div className="pl-8 border-l border-border">
                <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-500 uppercase tracking-widest mb-0.5 flex items-center gap-1">
                  <TrendingDown className="h-3 w-3" />Economia Real
                </p>
                <p className="font-black text-xl text-emerald-600 dark:text-emerald-400 tracking-tight">
                  R$ {economiaRealPreview.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </p>
              </div>
            )}
          </div>

          <div className="flex gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isUpdating}
              className="flex-1 sm:flex-none h-9 px-4 text-xs font-semibold"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!todosPreenchidos || isUpdating}
              className="flex-1 sm:flex-none h-9 px-6 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
            >
              {isUpdating
                ? <><Loader2 className="h-4 w-4 animate-spin" />Salvando...</>
                : <><CheckCircle2 className="h-4 w-4" />Confirmar</>
              }
            </Button>
          </div>
        </div>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="h-[92vh] rounded-t-2xl p-0 overflow-hidden flex flex-col bg-background border-t border-border dark:border-white/5">
          <DrawerTitle className="sr-only">Registrar Recebimento</DrawerTitle>
          <DrawerDescription className="sr-only">Registre as quantidades recebidas</DrawerDescription>
          {modalContent}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        hideClose
        className="w-[95vw] max-w-[720px] max-h-[90vh] overflow-hidden flex flex-col p-0 gap-0 rounded-2xl border border-border dark:border-white/5 shadow-2xl bg-background [&>button]:hidden"
      >
        <DialogTitle className="sr-only">Registrar Recebimento</DialogTitle>
        <DialogDescription className="sr-only">Registre as quantidades recebidas</DialogDescription>
        {modalContent}
      </DialogContent>
    </Dialog>
  );
}
