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
}

// System prompt especializado em cotações
const SYSTEM_PROMPT = `Você é um assistente especializado em sistema de cotações e compras. Seu papel é ajudar usuários a:

1. Consultar informações sobre produtos, fornecedores, cotações e pedidos
2. Analisar preços e comparar fornecedores
3. Fornecer insights sobre histórico de compras e gastos
4. Calcular valores totais, médias, mínimos e máximos
5. Analisar períodos específicos (meses, anos)

REGRAS IMPORTANTES:
- Responda APENAS sobre o sistema de cotações/compras
- Use os dados fornecidos no contexto para responder
- Seja conciso e direto
- Formate valores monetários em R$ com 2 casas decimais
- Use datas no formato brasileiro (DD/MM/AAAA)
- Se não tiver dados suficientes, diga claramente
- NÃO invente informações
- NÃO responda sobre assuntos não relacionados ao sistema
- Faça cálculos precisos quando solicitado

CAPACIDADES FINANCEIRAS:
- Calcular gastos totais por período (mês, ano)
- Calcular gastos por fornecedor em períodos específicos
- Encontrar preços médios, mínimos e máximos de produtos
- Comparar preços entre fornecedores
- Analisar tendências de gastos
- Identificar produtos mais caros/baratos

Exemplos de perguntas que você deve responder:
- "Quanto gastei em novembro de 2025?"
- "Quanto já gastei com a Holambra de janeiro a março?"
- "Qual o valor médio pago no arroz?"
- "Qual o menor preço do feijão?"
- "Mostre produtos com preço acima de R$50"
- "Quais fornecedores têm melhor taxa de entrega?"
- "Quantos pedidos fizemos com a Holambra?"

Responda de forma natural e útil, sempre baseado nos dados reais.`;

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
      model: "llama-3.3-70b-versatile", // Modelo mais recente e rápido
      temperature: 0.3, // Baixa temperatura para respostas mais precisas
      max_tokens: 500,
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

  // Detectar perguntas sobre valores/gastos
  const isFinancialQuery = queryLower.includes("gast") || queryLower.includes("valor") || 
                          queryLower.includes("preço") || queryLower.includes("preco") ||
                          queryLower.includes("custo") || queryLower.includes("total") ||
                          queryLower.includes("médio") || queryLower.includes("medio") ||
                          queryLower.includes("menor") || queryLower.includes("maior");

  // Detectar período específico
  const months = ["janeiro", "fevereiro", "março", "marco", "abril", "maio", "junho", 
                  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
  const hasMonthQuery = months.some(m => queryLower.includes(m));
  const hasYearQuery = /202[0-9]/.test(query);

  // ANÁLISE FINANCEIRA DE PEDIDOS
  if (isFinancialQuery || queryLower.includes("pedido") || queryLower.includes("compra")) {
    contextStr += `\n=== PEDIDOS E VALORES ===\n`;
    contextStr += `Total de pedidos: ${context.orders.length}\n\n`;

    // Calcular totais por fornecedor
    const supplierTotals: Record<string, { count: number; total: number; orders: any[] }> = {};
    context.orders.forEach((order: any) => {
      const supplier = order.supplier_name || "Desconhecido";
      if (!supplierTotals[supplier]) {
        supplierTotals[supplier] = { count: 0, total: 0, orders: [] };
      }
      supplierTotals[supplier].count++;
      supplierTotals[supplier].total += order.total_value || 0;
      supplierTotals[supplier].orders.push(order);
    });

    contextStr += `Gastos por fornecedor:\n`;
    Object.entries(supplierTotals)
      .sort(([, a], [, b]) => b.total - a.total)
      .slice(0, 10)
      .forEach(([supplier, data]) => {
        contextStr += `- ${supplier}: ${data.count} pedidos, Total: R$ ${data.total.toFixed(2)}\n`;
      });

    // Análise por período se solicitado
    if (hasMonthQuery || hasYearQuery) {
      contextStr += `\nPedidos por data:\n`;
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
    contextStr += `\nTotal gasto em todos os pedidos: R$ ${totalGasto.toFixed(2)}\n`;
  }

  // ANÁLISE DE PRODUTOS E PREÇOS
  if (queryLower.includes("produto") || queryLower.includes("preço") || queryLower.includes("preco")) {
    contextStr += `\n=== PRODUTOS ===\n`;
    contextStr += `Total de produtos: ${context.products.length}\n`;
    
    // Se tiver itens de pedidos, calcular preços
    if (context.orderItems && context.orderItems.length > 0) {
      const productPrices: Record<string, { prices: number[]; quantities: number[] }> = {};
      
      context.orderItems.forEach((item: any) => {
        const productName = item.product_name;
        if (!productPrices[productName]) {
          productPrices[productName] = { prices: [], quantities: [] };
        }
        if (item.unit_price > 0) {
          productPrices[productName].prices.push(item.unit_price);
          productPrices[productName].quantities.push(item.quantity || 0);
        }
      });

      contextStr += `\nPreços de produtos (baseado em pedidos):\n`;
      Object.entries(productPrices)
        .slice(0, 30)
        .forEach(([product, data]) => {
          const avg = data.prices.reduce((a, b) => a + b, 0) / data.prices.length;
          const min = Math.min(...data.prices);
          const max = Math.max(...data.prices);
          contextStr += `- ${product}: Média R$ ${avg.toFixed(2)}, Mín R$ ${min.toFixed(2)}, Máx R$ ${max.toFixed(2)}\n`;
        });
    } else {
      // Listar produtos disponíveis
      context.products.slice(0, 30).forEach((p: any) => {
        contextStr += `- ${p.name} (Categoria: ${p.category || "N/A"})\n`;
      });
    }
  }

  // ANÁLISE DE FORNECEDORES
  if (queryLower.includes("fornecedor") || queryLower.includes("supplier")) {
    contextStr += `\n=== FORNECEDORES ===\n`;
    contextStr += `Total de fornecedores: ${context.suppliers.length}\n`;
    context.suppliers.slice(0, 20).forEach((s: any) => {
      contextStr += `- ${s.name} (Contato: ${s.contact || "N/A"})\n`;
    });
  }

  // ANÁLISE DE COTAÇÕES
  if (queryLower.includes("cotação") || queryLower.includes("cotacao") || queryLower.includes("quote")) {
    contextStr += `\n=== COTAÇÕES ===\n`;
    contextStr += `Total de cotações: ${context.quotes.length}\n`;
    
    const statusCount: Record<string, number> = {};
    context.quotes.forEach((q: any) => {
      statusCount[q.status] = (statusCount[q.status] || 0) + 1;
    });
    
    contextStr += `Por status:\n`;
    Object.entries(statusCount).forEach(([status, count]) => {
      contextStr += `- ${status}: ${count}\n`;
    });
  }

  return contextStr || "Nenhum dado relevante encontrado para esta consulta.";
}
