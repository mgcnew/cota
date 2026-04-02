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
      const [df, mf, yf] = c.dataFim.split(/[\/-]/).map(Number);
      const dataFim = new Date(yf, mf - 1, df);
      return dataFim <= em48h && dataFim >= hoje;
    }).length;

    // --- NOVA MÉTRICA: ECONOMIA DE NEGOCIAÇÃO (TRABALHO DE REDUÇÃO) ---
    // Diferente da economia em pedidos, essa aqui mede o recuo dos preços nas cotações ATIVAS e CONCLUÍDAS
    let economiaNegotiated = 0;
    let totalEsperado = 0;
    let totalRecebido = 0;

    cotacoes.forEach(quote => {
      const raw = quote as any;
      const supplierItems = raw._raw?.quote_supplier_items || raw._supplierItems || [];
      const quoteItems = raw._raw?.quote_items || [];
      const participants = quote.fornecedoresParticipantes || [];
      
      // Estatísticas de Adesão
      totalEsperado += participants.length;
      totalRecebido += participants.filter(f => f.status === 'respondido').length;

      // Cálculo de Economia por Negociação (De -> Por)
      quoteItems.forEach((qi: any) => {
        let bestPrice = 0;
        let winnerId = null;

        participants.forEach((f: any) => {
          const si = supplierItems.find((i: any) => i?.supplier_id === f.id && i?.product_id === qi.product_id);
          const val = si?.valor_oferecido || 0;
          if (val > 0 && (bestPrice === 0 || val < bestPrice)) {
            bestPrice = val;
            winnerId = f.id;
          }
        });

        if (winnerId) {
        const winnerItem = supplierItems.find((i: any) => i?.supplier_id === winnerId && i?.product_id === qi.product_id);
        
        // A base para economia é o PRIMEIRO valor que o fornecedor mandou (valor_inicial)
        // Se não houver valor_inicial (caso legado), recai no primeiro do price_history
        const firstPrice = Number(winnerItem?.valor_inicial) || 
                          (winnerItem?.price_history && winnerItem.price_history.length > 0 ? Number(winnerItem.price_history[0].old_price) : 0);
        
        const finalPrice = Number(winnerItem?.valor_oferecido) || 0;

        if (firstPrice > 0 && finalPrice > 0 && firstPrice > finalPrice) {
          const qtyStr = qi.quantidade?.toString() || '0';
          const quantity = parseFloat(qtyStr.replace(',', '.')) || 0;
          economiaNegotiated += (firstPrice - finalPrice) * quantity;
        }
        }
      });
    });

    const percentualAdesao = totalEsperado > 0 ? (totalRecebido / totalEsperado) * 100 : 0;
    
    // Calcular economia dos pedidos que vieram de cotações
    const pedidosDeCotacao = pedidos.filter(p => p.quote_id);
    
    // Economia REAL = soma de economia_real dos pedidos que já foram confirmados ou entregues
    const economiaRealPedidos = pedidosDeCotacao
      .reduce((sum, p) => sum + (p.economia_real || 0), 0);
    
    // Economia ESTIMADA (Melhor vs Pior do mercado na cotação)
    const economiaPotencialTotal = cotacoes.reduce((sum, c) => {
       const raw = c as any;
       const supplierItems = raw._raw?.quote_supplier_items || raw._supplierItems || [];
       const quoteItems = raw._raw?.quote_items || [];
       const participants = c.fornecedoresParticipantes || [];

       let cEcon = 0;
       quoteItems.forEach((qi: any) => {
          const prices = participants
            .map((f: any) => supplierItems.find((i: any) => i?.supplier_id === f.id && i?.product_id === qi.product_id)?.valor_oferecido || 0)
            .filter(v => v > 0)
            .sort((a, b) => b - a);

          if (prices.length > 1) {
             cEcon += (prices[0] - prices[prices.length - 1]) * (Number(qi.quantidade) || 0);
          }
       });
       return sum + cEcon;
    }, 0);
    
    return { 
      ativas, 
      pendentes,
      prontasParaDecisao,
      vencendo,
      economiaTrabalho: economiaNegotiated,
      adesaoMedia: percentualAdesao,
      economiaRealPedidos,
      economiaPotencialTotal,
      economiaTrabalhoFormatada: `R$ ${economiaNegotiated.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`,
      economiaRealFormatada: `R$ ${economiaRealPedidos.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`,
      economiaPotencialFormatada: `R$ ${economiaPotencialTotal.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`,
      adesaoFormatada: `${percentualAdesao.toFixed(0)}%`
    };
  }, [cotacoes, pedidos]);
}
