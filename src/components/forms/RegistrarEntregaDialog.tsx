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
  Loader2, CheckCircle2, AlertCircle 
} from "lucide-react";
import { usePedidos, type Pedido } from "@/hooks/usePedidos";

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
      <DialogContent className="max-w-lg max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5 text-emerald-600" />
            Registrar Entrega
          </DialogTitle>
          <DialogDescription>
            Informe a quantidade real entregue para cada item (conforme nota fiscal)
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col gap-4">
          {/* Info do Pedido */}
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div>
              <p className="font-medium text-sm">{pedido.supplier_name}</p>
              <p className="text-xs text-muted-foreground">
                Pedido #{pedido.id.substring(0, 8)}
              </p>
            </div>
            {veioDeCotacao ? (
              <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
                <TrendingDown className="h-3 w-3 mr-1" />
                Via Cotação
              </Badge>
            ) : (
              <Badge variant="secondary">Pedido Direto</Badge>
            )}
          </div>

          {/* Aviso se não veio de cotação */}
          {!veioDeCotacao && (
            <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200">
              <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5" />
              <div className="text-xs text-amber-700 dark:text-amber-300">
                <p className="font-medium">Pedido direto (sem cotação)</p>
                <p>A economia não será calculada pois não há comparação de preços.</p>
              </div>
            </div>
          )}

          {/* Lista de Itens */}
          <ScrollArea className="flex-1 pr-2">
            <div className="space-y-3">
              {itensEntrega.map((item, index) => (
                <Card key={item.itemId || index} className="overflow-hidden">
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center flex-shrink-0">
                          <Package className="h-4 w-4 text-orange-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">{item.productName}</p>
                          <p className="text-xs text-muted-foreground">
                            Pedido: {item.quantidadePedida} {item.unidadePedida}
                            {veioDeCotacao && item.maiorValor > item.valorUnitario && (
                              <span className="ml-2 text-emerald-600">
                                • Economia: R$ {(item.maiorValor - item.valorUnitario).toFixed(2)}/{item.unidadeEntregue}
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs text-muted-foreground">Qtd Entregue</Label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.quantidadeEntregue || ''}
                          onChange={(e) => handleQuantidadeChange(index, e.target.value)}
                          placeholder="0.00"
                          className="h-9 mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Valor Unit.</Label>
                        <div className="h-9 mt-1 px-3 flex items-center bg-gray-100 dark:bg-gray-800 rounded-md text-sm">
                          R$ {item.valorUnitario.toFixed(2)}
                        </div>
                      </div>
                    </div>

                    {item.quantidadeEntregue > 0 && (
                      <div className="mt-2 pt-2 border-t flex justify-between text-xs">
                        <span className="text-muted-foreground">Subtotal:</span>
                        <span className="font-semibold text-emerald-600">
                          R$ {(item.quantidadeEntregue * item.valorUnitario).toFixed(2)}
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>

          {/* Resumo */}
          <div className="space-y-2 pt-2 border-t">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Valor Total Entregue:</span>
              <span className="font-bold text-lg">
                R$ {valorTotalEntregue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
            
            {veioDeCotacao && economiaPreview > 0 && (
              <div className="flex justify-between items-center p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                <div className="flex items-center gap-2">
                  <TrendingDown className="h-4 w-4 text-emerald-600" />
                  <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                    Economia Real:
                  </span>
                </div>
                <span className="font-bold text-lg text-emerald-600">
                  R$ {economiaPreview.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!todosPreenchidos || isUpdating}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            {isUpdating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Confirmar Entrega
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
