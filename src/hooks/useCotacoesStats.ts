import { useMemo } from 'react';
import { Quote } from '@/hooks/useCotacoes';
import { Pedido } from '@/hooks/usePedidos';

export function useCotacoesStats(cotacoes: Quote[], pedidos: Pedido[]) {
  return useMemo(() => {
    const ativas = cotacoes.filter(c => c.statusReal === "ativa").length;
    const pendentes = cotacoes.filter(c => c.status === "pendente").length;
    
    // Cotações prontas para decisão (todos fornecedores responderam)
    const prontasParaDecisao = cotacoes.filter(c => {
      if (c.statusReal !== "ativa") return false;
      const fornecedoresRespondidos = c.fornecedoresParticipantes?.filter(f => f.status === "respondido").length || 0;
      const totalFornecedores = c.fornecedoresParticipantes?.length || 0;
      return totalFornecedores > 0 && fornecedoresRespondidos === totalFornecedores;
    }).length;
    
    // Cotações vencendo em 48h
    const hoje = new Date();
    const em48h = new Date(hoje.getTime() + 48 * 60 * 60 * 1000);
    const vencendo = cotacoes.filter(c => {
      if (c.statusReal !== "ativa") return false;
      const dataFim = new Date(c.dataFim.split('/').reverse().join('-'));
      return dataFim <= em48h && dataFim >= hoje;
    }).length;
    
    // Calcular economia dos pedidos que vieram de cotações
    const pedidosDeCotacao = pedidos.filter(p => p.quote_id);
    
    // Economia REAL = soma de economia_real dos pedidos entregues
    const economiaReal = pedidosDeCotacao
      .filter(p => p.status === 'entregue')
      .reduce((sum, p) => sum + (p.economia_real || 0), 0);
    
    // Economia ESTIMADA = soma de economia_estimada de todos os pedidos de cotação
    const economiaEstimada = pedidosDeCotacao
      .reduce((sum, p) => sum + (p.economia_estimada || 0), 0);
    
    return { 
      ativas, 
      pendentes,
      prontasParaDecisao,
      vencendo,
      economiaReal,
      economiaEstimada,
      economiaRealFormatada: economiaReal > 0 ? `R$ ${economiaReal.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}` : "R$ 0",
      economiaEstimadaFormatada: economiaEstimada > 0 ? `R$ ${economiaEstimada.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}` : "R$ 0"
    };
  }, [cotacoes, pedidos]);
}
