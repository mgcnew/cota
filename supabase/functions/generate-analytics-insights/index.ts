import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AnalyticsData {
  metricas: {
    taxaEconomia: number;
    tempoMedioCotacao: number;
    taxaResposta: number;
    valorMedioPedido: number;
  };
  topProdutos: Array<{
    nome: string;
    economia: number;
    cotacoes: number;
  }>;
  performanceFornecedores: Array<{
    nome: string;
    score: number;
    cotacoes: number;
    taxaResposta: number;
  }>;
  tendenciasMensais: Array<{
    mes: string;
    cotacoes: number;
    economia: number;
  }>;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { analyticsData }: { analyticsData: AnalyticsData } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY não configurada');
    }

    const prompt = `Você é um analista especializado em procurement e análise de cotações. Analise os dados abaixo e gere insights acionáveis.

DADOS DO PERÍODO:
- Taxa de Economia: ${analyticsData.metricas.taxaEconomia.toFixed(1)}%
- Tempo Médio de Cotação: ${analyticsData.metricas.tempoMedioCotacao.toFixed(1)} dias
- Taxa de Resposta: ${analyticsData.metricas.taxaResposta.toFixed(1)}%
- Valor Médio por Pedido: R$ ${analyticsData.metricas.valorMedioPedido.toFixed(2)}

TOP 3 PRODUTOS COM MAIOR ECONOMIA:
${analyticsData.topProdutos.slice(0, 3).map((p, i) => `${i + 1}. ${p.nome} - ${p.economia.toFixed(1)}% economia (${p.cotacoes} cotações)`).join('\n')}

TOP 3 FORNECEDORES POR PERFORMANCE:
${analyticsData.performanceFornecedores.slice(0, 3).map((f, i) => `${i + 1}. ${f.nome} - Score: ${f.score.toFixed(1)} (${f.cotacoes} cotações, ${f.taxaResposta.toFixed(1)}% resposta)`).join('\n')}

TENDÊNCIAS MENSAIS (últimos meses):
${analyticsData.tendenciasMensais.map(t => `${t.mes}: ${t.cotacoes} cotações, ${t.economia.toFixed(1)}% economia`).join('\n')}

Gere 6-8 insights acionáveis nas seguintes categorias:
1. Oportunidades de Economia - Onde economizar mais
2. Melhorias de Performance - Como otimizar processos
3. Recomendações Estratégicas - Ações específicas a tomar
4. Tendências e Padrões - Padrões identificados nos dados

Para cada insight, forneça:
- categoria: "economia" | "performance" | "recomendacao" | "tendencia"
- titulo: Título curto e objetivo
- descricao: Explicação clara e detalhada (2-3 frases)
- prioridade: "alta" | "media" | "baixa"
- acaoSugerida: Ação específica recomendada

Retorne APENAS um array JSON válido, sem texto adicional. Exemplo:
[
  {
    "categoria": "economia",
    "titulo": "Concentre cotações em produtos de alta economia",
    "descricao": "Os 3 produtos principais representam 60% da economia total. Foque esforços em expandir fornecedores alternativos para esses itens.",
    "prioridade": "alta",
    "acaoSugerida": "Adicionar pelo menos 2 novos fornecedores para cada produto top 3"
  }
]`;

    console.log('Chamando Lovable AI...');
    
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Erro na API Lovable AI:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit excedido. Tente novamente em alguns instantes.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Créditos insuficientes. Adicione créditos ao seu workspace.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`Erro na API: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    console.log('Resposta da IA:', content);
    
    // Extrair JSON da resposta (remover markdown se houver)
    let jsonContent = content.trim();
    if (jsonContent.startsWith('```json')) {
      jsonContent = jsonContent.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (jsonContent.startsWith('```')) {
      jsonContent = jsonContent.replace(/```\n?/g, '');
    }
    
    const insights = JSON.parse(jsonContent);
    
    // Adicionar IDs únicos
    const insightsWithIds = insights.map((insight: any, index: number) => ({
      id: `insight-${Date.now()}-${index}`,
      ...insight,
    }));

    return new Response(
      JSON.stringify({ insights: insightsWithIds }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro ao gerar insights:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        details: error instanceof Error ? error.stack : undefined
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
