import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

let genAI: GoogleGenerativeAI | null = null;
if (GEMINI_API_KEY) {
  genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
}

export const isGeminiConfigured = !!genAI;

// ==================== TIPOS ====================

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

// ==================== SYSTEM PROMPT ====================

const ASSISTANT_SYSTEM_PROMPT = `Você é um ANALISTA FINANCEIRO ESPECIALIZADO e COMPRADOR PROFISSIONAL com acesso completo ao sistema de cotações e compras de um mercado/açougue.

🎯 SEU PAPEL:
Especialista em procurement (compras estratégicas) com anos de experiência em análise financeira, negociação com fornecedores e otimização de custos.

📊 DADOS DISPONÍVEIS:
Você recebe TODOS os dados financeiros do sistema em formato estruturado:
- Catálogo completo de produtos e embalagens
- Todos os fornecedores cadastrados
- TODAS as cotações (com datas de início, fim, produtos, fornecedores participantes e valores)
- TODOS os pedidos (com datas, fornecedor, valor total, status)
- Itens detalhados de pedidos (com preços unitários, quantidades)
- Itens de cotações de fornecedores (com valores oferecidos)
- Cotações e pedidos de embalagens

💰 CAPACIDADES:
1. Gastos Totais: Por período (dia/semana/mês/ano), por fornecedor, por categoria
2. Análise de Preços: Médio, mínimo, máximo, variação temporal, comparação entre fornecedores
3. Performance de Fornecedores: Preços, taxa de vitória em cotações, frequência
4. Tendências: Variações de preço, fornecedores mais competitivos, sazonalidade

🛒 COMPORTAMENTO:
- Seja DIRETO, analítico e inteligente
- Use APENAS dados REAIS do contexto — NÃO invente dados
- Formate valores monetários SEMPRE no padrão brasileiro: R$ 1.234,56 (ponto para milhar, vírgula para decimal)
  Exemplos corretos: R$ 1.250,00 | R$ 89,90 | R$ 12.500,00 | R$ 1.234.567,89
  Exemplos ERRADOS: R$ 1250.00 | R$ 89.90 | R$ 12500.00
- Use datas no formato DD/MM/AAAA
- NÃO use markdown de títulos (###), apenas texto plano, bullet points (•) e emojis
- Porcentagens com vírgula: 15,5% (não 15.5%)
- Ao final de cada resposta: 💡 Dica do Comprador (recomendação prática)
- Responda SEMPRE em português brasileiro
- Se não tiver informação suficiente, diga honestamente
- IMPORTANTE: Analise TODOS os dados fornecidos antes de dizer que não tem informação`;


// ==================== HELPERS ====================

/** Formata valor monetário no padrão brasileiro: R$ 1.234,56 */
function formatBRL(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

// ==================== PREPARAR CONTEXTO COMPLETO ====================

function prepareContext(_query: string, context: QueryContext): string {
  const parts: string[] = [];

  // ======== 1. COTAÇÕES (com datas e detalhes completos) ========
  if (context.quotes && context.quotes.length > 0) {
    parts.push(`📋 COTAÇÕES (Total: ${context.quotes.length})`);
    
    // Status geral das cotações
    const statusCount: Record<string, number> = {};
    context.quotes.forEach((q: any) => {
      const s = q.status || q.statusReal || "desconhecido";
      statusCount[s] = (statusCount[s] || 0) + 1;
    });
    parts.push(`Status: ${Object.entries(statusCount).map(([s, c]) => `${s}: ${c}`).join(", ")}`);

    // Listar TODAS as cotações com datas
    context.quotes.forEach((q: any) => {
      const dataInicio = q.dataInicio || q.data_inicio || "";
      const dataFim = q.dataFim || q.data_fim || "";
      const status = q.status || q.statusReal || "";
      const produto = q.produto || q.produtoResumo || "";
      const fornecedores = q.fornecedores || 0;
      const melhorPreco = q.melhorPreco || "";
      const melhorFornecedor = q.melhorFornecedor || "";
      const economia = q.economia || "";
      
      parts.push(`- Cotação: ${produto} | Início: ${dataInicio} | Fim: ${dataFim} | Status: ${status} | Fornecedores: ${fornecedores} | Melhor: ${melhorPreco} (${melhorFornecedor}) | Economia: ${economia}`);
    });
  }

  // ======== 2. PEDIDOS (com datas e valores) ========
  if (context.orders && context.orders.length > 0) {
    parts.push(`\n📦 PEDIDOS (Total: ${context.orders.length})`);
    
    // Agrupar pedidos por mês
    const porMes: Record<string, { count: number; total: number; fornecedores: Set<string> }> = {};
    context.orders.forEach((o: any) => {
      const date = new Date(o.order_date);
      const mesAno = `${String(date.getMonth() + 1).padStart(2, "0")}/${date.getFullYear()}`;
      if (!porMes[mesAno]) porMes[mesAno] = { count: 0, total: 0, fornecedores: new Set() };
      porMes[mesAno].count++;
      porMes[mesAno].total += o.total_value || 0;
      porMes[mesAno].fornecedores.add(o.supplier_name || "");
    });

    parts.push("Gastos por mês:");
    Object.entries(porMes)
      .sort(([a], [b]) => {
        const [ma, ya] = a.split("/").map(Number);
        const [mb, yb] = b.split("/").map(Number);
        return ya !== yb ? ya - yb : ma - mb;
      })
      .forEach(([mes, d]) => {
        parts.push(`- ${mes}: ${d.count} pedidos, ${formatBRL(d.total)}, ${d.fornecedores.size} fornecedores`);
      });

    // Gastos por fornecedor
    const porFornecedor: Record<string, { count: number; total: number }> = {};
    context.orders.forEach((o: any) => {
      const s = o.supplier_name || "Desconhecido";
      if (!porFornecedor[s]) porFornecedor[s] = { count: 0, total: 0 };
      porFornecedor[s].count++;
      porFornecedor[s].total += o.total_value || 0;
    });

    parts.push("\nGastos por fornecedor:");
    Object.entries(porFornecedor)
      .sort(([, a], [, b]) => b.total - a.total)
      .slice(0, 20)
      .forEach(([s, d]) => {
        parts.push(`- ${s}: ${d.count} pedidos, ${formatBRL(d.total)}, Ticket médio: ${formatBRL(d.total / d.count)}`);
      });

    // Total geral
    const totalPedidos = context.orders.reduce((s: number, o: any) => s + (o.total_value || 0), 0);
    parts.push(`\n💰 Total geral pedidos: ${formatBRL(totalPedidos)}`);

    // Listar todos os pedidos individuais (para buscas por data)
    parts.push("\nTodos os pedidos:");
    context.orders
      .sort((a: any, b: any) => new Date(a.order_date).getTime() - new Date(b.order_date).getTime())
      .forEach((o: any) => {
        const date = new Date(o.order_date).toLocaleDateString("pt-BR");
        parts.push(`- ${date}: ${o.supplier_name}, ${formatBRL(o.total_value || 0)}, Status: ${o.status}`);
      });
  }

  // ======== 3. ITENS DE PEDIDOS (preços de produtos) ========
  if (context.orderItems && context.orderItems.length > 0) {
    parts.push(`\n💵 ITENS DE PEDIDOS (Total: ${context.orderItems.length} itens)`);
    
    const productPrices: Record<string, { prices: number[]; quantities: number[]; dates: string[] }> = {};
    context.orderItems.forEach((item: any) => {
      const name = item.product_name || "Desconhecido";
      if (!productPrices[name]) productPrices[name] = { prices: [], quantities: [], dates: [] };
      if (item.unit_price > 0) {
        productPrices[name].prices.push(item.unit_price);
        productPrices[name].quantities.push(item.quantity || 0);
        productPrices[name].dates.push(item.created_at || "");
      }
    });

    parts.push("Preços por produto:");
    Object.entries(productPrices)
      .sort(([, a], [, b]) => {
        const ta = a.prices.reduce((s, p) => s + p, 0);
        const tb = b.prices.reduce((s, p) => s + p, 0);
        return tb - ta;
      })
      .forEach(([product, data]) => {
        const avg = data.prices.reduce((a, b) => a + b, 0) / data.prices.length;
        const min = Math.min(...data.prices);
        const max = Math.max(...data.prices);
        const totalQty = data.quantities.reduce((a, b) => a + b, 0);
        parts.push(`- ${product}: Média ${formatBRL(avg)}, Mín ${formatBRL(min)}, Máx ${formatBRL(max)}, Qtd total: ${totalQty}`);
      });
  }

  // ======== 4. OFERTAS DE FORNECEDORES EM COTAÇÕES ========
  if (context.quoteSupplierItems && context.quoteSupplierItems.length > 0) {
    parts.push(`\n🏷️ OFERTAS DE FORNECEDORES EM COTAÇÕES (Total: ${context.quoteSupplierItems.length})`);
    
    const supplierOffers: Record<string, { count: number; prices: number[] }> = {};
    context.quoteSupplierItems.forEach((item: any) => {
      const s = item.supplier_name || "Desconhecido";
      if (!supplierOffers[s]) supplierOffers[s] = { count: 0, prices: [] };
      supplierOffers[s].count++;
      const val = Number(item.valor_oferecido || item.unit_price);
      if (val > 0) supplierOffers[s].prices.push(val);
    });

    Object.entries(supplierOffers)
      .sort(([, a], [, b]) => b.count - a.count)
      .slice(0, 15)
      .forEach(([s, d]) => {
        if (d.prices.length > 0) {
          const avg = d.prices.reduce((a, b) => a + b, 0) / d.prices.length;
          parts.push(`- ${s}: ${d.count} ofertas, Preço médio: ${formatBRL(avg)}`);
        }
      });
  }

  // ======== 5. EMBALAGENS ========
  if (context.packagingOrders && context.packagingOrders.length > 0) {
    parts.push(`\n📦 PEDIDOS DE EMBALAGENS (Total: ${context.packagingOrders.length})`);
    
    const packTotals: Record<string, { count: number; total: number }> = {};
    context.packagingOrders.forEach((o: any) => {
      const s = o.supplier_name || "Desconhecido";
      if (!packTotals[s]) packTotals[s] = { count: 0, total: 0 };
      packTotals[s].count++;
      packTotals[s].total += o.total_value || 0;
    });

    Object.entries(packTotals)
      .sort(([, a], [, b]) => b.total - a.total)
      .forEach(([s, d]) => {
        parts.push(`- ${s}: ${d.count} pedidos, ${formatBRL(d.total)}`);
      });

    const totalEmb = context.packagingOrders.reduce((s: number, o: any) => s + (o.total_value || 0), 0);
    parts.push(`💰 Total embalagens: ${formatBRL(totalEmb)}`);
  }

  if (context.packagingQuotes && context.packagingQuotes.length > 0) {
    parts.push(`\n📋 COTAÇÕES DE EMBALAGENS (Total: ${context.packagingQuotes.length})`);
    context.packagingQuotes.forEach((q: any) => {
      const date = q.created_at ? new Date(q.created_at).toLocaleDateString("pt-BR") : "";
      parts.push(`- ${q.title || q.produto || "Cotação"} | Data: ${date} | Status: ${q.status || ""}`);
    });
  }

  // ======== 6. FORNECEDORES CADASTRADOS ========
  if (context.suppliers && context.suppliers.length > 0) {
    parts.push(`\n🏢 FORNECEDORES CADASTRADOS (Total: ${context.suppliers.length})`);
    context.suppliers.forEach((s: any) => {
      const name = s.name || s.nome || "Desconhecido";
      const contact = s.contact || s.contato || "";
      parts.push(`- ${name}${contact ? ` (${contact})` : ""}`);
    });
  }

  // ======== 7. PRODUTOS CADASTRADOS ========
  if (context.products && context.products.length > 0) {
    parts.push(`\n📋 PRODUTOS CADASTRADOS (Total: ${context.products.length})`);
    context.products.slice(0, 60).forEach((p: any) => {
      const name = p.name || p.nome || "Desconhecido";
      const unit = p.unit || p.unidade || "";
      const category = p.category || p.categoria || "";
      parts.push(`- ${name}${unit ? ` (${unit})` : ""}${category ? ` [${category}]` : ""}`);
    });
    if (context.products.length > 60) {
      parts.push(`... e mais ${context.products.length - 60} produtos`);
    }
  }

  // ======== 8. RESUMO FINANCEIRO GERAL ========
  const totalPedidos = (context.orders || []).reduce((s: number, o: any) => s + (o.total_value || 0), 0);
  const totalEmb = (context.packagingOrders || []).reduce((s: number, o: any) => s + (o.total_value || 0), 0);
  parts.push(`\n💰 RESUMO FINANCEIRO GERAL`);
  parts.push(`Total em pedidos gerais: ${formatBRL(totalPedidos)}`);
  parts.push(`Total em embalagens: ${formatBRL(totalEmb)}`);
  parts.push(`TOTAL GERAL: ${formatBRL(totalPedidos + totalEmb)}`);
  parts.push(`Pedidos: ${(context.orders || []).length}, Cotações: ${(context.quotes || []).length}`);
  parts.push(`Fornecedores: ${(context.suppliers || []).length}, Produtos: ${(context.products || []).length}`);

  return parts.join("\n");
}

// ==================== FUNÇÕES PÚBLICAS ====================

/** Assistente Global — Chat do Topbar */
export async function askGemini(
  userQuery: string,
  contextData: QueryContext
): Promise<string> {
  if (!genAI) {
    return "⚠️ Assistente não configurado. Verifique VITE_GEMINI_API_KEY no .env.";
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const contextStr = prepareContext(userQuery, contextData);

    const prompt = `${ASSISTANT_SYSTEM_PROMPT}

===== DADOS COMPLETOS DO SISTEMA =====
${contextStr}
===== FIM DOS DADOS =====

Pergunta do Usuário: ${userQuery}`;

    const result = await model.generateContent(prompt);
    return result.response.text() || "Desculpe, não consegui processar sua pergunta.";
  } catch (error: any) {
    console.error("[Gemini] Erro:", error);
    return `⚠️ Erro: ${error?.message || "Falha desconhecida"}`;
  }
}

/** Resumo Executivo para aba de Análise (Embalagens) */
export async function generateExecutiveSummary(
  dashboardData: any
): Promise<string> {
  if (!genAI) return "⚠️ Gemini API Key não configurada.";

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `Você é um Analista de Dados de nível C-Level (Executivo).
Abaixo estão os dados agregados de dashboard do setor de embalagens/cotações da empresa.

\`\`\`json
${JSON.stringify(dashboardData)}
\`\`\`

Sua tarefa: Fornecer um "Resumo Executivo Rápido".
Pule saudações genéricas. Crie 3 tópicos (bullet points) com os maiores "Insights". 
Aponte algo que passou despercebido. Não liste apenas números secos, interprete-os.
NÃO use markdown de títulos (###). Use apenas texto plano, bullet points e emojis.
Responda em português brasileiro.`;

    const result = await model.generateContent(prompt);
    return result.response.text() || "Nenhum resumo gerado.";
  } catch (error: any) {
    console.error("[Gemini] Erro resumo:", error);
    return `⚠️ Erro: ${error?.message || "Falha desconhecida"}`;
  }
}

/** Opção 1: Análise Inteligente da Cotação */
export async function analyzeQuoteOptions(
  quoteData: any
): Promise<string> {
  if (!genAI) return "⚠️ Gemini API Key não configurada.";

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `Você é um Comprador Profissional analisando uma Cotação.
Sua missão é olhar para a matriz de preços e sugerir a melhor decisão de compra.

DADOS DA COTAÇÃO:
\`\`\`json
${JSON.stringify(quoteData)}
\`\`\`

REGRAS:
1. Responda em 3 ou 4 parágrafos curtos, de forma DIRETA e CLARA.
2. Identifique quais fornecedores têm as melhores propostas globais.
3. Sugira se vale a pena comprar tudo de um fornecedor (por comodidade/frete) ou dividir o pedido para maximizar a economia.
4. Alerte sobre produtos que estão muito caros (se houver discrepância entre os lances).
5. NÃO invente números. Use apenas o que está no JSON.
6. Use R$ para os valores. Formate os números com ponto e vírgula separando milhares/decimais.
7. Use emojis de forma moderada 💡, 💰, ⚠️.`;

    const result = await model.generateContent(prompt);
    return result.response.text() || "Não consegui gerar a análise, tente novamente.";
  } catch (error: any) {
    console.error("[Gemini] Erro análise cotação:", error);
    return `⚠️ Erro: ${error?.message || "Falha desconhecida"}`;
  }
}

/** Opção 2: Geração de Mensagem de WhatsApp */
export async function generateWhatsAppMessage(
  sellerName: string,
  items: any[]
): Promise<string> {
  const itemList = items.map((i) => `- ${i.quantidade} ${i.unidade} de ${i.product_name || i.productName || i.produto}`).join('\n');
  
  const msg = `*COTAÇÃO*\n\nOlá *${sellerName}*, tudo bem?\nEstamos fazendo as compras da semana. Poderia nos enviar seus valores para os seguintes itens?\n\n${itemList}\n\nObrigado!`;
  
  return msg;
}
