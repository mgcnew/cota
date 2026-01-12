// Tipos para o módulo de Embalagens

export interface PackagingItem {
  id: string;
  company_id: string;
  name: string;
  category: string | null;
  description: string | null;
  reference_unit: string; // "un", "m", "m2", "pacote_kg", "pacote_quantidade"
  package_quantity: number | null; // quantidade do pacote (ex: 100 un ou 5 kg)
  created_at: string;
  updated_at: string;
}

export interface PackagingQuote {
  id: string;
  company_id: string;
  status: string;
  data_inicio: string;
  data_fim: string;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
}

export interface PackagingQuoteItem {
  id: string;
  quote_id: string;
  packaging_id: string;
  packaging_name: string;
  quantidade_necessaria: number | null;
  created_at: string;
}

export interface PackagingQuoteSupplier {
  id: string;
  quote_id: string;
  supplier_id: string;
  supplier_name: string;
  status: string;
  data_resposta: string | null;
  observacoes: string | null;
  created_at: string;
}

export interface PackagingSupplierItem {
  id: string;
  quote_id: string;
  supplier_id: string;
  packaging_id: string;
  packaging_name: string;
  valor_total: number | null;
  unidade_venda: string | null;
  quantidade_venda: number | null;
  quantidade_unidades_estimada: number | null;
  gramatura: number | null;
  dimensoes: string | null;
  custo_por_unidade: number | null;
  created_at: string;
  updated_at: string;
}

// Tipos para exibição no frontend
export interface PackagingQuoteDisplay {
  id: string;
  status: string;
  dataInicio: string;
  dataFim: string;
  observacoes: string | null;
  itens: PackagingQuoteItemDisplay[];
  fornecedores: PackagingSupplierDisplay[];
  melhorPreco: string;
  melhorFornecedor: string;
  economia: string;
}

export interface PackagingQuoteItemDisplay {
  id: string;
  packagingId: string;
  packagingName: string;
  quantidadeNecessaria: number | null;
}

export interface PackagingSupplierDisplay {
  id: string;
  supplierId: string;
  supplierName: string;
  status: "pendente" | "respondido";
  dataResposta: string | null;
  observacoes: string | null;
  itens: PackagingSupplierItemDisplay[];
  custoTotalEstimado: number;
}

export interface PackagingSupplierItemDisplay {
  id: string;
  packagingId: string;
  packagingName: string;
  valorTotal: number | null;
  unidadeVenda: string | null;
  quantidadeVenda: number | null;
  quantidadeUnidadesEstimada: number | null;
  gramatura: number | null;
  dimensoes: string | null;
  custoPorUnidade: number | null;
}

// Tipo para comparativo
export interface PackagingComparison {
  packagingId: string;
  packagingName: string;
  fornecedores: {
    supplierId: string;
    supplierName: string;
    valorTotal: number;
    unidadeVenda: string;
    quantidadeVenda: number;
    quantidadeUnidades: number;
    custoPorUnidade: number;
    gramatura: number | null;
    dimensoes: string | null;
    isMelhorPreco: boolean;
    diferencaPercentual: number;
  }[];
}

// Categorias padrão de embalagens
export const PACKAGING_CATEGORIES = [
  "Sacolas",
  "Caixas",
  "Filmes",
  "Bandejas",
  "Potes",
  "Sacos",
  "Etiquetas",
  "Fitas",
  "Outros"
] as const;

// Unidades de venda comuns
export const PACKAGING_SALE_UNITS = [
  { value: "kg", label: "Quilograma (kg)" },
  { value: "un", label: "Unidade" },
  { value: "pacote", label: "Pacote" },
  { value: "cento", label: "Cento (100 un)" },
  { value: "milheiro", label: "Milheiro (1000 un)" },
  { value: "rolo", label: "Rolo" },
  { value: "caixa", label: "Caixa" },
  { value: "m", label: "Metro" },
  { value: "m2", label: "Metro quadrado" },
] as const;

// Unidades de referência para comparação
export const PACKAGING_REFERENCE_UNITS = [
  { value: "un", label: "Unidade" },
  { value: "pacote", label: "Pacote" },
  { value: "m", label: "Metro" },
  { value: "m2", label: "Metro quadrado" },
] as const;

// Subunidades para pacote (como o pacote é medido)
export const PACKAGE_SUB_UNITS = [
  { value: "kg", label: "Por peso (kg)" },
  { value: "quantidade", label: "Por quantidade (unidades)" },
] as const;
