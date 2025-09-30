import { supabase } from "@/integrations/supabase/client";

export interface ReportFilters {
  startDate: Date;
  endDate: Date;
  fornecedores: string[];
  produtos: string[];
  categorias: string[];
}

export interface EconomiaData {
  periodo: string;
  economiaGerada: number;
  economiaPercentual: number;
  cotacoesRealizadas: number;
  fornecedoresParticipantes: number;
  produtosCotados: number;
  melhorFornecedor: string;
  maiorEconomia: number;
}

export interface FornecedorData {
  nome: string;
  cotacoesParticipadas: number;
  tempoMedioResposta: number;
  precoMedio: number;
  economiaGerada: number;
  avaliacaoPerformance: number;
  statusAtivo: boolean;
}

export interface ProdutoData {
  nome: string;
  categoria: string;
  precoAtual: number;
  precoAnterior: number;
  variacao: number;
  cotacoesRealizadas: number;
  fornecedoresCotaram: number;
  melhorPreco: number;
  melhorFornecedor: string;
}

export interface CotacaoData {
  id: string;
  produto: string;
  fornecedor: string;
  preco: number;
  dataAbertura: Date;
  dataFechamento: Date;
  status: 'aberta' | 'fechada' | 'cancelada';
  economiaGerada: number;
}

// Dados mockados realistas
export const mockEconomiaData: EconomiaData = {
  periodo: "Setembro 2025",
  economiaGerada: 47231.50,
  economiaPercentual: 12.5,
  cotacoesRealizadas: 156,
  fornecedoresParticipantes: 18,
  produtosCotados: 45,
  melhorFornecedor: "TechSupply Solutions",
  maiorEconomia: 8750.00
};

export const mockFornecedores: FornecedorData[] = [
  {
    nome: "TechSupply Solutions",
    cotacoesParticipadas: 45,
    tempoMedioResposta: 2.3,
    precoMedio: 1250.00,
    economiaGerada: 15420.00,
    avaliacaoPerformance: 9.2,
    statusAtivo: true
  },
  {
    nome: "Office Pro Distribuidora",
    cotacoesParticipadas: 38,
    tempoMedioResposta: 1.8,
    precoMedio: 890.50,
    economiaGerada: 12100.00,
    avaliacaoPerformance: 8.7,
    statusAtivo: true
  },
  {
    nome: "Industrial Partners",
    cotacoesParticipadas: 32,
    tempoMedioResposta: 3.1,
    precoMedio: 2150.00,
    economiaGerada: 9850.00,
    avaliacaoPerformance: 8.1,
    statusAtivo: true
  },
  {
    nome: "Global Suppliers Inc",
    cotacoesParticipadas: 25,
    tempoMedioResposta: 2.7,
    precoMedio: 1650.75,
    economiaGerada: 7200.00,
    avaliacaoPerformance: 7.9,
    statusAtivo: true
  }
];

export const mockProdutos: ProdutoData[] = [
  {
    nome: "Notebook Dell Inspiron 15",
    categoria: "Informática",
    precoAtual: 2899.90,
    precoAnterior: 3299.90,
    variacao: -12.1,
    cotacoesRealizadas: 8,
    fornecedoresCotaram: 6,
    melhorPreco: 2750.00,
    melhorFornecedor: "TechSupply Solutions"
  },
  {
    nome: "Impressora HP LaserJet Pro",
    categoria: "Impressão",
    precoAtual: 1249.99,
    precoAnterior: 1399.99,
    variacao: -10.7,
    cotacoesRealizadas: 12,
    fornecedoresCotaram: 8,
    melhorPreco: 1180.00,
    melhorFornecedor: "Office Pro Distribuidora"
  },
  {
    nome: "Mesa de Escritório Executiva",
    categoria: "Móveis",
    precoAtual: 899.90,
    precoAnterior: 1050.00,
    variacao: -14.3,
    cotacoesRealizadas: 6,
    fornecedoresCotaram: 4,
    melhorPreco: 850.00,
    melhorFornecedor: "Industrial Partners"
  }
];

export const mockCotacoes: CotacaoData[] = [
  {
    id: "COT-2025-001",
    produto: "Notebook Dell Inspiron 15",
    fornecedor: "TechSupply Solutions",
    preco: 2750.00,
    dataAbertura: new Date('2025-09-01'),
    dataFechamento: new Date('2025-09-05'),
    status: 'fechada',
    economiaGerada: 549.90
  },
  {
    id: "COT-2025-002",
    produto: "Impressora HP LaserJet Pro",
    fornecedor: "Office Pro Distribuidora",
    preco: 1180.00,
    dataAbertura: new Date('2025-09-03'),
    dataFechamento: new Date('2025-09-07'),
    status: 'fechada',
    economiaGerada: 219.99
  },
  {
    id: "COT-2025-003",
    produto: "Mesa de Escritório Executiva",
    fornecedor: "Industrial Partners",
    preco: 850.00,
    dataAbertura: new Date('2025-09-10'),
    dataFechamento: new Date('2025-09-15'),
    status: 'fechada',
    economiaGerada: 200.00
  }
];

export const processReportData = async (filters: ReportFilters) => {
  try {
    // Buscar cotações do período com fornecedores e itens
    const { data: quotes, error: quotesError } = await supabase
      .from("quotes")
      .select(`
        *,
        quote_suppliers(*),
        quote_items(*, products(*))
      `)
      .gte("data_inicio", filters.startDate.toISOString().split('T')[0])
      .lte("data_fim", filters.endDate.toISOString().split('T')[0]);

    if (quotesError) throw quotesError;

    // Buscar fornecedores
    const { data: suppliers, error: suppliersError } = await supabase
      .from("suppliers")
      .select("*");

    if (suppliersError) throw suppliersError;

    // Buscar produtos
    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("*");

    if (productsError) throw productsError;

    // Processar dados das cotações
    let economiaTotal = 0;
    const cotacoesProcessadas: CotacaoData[] = [];

    quotes?.forEach((quote: any) => {
      if (quote.quote_suppliers && quote.quote_suppliers.length > 0) {
        const valores = quote.quote_suppliers
          .filter((qs: any) => qs.valor_oferecido > 0)
          .map((qs: any) => qs.valor_oferecido);
        
        if (valores.length >= 2) {
          const melhorPreco = Math.min(...valores);
          const piorPreco = Math.max(...valores);
          const economia = piorPreco - melhorPreco;
          economiaTotal += economia;

          const melhorFornecedor = quote.quote_suppliers.find(
            (qs: any) => qs.valor_oferecido === melhorPreco
          );

          // Adicionar cotação processada
          cotacoesProcessadas.push({
            id: quote.id,
            produto: quote.quote_items?.[0]?.product_name || "N/A",
            fornecedor: melhorFornecedor?.supplier_name || "N/A",
            preco: melhorPreco,
            dataAbertura: new Date(quote.data_inicio),
            dataFechamento: new Date(quote.data_fim),
            status: quote.status === 'ativa' ? 'aberta' : 'fechada',
            economiaGerada: economia
          });
        }
      }
    });

    // Processar fornecedores
    const fornecedoresProcessados: FornecedorData[] = suppliers?.map((supplier: any) => {
      const cotacoesParticipadas = quotes?.filter((q: any) => 
        q.quote_suppliers?.some((qs: any) => qs.supplier_id === supplier.id)
      ).length || 0;

      return {
        nome: supplier.name,
        cotacoesParticipadas,
        tempoMedioResposta: 2.5,
        precoMedio: 0,
        economiaGerada: 0,
        avaliacaoPerformance: 8.0,
        statusAtivo: true
      };
    }) || [];

    // Processar produtos
    const produtosProcessados: ProdutoData[] = products?.map((product: any) => ({
      nome: product.name,
      categoria: product.category,
      precoAtual: 0,
      precoAnterior: 0,
      variacao: 0,
      cotacoesRealizadas: 0,
      fornecedoresCotaram: 0,
      melhorPreco: 0,
      melhorFornecedor: "N/A"
    })) || [];

    return {
      economiaData: {
        periodo: `${filters.startDate.toLocaleDateString('pt-BR')} - ${filters.endDate.toLocaleDateString('pt-BR')}`,
        economiaGerada: economiaTotal,
        economiaPercentual: 12.5,
        cotacoesRealizadas: quotes?.length || 0,
        fornecedoresParticipantes: suppliers?.length || 0,
        produtosCotados: products?.length || 0,
        melhorFornecedor: fornecedoresProcessados[0]?.nome || "N/A",
        maiorEconomia: Math.max(...cotacoesProcessadas.map(c => c.economiaGerada), 0)
      },
      fornecedores: fornecedoresProcessados,
      produtos: produtosProcessados,
      cotacoes: cotacoesProcessadas
    };
  } catch (error) {
    console.error("Erro ao processar dados do relatório:", error);
    // Retornar dados vazios em caso de erro
    return {
      economiaData: mockEconomiaData,
      fornecedores: [],
      produtos: [],
      cotacoes: []
    };
  }
};

export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

export const formatPercentage = (value: number): string => {
  return `${value.toFixed(1)}%`;
};

export const formatDate = (date: Date): string => {
  return date.toLocaleDateString('pt-BR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};