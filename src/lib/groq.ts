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
- Respostas SEMPRE estruturadas e profissionais.
- Use tabelas Markdown para comparações e listas de dados.
- Valores em R$ (formato brasileiro).
- Datas em DD/MM/AAAA.
- Sempre termine com um **💡 Insight Estratégico** ou **🚀 Recomendação de Ação**.
- Se faltar dados para uma ação, peça os dados específicos (ex: "Para criar a cotação, preciso saber quais produtos e fornecedores incluir").

NÃO invente dados. Se não souber, diga que não encontrou nos registros atuais.`;

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

  // 1. DADOS DE ESTOQUE
  if (queryLower.includes("estoque") || queryLower.includes("contagem") || queryLower.includes("inventário") || queryLower.includes("giro")) {
    contextStr += `\n📦 === ESTOQUE E CONTAGENS ===\n`;
    if (context.stockCounts && context.stockCounts.length > 0) {
      contextStr += `Total de contagens: ${context.stockCounts.length}\n`;
      context.stockCounts.slice(0, 5).forEach(c => {
        contextStr += `- [${new Date(c.count_date).toLocaleDateString('pt-BR')}] Status: ${c.status}, Notas: ${c.notes || 'N/A'}\n`;
      });
    }
  }

  // 2. PRODUTOS E PREÇOS (Contexto mais rico)
  if (queryLower.includes("produto") || queryLower.includes("preço") || queryLower.includes("preco") || queryLower.includes("estoque")) {
    contextStr += `\n🍎 === PRODUTOS E ESTOQUE ===\n`;
    context.products.slice(0, 50).forEach(p => {
      contextStr += `- ${p.name} (${p.unit}): Cat: ${p.category || 'N/A'}, Est. Min: ${p.min_stock || 0}, Est. Max: ${p.max_stock || 0}\n`;
    });
  }

  // 3. LOGS DE ATIVIDADE
  if (queryLower.includes("quem") || queryLower.includes("quando") || queryLower.includes("histórico") || queryLower.includes("log") || queryLower.includes("atividade")) {
    contextStr += `\n🔍 === LOGS DE ATIVIDADE ===\n`;
    if (context.activityLogs && context.activityLogs.length > 0) {
      context.activityLogs.slice(0, 15).forEach(log => {
        contextStr += `- [${new Date(log.created_at).toLocaleString('pt-BR')}] ${log.tipo}: ${log.acao} - ${log.detalhes}\n`;
      });
    }
  }

  // Detectar tipo de consulta financeira
  const isFinancialQuery = queryLower.includes("gast") || queryLower.includes("valor") || 
                          queryLower.includes("preço") || queryLower.includes("preco") ||
                          queryLower.includes("custo") || queryLower.includes("total") ||
                          queryLower.includes("economiz");

  if (isFinancialQuery) {
    const totalGasto = context.orders.reduce((sum, o) => sum + (o.total_value || 0), 0);
    contextStr += `\n💰 Financeiro:\n- Total Gasto: R$ ${totalGasto.toFixed(2)}\n`;
    
    // Top fornecedores por gasto
    const supplierTotals: Record<string, number> = {};
    context.orders.forEach(o => {
      supplierTotals[o.supplier_name] = (supplierTotals[o.supplier_name] || 0) + (o.total_value || 0);
    });
    
    contextStr += `Maiores gastos por fornecedor:\n`;
    Object.entries(supplierTotals)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .forEach(([name, total]) => {
        contextStr += `- ${name}: R$ ${total.toFixed(2)}\n`;
      });
  }

  return contextStr || "Nenhum dado relevante encontrado para esta consulta.";
}
