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
  Loader2, CheckCircle2, AlertCircle, X 
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
  maiorValor: number;
}

export function RegistrarEntregaDialog({ open, onOpenChange, pedido }: Props) {
  const { updateQuantidadeEntregue, isUpdating } = usePedidos();
  const [itensEntrega, setItensEntrega] = useState<ItemEntrega[]>([]);

  // Inicializar itens quando o pedido mudar
  useEffect(() => {
    if (pedido?.items) {
      setItensEntrega(
        pedido.items.map(item => ({
          itemId: item.id || '',
          productName: item.product_name,
          quantidadePedida: item.quantidade_pedida || item.quantity,
          unidadePedida: item.unidade_pedida || 'un',
          quantidadeEntregue: item.quantidade_entregue || 0,
          unidadeEntregue: item.unidade_entregue || 'kg',
          valorUnitario: item.valor_unitario_cotado || item.unit_price,
          maiorValor: item.maior_valor_cotado || item.unit_price,
        }))
      );
    }
  }, [pedido]);

  // Calcular economia estimada (preview)
  const economiaPreview = useMemo(() => {
    return itensEntrega.reduce((sum, item) => {
      if (item.quantidadeEntregue > 0 && item.maiorValor > item.valorUnitario) {
        const diferenca = item.maiorValor - item.valorUnitario;
        return sum + (diferenca * item.quantidadeEntregue);
      }
      return sum;
    }, 0);
  }, [itensEntrega]);

  // Valor total baseado na quantidade entregue
  const valorTotalEntregue = useMemo(() => {
    return itensEntrega.reduce((sum, item) => {
      return sum + (item.quantidadeEntregue * item.valorUnitario);
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

  const handleSubmit = async () => {
    if (!pedido) return;

    const itensParaAtualizar = itensEntrega
      .filter(item => item.itemId && item.quantidadeEntregue > 0)
      .map(item => ({
        itemId: item.itemId,
        quantidadeEntregue: item.quantidadeEntregue,
        unidadeEntregue: item.unidadeEntregue,
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

  const veioDeCotacao = pedido?.quote_id != null;
  const todosPreenchidos = itensEntrega.every(item => item.quantidadeEntregue > 0);

  if (!pedido) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-hidden flex flex-col p-0 gap-0 border border-white/20 dark:border-white/10 shadow-2xl rounded-xl !bg-white/80 dark:!bg-gray-950/80 backdrop-blur-xl [&>button]:hidden">
        <DialogHeader className="px-6 py-5 border-b border-white/10 dark:border-white/5 bg-white/20 dark:bg-white/5 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                <Truck className="h-6 w-6" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
                  Registrar Recebimento
                </DialogTitle>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-0.5">
                  Confirme os produtos e quantidades recebidas
                </p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)} className="h-9 w-9 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-white/10 dark:hover:bg-white/5 rounded-full transition-all">
              <X className="h-5 w-5" />
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col p-0">
          <div className="p-6 space-y-6 flex-1 overflow-y-auto custom-scrollbar">
            {/* Info do Pedido */}
            <div className="flex items-center justify-between p-4 bg-white/40 dark:bg-gray-900/40 rounded-2xl border border-white/20 dark:border-white/10 backdrop-blur-md shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gray-500/10 flex items-center justify-center border border-white/10">
                  <Package className="h-5 w-5 text-gray-500" />
                </div>
                <div>
                  <p className="font-bold text-sm text-gray-900 dark:text-white tracking-tight leading-none">{pedido.supplier_name}</p>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest mt-1.5">
                    Pedido #{pedido.id.substring(0, 8)}
                  </p>
                </div>
              </div>
              {veioDeCotacao ? (
                <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20 font-bold uppercase tracking-tighter text-[10px] px-2.5 h-6 rounded-lg">
                  <TrendingDown className="h-3 w-3 mr-1.5" />
                  Via Cotação
                </Badge>
              ) : (
                <Badge variant="secondary" className="bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20 font-bold uppercase tracking-tighter text-[10px] px-2.5 h-6 rounded-lg">Pedido Direto</Badge>
              )}
            </div>

            {/* Aviso se não veio de cotação */}
            {!veioDeCotacao && (
              <div className="flex items-start gap-3 p-4 bg-amber-500/5 dark:bg-amber-900/10 rounded-2xl border border-amber-500/10 backdrop-blur-sm">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="text-xs text-amber-700 dark:text-amber-300 font-medium leading-relaxed">
                  <p className="font-bold uppercase tracking-wider mb-0.5">Sem histórico de cotação</p>
                  <p className="opacity-70">Este pedido foi criado manualmente. A economia real não poderá ser calculada para este registro.</p>
                </div>
              </div>
            )}

            {/* Lista de Itens */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 px-1">
                <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em]">Itens para Conferência</span>
                <div className="h-px flex-1 bg-white/10 dark:bg-white/5"></div>
              </div>

              {itensEntrega.map((item, index) => {
                const diff = item.quantidadeEntregue - item.quantidadePedida;
                const isDifferent = item.quantidadeEntregue > 0 && Math.abs(diff) > 0.001;
                
                return (
                  <Card key={item.itemId || index} className="overflow-hidden border border-white/20 dark:border-white/10 bg-white/40 dark:bg-gray-900/40 backdrop-blur-md shadow-sm rounded-2xl group hover:border-emerald-500/30 transition-all duration-300">
                    <CardContent className="p-0">
                      <div className="p-4 border-b border-white/5 bg-white/5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center flex-shrink-0 border border-orange-500/20 group-hover:scale-110 transition-transform duration-500">
                            <Package className="h-5 w-5 text-orange-600" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-bold text-sm text-gray-900 dark:text-white truncate tracking-tight">{item.productName}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest">
                                Pedida: <span className="text-gray-900 dark:text-gray-200">{item.quantidadePedida} {item.unidadePedida}</span>
                              </span>
                              {veioDeCotacao && item.maiorValor > item.valorUnitario && (
                                <Badge variant="outline" className="h-4 px-1.5 text-[8px] bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 border-emerald-500/10 font-bold uppercase">
                                  Economia: R$ {(item.maiorValor - item.valorUnitario).toFixed(2)}/{item.unidadeEntregue}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="p-4 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest block pl-1">Qtd Recebida</Label>
                            <div className="relative">
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                value={item.quantidadeEntregue || ''}
                                onChange={(e) => handleQuantidadeChange(index, e.target.value)}
                                placeholder="0.00"
                                className="h-11 pr-10 bg-white/40 dark:bg-gray-950/40 border-white/20 dark:border-white/10 font-black text-sm focus:ring-emerald-500/20 rounded-xl transition-all"
                              />
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-400 uppercase">{item.unidadeEntregue}</span>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest block pl-1">Preço Unitário</Label>
                            <div className="h-11 px-4 flex items-center bg-gray-500/5 dark:bg-white/5 border border-white/10 rounded-xl text-sm font-bold text-gray-700 dark:text-gray-300">
                              R$ {item.valorUnitario.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </div>
                          </div>
                        </div>

                        {item.quantidadeEntregue > 0 && (
                          <div className="pt-3 border-t border-white/5 flex justify-between items-center animate-in fade-in slide-in-from-top-1 duration-300">
                            <div className="flex flex-col gap-0.5">
                              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Subtotal do Item</span>
                              {isDifferent && (
                                <span className={cn("text-[9px] font-bold uppercase tracking-tight", diff > 0 ? "text-blue-500" : "text-amber-500")}>
                                  {diff > 0 ? `+${diff.toFixed(2)}` : diff.toFixed(2)} {item.unidadeEntregue} que o pedido
                                </span>
                              )}
                            </div>
                            <span className="font-black text-emerald-600 dark:text-emerald-400 text-lg tracking-tight">
                              R$ {(item.quantidadeEntregue * item.valorUnitario).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>

          {/* Resumo Final */}
          <div className="p-6 bg-white/20 dark:bg-gray-950/40 border-t border-white/10 dark:border-white/5 space-y-4 backdrop-blur-md">
            <div className="flex justify-between items-end px-1">
              <div className="space-y-1">
                <span className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.15em]">Total Recebido</span>
                <p className="text-[10px] text-gray-400 font-medium">Baseado nas quantidades informadas</p>
              </div>
              <span className="font-black text-3xl text-gray-900 dark:text-white tracking-tighter">
                R$ {valorTotalEntregue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
            
            {veioDeCotacao && economiaPreview > 0 && (
              <div className="relative group overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 dark:from-emerald-500/10 dark:to-teal-500/10 blur-xl group-hover:scale-110 transition-transform duration-700"></div>
                <div className="relative flex justify-between items-center p-5 bg-emerald-500/10 dark:bg-emerald-900/20 rounded-2xl border border-emerald-500/20 backdrop-blur-md shadow-inner">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                      <TrendingDown className="h-5 w-5" />
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-widest">
                        Economia Real Obtida
                      </span>
                      <p className="text-[10px] text-emerald-600/70 dark:text-emerald-400/50 font-bold uppercase tracking-tight">Resultado da sua cotação</p>
                    </div>
                  </div>
                  <span className="font-black text-3xl text-emerald-600 dark:text-emerald-400 tracking-tighter">
                    R$ {economiaPreview.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-5 border-t border-white/10 dark:border-white/5 bg-white/20 dark:bg-gray-950/20 backdrop-blur-md">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)} 
            disabled={isUpdating}
            className="h-12 px-8 border-white/20 dark:border-white/10 bg-transparent font-bold text-xs uppercase tracking-[0.15em] hover:bg-white/10 dark:hover:bg-white/5 transition-all rounded-xl"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!todosPreenchidos || isUpdating}
            className="h-12 px-10 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs uppercase tracking-[0.15em] shadow-lg shadow-emerald-500/20 transition-all active:scale-[0.98] rounded-xl"
          >
            {isUpdating ? (
              <>
                <Loader2 className="h-4 w-4 mr-3 animate-spin" />
                Processando...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4 mr-3" />
                Confirmar Recebimento
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
