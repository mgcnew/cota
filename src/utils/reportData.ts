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

export const processReportData = (filters: ReportFilters) => {
  // Filtrar dados baseado nos filtros aplicados
  const filteredCotacoes = mockCotacoes.filter(cotacao => {
    const dataValida = cotacao.dataAbertura >= filters.startDate && 
                      cotacao.dataAbertura <= filters.endDate;
    const fornecedorValido = filters.fornecedores.length === 0 || 
                            filters.fornecedores.includes(cotacao.fornecedor);
    const produtoValido = filters.produtos.length === 0 || 
                         filters.produtos.includes(cotacao.produto);
    
    return dataValida && fornecedorValido && produtoValido;
  });

  // Calcular métricas baseadas nos dados filtrados
  const economiaTotal = filteredCotacoes.reduce((acc, cotacao) => acc + cotacao.economiaGerada, 0);
  const cotacoesCount = filteredCotacoes.length;
  
  return {
    economiaData: {
      ...mockEconomiaData,
      economiaGerada: economiaTotal,
      cotacoesRealizadas: cotacoesCount,
      periodo: `${filters.startDate.toLocaleDateString('pt-BR')} - ${filters.endDate.toLocaleDateString('pt-BR')}`
    },
    fornecedores: mockFornecedores,
    produtos: mockProdutos,
    cotacoes: filteredCotacoes
  };
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