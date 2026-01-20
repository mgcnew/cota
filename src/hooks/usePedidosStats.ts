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
    const pedidosEntregues = pedidos.filter(p => p.status === "entregue").length;
    const pedidosValidos = pedidos.filter(p => p.status !== "cancelado");
    const totalValue = pedidosValidos.reduce((acc, p) => {
      const cleanValue = p.total.replace("R$ ", "").replace(/\./g, "").replace(",", ".");
      return acc + (parseFloat(cleanValue) || 0);
    }, 0);
    
    // Economia real (pedidos entregues que vieram de cotação)
    const economiaReal = pedidos
      .filter(p => p.status === "entregue" && p.quote_id)
      .reduce((sum, p) => sum + (p.economia_real || 0), 0);
    
    return {
      pedidosAtivos,
      pedidosEntregues,
      totalValueFormatado: totalValue > 0 ? totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'R$ 0,00',
      economiaReal,
      economiaRealFormatada: economiaReal > 0 ? `R$ ${economiaReal.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}` : 'R$ 0'
    };
  }, [pedidos]);
}
