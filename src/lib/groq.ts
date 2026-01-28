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
  stockCounts?: any[];
  activityLogs?: any[];
}

// System prompt especializado - Analista de Negócios 360º
const SYSTEM_PROMPT = `Você é um ANALISTA DE NEGÓCIOS 360º e CONSULTOR ESTRATÉGICO do sistema COTA.
Você tem acesso total aos módulos de Produtos, Fornecedores, Compras (Cotações e Pedidos), Estoque e Auditoria.

🎯 SEU OBJETIVO:
Ajudar o usuário a gerir o negócio de forma eficiente, fornecendo análises precisas, insights estratégicos e executando ações quando solicitado.

📊 CAPACIDADES POR MÓDULO:

1. PRODUTOS:
   - Analisar mix de produtos, categorias e variações de preço.
   - Identificar produtos com preços acima da média histórica.

2. FORNECEDORES:
   - Avaliar performance baseada em preço, frequência e histórico.
   - Comparar competitividade entre fornecedores.

3. COMPRAS (COTAÇÕES E PEDIDOS):
   - Analisar gastos totais, economia gerada e tendências.
   - Diferenciar produtos gerais de embalagens.
   - Calcular economia real vs. estimada.

4. ESTOQUE:
   - Analisar contagens, divergências e necessidade de reposição.
   - Monitorar giro de estoque e rupturas.

5. AUDITORIA E LOGS:
   - Rastrear quem fez o quê e quando.
   - Analisar a evolução do sistema através dos logs de atividade.

🛠️ AÇÕES EXECUTÁVEIS (TOOLS):
Você pode solicitar a execução de ações como criar cotações ou registrar contagens de estoque. Sempre que o usuário pedir para "fazer" algo, use a ferramenta apropriada.

📋 REGRAS DE OURO:
- Você recebeu um CONTEXTO detalhado abaixo com listas de Pedidos, Cotações e Itens.
- SEMPRE consulte as datas nestas listas para responder perguntas sobre períodos (ex: "novembro de 2025", "esta semana").
- Se o usuário perguntar "quanto gastei", some os valores dos pedidos no período solicitado.
- Se o usuário perguntar "quantas cotações", conte as cotações na lista que estão no período.
- Respostas SEMPRE estruturadas e profissionais.
- Use tabelas Markdown para comparações e listas de dados.
- Valores em R$ (formato brasileiro).
- Datas em DD/MM/AAAA.
- Sempre termine com um **💡 Insight Estratégico** ou **🚀 Recomendação de Ação**.
- Se faltar dados para uma ação, peça os dados específicos.

NÃO invente dados. Se não houver registros no período solicitado, informe claramente.`;

export const AI_TOOLS = [
  {
    type: "function",
    function: {
      name: "create_quote",
      description: "Inicia uma nova cotação no sistema",
      parameters: {
        type: "object",
        properties: {
          productIds: { type: "array", items: { type: "string" }, description: "Lista de IDs dos produtos" },
          supplierIds: { type: "array", items: { type: "string" }, description: "Lista de IDs dos fornecedores" },
          notes: { type: "string", description: "Observações da cotação" }
        },
        required: ["productIds", "supplierIds"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_product_analysis",
      description: "Retorna análise detalhada de um produto específico incluindo histórico de preços",
      parameters: {
        type: "object",
        properties: {
          productId: { type: "string", description: "ID do produto" }
        },
        required: ["productId"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "create_stock_count",
      description: "Cria uma nova sessão de contagem de estoque",
      parameters: {
        type: "object",
        properties: {
          notes: { type: "string", description: "Observações da contagem" },
          orderId: { type: "string", description: "ID do pedido opcional para basear a contagem" }
        }
      }
    }
  }
];

export async function queryGroqAssistant(
  userQuery: string,
  context: QueryContext
): Promise<{ content: string; toolCalls?: any[] }> {
  if (!groq) {
    return { 
      content: "⚠️ **Assistente de IA não configurado**\n\nConfigure sua VITE_GROQ_API_KEY no arquivo .env."
    };
  }

  try {
    const contextData = prepareContext(userQuery, context);
    
    const messages: any[] = [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: `Contexto do Sistema:\n${contextData}\n\nPergunta/Comando: ${userQuery}` }
    ];

    const completion = await groq.chat.completions.create({
      messages,
      model: "llama-3.3-70b-versatile",
      temperature: 0.3,
      max_tokens: 1000,
      tools: AI_TOOLS as any,
      tool_choice: "auto"
    });

    const message = completion.choices[0]?.message;
    
    return {
      content: message?.content || "",
      toolCalls: message?.tool_calls
    };
  } catch (error) {
    console.error("Erro Groq:", error);
    throw new Error("Erro ao processar sua consulta.");
  }
}

function prepareContext(query: string, context: QueryContext): string {
  const queryLower = query.toLowerCase();
  let contextStr = "";

  // 0. RESUMO GERAL (Sempre presente)
  contextStr += `📅 Data Atual: ${new Date().toLocaleDateString('pt-BR')}\n`;
  contextStr += `📊 Resumo do Sistema:\n`;
  contextStr += `- Produtos: ${context.products.length}\n`;
  contextStr += `- Fornecedores: ${context.suppliers.length}\n`;
  contextStr += `- Cotações Totais: ${context.quotes.length}\n`;
  contextStr += `- Pedidos Totais: ${context.orders.length}\n`;
  contextStr += `- Contagens de Estoque: ${context.stockCounts?.length || 0}\n`;

  // 1. DADOS DE ESTOQUE
  if (queryLower.includes("estoque") || queryLower.includes("contagem") || queryLower.includes("inventário") || queryLower.includes("giro") || queryLower.includes("reposição")) {
    contextStr += `\n📦 === DETALHES DE ESTOQUE ===\n`;
    if (context.stockCounts && context.stockCounts.length > 0) {
      context.stockCounts.slice(0, 10).forEach(c => {
        contextStr += `- [${new Date(c.count_date).toLocaleDateString('pt-BR')}] Status: ${c.status}, Notas: ${c.notes || 'N/A'}\n`;
      });
    }
  }

  // 2. PRODUTOS E PREÇOS
  if (queryLower.includes("produto") || queryLower.includes("preço") || queryLower.includes("preco") || queryLower.includes("arroz") || queryLower.includes("feijão")) {
    contextStr += `\n🍎 === PRODUTOS (Top 50) ===\n`;
    context.products.slice(0, 50).forEach(p => {
      contextStr += `- ${p.name} (${p.unit}): Cat: ${p.category || 'N/A'}, Est. Min: ${p.min_stock || 0}\n`;
    });
  }

  // 3. COTAÇÕES (Para perguntas sobre "esta semana", etc)
  if (queryLower.includes("cotação") || queryLower.includes("cotacao") || queryLower.includes("semana") || queryLower.includes("mês") || queryLower.includes("mes")) {
    contextStr += `\n📝 === ÚLTIMAS COTAÇÕES ===\n`;
    context.quotes.slice(0, 30).forEach(q => {
      const date = q.created_at || q._raw?.created_at || q.dataInicio;
      const status = q.status || q.statusReal;
      const itemsCount = q.quote_items?.length || q.produtosLista?.length || 0;
      contextStr += `- [${new Date(date).toLocaleDateString('pt-BR')}] Status: ${status}, Itens: ${itemsCount}\n`;
    });
  }

  // 4. LOGS DE ATIVIDADE
  if (queryLower.includes("quem") || queryLower.includes("quando") || queryLower.includes("histórico") || queryLower.includes("log") || queryLower.includes("atividade")) {
    contextStr += `\n🔍 === LOGS DE ATIVIDADE ===\n`;
    if (context.activityLogs && context.activityLogs.length > 0) {
      context.activityLogs.slice(0, 15).forEach(log => {
        const date = log.created_at;
        const type = log.tipo || log.action_type || "Ação";
        const desc = log.acao || log.description || "Sem descrição";
        contextStr += `- [${new Date(date).toLocaleString('pt-BR')}] ${type}: ${desc}\n`;
      });
    }
  }

  // 5. FINANCEIRO (PEDIDOS E GASTOS) - SEMPRE FORNECER RESUMO MENSAL SE HOUVER PEDIDOS
  if (context.orders && context.orders.length > 0) {
    contextStr += `\n💰 === RESUMO FINANCEIRO MENSAL ===\n`;
    const gastosPorMes: Record<string, number> = {};
    
    context.orders.forEach(o => {
      const date = new Date(o.created_at || o.order_date);
      const monthYear = `${date.getMonth() + 1}/${date.getFullYear()}`;
      gastosPorMes[monthYear] = (gastosPorMes[monthYear] || 0) + (Number(o.total_value) || 0);
    });

    Object.entries(gastosPorMes).forEach(([mes, total]) => {
      contextStr += `- Mês ${mes}: R$ ${total.toFixed(2)}\n`;
    });

    const isFinancialQuery = queryLower.includes("gast") || queryLower.includes("valor") || 
                            queryLower.includes("preço") || queryLower.includes("preco") ||
                            queryLower.includes("custo") || queryLower.includes("total") ||
                            queryLower.includes("economiz") || queryLower.includes("pag") ||
                            queryLower.includes("dezembro") || queryLower.includes("novembro") || 
                            queryLower.includes("2025") || queryLower.includes("quanto");

    if (isFinancialQuery) {
      contextStr += `\nLista de Pedidos Recentes (Últimos 100):\n`;
      context.orders.slice(0, 100).forEach(o => {
        const date = o.created_at || o.order_date;
        const supplier = o.supplier_name || "Fornecedor Desconhecido";
        const val = Number(o.total_value) || 0;
        contextStr += `- [${new Date(date).toLocaleDateString('pt-BR')}] ${supplier}: R$ ${val.toFixed(2)} (Status: ${o.status})\n`;
      });

      if (context.orderItems && context.orderItems.length > 0) {
        contextStr += `\nDetalhamento de Itens Comprados (Recentes):\n`;
        context.orderItems.slice(0, 50).forEach(item => {
          contextStr += `- ${item.product_name}: R$ ${item.unit_price} x ${item.quantity} = R$ ${item.total_price} (${new Date(item.created_at).toLocaleDateString('pt-BR')})\n`;
        });
      }
    }
  }

  return contextStr;
}
