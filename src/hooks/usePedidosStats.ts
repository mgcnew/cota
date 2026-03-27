import { useMemo } from 'react';
import { Pedido } from '@/hooks/usePedidos';

// Interface OrderData matching the one in PedidosTab
export interface OrderData {
  id: string;
  fornecedor: string;
  total: string;
  status: string;
  dataPedido: string;
  dataEntrega: string;
  itens: number;
  produtos: string[];
  observacoes: string;
  detalhesItens: Array<{ produto: string; quantidade: number; valorUnitario: number }>;
  supplier_id: string | null;
  delivery_date: string | null;
  quote_id: string | null;
  economia_estimada: number;
  economia_real: number;
  _raw?: Pedido;
}

export function usePedidosStats(pedidos: OrderData[]) {
  return useMemo(() => {
    const pedidosAtivos = pedidos.filter(p => p.status === "pendente" || p.status === "processando").length;
    const pedidosEntreguesCount = pedidos.filter(p => p.status === "entregue").length;
    const pedidosValidos = pedidos.filter(p => p.status !== "cancelado");
    
    const totalValue = pedidosValidos.reduce((acc, p) => {
      const cleanValue = p.total.replace("R$ ", "").replace(/\./g, "").replace(",", ".");
      return acc + (parseFloat(cleanValue) || 0);
    }, 0);
    
    // Economia REAL = Diferença entre o maior preço de mercado e o preço faturado final
    const economiaRealTotal = pedidos
      .filter(p => p.status === "entregue" && p.quote_id)
      .reduce((sum, p) => sum + (p.economia_real || 0), 0);

    // Variação de Faturamento = (Preço Faturado - Preço Negociado) * Qtd Entregue
    // Esse número mostra se o fornecedor cobrou MAIS na nota do que o combinado na cotação
    let variacaoFaturadoTotal = 0;
    
    pedidos.filter(p => p.status === "entregue").forEach(p => {
      const items = p._raw?.items || [];
      items.forEach(item => {
        if (item.quantidade_entregue && item.unit_price && item.valor_unitario_cotado) {
          const diff = item.unit_price - item.valor_unitario_cotado;
          // Se diff > 0, pagamos mais. Se diff < 0, pagamos menos que o negociado.
          variacaoFaturadoTotal += diff * item.quantidade_entregue;
        }
      });
    });
    
    return {
      pedidosAtivos,
      pedidosEntregues: pedidosEntreguesCount,
      totalValueFormatado: totalValue > 0 ? totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'R$ 0,00',
      economiaReal: economiaRealTotal,
      variacaoFaturadoTotal,
      economiaRealFormatada: `R$ ${economiaRealTotal.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`,
      variacaoFaturadoFormatada: `R$ ${Math.abs(variacaoFaturadoTotal).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      variacaoType: variacaoFaturadoTotal > 0 ? 'negative' : 'positive' as 'negative' | 'positive' | 'neutral'
    };
  }, [pedidos]);
}
