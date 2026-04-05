import { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Truck, Package, DollarSign, TrendingDown, 
  Loader2, CheckCircle2, AlertCircle, X, Sparkles 
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
  valorUnitario: number; // Preço acordado originalmente
  valorFaturado: number; // Preço real cobrado na NFe
  maiorValor: number; // Teto para cálculo da economia
  fatorEmbalagem: number; // Fator de caixa (implícito pelo total_price vs unit_price)
}

export function RegistrarEntregaDialog({ open, onOpenChange, pedido }: Props) {
  const { updateQuantidadeEntregue, isUpdating } = usePedidos();
  const [itensEntrega, setItensEntrega] = useState<ItemEntrega[]>([]);

  // Inicializar itens quando o pedido mudar
  useEffect(() => {
    if (pedido?.items) {
      setItensEntrega(
        pedido.items.map(item => {
          const quantidadePedida = item.quantidade_pedida || item.quantity || 1;
          const numUnit = Number(item.valor_unitario_cotado || item.unit_price) || 1;
          const baseUnitCost = numUnit * quantidadePedida;
          const computedFactor = baseUnitCost > 0 ? Math.round(Number(item.total_price || baseUnitCost) / baseUnitCost) : 1;
          const fatorEmbalagem = computedFactor < 1 ? 1 : computedFactor;

          return {
            itemId: item.id || '',
            productName: item.product_name,
            quantidadePedida: item.quantidade_pedida || item.quantity,
            unidadePedida: item.unidade_pedida || 'un',
            quantidadeEntregue: item.quantidade_entregue || 0,
            unidadeEntregue: item.unidade_entregue || 'kg',
            valorUnitario: item.valor_unitario_cotado || item.unit_price,
            valorFaturado: item.unit_price, // Iniciamos com o valor que estava no pedido (que já pode ter sido alterado da cotação)
            maiorValor: item.maior_valor_cotado || item.unit_price,
            fatorEmbalagem,
          };
        })
      );
    }
  }, [pedido]);

  // Calcular economia que seria feita
  const economiaEsperada = useMemo(() => {
    return itensEntrega.reduce((sum, item) => {
      if (item.maiorValor > item.valorUnitario) {
        return sum + ((item.maiorValor - item.valorUnitario) * item.quantidadePedida * item.fatorEmbalagem);
      }
      return sum;
    }, 0);
  }, [itensEntrega]);

  // Calcular economia real considerando quebra/excesso e preço NFe
  const economiaRealPreview = useMemo(() => {
    return itensEntrega.reduce((sum, item) => {
      if (item.quantidadeEntregue > 0 && item.maiorValor > item.valorFaturado) {
        const diferenca = item.maiorValor - item.valorFaturado;
        return sum + (diferenca * item.quantidadeEntregue * item.fatorEmbalagem);
      }
      return sum;
    }, 0);
  }, [itensEntrega]);

  // Valor total baseado na quantidade entregue multiplicada pelo valor REAL da Nfe
  const valorTotalEntregue = useMemo(() => {
    return itensEntrega.reduce((sum, item) => {
      return sum + (item.quantidadeEntregue * item.valorFaturado * item.fatorEmbalagem);
    }, 0);
  }, [itensEntrega]);

  const handleQuantidadeChange = (index: number, value: string) => {
    const quantidade = parseFloat(value) || 0;
    setItensEntrega(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], quantidadeEntregue: quantidade };
      return updated;
    });
  };

  const handlePrecoChange = (index: number, value: string) => {
    const preco = parseFloat(value) || 0;
    setItensEntrega(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], valorFaturado: preco };
      return updated;
    });
  };

  const handleSubmit = async () => {
    if (!pedido) return;

    // Agora permitimos enviar itens com quantidade zero (representa FALTA)
    const itensParaAtualizar = itensEntrega
      .map(item => ({
        itemId: item.itemId,
        quantidadeEntregue: item.quantidadeEntregue,
        unidadeEntregue: item.unidadeEntregue,
        valorFaturado: item.valorFaturado,
        fatorEmbalagem: item.fatorEmbalagem,
      }));

    if (itensParaAtualizar.length === 0) return;

    try {
      await updateQuantidadeEntregue({
        pedidoId: pedido.id,
        itens: itensParaAtualizar,
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao registrar entrega:', error);
    }
  };

  const handleMarcarFalta = (index: number) => {
    setItensEntrega(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], quantidadeEntregue: 0 };
      return updated;
    });
  };

  const veioDeCotacao = pedido?.quote_id != null;
  // Agora validamos se os campos foram manipulados/conferidos, mesmo que zerados
  const todosPreenchidos = itensEntrega.every(item => item.quantidadeEntregue >= 0);

  if (!pedido) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-0 gap-0 border border-border shadow-2xl rounded-xl bg-card">
        {/* Header Compacto */}
        <DialogHeader className="px-5 py-4 border-b border-border bg-muted/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-500">
                <Truck className="h-4 w-4" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-foreground tracking-tight flex items-center gap-2">
                  Registrar Recebimento
                  {veioDeCotacao && (
                    <Badge variant="outline" className="h-[18px] px-1.5 text-[9px] bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20 font-bold uppercase tracking-wider">
                      Via Cotação
                    </Badge>
                  )}
                </DialogTitle>
                <p className="text-xs text-muted-foreground font-medium mt-0.5">
                  {pedido.supplier_name} <span className="mx-1 opacity-50">•</span> Pedido #{pedido.id.substring(0, 8)}
                </p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)} className="h-8 w-8 text-muted-foreground hover:bg-muted rounded-full">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 flex flex-col p-5 overflow-y-auto custom-scrollbar">
          {/* Aviso se não veio de cotação */}
          {!veioDeCotacao && (
            <div className="flex items-start gap-2 p-3 mb-4 bg-amber-500/10 rounded-lg border border-amber-500/20">
              <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5" />
              <div className="text-xs text-amber-700 dark:text-amber-400">
                <span className="font-semibold block">Pedido direto s/ cotação</span>
                <span className="opacity-80">A economia real não será calculada para este registro.</span>
              </div>
            </div>
          )}

          {/* Alerta de IA: Fuga de Economia */}
          {veioDeCotacao && (economiaEsperada - economiaRealPreview) > 0.05 && todosPreenchidos && (
            <div className="flex items-start gap-4 p-4 mb-4 bg-amber-500/5 rounded-xl border border-amber-500/20 shadow-sm animate-in fade-in duration-500">
              <div className="p-2.5 rounded-xl bg-amber-500/10 shrink-0 border border-amber-500/20">
                <Sparkles className="h-5 w-5 text-amber-600" />
              </div>
              <div className="text-sm space-y-1">
                <p className="font-bold flex items-center gap-1.5 text-amber-600 tracking-tight text-[15px]">
                  Alerta Cota Aki AI
                </p>
                <p className="font-medium text-foreground/80 leading-relaxed pr-4">
                  Observamos alterações de preço cobrado ou quebras de volume neste faturamento. Você terá uma <strong className="text-amber-500 font-bold">fuga de economia de R$ {(economiaEsperada - economiaRealPreview).toFixed(2).replace('.', ',')}</strong> na consolidação em relação à expectativa base.
                </p>
              </div>
            </div>
          )}

          {/* Lista Compacta de Itens */}
          <div className="border border-border rounded-lg overflow-hidden bg-card shadow-sm">
            <div className="hidden sm:grid grid-cols-12 gap-4 p-3 bg-muted/50 border-b border-border text-[10px] font-bold text-muted-foreground uppercase tracking-wider items-center">
              <div className="col-span-5">Produto Pedido</div>
              <div className="col-span-2 text-right">Qtd Pedida</div>
              <div className="col-span-2 text-right">Custo NFe / Unit</div>
              <div className="col-span-3 text-right pr-2">Qtd Recebida</div>
            </div>
            
            <div className="divide-y divide-border">
            {itensEntrega.map((item, index) => {
              const diff = item.quantidadeEntregue - item.quantidadePedida;
              const isDifferent = item.quantidadeEntregue > 0 && Math.abs(diff) > 0.001;
              
              return (
                <div key={item.itemId || index} className="grid sm:grid-cols-12 gap-3 sm:gap-4 p-3 sm:items-center hover:bg-muted/30 transition-colors">
                  <div className="sm:col-span-5 flex items-start sm:items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-brand/5 border border-brand/10 flex items-center justify-center shrink-0 mt-1 sm:mt-0">
                      <Package className="h-4 w-4 text-brand/70" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-sm text-foreground tracking-tight leading-none mb-1.5" title={item.productName}>
                        {item.productName}
                      </p>
                      {veioDeCotacao && item.maiorValor > item.valorUnitario && (
                        <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                          Econ. R$ {((item.maiorValor - item.valorUnitario) * item.fatorEmbalagem).toFixed(2)}/{item.unidadeEntregue}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="sm:col-span-2 flex flex-col sm:items-end justify-center pt-2 sm:pt-0 border-t sm:border-0 border-border/50 mt-2 sm:mt-0">
                    <p className="sm:hidden text-[10px] text-muted-foreground uppercase font-bold tracking-widest mb-0.5">Qtd Pedida</p>
                    <span className="font-semibold text-foreground text-sm">{item.quantidadePedida} <span className="text-xs text-muted-foreground uppercase ml-0.5">{item.unidadePedida}</span></span>
                  </div>

                  <div className="sm:col-span-2 flex flex-col sm:items-end justify-center pt-2 sm:pt-0">
                    <p className="sm:hidden text-[10px] text-emerald-500 uppercase font-bold tracking-widest mb-1">Custo NFe</p>
                    <div className="relative w-full max-w-[120px] ml-auto">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] font-black text-muted-foreground uppercase pointer-events-none">
                        R$
                      </span>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={item.valorFaturado === 0 ? '' : item.valorFaturado}
                        onChange={(e) => handlePrecoChange(index, e.target.value)}
                        onFocus={(e) => e.target.select()}
                        placeholder="0.00"
                        className={cn(
                          "h-10 pl-8 pr-2 w-full text-right font-black text-sm transition-all focus-within:ring-1",
                          item.valorFaturado !== item.valorUnitario ? "border-amber-500/50 focus-visible:ring-amber-500/30 bg-amber-500/5 text-amber-600 dark:text-amber-400" : "bg-background"
                        )}
                      />
                    </div>
                    {item.valorFaturado !== item.valorUnitario && (
                       <span className="text-[10px] font-bold mt-1 text-amber-500 text-right w-full block">
                         Cotado: R$ {item.valorUnitario.toFixed(2)}
                       </span>
                    )}
                    {item.valorFaturado === item.valorUnitario && (
                       <span className="opacity-0 text-[10px] font-bold mt-1 text-right w-full block">
                         -
                       </span>
                    )}
                  </div>

                  <div className="sm:col-span-3 flex flex-col justify-center pt-2 sm:pt-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="sm:hidden text-[10px] text-emerald-500 uppercase font-bold tracking-widest">Recebida</p>
                      <button 
                        onClick={() => handleMarcarFalta(index)}
                        className="text-[9px] font-bold text-amber-600 hover:text-amber-700 uppercase tracking-tighter"
                      >
                        Marcar Falta
                      </button>
                    </div>
                    <div className="relative w-full">
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={item.quantidadeEntregue === 0 ? '' : item.quantidadeEntregue}
                        onChange={(e) => handleQuantidadeChange(index, e.target.value)}
                        onFocus={(e) => e.target.select()}
                        placeholder="0.00"
                        className={cn(
                          "h-10 pr-10 text-right font-black text-sm transition-all",
                          item.quantidadeEntregue === 0 ? "border-red-500/50 bg-red-500/5 text-red-600" :
                          isDifferent ? (diff > 0 ? "border-blue-500/50 focus-visible:ring-blue-500/30 bg-blue-500/5 text-blue-600 dark:text-blue-400" : "border-amber-500/50 focus-visible:ring-amber-500/30 bg-amber-500/5 text-amber-600 dark:text-amber-400") : "bg-background"
                        )}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-muted-foreground uppercase pointer-events-none">
                        {item.unidadeEntregue}
                      </span>
                    </div>
                    {item.quantidadeEntregue === 0 && (
                       <span className="text-[10px] font-bold mt-1.5 text-right text-red-500 flex items-center justify-end gap-1 uppercase tracking-tighter">
                         <X className="h-3 w-3" />
                         Produto em Falta
                       </span>
                    )}
                    {item.quantidadeEntregue > 0 && isDifferent && (
                       <span className={cn("text-[10px] font-bold mt-1.5 text-right flex items-center justify-end gap-1", diff > 0 ? "text-blue-500" : "text-amber-500")}>
                         <AlertCircle className="h-3 w-3" />
                         {diff > 0 ? `Sobrou ${diff.toFixed(2)}` : `Faltou ${Math.abs(diff).toFixed(2)}`}
                       </span>
                    )}
                  </div>
                </div>
              )
            })}
            </div>
          </div>
        </div>

        {/* Resumo Final e Ações Footer */}
        <div className="px-5 py-4 bg-muted/30 border-t border-border flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-8 flex-1">
            <div>
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-0.5">Total Recebido</span>
              <span className="font-black text-2xl text-foreground tracking-tight">
                R$ {valorTotalEntregue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
            
            {veioDeCotacao && economiaRealPreview > 0 && (
              <div className="pl-0 sm:pl-8 border-l-0 sm:border-l border-border relative">
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-500 uppercase tracking-widest block mb-0.5 flex items-center gap-1">
                  <TrendingDown className="h-3 w-3" /> Economia Real Obtida
                </span>
                <span className="font-black text-2xl text-emerald-600 dark:text-emerald-400 tracking-tight">
                  R$ {economiaRealPreview.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            )}
          </div>

          <div className="flex gap-2 w-full sm:w-auto mt-2 sm:mt-0">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)} 
              disabled={isUpdating}
              className="h-10 px-4 text-xs font-semibold flex-1 sm:flex-none"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!todosPreenchidos || isUpdating}
              className="h-10 px-6 text-xs font-bold flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
            >
              {isUpdating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Confirmar
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
