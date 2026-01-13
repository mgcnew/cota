import Groq from "groq-sdk";

// Verificar se a chave da API está configurada
const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;

// Inicializar cliente Groq apenas se a chave estiver presente
let groq: Groq | null = null;

if (GROQ_API_KEY) {
  groq = new Groq({
    apiKey: GROQ_API_KEY,
    dangerouslyAllowBrowser: true, // Necessário para uso no browser
  });
}

// Export para verificar se está configurado
export const isGroqConfigured = !!groq;

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface QueryContext {
  products: any[];
  suppliers: any[];
  quotes: any[];
  orders: any[];
  orderItems?: any[];
  quoteSupplierItems?: any[];
  packagingQuotes?: any[];
  packagingOrders?: any[];
  packagingOrderItems?: any[];
  packagingSupplierItems?: any[];
}

// System prompt especializado - Analista Financeiro e Comprador Profissional
const SYSTEM_PROMPT = `Você é um ANALISTA FINANCEIRO ESPECIALIZADO e COMPRADOR PROFISSIONAL com acesso completo ao sistema de cotações e compras.

🎯 SEU PAPEL:
Você é um especialista em procurement (compras estratégicas) com anos de experiência em análise financeira, negociação com fornecedores e otimização de custos. Seu objetivo é ajudar o usuário a tomar decisões inteligentes de compra baseadas em dados reais.

📊 ACESSO COMPLETO AOS DADOS:
Você tem acesso a TODOS os dados financeiros do sistema:
- Produtos gerais e embalagens
- Fornecedores e histórico de relacionamento
- Cotações (produtos gerais e embalagens)
- Pedidos (produtos gerais e embalagens)
- Itens de pedidos com preços unitários e totais
- Itens de cotações com ofertas de fornecedores
- Histórico completo de preços e transações
- Datas de todas as operações

💰 CAPACIDADES DE ANÁLISE FINANCEIRA:
1. Gastos Totais:
   - Por período (dia, semana, mês, ano)
   - Por fornecedor
   - Por categoria de produto
   - Por tipo (produtos gerais vs embalagens)

2. Análise de Preços:
   - Preço médio, mínimo e máximo por produto
   - Variação de preços ao longo do tempo
   - Comparação entre fornecedores
   - Identificação de oportunidades de economia

3. Performance de Fornecedores:
   - Histórico de preços oferecidos
   - Taxa de vitória em cotações
   - Frequência de compras
   - Confiabilidade e consistência

4. Tendências e Insights:
   - Produtos com maior variação de preço
   - Fornecedores mais competitivos
   - Períodos de maior gasto
   - Oportunidades de consolidação

🛒 COMPORTAMENTO DE COMPRADOR PROFISSIONAL:
Ao final de CADA resposta, você DEVE fornecer:

**💡 Dica do Comprador:**
- Uma recomendação prática baseada nos dados analisados
- Estratégias de negociação quando aplicável
- Alertas sobre preços fora do padrão
- Sugestões de economia ou otimização
- Melhores práticas de procurement

EXEMPLOS DE DICAS:
- "Considere negociar um contrato de volume com este fornecedor para obter descontos"
- "Este preço está 15% acima da média histórica - vale a pena buscar outras cotações"
- "Fornecedor X tem sido 8% mais barato consistentemente - considere priorizar"
- "Seus gastos aumentaram 30% neste mês - revise se há oportunidades de consolidação"
- "Este produto tem alta variação de preço - considere compras programadas nos períodos de baixa"

📋 REGRAS DE RESPOSTA:
- Seja DIRETO e OBJETIVO
- Use dados REAIS do contexto fornecido
- Formate valores em R$ com 2 casas decimais
- Use datas no formato DD/MM/AAAA
- Apresente números de forma clara (tabelas quando apropriado)
- SEMPRE termine com uma dica profissional
- NÃO invente dados
- Se não tiver informação suficiente, seja honesto
- Responda APENAS sobre o sistema de cotações/compras

📈 EXEMPLOS DE PERGUNTAS QUE VOCÊ RESPONDE:
- "Quanto gastei em novembro de 2025?"
- "Qual fornecedor tem o melhor preço no arroz?"
- "Mostre a evolução de gastos nos últimos 3 meses"
- "Quais produtos tiveram maior variação de preço?"
- "Quanto economizei comprando do fornecedor X?"
- "Qual o histórico de preços do feijão?"
- "Quantos pedidos de embalagens fizemos este ano?"
- "Compare os preços entre fornecedor A e B"

Seja um consultor de compras confiável, sempre agregando valor com insights acionáveis!`;

export async function queryGroqAssistant(
  userQuery: string,
  context: QueryContext
): Promise<string> {
  // Verificar se o Groq está configurado
  if (!groq) {
    return "⚠️ **Assistente de IA não configurado**\n\nPara usar o assistente de IA, você precisa:\n\n1. Criar uma conta gratuita em https://console.groq.com\n2. Obter sua API Key\n3. Adicionar no arquivo `.env`:\n```\nVITE_GROQ_API_KEY=sua_chave_aqui\n```\n4. Reiniciar o servidor\n\nEnquanto isso, você pode usar a busca tradicional.";
  }

  try {
    // Preparar contexto com dados relevantes
    const contextData = prepareContext(userQuery, context);
    
    const messages: ChatMessage[] = [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: `Contexto dos dados:\n${contextData}\n\nPergunta do usuário: ${userQuery}` }
    ];

    const completion = await groq.chat.completions.create({
      messages,
      model: "llama-3.3-70b-versatile",
      temperature: 0.4, // Aumentado um pouco para respostas mais naturais
      max_tokens: 800, // Aumentado para incluir dicas
    });

    return completion.choices[0]?.message?.content || "Desculpe, não consegui processar sua pergunta.";
  } catch (error) {
    console.error("Erro ao consultar Groq:", error);
    throw new Error("Erro ao processar sua pergunta. Tente novamente.");
  }
}

// Preparar contexto relevante baseado na query
function prepareContext(query: string, context: QueryContext): string {
  const queryLower = query.toLowerCase();
  let contextStr = "";

  // Detectar tipo de consulta
  const isFinancialQuery = queryLower.includes("gast") || queryLower.includes("valor") || 
                          queryLower.includes("preço") || queryLower.includes("preco") ||
                          queryLower.includes("custo") || queryLower.includes("total") ||
                          queryLower.includes("médio") || queryLower.includes("medio") ||
                          queryLower.includes("menor") || queryLower.includes("maior") ||
                          queryLower.includes("economiz");

  const isPackagingQuery = queryLower.includes("embalagem") || queryLower.includes("embalagens");
  const isSupplierQuery = queryLower.includes("fornecedor");
  const isProductQuery = queryLower.includes("produto");
  const isQuoteQuery = queryLower.includes("cotação") || queryLower.includes("cotacao");
  const isPriceQuery = queryLower.includes("preço") || queryLower.includes("preco");

  // Detectar período específico
  const months = ["janeiro", "fevereiro", "março", "marco", "abril", "maio", "junho", 
                  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
  const hasMonthQuery = months.some(m => queryLower.includes(m));
  const hasYearQuery = /202[0-9]/.test(query);

  // ========== ANÁLISE FINANCEIRA COMPLETA ==========
  
  // 1. PEDIDOS DE PRODUTOS GERAIS
  if (isFinancialQuery || queryLower.includes("pedido")) {
    contextStr += `\n📦 === PEDIDOS DE PRODUTOS GERAIS ===\n`;
    contextStr += `Total de pedidos: ${context.orders.length}\n`;

    if (context.orders.length > 0) {
      // Calcular totais por fornecedor
      const supplierTotals: Record<string, { count: number; total: number; dates: string[] }> = {};
      context.orders.forEach((order: any) => {
        const supplier = order.supplier_name || "Desconhecido";
        if (!supplierTotals[supplier]) {
          supplierTotals[supplier] = { count: 0, total: 0, dates: [] };
        }
        supplierTotals[supplier].count++;
        supplierTotals[supplier].total += order.total_value || 0;
        supplierTotals[supplier].dates.push(order.order_date);
      });

      contextStr += `\nGastos por fornecedor:\n`;
      Object.entries(supplierTotals)
        .sort(([, a], [, b]) => b.total - a.total)
        .slice(0, 15)
        .forEach(([supplier, data]) => {
          contextStr += `- ${supplier}: ${data.count} pedidos, Total: R$ ${data.total.toFixed(2)}\n`;
        });

      // Análise por período
      if (hasMonthQuery || hasYearQuery) {
        contextStr += `\nPedidos por data (últimos 50):\n`;
        context.orders
          .sort((a: any, b: any) => new Date(b.order_date).getTime() - new Date(a.order_date).getTime())
          .slice(0, 50)
          .forEach((order: any) => {
            const date = new Date(order.order_date);
            const dateStr = date.toLocaleDateString('pt-BR');
            contextStr += `- ${dateStr}: ${order.supplier_name}, R$ ${(order.total_value || 0).toFixed(2)}\n`;
          });
      }

      // Total geral
      const totalGasto = context.orders.reduce((sum: number, o: any) => sum + (o.total_value || 0), 0);
      contextStr += `\n💰 Total gasto em pedidos gerais: R$ ${totalGasto.toFixed(2)}\n`;
    }
  }

  // 2. PEDIDOS DE EMBALAGENS
  if (isPackagingQuery || isFinancialQuery) {
    if (context.packagingOrders && context.packagingOrders.length > 0) {
      contextStr += `\n📦 === PEDIDOS DE EMBALAGENS ===\n`;
      contextStr += `Total de pedidos de embalagens: ${context.packagingOrders.length}\n`;

      const packSupplierTotals: Record<string, { count: number; total: number }> = {};
      context.packagingOrders.forEach((order: any) => {
        const supplier = order.supplier_name || "Desconhecido";
        if (!packSupplierTotals[supplier]) {
          packSupplierTotals[supplier] = { count: 0, total: 0 };
        }
        packSupplierTotals[supplier].count++;
        packSupplierTotals[supplier].total += order.total_value || 0;
      });

      contextStr += `\nGastos com embalagens por fornecedor:\n`;
      Object.entries(packSupplierTotals)
        .sort(([, a], [, b]) => b.total - a.total)
        .slice(0, 10)
        .forEach(([supplier, data]) => {
          contextStr += `- ${supplier}: ${data.count} pedidos, Total: R$ ${data.total.toFixed(2)}\n`;
        });

      const totalEmbalagens = context.packagingOrders.reduce((sum: number, o: any) => sum + (o.total_value || 0), 0);
      contextStr += `\n💰 Total gasto em embalagens: R$ ${totalEmbalagens.toFixed(2)}\n`;
    }
  }

  // 3. ANÁLISE DETALHADA DE PREÇOS DE PRODUTOS
  if (isPriceQuery || isProductQuery) {
    contextStr += `\n💵 === ANÁLISE DE PREÇOS DE PRODUTOS ===\n`;
    
    if (context.orderItems && context.orderItems.length > 0) {
      const productPrices: Record<string, { prices: number[]; quantities: number[]; dates: string[] }> = {};
      
      context.orderItems.forEach((item: any) => {
        const productName = item.product_name;
        if (!productPrices[productName]) {
          productPrices[productName] = { prices: [], quantities: [], dates: [] };
        }
        if (item.unit_price > 0) {
          productPrices[productName].prices.push(item.unit_price);
          productPrices[productName].quantities.push(item.quantity || 0);
          productPrices[productName].dates.push(item.created_at);
        }
      });

      contextStr += `\nPreços de produtos (baseado em ${context.orderItems.length} itens):\n`;
      Object.entries(productPrices)
        .sort(([, a], [, b]) => {
          const avgA = a.prices.reduce((s, p) => s + p, 0) / a.prices.length;
          const avgB = b.prices.reduce((s, p) => s + p, 0) / b.prices.length;
          return avgB - avgA;
        })
        .slice(0, 40)
        .forEach(([product, data]) => {
          const avg = data.prices.reduce((a, b) => a + b, 0) / data.prices.length;
          const min = Math.min(...data.prices);
          const max = Math.max(...data.prices);
          const totalQty = data.quantities.reduce((a, b) => a + b, 0);
          const variation = ((max - min) / min * 100).toFixed(1);
          contextStr += `- ${product}: Média R$ ${avg.toFixed(2)}, Mín R$ ${min.toFixed(2)}, Máx R$ ${max.toFixed(2)}, Variação ${variation}%, Qtd Total: ${totalQty}\n`;
        });
    }
  }

  // 4. ANÁLISE DE COTAÇÕES
  if (isQuoteQuery || isFinancialQuery) {
    contextStr += `\n📋 === COTAÇÕES ===\n`;
    contextStr += `Total de cotações: ${context.quotes.length}\n`;
    
    if (context.quotes.length > 0) {
      const statusCount: Record<string, number> = {};
      context.quotes.forEach((q: any) => {
        statusCount[q.status] = (statusCount[q.status] || 0) + 1;
      });
      
      contextStr += `Por status:\n`;
      Object.entries(statusCount).forEach(([status, count]) => {
        contextStr += `- ${status}: ${count}\n`;
      });

      // Análise de ofertas de fornecedores
      if (context.quoteSupplierItems && context.quoteSupplierItems.length > 0) {
        contextStr += `\nOfertas de fornecedores em cotações: ${context.quoteSupplierItems.length} itens\n`;
        
        const supplierOffers: Record<string, { count: number; avgPrice: number; prices: number[] }> = {};
        context.quoteSupplierItems.forEach((item: any) => {
          const supplier = item.supplier_name || "Desconhecido";
          if (!supplierOffers[supplier]) {
            supplierOffers[supplier] = { count: 0, avgPrice: 0, prices: [] };
          }
          supplierOffers[supplier].count++;
          if (item.unit_price > 0) {
            supplierOffers[supplier].prices.push(item.unit_price);
          }
        });

        contextStr += `\nFornecedores mais ativos em cotações:\n`;
        Object.entries(supplierOffers)
          .sort(([, a], [, b]) => b.count - a.count)
          .slice(0, 10)
          .forEach(([supplier, data]) => {
            if (data.prices.length > 0) {
              const avg = data.prices.reduce((a, b) => a + b, 0) / data.prices.length;
              contextStr += `- ${supplier}: ${data.count} ofertas, Preço médio: R$ ${avg.toFixed(2)}\n`;
            }
          });
      }
    }
  }

  // 5. ANÁLISE DE FORNECEDORES
  if (isSupplierQuery) {
    contextStr += `\n🏢 === FORNECEDORES ===\n`;
    contextStr += `Total de fornecedores cadastrados: ${context.suppliers.length}\n`;
    
    // Performance de fornecedores baseada em pedidos
    const supplierPerformance: Record<string, { 
      orderCount: number; 
      totalSpent: number; 
      avgOrderValue: number;
      lastOrderDate?: string;
    }> = {};

    context.orders.forEach((order: any) => {
      const supplier = order.supplier_name;
      if (!supplierPerformance[supplier]) {
        supplierPerformance[supplier] = { 
          orderCount: 0, 
          totalSpent: 0, 
          avgOrderValue: 0 
        };
      }
      supplierPerformance[supplier].orderCount++;
      supplierPerformance[supplier].totalSpent += order.total_value || 0;
      supplierPerformance[supplier].lastOrderDate = order.order_date;
    });

    Object.keys(supplierPerformance).forEach(supplier => {
      const perf = supplierPerformance[supplier];
      perf.avgOrderValue = perf.totalSpent / perf.orderCount;
    });

    contextStr += `\nPerformance de fornecedores (top 15):\n`;
    Object.entries(supplierPerformance)
      .sort(([, a], [, b]) => b.totalSpent - a.totalSpent)
      .slice(0, 15)
      .forEach(([supplier, perf]) => {
        contextStr += `- ${supplier}: ${perf.orderCount} pedidos, Total: R$ ${perf.totalSpent.toFixed(2)}, Ticket médio: R$ ${perf.avgOrderValue.toFixed(2)}\n`;
      });
  }

  // 6. RESUMO GERAL FINANCEIRO
  if (isFinancialQuery && !queryLower.includes("fornecedor") && !queryLower.includes("produto")) {
    contextStr += `\n💰 === RESUMO FINANCEIRO GERAL ===\n`;
    
    const totalPedidosGerais = context.orders.reduce((sum: number, o: any) => sum + (o.total_value || 0), 0);
    const totalEmbalagens = (context.packagingOrders || []).reduce((sum: number, o: any) => sum + (o.total_value || 0), 0);
    const totalGeral = totalPedidosGerais + totalEmbalagens;
    
    contextStr += `Total em pedidos gerais: R$ ${totalPedidosGerais.toFixed(2)}\n`;
    contextStr += `Total em embalagens: R$ ${totalEmbalagens.toFixed(2)}\n`;
    contextStr += `TOTAL GERAL: R$ ${totalGeral.toFixed(2)}\n`;
    contextStr += `\nNúmero de pedidos gerais: ${context.orders.length}\n`;
    contextStr += `Número de pedidos de embalagens: ${(context.packagingOrders || []).length}\n`;
    contextStr += `Total de fornecedores: ${context.suppliers.length}\n`;
    contextStr += `Total de produtos: ${context.products.length}\n`;
  }

  return contextStr || "Nenhum dado relevante encontrado para esta consulta.";
}
